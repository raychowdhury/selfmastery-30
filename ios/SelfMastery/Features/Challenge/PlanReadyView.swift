import SwiftUI

/// Shown once, between onboarding and Day 1. It reflects the answers back and
/// deliberately does not dump all 30 days on the person.
struct PlanReadyView: View {
    let challenge: ChallengeDTO
    let onBegin: () -> Void

    @State private var showingPreview = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                Text("Your next 30 days")
                    .font(Theme.Typography.title)
                    .accessibilityAddTraits(.isHeader)

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
                        label: "Start date",
                        value: CalendarDay(challenge.startDate)?.formattedShort() ?? challenge.startDate
                    )
                }

                VStack(alignment: .leading, spacing: Theme.Spacing.s) {
                    EyebrowLabel(text: "What this is built from")
                    HStack(spacing: Theme.Spacing.s) {
                        ForEach(challenge.pillars) { pillar in
                            Chip(text: pillar.name, tint: Theme.Palette.accent, bordered: true)
                        }
                    }
                }

                VStack(spacing: Theme.Spacing.m) {
                    Text("Your plan is ready.")
                        .font(Theme.Typography.sectionTitle)
                    Text("Thirty days of small actions, starting with today. One day at a time.")
                        .font(Theme.Typography.body)
                        .foregroundStyle(Theme.Palette.secondaryText)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.top, Theme.Spacing.l)

                VStack(spacing: Theme.Spacing.s) {
                    PrimaryButton(title: "Begin Day 1", action: onBegin)
                    Button("Preview Plan") { showingPreview = true }
                        .font(Theme.Typography.caption)
                }
            }
            .padding(Theme.Spacing.xl)
        }
        .background(Theme.Palette.background)
        .navigationBarBackButtonHidden()
        .sheet(isPresented: $showingPreview) {
            MilestonePreview(challenge: challenge)
        }
    }
}

struct SummaryRow: View {
    let label: String
    let value: String
    var emphasised = false

    var body: some View {
        HStack(alignment: .top, spacing: Theme.Spacing.l) {
            Text(label.uppercased())
                .font(Theme.Typography.eyebrow)
                .foregroundStyle(Theme.Palette.secondaryText)
                .frame(width: 110, alignment: .leading)

            Text(value)
                .font(emphasised ? Theme.Typography.actionTitle : Theme.Typography.body)
                .frame(maxWidth: .infinity, alignment: .leading)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.vertical, Theme.Spacing.m)
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
        NavigationStack {
            List {
                Section {
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
                        .padding(.vertical, 4)
                    }
                } footer: {
                    Text("Your daily actions grow gradually toward these. Week one is deliberately light.")
                }
            }
            .navigationTitle("Your plan")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

extension String {
    var capitalizedApproach: String {
        switch self {
        case "GENTLE": "Gentle — small actions with low pressure"
        case "BALANCED": "Balanced — steady progress without overload"
        case "CHALLENGING": "Challenging — more demanding daily actions"
        default: capitalized
        }
    }
}
