import { isRecord } from '../core/json';

/** Validerar fog-fält i sparfilen (zon → base64). */
export function parseFogMap(v: unknown): Record<string, string> | undefined {
  if (!isRecord(v)) return undefined;
  const out: Record<string, string> = {};
  for (const [zone, data] of Object.entries(v)) {
    if (typeof data === 'string' && data.length > 0) out[zone] = data;
  }
  return Object.keys(out).length ? out : undefined;
}
