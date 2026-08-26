import Foundation

/// Where the app talks to, resolved once from the build configuration.
///
/// The URL comes from `APIBaseURL` in Info.plist, which XcodeGen injects per
/// configuration. Nothing else in the app knows a hostname, and a Release build
/// has no path back to localhost.
struct APIConfiguration: Sendable {
    let baseURL: URL

    static let current: APIConfiguration = {
        guard
            let raw = Bundle.main.object(forInfoDictionaryKey: "APIBaseURL") as? String,
            let url = URL(string: raw.trimmingCharacters(in: .whitespacesAndNewlines))
        else {
            // A missing or malformed base URL is a build misconfiguration, not
            // a runtime condition worth limping along with.
            fatalError("APIBaseURL is missing from Info.plist")
        }

        #if !DEBUG
        if url.scheme != "https" {
            fatalError("Release builds must use HTTPS. Found: \(url.absoluteString)")
        }
        #endif

        return APIConfiguration(baseURL: url)
    }()

    var apiRoot: URL { baseURL.appending(path: "api/mobile/v1") }
}
