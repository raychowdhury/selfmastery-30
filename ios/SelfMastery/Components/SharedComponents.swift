import SwiftUI

/// The app's primary button. One definition, so weight and shape never drift.
struct PrimaryButton: View {
    let title: String
    var isLoading = false
    var isEnabled = true
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: Theme.Spacing.s) {
                if isLoading {
                    ProgressView().controlSize(.small).tint(.white)
                }
                Text(isLoading ? "One moment…" : title)
                    .font(Theme.Typography.actionTitle)
            }
            .frame(maxWidth: .infinity, minHeight: 50)
        }
        .buttonStyle(.borderedProminent)
        .buttonBorderShape(.roundedRectangle(radius: Theme.Radius.medium))
        .disabled(!isEnabled || isLoading)
    }
}

struct SecondaryButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(Theme.Typography.actionTitle)
                .frame(maxWidth: .infinity, minHeight: 50)
        }
        .buttonStyle(.bordered)
        .buttonBorderShape(.roundedRectangle(radius: Theme.Radius.medium))
    }
}

/// A short piece of metadata: minutes, a pillar name, a state.
struct Chip: View {
    let text: String
    var tint: Color = Theme.Palette.secondaryText
    var bordered = false

    var body: some View {
        Text(text)
            .font(Theme.Typography.caption)
            .foregroundStyle(tint)
            .padding(.horizontal, Theme.Spacing.s)
            .padding(.vertical, 4)
            .background {
                if bordered {
                    RoundedRectangle(cornerRadius: 6).strokeBorder(tint.opacity(0.5))
                } else {
                    RoundedRectangle(cornerRadius: 6).fill(tint.opacity(0.12))
                }
            }
    }
}

/// Used wherever there is genuinely nothing to show yet — never to hide a
/// failure, which gets its own message.
struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String
    var actionTitle: String?
    var action: (() -> Void)?

    var body: some View {
        VStack(spacing: Theme.Spacing.m) {
            Image(systemName: icon)
                .font(.system(size: 32))
                .foregroundStyle(Theme.Palette.secondaryText)
                .accessibilityHidden(true)

            Text(title)
                .font(Theme.Typography.sectionTitle)
                .multilineTextAlignment(.center)

            Text(message)
                .font(Theme.Typography.body)
                .foregroundStyle(Theme.Palette.secondaryText)
                .multilineTextAlignment(.center)

            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .buttonStyle(.borderedProminent)
                    .padding(.top, Theme.Spacing.s)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(Theme.Spacing.xl)
    }
}

/// A failure the person can act on, with a way to retry.
struct ErrorStateView: View {
    let message: String
    let retry: () -> Void

    var body: some View {
        VStack(spacing: Theme.Spacing.m) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 28))
                .foregroundStyle(Theme.Palette.secondaryText)
                .accessibilityHidden(true)
            Text(message)
                .font(Theme.Typography.body)
                .multilineTextAlignment(.center)
                .foregroundStyle(Theme.Palette.secondaryText)
            Button("Try again", action: retry)
                .buttonStyle(.bordered)
        }
        .frame(maxWidth: .infinity)
        .padding(Theme.Spacing.xl)
    }
}

/// A labelled metric. Value and label are read together by VoiceOver so it
/// announces "12, active days" rather than a bare number.
struct MetricView: View {
    let value: String
    let label: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(value).font(Theme.Typography.metric)
            Text(label)
                .font(Theme.Typography.caption)
                .foregroundStyle(Theme.Palette.secondaryText)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(value), \(label)")
    }
}

#Preview("Components") {
    ScrollView {
        VStack(spacing: Theme.Spacing.l) {
            PrimaryButton(title: "Start My 30 Days") {}
            SecondaryButton(title: "I Already Have an Account") {}
            HStack {
                Chip(text: "20 min")
                Chip(text: "Movement", tint: Theme.Palette.accent, bordered: true)
            }
            HStack {
                MetricView(value: "12", label: "Active days")
                MetricView(value: "68%", label: "Consistency")
            }
            EmptyStateView(
                icon: "target",
                title: "No challenge yet",
                message: "Pick one thing to change over the next 30 days.",
                actionTitle: "Start"
            ) {}
        }
        .padding()
    }
}
