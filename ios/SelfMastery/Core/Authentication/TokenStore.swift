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

    /// Set once the keychain has been reconciled with this install.
    private static let installMarker = "keychain-belongs-to-this-install"

    private let keychain: Keychain
    private var cached: String??
    private var didReconcileInstall = false

    init(keychain: Keychain = Keychain()) {
        self.keychain = keychain
    }

    /// Clears the keychain on the first launch after a fresh install.
    ///
    /// iOS keeps keychain items when an app is deleted, but wipes UserDefaults.
    /// Without this, deleting and reinstalling silently restores the previous
    /// person's session — which is a nasty surprise on a shared device, and
    /// makes "delete the app" fail as a way to sign out.
    private func reconcileInstallIfNeeded() {
        guard !didReconcileInstall else { return }
        didReconcileInstall = true

        let defaults = UserDefaults.standard
        guard !defaults.bool(forKey: Self.installMarker) else { return }

        keychain.remove(Account.token)
        keychain.remove(Account.expiry)
        cached = .some(nil)
        defaults.set(true, forKey: Self.installMarker)
    }

    func token() -> String? {
        reconcileInstallIfNeeded()
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
        reconcileInstallIfNeeded()
        guard token() != nil else { return false }
        guard
            let raw = keychain.get(Account.expiry),
            let expiry = Instant.parse(raw)
        else { return true }
        return expiry > Date()
    }
}
