import type { Vec2, ZoneView } from '../core/GameContext';
import type { VillageZoneDef } from '../data/types';
import type { MapModel } from './MapModel';

export interface Goal {
  x: number;
  y: number;
  text: string;
}

/** Nästa mål: i skogen runsten/portal; i byn nästa ej rensade zon eller kapellet. */
export class GoalTracker {
  constructor(private readonly model: MapModel) {}

  goal(z: ZoneView, hero: Vec2): Goal | null {
    if (z.name === 'village' || z.areaId === 'gamla_byn') return this.villageGoal(z);
    if (z.name === 'wolfstead' || z.areaId === 'vargaby') {
      const a = z.arena;
      if (a) return { x: (a.x0 + a.x1) / 2, y: (a.y0 + a.y1) / 2, text: 'Nästa mål: Ulvhilds ide' };
    }
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

  private villageGoal(z: ZoneView): Goal | null {
    const zones = this.model.villageZones();
    for (const q of zones) {
      if (q.safe) continue;
      if (!z.cleared[q.id]) {
        const [x, y] = this.zoneCenter(q);
        return { x, y, text: `Nästa mål: ${this.model.areaName(q.id)}` };
      }
    }
    const chapel = zones.find((q) => q.id === 'benkungens_kapell');
    if (chapel) {
      const [x, y] = this.zoneCenter(chapel);
      return { x, y, text: `Nästa mål: ${this.model.areaName(chapel.id)}` };
    }
    return null;
  }

  private zoneCenter(q: VillageZoneDef): [number, number] {
    const t0 = q.tiles[0];
    const t1 = q.tiles[1];
    const tx = (t0[0] + t1[0]) / 2;
    const ty = (t0[1] + t1[1]) / 2;
    return this.model.tileToWorld(tx, ty);
  }
}
