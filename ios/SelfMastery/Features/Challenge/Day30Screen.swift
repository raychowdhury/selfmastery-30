import SwiftUI

/// The end of the thirty days, in the Calm design. The strongest moment in
/// the app, and still evidence-led: the record grid is real data, and the
/// reflection is the person's own.
struct Day30Screen: View {
    @Environment(AppEnvironment.self) private var environment
    @State private var challenge: ChallengeDTO?
    @State private var stats: StatsDTO?
    @State private var days: [CalendarDayDTO] = []
    @State private var reflection = ""
    @State private var biggestChange = ""
    @State private var nextGoal = ""
    @State private var isSaving = false
    @State private var didSave = false
    @State private var errorMessage: String?

    private let dotColumns = Array(repeating: GridItem(.flexible(), spacing: 10), count: 10)

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                if let stats, let challenge {
                    header(challenge: challenge)
                    record(stats: stats)
                    origin(challenge: challenge)
                    reflectionForm(challenge: challenge)
                } else {
                    ProgressView().frame(maxWidth: .infinity)
                }
            }
            .padding(.horizontal, 28)
            .padding(.top, Theme.Spacing.xl)
            .padding(.bottom, Theme.Spacing.section)
        }
        .background(Theme.Palette.background)
        .toolbarVisibility(.hidden, for: .navigationBar)
        .task { await load() }
    }

    @ViewBuilder
    private func header(challenge: ChallengeDTO) -> some View {
        Text("\(challenge.lengthDays) OF \(challenge.lengthDays)")
            .font(.system(size: 12))
            .tracking(1.6)
            .foregroundStyle(Theme.Palette.secondaryText)

        Text("You finished what you started.")
            .calmHeading(32)
            .fixedSize(horizontal: false, vertical: true)
            .padding(.top, Theme.Spacing.l)
            .accessibilityAddTraits(.isHeader)

        Text("Thirty days ago you decided to \(challenge.goal.lowercasedFirst).")
            .font(.system(size: 15))
            .foregroundStyle(Theme.Palette.secondaryText)
            .fixedSize(horizontal: false, vertical: true)
            .padding(.top, Theme.Spacing.m)
    }

    @ViewBuilder
    private func record(stats: StatsDTO) -> some View {
        if !days.isEmpty {
            LazyVGrid(columns: dotColumns, spacing: 10) {
                ForEach(days) { day in
                    let active = day.percent > 0 && day.dayState != .future
                    Circle()
                        .strokeBorder(
                            active ? Theme.Palette.accent : Theme.Palette.text.opacity(0.3),
                            lineWidth: 1
                        )
                        .background(Circle().fill(active ? Theme.Palette.accent : .clear))
                        .frame(width: 10, height: 10)
                }
            }
            .padding(.top, Theme.Spacing.section)
            .accessibilityHidden(true)
        }

        Text("\(stats.activeDays) active days · \(stats.longestStreak) in a row at most")
            .font(.system(size: 13))
            .foregroundStyle(Theme.Palette.secondaryText)
            .padding(.top, Theme.Spacing.m)
            .accessibilityLabel(
                "\(stats.activeDays) active days, longest streak \(stats.longestStreak) days"
            )
    }

    @ViewBuilder
    private func origin(challenge: ChallengeDTO) -> some View {
        VStack(spacing: 0) {
            if let why = challenge.whyItMatters, !why.isEmpty {
                SummaryRow(label: "Day 1", value: "\u{201C}\(why)\u{201D}")
            }
            if let success = challenge.successDefinition, !success.isEmpty {
                SummaryRow(label: "Day 30 was meant to look like", value: success)
            }
        }
        .padding(.top, Theme.Spacing.xxl)
    }

    @ViewBuilder
    private func reflectionForm(challenge: ChallengeDTO) -> some View {
        Text("What changed?")
            .font(.system(size: 15))
            .padding(.top, Theme.Spacing.xxl)

        CalmTextArea(
            placeholder: "The walks are just part of my day now.",
            text: $reflection,
            label: "What changed over these 30 days"
        )
        .padding(.top, Theme.Spacing.m)

        Text("The single biggest difference")
            .font(.system(size: 15))
            .padding(.top, Theme.Spacing.xl)

        CalmTextArea(
            placeholder: "",
            text: $biggestChange,
            label: "The single biggest difference"
        )
        .padding(.top, Theme.Spacing.m)

        Text("What comes next? Optional.")
            .font(.system(size: 15))
            .padding(.top, Theme.Spacing.xl)

        CalmTextArea(placeholder: "", text: $nextGoal, label: "What comes next")
            .padding(.top, Theme.Spacing.m)

        if let errorMessage {
            Text(errorMessage)
                .font(Theme.Typography.caption)
                .foregroundStyle(.red)
                .padding(.top, Theme.Spacing.s)
        }

        PrimaryButton(
            title: didSave ? "Start my next 30 days" : "Save my reflection",
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
        .padding(.top, Theme.Spacing.xxl)
    }

    private func load() async {
        async let todayResult = try? environment.api.today()
        async let progressResult = try? environment.api.progress()

        let today = await todayResult
        let progress = await progressResult
        challenge = today?.challenge
        stats = progress?.stats ?? today?.stats
        days = progress?.days ?? []
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
