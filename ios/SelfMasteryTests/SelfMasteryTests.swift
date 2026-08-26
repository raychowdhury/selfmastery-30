import Foundation
import Testing

@testable import SelfMastery

/// Tests cover the logic that would silently corrupt what a person sees:
/// date handling, API decoding, optimistic completion maths, Minimum Day
/// semantics and the notification schedule.

// MARK: - Calendar days

@Suite("Calendar days")
struct CalendarDayTests {
    @Test("Parses the API's yyyy-MM-dd shape")
    func parsesIsoDate() throws {
        let day = try #require(CalendarDay("2026-08-26"))
        #expect(day.year == 2026)
        #expect(day.month == 8)
        #expect(day.day == 26)
        #expect(day.description == "2026-08-26")
    }

    @Test("Rejects anything that is not a calendar day")
    func rejectsMalformed() {
        #expect(CalendarDay("2026-08") == nil)
        #expect(CalendarDay("not-a-date") == nil)
        #expect(CalendarDay("") == nil)
    }

    /// The bug this guards against: a calendar day rendered through a local
    /// formatter shifts by one for anybody west of UTC.
    @Test("Renders as the day it means, not shifted by the timezone")
    func doesNotShiftAcrossTimezones() throws {
        let day = try #require(CalendarDay("2026-08-26"))
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = .current
        let parts = calendar.dateComponents([.year, .month, .day], from: day.localDate)

        #expect(parts.year == 2026)
        #expect(parts.month == 8)
        #expect(parts.day == 26)
    }

    @Test("Anchors to UTC midnight for arithmetic")
    func anchorsToUTC() throws {
        let day = try #require(CalendarDay("2026-08-26"))
        let formatter = ISO8601DateFormatter()
        formatter.timeZone = TimeZone(identifier: "UTC")
        #expect(formatter.string(from: day.utcDate) == "2026-08-26T00:00:00Z")
    }

    @Test("Orders chronologically")
    func ordersCorrectly() throws {
        let earlier = try #require(CalendarDay("2026-08-26"))
        let later = try #require(CalendarDay("2026-09-02"))
        #expect(earlier < later)
    }

    @Test("Takes today from the local calendar")
    func todayUsesLocalCalendar() {
        let now = Date()
        let today = CalendarDay(date: now)
        let parts = Calendar.current.dateComponents([.year, .month, .day], from: now)
        #expect(today.year == parts.year)
        #expect(today.day == parts.day)
    }
}

@Suite("Instants")
struct InstantTests {
    @Test("Parses timestamps with and without fractional seconds")
    func parsesBothForms() {
        #expect(Instant.parse("2026-08-26T14:03:00.000Z") != nil)
        #expect(Instant.parse("2026-08-26T14:03:00Z") != nil)
        #expect(Instant.parse(nil) == nil)
        #expect(Instant.parse("nonsense") == nil)
    }
}

@Suite("Duration formatting")
struct DurationTests {
    @Test("Reads as minutes below an hour and hours above")
    func formatsSensibly() {
        #expect(5.formattedMinutes == "5 min")
        #expect(45.formattedMinutes == "45 min")
        #expect(60.formattedMinutes == "1h")
        #expect(90.formattedMinutes == "1h 30m")
        #expect(120.formattedMinutes == "2h")
    }
}

// MARK: - Decoding

@Suite("API decoding")
struct DecodingTests {
    private func decode<T: Decodable>(_ type: T.Type, _ json: String) throws -> T {
        try JSONDecoder().decode(type, from: Data(json.utf8))
    }

    @Test("Decodes a today payload")
    func decodesToday() throws {
        let response = try decode(TodayResponse.self, Fixtures.today)

        #expect(response.challenge?.goal == "Become more physically active")
        #expect(response.dayNumber == 8)
        #expect(response.phaseLabel == "Build")
        #expect(response.day?.actions.count == 3)
        #expect(response.day?.completion.percent == 33)
        #expect(response.stats?.currentStreak == 5)
    }

