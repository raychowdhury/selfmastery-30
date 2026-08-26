import SwiftUI

/// Previous challenges. Nothing is deleted when a new one starts.
struct HistoryScreen: View {
    @Environment(AppEnvironment.self) private var environment
    @State private var entries: [HistoryEntryDTO] = []
    @State private var isLoading = true

    var body: some View {
        Group {
            if isLoading && entries.isEmpty {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if entries.isEmpty {
                EmptyStateView(
                    icon: "clock.arrow.circlepath",
                    title: "No history yet",
                    message: "Challenges you finish will be kept here."
                )
            } else {
                List(entries) { entry in
                    NavigationLink {
                        ChallengeDetailScreen(challenge: entry.challenge)
                    } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(entry.challenge.goal).font(Theme.Typography.actionTitle)
                            Text(dateRange(entry.challenge))
                                .font(Theme.Typography.caption)
                                .foregroundStyle(Theme.Palette.secondaryText)
                            Chip(text: statusLabel(entry.challenge.status))
                        }
                        .padding(.vertical, 4)
                    }
                }
                .listStyle(.insetGrouped)
            }
        }
        .navigationTitle("Previous Challenges")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            entries = (try? await environment.api.history())?.challenges ?? []
            isLoading = false
        }
    }

    private func dateRange(_ challenge: ChallengeDTO) -> String {
        let start = CalendarDay(challenge.startDate)?.formattedShort() ?? ""
        let end = CalendarDay(challenge.endDate)?.formattedShort() ?? ""
        return "\(start) — \(end)"
    }

    private func statusLabel(_ status: String) -> String {
        switch status {
        case "ACTIVE": "Active"
        case "COMPLETED": "Completed"
        default: "Archived"
        }
    }
}
