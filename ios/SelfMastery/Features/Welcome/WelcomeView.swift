import SwiftUI

/// The landing experience.
///
/// Four pages rather than one screen: someone arriving cold needs to know what
/// this is, how it works, that it fits their kind of goal, and what happens on a
/// bad day. The web landing page answers all four before anyone signs up, and
/// the app should not ask for an account with less.
///
/// The actions stay pinned below the pages, so signing up is never more than one
/// tap away no matter how far someone reads.
struct WelcomeView: View {
    @State private var page = 0
    @State private var route: Route?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    enum Route: Hashable {
        case signUp, signIn
    }

    private static let pageCount = 4

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                TabView(selection: $page) {
                    HeroPage().tag(0)
                    HowItWorksPage().tag(1)
                    OrdinaryGoalsPage().tag(2)
                    MinimumDayPage().tag(3)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(reduceMotion ? nil : .easeInOut, value: page)

                PageDots(count: Self.pageCount, current: page)
                    .padding(.bottom, Theme.Spacing.l)

                VStack(spacing: Theme.Spacing.m) {
                    PrimaryButton(title: "Start My 30 Days") { route = .signUp }
                    SecondaryButton(title: "I Already Have an Account") { route = .signIn }
                }
                .padding(.horizontal, Theme.Spacing.xl)
                .padding(.bottom, Theme.Spacing.xl)
            }
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

// MARK: - Pages

/// Page one. The promise, and nothing competing with it.
private struct HeroPage: View {
    var body: some View {
        WelcomePage {
            VStack(alignment: .leading, spacing: Theme.Spacing.l) {
                ProgressRingMark()
                    .frame(width: 60, height: 60)
                    .accessibilityHidden(true)

                Text("One meaningful change.")
                    .font(Theme.Typography.display)
                    .fixedSize(horizontal: false, vertical: true)

                Text("Give yourself 30 days. SelfMastery turns your goal into simple actions you can follow every day.")
                    .font(.body)
                    .foregroundStyle(Theme.Palette.secondaryText)
                    .fixedSize(horizontal: false, vertical: true)

                Text("No complicated setup. Start in under two minutes.")
                    .font(Theme.Typography.caption)
                    .foregroundStyle(Theme.Palette.secondaryText)
                    .padding(.top, Theme.Spacing.xs)
            }
        }
    }
}

private struct HowItWorksPage: View {
    private let steps = [
        ("01", "Choose what matters", "Tell us what you want to change or accomplish."),
        ("02", "Get your 30-day path", "SelfMastery turns the goal into realistic daily actions."),
        ("03", "Show up today", "Complete today's actions and gradually build consistency."),
    ]

    var body: some View {
        WelcomePage {
            VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                Text("How it works")
                    .font(Theme.Typography.title)
                    .accessibilityAddTraits(.isHeader)

                VStack(alignment: .leading, spacing: Theme.Spacing.l) {
                    ForEach(steps, id: \.0) { step in
                        HStack(alignment: .top, spacing: Theme.Spacing.m) {
                            Text(step.0)
                                .font(Theme.Typography.eyebrow)
                                .foregroundStyle(Theme.Palette.accent)
                                .frame(width: 24, alignment: .leading)
                                .accessibilityHidden(true)

                            VStack(alignment: .leading, spacing: 2) {
                                Text(step.1).font(Theme.Typography.actionTitle)
                                Text(step.2)
                                    .font(Theme.Typography.body)
                                    .foregroundStyle(Theme.Palette.secondaryText)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                        .accessibilityElement(children: .combine)
                    }
                }
            }
        }
    }
}

/// Page three exists to answer "is this for someone like me?". The breadth is
/// the point — this is not a fitness app or a developer tool.
private struct OrdinaryGoalsPage: View {
    private let goals = [
        "Get healthier", "Study consistently", "Find a better job",
        "Take control of my money", "Reduce phone usage", "Finish my project",
        "Spend time with family", "Build discipline", "Read every day",
    ]

