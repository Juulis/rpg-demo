import type { Vec2, ZoneView } from '../core/GameContext';
import type { Key } from '../i18n/types';
import type { MapModel } from './MapModel';

export interface Goal {
  x: number;
  y: number;
  text: Key;
}

/** Nästa mål: närmaste inaktiva runsten, annars portalen. */
export class GoalTracker {
  constructor(private readonly model: MapModel) {}

  goal(z: ZoneView, hero: Vec2): Goal | null {
    const inactive = z.runes.filter((r) => !r.active);
    if (inactive.length) {
      let best = inactive[0];
      let bd = Infinity;
      for (const r of inactive) {
        const d = Math.hypot(r.x - hero.x, r.y - hero.y);
        if (d < bd) {
          bd = d;
          best = r;
        }
      }
      if (best) return { x: best.x, y: best.y, text: 'map.goal_rune' };
    }
    if (z.runes.length) {
      const p = z.portals[0];
      if (p) return { x: p.x, y: p.y, text: 'map.goal_portal' };
      const fp = this.model.forestPortal();
      if (fp) return { x: fp[0], y: fp[1], text: 'map.goal_portal' };
    }
    return null;
  }
}
