import type { BigWorldBiome, BigWorldDataFile, BigWorldRegion } from '../../data/bigWorldTypes';
import { DATA } from '../../data';
import { subtypeAllowedInBand } from './ringZone';

/** Ringens nivåband för en given ringzon (region.ringzon). */
export function levelBandForRingzon(data: BigWorldDataFile, ringzon: number | undefined): [number, number] | null {
  if (ringzon == null) return null;
  const ring = data.meta.zonmodell?.ringar?.find((r) => r.ring === ringzon);
  return ring?.nivaband ?? null;
}

/** Spawnband inne i en region: ringzonens band (zonmodell), annars region.nivaband. */
export function regionSpawnLevelBand(data: BigWorldDataFile, region: BigWorldRegion): [number, number] {
  const fromRing = levelBandForRingzon(data, region.ringzon);
  if (fromRing) return fromRing;
  if (region.nivaband) return region.nivaband;
  return [1, 3];
}

/**
 * Mellanmark: ring 7+ saknar undertyper i band 28–30 tills maxnivå höjs.
 * Tills vidare använder spawn ring 6:s band (design meta.ytterkant + Juulis review #103).
 */
export function mellanmarkLevelBand(data: BigWorldDataFile, ring: number, chunkBand: readonly [number, number]): [number, number] {
  if (ring >= 7) {
    const ring6 = data.meta.zonmodell?.ringar?.find((r) => r.ring === 6);
    if (ring6?.nivaband) return ring6.nivaband;
  }
  return [chunkBand[0], chunkBand[1]];
}

export function filterSubtypesByBand(subtypes: readonly string[], band: readonly [number, number]): string[] {
  const fixed = DATA.monsterLevels.fixed_levels ?? {};
  return subtypes.filter((id) => {
    const lv = fixed[id];
    if (lv == null) return false;
    return subtypeAllowedInBand(lv, band);
  });
}

function bandKey(b: readonly [number, number]): string {
  return `${b[0]}-${b[1]}`;
}

/** Alla fasta nivåer för undertyper listade i biomet (egna_monster + monsterfamiljer). */
export function biomeSubtypeLevelSpan(biome: BigWorldBiome | undefined): [number, number] | null {
  if (!biome) return null;
  const fixed = DATA.monsterLevels.fixed_levels ?? {};
  const levels: number[] = [];
  for (const slot of biome.egna_monster ?? []) {
    for (const id of slot.undertyper_nu) {
      const lv = fixed[id];
      if (lv != null) levels.push(lv);
    }
  }
  for (const ids of Object.values(biome.monsterfamiljer ?? {})) {
    for (const id of ids) {
      const lv = fixed[id];
      if (lv != null) levels.push(lv);
    }
  }
  if (levels.length === 0) return null;
  return [Math.min(...levels), Math.max(...levels)];
}

function intersectLevelBands(a: readonly [number, number], b: readonly [number, number]): [number, number] | null {
  const lo = Math.max(a[0], b[0]);
  const hi = Math.min(a[1], b[1]);
  if (lo > hi) return null;
  return [lo, hi];
}

/** Reservband: chunk/ring, region, biomet — klampat mot biomet om ringbandet är tomma. */
export function mellanmarkBandsToTry(
  data: BigWorldDataFile,
  biome: BigWorldBiome | undefined,
  region: BigWorldRegion,
  chunkRing: number,
  chunkBand: readonly [number, number],
): [number, number][] {
  const out: [number, number][] = [];
  const seen = new Set<string>();
  const push = (b: readonly [number, number] | null | undefined) => {
    if (!b) return;
    const k = bandKey(b);
    if (seen.has(k)) return;
    seen.add(k);
    out.push([b[0], b[1]]);
  };

  push(mellanmarkLevelBand(data, chunkRing, chunkBand));
  push(regionSpawnLevelBand(data, region));
  push(chunkBand);
  if (region.nivaband) push(region.nivaband);
  if (biome?.nivaband) push(biome.nivaband);

  const span = biomeSubtypeLevelSpan(biome);
  if (span) {
    push(intersectLevelBands(chunkBand, span));
    push(intersectLevelBands(regionSpawnLevelBand(data, region), span));
    push(span);
  }

  return out;
}

function familiesInBiome(biome: BigWorldBiome): string[] {
  const s = new Set<string>();
  for (const slot of biome.egna_monster ?? []) s.add(slot.familj);
  for (const k of Object.keys(biome.monsterfamiljer ?? {})) s.add(k);
  return [...s];
}

/** En familj i taget — ingen mix (spawnzoner meta.mixed_spawn_enabled = false). */
export function biomeSpawnSubtypes(
  biome: BigWorldBiome | undefined,
  monsterFamily: string | null,
  band: readonly [number, number],
): string[] {
  if (!biome || !monsterFamily) return [];
  const ids = new Set<string>();
  for (const slot of biome.egna_monster ?? []) {
    if (slot.familj !== monsterFamily) continue;
    for (const id of slot.undertyper_nu) ids.add(id);
  }
  const famMap = biome.monsterfamiljer ?? {};
  for (const id of famMap[monsterFamily] ?? []) ids.add(id);
  return filterSubtypesByBand([...ids], band);
}

/** Välj familj med flest giltiga undertyper i bandet; föredrar nearest regions familj om den fungerar. */
export function pickBiomeMonsterFamily(
  biome: BigWorldBiome | undefined,
  band: readonly [number, number],
  prefer: string | null,
): string | null {
  if (!biome) return null;
  if (prefer && biomeSpawnSubtypes(biome, prefer, band).length > 0) return prefer;
  let best: string | null = null;
  let bestN = 0;
  for (const fam of familiesInBiome(biome)) {
    const n = biomeSpawnSubtypes(biome, fam, band).length;
    if (n > bestN) {
      bestN = n;
      best = fam;
    }
  }
  return best;
}

export interface MellanmarkSpawnPlan {
  spawnBand: [number, number];
  monsterFamily: string | null;
  spawnSubtypes: string[];
}

/** Mellanmark: band + familj + undertyper med reserv (regionband, ring-6 vid ytterkant). */
export function planMellanmarkSpawn(
  data: BigWorldDataFile,
  biome: BigWorldBiome | undefined,
  nearestRegion: BigWorldRegion,
  chunkRing: number,
  chunkBand: readonly [number, number],
): MellanmarkSpawnPlan {
  const bandsToTry = mellanmarkBandsToTry(data, biome, nearestRegion, chunkRing, chunkBand);
  const prefer = nearestRegion.monsterfamilj ?? null;
  for (const band of bandsToTry) {
    const family = pickBiomeMonsterFamily(biome, band, prefer);
    const spawnSubtypes = family ? biomeSpawnSubtypes(biome, family, band) : [];
    if (spawnSubtypes.length > 0) {
      return { spawnBand: band, monsterFamily: family, spawnSubtypes };
    }
  }
  return {
    spawnBand: bandsToTry[0] ?? [chunkBand[0], chunkBand[1]],
    monsterFamily: null,
    spawnSubtypes: [],
  };
}
