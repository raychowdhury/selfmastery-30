import SwiftUI

/// "My Goal" — the whole shape of the challenge in one place.
struct ChallengeDetailScreen: View {
    let challenge: ChallengeDTO

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                VStack(spacing: 0) {
                    SummaryRow(label: "Goal", value: challenge.goal, emphasised: true)
                    if let why = challenge.whyItMatters, !why.isEmpty {
                        Divider()
                        SummaryRow(label: "Why it matters", value: "“\(why)”")
                    }
                    if let success = challenge.successDefinition, !success.isEmpty {
                        Divider()
                        SummaryRow(label: "Day 30 success", value: success)
                    }
                    Divider()
                    SummaryRow(label: "Daily time", value: challenge.availableMinutes.formattedMinutes)
                    Divider()
                    SummaryRow(label: "Approach", value: challenge.difficulty.capitalizedApproach)
                    Divider()
                    SummaryRow(
                        label: "Dates",
                        value: "\(CalendarDay(challenge.startDate)?.formattedShort() ?? "") — \(CalendarDay(challenge.endDate)?.formattedShort() ?? "")"
                    )
                }

                VStack(alignment: .leading, spacing: Theme.Spacing.s) {
                    EyebrowLabel(text: "Built from")
                    FlowLayout(spacing: Theme.Spacing.s) {
                        ForEach(challenge.pillars) { pillar in
                            Chip(text: pillar.name, tint: Theme.Palette.accent, bordered: true)
                        }
                    }
                }

                VStack(alignment: .leading, spacing: Theme.Spacing.m) {
                    Text("Milestones")
                        .font(Theme.Typography.sectionTitle)
                        .accessibilityAddTraits(.isHeader)

                    ForEach(challenge.milestones) { milestone in
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Day \(milestone.dayNumber)")
                                .font(Theme.Typography.eyebrow)
                                .foregroundStyle(Theme.Palette.accent)
                            Text(milestone.title).font(Theme.Typography.actionTitle)
                            if let description = milestone.description {
                                Text(description)
                                    .font(Theme.Typography.caption)
                                    .foregroundStyle(Theme.Palette.secondaryText)
                            }
                        }
                        .surfaceCard()
                    }
                }
            }
            .padding(Theme.Spacing.l)
        }
        .background(Theme.Palette.background)
        .navigationTitle("My Goal")
        .navigationBarTitleDisplayMode(.inline)
    }
}
