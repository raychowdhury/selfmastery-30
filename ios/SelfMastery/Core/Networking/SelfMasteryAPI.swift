import Foundation

/// Every endpoint the app can call, in one place.
///
/// Feature models depend on this rather than composing paths themselves, so a
/// route rename is a single edit and no screen can invent a URL.
struct SelfMasteryAPI: Sendable {
    let client: any APIClientProtocol

    init(client: any APIClientProtocol) {
        self.client = client
    }

    // MARK: Authentication

    private struct SignUpBody: Encodable, Sendable {
        let name: String
        let email: String
        let password: String
    }

    private struct SignInBody: Encodable, Sendable {
        let email: String
        let password: String
    }

    private struct EmailBody: Encodable, Sendable {
        let email: String
    }

    private struct PasswordBody: Encodable, Sendable {
        let password: String
    }

    private struct NameBody: Encodable, Sendable {
        let name: String
    }

    private struct CompletedBody: Encodable, Sendable {
        let completed: Bool
    }

    private struct MinimumBody: Encodable, Sendable {
        let isMinimumDay: Bool
    }

    private struct PrioritiesBody: Encodable, Sendable {
        let priorities: [PriorityDTO]
    }

    private struct ReflectionBody: Encodable, Sendable {
        let dayFeeling: String?
        let note: String?
    }

    private struct ReviewBody: Encodable, Sendable {
        let wentWell: String?
        let struggledWith: String?
        let mainObstacle: [String]
        let difficultyFeedback: String
        let nextWeekChange: String?
    }

    private struct FinalReflectionBody: Encodable, Sendable {
        let reflection: String?
        let biggestChange: String?
        let nextGoal: String?
    }

    func signUp(name: String, email: String, password: String) async throws -> AuthResponse {
        try await client.send(
            Endpoint(
                path: "auth/sign-up",
                method: .post,
                body: SignUpBody(name: name, email: email, password: password),
                requiresAuth: false
            )
        )
    }

    func signIn(email: String, password: String) async throws -> AuthResponse {
        try await client.send(
            Endpoint(
                path: "auth/sign-in",
                method: .post,
                body: SignInBody(email: email, password: password),
                requiresAuth: false
            )
        )
    }

    func signOut() async throws {
        try await client.send(Endpoint(path: "auth/sign-out", method: .post))
    }

    func requestPasswordReset(email: String) async throws {
        try await client.send(
            Endpoint(
                path: "auth/forgot-password",
                method: .post,
                body: EmailBody(email: email),
                requiresAuth: false
            )
        )
    }

    // MARK: Account

    func me() async throws -> MeResponse {
        try await client.send(Endpoint(path: "me"))
    }

    func updateName(_ name: String) async throws -> MeResponse {
        try await client.send(
            Endpoint(path: "me", method: .patch, body: NameBody(name: name))
        )
    }

    /// Permanent. Re-authentication is required by the server.
    func deleteAccount(password: String) async throws {
        try await client.send(
            Endpoint(path: "account", method: .delete, body: PasswordBody(password: password))
        )
    }

    // MARK: Content

    func onboardingOptions() async throws -> OnboardingOptionsResponse {
        try await client.send(Endpoint(path: "onboarding-options", requiresAuth: false))
    }

    // MARK: Challenge

    func createChallenge(_ request: OnboardingRequest) async throws -> ChallengeResponse {
        try await client.send(
            Endpoint(path: "challenges", method: .post, body: request)
        )
    }

    func today() async throws -> TodayResponse {
        try await client.send(Endpoint(path: "today"))
    }

    func day(number: Int) async throws -> DayDTO {
        try await client.send(
            Endpoint(path: "days", query: [URLQueryItem(name: "dayNumber", value: String(number))])
        )
    }

    func progress() async throws -> ProgressResponse {
        try await client.send(Endpoint(path: "progress"))
    }

    func history() async throws -> HistoryResponse {
        try await client.send(Endpoint(path: "challenges"))
    }

    // MARK: Day mutations

    func setAction(id: String, completed: Bool) async throws {
        try await client.send(
            Endpoint(path: "actions/\(id)", method: .patch, body: CompletedBody(completed: completed))
        )
    }

    func setMinimumDay(dayId: String, isMinimumDay: Bool) async throws {
        try await client.send(
            Endpoint(
                path: "days/\(dayId)/minimum",
                method: .put,
                body: MinimumBody(isMinimumDay: isMinimumDay)
            )
        )
    }

    func savePriorities(dayId: String, priorities: [PriorityDTO]) async throws {
        try await client.send(
            Endpoint(
                path: "days/\(dayId)/priorities",
                method: .put,
                body: PrioritiesBody(priorities: priorities)
            )
        )
    }

    func saveReflection(dayId: String, feeling: String?, note: String?) async throws {
        try await client.send(
            Endpoint(
                path: "days/\(dayId)/reflection",
                method: .put,
                body: ReflectionBody(dayFeeling: feeling, note: note)
            )
        )
    }

    func finishDay(dayId: String) async throws {
        try await client.send(Endpoint(path: "days/\(dayId)/finish", method: .post))
    }

    // MARK: Reviews

    func reviews() async throws -> ReviewsResponse {
        try await client.send(Endpoint(path: "reviews"))
    }

    func submitReview(
        week: Int,
        wentWell: String?,
        struggledWith: String?,
        obstacles: [String],
        difficulty: String,
        nextWeekChange: String?
    ) async throws -> ReviewSubmissionResponse {
        try await client.send(
            Endpoint(
                path: "reviews/\(week)",
                method: .put,
                body: ReviewBody(
                    wentWell: wentWell,
                    struggledWith: struggledWith,
                    mainObstacle: obstacles,
                    difficultyFeedback: difficulty,
                    nextWeekChange: nextWeekChange
                )
            )
        )
    }

    func saveFinalReflection(
        challengeId: String,
        reflection: String?,
        biggestChange: String?,
        nextGoal: String?
    ) async throws {
        try await client.send(
            Endpoint(
                path: "challenges/\(challengeId)/final-reflection",
                method: .put,
                body: FinalReflectionBody(
                    reflection: reflection,
                    biggestChange: biggestChange,
                    nextGoal: nextGoal
                )
            )
        )
    }
}
