import SwiftUI

/// The app's primary button, in the Calm chrome: always a pill. The two themes
/// treat it differently on purpose — Nocturne dark keeps the primary as an
/// accent *outline* (that restraint is what keeps the interface calm), while
/// Modernist light fills it solid with page-coloured text.
struct PrimaryButton: View {
    let title: String
    var isLoading = false
    var isEnabled = true
    let action: () -> Void

    @Environment(\.colorScheme) private var scheme

    var body: some View {
        Button(action: action) {
            HStack(spacing: Theme.Spacing.s) {
                if isLoading {
                    ProgressView().controlSize(.small)
                        .tint(scheme == .light ? Theme.Palette.background : Theme.Palette.accent)
                }
                Text(isLoading ? "One moment…" : title)
                    .font(.system(size: 15, weight: .medium))
            }
            .frame(maxWidth: .infinity, minHeight: 50)
            .foregroundStyle(scheme == .light ? Theme.Palette.background : Theme.Palette.accent)
            .background {
                if scheme == .light {
                    Capsule().fill(Theme.Palette.accent)
                } else {
                    Capsule().strokeBorder(Theme.Palette.accent, lineWidth: 1)
                }
            }
            .contentShape(.capsule)
            .opacity(!isEnabled || isLoading ? 0.45 : 1)
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled || isLoading)
    }
}

/// Calm ghost: a quiet neutral outline in the text colour, not the accent.
struct SecondaryButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 15, weight: .medium))
                .frame(maxWidth: .infinity, minHeight: 50)
                .foregroundStyle(Theme.Palette.text)
                .background {
                    Capsule().strokeBorder(Theme.Palette.text.opacity(0.22), lineWidth: 1)
                }
                .contentShape(.capsule)
        }
        .buttonStyle(.plain)
    }
}

/// Quiet underlined text button — the Calm bar's secondary affordance.
struct UnderlineButton: View {
    let title: String
    var isDisabled = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 14))
                .foregroundStyle(Theme.Palette.text)
                .underline(color: Theme.Palette.text.opacity(0.35))
                .frame(minHeight: 44, alignment: .leading)
                .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .disabled(isDisabled)
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

/// An original-versus-minimum pair, used by the Welcome tour's Minimum Day page.
struct ComparisonRow: View {
    let label: String
    let value: String
    let muted: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label.uppercased())
                .font(Theme.Typography.eyebrow)
                .foregroundStyle(muted ? Theme.Palette.secondaryText : Theme.Palette.accent)
            Text(value)
                .font(Theme.Typography.actionTitle)
                .strikethrough(muted, color: Theme.Palette.secondaryText)
                .foregroundStyle(muted ? Theme.Palette.secondaryText : Theme.Palette.text)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// Wraps items onto as many lines as they need.
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
