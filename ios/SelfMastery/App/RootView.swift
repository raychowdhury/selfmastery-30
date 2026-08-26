import SwiftUI

/// Decides the first screen and keeps the transition between states calm.
struct RootView: View {
    @Environment(AppEnvironment.self) private var environment

    var body: some View {
        Group {
            switch environment.state {
            case .launching:
                LaunchView()
            case .unauthenticated:
                WelcomeView()
            case .onboarding:
                StartChallengeView()
            case .ready:
                MainTabView()
            }
        }
        .animation(.easeInOut(duration: 0.2), value: environment.state)
        .task {
            await environment.start()
        }
    }
}

/// Shown only while the stored session is being checked. It deliberately looks
/// like the launch screen so there is no flash of a different layout.
struct LaunchView: View {
    var body: some View {
        ZStack {
            Theme.Palette.background.ignoresSafeArea()
            ProgressView()
                .controlSize(.large)
                .tint(Theme.Palette.accent)
        }
        .accessibilityLabel("Loading SelfMastery")
    }
}

#Preview("Launch") {
    LaunchView()
}
