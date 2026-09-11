import SwiftUI

/// Life Happens.
///
/// No reason is asked for, nothing is recorded as a failure, and the original
/// plan is preserved so the day can be switched back. The copy is the whole
/// feature: reduce the requirement, not the commitment.
struct MinimumDaySheet: View {
    /// Original → reduced title for every action that has a smaller version.
    let reductions: [(from: String, to: String)]
    let confirm: () -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        // Scrolls rather than clips: the title wraps to two lines, and at
        // larger Dynamic Type sizes the whole sheet needs to move.
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Keep the commitment.\nReduce the requirement.")
                    .calmHeading(20)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityAddTraits(.isHeader)

                Text("Today's plan shrinks to its smallest meaningful version. Showing up small still counts.")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.Palette.secondaryText)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, Theme.Spacing.m)

                if !reductions.isEmpty {
                    VStack(spacing: 0) {
                        ForEach(Array(reductions.enumerated()), id: \.offset) { index, reduction in
                            if index > 0 { CalmRule() }
                            HStack(alignment: .top, spacing: Theme.Spacing.m) {
                                Text(reduction.from)
                                    .foregroundStyle(Theme.Palette.secondaryText)
                                Spacer(minLength: Theme.Spacing.m)
                                Text(reduction.to)
                                    .multilineTextAlignment(.trailing)
                            }
                            .font(.system(size: 14))
                            .padding(.vertical, Theme.Spacing.m)
                            .accessibilityElement(children: .combine)
                            .accessibilityLabel(
                                "Instead of \(reduction.from), today becomes \(reduction.to)"
                            )
                        }
                    }
                    .padding(.top, Theme.Spacing.xl)
                }

                VStack(spacing: Theme.Spacing.s) {
                    PrimaryButton(title: "Switch to a minimum day") {
                        confirm()
                        dismiss()
                    }
                    SecondaryButton(title: "Keep the original plan") { dismiss() }
                }
                .padding(.top, Theme.Spacing.xxl)
            }
            .padding(.horizontal, 28)
            .padding(.top, Theme.Spacing.xxl)
            .padding(.bottom, Theme.Spacing.xl)
        }
        .background(Theme.Palette.background)
        .overlay(alignment: .top) {
            // The Calm sheet's accent hairline along its top edge.
            Theme.Palette.accent.opacity(0.3).frame(height: 1)
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
}

#Preview {
    Color.clear.sheet(isPresented: .constant(true)) {
        MinimumDaySheet(reductions: [
            (from: "Walk for 30 minutes", to: "Walk 5 minutes"),
            (from: "Write one page", to: "Write one sentence"),
        ]) {}
    }
}
