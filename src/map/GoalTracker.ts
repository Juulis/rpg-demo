import type { MapZone, Vec2 } from '../core/context.ext';
import type { MapModel } from './MapModel';

export interface Goal {
  x: number;
  y: number;
  text: string;
}

/** Nästa mål: närmaste inaktiva runsten, annars portalen. */
export class GoalTracker {
  constructor(private readonly model: MapModel) {}

  goal(z: MapZone, hero: Vec2): Goal | null {
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
      if (best) return { x: best.x, y: best.y, text: 'Nästa mål: runsten' };
    }
    if (z.runes.length) {
      const p = z.portals[0];
      if (p) return { x: p.x, y: p.y, text: 'Nästa mål: portalen' };
      const fp = this.model.forestPortal();
      if (fp) return { x: fp[0], y: fp[1], text: 'Nästa mål: portalen' };
    }
    return null;
  }
}
