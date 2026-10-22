import { Rng } from '../core/Rng';
import type { Vec2 } from '../core/GameContext';
import type { Zone } from './Zone';
import type { WorldHumanFigure } from '../render/WorldFigureSprites';

export interface WorldFighterSpawn {
  id: string;
  figure: WorldHumanFigure;
  pos: Vec2;
  group: number;
}

const FIGHTER_POOL: readonly WorldHumanFigure[] = ['jagare', 'aventyrare', 'varld_vakt'];

function pickGroupCenter(zone: Zone, rng: Rng): Vec2 | null {
  const lim = (zone.circle ?? Math.min(zone.width, zone.height) / 2) - 8;
  for (let i = 0; i < 28; i++) {
    const a = rng.next() * Math.PI * 2;
    const d = (0.25 + rng.next() * 0.7) * lim;
    const p = { x: Math.cos(a) * d, y: Math.sin(a) * d };
    zone.collide(p, 0.5);
    if (zone.contains(p)) return p;
  }
  return null;
}

/** Slumpade stridsgrupper (2–3 figurer) i startskogen. */
export function worldFighterSpawns(zone: Zone, gameSeed: number): WorldFighterSpawn[] {
  if (zone.name !== 'forest' || zone.areaId !== 'startskogen') return [];
  const rng = new Rng(Rng.hash('fighters', gameSeed, zone.areaId));
  const groupCount = 2 + Math.floor(rng.next() * 2);
  const out: WorldFighterSpawn[] = [];
  for (let g = 0; g < groupCount; g++) {
    const center = pickGroupCenter(zone, rng);
    if (!center) continue;
    const size = 2 + Math.floor(rng.next() * 2);
    for (let i = 0; i < size; i++) {
      const figure = FIGHTER_POOL[Math.floor(rng.next() * FIGHTER_POOL.length)] ?? 'jagare';
      const a = rng.next() * Math.PI * 2;
      const d = 0.6 + rng.next() * 1.8;
      const pos = { x: center.x + Math.cos(a) * d, y: center.y + Math.sin(a) * d };
      zone.collide(pos, 0.45);
      if (!zone.contains(pos)) {
        pos.x = center.x;
        pos.y = center.y;
      }
      out.push({ id: `fighter:g${g}:${figure}:${i}`, figure, pos, group: g });
    }
  }
  return out;
}
