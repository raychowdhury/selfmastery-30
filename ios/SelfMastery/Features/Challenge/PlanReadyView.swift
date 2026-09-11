import SwiftUI

/// Shown once, between onboarding and Day 1, in the Calm design: the answers
/// reflected back as quiet label-over-value rows. It deliberately does not
/// dump all 30 days on the person.
struct PlanReadyView: View {
    let challenge: ChallengeDTO
    let onBegin: () -> Void

    @State private var showingPreview = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Your next 30 days")
                    .calmHeading(26)
                    .accessibilityAddTraits(.isHeader)

                VStack(spacing: 0) {
                    SummaryRow(label: "Goal", value: challenge.goal, emphasised: true)
                    if let why = challenge.whyItMatters, !why.isEmpty {
                        SummaryRow(label: "Why it matters", value: "\u{201C}\(why)\u{201D}")
                    }
                    if let success = challenge.successDefinition, !success.isEmpty {
                        SummaryRow(label: "Day 30 success", value: success)
                    }
                    SummaryRow(label: "Time", value: "\(challenge.availableMinutes) minutes a day")
                    SummaryRow(label: "Approach", value: challenge.difficulty.capitalizedApproach)
                    SummaryRow(
                        label: "Start date",
                        value: CalendarDay(challenge.startDate)?.formattedShort() ?? challenge.startDate
                    )
                }
                .padding(.top, Theme.Spacing.xl)

                Button("See all 30 days") { showingPreview = true }
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.Palette.accent)
                    .buttonStyle(.plain)
                    .frame(minHeight: 44, alignment: .leading)
                    .padding(.top, Theme.Spacing.m)
            }
            .padding(.horizontal, 28)
            .padding(.top, Theme.Spacing.xxl)
            .padding(.bottom, Theme.Spacing.section)
        }
        .background(Theme.Palette.background)
        .navigationBarBackButtonHidden()
        .safeAreaInset(edge: .bottom, spacing: 0) {
            VStack(alignment: .leading, spacing: Theme.Spacing.m) {
                Text("Your plan is ready. One day at a time.")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.Palette.secondaryText)
                PrimaryButton(title: "Begin Day 1", action: onBegin)
            }
            .padding(.horizontal, 28)
            .padding(.top, Theme.Spacing.l)
            .padding(.bottom, Theme.Spacing.s)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background {
                ZStack {
                    Rectangle().fill(.ultraThinMaterial)
                    Theme.Palette.background.opacity(0.62)
                }
                .overlay(alignment: .top) {
                    Theme.Palette.text.opacity(0.08).frame(height: 1)
                }
                .ignoresSafeArea(edges: .bottom)
            }
        }
        .sheet(isPresented: $showingPreview) {
            MilestonePreview(challenge: challenge)
        }
    }
}

/// A Calm summary row: uppercase label over the value, closed by a fading rule.
struct SummaryRow: View {
    let label: String
    let value: String
    var emphasised = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 6) {
                Text(label.uppercased())
                    .font(.system(size: 12))
                    .tracking(1)
                    .foregroundStyle(Theme.Palette.secondaryText)
                Text(value)
                    .font(.system(size: emphasised ? 17 : 15))
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.vertical, 18)
            .frame(maxWidth: .infinity, alignment: .leading)

            CalmRule()
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(label): \(value)")
    }
}

/// Milestones rather than 30 days of detail — the point is the shape of the
/// month, not a to-do list.
struct MilestonePreview: View {
    let challenge: ChallengeDTO
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Your plan")
                    .calmHeading(20)
                    .accessibilityAddTraits(.isHeader)

                VStack(spacing: 0) {
                    ForEach(challenge.milestones) { milestone in
                        SummaryRow(
                            label: "Day \(milestone.dayNumber)",
                            value: milestone.description.map { "\(milestone.title). \($0)" }
                                ?? milestone.title
                        )
                    }
                }
                .padding(.top, Theme.Spacing.l)

                Text("Your daily actions grow gradually toward these. Week one is deliberately light.")
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.Palette.secondaryText)
                    .padding(.top, Theme.Spacing.l)

                SecondaryButton(title: "Done") { dismiss() }
                    .padding(.top, Theme.Spacing.xxl)
            }
            .padding(.horizontal, 28)
            .padding(.top, Theme.Spacing.xxl)
            .padding(.bottom, Theme.Spacing.xl)
        }
        .background(Theme.Palette.background)
        .overlay(alignment: .top) {
            Theme.Palette.accent.opacity(0.3).frame(height: 1)
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }
}

extension String {
    var capitalizedApproach: String {
        switch self {
        case "GENTLE": "Gentle. Small actions with low pressure."
        case "BALANCED": "Balanced. Steady progress without overload."
        case "CHALLENGING": "Challenging. More demanding daily actions."
        default: capitalized
        }
    }
}
