import SwiftUI

/// The 30 days at a glance. A missed day is a soft grey, never red: this is a
/// record of returning, not a scoreboard.
struct CalendarScreen: View {
    @Environment(AppEnvironment.self) private var environment
    @State private var days: [CalendarDayDTO] = []
    @State private var selected: CalendarDayDTO?
    @State private var isLoading = true
    @State private var errorMessage: String?

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 8), count: 5)

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && days.isEmpty {
                    ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let errorMessage, days.isEmpty {
                    ErrorStateView(message: errorMessage) { Task { await load() } }
                } else if days.isEmpty {
                    EmptyStateView(
                        icon: "calendar",
                        title: "No challenge yet",
                        message: "Your 30 days will appear here once you start."
                    )
                } else {
                    content
                }
            }
            .background(Theme.Palette.background)
            .navigationTitle("Your 30 Days")
            .navigationBarTitleDisplayMode(.large)
        }
        .task { await load() }
        .sheet(item: $selected) { day in
            DayDetailSheet(dayNumber: day.dayNumber)
        }
    }

    private var content: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.l) {
                Text("Progress isn't about perfection. It's about returning.")
                    .font(Theme.Typography.body)
                    .foregroundStyle(Theme.Palette.secondaryText)

                LazyVGrid(columns: columns, spacing: 8) {
                    ForEach(days) { day in
                        Button { selected = day } label: {
                            CalendarCell(day: day)
                        }
                        .buttonStyle(.plain)
                    }
                }

                CalendarLegend()
            }
            .padding(Theme.Spacing.l)
        }
        .refreshable { await load() }
    }

    private func load() async {
        errorMessage = nil
        do {
            let response = try await environment.api.progress()
            days = response.days ?? []
            isLoading = false
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
}

struct CalendarCell: View {
    let day: CalendarDayDTO

    var body: some View {
        VStack(spacing: 2) {
            Text(String(format: "%02d", day.dayNumber))
                .font(.system(.footnote, weight: .medium))
            Text(mark)
                .font(.system(size: 10))
                .foregroundStyle(markColour)
                .frame(height: 12)
        }
        .frame(maxWidth: .infinity, minHeight: 52)
        .background(background, in: .rect(cornerRadius: Theme.Radius.small))
        .overlay {
            RoundedRectangle(cornerRadius: Theme.Radius.small)
                .strokeBorder(border, lineWidth: day.dayState == .today ? 1.5 : 1)
        }
        .foregroundStyle(foreground)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Day \(day.dayNumber), \(stateLabel)")
        .accessibilityAddTraits(.isButton)
    }

    /// State is carried by a glyph as well as a colour, so it survives
    /// greyscale and colour-blind vision.
    private var mark: String {
        switch day.dayState {
        case .perfect: "★"
        case .complete: "✓"
        case .partial: "\(day.percent)%"
        case .minimum: "M"
        case .missed: "—"
        case .today: "·"
        case .future: ""
        }
    }

    private var stateLabel: String {
        switch day.dayState {
        case .perfect: "perfect day"
        case .complete: "complete"
        case .partial: "\(day.percent) percent complete"
        case .minimum: "minimum day"
        case .missed: "missed"
        case .today: "today"
        case .future: "upcoming"
        }
    }

    private var markColour: Color {
        switch day.dayState {
        case .perfect, .complete, .today: Theme.Palette.accent
        case .minimum: Theme.Palette.accent.opacity(0.7)
        default: Theme.Palette.secondaryText
        }
    }

    private var background: Color {
        switch day.dayState {
        case .perfect: Theme.Palette.accent.opacity(0.18)
        case .complete, .partial, .minimum: Theme.Palette.surface
        case .today: Theme.Palette.accent.opacity(0.10)
        default: .clear
        }
    }

    private var border: Color {
        day.dayState == .today ? Theme.Palette.accent : Theme.Palette.separator.opacity(0.6)
    }

    private var foreground: Color {
        day.dayState == .future ? Theme.Palette.secondaryText : Theme.Palette.text
    }
}

struct CalendarLegend: View {
    private let entries = [
        ("✓", "Complete"), ("★", "Perfect"), ("%", "Partial"),
        ("M", "Minimum Day"), ("—", "Missed"), ("·", "Today"),
    ]

    var body: some View {
        FlowLayout(spacing: Theme.Spacing.m) {
            ForEach(entries, id: \.1) { entry in
                HStack(spacing: 4) {
                    Text(entry.0).foregroundStyle(Theme.Palette.accent)
                    Text(entry.1).foregroundStyle(Theme.Palette.secondaryText)
                }
                .font(Theme.Typography.caption)
            }
        }
        .accessibilityHidden(true)
    }
}

/// Wraps items onto as many lines as they need. Used only for the legend.
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > width, x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        return CGSize(width: width, height: y + rowHeight)
    }

    func placeSubviews(
        in bounds: CGRect,
        proposal: ProposedViewSize,
        subviews: Subviews,
        cache: inout ()
    ) {
        var x = bounds.minX, y = bounds.minY, rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }
            subview.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
