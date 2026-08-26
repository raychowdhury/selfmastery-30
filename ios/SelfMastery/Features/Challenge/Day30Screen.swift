import SwiftUI

/// The end of the thirty days. The strongest moment in the app, and still
/// evidence-led: the numbers are real, and the reflection is the person's own.
struct Day30Screen: View {
    @Environment(AppEnvironment.self) private var environment
    @State private var challenge: ChallengeDTO?
    @State private var stats: StatsDTO?
    @State private var reflection = ""
    @State private var biggestChange = ""
    @State private var nextGoal = ""
    @State private var isSaving = false
    @State private var didSave = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                if let stats, let challenge {
                    header(stats: stats, challenge: challenge)
                    figures(stats: stats)
                    origin(challenge: challenge)
                    reflectionForm(challenge: challenge)
                } else {
                    ProgressView().frame(maxWidth: .infinity)
                }
            }
            .padding(Theme.Spacing.l)
        }
        .background(Theme.Palette.background)
        .navigationTitle("Day 30")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    @ViewBuilder
    private func header(stats: StatsDTO, challenge: ChallengeDTO) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.m) {
            EyebrowLabel(text: "\(challenge.lengthDays) / \(challenge.lengthDays)")
            Text("You finished what you started.")
                .font(Theme.Typography.display)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityAddTraits(.isHeader)
            Text("Thirty days ago you decided to \(challenge.goal.lowercasedFirst).")
                .font(.body)
                .foregroundStyle(Theme.Palette.secondaryText)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    @ViewBuilder
    private func figures(stats: StatsDTO) -> some View {
        LazyVGrid(
            columns: [GridItem(.flexible()), GridItem(.flexible())],
            spacing: Theme.Spacing.m
        ) {
            MetricView(value: "\(stats.activeDays)", label: "Active days").surfaceCard()
            MetricView(value: "\(stats.overallCompletion)%", label: "Overall consistency").surfaceCard()
            MetricView(value: "\(stats.actionsCompleted)", label: "Actions completed").surfaceCard()
            MetricView(value: "\(stats.perfectDays)", label: "Perfect days").surfaceCard()
            MetricView(
                value: "\(stats.longestStreak)",
                label: stats.longestStreak == 1 ? "day longest streak" : "days longest streak"
            )
            .surfaceCard()
            MetricView(value: "\(stats.minimumDays)", label: "Minimum Days").surfaceCard()
        }
    }

    @ViewBuilder
    private func origin(challenge: ChallengeDTO) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.m) {
            EyebrowLabel(text: "Where you started")
            if let why = challenge.whyItMatters, !why.isEmpty {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Day 1 — why it mattered")
                        .font(Theme.Typography.caption)
                        .foregroundStyle(Theme.Palette.secondaryText)
                    Text("“\(why)”").font(Theme.Typography.body)
                }
            }
            if let success = challenge.successDefinition, !success.isEmpty {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Day 1 — what success looked like")
                        .font(Theme.Typography.caption)
                        .foregroundStyle(Theme.Palette.secondaryText)
                    Text(success).font(Theme.Typography.body)
                }
            }
        }
        .surfaceCard()
    }

    @ViewBuilder
    private func reflectionForm(challenge: ChallengeDTO) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.l) {
            Text("What changed?")
                .font(Theme.Typography.sectionTitle)
                .accessibilityAddTraits(.isHeader)

            LabelledField(label: "Over these 30 days") {
                TextField(
                    "The walks are just part of my day now.",
                    text: $reflection,
                    axis: .vertical
                )
                .lineLimit(3...6)
            }

            LabelledField(label: "The single biggest difference") {
                TextField("", text: $biggestChange, axis: .vertical).lineLimit(2...4)
            }

            LabelledField(label: "What comes next?", hint: "Optional.") {
                TextField("", text: $nextGoal, axis: .vertical).lineLimit(2...3)
            }

            if let errorMessage {
                Text(errorMessage).font(Theme.Typography.caption).foregroundStyle(.red)
            }

            PrimaryButton(
                title: didSave ? "Start My Next 30 Days" : "Save My Reflection",
                isLoading: isSaving
            ) {
                Task {
                    if didSave {
                        environment.didFinishAndArchiveChallenge()
                    } else {
                        await save(challenge: challenge)
                    }
                }
            }
        }
    }

    private func load() async {
        async let todayResult = try? environment.api.today()
        async let progressResult = try? environment.api.progress()

        let today = await todayResult
        challenge = today?.challenge
        stats = (await progressResult)?.stats ?? today?.stats
    }

    private func save(challenge: ChallengeDTO) async {
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        do {
            try await environment.api.saveFinalReflection(
                challengeId: challenge.id,
                reflection: reflection.trimmed.isEmpty ? nil : reflection,
                biggestChange: biggestChange.trimmed.isEmpty ? nil : biggestChange,
                nextGoal: nextGoal.trimmed.isEmpty ? nil : nextGoal
            )
            didSave = true
            Haptics.dayFinished()
        } catch let error as APIError {
            errorMessage = error.userMessage
        } catch {
            errorMessage = "Couldn't save your reflection."
        }
    }
}
