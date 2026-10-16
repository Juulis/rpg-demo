/** Sant om fokus ligger i ett textfält (då ska spelets snabbtangenter släppas igenom). */
export function isTypingTarget(t: EventTarget | Element | null): boolean {
  if (!t || !(t instanceof HTMLElement)) return false;
  return t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
}
