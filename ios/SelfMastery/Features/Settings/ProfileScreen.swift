import SwiftUI

/// Settings, in the Calm design: quiet rows separated by fading rules, values
/// on the right. Anything that needs input opens a sheet rather than exposing
/// a form on the page. Account deletion lives here, two taps from the tab bar,
/// as App Store Review Guideline 5.1.1(v) requires.
struct ProfileScreen: View {
    @Environment(AppEnvironment.self) private var environment
    @AppStorage("appearance") private var appearance = Appearance.system

    @State private var challenge: ChallengeDTO?
    @State private var challengeDay: Int?
    @State private var editingName = false
    @State private var showingSignOut = false
    @State private var showingDelete = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("Settings")
                        .calmHeading(26)
                        .accessibilityAddTraits(.isHeader)

                    VStack(spacing: 0) {
                        SettingsRow(
                            label: "Name",
                            value: environment.user?.name?.isEmpty == false
                                ? environment.user?.name ?? ""
                                : "Add your name"
                        ) { editingName = true }

                        SettingsRow(label: "Email", value: environment.user?.email ?? "")

                        NavigationLink {
                            RemindersScreen()
                        } label: {
                            SettingsRowLabel(label: "Reminders", value: "Manage")
                        }
                        .buttonStyle(.plain)
                        SettingsDivider()

                        SettingsRow(label: "Appearance", value: appearance.label) {
                            cycleAppearance()
                        }

                        if let challenge, let challengeDay {
                            NavigationLink {
                                ChallengeDetailScreen(challenge: challenge)
                            } label: {
                                SettingsRowLabel(
                                    label: "Challenge",
                                    value: "Day \(challengeDay) of \(challenge.lengthDays)"
                                )
                            }
                            .buttonStyle(.plain)
                            SettingsDivider()
                        }

                        NavigationLink {
                            TemplatesScreen()
                        } label: {
                            SettingsRowLabel(label: "Templates", value: "Browse")
                        }
                        .buttonStyle(.plain)
                        SettingsDivider()

                        NavigationLink {
                            HistoryScreen()
                        } label: {
                            SettingsRowLabel(label: "Previous challenges", value: "Browse")
                        }
                        .buttonStyle(.plain)
                        SettingsDivider()

                        NavigationLink {
                            ReviewsScreen()
                        } label: {
                            SettingsRowLabel(label: "Weekly reviews", value: "Read")
                        }
                        .buttonStyle(.plain)
                        SettingsDivider()

                        SettingsRow(label: "Sign out", value: "") { showingSignOut = true }

                        SettingsRow(label: "Delete account", value: "", destructive: true) {
                            showingDelete = true
                        }
                    }
                    .padding(.top, Theme.Spacing.xl)

                    if let challenge {
                        Text(goalSummary(challenge))
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.Palette.secondaryText)
                            .padding(.top, Theme.Spacing.xxl)
                    }
                }
                .padding(.horizontal, 28)
                .padding(.top, Theme.Spacing.xl)
                .padding(.bottom, Theme.Spacing.section)
            }
            .background(Theme.Palette.background)
            .toolbarVisibility(.hidden, for: .navigationBar)
            .confirmationDialog("Sign out?", isPresented: $showingSignOut, titleVisibility: .visible) {
                Button("Sign out", role: .destructive) {
                    Task { await environment.signOut() }
                }
                Button("Cancel", role: .cancel) {}
            }
            .sheet(isPresented: $showingDelete) {
                DeleteAccountSheet()
            }
            .sheet(isPresented: $editingName) {
                NameSheet(initialName: environment.user?.name ?? "")
            }
        }
        .task {
            let today = try? await environment.api.today()
            challenge = today?.challenge
            challengeDay = today?.dayNumber
        }
    }

    private func goalSummary(_ challenge: ChallengeDTO) -> String {
        "\(challenge.goal). \(challenge.difficulty.lowercased()) approach, \(challenge.availableMinutes) minutes a day."
    }

    private func cycleAppearance() {
        appearance =
            switch appearance {
            case .system: .light
            case .light: .dark
            case .dark: .system
            }
    }
}

// MARK: - Rows

private struct SettingsRowLabel: View {
    let label: String
    let value: String
    var destructive = false

    var body: some View {
        HStack(spacing: Theme.Spacing.m) {
            Text(label)
                .font(.system(size: 16))
                .foregroundStyle(destructive ? .red : Theme.Palette.text)
            Spacer(minLength: Theme.Spacing.m)
            Text(value)
                .font(.system(size: 15))
                .foregroundStyle(Theme.Palette.secondaryText)
                .lineLimit(1)
        }
        .padding(.vertical, 17)
        .contentShape(.rect)
    }
}

