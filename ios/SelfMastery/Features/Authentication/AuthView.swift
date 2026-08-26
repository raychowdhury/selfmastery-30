import SwiftUI

/// Sign up and sign in are the same form with different copy, so they are one
/// screen rather than two that drift apart.
struct AuthView: View {
    enum Mode {
        case signIn, signUp

        var title: String {
            switch self {
            case .signIn: "Welcome back"
            case .signUp: "Create your account"
            }
        }

        var subtitle: String {
            switch self {
            case .signIn: "Pick up where you left off."
            case .signUp: "One goal, thirty days. Setup takes about two minutes."
            }
        }

        var callToAction: String {
            switch self {
            case .signIn: "Sign In"
            case .signUp: "Create Account"
            }
        }
    }

    let mode: Mode

    @Environment(AppEnvironment.self) private var environment
    @State private var model = AuthModel()
    @State private var showingForgotPassword = false
    @FocusState private var focused: Field?

    private enum Field: Hashable {
        case name, email, password
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                VStack(alignment: .leading, spacing: Theme.Spacing.s) {
                    Text(mode.title).font(Theme.Typography.title)
                    Text(mode.subtitle)
                        .font(Theme.Typography.body)
                        .foregroundStyle(Theme.Palette.secondaryText)
                }

                VStack(spacing: Theme.Spacing.l) {
                    if mode == .signUp {
                        LabelledField(
                            label: "Your name",
                            error: model.fieldErrors["name"]
                        ) {
                            TextField("Name", text: $model.name)
                                .textContentType(.name)
                                .focused($focused, equals: .name)
                                .submitLabel(.next)
                                .onSubmit { focused = .email }
                        }
                    }

                    LabelledField(label: "Email", error: model.fieldErrors["email"]) {
                        TextField("you@example.com", text: $model.email)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .focused($focused, equals: .email)
                            .submitLabel(.next)
                            .onSubmit { focused = .password }
                    }

                    LabelledField(
                        label: "Password",
                        hint: mode == .signUp ? "At least 8 characters." : nil,
                        error: model.fieldErrors["password"]
                    ) {
                        SecureField("Password", text: $model.password)
                            .textContentType(mode == .signUp ? .newPassword : .password)
                            .focused($focused, equals: .password)
                            .submitLabel(.go)
                            .onSubmit { submit() }
                    }
                }

                if let message = model.errorMessage {
                    Text(message)
                        .font(Theme.Typography.caption)
                        .foregroundStyle(.red)
                        .accessibilityAddTraits(.isStaticText)
                }

                PrimaryButton(
                    title: mode.callToAction,
                    isLoading: model.isSubmitting,
                    isEnabled: model.canSubmit(mode: mode),
                    action: submit
                )

                if mode == .signIn {
                    Button("Forgotten your password?") { showingForgotPassword = true }
                        .font(Theme.Typography.caption)
                        .frame(maxWidth: .infinity)
                }
            }
            .padding(Theme.Spacing.xl)
        }
        .background(Theme.Palette.background)
        .navigationBarTitleDisplayMode(.inline)
        .scrollDismissesKeyboard(.interactively)
        .sheet(isPresented: $showingForgotPassword) {
            ForgotPasswordView(api: environment.api, email: model.email)
        }
        .onAppear {
            focused = mode == .signUp ? .name : .email
        }
    }

    private func submit() {
        Task {
            await model.submit(mode: mode, environment: environment)
        }
    }
}

/// A field with its label, hint and error in one place, so every form on the
/// app looks and reads the same.
struct LabelledField<Content: View>: View {
    let label: String
    var hint: String?
    var error: String?
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(Theme.Typography.caption)
                .foregroundStyle(Theme.Palette.secondaryText)

            content
                .textFieldStyle(.plain)
                .padding(Theme.Spacing.m)
                .frame(minHeight: 48)
                .background(Theme.Palette.surface, in: .rect(cornerRadius: Theme.Radius.small))
                .overlay {
                    RoundedRectangle(cornerRadius: Theme.Radius.small)
                        .strokeBorder(error == nil ? Theme.Palette.separator : .red)
                }

            if let error {
                Text(error).font(Theme.Typography.caption).foregroundStyle(.red)
            } else if let hint {
                Text(hint)
                    .font(Theme.Typography.caption)
                    .foregroundStyle(Theme.Palette.secondaryText)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
        .accessibilityValue(error ?? "")
    }
}

#Preview("Sign up") {
    NavigationStack {
        AuthView(mode: .signUp).environment(AppEnvironment())
    }
}

#Preview("Sign in") {
    NavigationStack {
        AuthView(mode: .signIn).environment(AppEnvironment())
    }
}
