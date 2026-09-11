import SwiftUI

/// The weekly look back, in the Calm design. What is answered here is what
/// adjusts the days ahead, and the app says so rather than changing the plan
/// silently.
struct WeeklyReviewSheet: View {
    let week: Int
    let onComplete: () -> Void

    @Environment(AppEnvironment.self) private var environment
    @Environment(\.dismiss) private var dismiss

    @State private var wentWell = ""
    @State private var obstacles: Set<String> = []
    @State private var difficulty = "ABOUT_RIGHT"
    @State private var nextWeekChange = ""
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var outcome: ReviewSubmissionResponse.Adjustment?

    private let obstacleOptions = [
        "Time", "Motivation", "Phone", "Work", "Family", "Energy", "Other",
    ]
    private let difficulties = [
        (value: "TOO_EASY", label: "Too easy"),
        (value: "ABOUT_RIGHT", label: "About right"),
        (value: "TOO_DIFFICULT", label: "Too hard"),
    ]

    var body: some View {
        Group {
            if let outcome {
                result(outcome)
            } else {
                form
            }
        }
        .background(Theme.Palette.background)
        .overlay(alignment: .top) {
            Theme.Palette.accent.opacity(0.3).frame(height: 1)
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    private var form: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Week \(week).")
                    .calmHeading(26)
                    .accessibilityAddTraits(.isHeader)

                Text("Two minutes to look back.")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.Palette.secondaryText)
                    .padding(.top, Theme.Spacing.s)

                Text("What went well?")
                    .font(.system(size: 15))
                    .padding(.top, Theme.Spacing.xxl)

                CalmTextArea(
                    placeholder: "Small wins count.",
                    text: $wentWell,
                    label: "What went well"
                )
                .padding(.top, Theme.Spacing.m)

                Text("What got in your way?")
                    .font(.system(size: 15))
                    .padding(.top, Theme.Spacing.xl)

                FlowLayout(spacing: Theme.Spacing.s) {
                    ForEach(obstacleOptions, id: \.self) { option in
                        CalmChip(
                            label: option,
                            selected: obstacles.contains(option)
                        ) {
                            if obstacles.contains(option) {
                                obstacles.remove(option)
                            } else {
                                obstacles.insert(option)
                            }
                            Haptics.selection()
                        }
                    }
                }
                .padding(.top, Theme.Spacing.m)

                Text("How did the difficulty feel?")
                    .font(.system(size: 15))
                    .padding(.top, Theme.Spacing.xl)

                FlowLayout(spacing: Theme.Spacing.s) {
                    ForEach(difficulties, id: \.value) { option in
                        CalmChip(
                            label: option.label,
                            selected: difficulty == option.value
                        ) {
                            difficulty = option.value
                            Haptics.selection()
                        }
                    }
                }
                .padding(.top, Theme.Spacing.m)

                Text("What should change next week?")
                    .font(.system(size: 15))
                    .padding(.top, Theme.Spacing.xl)

                CalmTextArea(
                    placeholder: "One adjustment is enough. Optional.",
                    text: $nextWeekChange,
                    label: "What should change next week"
                )
                .padding(.top, Theme.Spacing.m)

                Text("This is what adjusts next week. Nothing you've already completed changes.")
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.Palette.secondaryText)
                    .padding(.top, Theme.Spacing.l)

                if let errorMessage {
                    Text(errorMessage)
                        .font(Theme.Typography.caption)
                        .foregroundStyle(.red)
                        .padding(.top, Theme.Spacing.s)
                }

                VStack(spacing: Theme.Spacing.s) {
                    PrimaryButton(title: "Prepare week \(week + 1)", isLoading: isSaving) {
                        Task { await submit() }
                    }
                    SecondaryButton(title: "Not yet") { dismiss() }
                }
                .padding(.top, Theme.Spacing.xxl)
            }
            .padding(.horizontal, 28)
            .padding(.top, Theme.Spacing.xxl)
            .padding(.bottom, Theme.Spacing.xl)
        }
    }

    /// The adjustment is shown with its reasoning: the plan changing without
    /// explanation is how people stop trusting it.
    private func result(_ adjustment: ReviewSubmissionResponse.Adjustment) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Spacer()
            Text("NEXT WEEK")
                .font(.system(size: 12))
                .tracking(1.4)
                .foregroundStyle(Theme.Palette.accent)
            Text(adjustment.summary)
                .calmHeading(24)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, Theme.Spacing.m)
            Text(adjustment.rationale)
                .font(.system(size: 15))
                .foregroundStyle(Theme.Palette.secondaryText)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, Theme.Spacing.m)
            Spacer()
            PrimaryButton(title: "Done") {
                onComplete()
                dismiss()
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 28)
        .padding(.vertical, Theme.Spacing.xl)
    }

    private func submit() async {
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        do {
            let response = try await environment.api.submitReview(
                week: week,
                wentWell: wentWell.trimmed.isEmpty ? nil : wentWell,
                struggledWith: nil,
                obstacles: Array(obstacles),
                difficulty: difficulty,
                nextWeekChange: nextWeekChange.trimmed.isEmpty ? nil : nextWeekChange
            )
            outcome = response.adjustment
            Haptics.dayFinished()
        } catch let error as APIError {
            errorMessage = error.userMessage
            await environment.handle(error)
        } catch {
            errorMessage = "Couldn't save your review."
        }
    }
}

/// The Calm selection chip: rounded 14, selection carried by border and text
/// strength together, never colour alone (the trait says so too).
struct CalmChip: View {
    let label: String
    let selected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 14))
                .foregroundStyle(
                    selected ? Theme.Palette.text : Theme.Palette.text.opacity(0.6)
                )
                .padding(.horizontal, Theme.Spacing.l)
                .frame(minHeight: 44)
                .background {
                    RoundedRectangle(cornerRadius: 14)
                        .strokeBorder(
                            selected ? Theme.Palette.text : Theme.Palette.separator,
                            lineWidth: 1
                        )
                }
                .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(selected ? [.isButton, .isSelected] : .isButton)
    }
}

/// The Calm multiline input.
struct CalmTextArea: View {
    let placeholder: String
    @Binding var text: String
    var label: String

    var body: some View {
        TextField(placeholder, text: $text, axis: .vertical)
            .lineLimit(3...6)
            .font(.system(size: 14))
            .padding(Theme.Spacing.m)
            .background {
                RoundedRectangle(cornerRadius: 14)
                    .fill(Theme.Palette.surface)
                    .strokeBorder(Theme.Palette.separator, lineWidth: 1)
            }
            .accessibilityLabel(label)
    }
}
