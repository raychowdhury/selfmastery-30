import SwiftUI

/// Entry point when someone is signed in but has no active challenge.
struct StartChallengeView: View {
    @Environment(AppEnvironment.self) private var environment
    @State private var isStarting = false

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: Theme.Spacing.l) {
                Spacer()

                ProgressRingMark()
                    .frame(width: 48, height: 48)
                    .accessibilityHidden(true)

                Text("Choose your next 30 days.")
                    .font(Theme.Typography.display)
                    .fixedSize(horizontal: false, vertical: true)

                Text("One goal, turned into small daily actions. It takes about two minutes to set up.")
                    .font(.body)
                    .foregroundStyle(Theme.Palette.secondaryText)
                    .fixedSize(horizontal: false, vertical: true)

                Spacer()

                PrimaryButton(title: "Start My 30 Days") { isStarting = true }
            }
            .padding(Theme.Spacing.xl)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.Palette.background)
            .fullScreenCover(isPresented: $isStarting) {
                OnboardingView()
            }
        }
    }
}

/// One question per screen, with a progress bar and no giant form.
struct OnboardingView: View {
    @Environment(AppEnvironment.self) private var environment
    @Environment(\.dismiss) private var dismiss

    @State private var model: OnboardingModel?
    @State private var createdChallenge: ChallengeDTO?

    var body: some View {
        NavigationStack {
            Group {
                if let model {
                    if model.isLoading {
                        ProgressView().controlSize(.large)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                    } else if let error = model.loadError {
                        ErrorStateView(message: error) {
                            Task { await model.load() }
                        }
                    } else {
                        content(model: model)
                    }
                } else {
                    ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .background(Theme.Palette.background)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .navigationDestination(item: $createdChallenge) { challenge in
                PlanReadyView(challenge: challenge) {
                    environment.didCreateChallenge()
                }
            }
        }
        .task {
            if model == nil {
                let created = OnboardingModel(api: environment.api)
                model = created
                await created.load()
            }
        }
    }

    @ViewBuilder
    private func content(model: OnboardingModel) -> some View {
        VStack(spacing: 0) {
            OnboardingProgressBar(
                progress: model.progress,
                step: model.stepNumber,
                total: model.stepCount
            )
            .padding(.horizontal, Theme.Spacing.xl)
            .padding(.bottom, Theme.Spacing.l)

            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                    VStack(alignment: .leading, spacing: Theme.Spacing.s) {
                        Text(model.step.title)
                            .font(Theme.Typography.title)
                            .fixedSize(horizontal: false, vertical: true)
                            .accessibilityAddTraits(.isHeader)

                        if let subtitle = model.step.subtitle {
                            Text(subtitle)
                                .font(Theme.Typography.body)
                                .foregroundStyle(Theme.Palette.secondaryText)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }

                    OnboardingStepContent(model: model)

                    if let error = model.submitError {
                        Text(error)
                            .font(Theme.Typography.caption)
                            .foregroundStyle(.red)
                    }
                }
                .padding(.horizontal, Theme.Spacing.xl)
                .padding(.bottom, Theme.Spacing.xxl)
                // Re-announce the question when the step changes so VoiceOver
                // does not leave the user on the previous one.
                .id(model.step)
            }

            VStack(spacing: Theme.Spacing.s) {
                PrimaryButton(
                    title: model.isFinalStep ? "Build My Plan" : "Continue",
                    isLoading: model.isSubmitting,
                    isEnabled: model.canAdvance
                ) {
                    if model.isFinalStep {
                        Task {
                            if let challenge = await model.submit() {
                                createdChallenge = challenge
                            }
                        }
                    } else {
                        withAnimation { model.advance() }
                    }
                }

                Button("Back") {
                    if !model.goBack() { dismiss() }
                }
                .font(Theme.Typography.caption)
                .foregroundStyle(Theme.Palette.secondaryText)
            }
            .padding(.horizontal, Theme.Spacing.xl)
            .padding(.bottom, Theme.Spacing.l)
        }
    }
}

struct OnboardingProgressBar: View {
    let progress: Double
    let step: Int
    let total: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("Step \(step) of \(total)")
                    .font(Theme.Typography.caption)
                    .foregroundStyle(Theme.Palette.secondaryText)
                Spacer()
            }
            ProgressView(value: progress)
                .tint(Theme.Palette.accent)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Step \(step) of \(total)")
    }
}

#Preview {
    StartChallengeView().environment(AppEnvironment())
}
