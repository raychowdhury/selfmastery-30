import Foundation
import Observation

/// Form state and submission for sign in / sign up.
///
/// The view holds no networking: it collects input and asks this to submit.
@MainActor
@Observable
final class AuthModel {
    var name = ""
    var email = ""
    var password = ""

    private(set) var isSubmitting = false
    private(set) var errorMessage: String?
    private(set) var fieldErrors: [String: String] = [:]

    func canSubmit(mode: AuthView.Mode) -> Bool {
        let hasEmail = email.contains("@") && email.count > 3
        let hasPassword = password.count >= 8
        let hasName = mode == .signIn || !name.trimmingCharacters(in: .whitespaces).isEmpty
        return hasEmail && hasPassword && hasName
    }

    func submit(mode: AuthView.Mode, environment: AppEnvironment) async {
        guard !isSubmitting else { return }
        isSubmitting = true
        errorMessage = nil
        fieldErrors = [:]

        defer { isSubmitting = false }

        do {
            let response: AuthResponse
            switch mode {
            case .signUp:
                response = try await environment.api.signUp(
                    name: name.trimmingCharacters(in: .whitespaces),
                    email: normalisedEmail,
                    password: password
                )
            case .signIn:
                response = try await environment.api.signIn(
                    email: normalisedEmail,
                    password: password
                )
            }

            // A brand-new account never has a challenge; an existing one might.
            let hasChallenge: Bool
            if mode == .signUp {
                hasChallenge = false
            } else {
                await environment.didAuthenticate(response, hasActiveChallenge: false)
                hasChallenge = (try? await environment.api.me().hasActiveChallenge) ?? false
            }

            await environment.didAuthenticate(response, hasActiveChallenge: hasChallenge)
            password = ""
        } catch let error as APIError {
            switch error {
            case .validation(let message, let fields):
                errorMessage = fields.isEmpty ? message : nil
                fieldErrors = fields
            case .cancelled:
                break
            default:
                errorMessage = error.userMessage
            }
        } catch {
            errorMessage = "Something went wrong. Try again."
        }
    }

    private var normalisedEmail: String {
        email.trimmingCharacters(in: .whitespaces).lowercased()
    }
}
