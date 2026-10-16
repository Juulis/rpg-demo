import type { HeroSave } from '../core/GameContext';
import { SAVE_VERSION, type SaveFile } from './types';

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
  };
}

/** HeroSave → sparfil. found/savedAt sätts av lagringen. */
export function fromHeroSave(s: HeroSave): SaveFile {
  const h = s.hero;
  const g = s.game;
  const r2 = (n: number): number => Number(n.toFixed(2));
  return {
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
}
