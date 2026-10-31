/** Dev, capture-bygge eller ?smoke=1 — DOM-metrics för röktest. */
export function smokeMetricsEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  if (import.meta.env.VITE_CAPTURE_HOOK === 'true') return true;
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('smoke') === '1') return true;
  return false;
}

/** Teleport m.m. — endast dev/capture, inte ?smoke=1 i prod. */
export function captureSmokeHooksEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  return import.meta.env.VITE_CAPTURE_HOOK === 'true';
}

/** @deprecated use smokeMetricsEnabled */
export function smokeOrCaptureEnabled(): boolean {
  return smokeMetricsEnabled();
}
