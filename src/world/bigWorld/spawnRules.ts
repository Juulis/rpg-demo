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
 * Mellanmark: effektivt ringband för spawn utifrån chunk-avstånd.
 * varld_stor.json meta.ytterkant anger band 28–30 för ring 7+; tills undertyper täcker det
 * använder vi ring 6:s band (24–30) så spawn inte faller tillbaka på biomet låga nivåer.
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

function familiesInBiome(biome: BigWorldBiome): string[] {
  const s = new Set<string>();
  for (const slot of biome.egna_monster ?? []) s.add(slot.familj);
  for (const k of Object.keys(biome.monsterfamiljer ?? {})) s.add(k);
  return [...s];
}

function collectBiomeSubtypeIds(biome: BigWorldBiome, monsterFamily: string): string[] {
  const ids = new Set<string>();
  const monsters = DATA.families.monsters;
  const byId = new Map(monsters.map((m) => [m.id, m]));

  for (const slot of biome.egna_monster ?? []) {
    if (slot.familj !== monsterFamily) continue;
    for (const id of slot.undertyper_nu) {
      const def = byId.get(id);
      if (def && def.family === monsterFamily) ids.add(id);
    }
  }
  for (const id of biome.monsterfamiljer?.[monsterFamily] ?? []) {
    const def = byId.get(id);
    if (def && def.family === monsterFamily) ids.add(id);
  }
  return [...ids];
}

/** En familj i taget — ingen mix (spawnzoner meta.mixed_spawn_enabled = false). */
export function biomeSpawnSubtypes(
  biome: BigWorldBiome | undefined,
  monsterFamily: string | null,
  band: readonly [number, number],
): string[] {
  if (!biome || !monsterFamily) return [];
  return filterSubtypesByBand(collectBiomeSubtypeIds(biome, monsterFamily), band);
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

/**
 * Mellanmark: levelBand är alltid chunkens effektiva ringband.
 * Undertyper måste ligga i ringbandet — annars ingen spawn (validering i tester).
 */
export function planMellanmarkSpawn(
  data: BigWorldDataFile,
  biome: BigWorldBiome | undefined,
  nearestRegion: BigWorldRegion,
  chunkRing: number,
  chunkBand: readonly [number, number],
): MellanmarkSpawnPlan {
  const ringBand = mellanmarkLevelBand(data, chunkRing, chunkBand);
  const prefer = nearestRegion.monsterfamilj ?? null;

  const family = pickBiomeMonsterFamily(biome, ringBand, prefer);
  if (family) {
    const inBand = biomeSpawnSubtypes(biome, family, ringBand);
    if (inBand.length > 0) {
      return { spawnBand: ringBand, monsterFamily: family, spawnSubtypes: inBand };
    }
  }

  for (const fam of familiesInBiome(biome ?? ({} as BigWorldBiome))) {
    const inBand = biomeSpawnSubtypes(biome, fam, ringBand);
    if (inBand.length > 0) return { spawnBand: ringBand, monsterFamily: fam, spawnSubtypes: inBand };
  }

  return { spawnBand: ringBand, monsterFamily: null, spawnSubtypes: [] };
}