private struct SettingsDivider: View {
    var body: some View { CalmRule() }
}

private struct SettingsRow: View {
    let label: String
    let value: String
    var destructive = false
    var action: (() -> Void)?

    var body: some View {
        Group {
            if let action {
                Button(action: action) {
                    SettingsRowLabel(label: label, value: value, destructive: destructive)
                }
                .buttonStyle(.plain)
            } else {
                SettingsRowLabel(label: label, value: value, destructive: destructive)
            }
        }
        SettingsDivider()
    }
}

// MARK: - Name sheet

private struct NameSheet: View {
    let initialName: String

    @Environment(AppEnvironment.self) private var environment
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var isSaving = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Your name")
                .calmHeading(20)
                .accessibilityAddTraits(.isHeader)

            TextField("Name", text: $name)
                .textContentType(.name)
                .font(.system(size: 14))
                .padding(Theme.Spacing.m)
                .background {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(Theme.Palette.surface)
                        .strokeBorder(Theme.Palette.separator, lineWidth: 1)
                }
                .padding(.top, Theme.Spacing.xl)

            VStack(spacing: Theme.Spacing.s) {
                PrimaryButton(
                    title: "Save",
                    isLoading: isSaving,
                    isEnabled: !name.trimmed.isEmpty
                ) {
                    Task { await save() }
                }
                SecondaryButton(title: "Cancel") { dismiss() }
            }
            .padding(.top, Theme.Spacing.xxl)

            Spacer(minLength: 0)
        }
        .padding(.horizontal, 28)
        .padding(.top, Theme.Spacing.xxl)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.Palette.background)
        .overlay(alignment: .top) {
            Theme.Palette.accent.opacity(0.3).frame(height: 1)
        }
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
        .onAppear { name = initialName }
    }

    private func save() async {
        isSaving = true
        defer { isSaving = false }
        if let response = try? await environment.api.updateName(name.trimmed) {
            environment.updateUser(response.user)
            dismiss()
        }
    }
}

// MARK: - Reminders

/// The reminder toggles, one level down from Settings. A single quiet nudge —
/// never guilt, and never a streak warning.
private struct RemindersScreen: View {
    @Environment(AppEnvironment.self) private var environment
    @State private var reminders = ReminderPreferences.load()
    @State private var notificationsAuthorised = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Reminders")
                    .calmHeading(26)
                    .accessibilityAddTraits(.isHeader)

                Text("A single quiet nudge. Never guilt, and never a streak warning.")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.Palette.secondaryText)
                    .padding(.top, Theme.Spacing.s)

                if notificationsAuthorised {
                    VStack(spacing: 0) {
                        reminderRow("Morning plan", $reminders.morning)
                        reminderRow("Reminder at your usual time", $reminders.goalTime)
                        reminderRow("Evening reflection", $reminders.evening)
                        reminderRow("Weekly review", $reminders.weeklyReview)
                    }
                    .padding(.top, Theme.Spacing.xl)
                } else {
                    PrimaryButton(title: "Turn on reminders") {
                        Task { await enableNotifications() }
                    }
                    .padding(.top, Theme.Spacing.xxl)
                }
            }
            .padding(.horizontal, 28)
            .padding(.top, Theme.Spacing.xl)
            .padding(.bottom, Theme.Spacing.section)
        }
        .background(Theme.Palette.background)
        .task {
            notificationsAuthorised =
                await environment.notifications.authorizationStatus() == .authorized
        }
        .onChange(of: reminders) { _, updated in
            updated.save()
            Task { await applyReminders(updated) }
        }
    }

    @ViewBuilder
    private func reminderRow(_ label: String, _ binding: Binding<Bool>) -> some View {
        Toggle(label, isOn: binding)
            .font(.system(size: 16))
            .tint(Theme.Palette.accent)
            .padding(.vertical, 13)
        CalmRule()
    }

    private func enableNotifications() async {
        let granted = await environment.notifications.requestAuthorization()
        notificationsAuthorised = granted
        if granted { await applyReminders(reminders) }
    }

    private func applyReminders(_ preferences: ReminderPreferences) async {
        let today = try? await environment.api.today()
        await environment.notifications.apply(
            preferences: preferences,
            preferredTime: today?.challenge?.preferredTime ?? "FLEXIBLE",
            dayNumber: today?.dayNumber ?? 1
        )
    }
}
