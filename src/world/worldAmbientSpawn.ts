import { Rng } from '../core/Rng';
import type { Vec2 } from '../core/GameContext';
import type { Zone } from './Zone';
import { WORLD_ANIMAL_FIGURES, WORLD_HUMAN_FIGURES, type WorldAnimalFigure, type WorldHumanFigure } from '../render/WorldFigureSprites';

export interface WorldAmbientSpawn {
  id: string;
  figure: WorldHumanFigure | WorldAnimalFigure;
  pos: Vec2;
}

const HUMAN_POOL: readonly WorldHumanFigure[] = WORLD_HUMAN_FIGURES;
const ANIMAL_POOL: readonly WorldAnimalFigure[] = WORLD_ANIMAL_FIGURES;

function pickPos(zone: Zone, rng: Rng, r = 0.45): Vec2 | null {
  const lim = (zone.circle ?? Math.min(zone.width, zone.height) / 2) - 4;
  for (let i = 0; i < 24; i++) {
    const a = rng.next() * Math.PI * 2;
    const d = (0.35 + rng.next() * 0.55) * lim;
    const p = { x: Math.cos(a) * d, y: Math.sin(a) * d };
    zone.collide(p, r);
    if (zone.contains(p)) return p;
  }
  return null;
}

/**
 * Slumpade världsfigurer i startskogen (akt 1): jägare, äventyrare, vakt, handlare + enstaka djur.
 * Seed: spel-seed + area så samma sparning ger samma patruller.
 */
export function worldAmbientSpawns(zone: Zone, gameSeed: number): WorldAmbientSpawn[] {
  if (zone.name !== 'forest' || zone.areaId !== 'startskogen') return [];
  const rng = new Rng(Rng.hash('ambient', gameSeed, zone.areaId));
  const out: WorldAmbientSpawn[] = [];
  const humanCount = 2 + Math.floor(rng.next() * 3);
  for (let i = 0; i < humanCount; i++) {
    const figure = HUMAN_POOL[Math.floor(rng.next() * HUMAN_POOL.length)] ?? 'jagare';
    const pos = pickPos(zone, rng);
    if (!pos) continue;
    out.push({ id: `ambient:${figure}:${i}`, figure, pos });
  }
  if (rng.next() < 0.65) {
    const figure = ANIMAL_POOL[Math.floor(rng.next() * ANIMAL_POOL.length)] ?? 'radjur';
    const pos = pickPos(zone, rng, 0.7);
    if (pos) out.push({ id: `ambient:${figure}:0`, figure, pos });
  }
  return out;
}