    /// A signed-in user with no challenge is a normal state, not an error.
    @Test("Decodes the no-challenge state without failing")
    func decodesEmptyToday() throws {
        let response = try decode(TodayResponse.self, #"{"challenge":null}"#)
        #expect(response.challenge == nil)
        #expect(response.day == nil)
    }

    @Test("Decodes the shared error envelope")
    func decodesErrorEnvelope() throws {
        let envelope = try decode(
            APIErrorEnvelope.self,
            #"{"error":{"code":"unauthorized","message":"Your session has expired."}}"#
        )
        #expect(envelope.error.code == "unauthorized")

        let error = APIError.from(status: 401, envelope: envelope)
        #expect(error.requiresSignOut)
        #expect(error.userMessage == "Your session has expired.")
    }

    @Test("Carries field errors through to the form")
    func decodesFieldErrors() throws {
        let envelope = try decode(
            APIErrorEnvelope.self,
            #"{"error":{"code":"conflict","message":"Taken.","fields":{"email":"That email is already registered."}}}"#
        )
        let error = APIError.from(status: 409, envelope: envelope)

        guard case .validation(_, let fields) = error else {
            Issue.record("Expected a validation error")
            return
        }
        #expect(fields["email"] == "That email is already registered.")
    }

    @Test("Maps calendar day states")
    func decodesCalendarStates() throws {
        let day = try decode(
            CalendarDayDTO.self,
            #"{"dayNumber":5,"date":"2026-08-23","state":"MINIMUM","percent":100,"isMinimumDay":true}"#
        )
        #expect(day.dayState == .minimum)
    }

    @Test("Falls back rather than throwing on an unknown state")
    func unknownStateFallsBack() throws {
        let day = try decode(
            CalendarDayDTO.self,
            #"{"dayNumber":5,"date":"2026-08-23","state":"SOMETHING_NEW","percent":0,"isMinimumDay":false}"#
        )
        #expect(day.dayState == .future)
    }
}

// MARK: - Errors

@Suite("Error handling")
struct APIErrorTests {
    @Test("Only a 401 forces sign-out")
    func onlyUnauthorizedSignsOut() {
        #expect(APIError.unauthorized("gone").requiresSignOut)
        #expect(!APIError.offline.requiresSignOut)
        #expect(!APIError.server("oops").requiresSignOut)
        #expect(!APIError.rateLimited("slow down").requiresSignOut)
    }

    @Test("Offline message tells the person what happens next")
    func offlineMessageIsReassuring() {
        #expect(APIError.offline.userMessage.contains("sync when you're connected"))
    }

    @Test("Decoding failures never leak internals to the person")
    func decodingErrorIsGeneric() {
        let message = APIError.decoding("keyNotFound(CodingKeys(stringValue: \"id\"))").userMessage
        #expect(!message.contains("CodingKeys"))
        #expect(!message.contains("keyNotFound"))
    }
}

// MARK: - Notifications

@Suite("Notification schedule")
struct NotificationPlanTests {
    @Test("Preferred time decides when the goal reminder lands")
    func mapsPreferredTimeToHour() {
        #expect(NotificationPlan.hour(forPreferredTime: "MORNING") == 9)
        #expect(NotificationPlan.hour(forPreferredTime: "AFTERNOON") == 14)
        #expect(NotificationPlan.hour(forPreferredTime: "EVENING") == 19)
    }

    /// Flexible means there is no fixed time, so we do not invent one.
    @Test("Flexible schedules no goal-time reminder")
    func flexibleSchedulesNothing() {
        #expect(NotificationPlan.hour(forPreferredTime: "FLEXIBLE") == nil)

        let planned = NotificationPlan.build(
            preferences: ReminderPreferences(
                morning: false, goalTime: true, evening: false, weeklyReview: false
            ),
            preferredTime: "FLEXIBLE",
            dayNumber: 3
        )
        #expect(planned.isEmpty)
    }

    @Test("Nothing is scheduled when every reminder is off")
    func noRemindersWhenAllDisabled() {
        let planned = NotificationPlan.build(
            preferences: ReminderPreferences(
                morning: false, goalTime: false, evening: false, weeklyReview: false
            ),
            preferredTime: "MORNING",
            dayNumber: 1
        )
        #expect(planned.isEmpty)
    }

