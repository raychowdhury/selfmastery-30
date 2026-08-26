import Foundation
import Security

/// Keychain-backed storage for the session token.
///
/// The token never touches UserDefaults: that file is unencrypted, included in
/// backups, and readable by anything that can read the container.
///
/// `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` keeps it available to
/// background work after the first unlock, while making sure it is never
/// carried to a different device by a backup.
struct Keychain: Sendable {
    enum KeychainError: Error {
        case unexpectedStatus(OSStatus)
    }

    let service: String

    init(service: String = Bundle.main.bundleIdentifier ?? "com.yourcompany.selfmastery") {
        self.service = service
    }

    private func query(_ account: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
    }

    func set(_ value: String, for account: String) throws {
        guard let data = value.data(using: .utf8) else { return }

        // Delete-then-add rather than update: it is one code path and cannot
        // leave a stale item behind with different accessibility.
        SecItemDelete(query(account) as CFDictionary)

        var attributes = query(account)
        attributes[kSecValueData as String] = data
        attributes[kSecAttrAccessible as String] =
            kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly

        let status = SecItemAdd(attributes as CFDictionary, nil)
        guard status == errSecSuccess else { throw KeychainError.unexpectedStatus(status) }
    }

    func get(_ account: String) -> String? {
        var attributes = query(account)
        attributes[kSecReturnData as String] = true
        attributes[kSecMatchLimit as String] = kSecMatchLimitOne

        var item: CFTypeRef?
        let status = SecItemCopyMatching(attributes as CFDictionary, &item)
        guard status == errSecSuccess, let data = item as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    func remove(_ account: String) {
        SecItemDelete(query(account) as CFDictionary)
    }
}
