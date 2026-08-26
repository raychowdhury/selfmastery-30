import SwiftUI

/// The weekly look back. What is answered here is what adjusts the days ahead,
/// and the app says so rather than changing the plan silently.
struct WeeklyReviewSheet: View {
    let week: Int
    let onComplete: () -> Void

    @Environment(AppEnvironment.self) private var environment
    @Environment(\.dismiss) private var dismiss

    @State private var wentWell = ""
    @State private var struggledWith = ""
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
        (value: "TOO_DIFFICULT", label: "Too difficult"),
    ]

    var body: some View {
        NavigationStack {
            Group {
                if let outcome {
                    result(outcome)
                } else {
                    form
                }
            }
            .background(Theme.Palette.background)
            .navigationTitle("Week \(week)")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(outcome == nil ? "Cancel" : "Done") {
                        if outcome != nil { onComplete() }
                        dismiss()
                    }
                }
            }
        }
    }

    private var form: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                Text("Before moving forward, take two minutes to look back.")
                    .font(Theme.Typography.body)
                    .foregroundStyle(Theme.Palette.secondaryText)

                LabelledField(label: "What went well?") {
                    TextField("Even small wins count here.", text: $wentWell, axis: .vertical)
                        .lineLimit(2...5)
                }

                VStack(alignment: .leading, spacing: Theme.Spacing.s) {
                    Text("What got in your way?").font(Theme.Typography.actionTitle)
                    FlowLayout(spacing: Theme.Spacing.s) {
                        ForEach(obstacleOptions, id: \.self) { option in
                            Button {
                                if obstacles.contains(option) {
                                    obstacles.remove(option)
                                } else {
                                    obstacles.insert(option)
                                }
                                Haptics.selection()
                            } label: {
                                Text(option)
                                    .font(Theme.Typography.body)
                                    .padding(.horizontal, Theme.Spacing.l)
                                    .frame(minHeight: 44)
                            }
                            .buttonStyle(.bordered)
                            .tint(obstacles.contains(option) ? Theme.Palette.accent : Theme.Palette.secondaryText)
                            .accessibilityAddTraits(
                                obstacles.contains(option) ? [.isButton, .isSelected] : .isButton
                            )
                        }
                    }
                }

                VStack(alignment: .leading, spacing: Theme.Spacing.s) {
                    Text("How did the plan feel?").font(Theme.Typography.actionTitle)
                    Picker("How did the plan feel?", selection: $difficulty) {
                        ForEach(difficulties, id: \.value) { option in
                            Text(option.label).tag(option.value)
                        }
                    }
                    .pickerStyle(.segmented)
                    Text("This is what adjusts next week. Nothing you've already completed changes.")
                        .font(Theme.Typography.caption)
                        .foregroundStyle(Theme.Palette.secondaryText)
                }

                LabelledField(label: "What should change next week?", hint: "One adjustment is enough.") {
                    TextField("", text: $nextWeekChange, axis: .vertical)
                        .lineLimit(2...4)
                }

                if let errorMessage {
                    Text(errorMessage).font(Theme.Typography.caption).foregroundStyle(.red)
                }

                PrimaryButton(title: "Prepare Next Week", isLoading: isSaving) {
                    Task { await submit() }
                }
            }
            .padding(Theme.Spacing.l)
        }
    }

    /// The adjustment is shown with its reasoning: the plan changing without
    /// explanation is how people stop trusting it.
    private func result(_ adjustment: ReviewSubmissionResponse.Adjustment) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.l) {
            Spacer()
            EyebrowLabel(text: "Next week")
            Text(adjustment.summary)
                .font(Theme.Typography.title)
                .fixedSize(horizontal: false, vertical: true)
            Text(adjustment.rationale)
                .font(.body)
                .foregroundStyle(Theme.Palette.secondaryText)
                .fixedSize(horizontal: false, vertical: true)
            Spacer()
            PrimaryButton(title: "Done") {
                onComplete()
                dismiss()
            }
        }
        .padding(Theme.Spacing.xl)
    }

    private func submit() async {
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        do {
            let response = try await environment.api.submitReview(
                week: week,
                wentWell: wentWell.trimmed.isEmpty ? nil : wentWell,
                struggledWith: struggledWith.trimmed.isEmpty ? nil : struggledWith,
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
