import SwiftUI

/// Design tokens.
///
/// Colours come from the asset catalogue so light and dark are one lookup, and
/// nothing in a view writes a literal colour. Spacing and radii are named for
/// the same reason: a screen should not be able to invent its own scale.
enum Theme {
    enum Palette {
        static let background = Color("BackgroundPrimary")
        static let surface = Color("BackgroundSurface")
        static let accent = Color("BrandAccent")
        static let accentSoft = Color("BrandAccentSoft")
        static let separator = Color("SeparatorSoft")

        /// Body text uses the system label colours so Increase Contrast and
        /// Smart Invert behave the way people expect.
        static let text = Color.primary
        static let secondaryText = Color.secondary
    }

    enum Spacing {
        static let xs: CGFloat = 4
        static let s: CGFloat = 8
        static let m: CGFloat = 12
        static let l: CGFloat = 16
        static let xl: CGFloat = 24
        static let xxl: CGFloat = 32
        static let section: CGFloat = 40
    }

    enum Radius {
        static let small: CGFloat = 8
        static let medium: CGFloat = 14
        static let large: CGFloat = 20
    }

    /// Everything scales with Dynamic Type: these are relative sizes, not fixed
    /// point values.
    enum Typography {
        static let display = Font.system(.largeTitle, design: .default, weight: .semibold)
        static let title = Font.system(.title, design: .default, weight: .semibold)
        static let sectionTitle = Font.system(.title3, design: .default, weight: .semibold)
        static let actionTitle = Font.system(.headline, design: .default, weight: .medium)
        static let body = Font.system(.subheadline)
        static let caption = Font.system(.footnote)
        static let metric = Font.system(.title, design: .rounded, weight: .semibold)
        static let eyebrow = Font.system(.caption2, design: .default, weight: .semibold)
    }
}

// MARK: - Reusable modifiers

/// A plain grouped surface. Used sparingly: typography and spacing carry most
/// of the hierarchy, and a screen of cards reads as a dashboard.
struct SurfaceCard: ViewModifier {
    var padding: CGFloat = Theme.Spacing.l

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.Palette.surface, in: .rect(cornerRadius: Theme.Radius.medium))
    }
}

extension View {
    func surfaceCard(padding: CGFloat = Theme.Spacing.l) -> some View {
        modifier(SurfaceCard(padding: padding))
    }
}

/// The small uppercase label above a section.
struct EyebrowLabel: View {
    let text: String
    var color: Color = Theme.Palette.accent

    var body: some View {
        Text(text.uppercased())
            .font(Theme.Typography.eyebrow)
            .tracking(0.8)
            .foregroundStyle(color)
            .accessibilityAddTraits(.isHeader)
    }
}
