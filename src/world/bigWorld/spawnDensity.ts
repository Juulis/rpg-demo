import { DATA } from '../../data';
import type { BigWorldDataFile, BigWorldRegion } from '../../data/bigWorldTypes';

type RingRange = readonly [number, number];

function asRange(v: number | RingRange): RingRange {
  if (typeof v === 'number') return [v, v];
  return v;
}

function ringKey(ring: number): string {
  if (ring <= 0) return 'ring_0';
  if (ring === 1) return 'ring_1';
  if (ring === 2) return 'ring_2';
  return 'ring_3_och_ut';
}

const genTable = DATA.varldGenerator.monsterpooler.tathet_per_chunk as Record<string, RingRange>;

/** Mellanmark — värden från varldsgenerator.json (design: snitt 0,5 = [0,1]). */
export function mellanmarkSpawnCountRange(ring: number): RingRange {
  const key = ringKey(ring);
  return genTable[key] ?? [0, 1];
}

/** Namngiven region / delområde — region.tathet eller meta.tathet_regel. */
export function regionSpawnCountRange(region: BigWorldRegion, ring: number, data: BigWorldDataFile = DATA.varldStor): RingRange {
  if (region.tathet != null) return asRange(region.tathet);
  const regel = data.meta.tathet_regel;
  if (region.genererad_spawn !== true) {
    if (region.typ === 'by' || region.typ === 'stad') return [0, 0];
    if (regel?.byar != null && region.typ === 'by') return [regel.byar, regel.byar];
    return [0, 0];
  }
  if (regel) {
    if (ring === 2 && regel.ring_2_kontroll != null) return [regel.ring_2_kontroll, regel.ring_2_kontroll];
    if (ring <= 1 && regel.delomrade_ring_0_1 != null) return [regel.delomrade_ring_0_1, regel.delomrade_ring_0_1];
    if (ring >= 3 && regel.vildmark_ring_3_plus != null) return [regel.vildmark_ring_3_plus, regel.vildmark_ring_3_plus];
  }
  return [2, 2];
}

/** @deprecated use regionSpawnCountRange */
export function namedRegionSpawnCountRange(region: BigWorldRegion): RingRange {
  return regionSpawnCountRange(region, region.ringzon ?? 0);
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

export function mellanmarkChampionRoll(): { minRing: number; chance: number } {
  const elit = DATA.varldGenerator.monsterpooler.elit;
  return {
    minRing: elit.mellanmark_champion_min_ring ?? 2,
    chance: elit.mellanmark_champion_chance_per_chunk ?? 0.1,
  };
}

export function fogRevealRadiusWorld(): number {
  const k = DATA.varldGenerator.karta_och_dimma;
  if (k.dimma_radie_enheter != null) return k.dimma_radie_enheter;
  const rutor = k.dimma_radie_rutor ?? 14;
  return rutor * 2;
}
