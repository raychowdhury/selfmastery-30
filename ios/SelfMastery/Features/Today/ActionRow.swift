import SwiftUI

/// One daily action.
///
/// Completed rows stay visible and are dimmed rather than removed — seeing what
/// you have already done is most of the point. The tick itself keeps full
/// contrast so it is obvious at a glance which way the row went.
struct ActionRow: View {
    let action: ActionDTO
    var isSaving = false
    var isReadOnly = false
    let toggle: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        HStack(alignment: .top, spacing: Theme.Spacing.m) {
            VStack(alignment: .leading, spacing: Theme.Spacing.s) {
                Text(action.title)
                    .font(Theme.Typography.actionTitle)
                    .strikethrough(action.completed, color: Theme.Palette.secondaryText)
                    .foregroundStyle(Theme.Palette.text)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)

                if let description = action.description, !description.isEmpty {
                    Text(description)
                        .font(Theme.Typography.caption)
                        .foregroundStyle(Theme.Palette.secondaryText)
                        .fixedSize(horizontal: false, vertical: true)
                }

                HStack(spacing: Theme.Spacing.s) {
                    Chip(text: action.estimatedMinutes.formattedMinutes)
                    if let pillar = action.pillarName {
                        Chip(text: pillar, tint: Theme.Palette.accent, bordered: true)
                    }
                    if action.optional {
                        Chip(text: "Optional")
                    }
                }
            }
            .opacity(action.completed ? 0.55 : 1)

            Spacer(minLength: Theme.Spacing.s)

            Button(action: toggle) {
                ZStack {
                    if action.completed {
                        Circle()
                            .fill(Theme.Palette.accent)
                            .frame(width: 30, height: 30)
                        Image(systemName: "checkmark")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(.white)
                    } else {
                        Circle()
                            .strokeBorder(Theme.Palette.separator, lineWidth: 1.5)
                            .frame(width: 30, height: 30)
                    }

                    if isSaving {
                        ProgressView().controlSize(.small)
                    }
                }
                // A 44pt target around a 30pt control, per the HIG.
                .frame(width: 44, height: 44)
                .contentShape(.rect)
            }
            .buttonStyle(.plain)
            .disabled(isReadOnly)
            .animation(reduceMotion ? nil : .snappy(duration: 0.2), value: action.completed)
        }
        .padding(.vertical, Theme.Spacing.m)
        .contentShape(.rect)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(accessibilityLabel)
        .accessibilityValue(action.completed ? "Done" : "Not done")
        .accessibilityHint(isReadOnly ? "" : "Double tap to mark \(action.completed ? "not done" : "done")")
        .accessibilityAddTraits(action.completed ? [.isButton, .isSelected] : .isButton)
        .accessibilityAction { if !isReadOnly { toggle() } }
    }

    private var accessibilityLabel: String {
        var parts = [action.title, action.estimatedMinutes.formattedMinutes]
        if let pillar = action.pillarName { parts.append(pillar) }
        if action.optional { parts.append("Optional") }
        return parts.joined(separator: ", ")
    }
}

#Preview("Action rows") {
    VStack(spacing: 0) {
        ActionRow(action: .preview(completed: false)) {}
        Divider()
        ActionRow(action: .preview(completed: true)) {}
        Divider()
        ActionRow(action: .preview(completed: false, optional: true)) {}
    }
    .padding()
}

extension ActionDTO {
    /// Sample data for previews. Never used by a real screen.
    static func preview(
        completed: Bool = false,
        optional: Bool = false
    ) -> ActionDTO {
        ActionDTO(
            id: UUID().uuidString,
            title: optional ? "Drink water with each meal" : "Walk for 20 minutes",
            description: optional
                ? "An easy win that makes the rest of the day feel better."
                : "Build the habit before you increase the intensity.",
            estimatedMinutes: optional ? 5 : 20,
            completed: completed,
            optional: optional,
            pillarId: "p1",
            pillarName: optional ? "Energy" : "Movement",
            sortOrder: 0,
            minimumTitle: "Walk 5 minutes",
            minimumMinutes: 5
        )
    }
}
