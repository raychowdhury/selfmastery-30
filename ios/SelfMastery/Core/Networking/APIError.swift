import Foundation

/// The error envelope every endpoint returns:
/// `{ "error": { "code": …, "message": …, "fields": {…}? } }`
struct APIErrorEnvelope: Decodable, Sendable {
    struct Payload: Decodable, Sendable {
        let code: String
        let message: String
        let fields: [String: String]?
    }
    let error: Payload
}

enum APIError: Error, Sendable, Equatable {
    case offline
    case timedOut
    case unauthorized(String)
    case validation(message: String, fields: [String: String])
    case rateLimited(String)
    case notFound(String)
    case server(String)
    case decoding(String)
    case cancelled

    /// What the person sees. Never contains a status code or a stack trace.
    var userMessage: String {
        switch self {
        case .offline:
            "You're offline. Your progress will sync when you're connected."
        case .timedOut:
            "That took too long. Try again in a moment."
        case .unauthorized(let message), .rateLimited(let message),
             .notFound(let message), .server(let message):
            message
        case .validation(let message, _):
            message
        case .decoding:
            "Something went wrong reading that. Try again."
        case .cancelled:
            ""
        }
    }

    /// True when the session is gone and the app should return to sign-in.
    var requiresSignOut: Bool {
        if case .unauthorized = self { return true }
        return false
    }

    var isCancellation: Bool {
        if case .cancelled = self { return true }
        return false
    }

    static func from(status: Int, envelope: APIErrorEnvelope?) -> APIError {
        let message = envelope?.error.message ?? "Something went wrong."
        switch status {
        case 401: return .unauthorized(message)
        case 400, 409, 403:
            return .validation(message: message, fields: envelope?.error.fields ?? [:])
        case 404: return .notFound(message)
        case 429: return .rateLimited(message)
        // 503 carries a specific, user-facing reason from the server (for
        // example password reset not being configured), so it is surfaced
        // rather than replaced with a generic failure.
        case 503: return .server(message)
        default: return .server(message)
        }
    }
}
