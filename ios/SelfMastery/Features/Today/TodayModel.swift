import Foundation
import Observation

/// State for the Today screen.
///
/// Completion is optimistic: the checkbox flips immediately, the request goes
/// out behind it, and a failure puts the row back. Waiting on a round trip to
/// tick something off would make the most-used control in the app feel broken
/// on a slow connection.
@MainActor
@Observable
final class TodayModel {
    enum LoadState: Equatable {
        case loading
        case loaded
        case empty
        case failed(String)
    }

    private(set) var loadState: LoadState = .loading
    private(set) var challenge: ChallengeDTO?
    private(set) var day: DayDTO?
    private(set) var dayNumber = 1
    private(set) var phaseLabel = ""
    private(set) var stats: StatsDTO?
    private(set) var reviewDue: Int?
    private(set) var isOver = false

    /// Ids currently being written, so a row can show it is settling.
    private(set) var inFlight: Set<String> = []
    private(set) var actionError: String?

    private let api: SelfMasteryAPI
    private let environment: AppEnvironment

    init(api: SelfMasteryAPI, environment: AppEnvironment) {
        self.api = api
        self.environment = environment
    }

    // MARK: Derived

    var actions: [ActionDTO] { day?.actions ?? [] }

    var completion: CompletionDTO {
        day?.completion ?? CompletionDTO(required: 0, completed: 0, percent: 0)
    }

    var isMinimumDay: Bool { day?.isMinimumDay ?? false }

    var remainingLabel: String {
        let remaining = completion.required - completion.completed
        switch remaining {
        case ..<1: return "You showed up."
        case 1: return "One action left for today."
        default: return "\(remaining) actions left for today."
        }
    }

    /// The heaviest action's original and reduced form, for the Minimum Day sheet.
    var minimumPreview: (from: String, to: String)? {
        guard
            let candidate = actions
                .filter({ !$0.optional && $0.minimumTitle != nil })
                .max(by: { $0.estimatedMinutes < $1.estimatedMinutes }),
            let reduced = candidate.minimumTitle
        else { return nil }
        return (candidate.title, reduced)
    }

    var topPriority: PriorityDTO? {
        day?.priorities.first { !$0.completed }
    }

    var dateLabel: String {
        guard let raw = day?.date, let calendarDay = CalendarDay(raw) else { return "" }
        return calendarDay.formattedLong()
    }

    // MARK: Loading

    func load(showSpinner: Bool = true) async {
        if showSpinner, challenge == nil { loadState = .loading }

        do {
            let response = try await api.today()
            guard let challenge = response.challenge, let day = response.day else {
                loadState = .empty
                return
            }

            self.challenge = challenge
            self.day = day
            dayNumber = response.dayNumber ?? day.dayNumber
            phaseLabel = response.phaseLabel ?? ""
            stats = response.stats
            reviewDue = response.reviewDue
            isOver = response.isOver ?? false
            loadState = .loaded
            environment.setOffline(false)
        } catch let error as APIError {
            if error.isCancellation { return }
            await environment.handle(error)
            // Keep whatever is already on screen if this was a refresh: a
            // dropped connection should not blank out today's plan.
            loadState = challenge == nil ? .failed(error.userMessage) : .loaded
        } catch {
            loadState = challenge == nil ? .failed("Something went wrong.") : .loaded
        }
    }

    // MARK: Mutations

    func toggle(_ action: ActionDTO) async {
        guard let day else { return }

        let target = !action.completed
        applyLocally(actionId: action.id, completed: target)
        inFlight.insert(action.id)
        actionError = nil
        defer { inFlight.remove(action.id) }

        Haptics.actionCompleted()

        do {
            try await api.setAction(id: action.id, completed: target)
            // Re-read so the server's completion maths, not ours, is what shows.
            await load(showSpinner: false)
        } catch let error as APIError {
            applyLocally(actionId: action.id, completed: !target)
            actionError = error.userMessage
            await environment.handle(error)
            _ = day
        } catch {
            applyLocally(actionId: action.id, completed: !target)
            actionError = "Couldn't save that. Try again."
        }
    }

    /// Rewrites one action in place and recomputes the day's completion the
    /// same way the server does, so the progress bar moves with the checkbox.
    private func applyLocally(actionId: String, completed: Bool) {
        guard let current = day else { return }

        let updated = current.actions.map { action -> ActionDTO in
            guard action.id == actionId else { return action }
            return ActionDTO(
                id: action.id,
                title: action.title,
                description: action.description,
                estimatedMinutes: action.estimatedMinutes,
                completed: completed,
                optional: action.optional,
                pillarId: action.pillarId,
                pillarName: action.pillarName,
                sortOrder: action.sortOrder,
                minimumTitle: action.minimumTitle,
                minimumMinutes: action.minimumMinutes
            )
        }

        let required = updated.filter { !$0.optional }
        let done = required.filter(\.completed).count
        let percent = required.isEmpty
            ? 0
            : Int((Double(done) / Double(required.count) * 100).rounded())

        day = DayDTO(
            id: current.id,
            dayNumber: current.dayNumber,
            date: current.date,
            phase: current.phase,
            isMinimumDay: current.isMinimumDay,
            completedAt: current.completedAt,
            actions: updated,
            priorities: current.priorities,
            reflection: current.reflection,
            completion: CompletionDTO(
                required: required.count,
                completed: done,
                percent: percent
            )
        )
    }

    func setMinimumDay(_ enabled: Bool) async {
        guard let day else { return }
        do {
            try await api.setMinimumDay(dayId: day.id, isMinimumDay: enabled)
            await load(showSpinner: false)
        } catch let error as APIError {
            actionError = error.userMessage
            await environment.handle(error)
        } catch {
            actionError = "Couldn't switch today's plan."
        }
    }

    func savePriorities(_ priorities: [PriorityDTO]) async {
        guard let day else { return }
        let filled = priorities.filter { !$0.text.trimmed.isEmpty }
        do {
            try await api.savePriorities(dayId: day.id, priorities: filled)
            await load(showSpinner: false)
        } catch {
            actionError = "Couldn't save your priorities."
        }
    }

    func finishDay(feeling: String?, note: String?) async -> Bool {
        guard let day else { return false }
        do {
            try await api.saveReflection(
                dayId: day.id,
                feeling: feeling,
                note: note?.trimmed.isEmpty == false ? note : nil
            )
            try await api.finishDay(dayId: day.id)
            Haptics.dayFinished()
            await load(showSpinner: false)
            return true
        } catch let error as APIError {
            actionError = error.userMessage
            await environment.handle(error)
            return false
        } catch {
            actionError = "Couldn't finish the day."
            return false
        }
    }
}
