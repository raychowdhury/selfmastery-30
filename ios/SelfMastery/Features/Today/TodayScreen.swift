import SwiftUI

/// The screen the app exists for, in the Calm design: a date, the day number,
/// the goal in one line, the actions, and nothing else competing. The fixed
/// bar at the bottom holds the day's two verbs — reduce, and finish.
struct TodayScreen: View {
    @Environment(AppEnvironment.self) private var environment
    @State private var model: TodayModel?
    @State private var showingMinimumDay = false
    @State private var showingFinish = false
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
            .toolbarVisibility(.hidden, for: .navigationBar)
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
            VStack(alignment: .leading, spacing: 0) {
                // The thin 30-day rail stays at the very top — how far into
                // the month you are is the first thing the screen answers.
                GeometryReader { proxy in
                    let fraction =
                        Double(model.dayNumber)
                        / Double(max(model.challenge?.lengthDays ?? 30, 1))
                    Capsule()
                        .fill(Theme.Palette.separator.opacity(0.45))
                        .overlay(alignment: .leading) {
                            Capsule()
                                .fill(Theme.Palette.accent)
                                .frame(width: proxy.size.width * fraction)
                        }
                }
                .frame(height: 3)
                .accessibilityLabel(
                    "Day \(model.dayNumber) of \(model.challenge?.lengthDays ?? 30)"
                )

                Text(dateLine(model: model))
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.Palette.secondaryText)
                    .padding(.top, Theme.Spacing.xl)

                Text("Day \(model.dayNumber) of \(model.challenge?.lengthDays ?? 30)")
                    .calmHeading(30)
                    .padding(.top, 6)
                    .accessibilityAddTraits(.isHeader)

                if let challenge = model.challenge {
                    GoalReminder(challenge: challenge)
                        .padding(.top, Theme.Spacing.m)
                }

                quietLink(model: model)

                Text("Keep it simple. Just show up.")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.Palette.secondaryText)
                    .padding(.top, Theme.Spacing.xxl)

                VStack(spacing: 0) {
                    ForEach(model.actions) { action in
                        ActionRow(
                            action: action,
                            isSaving: model.inFlight.contains(action.id)
                        ) {
                            Task { await model.toggle(action) }
                        }
                    }
                }
                .padding(.top, Theme.Spacing.s)

                Text(progressLabel(model: model))
                    .font(.system(size: 13.5))
                    .foregroundStyle(Theme.Palette.secondaryText)
                    .padding(.top, Theme.Spacing.l)

                if let error = model.actionError {
                    Text(error)
                        .font(Theme.Typography.caption)
                        .foregroundStyle(.red)
                        .padding(.top, Theme.Spacing.s)
                }
            }
            .padding(.horizontal, 28)
            .padding(.top, Theme.Spacing.l)
            .padding(.bottom, Theme.Spacing.section)
        }
        .refreshable { await model.load(showSpinner: false) }
        .safeAreaInset(edge: .bottom, spacing: 0) {
            todayBar(model: model)
        }
        .sheet(isPresented: $showingMinimumDay) {
            MinimumDaySheet(reductions: model.reductions) {
                Task { await model.setMinimumDay(true) }
            }
        }
        .sheet(isPresented: $showingFinish) {
            FinishDaySheet(
                initialFeeling: model.day?.reflection?.dayFeeling,
                initialNote: model.day?.reflection?.note ?? ""
            ) { feeling, note in
                if await model.finishDay(feeling: feeling, note: note) {
                    completedDay = model.dayNumber
                }
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

    /// The glass action bar fixed under the content: the quiet Minimum Day
    /// affordance and the one filled verb of the screen.
    @ViewBuilder
    private func todayBar(model: TodayModel) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.s) {
            if model.isMinimumDay {
                UnderlineButton(title: "Restore the full plan") {
                    Task { await model.setMinimumDay(false) }
                }
            } else {
                UnderlineButton(title: "Having a difficult day? Use a minimum day") {
                    showingMinimumDay = true
                }
            }
            PrimaryButton(title: "Finish day") { showingFinish = true }
        }
        .padding(.horizontal, 28)
        .padding(.top, Theme.Spacing.m)
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

    @ViewBuilder
    private func quietLink(model: TodayModel) -> some View {
        // Reachable *on* the final day, not only after it — Day 30 is the day
        // you finish. Both states are quiet text links, per the Calm design.
        if model.hasReachedFinalDay {
            NavigationLink {
                Day30Screen()
            } label: {
                Text(
                    model.isOver
                        ? "Your 30 days are complete. See how it went."
                        : "You've reached Day 30. See how it went."
                )
                .font(.system(size: 14))
                .foregroundStyle(Theme.Palette.accent)
                .frame(minHeight: 44, alignment: .leading)
            }
            .buttonStyle(.plain)
            .padding(.top, Theme.Spacing.s)
        } else if let week = model.reviewDue {
            Button { showingReview = true } label: {
                Text("Week \(week) is done. Start the review.")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.Palette.accent)
                    .frame(minHeight: 44, alignment: .leading)
            }
            .buttonStyle(.plain)
            .padding(.top, Theme.Spacing.s)
        }
    }

    private func dateLine(model: TodayModel) -> String {
        model.isMinimumDay ? "\(model.dateLabel) · Minimum day" : model.dateLabel
    }

    private func progressLabel(model: TodayModel) -> String {
        let remaining = model.completion.required - model.completion.completed
        switch remaining {
        case ..<1: return "You showed up today."
        case 1: return "One more to go."
        default: return "\(remaining) left for today."
        }
    }

    private func completedMinutes(model: TodayModel) -> Int {
        model.actions.filter(\.completed).reduce(0) { $0 + $1.estimatedMinutes }
    }
}

/// One line: an accent dot, the goal, and "View". The goal is a reminder here,
/// not the task.
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
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.Palette.text)
                    .lineLimit(1)
                Spacer(minLength: Theme.Spacing.s)
                Text("View")
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.Palette.accent)
            }
            .frame(minHeight: 44)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Your 30-day goal: \(challenge.goal)")
        .accessibilityHint("Opens your goal")
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
