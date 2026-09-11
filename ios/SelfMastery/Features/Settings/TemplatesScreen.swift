import SwiftUI

/// Proven 30-day paths, as Calm rows. Browsing is the point here — a new
/// challenge starts from onboarding, where any of these can seed the goal.
struct TemplatesScreen: View {
    @Environment(AppEnvironment.self) private var environment
    @State private var templates: [TemplateDTO] = []
    @State private var expanded: String?
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Templates")
                    .calmHeading(26)
                    .accessibilityAddTraits(.isHeader)

                Text("Proven 30-day paths. Make one yours.")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.Palette.secondaryText)
                    .padding(.top, Theme.Spacing.s)

                if isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                        .padding(.top, Theme.Spacing.section)
                } else if let errorMessage {
                    ErrorStateView(message: errorMessage) { Task { await load() } }
                        .padding(.top, Theme.Spacing.xl)
                } else {
                    VStack(spacing: 0) {
                        ForEach(templates) { template in
                            row(template)
                        }
                    }
                    .padding(.top, Theme.Spacing.xl)

                    Text("Starting a new challenge from onboarding lets you pick any of these as your goal.")
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.Palette.secondaryText)
                        .padding(.top, Theme.Spacing.xl)
                }
            }
            .padding(.horizontal, 28)
            .padding(.top, Theme.Spacing.xl)
            .padding(.bottom, Theme.Spacing.section)
        }
        .background(Theme.Palette.background)
        .task { await load() }
    }

    @ViewBuilder
    private func row(_ template: TemplateDTO) -> some View {
        let isOpen = expanded == template.slug

        VStack(spacing: 0) {
            Button {
                withAnimation(.snappy(duration: 0.2)) {
                    expanded = isOpen ? nil : template.slug
                }
            } label: {
                HStack(spacing: Theme.Spacing.m) {
                    Text(template.name)
                        .font(.system(size: 16))
                        .foregroundStyle(Theme.Palette.text)
                    Spacer(minLength: Theme.Spacing.m)
                    Text(template.timeLabel)
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.Palette.secondaryText)
                }
                .padding(.vertical, 17)
                .contentShape(.rect)
            }
            .buttonStyle(.plain)
            .accessibilityAddTraits(isOpen ? [.isButton, .isSelected] : .isButton)
            .accessibilityHint(isOpen ? "Collapses the description" : "Shows the description")

            if isOpen {
                Text(template.description)
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.Palette.secondaryText)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.bottom, Theme.Spacing.l)
            }

            CalmRule()
        }
    }

    private func load() async {
        errorMessage = nil
        do {
            templates = try await environment.api.templates().templates
        } catch let error as APIError {
            if error.isCancellation { return }
            errorMessage = error.userMessage
        } catch {
            errorMessage = "Something went wrong."
        }
        isLoading = false
    }
}
