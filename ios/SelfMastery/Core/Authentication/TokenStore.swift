import Foundation

/// Owns the session token.
///
/// An actor because the API client reads it from arbitrary tasks while sign-in
/// and sign-out write it, and a data race here would mean sending the wrong
/// person's credentials.
actor TokenStore {
    private enum Account {
        static let token = "session-token"
        static let expiry = "session-expiry"
    }

    private let keychain: Keychain
    private var cached: String??

    init(keychain: Keychain = Keychain()) {
        self.keychain = keychain
    }

    func token() -> String? {
        if let cached { return cached }
        let stored = keychain.get(Account.token)
        cached = stored
        return stored
    }

    func save(token: String, expiresAt: String?) {
        try? keychain.set(token, for: Account.token)
        if let expiresAt {
            try? keychain.set(expiresAt, for: Account.expiry)
        }
        cached = token
    }

    func clear() {
        keychain.remove(Account.token)
        keychain.remove(Account.expiry)
        cached = .some(nil)
    }

    /// True when a stored token exists and has not passed its expiry. Expiry is
    /// still enforced by the server; this only avoids a pointless round trip.
    func hasUsableToken() -> Bool {
        guard token() != nil else { return false }
        guard
            let raw = keychain.get(Account.expiry),
            let expiry = Instant.parse(raw)
        else { return true }
        return expiry > Date()
    }
}
