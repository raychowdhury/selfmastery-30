import SwiftUI

/// The answer control for whichever question is on screen.
struct OnboardingStepContent: View {
    @Bindable var model: OnboardingModel

    var body: some View {
        switch model.step {
        case .category: categoryStep
        case .goal: goalStep
        case .why: whyStep
        case .time: timeStep
        case .obstacles: obstaclesStep
        case .preferredTime: preferredTimeStep
        case .difficulty: difficultyStep
        case .success: successStep
        }
    }

    // MARK: Steps

    private var categoryStep: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.l) {
            ForEach(model.options?.categories ?? []) { category in
                SelectableRow(
                    title: category.label,
                    subtitle: category.description,
                    systemImage: category.icon.sfSymbolFallback,
                    isSelected: model.category == category.slug
                ) {
                    model.freeTextCategory = ""
                    model.category = category.slug
                    Haptics.selection()
                }
            }

            LabelledField(label: "Or describe it yourself") {
                TextField("I want to feel less tired in the afternoons…", text: $model.freeTextCategory)
                    .onChange(of: model.freeTextCategory) { _, new in
                        if !new.isEmpty { model.category = "" }
                    }
            }
        }
    }

    private var goalStep: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.l) {
            LabelledField(label: "Your goal") {
                TextField(model.goalExamples.first ?? "Describe your goal", text: $model.goal, axis: .vertical)
                    .lineLimit(1...3)
            }

            if !model.goalExamples.isEmpty {
                VStack(alignment: .leading, spacing: Theme.Spacing.s) {
                    Text("For example")
                        .font(Theme.Typography.caption)
                        .foregroundStyle(Theme.Palette.secondaryText)

                    ForEach(model.goalExamples, id: \.self) { example in
                        Button {
                            model.goal = example
                            Haptics.selection()
                        } label: {
                            Text(example)
                                .font(Theme.Typography.body)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(Theme.Spacing.m)
                                .background(
                                    Theme.Palette.surface,
                                    in: .rect(cornerRadius: Theme.Radius.small)
                                )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }

            if let note = model.safetyNote {
                SafetyNote(text: note)
            }
        }
    }

    private var whyStep: some View {
        LabelledField(label: "In your own words") {
            TextField(
                "I want more energy and to feel better about myself.",
                text: $model.whyItMatters,
                axis: .vertical
            )
            .lineLimit(3...6)
        }
    }

    private var timeStep: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.l) {
            ForEach(model.options?.timeOptions ?? [], id: \.self) { minutes in
                SelectableRow(
                    title: minutes.formattedMinutes,
                    isSelected: model.availableMinutes == minutes && model.customMinutes.isEmpty
                ) {
                    model.customMinutes = ""
                    model.availableMinutes = minutes
                    Haptics.selection()
                }
            }

            LabelledField(label: "Or set your own (minutes)") {
                TextField("45", text: $model.customMinutes)
                    .keyboardType(.numberPad)
                    .onChange(of: model.customMinutes) { _, new in
                        if let value = Int(new), value >= 5 {
                            model.availableMinutes = min(240, value)
                        }
                    }
            }
        }
    }

    private var obstaclesStep: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.s) {
            ForEach(model.options?.obstacles ?? []) { obstacle in
                SelectableRow(
                    title: obstacle.label,
                    isSelected: model.obstacles.contains(obstacle.slug),
                    isMultiSelect: true
                ) {
                    if model.obstacles.contains(obstacle.slug) {
                        model.obstacles.remove(obstacle.slug)
                    } else {
                        model.obstacles.insert(obstacle.slug)
                    }
                    Haptics.selection()
                }
            }
        }
    }

    private var preferredTimeStep: some View {
        VStack(spacing: Theme.Spacing.s) {
            ForEach(model.options?.preferredTimes ?? []) { option in
                SelectableRow(
                    title: option.label,
                    isSelected: model.preferredTime == option.value
                ) {
                    model.preferredTime = option.value
                    Haptics.selection()
                }
            }
        }
    }

    private var difficultyStep: some View {
        VStack(spacing: Theme.Spacing.s) {
            ForEach(model.options?.difficulties ?? []) { option in
                SelectableRow(
                    title: option.label,
                    subtitle: option.description,
                    isSelected: model.difficulty == option.value
                ) {
                    model.difficulty = option.value
                    Haptics.selection()
                }
            }
        }
    }

    private var successStep: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.l) {
            LabelledField(
                label: "Day 30 looks like…",
                hint: "Vague goals are the ones that quietly disappear."
            ) {
                TextField(
                    "I can consistently walk 30 minutes, five days a week.",
                    text: $model.successDefinition,
                    axis: .vertical
                )
                .lineLimit(2...5)
            }

            DatePicker(
                "Start date",
                selection: Binding(
                    get: { model.startDate.localDate },
                    set: { model.startDate = CalendarDay(date: $0) }
                ),
                in: Date()...,
                displayedComponents: .date
            )
            .font(Theme.Typography.body)
        }
    }
}

