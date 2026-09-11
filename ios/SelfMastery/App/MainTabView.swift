import SwiftUI

/// The Calm design's three destinations. Today is first and is what the app
/// opens to; the calendar and progress screens are merged into "30 days".
struct MainTabView: View {
    @Environment(AppEnvironment.self) private var environment
    @State private var selection: Destination = .today

    /// Named `Destination` rather than `Tab`: SwiftUI now ships its own `Tab`
    /// type, and the builder below needs that name to resolve to Apple's.
    enum Destination: Hashable {
        case today, days, settings
    }

    var body: some View {
        TabView(selection: $selection) {
            Tab("Today", systemImage: "checkmark.circle", value: Destination.today) {
                TodayScreen()
            }
            Tab("30 days", systemImage: "circle.grid.3x3", value: Destination.days) {
                ProgressScreen()
            }
            Tab("Settings", systemImage: "person", value: Destination.settings) {
                ProfileScreen()
            }
        }
        .overlay(alignment: .top) {
            if environment.isOffline {
                OfflineBanner()
                    .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
        .animation(.easeInOut(duration: 0.2), value: environment.isOffline)
    }
}

struct OfflineBanner: View {
    var body: some View {
        Text("You're offline. Your progress will sync when you're connected.")
            .font(Theme.Typography.caption)
            .foregroundStyle(Theme.Palette.secondaryText)
            .multilineTextAlignment(.center)
            .padding(.horizontal, Theme.Spacing.l)
            .padding(.vertical, Theme.Spacing.s)
            .frame(maxWidth: .infinity)
            .background(.ultraThinMaterial)
            .accessibilityAddTraits(.isStaticText)
    }
}
