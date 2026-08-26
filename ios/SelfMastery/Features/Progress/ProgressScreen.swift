import SwiftUI
import Charts

/// Consistency, at a glance. Deliberately not an analytics dashboard: one
/// headline number, four counts, one chart, and only insights the data supports.
struct ProgressScreen: View {
    @Environment(AppEnvironment.self) private var environment
    @State private var response: ProgressResponse?
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && response == nil {
                    ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let errorMessage, response?.stats == nil {
                    ErrorStateView(message: errorMessage) { Task { await load() } }
                } else if let stats = response?.stats {
                    content(stats: stats)
                } else {
                    EmptyStateView(
                        icon: "chart.bar",
                        title: "Your progress will appear here",
                        message: "Complete your first few days and we'll start showing patterns."
                    )
                }
            }
            .background(Theme.Palette.background)
            .navigationTitle("Progress")
        }
        .task { await load() }
    }

    @ViewBuilder
    private func content(stats: StatsDTO) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                HStack(alignment: .firstTextBaseline, spacing: Theme.Spacing.m) {
                    Text("\(stats.overallCompletion)%")
                        .font(.system(size: 56, weight: .semibold, design: .rounded))
                    Text("Overall\nconsistency")
                        .font(Theme.Typography.caption)
                        .foregroundStyle(Theme.Palette.secondaryText)
                }
                .accessibilityElement(children: .ignore)
                .accessibilityLabel("Overall consistency \(stats.overallCompletion) percent")

                LazyVGrid(
                    columns: [GridItem(.flexible()), GridItem(.flexible())],
                    spacing: Theme.Spacing.m
                ) {
                    MetricView(value: "\(stats.activeDays)", label: "Active days").surfaceCard()
                    MetricView(value: "\(stats.currentStreak)", label: "Current streak").surfaceCard()
                    MetricView(value: "\(stats.perfectDays)", label: "Perfect days").surfaceCard()
                    MetricView(value: "\(stats.actionsCompleted)", label: "Actions completed").surfaceCard()
                }

                if stats.minimumDays > 0 {
                    Text("Including \(stats.minimumDays) Minimum \(stats.minimumDays == 1 ? "Day" : "Days") — days you could have skipped entirely and didn't.")
                        .font(Theme.Typography.caption)
                        .foregroundStyle(Theme.Palette.secondaryText)
                }

                if let days = response?.days, !days.isEmpty {
                    ConsistencyChart(days: days)
                }

                if let pillars = response?.pillars, pillars.contains(where: { $0.scheduled > 0 }) {
                    PillarProgressSection(pillars: pillars)
                }

                InsightsSection(insights: response?.insights ?? [])

                Text("\(stats.minutesCompleted.formattedMinutes) spent on this goal · longest streak \(stats.longestStreak) \(stats.longestStreak == 1 ? "day" : "days")")
                    .font(Theme.Typography.caption)
                    .foregroundStyle(Theme.Palette.secondaryText)
            }
            .padding(Theme.Spacing.l)
        }
        .refreshable { await load() }
    }

    private func load() async {
        do {
            response = try await environment.api.progress()
            errorMessage = nil
        } catch let error as APIError {
            if error.isCancellation { return }
            await environment.handle(error)
            errorMessage = error.userMessage
        } catch {
            errorMessage = "Something went wrong."
        }
        isLoading = false
    }
}

/// One bar per day. No axes, no gridlines — a shape to glance at.
struct ConsistencyChart: View {
    let days: [CalendarDayDTO]

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.s) {
            Text("Your 30 days")
                .font(Theme.Typography.sectionTitle)
                .accessibilityAddTraits(.isHeader)
            // Says what the empty right-hand side means, so a challenge early
            // on does not look like a broken chart.
            Text("One bar per day, from Day 1 to Day \(days.count). Height is how much of that day's plan you completed.")
                .font(Theme.Typography.caption)
                .foregroundStyle(Theme.Palette.secondaryText)

            Chart(days) { day in
                BarMark(
                    x: .value("Day", day.dayNumber),
                    y: .value("Completed", day.dayState == .future ? 0 : day.percent)
                )
                .foregroundStyle(colour(for: day))
                .cornerRadius(2)
            }
            .chartXAxis(.hidden)
            .chartYAxis(.hidden)
            .chartYScale(domain: 0...100)
            // Pin the axis to the whole challenge. Left to infer the domain
            // from the data, the chart squeezes the elapsed days into a corner
            // and the month never reads as thirty days long.
            .chartXScale(domain: 0.5...(Double(days.count) + 0.5))
            .frame(height: 120)
            .accessibilityLabel("Daily completion across the challenge")
            .accessibilityValue(summary)
        }
    }

    private func colour(for day: CalendarDayDTO) -> Color {
        switch day.dayState {
        case .future: Theme.Palette.secondaryText.opacity(0.28)
        case .missed: Theme.Palette.secondaryText.opacity(0.55)
        case .minimum: Theme.Palette.accent.opacity(0.55)
        case .perfect: Theme.Palette.accent
        default: Theme.Palette.accent.opacity(0.75)
        }
    }

    /// VoiceOver gets a sentence, not thirty bars to swipe through.
    private var summary: String {
        let elapsed = days.filter { $0.dayState != .future }
        let active = elapsed.filter { $0.percent >= 50 }.count
        return "\(active) of \(elapsed.count) days so far were active."
    }
}

struct PillarProgressSection: View {
    let pillars: [PillarProgressDTO]

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.m) {
            Text("Where you're showing up")
                .font(Theme.Typography.sectionTitle)
                .accessibilityAddTraits(.isHeader)

            ForEach(pillars) { pillar in
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(pillar.name).font(Theme.Typography.body)
                        Spacer()
                        Text("\(pillar.percent)%")
                            .font(Theme.Typography.caption)
                            .foregroundStyle(Theme.Palette.secondaryText)
                    }
                    ProgressView(value: Double(pillar.percent), total: 100)
                        .tint(Theme.Palette.accent)
                }
                .accessibilityElement(children: .ignore)
                .accessibilityLabel("\(pillar.name), \(pillar.percent) percent")
            }
        }
    }
}

/// Only shows what the data supports. No insight is ever invented.
struct InsightsSection: View {
    let insights: [InsightDTO]

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.m) {
            Text("What we're noticing")
                .font(Theme.Typography.sectionTitle)
                .accessibilityAddTraits(.isHeader)

            if insights.isEmpty {
                Text("Complete a few more days and patterns will start showing up here — which actions stick, and which keep getting skipped.")
                    .font(Theme.Typography.body)
                    .foregroundStyle(Theme.Palette.secondaryText)
            } else {
                VStack(alignment: .leading, spacing: Theme.Spacing.m) {
                    ForEach(insights) { insight in
                        Text(insight.text).font(Theme.Typography.body)
                        if insight.id != insights.last?.id { Divider() }
                    }
                }
                .surfaceCard()
            }
        }
    }
}