/// A tappable option row. Selection is shown by a filled control *and* the
/// accessibility trait, never by colour alone.
struct SelectableRow: View {
    let title: String
    var subtitle: String?
    var systemImage: String?
    let isSelected: Bool
    var isMultiSelect = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(alignment: .top, spacing: Theme.Spacing.m) {
                if let systemImage {
                    Image(systemName: systemImage)
                        .font(.system(size: 17))
                        .foregroundStyle(isSelected ? Theme.Palette.accent : Theme.Palette.secondaryText)
                        .frame(width: 24)
                        .accessibilityHidden(true)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(Theme.Typography.actionTitle)
                        .foregroundStyle(Theme.Palette.text)
                        .multilineTextAlignment(.leading)
                    if let subtitle {
                        Text(subtitle)
                            .font(Theme.Typography.caption)
                            .foregroundStyle(Theme.Palette.secondaryText)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }

                Spacer(minLength: Theme.Spacing.s)

                Image(systemName: selectionSymbol)
                    .font(.system(size: 20))
                    .foregroundStyle(isSelected ? Theme.Palette.accent : Theme.Palette.separator)
                    .accessibilityHidden(true)
            }
            .padding(Theme.Spacing.l)
            .frame(maxWidth: .infinity, minHeight: 56, alignment: .leading)
            .background(Theme.Palette.surface, in: .rect(cornerRadius: Theme.Radius.medium))
            .overlay {
                RoundedRectangle(cornerRadius: Theme.Radius.medium)
                    .strokeBorder(isSelected ? Theme.Palette.accent : .clear, lineWidth: 1.5)
            }
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : .isButton)
        .accessibilityLabel(subtitle.map { "\(title). \($0)" } ?? title)
    }

    private var selectionSymbol: String {
        if isMultiSelect {
            isSelected ? "checkmark.square.fill" : "square"
        } else {
            isSelected ? "checkmark.circle.fill" : "circle"
        }
    }
}

/// Shown for health, fitness, sleep and money goals.
struct SafetyNote: View {
    let text: String

    var body: some View {
        Text(text)
            .font(Theme.Typography.caption)
            .foregroundStyle(Theme.Palette.secondaryText)
            .fixedSize(horizontal: false, vertical: true)
            .padding(Theme.Spacing.m)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.Palette.surface, in: .rect(cornerRadius: Theme.Radius.small))
    }
}

extension String {
    /// Server icon names come from the web design system; map the ones that are
    /// not SF Symbols and fall back to something sensible.
    var sfSymbolFallback: String {
        switch self {
        case "heart-pulse": "heart.text.square"
        case "briefcase": "briefcase"
        case "book-open": "book"
        case "wallet": "creditcard"
        case "heart": "heart"
        case "target": "target"
        case "compass": "location.north.circle"
        case "flag": "flag"
        case "pen-line": "pencil"
        default: "circle"
        }
    }
}
