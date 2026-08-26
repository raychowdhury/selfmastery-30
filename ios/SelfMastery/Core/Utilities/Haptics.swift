import UIKit

/// Restrained haptic feedback.
///
/// Completion gets a light tap rather than a success chime: a person may tap
/// four of these in a row, and anything heavier becomes irritating quickly.
@MainActor
enum Haptics {
    static func actionCompleted() {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }

    static func dayFinished() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }

    static func selection() {
        UISelectionFeedbackGenerator().selectionChanged()
    }

    static func warning() {
        UINotificationFeedbackGenerator().notificationOccurred(.warning)
    }
}
