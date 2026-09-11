import SwiftUI

/// One daily action, at the Calm design's density: a title, a time, and a
/// circle. Done actions dim to the muted colour — no strikethrough, no badges.
/// Completed rows stay visible; seeing what you have already done is most of
/// the point.
struct ActionRow: View {
    let action: ActionDTO
    var isSaving = false
    var isReadOnly = false
    let toggle: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        VStack(spacing: 0) {
            HStack(alignment: .center, spacing: Theme.Spacing.l) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(action.title)
                        .font(.system(size: 17))
                        .foregroundStyle(
                            action.completed
                                ? Theme.Palette.text.opacity(0.6)
                                : Theme.Palette.text
                        )
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)

                    Text(metaLine)
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.Palette.secondaryText)
                }

                Spacer(minLength: Theme.Spacing.s)

                Button(action: toggle) {
                    ZStack {
                        if action.completed {
                            Circle()
                                .strokeBorder(Theme.Palette.accent, lineWidth: 1.5)
                                .frame(width: 28, height: 28)
                            Image(systemName: "checkmark")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(Theme.Palette.accent)
                        } else {
                            Circle()
                                .strokeBorder(Theme.Palette.text.opacity(0.35), lineWidth: 1.5)
                                .frame(width: 28, height: 28)
                        }

                        if isSaving {
                            ProgressView().controlSize(.small)
                        }
                    }
                    // A 44pt target around a 28pt control, per the HIG.
                    .frame(width: 44, height: 44)
                    .contentShape(.rect)
                }
                .buttonStyle(.plain)
                .disabled(isReadOnly)
                .animation(reduceMotion ? nil : .snappy(duration: 0.2), value: action.completed)
            }
            .padding(.vertical, 18)

            CalmRule()
        }
        .contentShape(.rect)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(accessibilityLabel)
        .accessibilityValue(action.completed ? "Done" : "Not done")
        .accessibilityHint(isReadOnly ? "" : "Double tap to mark \(action.completed ? "not done" : "done")")
        .accessibilityAddTraits(action.completed ? [.isButton, .isSelected] : .isButton)
        .accessibilityAction { if !isReadOnly { toggle() } }
    }

    private var metaLine: String {
        action.optional
            ? "\(action.estimatedMinutes) min · optional"
            : "\(action.estimatedMinutes) min"
    }

    private var accessibilityLabel: String {
        var parts = [action.title, action.estimatedMinutes.formattedMinutes]
        if action.optional { parts.append("Optional") }
        if let description = action.description, !description.isEmpty {
            parts.append(description)
        }
        return parts.joined(separator: ", ")
    }
}

#Preview("Action rows") {
    VStack(spacing: 0) {
        ActionRow(action: .preview(completed: false)) {}
        ActionRow(action: .preview(completed: true)) {}
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
