import SwiftUI

/// Profile and settings. Account deletion lives here, two taps from the tab bar,
/// as App Store Review Guideline 5.1.1(v) requires.
struct ProfileScreen: View {
    @Environment(AppEnvironment.self) private var environment
    @AppStorage("appearance") private var appearance = Appearance.system

    @State private var name = ""
    @State private var isSavingName = false
    @State private var reminders = ReminderPreferences.load()
    @State private var notificationsAuthorised = false
    @State private var showingSignOut = false
    @State private var showingDelete = false

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack(spacing: Theme.Spacing.m) {
                        Circle()
                            .fill(Theme.Palette.accent.opacity(0.2))
                            .frame(width: 48, height: 48)
                            .overlay {
                                Text(initials)
                                    .font(Theme.Typography.actionTitle)
                                    .foregroundStyle(Theme.Palette.accent)
                            }
                            .accessibilityHidden(true)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(environment.user?.name ?? "You")
                                .font(Theme.Typography.actionTitle)
                            Text(environment.user?.email ?? "")
                                .font(Theme.Typography.caption)
                                .foregroundStyle(Theme.Palette.secondaryText)
                        }
                    }
                    .padding(.vertical, 4)
                }

                Section("Your name") {
                    TextField("Name", text: $name)
                        .textContentType(.name)
                    Button("Save") {
                        Task { await saveName() }
                    }
                    .disabled(name.trimmed.isEmpty || isSavingName)
                }

                Section("Appearance") {
                    Picker("Theme", selection: $appearance) {
                        ForEach(Appearance.allCases) { option in
                            Text(option.label).tag(option)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                Section {
                    if notificationsAuthorised {
                        Toggle("Morning plan", isOn: $reminders.morning)
                        Toggle("Reminder at your usual time", isOn: $reminders.goalTime)
                        Toggle("Evening reflection", isOn: $reminders.evening)
                        Toggle("Weekly review", isOn: $reminders.weeklyReview)
                    } else {
                        Button("Turn on reminders") {
                            Task { await enableNotifications() }
                        }
                    }
                } header: {
                    Text("Reminders")
                } footer: {
                    Text("A single quiet nudge. Never guilt, and never a streak warning.")
                }

                Section("Challenge") {
                    NavigationLink("Previous challenges") { HistoryScreen() }
                    NavigationLink("Weekly reviews") { ReviewsScreen() }
                }

                Section {
                    Button("Sign out") { showingSignOut = true }
                }

                Section {
                    Button("Delete account", role: .destructive) { showingDelete = true }
                } footer: {
                    Text("Deleting removes your account and every challenge, action and reflection permanently. This can't be undone.")
                }
            }
            .navigationTitle("Profile")
            .confirmationDialog("Sign out?", isPresented: $showingSignOut, titleVisibility: .visible) {
                Button("Sign out", role: .destructive) {
                    Task { await environment.signOut() }
                }
                Button("Cancel", role: .cancel) {}
            }
            .sheet(isPresented: $showingDelete) {
                DeleteAccountSheet()
            }
        }
        .task {
            name = environment.user?.name ?? ""
            notificationsAuthorised = await environment.notifications.authorizationStatus() == .authorized
        }
        .onChange(of: reminders) { _, updated in
            updated.save()
            Task { await applyReminders(updated) }
        }
    }

    private var initials: String {
        let source = environment.user?.name ?? environment.user?.email ?? "?"
        return source.split(separator: " ").prefix(2)
            .compactMap { $0.first.map(String.init) }
            .joined()
            .uppercased()
    }

    private func saveName() async {
        isSavingName = true
        defer { isSavingName = false }
        if let response = try? await environment.api.updateName(name.trimmed) {
            environment.updateUser(response.user)
        }
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
