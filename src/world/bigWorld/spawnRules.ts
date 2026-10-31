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

export function filterSubtypesByBand(subtypes: readonly string[], band: readonly [number, number]): string[] {
  const fixed = DATA.monsterLevels.fixed_levels ?? {};
  return subtypes.filter((id) => {
    const lv = fixed[id];
    if (lv == null) return false;
    return subtypeAllowedInBand(lv, band);
  });
}

/** Mellanmark: undertyper från biomet (egna_monster + familjkarta) inom ringband, filtrerat på huvudfamilj. */
export function biomeSpawnSubtypes(
  biome: BigWorldBiome | undefined,
  monsterFamily: string | null,
  band: readonly [number, number],
): string[] {
  if (!biome) return [];
  const ids = new Set<string>();
  for (const slot of biome.egna_monster ?? []) {
    if (monsterFamily && slot.familj !== monsterFamily) continue;
    for (const id of slot.undertyper_nu) ids.add(id);
  }
  const famMap = biome.monsterfamiljer ?? {};
  if (monsterFamily && famMap[monsterFamily]) {
    for (const id of famMap[monsterFamily]) ids.add(id);
  } else if (!monsterFamily) {
    for (const list of Object.values(famMap)) {
      for (const id of list) ids.add(id);
    }
  }
  return filterSubtypesByBand([...ids], band);
}
