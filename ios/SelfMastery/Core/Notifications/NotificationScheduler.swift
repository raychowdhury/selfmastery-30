import Foundation
import UserNotifications

/// Local notifications.
///
/// Local rather than remote on purpose: everything worth nudging about is
/// already known on the device, and remote push would mean holding a device
/// token for every user for no extra benefit in V1.
///
/// Permission is never requested at launch. It is asked for after onboarding,
/// once there is a plan and the reminder has an obvious point.

enum Reminder: String, CaseIterable, Sendable {
    case morning
    case goalTime
    case evening
    case weeklyReview

    var identifier: String { "selfmastery.\(rawValue)" }

    var title: String {
        switch self {
        case .morning: "Today's plan is ready"
        case .goalTime: "Time for today's action"
        case .evening: "Close out today"
        case .weeklyReview: "Your weekly review is ready"
        }
    }
}

/// One scheduled reminder, described but not yet registered.
struct PlannedNotification: Equatable, Sendable {
    let reminder: Reminder
    let title: String
    let body: String
    let hour: Int
    let minute: Int
    /// 1 = Sunday. Nil means every day.
    let weekday: Int?
}

/// Turns preferences into a schedule.
///
/// Pure and separate from the notification centre so the rules — which
/// reminders fire, when, and what they say — can be tested without a device.
enum NotificationPlan {
    /// The hour a "goal time" nudge should land, or nil when the person chose
    /// Flexible: there is no fixed time to nudge, so we do not invent one.
    static func hour(forPreferredTime preferredTime: String) -> Int? {
        switch preferredTime {
        case "MORNING": 9
        case "AFTERNOON": 14
        case "EVENING": 19
        default: nil
        }
    }

    static func build(
        preferences: ReminderPreferences,
        preferredTime: String,
        dayNumber: Int
    ) -> [PlannedNotification] {
        var planned: [PlannedNotification] = []

        if preferences.morning {
            planned.append(
                PlannedNotification(
                    reminder: .morning,
                    title: Reminder.morning.title,
                    body: "Your Day \(max(1, dayNumber)) plan is ready.",
                    hour: 8,
                    minute: 0,
                    weekday: nil
                )
            )
        }

        if preferences.goalTime, let hour = hour(forPreferredTime: preferredTime) {
            planned.append(
                PlannedNotification(
                    reminder: .goalTime,
                    title: Reminder.goalTime.title,
                    body: "A few minutes now is all today asks for.",
                    hour: hour,
                    minute: 0,
                    weekday: nil
                )
            )
        }

        if preferences.evening {
            planned.append(
                PlannedNotification(
                    reminder: .evening,
                    title: Reminder.evening.title,
                    body: "Take a minute to close out today.",
                    hour: 20,
                    minute: 30,
                    weekday: nil
                )
            )
        }

        if preferences.weeklyReview {
            planned.append(
                PlannedNotification(
                    reminder: .weeklyReview,
                    title: Reminder.weeklyReview.title,
                    body: "Two minutes of looking back shapes next week.",
                    hour: 18,
                    minute: 0,
                    weekday: 1
                )
            )
        }

        return planned
    }
}

/// Applies a plan to the system. Deliberately thin.
struct NotificationScheduler: Sendable {
    private var center: UNUserNotificationCenter { .current() }

    func requestAuthorization() async -> Bool {
        (try? await center.requestAuthorization(options: [.alert, .sound, .badge])) ?? false
    }

    func authorizationStatus() async -> UNAuthorizationStatus {
        await center.notificationSettings().authorizationStatus
    }

    /// Rebuilds the schedule from scratch — cheaper to reason about than
    /// diffing, and there are only ever a handful of requests.
    func apply(
        preferences: ReminderPreferences,
        preferredTime: String,
        dayNumber: Int
    ) async {
        await cancelAll()

        for planned in NotificationPlan.build(
            preferences: preferences,
            preferredTime: preferredTime,
            dayNumber: dayNumber
        ) {
            var components = DateComponents()
            components.hour = planned.hour
            components.minute = planned.minute
            if let weekday = planned.weekday { components.weekday = weekday }

            let content = UNMutableNotificationContent()
            content.title = planned.title
            content.body = planned.body
            content.sound = .default

            let request = UNNotificationRequest(
                identifier: planned.reminder.identifier,
                content: content,
                trigger: UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
            )
            try? await center.add(request)
        }
    }

    func cancelAll() async {
        center.removeAllPendingNotificationRequests()
    }
}

/// Which reminders are on. Stored on the device: a local preference, not
/// account data.
struct ReminderPreferences: Codable, Sendable, Equatable {
    var morning = true
    var goalTime = true
    var evening = false
    var weeklyReview = true

    static let storageKey = "reminder-preferences"

    static func load() -> ReminderPreferences {
        guard
            let data = UserDefaults.standard.data(forKey: storageKey),
            let decoded = try? JSONDecoder().decode(ReminderPreferences.self, from: data)
        else { return ReminderPreferences() }
        return decoded
    }

    func save() {
        guard let data = try? JSONEncoder().encode(self) else { return }
        UserDefaults.standard.set(data, forKey: Self.storageKey)
    }
}
