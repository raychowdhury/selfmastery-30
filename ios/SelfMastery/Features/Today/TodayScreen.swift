import SwiftUI

/// The screen the app exists for. Everything else is secondary.
struct TodayScreen: View {
    @Environment(AppEnvironment.self) private var environment
    @State private var model: TodayModel?
    @State private var showingMinimumDay = false
    @State private var showingReview = false
    @State private var completedDay: Int?

    var body: some View {
        NavigationStack {
            Group {
                if let model {
                    switch model.loadState {
                    case .loading:
                        ProgressView().controlSize(.large)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                    case .empty:
                        EmptyStateView(
                            icon: "target",
                            title: "No challenge running",
                            message: "Pick one thing to change over the next 30 days."
                        )
                    case .failed(let message):
                        ErrorStateView(message: message) {
                            Task { await model.load() }
                        }
                    case .loaded:
                        content(model: model)
                    }
                } else {
                    ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .background(Theme.Palette.background)
            .navigationTitle("Today")
            .navigationBarTitleDisplayMode(.inline)
        }
        .task {
            if model == nil {
                model = TodayModel(api: environment.api, environment: environment)
            }
            await model?.load()
        }
    }

    @ViewBuilder
    private func content(model: TodayModel) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                header(model: model)

                // Reachable *on* the final day, not only after it. Day 30 is
                // the day you finish; making someone wait until day 31 to see
                // how it went would be an odd way to end a 30-day challenge.
                if model.hasReachedFinalDay {
                    NavigationLink {
                        Day30Screen()
                    } label: {
                        BannerRow(
                            text: model.isOver
                                ? "Your 30 days are complete. There's one last thing worth doing."
                                : "You've reached Day 30. There's one last thing worth doing.",
                            actionLabel: "See how it went"
                        )
                    }
                    .buttonStyle(.plain)
                } else if let week = model.reviewDue {
                    Button { showingReview = true } label: {
                        BannerRow(
                            text: "Week \(week) is done. Two minutes of looking back shapes next week.",
                            actionLabel: "Start the review"
                        )
                    }
                    .buttonStyle(.plain)
                }

                if let challenge = model.challenge {
                    GoalReminder(challenge: challenge)
                }

                actionsSection(model: model)

                if let priority = model.topPriority {
                    VStack(alignment: .leading, spacing: Theme.Spacing.s) {
                        EyebrowLabel(text: "Top priority")
                        Text(priority.text).font(Theme.Typography.actionTitle)
                    }
                    .surfaceCard()
                }

                DailyProgressCard(
                    completion: model.completion,
                    remainingLabel: model.remainingLabel
                )

                minimumDayRow(model: model)

                PrioritiesSection(
                    priorities: model.day?.priorities ?? []
                ) { updated in
                    Task { await model.savePriorities(updated) }
                }

                Divider()

                FinishDaySection(
                    initialFeeling: model.day?.reflection?.dayFeeling,
                    initialNote: model.day?.reflection?.note ?? ""
                ) { feeling, note in
                    if await model.finishDay(feeling: feeling, note: note) {
                        completedDay = model.dayNumber
                    }
                }

                if let error = model.actionError {
                    Text(error)
                        .font(Theme.Typography.caption)
                        .foregroundStyle(.red)
                }
            }
            .padding(Theme.Spacing.l)
        }
        .refreshable { await model.load(showSpinner: false) }
        .sheet(isPresented: $showingMinimumDay) {
            MinimumDaySheet(preview: model.minimumPreview) {
                Task { await model.setMinimumDay(true) }
            }
        }
        .sheet(isPresented: $showingReview) {
            if let week = model.reviewDue {
                WeeklyReviewSheet(week: week) {
                    Task { await model.load(showSpinner: false) }
                }
            }
        }
        .navigationDestination(item: $completedDay) { day in
            DayCompleteView(
                dayNumber: day,
                completion: model.completion,
                minutes: completedMinutes(model: model),
                streak: model.stats?.currentStreak ?? 0
            )
        }
    }

    private func completedMinutes(model: TodayModel) -> Int {
        model.actions.filter(\.completed).reduce(0) { $0 + $1.estimatedMinutes }
    }

    @ViewBuilder
    private func header(model: TodayModel) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.s) {
            Text(model.dateLabel)
                .font(Theme.Typography.caption)
                .foregroundStyle(Theme.Palette.secondaryText)

            HStack(alignment: .firstTextBaseline, spacing: Theme.Spacing.m) {
                Text("Day \(model.dayNumber) of \(model.challenge?.lengthDays ?? 30)")
                    .font(Theme.Typography.display)
                    .accessibilityAddTraits(.isHeader)

                if !model.phaseLabel.isEmpty {
                    Chip(text: model.phaseLabel, tint: Theme.Palette.accent)
                }
            }

            if model.isMinimumDay {
                Chip(text: "Minimum Day", tint: Theme.Palette.secondaryText)
            }

            ProgressView(
                value: Double(model.dayNumber),
                total: Double(model.challenge?.lengthDays ?? 30)
            )
            .tint(Theme.Palette.accent)
            .padding(.top, Theme.Spacing.xs)
            .accessibilityLabel("Day \(model.dayNumber) of \(model.challenge?.lengthDays ?? 30)")
        }
    }

    @ViewBuilder
    private func actionsSection(model: TodayModel) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.m) {
            // The nav bar already says "Today"; repeating it as a section
            // heading was one of the floating words. The quiet line stays.
            Text("Keep it simple. Just show up.")
                .font(Theme.Typography.body)
                .foregroundStyle(Theme.Palette.secondaryText)

            VStack(spacing: 0) {
                ForEach(model.actions) { action in
                    ActionRow(
                        action: action,
                        isSaving: model.inFlight.contains(action.id)
                    ) {
                        Task { await model.toggle(action) }
                    }
                    if action.id != model.actions.last?.id {
                        Divider().padding(.leading, Theme.Spacing.xxl)
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func minimumDayRow(model: TodayModel) -> some View {
        if model.isMinimumDay {
            HStack(spacing: Theme.Spacing.s) {
                Text("Today is a Minimum Day — the smallest version still counts.")
                    .font(Theme.Typography.caption)
                    .foregroundStyle(Theme.Palette.secondaryText)
                Button("Restore full plan") {
                    Task { await model.setMinimumDay(false) }
                }
                .font(Theme.Typography.caption)
            }
        } else {
            HStack(spacing: Theme.Spacing.s) {
                Text("Having a difficult day?")
                    .font(Theme.Typography.caption)
                    .foregroundStyle(Theme.Palette.secondaryText)
                Button("Use Minimum Day") { showingMinimumDay = true }
                    .font(Theme.Typography.caption)
            }
        }
    }
}

struct BannerRow: View {
    let text: String
    let actionLabel: String

    var body: some View {
        HStack(spacing: Theme.Spacing.m) {
            VStack(alignment: .leading, spacing: 2) {
                Text(text)
                    .font(Theme.Typography.body)
                    .foregroundStyle(Theme.Palette.text)
                    .multilineTextAlignment(.leading)
                Text(actionLabel)
                    .font(Theme.Typography.caption)
                    .foregroundStyle(Theme.Palette.accent)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.footnote)
                .foregroundStyle(Theme.Palette.secondaryText)
        }
        .surfaceCard()
    }
}

/// One line, per the prototype's mobile take: an accent dot, the goal, and
/// "View". The full card belongs to wide layouts; on a phone it pushed
/// today's actions below the fold, and the goal is a reminder, not the task.
struct GoalReminder: View {
    let challenge: ChallengeDTO

    var body: some View {
        NavigationLink {
            ChallengeDetailScreen(challenge: challenge)
        } label: {
            HStack(spacing: Theme.Spacing.s) {
                Circle()
                    .fill(Theme.Palette.accent)
                    .frame(width: 5, height: 5)
                Text(challenge.goal)
                    .font(Theme.Typography.body)
                    .foregroundStyle(Theme.Palette.text)
                    .lineLimit(1)
                Spacer(minLength: Theme.Spacing.s)
                Text("View")
                    .font(Theme.Typography.caption)
                    .foregroundStyle(Theme.Palette.accent)
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Your 30-day goal: \(challenge.goal)")
        .accessibilityHint("Opens your goal")
    }
}

struct DailyProgressCard: View {
    let completion: CompletionDTO
    let remainingLabel: String

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.s) {
            HStack(alignment: .firstTextBaseline) {
                EyebrowLabel(text: "Today's progress", color: Theme.Palette.secondaryText)
                Spacer()
                Text(
                    completion.percent == 100
                        ? "Complete"
                        : "\(completion.completed) of \(completion.required)"
                )
                .font(Theme.Typography.actionTitle)
            }

            ProgressView(value: Double(completion.percent), total: 100)
                .tint(Theme.Palette.accent)

            Text(completion.percent == 100 ? "You showed up." : remainingLabel)
                .font(Theme.Typography.caption)
                .foregroundStyle(Theme.Palette.secondaryText)
        }
        .surfaceCard()
        .accessibilityElement(children: .combine)
        .accessibilityLabel(
            "Today's progress: \(completion.completed) of \(completion.required) actions complete"
        )
    }
}

extension String {
    /// Lowercases the first letter so a sentence can be joined onto "Because ".
    ///
    /// Leaves it alone when doing so would be wrong: an acronym ("NHS advice"),
    /// or a single-letter first word — which is almost always the pronoun "I",
    /// and "Because i want more energy" reads as a typo.
    var lowercasedFirst: String {
        guard let first, first.isUppercase else { return self }

        let rest = dropFirst()
        if rest.first?.isUppercase == true { return self }
        if rest.first == " " || rest.isEmpty { return self }

        return first.lowercased() + rest
    }
}
