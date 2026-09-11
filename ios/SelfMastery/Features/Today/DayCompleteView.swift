import SwiftUI

/// The end of a day, in the Calm design. Evidence, not celebration — an
/// outlined check, the numbers, and permission to leave.
struct DayCompleteView: View {
    let dayNumber: Int
    let completion: CompletionDTO
    let minutes: Int
    let streak: Int

    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var appeared = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Spacer()

            ZStack {
                Circle()
                    .strokeBorder(Theme.Palette.accent, lineWidth: 2)
                    .frame(width: 56, height: 56)
                Image(systemName: "checkmark")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(Theme.Palette.accent)
            }
            .scaleEffect(appeared || reduceMotion ? 1 : 0.6)
            .opacity(appeared || reduceMotion ? 1 : 0)
            .accessibilityHidden(true)

            Text("Day \(dayNumber) complete.")
                .calmHeading(30)
                .padding(.top, Theme.Spacing.xl)
                .accessibilityAddTraits(.isHeader)

            Text("\(completion.completed) of \(completion.required) actions · \(minutes) minutes")
                .font(.system(size: 14))
                .foregroundStyle(Theme.Palette.secondaryText)
                .padding(.top, Theme.Spacing.s)

            VStack(alignment: .leading, spacing: Theme.Spacing.s) {
                Text("\(streak)").calmHeading(30)
                Text(streak == 1 ? "day in a row" : "days in a row")
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.Palette.secondaryText)
            }
            .padding(.top, Theme.Spacing.xxl)
            .accessibilityElement(children: .combine)

            CalmRule()
                .padding(.top, Theme.Spacing.xl)

            Text("Come back tomorrow.")
                .font(.system(size: 14))
                .foregroundStyle(Theme.Palette.secondaryText)
                .padding(.top, Theme.Spacing.xl)

            Spacer()

            PrimaryButton(title: "Done") { dismiss() }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 28)
        .padding(.vertical, Theme.Spacing.xl)
        .background(Theme.Palette.background)
        .navigationBarBackButtonHidden()
        .task {
            guard !reduceMotion else { return }
            withAnimation(.spring(duration: 0.35)) { appeared = true }
        }
    }
}

#Preview {
    NavigationStack {
        DayCompleteView(
            dayNumber: 8,
            completion: CompletionDTO(required: 4, completed: 3, percent: 75),
            minutes: 45,
            streak: 5
        )
    }
}
