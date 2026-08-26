import Foundation

/// Wire types mirroring `/api/mobile/v1`.
///
/// Dates arrive in two deliberately different shapes and are kept as strings
/// here rather than forced through one `dateDecodingStrategy`:
///
/// - a *calendar day* is `"2026-08-26"` — a date, with no timezone to apply
/// - an *instant* is a full ISO-8601 timestamp
///
/// `CalendarDay` and `Instant` turn them into values at the edge.

// MARK: - Account

struct UserDTO: Codable, Sendable, Identifiable, Hashable {
    let id: String
    let name: String?
    let email: String
    let createdAt: String
}

struct AuthResponse: Codable, Sendable {
    let token: String
    let expiresAt: String
    let user: UserDTO
}

struct MeResponse: Codable, Sendable {
    let user: UserDTO
    let hasActiveChallenge: Bool
}

// MARK: - Challenge

struct PillarDTO: Codable, Sendable, Identifiable, Hashable {
    let id: String
    let name: String
    let description: String?
    let icon: String
    let sortOrder: Int
}

struct MilestoneDTO: Codable, Sendable, Identifiable, Hashable {
    let id: String
    let dayNumber: Int
    let title: String
    let description: String?
    let achieved: Bool
}

struct ChallengeDTO: Codable, Sendable, Identifiable, Hashable {
    let id: String
    let title: String
    let goal: String
    let whyItMatters: String?
    let successDefinition: String?
    let category: String
    let availableMinutes: Int
    let difficulty: String
    let preferredTime: String
    let obstacles: [String]
    let startDate: String
    let endDate: String
    let lengthDays: Int
    let status: String
    let pillars: [PillarDTO]
    let milestones: [MilestoneDTO]
}

// MARK: - Day

struct ActionDTO: Codable, Sendable, Identifiable, Hashable {
    let id: String
    let title: String
    let description: String?
    let estimatedMinutes: Int
    let completed: Bool
    let optional: Bool
    let pillarId: String?
    let pillarName: String?
    let sortOrder: Int
    /// The reduced version shown in the Minimum Day sheet.
    let minimumTitle: String?
    let minimumMinutes: Int?
}

struct PriorityDTO: Codable, Sendable, Hashable, Identifiable {
    let position: Int
    let text: String
    let completed: Bool

    var id: Int { position }
}

struct ReflectionDTO: Codable, Sendable, Hashable {
    let dayFeeling: String?
    let note: String?
    let whatHelped: String?
    let whatGotInWay: String?
}

struct CompletionDTO: Codable, Sendable, Hashable {
    let required: Int
    let completed: Int
    let percent: Int
}

struct DayDTO: Codable, Sendable, Identifiable, Hashable {
    let id: String
    let dayNumber: Int
    let date: String
    let phase: String
    let isMinimumDay: Bool
    let completedAt: String?
    let actions: [ActionDTO]
    let priorities: [PriorityDTO]
    let reflection: ReflectionDTO?
    let completion: CompletionDTO
}

// MARK: - Screens

struct StatsDTO: Codable, Sendable, Hashable {
    let overallCompletion: Int
    let activeDays: Int
    let perfectDays: Int
    let minimumDays: Int
    let currentStreak: Int
    let longestStreak: Int
    let actionsCompleted: Int
    let minutesCompleted: Int
}

/// `challenge` is nil for a signed-in user who has not started one yet — a
/// normal state the app routes on, not an error.
struct TodayResponse: Codable, Sendable {
    let challenge: ChallengeDTO?
    let day: DayDTO?
    let dayNumber: Int?
    let phaseLabel: String?
    let stats: StatsDTO?
    let reviewDue: Int?
    let isOver: Bool?
}

struct CalendarDayDTO: Codable, Sendable, Identifiable, Hashable {
    let dayNumber: Int
    let date: String
    let state: String
    let percent: Int
    let isMinimumDay: Bool

    var id: Int { dayNumber }

