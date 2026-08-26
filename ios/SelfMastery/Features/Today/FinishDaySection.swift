import SwiftUI

/// Reflection is one tap by default. Daily journaling is the fastest way to
/// lose someone, so the note is optional and never blocks finishing.
struct FinishDaySection: View {
    let initialFeeling: String?
    let initialNote: String
    let finish: (String?, String?) async -> Void

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
        VStack(alignment: .leading, spacing: Theme.Spacing.m) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Before you finish…")
                    .font(Theme.Typography.sectionTitle)
                    .accessibilityAddTraits(.isHeader)
                Text("How did today feel?")
                    .font(Theme.Typography.body)
                    .foregroundStyle(Theme.Palette.secondaryText)
            }

            HStack(spacing: Theme.Spacing.s) {
                ForEach(feelings, id: \.value) { option in
                    Button {
                        feeling = option.value
                        Haptics.selection()
                    } label: {
                        Text(option.label)
                            .font(Theme.Typography.body)
                            .frame(maxWidth: .infinity, minHeight: 44)
                    }
                    .buttonStyle(.bordered)
                    .tint(feeling == option.value ? Theme.Palette.accent : Theme.Palette.secondaryText)
                    .accessibilityAddTraits(
                        feeling == option.value ? [.isButton, .isSelected] : .isButton
                    )
                }
            }

            LabelledField(label: "Anything you want to remember?") {
                TextField("What helped? What got in the way?", text: $note, axis: .vertical)
                    .lineLimit(2...5)
                    .focused($noteFocused)
            }

            PrimaryButton(title: "Finish Day", isLoading: isSaving) {
                noteFocused = false
                Task {
                    isSaving = true
                    await finish(feeling, note)
                    isSaving = false
                }
            }
        }
        .onAppear {
            feeling = initialFeeling
            note = initialNote
        }
    }
}
