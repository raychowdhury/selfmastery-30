import SwiftUI

/// Life Happens.
///
/// No reason is asked for, nothing is recorded as a failure, and the original
/// plan is preserved so the day can be switched back. The copy is the whole
/// feature: reduce the requirement, not the commitment.
struct MinimumDaySheet: View {
    let preview: (from: String, to: String)?
    let confirm: () -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            // Scrolls rather than clips: the title wraps to two lines, and at
            // larger Dynamic Type sizes the whole sheet needs to move.
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                VStack(alignment: .leading, spacing: Theme.Spacing.m) {
                    Text("Keep the commitment.\nReduce the requirement.")
                        .font(Theme.Typography.title)
                        .fixedSize(horizontal: false, vertical: true)

                    Text("Today's plan can shrink to its smallest meaningful version. Showing up small still counts as showing up, and your consistency stays intact.")
                        .font(.body)
                        .foregroundStyle(Theme.Palette.secondaryText)
                        .fixedSize(horizontal: false, vertical: true)
                }

                if let preview {
                    VStack(alignment: .leading, spacing: Theme.Spacing.m) {
                        ComparisonRow(label: "Original", value: preview.from, muted: true)
                        Divider()
                        ComparisonRow(label: "Minimum", value: preview.to, muted: false)
                    }
                    .surfaceCard()
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("Instead of \(preview.from), today becomes \(preview.to)")
                }

                VStack(spacing: Theme.Spacing.s) {
                    PrimaryButton(title: "Switch to Minimum Day") {
                        confirm()
                        dismiss()
                    }
                    SecondaryButton(title: "Keep Original Plan") { dismiss() }
                }
                .padding(.top, Theme.Spacing.l)
                }
                .padding(Theme.Spacing.xl)
            }
            .background(Theme.Palette.background)
            .navigationBarTitleDisplayMode(.inline)
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
}

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

#Preview {
    MinimumDaySheet(preview: (from: "Walk for 30 minutes", to: "Walk 5 minutes")) {}
}
