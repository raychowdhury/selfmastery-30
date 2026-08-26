/**
 * Action copy is stored with a `{m}` placeholder rather than a baked-in number,
 * and the number is filled in at display time from the action's *current*
 * `estimatedMinutes`.
 *
 * This matters because weekly reviews rescale durations. If the title were
 * baked at generation time, a shortened action would still read "Walk for 15
 * minutes" while its badge said 10 min.
 */
export function renderCopy(text: string, minutes: number): string {
  return text.replace(/\{m\}/g, String(minutes));
}

export function renderActionTitle(action: {
  title: string;
  estimatedMinutes: number;
}): string {
  return renderCopy(action.title, action.estimatedMinutes);
}

export function renderMinimumTitle(action: {
  minimumVersionTitle: string | null;
  minimumVersionMinutes: number | null;
  estimatedMinutes: number;
}): string | null {
  if (!action.minimumVersionTitle) return null;
  return renderCopy(
    action.minimumVersionTitle,
    action.minimumVersionMinutes ?? action.estimatedMinutes
  );
}
