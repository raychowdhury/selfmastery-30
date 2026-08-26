import SwiftUI

/// Every weekly review, and the plan changes each one produced.
struct ReviewsScreen: View {
    @Environment(AppEnvironment.self) private var environment
    @State private var reviews: [WeeklyReviewDTO] = []
    @State private var adjustments: [AdjustmentDTO] = []
    @State private var isLoading = true
    @State private var activeWeek: Int?

    var body: some View {
        Group {
            if isLoading && reviews.isEmpty {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if reviews.isEmpty {
                EmptyStateView(
                    icon: "list.clipboard",
                    title: "No reviews yet",
                    message: "Every seven days you'll look back for two minutes, and next week's plan adjusts from what you say."
                )
            } else {
                list
            }
        }
        .background(Theme.Palette.background)
        .navigationTitle("Reviews")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .sheet(item: $activeWeek) { week in
            WeeklyReviewSheet(week: week) { Task { await load() } }
        }
    }

    private var list: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.l) {
                ForEach(reviews) { review in
                    Button {
                        if review.unlocked { activeWeek = review.weekNumber }
                    } label: {
                        VStack(alignment: .leading, spacing: Theme.Spacing.s) {
                            HStack {
                                Text("Week \(review.weekNumber)")
                                    .font(Theme.Typography.actionTitle)
                                Spacer()
                                if review.completed {
                                    Chip(text: "Reviewed", tint: Theme.Palette.accent)
                                } else if review.unlocked {
                                    Chip(text: "Ready", tint: Theme.Palette.accent, bordered: true)
                                } else {
                                    Chip(text: "Opens on day \(review.closingDay)")
                                }
                            }

                            Text(
                                review.unlocked
                                    ? "\(review.completionRate)% of this week's actions completed"
                                    : "Nothing to do yet. Keep going."
                            )
                            .font(Theme.Typography.caption)
                            .foregroundStyle(Theme.Palette.secondaryText)
                        }
                        .surfaceCard()
                    }
                    .buttonStyle(.plain)
                    .disabled(!review.unlocked)
                }

                if !adjustments.isEmpty {
                    VStack(alignment: .leading, spacing: Theme.Spacing.m) {
                        Text("Changes to your plan")
                            .font(Theme.Typography.sectionTitle)
                        Text("Every adjustment, and why. Days you've already completed are never rewritten.")
                            .font(Theme.Typography.caption)
                            .foregroundStyle(Theme.Palette.secondaryText)

                        ForEach(adjustments) { adjustment in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(adjustment.summary).font(Theme.Typography.actionTitle)
                                Text(adjustment.rationale)
                                    .font(Theme.Typography.caption)
                                    .foregroundStyle(Theme.Palette.secondaryText)
                                Text("Applied from day \(adjustment.appliedFromDay)")
                                    .font(Theme.Typography.caption)
                                    .foregroundStyle(Theme.Palette.secondaryText)
                            }
                            .surfaceCard()
                        }
                    }
                }
            }
            .padding(Theme.Spacing.l)
        }
    }

    private func load() async {
        async let reviewsResult = try? environment.api.reviews()
        async let progressResult = try? environment.api.progress()

        reviews = (await reviewsResult)?.reviews ?? []
        adjustments = (await progressResult)?.adjustments ?? []
        isLoading = false
    }
}

extension Int: @retroactive Identifiable {
    public var id: Int { self }
}
