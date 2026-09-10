import SwiftUI
import UIKit

/// The Calm landing — the app's cold open, ported from the "SelfMastery 30
/// Calm App" prototype (docs/design). One screen, one promise: the outlined
/// 30 over its glow, a thirty-dot rail, the headline, and the two actions
/// pinned to the bottom as full-width pills.
///
/// Colours come from the asset catalogue, so this is Nocturne in dark and
/// Modernist in light with no per-appearance branching beyond the primary
/// button, which is an outline in Nocturne and a solid block in Modernist —
/// matching the prototype's two design systems.
struct WelcomeView: View {
    @State private var route: Route?
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var appeared = false

    enum Route: Hashable {
        case signUp, signIn
    }

    /// Eight of thirty filled, matching the prototype's "Day 8" state.
    private let filledDays = 8

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                background

                content
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                    .padding(.horizontal, 28)
                    .padding(.top, 24)
                    .padding(.bottom, 150)

                actionBar
            }
            .navigationDestination(item: $route) { route in
                switch route {
                case .signUp: AuthView(mode: .signUp)
                case .signIn: AuthView(mode: .signIn)
                }
            }
        }
        .onAppear {
            guard !appeared else { return }
            if reduceMotion {
                appeared = true
            } else {
                withAnimation(.easeOut(duration: 0.4)) { appeared = true }
            }
        }
    }

    // MARK: - Pieces

    private var background: some View {
        Theme.Palette.background
            .overlay(alignment: .top) {
                RadialGradient(
                    colors: [Theme.Palette.accent.opacity(0.10), .clear],
                    center: .top,
                    startRadius: 0,
                    endRadius: 440
                )
                .frame(height: 420)
                .frame(maxWidth: .infinity)
                .allowsHitTesting(false)
            }
            .ignoresSafeArea()
    }

    private var content: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("SelfMastery".uppercased())
                .font(.system(size: 12, weight: .semibold))
                .tracking(2.4)

            ZStack(alignment: .topLeading) {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [Theme.Palette.accent.opacity(0.22), .clear],
                            center: .center,
                            startRadius: 0,
                            endRadius: 130
                        )
                    )
                    .frame(width: 260, height: 260)
                    .offset(x: -40, y: -30)
                    .allowsHitTesting(false)

                StrokeText(text: "30", fontSize: 168, strokeWidthPercent: 1.1)
                    .fixedSize()
            }
            .padding(.top, 52)
            .accessibilityHidden(true)

            dotRail
                .padding(.top, 34)
                .accessibilityHidden(true)

            Text("Become the person you keep saying you want to be.")
                .font(.system(size: 28, weight: .semibold))
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 40)

            Text("One goal. Three small actions a day. Thirty days.")
                .font(.system(size: 15))
                .foregroundStyle(Theme.Palette.secondaryText)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 14)

            Spacer(minLength: 0)
        }
        .opacity(appeared ? 1 : 0)
        .offset(y: appeared ? 0 : 6)
    }

    private var dotRail: some View {
        let columns = Array(
            repeating: GridItem(.fixed(10), spacing: 10, alignment: .center),
            count: 10
        )
        return LazyVGrid(columns: columns, spacing: 10) {
            ForEach(0..<30, id: \.self) { index in
                let filled = index < filledDays
                Circle()
                    .fill(filled ? Theme.Palette.accent : Color.clear)
                    .overlay(
                        Circle().strokeBorder(
                            filled ? Theme.Palette.accent : Theme.Palette.text.opacity(0.3),
                            lineWidth: 1
                        )
                    )
                    .frame(width: 10, height: 10)
            }
        }
        .frame(width: 190)
    }

    private var actionBar: some View {
        VStack(spacing: 10) {
            PillButton(
                title: "Start my 30 days",
                style: colorScheme == .light ? .filled : .outline
            ) { route = .signUp }

            PillButton(title: "I already have an account", style: .ghost) {
                route = .signIn
            }
        }
        .padding(.horizontal, 28)
        .padding(.top, 16)
        .padding(.bottom, 24)
        .frame(maxWidth: .infinity)
        .background(.ultraThinMaterial)
        .overlay(alignment: .top) {
            Rectangle()
                .fill(Theme.Palette.text.opacity(0.08))
                .frame(height: 1)
        }
    }
}

// MARK: - Landing pill button

/// The Calm app's button: a full-width pill. The primary follows the active
/// design system — an accent outline in Nocturne, a solid accent block in
/// Modernist — while the ghost is a hairline-bordered pill in both.
private struct PillButton: View {
    enum Style { case filled, outline, ghost }

    let title: String
    let style: Style
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 15, weight: .semibold))
                .frame(maxWidth: .infinity, minHeight: 50)
                .foregroundStyle(foreground)
                .background(fill, in: Capsule())
                .overlay(Capsule().strokeBorder(border, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    private var foreground: Color {
        switch style {
        case .filled: .white
        case .outline: Theme.Palette.accent
        case .ghost: Theme.Palette.text
        }
    }

    private var fill: Color {
        style == .filled ? Theme.Palette.accent : .clear
    }

    private var border: Color {
        switch style {
        case .filled: Theme.Palette.accent
        case .outline: Theme.Palette.accent
        case .ghost: Theme.Palette.text.opacity(0.22)
        }
    }
}

// MARK: - Outlined display numeral

/// An outline-only numeral. SwiftUI's `Text` cannot stroke without filling, so
/// this bridges a `UILabel` whose attributed string uses a positive
/// `strokeWidth` (stroke, no fill) in the catalogue's BrandAccent — which
/// carries its own light/dark values, so the stroke tracks the appearance.
private struct StrokeText: UIViewRepresentable {
    let text: String
    let fontSize: CGFloat
    /// Stroke width as a percentage of the font size (UIKit's convention).
    let strokeWidthPercent: CGFloat

    func makeUIView(context: Context) -> UILabel {
        let label = UILabel()
        label.backgroundColor = .clear
        label.numberOfLines = 1
        label.setContentHuggingPriority(.required, for: .horizontal)
        label.setContentHuggingPriority(.required, for: .vertical)
        label.setContentCompressionResistancePriority(.required, for: .horizontal)
        label.setContentCompressionResistancePriority(.required, for: .vertical)
        return label
    }

    func updateUIView(_ label: UILabel, context: Context) {
        let accent = UIColor(named: "BrandAccent") ?? .systemPurple
        label.attributedText = NSAttributedString(
            string: text,
            attributes: [
                .font: UIFont.systemFont(ofSize: fontSize, weight: .heavy),
                .foregroundColor: UIColor.clear,
                .strokeColor: accent,
                .strokeWidth: strokeWidthPercent,
                .kern: -fontSize * 0.05,
            ]
        )
    }
}

// MARK: - App mark

/// The app mark, drawn rather than shipped as an image so it scales cleanly.
/// Used here and by onboarding.
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

#Preview("Welcome") {
    WelcomeView().environment(AppEnvironment())
}
