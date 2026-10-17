import { isRecord } from '../core/json';
import type { HeroIndexEntry } from './types';

/** Tolkar rpg_heroes-indexet (samma form som js/save.js). */
export function parseHeroIndex(raw: unknown): HeroIndexEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isRecord).flatMap((h): HeroIndexEntry[] =>
    typeof h.id === 'string' && h.id
      ? [
          {
            id: h.id,
            name: typeof h.name === 'string' ? h.name : h.id,
            cls: typeof h.cls === 'string' ? h.cls : 'riddare',
            level: typeof h.level === 'number' ? h.level : 1,
            ...(typeof h.savedAt === 'number' ? { savedAt: h.savedAt } : {}),
          },
        ]
      : [],
  );
}
