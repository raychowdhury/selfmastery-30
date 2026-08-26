import Foundation

/// A date with no time and no timezone — the thing the API calls `"2026-08-26"`.
///
/// Modelling it as its own type stops it being mixed up with an instant. Every
/// conversion anchors to UTC, matching the server, so a user east or west of
/// UTC never sees a day shift by one.
struct CalendarDay: Hashable, Sendable, Comparable, CustomStringConvertible {
    let year: Int
    let month: Int
    let day: Int

    private static let utc = TimeZone(identifier: "UTC")!

    init?(_ raw: String) {
        let parts = raw.split(separator: "-")
        guard parts.count == 3,
              let year = Int(parts[0]),
              let month = Int(parts[1]),
              let day = Int(parts[2]) else { return nil }
        self.year = year
        self.month = month
        self.day = day
    }

    init(date: Date, timeZone: TimeZone = .current) {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timeZone
        let parts = calendar.dateComponents([.year, .month, .day], from: date)
        year = parts.year ?? 1970
        month = parts.month ?? 1
        day = parts.day ?? 1
    }

    static func today() -> CalendarDay { CalendarDay(date: Date()) }

    var description: String {
        String(format: "%04d-%02d-%02d", year, month, day)
    }

    /// Midnight UTC, for arithmetic and comparison only — never for display.
    var utcDate: Date {
        var components = DateComponents()
        components.year = year
        components.month = month
        components.day = day
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = Self.utc
        return calendar.date(from: components) ?? Date(timeIntervalSince1970: 0)
    }

    /// The same year/month/day expressed locally, so formatters print the day
    /// that was meant rather than shifting it.
    var localDate: Date {
        var components = DateComponents()
        components.year = year
        components.month = month
        components.day = day
        return Calendar.current.date(from: components) ?? Date()
    }

    static func < (lhs: CalendarDay, rhs: CalendarDay) -> Bool {
        (lhs.year, lhs.month, lhs.day) < (rhs.year, rhs.month, rhs.day)
    }
}

extension CalendarDay {
    /// "Wednesday, 26 August"
    func formattedLong() -> String {
        localDate.formatted(.dateTime.weekday(.wide).day().month(.wide))
    }

    /// "26 Aug 2026"
    func formattedShort() -> String {
        localDate.formatted(.dateTime.day().month(.abbreviated).year())
    }
}

/// An ISO-8601 instant from the API.
enum Instant {
    static func parse(_ raw: String?) -> Date? {
        guard let raw else { return nil }
        let withFractional = ISO8601DateFormatter()
        withFractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = withFractional.date(from: raw) { return date }

        let plain = ISO8601DateFormatter()
        plain.formatOptions = [.withInternetDateTime]
        return plain.date(from: raw)
    }
}

extension Int {
    /// "45 min" / "1h 15m" — durations read better than raw minutes.
    var formattedMinutes: String {
        if self < 60 { return "\(self) min" }
        let hours = self / 60
        let minutes = self % 60
        return minutes == 0 ? "\(hours)h" : "\(hours)h \(minutes)m"
    }
}