    enum State: String {
        case future = "FUTURE"
        case today = "TODAY"
        case perfect = "PERFECT"
        case complete = "COMPLETE"
        case partial = "PARTIAL"
        case minimum = "MINIMUM"
        case missed = "MISSED"
    }

    var dayState: State { State(rawValue: state) ?? .future }
}

struct PillarProgressDTO: Codable, Sendable, Identifiable, Hashable {
    let pillarId: String
    let name: String
    let scheduled: Int
    let completed: Int
    let percent: Int

    var id: String { pillarId }
}

struct InsightDTO: Codable, Sendable, Identifiable, Hashable {
    let id: String
    let text: String
}

struct AdjustmentDTO: Codable, Sendable, Identifiable, Hashable {
    let id: String
    let summary: String
    let rationale: String
    let appliedFromDay: Int
    let daysAffected: Int
    let createdAt: String
}

struct ProgressResponse: Codable, Sendable {
    let stats: StatsDTO?
    let days: [CalendarDayDTO]?
    let pillars: [PillarProgressDTO]?
    let insights: [InsightDTO]?
    let adjustments: [AdjustmentDTO]?
    let dayNumber: Int?
    let lengthDays: Int?
}

// MARK: - Reviews

struct WeeklyReviewDTO: Codable, Sendable, Identifiable, Hashable {
    let weekNumber: Int
    let closingDay: Int
    let unlocked: Bool
    let completed: Bool
    let completionRate: Int
    let minimumDays: Int
    let frequentlySkipped: [String]
    let wentWell: String?
    let struggledWith: String?
    let mainObstacle: [String]
    let difficultyFeedback: String?
    let nextWeekChange: String?

    var id: Int { weekNumber }
}

struct ReviewsResponse: Codable, Sendable {
    let reviews: [WeeklyReviewDTO]
}

struct ReviewSubmissionResponse: Codable, Sendable {
    struct Adjustment: Codable, Sendable {
        let direction: String
        let summary: String
        let rationale: String
    }

    let adjustment: Adjustment
    let reviews: [WeeklyReviewDTO]
}

// MARK: - Onboarding content

struct OnboardingCategoryDTO: Codable, Sendable, Identifiable, Hashable {
    let slug: String
    let label: String
    let description: String
    let icon: String

    var id: String { slug }
}

struct ObstacleDTO: Codable, Sendable, Identifiable, Hashable {
    let slug: String
    let label: String

    var id: String { slug }
}

struct LabelledOptionDTO: Codable, Sendable, Identifiable, Hashable {
    let value: String
    let label: String
    let description: String?

    var id: String { value }
}

struct StrategyDTO: Codable, Sendable, Identifiable, Hashable {
    let slug: String
    let label: String
    let goalExamples: [String]
    let safetyNote: String?

    var id: String { slug }
}

struct OnboardingOptionsResponse: Codable, Sendable {
    let categories: [OnboardingCategoryDTO]
    let obstacles: [ObstacleDTO]
    let timeOptions: [Int]
    let difficulties: [LabelledOptionDTO]
    let preferredTimes: [LabelledOptionDTO]
    let strategies: [StrategyDTO]
}

// MARK: - History

struct HistoryEntryDTO: Codable, Sendable, Identifiable, Hashable {
    struct FinalReflection: Codable, Sendable, Hashable {
        let reflection: String?
        let biggestChange: String?
        let nextGoal: String?
    }

    let challenge: ChallengeDTO
    let finalReflection: FinalReflection?

    var id: String { challenge.id }
}

struct HistoryResponse: Codable, Sendable {
    let challenges: [HistoryEntryDTO]
}

struct ChallengeResponse: Codable, Sendable {
    let challenge: ChallengeDTO?
}

// MARK: - Requests

struct OnboardingRequest: Codable, Sendable {
    var category: String
    var goal: String
    var whyItMatters: String
    var successDefinition: String
    var availableMinutes: Int
    var obstacles: [String]
    var preferredTime: String
    var difficulty: String
    var startDate: String
}

struct EmptyResponse: Codable, Sendable {}
