import SwiftUI

/// Requests a reset link. The response is identical whether or not the address
/// exists, so this screen never claims an account was found.
struct ForgotPasswordView: View {
    let api: SelfMasteryAPI
    @State var email: String

    @Environment(\.dismiss) private var dismiss
    @State private var isSending = false
    @State private var didSend = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                if didSend {
                    VStack(alignment: .leading, spacing: Theme.Spacing.m) {
                        Text("Check your email")
                            .font(Theme.Typography.title)
                        Text("If that address has an account, a reset link is on its way. It expires in 30 minutes.")
                            .font(Theme.Typography.body)
                            .foregroundStyle(Theme.Palette.secondaryText)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    Spacer()
                    PrimaryButton(title: "Done") { dismiss() }
                } else {
                    VStack(alignment: .leading, spacing: Theme.Spacing.s) {
                        Text("Reset your password").font(Theme.Typography.title)
                        Text("We'll email you a link to choose a new one.")
                            .font(Theme.Typography.body)
                            .foregroundStyle(Theme.Palette.secondaryText)
                    }

                    LabelledField(label: "Email", error: errorMessage) {
                        TextField("you@example.com", text: $email)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                    }

                    Spacer()

                    PrimaryButton(
                        title: "Send reset link",
                        isLoading: isSending,
                        isEnabled: email.contains("@")
                    ) {
                        Task { await send() }
                    }
                }
            }
            .padding(Theme.Spacing.xl)
            .background(Theme.Palette.background)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private func send() async {
        isSending = true
        errorMessage = nil
        defer { isSending = false }

        do {
            try await api.requestPasswordReset(email: email.lowercased())
            didSend = true
        } catch let error as APIError {
            errorMessage = error.userMessage
        } catch {
            errorMessage = "Something went wrong. Try again."
        }
    }
}

#Preview {
    ForgotPasswordView(
        api: SelfMasteryAPI(client: APIClient(tokens: TokenStore())),
        email: ""
    )
}
