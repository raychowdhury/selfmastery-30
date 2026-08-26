import SwiftUI

/// The optional top three. Separate from the generated plan: this is the
/// person's own list, and it saves itself rather than asking to be submitted.
struct PrioritiesSection: View {
    let priorities: [PriorityDTO]
    let save: ([PriorityDTO]) -> Void

    @State private var isExpanded = false
    @State private var drafts: [String] = ["", "", ""]
    @State private var done: [Bool] = [false, false, false]

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.m) {
            if isExpanded || !priorities.isEmpty {
                VStack(alignment: .leading, spacing: 2) {
                    EyebrowLabel(text: "Your top three", color: Theme.Palette.secondaryText)
                    Text("Optional. Yours, not part of the generated plan.")
                        .font(Theme.Typography.caption)
                        .foregroundStyle(Theme.Palette.secondaryText)
                }

                ForEach(0..<3, id: \.self) { index in
                    HStack(spacing: Theme.Spacing.m) {
                        Text("\(index + 1)")
                            .font(Theme.Typography.caption)
                            .foregroundStyle(Theme.Palette.secondaryText)
                            .frame(width: 14)

                        TextField(
                            index == 0 ? "The one that matters most" : "",
                            text: binding(for: index)
                        )
                        .textFieldStyle(.plain)
                        .padding(Theme.Spacing.m)
                        .frame(minHeight: 44)
                        .background(Theme.Palette.surface, in: .rect(cornerRadius: Theme.Radius.small))
                        .strikethrough(done[index])
                        .onSubmit(persist)

                        Button {
                            done[index].toggle()
                            Haptics.selection()
                            persist()
                        } label: {
                            Image(systemName: done[index] ? "checkmark.circle.fill" : "circle")
                                .font(.system(size: 22))
                                .foregroundStyle(
                                    done[index] ? Theme.Palette.accent : Theme.Palette.separator
                                )
                                .frame(width: 44, height: 44)
                                .contentShape(.rect)
                        }
                        .buttonStyle(.plain)
                        .disabled(drafts[index].trimmed.isEmpty)
                        .accessibilityLabel("Mark priority \(index + 1) done")
                        .accessibilityAddTraits(done[index] ? [.isButton, .isSelected] : .isButton)
                    }
                }
            } else {
                Button {
                    withAnimation { isExpanded = true }
                } label: {
                    Label("Add your own top three", systemImage: "plus")
                        .font(Theme.Typography.caption)
                }
            }
        }
        .onAppear(perform: sync)
        .onChange(of: priorities) { _, _ in sync() }
    }

    private func binding(for index: Int) -> Binding<String> {
        Binding(
            get: { drafts.indices.contains(index) ? drafts[index] : "" },
            set: { drafts[index] = $0 }
        )
    }

    private func sync() {
        for index in 0..<3 {
            let match = priorities.first { $0.position == index + 1 }
            drafts[index] = match?.text ?? ""
            done[index] = match?.completed ?? false
        }
    }

    private func persist() {
        let payload = (0..<3).map { index in
            PriorityDTO(position: index + 1, text: drafts[index].trimmed, completed: done[index])
        }
        save(payload)
    }
}
