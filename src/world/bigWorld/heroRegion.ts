import type { Vec2 } from '../../core/GameContext';
import { chebyshevChunkDist } from './ringZone';
import { resolveRegionAtChunk } from './regionIndex';
import { worldToChunk } from './bigWorldCoords';
import { getBigWorldCatalog } from './worldGenerator';

/** Hjälten står inne i startskogens region (chebyshev ≤ radie), inte bara zone.areaId. */
export function isInsideStartskogenChunk(cx: number, cy: number): boolean {
  const region = getBigWorldCatalog().regionById.get('startskogen');
  if (!region) return false;
  const [rx, ry] = region.chunk;
  return chebyshevChunkDist(cx, cy, rx, ry) <= region['radie'];
}

export function heroInsideStartskogenRegion(hero: Vec2): boolean {
  const { cx, cy } = worldToChunk(hero.x, hero.y);
  return isInsideStartskogenChunk(cx, cy);
}

export function regionAtHero(hero: Vec2): ReturnType<typeof resolveRegionAtChunk> {
  const { cx, cy } = worldToChunk(hero.x, hero.y);
  return resolveRegionAtChunk(cx, cy, getBigWorldCatalog().data.regioner);
}
