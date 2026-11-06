import type { Vec2 } from '../../core/GameContext';
import { DATA } from '../../data';
import { chebyshevChunkDist } from './ringZone';
import { resolveRegionAtChunk } from './regionIndex';
import { chunkCenterWorld, worldToChunk } from './bigWorldCoords';
import { getBigWorldCatalog } from './worldGenerator';

/** Chunk [1,1] (Rungläntan) — endast legacy spawnzoner, ingen chunk-genererad spawn. */
export function isLegacyOnlySpawnChunk(cx: number, cy: number): boolean {
  const fp = DATA.varldStor.meta.startskogen_fotavtryck?.chunk ?? [1, 1];
  return cx === fp[0] && cy === fp[1];
}

/** @deprecated använd isLegacyOnlySpawnChunk för spawn-system */
export function isInsideStartskogenChunk(cx: number, cy: number): boolean {
  return isLegacyOnlySpawnChunk(cx, cy);
}

/** Hjälten i startskogens region (chebyshev ≤ radie) — legacy-kö och närhet. */
export function heroInsideStartskogenRegion(hero: Vec2): boolean {
  const region = getBigWorldCatalog().regionById.get('startskogen');
  if (!region) return false;
  const { cx, cy } = worldToChunk(hero.x, hero.y);
  const [rx, ry] = region.chunk;
  return chebyshevChunkDist(cx, cy, rx, ry) <= region.radie;
}

export function regionAtHero(hero: Vec2): ReturnType<typeof resolveRegionAtChunk> {
  const { cx, cy } = worldToChunk(hero.x, hero.y);
  return resolveRegionAtChunk(cx, cy, getBigWorldCatalog().data.regioner);
}

/** Världsposition för Rungläntans mitt (0,0). */
export function runglantanWorldCenter(): Vec2 {
  const fp = DATA.varldStor.meta.startskogen_fotavtryck?.chunk ?? [1, 1];
  return chunkCenterWorld(fp[0], fp[1]);
}
