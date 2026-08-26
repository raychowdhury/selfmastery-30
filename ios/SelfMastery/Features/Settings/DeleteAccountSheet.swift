import SwiftUI

/// Permanent account deletion.
///
/// Three things make this safe rather than merely present: it says exactly what
/// goes, it requires the password again, and the server does the deleting. There
/// is no "deactivate" alternative, because Apple requires real deletion.
struct DeleteAccountSheet: View {
    @Environment(AppEnvironment.self) private var environment
    @Environment(\.dismiss) private var dismiss

    @State private var password = ""
    @State private var isDeleting = false
    @State private var errorMessage: String?
    @State private var showingFinalConfirmation = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                    VStack(alignment: .leading, spacing: Theme.Spacing.m) {
                        Text("Delete your account")
                            .font(Theme.Typography.title)
                        Text("This removes everything, permanently:")
                            .font(.body)
                            .foregroundStyle(Theme.Palette.secondaryText)
                    }

                    VStack(alignment: .leading, spacing: Theme.Spacing.s) {
                        DeletionItem(text: "Your account and sign-in details")
                        DeletionItem(text: "Every challenge, including finished ones")
                        DeletionItem(text: "All daily actions and your completion history")
                        DeletionItem(text: "Your reflections and weekly reviews")
                    }

                    Text("It can't be undone, and we can't recover it for you afterwards.")
                        .font(Theme.Typography.body)
                        .foregroundStyle(Theme.Palette.secondaryText)
                        .fixedSize(horizontal: false, vertical: true)

                    LabelledField(
                        label: "Confirm your password",
                        hint: "Deleting everything shouldn't be one stray tap away.",
                        error: errorMessage
                    ) {
                        SecureField("Password", text: $password)
                            .textContentType(.password)
                    }

                    PrimaryButton(
                        title: "Delete Account",
                        isLoading: isDeleting,
                        isEnabled: !password.isEmpty
                    ) {
                        showingFinalConfirmation = true
                    }
                    .tint(.red)

                    SecondaryButton(title: "Keep My Account") { dismiss() }
                }
                .padding(Theme.Spacing.xl)
            }
            .background(Theme.Palette.background)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .confirmationDialog(
                "Delete your account permanently?",
                isPresented: $showingFinalConfirmation,
                titleVisibility: .visible
            ) {
                Button("Delete Permanently", role: .destructive) {
                    Task { await delete() }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This cannot be undone.")
            }
        }
    }

    private func delete() async {
        isDeleting = true
        errorMessage = nil
        defer { isDeleting = false }

        do {
            try await environment.api.deleteAccount(password: password)
            // Local credentials and cached state go too, not just the server row.
            await environment.didDeleteAccount()
            dismiss()
        } catch let error as APIError {
            Haptics.warning()
            errorMessage = error.userMessage
        } catch {
            errorMessage = "Couldn't delete your account. Try again."
        }
    }
}

struct DeletionItem: View {
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: Theme.Spacing.s) {
            Image(systemName: "minus")
                .font(.caption)
                .foregroundStyle(Theme.Palette.secondaryText)
                .accessibilityHidden(true)
            Text(text).font(Theme.Typography.body)
        }
    }
}

#Preview {
    DeleteAccountSheet().environment(AppEnvironment())
}
