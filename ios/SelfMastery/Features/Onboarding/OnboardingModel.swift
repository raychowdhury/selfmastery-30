import Foundation
import Observation

/// Drives the onboarding questions and builds the request that creates a plan.
///
/// The content — categories, goal examples, safety notes — is fetched rather
/// than hardcoded, so adding a strategy on the server reaches installed apps
/// without a release.
@MainActor
@Observable
final class OnboardingModel {
    enum Step: Int, CaseIterable {
        case category, goal, why, time, obstacles, preferredTime, difficulty, success

        var title: String {
            switch self {
            case .category: "What would make the next 30 days meaningful?"
            case .goal: "What specifically would you like to accomplish?"
            case .why: "Why does this matter to you?"
            case .time: "How much time can you realistically give this each day?"
            case .obstacles: "What usually gets in your way?"
            case .preferredTime: "When are you most likely to do it?"
            case .difficulty: "How challenging should your plan feel?"
            case .success: "What would make Day 30 successful?"
            }
        }

        var subtitle: String? {
            switch self {
            case .category: "Pick one area. You can change it later."
            case .goal: "One sentence in your own words. Specific beats impressive."
            case .why: "Optional — we'll show this back to you on the days it gets hard."
            case .time: "Realistically. Pick the amount you could still manage on a bad day."
            case .obstacles: "Pick as many as apply. We'll build around them."
            case .preferredTime: "This decides when reminders arrive."
            case .difficulty: nil
            case .success: "Something you could actually check."
            }
        }
    }

    private(set) var step: Step = .category
    private(set) var options: OnboardingOptionsResponse?
    private(set) var isLoading = true
    private(set) var isSubmitting = false
    private(set) var loadError: String?
    private(set) var submitError: String?

    // Answers
    var category = ""
    var freeTextCategory = ""
    var goal = ""
    var whyItMatters = ""
    var availableMinutes = 30
    var customMinutes = ""
    var obstacles: Set<String> = []
    var preferredTime = "FLEXIBLE"
    var difficulty = "BALANCED"
    var successDefinition = ""
    var startDate = CalendarDay.today()

    private let api: SelfMasteryAPI

    init(api: SelfMasteryAPI) {
        self.api = api
    }

    var progress: Double {
        Double(step.rawValue + 1) / Double(Step.allCases.count)
    }

    var stepNumber: Int { step.rawValue + 1 }
    var stepCount: Int { Step.allCases.count }

    /// Goal examples for the chosen category, straight from the plan strategy.
    var goalExamples: [String] {
        options?.strategies.first { $0.slug == category }?.goalExamples ?? []
    }

    /// Shown for domains where the app must not sound like a professional.
    var safetyNote: String? {
        options?.strategies.first { $0.slug == category }?.safetyNote
    }

    var canAdvance: Bool {
        switch step {
        case .category:
            !category.isEmpty || freeTextCategory.trimmed.count > 2
        case .goal:
            goal.trimmed.count > 2
        case .time:
            availableMinutes >= 5
        default:
            true
        }
    }

    var isFinalStep: Bool { step == .success }

    func load() async {
        isLoading = true
        loadError = nil
        do {
            options = try await api.onboardingOptions()
        } catch let error as APIError {
            loadError = error.userMessage
        } catch {
            loadError = "Couldn't load. Try again."
        }
        isLoading = false
    }

    func advance() {
        // Free text is a first-class answer: it becomes the goal and routes to
        // the generic strategy.
        if step == .category, category.isEmpty, !freeTextCategory.trimmed.isEmpty {
            category = "custom"
            goal = freeTextCategory.trimmed
        }

        guard let next = Step(rawValue: step.rawValue + 1) else { return }
        step = next
    }

    /// Returns false when there is nowhere back to go, so the view can dismiss.
    @discardableResult
    func goBack() -> Bool {
        guard let previous = Step(rawValue: step.rawValue - 1) else { return false }
        step = previous
        return true
    }

    func request() -> OnboardingRequest {
        OnboardingRequest(
            category: category.isEmpty ? "custom" : category,
            goal: goal.trimmed,
            whyItMatters: whyItMatters.trimmed,
            successDefinition: successDefinition.trimmed,
            availableMinutes: availableMinutes,
            obstacles: Array(obstacles),
            preferredTime: preferredTime,
            difficulty: difficulty,
            startDate: startDate.description
        )
    }

    /// Creates the challenge. The plan is generated on the server — the device
    /// never assembles one.
    func submit() async -> ChallengeDTO? {
        guard !isSubmitting else { return nil }
        isSubmitting = true
        submitError = nil
        defer { isSubmitting = false }

        do {
            return try await api.createChallenge(request()).challenge
        } catch let error as APIError {
            submitError = error.userMessage
            return nil
        } catch {
            submitError = "Couldn't build your plan. Try again."
            return nil
        }
    }
}

extension String {
    var trimmed: String { trimmingCharacters(in: .whitespacesAndNewlines) }
}
