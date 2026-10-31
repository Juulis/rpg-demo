/** Dev, capture-bygge eller ?smoke=1 — röktest/DOM-metric utan __game i vanlig prod. */
export function smokeOrCaptureEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  if (import.meta.env.VITE_CAPTURE_HOOK === 'true') return true;
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('smoke') === '1') return true;
  return false;
}
