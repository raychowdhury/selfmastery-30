import Foundation
import UIKit

/// A request, described rather than performed.
struct Endpoint: Sendable {
    enum Method: String, Sendable {
        case get = "GET"
        case post = "POST"
        case patch = "PATCH"
        case put = "PUT"
        case delete = "DELETE"
    }

    var path: String
    var method: Method = .get
    var query: [URLQueryItem] = []
    var body: (any Encodable & Sendable)?
    /// Endpoints reachable before sign-in.
    var requiresAuth: Bool = true
}

protocol APIClientProtocol: Sendable {
    func send<T: Decodable & Sendable>(_ endpoint: Endpoint) async throws -> T
    func send(_ endpoint: Endpoint) async throws
}

/// The only place in the app that performs network I/O.
///
/// Views never call this directly — they go through a feature model, so a
/// screen cannot accidentally hold a request alive after it disappears.
final class APIClient: APIClientProtocol {
    private let configuration: APIConfiguration
    private let session: URLSession
    private let tokens: TokenStore
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    init(
        configuration: APIConfiguration = .current,
        tokens: TokenStore,
        session: URLSession? = nil
    ) {
        self.configuration = configuration
        self.tokens = tokens

        if let session {
            self.session = session
        } else {
            let config = URLSessionConfiguration.default
            config.timeoutIntervalForRequest = 20
            config.timeoutIntervalForResource = 40
            // Always ask the server: a cached "today" would be yesterday's.
            config.requestCachePolicy = .reloadIgnoringLocalCacheData
            config.waitsForConnectivity = false
            self.session = URLSession(configuration: config)
        }

        decoder = JSONDecoder()
        encoder = JSONEncoder()
    }

    func send<T: Decodable & Sendable>(_ endpoint: Endpoint) async throws -> T {
        let data = try await perform(endpoint)
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decoding(String(describing: error))
        }
    }

    func send(_ endpoint: Endpoint) async throws {
        _ = try await perform(endpoint)
    }

    private func perform(_ endpoint: Endpoint) async throws -> Data {
        var components = URLComponents(
            url: configuration.apiRoot.appending(path: endpoint.path),
            resolvingAgainstBaseURL: false
        )
        if !endpoint.query.isEmpty { components?.queryItems = endpoint.query }

        guard let url = components?.url else {
            throw APIError.server("Could not build that request.")
        }

        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        if let body = endpoint.body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try encoder.encode(body)
        }

        if endpoint.requiresAuth, let token = await tokens.token() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let deviceName = await Self.deviceName() {
            request.setValue(deviceName, forHTTPHeaderField: "X-Device-Name")
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch let error as URLError {
            switch error.code {
            case .cancelled: throw APIError.cancelled
            case .notConnectedToInternet, .networkConnectionLost,
                 .dataNotAllowed, .internationalRoamingOff:
                throw APIError.offline
            case .timedOut: throw APIError.timedOut
            default: throw APIError.offline
            }
        }

        guard let http = response as? HTTPURLResponse else {
            throw APIError.server("Unexpected response.")
        }

        guard (200..<300).contains(http.statusCode) else {
            let envelope = try? decoder.decode(APIErrorEnvelope.self, from: data)
            throw APIError.from(status: http.statusCode, envelope: envelope)
        }

        return data
    }

    /// Labels the session in the user's account, e.g. "Maya's iPhone".
    @MainActor
    private static func deviceName() -> String? {
        UIDevice.current.name
    }
}
