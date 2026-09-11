import SwiftUI

/// The merged 30-days screen from the Calm design: the grid, the selected
/// day, and the two numbers that matter — one screen, one story. A missed day
/// is a soft dash, never red: this is a record of returning, not a scoreboard.
struct ProgressScreen: View {
    @Environment(AppEnvironment.self) private var environment
    @State private var response: ProgressResponse?
    @State private var selectedNumber: Int?
    @State private var selectedDay: DayDTO?
    @State private var isLoading = true
    @State private var errorMessage: String?

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 6), count: 6)

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && response == nil {
                    ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let errorMessage, response?.days?.isEmpty != false {
                    ErrorStateView(message: errorMessage) { Task { await load() } }
                } else if let days = response?.days, !days.isEmpty {
                    content(days: days)
                } else {
                    EmptyStateView(
                        icon: "circle.grid.3x3",
                        title: "Your 30 days will appear here",
                        message: "One goal, thirty days. Start and this screen fills in."
                    )
                }
            }
            .background(Theme.Palette.background)
            .toolbarVisibility(.hidden, for: .navigationBar)
        }
        .task { await load() }
    }

    @ViewBuilder
    private func content(days: [CalendarDayDTO]) -> some View {
        let today = response?.dayNumber ?? 1
        let selected = selectedNumber ?? min(today, days.count)

        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Your 30 days")
                    .calmHeading(26)
                    .accessibilityAddTraits(.isHeader)

                Text("Progress is about returning, not perfection.")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.Palette.secondaryText)
                    .padding(.top, Theme.Spacing.s)

                LazyVGrid(columns: columns, spacing: 6) {
                    ForEach(days) { day in
                        DayCell(
                            day: day,
                            isSelected: day.dayNumber == selected,
                            isToday: day.dayNumber == today,
                            isFaded: day.dayNumber > today
                        ) {
                            select(day.dayNumber)
                        }
                    }
                }
                .padding(.top, Theme.Spacing.xxl)

                summary(days: days, selected: selected, today: today)
                    .padding(.top, Theme.Spacing.xl)

                CalmRule()
                    .padding(.top, Theme.Spacing.xxl)

                if let stats = response?.stats {
                    HStack(alignment: .top, spacing: Theme.Spacing.xl) {
                        StatBlock(value: stats.activeDays, label: "days completed")
                        StatBlock(value: stats.currentStreak, label: "days in a row")
                    }
                    .padding(.top, Theme.Spacing.xl)
                }

                if let selectedDay, !selectedDay.actions.isEmpty {
                    CalmRule()
                        .padding(.top, Theme.Spacing.xxl)

                    VStack(spacing: 0) {
                        ForEach(visibleActions(of: selectedDay)) { action in
                            ActionRow(
                                action: action,
                                isReadOnly: selected > today
                            ) {
                                Task { await toggle(action, dayNumber: selected) }
                            }
                        }
                    }
                    .padding(.top, Theme.Spacing.s)

                    if let note = selectedDay.reflection?.note, !note.isEmpty {
                        Text("\u{201C}\(note)\u{201D}")
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.Palette.secondaryText)
                            .padding(.top, Theme.Spacing.l)
                    }
                }
            }
            .padding(.horizontal, 28)
            .padding(.top, Theme.Spacing.xl)
            .padding(.bottom, Theme.Spacing.section)
        }
        .refreshable { await load() }
    }

    @ViewBuilder
    private func summary(days: [CalendarDayDTO], selected: Int, today: Int) -> some View {
        let day = days.first { $0.dayNumber == selected }
        let state = day?.dayState ?? .future
        let label = selected == today ? "Today" : stateLabel(state)

        VStack(alignment: .leading, spacing: 4) {
            Text("Day \(selected) · \(label)")
                .font(.system(size: 16))
            Text(summarySub(state: state, selected: selected, today: today))
                .font(.system(size: 13.5))
                .foregroundStyle(Theme.Palette.secondaryText)
        }
        .accessibilityElement(children: .combine)
    }

    private func summarySub(state: CalendarDayDTO.State, selected: Int, today: Int) -> String {
        if selected > today {
            let planned = selectedDay?.actions.filter { !$0.optional }.count ?? 0
            return planned > 0 ? "\(planned) actions planned" : "Upcoming"
        }
        if state == .missed { return "Nothing logged. You came back." }
        guard let completion = selectedDay?.completion else { return "" }
        if selected == today {
            return "\(completion.completed) of \(completion.required) actions so far"
        }
        let minutes = selectedDay?.actions
            .filter(\.completed)
            .reduce(0) { $0 + $1.estimatedMinutes } ?? 0
        return "\(completion.completed) of \(completion.required) actions · \(minutes) minutes"
    }

    private func stateLabel(_ state: CalendarDayDTO.State) -> String {
        switch state {
        case .perfect, .complete: "Complete"
        case .partial: "Partial"
        case .minimum: "Minimum day"
        case .missed: "Missed"
        case .today: "Today"
        case .future: "Upcoming"
        }
    }

    private func visibleActions(of day: DayDTO) -> [ActionDTO] {
        day.isMinimumDay ? day.actions.filter { !$0.optional } : day.actions
    }

    private func select(_ number: Int) {
        selectedNumber = number
        selectedDay = nil
        Task { await loadSelected(number) }
    }

    private func load() async {
        errorMessage = nil
        do {
            response = try await environment.api.progress()
            isLoading = false
            let number =
                selectedNumber
                ?? min(response?.dayNumber ?? 1, response?.days?.count ?? 30)
            await loadSelected(number)
        } catch let error as APIError {
            if error.isCancellation { return }
            await environment.handle(error)
            errorMessage = error.userMessage
            isLoading = false
        } catch {
            errorMessage = "Something went wrong."
            isLoading = false
        }
    }

    private func loadSelected(_ number: Int) async {
        selectedDay = try? await environment.api.day(number: number)
    }

    private func toggle(_ action: ActionDTO, dayNumber: Int) async {
        Haptics.actionCompleted()
        try? await environment.api.setAction(id: action.id, completed: !action.completed)
        await loadSelected(dayNumber)
        // Refresh the grid too, so the day's glyph tracks its actions.
        response = try? await environment.api.progress()
    }
}