    var body: some View {
        WelcomePage {
            VStack(alignment: .leading, spacing: Theme.Spacing.l) {
                Text("It works for ordinary goals")
                    .font(Theme.Typography.title)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityAddTraits(.isHeader)

                Text("You don't need a grand mission. You need a direction.")
                    .font(.body)
                    .foregroundStyle(Theme.Palette.secondaryText)

                FlowLayout(spacing: Theme.Spacing.s) {
                    ForEach(goals, id: \.self) { goal in
                        Text(goal)
                            .font(Theme.Typography.body)
                            .padding(.horizontal, Theme.Spacing.m)
                            .padding(.vertical, Theme.Spacing.s)
                            .background(
                                Theme.Palette.surface,
                                in: .rect(cornerRadius: Theme.Radius.small)
                            )
                    }
                }
                .accessibilityElement(children: .combine)
                .accessibilityLabel("Example goals: \(goals.joined(separator: ", "))")

                Text("Or describe something in your own words.")
                    .font(Theme.Typography.caption)
                    .foregroundStyle(Theme.Palette.secondaryText)
            }
        }
    }
}

/// Page four is the differentiator, and the reason people stay past week one.
private struct MinimumDayPage: View {
    var body: some View {
        WelcomePage {
            VStack(alignment: .leading, spacing: Theme.Spacing.l) {
                Text("Progress without perfection")
                    .font(Theme.Typography.title)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityAddTraits(.isHeader)

                Text("Some days fall apart. Instead of skipping, switch to a Minimum Day — the same commitment at its smallest size.")
                    .font(.body)
                    .foregroundStyle(Theme.Palette.secondaryText)
                    .fixedSize(horizontal: false, vertical: true)

                VStack(alignment: .leading, spacing: Theme.Spacing.m) {
                    ComparisonRow(label: "Original", value: "Walk for 30 minutes", muted: true)
                    Divider()
                    ComparisonRow(label: "Minimum", value: "Walk 5 minutes", muted: false)
                }
                .surfaceCard()
                .accessibilityElement(children: .combine)
                .accessibilityLabel("On a hard day, a 30 minute walk becomes a 5 minute walk")

                Text("It still counts. Reduce the requirement, not the commitment.")
                    .font(Theme.Typography.body)
                    .foregroundStyle(Theme.Palette.secondaryText)
                    .fixedSize(horizontal: false, vertical: true)

                Text("No streak warnings. No guilt. A missed day is not a failure.")
                    .font(Theme.Typography.caption)
                    .foregroundStyle(Theme.Palette.secondaryText)
            }
        }
    }
}

// MARK: - Shared

/// Centres its content when it fits and scrolls when it does not.
///
/// Both halves matter: top-aligned copy leaves a hole on a tall phone, and a
/// fixed centre clips at the largest accessibility text sizes on a small one.
private struct WelcomePage<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        GeometryReader { proxy in
            ScrollView {
                content
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, Theme.Spacing.xl)
                    .padding(.vertical, Theme.Spacing.xl)
                    .frame(minHeight: proxy.size.height, alignment: .center)
            }
            .scrollBounceBehavior(.basedOnSize)
        }
    }
}

/// Page indicator drawn rather than using the built-in dots, which sit inside
/// the paged TabView and would scroll with it.
private struct PageDots: View {
    let count: Int
    let current: Int

    var body: some View {
        HStack(spacing: Theme.Spacing.s) {
            ForEach(0..<count, id: \.self) { index in
                Capsule()
                    .fill(
                        index == current
                            ? Theme.Palette.accent
                            : Theme.Palette.separator
                    )
                    .frame(width: index == current ? 20 : 6, height: 6)
                    .animation(.snappy(duration: 0.2), value: current)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Page \(current + 1) of \(count)")
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

#Preview("Welcome") {
    WelcomeView().environment(AppEnvironment())
}
