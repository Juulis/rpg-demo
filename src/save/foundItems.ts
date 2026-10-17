import type { FoundEntry } from '../core/SaveBackend';
import { isRecord } from '../core/json';

/** Validerar och normaliserar ett per-hjälte- eller legacy-fyndregister. */
export function parseFoundItemsMap(v: unknown): Record<string, FoundEntry> | undefined {
  if (!isRecord(v)) return undefined;
  const out: Record<string, FoundEntry> = {};
  for (const [id, raw] of Object.entries(v)) {
    if (!isRecord(raw) || typeof raw.first !== 'string' || typeof raw.base !== 'string') continue;
    out[id] = {
      first: raw.first,
      quality: typeof raw.quality === 'string' ? raw.quality : 'normal',
      base: raw.base,
      ilvl: typeof raw.ilvl === 'number' ? raw.ilvl : 1,
    };
  }
  return Object.keys(out).length ? out : undefined;
}

/** Läser foundItems från en sparfil-post (rå JSON). */
export function readFoundItemsFromSave(raw: unknown): Record<string, FoundEntry> | undefined {
  if (!isRecord(raw)) return undefined;
  return parseFoundItemsMap(raw.foundItems);
}

/** Legacy globalt rpg_found-objekt. */
export function parseGlobalFoundMap(raw: unknown): Record<string, FoundEntry> | undefined {
  return parseFoundItemsMap(raw);
}