/// One cell of the 30-day grid: the number and a state glyph. State is carried
/// by a glyph as well as a colour, so it survives greyscale vision.
private struct DayCell: View {
    let day: CalendarDayDTO
    let isSelected: Bool
    let isToday: Bool
    let isFaded: Bool
    let select: () -> Void

    var body: some View {
        Button(action: select) {
            VStack(spacing: 4) {
                Text("\(day.dayNumber)")
                    .font(.system(size: 13))
                Text(glyph.isEmpty ? "·" : glyph)
                    .font(.system(size: 10))
                    .foregroundStyle(glyph.isEmpty ? .clear : glyphColour)
                    .frame(height: 10)
            }
            .frame(maxWidth: .infinity, minHeight: 48)
            .foregroundStyle(numberColour)
            .background(
                isSelected ? Theme.Palette.surface : .clear,
                in: .rect(cornerRadius: Theme.Radius.small)
            )
            .overlay {
                RoundedRectangle(cornerRadius: Theme.Radius.small)
                    .strokeBorder(
                        isToday ? Theme.Palette.accent : .clear,
                        lineWidth: 1
                    )
            }
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Day \(day.dayNumber), \(isToday ? "today" : accessibilityState)")
        .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : .isButton)
    }

    private var glyph: String {
        switch day.dayState {
        case .perfect, .complete: "●"
        case .partial: "◐"
        case .minimum: "○"
        case .missed: "–"
        case .today, .future: ""
        }
    }

    private var glyphColour: Color {
        day.dayState == .missed
            ? Theme.Palette.text.opacity(0.6)
            : Theme.Palette.accent
    }

    private var numberColour: Color {
        if isFaded { return Theme.Palette.text.opacity(0.3) }
        if day.dayState == .missed { return Theme.Palette.text.opacity(0.6) }
        return Theme.Palette.text
    }

    private var accessibilityState: String {
        switch day.dayState {
        case .perfect, .complete: "complete"
        case .partial: "partial"
        case .minimum: "minimum day"
        case .missed: "missed"
        case .today: "today"
        case .future: "upcoming"
        }
    }
}

/// A Calm stat: a big heading number over a muted label.
private struct StatBlock: View {
    let value: Int
    let label: String

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.s) {
            Text("\(value)").calmHeading(30)
            Text(label)
                .font(.system(size: 13))
                .foregroundStyle(Theme.Palette.secondaryText)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(value) \(label)")
    }
}
