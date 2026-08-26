import SwiftUI

/// One day, opened from the calendar. Past days stay editable — ticking
/// something off you forgot at the time is a normal thing to want.
struct DayDetailSheet: View {
    let dayNumber: Int

    @Environment(AppEnvironment.self) private var environment
    @Environment(\.dismiss) private var dismiss
    @State private var day: DayDTO?
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let errorMessage {
                    ErrorStateView(message: errorMessage) { Task { await load() } }
                } else if let day {
                    detail(day: day)
                }
            }
            .background(Theme.Palette.background)
            .navigationTitle("Day \(dayNumber)")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .task { await load() }
    }

    @ViewBuilder
    private func detail(day: DayDTO) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.l) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(CalendarDay(day.date)?.formattedLong() ?? day.date)
                        .font(Theme.Typography.body)
                        .foregroundStyle(Theme.Palette.secondaryText)
                    Text("\(day.completion.completed) of \(day.completion.required) actions")
                        .font(Theme.Typography.actionTitle)
                    if day.isMinimumDay {
                        Chip(text: "Minimum Day", tint: Theme.Palette.accent)
                    }
                }

                VStack(spacing: 0) {
                    ForEach(day.actions) { action in
                        ActionRow(action: action) {
                            Task { await toggle(action) }
                        }
                        if action.id != day.actions.last?.id { Divider() }
                    }
                }

                if let note = day.reflection?.note, !note.isEmpty {
                    VStack(alignment: .leading, spacing: Theme.Spacing.s) {
                        EyebrowLabel(text: "What you wrote", color: Theme.Palette.secondaryText)
                        Text(note).font(Theme.Typography.body)
                    }
                    .surfaceCard()
                }
            }
            .padding(Theme.Spacing.l)
        }
    }

    private func load() async {
        do {
            day = try await environment.api.day(number: dayNumber)
            errorMessage = nil
        } catch let error as APIError {
            errorMessage = error.userMessage
        } catch {
            errorMessage = "Something went wrong."
        }
        isLoading = false
    }

    private func toggle(_ action: ActionDTO) async {
        Haptics.actionCompleted()
        try? await environment.api.setAction(id: action.id, completed: !action.completed)
        await load()
    }
}
