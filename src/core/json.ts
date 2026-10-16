/** Rena JSON-hjälpare utan DOM-beroenden. */
export const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function parseJson(s: string | null): unknown {
  if (s == null) return null;
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return null;
  }
}
