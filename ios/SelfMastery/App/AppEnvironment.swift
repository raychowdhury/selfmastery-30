import Foundation
import Observation

/// What the app is currently showing, as one value.
///
/// Modelling this as an enum rather than a pile of booleans is what stops the
/// launch flashing: there is no moment where "signed in" is true but "has a
/// challenge" has not been answered yet.
enum AppState: Equatable, Sendable {
    case launching
    case unauthenticated
    case onboarding
    case ready
}

/// Services and session state, shared through the SwiftUI environment.
@MainActor
@Observable
final class AppEnvironment {
    private(set) var state: AppState = .launching
    private(set) var user: UserDTO?
    /// Set when a request failed because the network is gone.
    private(set) var isOffline = false

    let api: SelfMasteryAPI
    let notifications: NotificationScheduler
    private let tokens: TokenStore

    init(
        tokens: TokenStore = TokenStore(),
        api: SelfMasteryAPI? = nil,
        notifications: NotificationScheduler = NotificationScheduler()
    ) {
        self.tokens = tokens
        self.api = api ?? SelfMasteryAPI(client: APIClient(tokens: tokens))
        self.notifications = notifications
    }

    /// Restores the session on launch and decides the first screen.
    func start() async {
        guard await tokens.hasUsableToken() else {
            state = .unauthenticated
            return
        }

        do {
            let me = try await api.me()
            user = me.user
            state = me.hasActiveChallenge ? .ready : .onboarding
            isOffline = false
        } catch let error as APIError {
            if error.requiresSignOut {
                await tokens.clear()
                state = .unauthenticated
            } else {
                // Offline at launch with a stored token: let the person in and
                // let each screen show its own cached or empty state, rather
                // than bouncing them to sign-in over a dropped connection.
                isOffline = (error == .offline)
                state = .ready
            }
        } catch {
            state = .unauthenticated
        }
    }

    func didAuthenticate(_ response: AuthResponse, hasActiveChallenge: Bool) async {
        await tokens.save(token: response.token, expiresAt: response.expiresAt)
        user = response.user
        state = hasActiveChallenge ? .ready : .onboarding
    }

    func didCreateChallenge() {
        state = .ready
    }

    func didFinishAndArchiveChallenge() {
        state = .onboarding
    }

    func signOut() async {
        // Tell the server so the token is revoked, but never block the user's
        // exit on a network call.
        try? await api.signOut()
        await tokens.clear()
        await notifications.cancelAll()
        user = nil
        state = .unauthenticated
    }

    /// Called after the account is deleted server-side.
    func didDeleteAccount() async {
        await tokens.clear()
        await notifications.cancelAll()
        user = nil
        state = .unauthenticated
    }

    func updateUser(_ user: UserDTO) {
        self.user = user
    }

    func setOffline(_ offline: Bool) {
        isOffline = offline
    }

    /// Any request failing with 401 means the session died elsewhere.
    func handle(_ error: APIError) async {
        if error.requiresSignOut {
            await tokens.clear()
            user = nil
            state = .unauthenticated
        }
        isOffline = (error == .offline)
    }
}
