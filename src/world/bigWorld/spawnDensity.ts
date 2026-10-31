import spawnDensityTable from '../../data/bigWorldSpawnDensity.json';
import type { BigWorldRegion } from '../../data/bigWorldTypes';

type RingRange = readonly [number, number];

const table = spawnDensityTable as unknown as {
  tathet_per_chunk: Record<string, RingRange>;
  named_region_default: RingRange;
  regions: Record<string, RingRange>;
};

function ringKey(ring: number): string {
  if (ring <= 0) return 'ring_0';
  if (ring === 1) return 'ring_1';
  if (ring === 2) return 'ring_2';
  return 'ring_3_och_ut';
}

/** Mellanmark / ring — värden från src/data/bigWorldSpawnDensity.json (design: varldsgenerator). */
export function mellanmarkSpawnCountRange(ring: number): RingRange {
  const key = ringKey(ring);
  return table.tathet_per_chunk[key] ?? [12, 18];
}

/** Namngiven region med genererad_spawn — egen rad i data eller konservativ default. */
export function namedRegionSpawnCountRange(region: BigWorldRegion): RingRange {
  return table.regions[region.id] ?? table.named_region_default;
}

/** Avstånd i rutor från vägcentrum inom chunk (varldsgenerator: 4 rutor). */
export function spawnTileNearRoad(
  localX: number,
  localY: number,
  cx: number,
  cy: number,
  roadIds: readonly string[],
  hasRoadAtTile: (cx: number, cy: number, ti: number, tj: number) => boolean,
): boolean {
  if (roadIds.length === 0) return false;
  const ti = Math.floor(localX);
  const tj = Math.floor(localY);
  for (let dj = -4; dj <= 4; dj++) {
    for (let di = -4; di <= 4; di++) {
      if (Math.abs(di) + Math.abs(dj) > 4) continue;
      if (hasRoadAtTile(cx, cy, ti + di, tj + dj)) return true;
    }
  }
  return false;
}

/** 50 % chans att hoppa över spawn vid väg (per monster, inte hela chunken). */
export function skipSpawnNearRoad(nearRoad: boolean, rngNext: number): boolean {
  return nearRoad && rngNext > 0.5;
}
