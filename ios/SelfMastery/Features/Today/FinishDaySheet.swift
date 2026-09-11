import SwiftUI

/// Finishing the day, as a Calm bottom sheet: one-tap feeling, an optional
/// note, and the finish pill. Daily journaling is the fastest way to lose
/// someone, so nothing here blocks the button.
struct FinishDaySheet: View {
    let initialFeeling: String?
    let initialNote: String
    let finish: (String?, String?) async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var feeling: String?
    @State private var note = ""
    @State private var isSaving = false
    @FocusState private var noteFocused: Bool

    private let feelings = [
        (value: "EASY", label: "Easy"),
        (value: "GOOD", label: "Good"),
        (value: "DIFFICULT", label: "Difficult"),
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("How did today feel?")
                    .calmHeading(20)
                    .accessibilityAddTraits(.isHeader)

                HStack(spacing: Theme.Spacing.s) {
                    ForEach(feelings, id: \.value) { option in
                        let selected = feeling == option.value
                        Button {
                            feeling = option.value
                            Haptics.selection()
                        } label: {
                            Text(option.label)
                                .font(.system(size: 14))
                                .foregroundStyle(
                                    selected
                                        ? Theme.Palette.text
                                        : Theme.Palette.text.opacity(0.6)
                                )
                                .padding(.horizontal, Theme.Spacing.l)
                                .frame(minHeight: 44)
                                .background {
                                    RoundedRectangle(cornerRadius: 14)
                                        .strokeBorder(
                                            selected
                                                ? Theme.Palette.text
                                                : Theme.Palette.separator,
                                            lineWidth: 1
                                        )
                                }
                                .contentShape(.rect)
                        }
                        .buttonStyle(.plain)
                        .accessibilityAddTraits(
                            selected ? [.isButton, .isSelected] : .isButton
                        )
                    }
                }
                .padding(.top, Theme.Spacing.xl)

                TextField(
                    "Anything you want to remember? Optional.",
                    text: $note,
                    axis: .vertical
                )
                .lineLimit(3...6)
                .focused($noteFocused)
                .font(.system(size: 14))
                .padding(Theme.Spacing.m)
                .background {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(Theme.Palette.surface)
                        .strokeBorder(Theme.Palette.separator, lineWidth: 1)
                }
                .padding(.top, Theme.Spacing.xl)

                VStack(spacing: Theme.Spacing.s) {
                    PrimaryButton(title: "Finish day", isLoading: isSaving) {
                        noteFocused = false
                        Task {
                            isSaving = true
                            await finish(feeling, note)
                            isSaving = false
                            dismiss()
                        }
                    }
                    SecondaryButton(title: "Not yet") { dismiss() }
                }
                .padding(.top, Theme.Spacing.xxl)
            }
            .padding(.horizontal, 28)
            .padding(.top, Theme.Spacing.xxl)
            .padding(.bottom, Theme.Spacing.xl)
        }
        .background(Theme.Palette.background)
        .overlay(alignment: .top) {
            Theme.Palette.accent.opacity(0.3).frame(height: 1)
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .onAppear {
            feeling = initialFeeling
            note = initialNote
        }
    }
}

#Preview {
    Color.clear.sheet(isPresented: .constant(true)) {
        FinishDaySheet(initialFeeling: nil, initialNote: "") { _, _ in }
    }
}
