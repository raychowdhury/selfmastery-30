import SwiftUI

/// The end of a day. Evidence, not celebration — the numbers are the reward.
struct DayCompleteView: View {
    let dayNumber: Int
    let completion: CompletionDTO
    let minutes: Int
    let streak: Int

    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var appeared = false

    var body: some View {
        VStack(spacing: Theme.Spacing.xl) {
            Spacer()

            ZStack {
                Circle().fill(Theme.Palette.accent).frame(width: 72, height: 72)
                Image(systemName: "checkmark")
                    .font(.system(size: 32, weight: .semibold))
                    .foregroundStyle(.white)
            }
            .scaleEffect(appeared || reduceMotion ? 1 : 0.6)
            .opacity(appeared || reduceMotion ? 1 : 0)
            .accessibilityHidden(true)

            Text("Day \(dayNumber) complete.")
                .font(Theme.Typography.display)
                .multilineTextAlignment(.center)
                .accessibilityAddTraits(.isHeader)

            HStack(alignment: .top, spacing: Theme.Spacing.xl) {
                MetricView(
                    value: "\(completion.completed) / \(completion.required)",
                    label: "actions completed"
                )
                MetricView(value: "\(minutes)", label: "focused minutes")
                MetricView(
                    value: "\(streak)",
                    label: streak == 1 ? "day in a row" : "days in a row"
                )
            }
            .padding(.top, Theme.Spacing.m)

            Text("Come back tomorrow and continue.")
                .font(Theme.Typography.body)
                .foregroundStyle(Theme.Palette.secondaryText)

            Spacer()

            PrimaryButton(title: "Done") { dismiss() }
        }
        .padding(Theme.Spacing.xl)
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
