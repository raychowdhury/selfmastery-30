import SwiftUI

/// The first thing a new person sees. Deliberately almost empty: one promise,
/// one action.
struct WelcomeView: View {
    @State private var route: Route?

    enum Route: Hashable {
        case signUp, signIn
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Spacer()

                VStack(alignment: .leading, spacing: Theme.Spacing.l) {
                    ProgressRingMark()
                        .frame(width: 56, height: 56)
                        .accessibilityHidden(true)

                    Text("One meaningful change.")
                        .font(Theme.Typography.display)
                        .fixedSize(horizontal: false, vertical: true)

                    Text("Give yourself 30 days. SelfMastery turns your goal into simple actions you can follow every day.")
                        .font(.body)
                        .foregroundStyle(Theme.Palette.secondaryText)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                Spacer()

                VStack(spacing: Theme.Spacing.m) {
                    PrimaryButton(title: "Start My 30 Days") { route = .signUp }
                    SecondaryButton(title: "I Already Have an Account") { route = .signIn }
                }
            }
            .padding(.horizontal, Theme.Spacing.xl)
            .padding(.bottom, Theme.Spacing.xl)
            .background(Theme.Palette.background)
            .navigationDestination(item: $route) { route in
                switch route {
                case .signUp: AuthView(mode: .signUp)
                case .signIn: AuthView(mode: .signIn)
                }
            }
        }
    }
}

/// The app mark, drawn rather than shipped as an image so it scales cleanly.
struct ProgressRingMark: View {
    var body: some View {
        ZStack {
            Circle()
                .strokeBorder(Theme.Palette.accent.opacity(0.25), lineWidth: 6)
            Circle()
                .trim(from: 0, to: 0.72)
                .stroke(Theme.Palette.accent, style: .init(lineWidth: 6, lineCap: .round))
                .rotationEffect(.degrees(-90))
        }
    }
}

#Preview {
    WelcomeView()
        .environment(AppEnvironment())
}
