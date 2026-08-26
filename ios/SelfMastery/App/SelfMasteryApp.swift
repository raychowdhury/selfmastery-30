import SwiftUI

@main
struct SelfMasteryApp: App {
    @State private var environment = AppEnvironment()
    @AppStorage("appearance") private var appearance = Appearance.system

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(environment)
                .preferredColorScheme(appearance.colorScheme)
                .tint(Theme.Palette.accent)
        }
    }
}

/// Light / Dark / System, stored as a preference rather than read from the
/// system directly, so the choice survives relaunch.
enum Appearance: String, CaseIterable, Identifiable, Sendable {
    case system
    case light
    case dark

    var id: String { rawValue }

    var label: String {
        switch self {
        case .system: "System"
        case .light: "Light"
        case .dark: "Dark"
        }
    }

    var colorScheme: ColorScheme? {
        switch self {
        case .system: nil
        case .light: .light
        case .dark: .dark
        }
    }
}