    @Test("Morning reminder names the day it is for")
    func morningMentionsDayNumber() throws {
        let planned = NotificationPlan.build(
            preferences: ReminderPreferences(
                morning: true, goalTime: false, evening: false, weeklyReview: false
            ),
            preferredTime: "MORNING",
            dayNumber: 6
        )
        let morning = try #require(planned.first)
        #expect(morning.body.contains("Day 6"))
        #expect(morning.hour == 8)
    }

    @Test("Weekly review repeats on one weekday")
    func weeklyReviewIsWeekly() throws {
        let planned = NotificationPlan.build(
            preferences: ReminderPreferences(
                morning: false, goalTime: false, evening: false, weeklyReview: true
            ),
            preferredTime: "MORNING",
            dayNumber: 7
        )
        let review = try #require(planned.first)
        #expect(review.weekday != nil)
    }

    /// The product voice rules out streak-loss language, so the copy is checked.
    @Test("Copy never threatens the person")
    func copyStaysCalm() {
        let planned = NotificationPlan.build(
            preferences: ReminderPreferences(),
            preferredTime: "MORNING",
            dayNumber: 4
        )
        let banned = ["don't break", "streak", "failed", "!!"]

        for notification in planned {
            let text = (notification.title + notification.body).lowercased()
            for phrase in banned {
                #expect(!text.contains(phrase), "Found \"\(phrase)\" in: \(text)")
            }
        }
    }
}

// MARK: - Fixtures

enum Fixtures {
    static let today = """
    {
      "challenge": {
        "id": "c1", "title": "Become more physically active",
        "goal": "Become more physically active",
        "whyItMatters": "I want more energy.",
        "successDefinition": "Walk 30 minutes five days a week.",
        "category": "fitness", "availableMinutes": 30,
        "difficulty": "BALANCED", "preferredTime": "MORNING",
        "obstacles": ["motivation"],
        "startDate": "2026-08-19", "endDate": "2026-09-17",
        "lengthDays": 30, "status": "ACTIVE",
        "pillars": [
          {"id":"p1","name":"Movement","description":"The activity itself.","icon":"footprints","sortOrder":0}
        ],
        "milestones": [
          {"id":"m1","dayNumber":7,"title":"You have moved on most days","description":null,"achieved":true}
        ]
      },
      "day": {
        "id": "d8", "dayNumber": 8, "date": "2026-08-26", "phase": "BUILD",
        "isMinimumDay": false, "completedAt": null,
        "actions": [
          {"id":"a1","title":"Walk for 15 minutes","description":"Build the habit first.",
           "estimatedMinutes":15,"completed":true,"optional":false,
           "pillarId":"p1","pillarName":"Movement","sortOrder":0,
           "minimumTitle":"Walk 5 minutes","minimumMinutes":5},
          {"id":"a2","title":"Stretch gently for 5 minutes","description":null,
           "estimatedMinutes":5,"completed":false,"optional":false,
           "pillarId":"p1","pillarName":"Movement","sortOrder":1,
           "minimumTitle":"Stretch for 3 minutes","minimumMinutes":3},
          {"id":"a3","title":"Drink water with each meal","description":null,
           "estimatedMinutes":5,"completed":false,"optional":true,
           "pillarId":null,"pillarName":null,"sortOrder":2,
           "minimumTitle":null,"minimumMinutes":null}
        ],
        "priorities": [{"position":1,"text":"Walk after dinner","completed":false}],
        "reflection": null,
        "completion": {"required": 3, "completed": 1, "percent": 33}
      },
      "dayNumber": 8,
      "phaseLabel": "Build",
      "stats": {
        "overallCompletion": 68, "activeDays": 6, "perfectDays": 4,
        "minimumDays": 1, "currentStreak": 5, "longestStreak": 5,
        "actionsCompleted": 14, "minutesCompleted": 210
      },
      "reviewDue": null,
      "isOver": false
    }
    """
}
