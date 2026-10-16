import type { FoundEntry } from '../core/SaveBackend';
import type { HeroSave } from '../core/GameContext';
import { isRecord } from '../core/json';
import { SAVE_VERSION, type SaveFile } from './types';

const foundItems = (v: unknown): Record<string, FoundEntry> | undefined => {
  if (!isRecord(v)) return undefined;
  const out: Record<string, FoundEntry> = {};
  for (const [id, raw] of Object.entries(v)) {
    if (!isRecord(raw)) continue;
    if (typeof raw.first !== 'string' || typeof raw.base !== 'string') continue;
    out[id] = {
      first: raw.first,
      quality: typeof raw.quality === 'string' ? raw.quality : 'normal',
      base: raw.base,
      ilvl: typeof raw.ilvl === 'number' ? raw.ilvl : 1,
    };
  }
  return Object.keys(out).length ? out : undefined;
};

/** Sparfil (lagringsformat, bakåtkompatibelt med js/save.js) → core-formatet HeroSave. */
export function toHeroSave(d: SaveFile): HeroSave {
  const h = d.hero;
  const g = d.game;
  return {
    hero: { id: h.id, name: h.name, cls: h.cls, level: h.level, xp: h.xp, gold: h.gold, inv: h.inv, equip: h.equip, fresh: !!h.fresh },
    game: g
      ? {
          seed: g.seed,
          killed: [...g.killed],
          zone: g.zone,
          pos: g.pos ? { x: g.pos[0], y: g.pos[1] } : null,
          stage: g.stage,
          runes: g.runes,
          city: g.city,
        }
      : null,
    ...(d.foundItems ? { foundItems: d.foundItems } : {}),
  };
}

/** HeroSave → sparfil. foundItems/savedAt kan sättas av lagringen. */
export function fromHeroSave(s: HeroSave, foundItems?: Record<string, FoundEntry>): SaveFile {
  const items = foundItems ?? s.foundItems;
  const h = s.hero;
  const g = s.game;
  const r2 = (n: number): number => Number(n.toFixed(2));
  const out: SaveFile = {
    version: SAVE_VERSION,
    hero: {
      id: h.id ?? '',
      name: h.name,
      cls: h.cls,
      level: h.level,
      xp: h.xp,
      gold: h.gold,
      inv: h.inv,
      equip: h.equip,
      ...(h.fresh ? { fresh: true } : {}),
    },
    game: g
      ? {
          seed: g.seed,
          killed: [...g.killed],
          zone: g.zone,
          pos: g.pos ? [r2(g.pos.x), r2(g.pos.y)] : null,
          stage: g.stage,
          runes: g.runes,
          city: g.city,
        }
      : null,
  };
  if (items) {
    out.foundItems = items;
    out.found = Object.keys(items).length;
  }
  return out;
}

/** Läser foundItems från rå sparfil (efter migrator). */
export function readFoundItems(raw: unknown): Record<string, FoundEntry> | undefined {
  if (!isRecord(raw)) return undefined;
  return foundItems(raw.foundItems);
}
