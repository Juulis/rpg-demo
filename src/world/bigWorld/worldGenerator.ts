import { DATA } from '../../data';
import type { BigWorldDataFile, BigWorldRegion } from '../../data/bigWorldTypes';
import { Rng } from '../../core/Rng';
import { blendBiomesAtChunk, biomeRenderPlaceholders, isTownBiomeChunk } from './biomeBlend';
import { buildRoadIndex, roadsAtChunk, type RoadIndex } from './roads';
import { resolveRegionAtChunk } from './regionIndex';
import { chunkDistanceFromStart, ringAtChunkDistance, subtypeAllowedInBand } from './ringZone';

export interface BigWorldSpawnRoll {
  uid: string;
  enemy: string;
  level: number;
  localX: number;
  localY: number;
}

export interface ChunkWorldData {
  cx: number;
  cy: number;
  chunkSeed: number;
  distanceChunks: number;
  ring: number;
  levelBand: [number, number];
  mellanmark: boolean;
  regionId: string;
  regionTyp: string;
  biomeId: string;
  biomeBlend: ReturnType<typeof blendBiomesAtChunk>;
  roads: string[];
  roadTypes: string[];
  pois: string[];
  safe: boolean;
  act: string | null;
  access: string;
  monsterFamily: string | null;
  spawnSubtypes: string[];
  generatedSpawn: boolean;
  tilePool: string[];
  decorPool: string[];
  music: 'explore' | 'town';
  spawns: BigWorldSpawnRoll[];
}

export interface BigWorldCatalog {
  data: BigWorldDataFile;
  roads: RoadIndex;
  regionById: Map<string, BigWorldRegion>;
  poisByRegionChunk: Map<string, string[]>;
  startChunk: readonly [number, number];
}

let catalogSingleton: BigWorldCatalog | null = null;

export function getBigWorldCatalog(): BigWorldCatalog {
  if (catalogSingleton) return catalogSingleton;
  const data = DATA.varldStor;
  const roads = buildRoadIndex(data.vagar, data.regioner);
  const regionById = new Map(data.regioner.map((r) => [r.id, r]));
  const poisByRegionChunk = new Map<string, string[]>();
  for (const poi of data.pois) {
    const region = regionById.get(poi.region);
    if (!region) continue;
    const k = `${region.chunk[0]},${region.chunk[1]}`;
    const list = poisByRegionChunk.get(k) ?? [];
    list.push(poi.id);
    poisByRegionChunk.set(k, list);
  }
  catalogSingleton = {
    data,
    roads,
    regionById,
    poisByRegionChunk,
    startChunk: data.meta.startpunkt.chunk,
  };
  return catalogSingleton;
}

function chunkSeed(gameSeed: number, cx: number, cy: number): number {
  return Rng.hash('chunk', gameSeed, cx, cy);
}

function primaryBiomeAt(catalog: BigWorldCatalog, cx: number, cy: number): { region: BigWorldRegion; mellanmark: boolean } {
  const { region, inside } = resolveRegionAtChunk(cx, cy, catalog.data.regioner);
  return { region, mellanmark: !inside };
}

function neighborBiomeFactory(catalog: BigWorldCatalog): (ncx: number, ncy: number) => string {
  return (ncx, ncy) => primaryBiomeAt(catalog, ncx, ncy).region.biom;
}

function filterSubtypesByBand(subtypes: readonly string[], band: readonly [number, number]): string[] {
  const fixed = (DATA.monsterLevels.fixed_levels ?? {}) as Record<string, number>;
  return subtypes.filter((id) => {
    const lv = fixed[id];
    if (lv == null) return false;
    return subtypeAllowedInBand(lv, band);
  });
}

function rollChunkSpawns(
  gameSeed: number,
  cx: number,
  cy: number,
  region: BigWorldRegion,
  band: readonly [number, number],
): BigWorldSpawnRoll[] {
  if (!region.genererad_spawn || !region.monsterfamilj) return [];
  const allowed = filterSubtypesByBand(region.undertyper ?? [], band);
  if (allowed.length === 0) return [];
  const rng = new Rng(chunkSeed(gameSeed, cx, cy));
  const count = rng.int([2, 5]);
  const out: BigWorldSpawnRoll[] = [];
  const tileSize = catalogSingleton?.data.meta.chunk?.storlek_rutor ?? 64;
  for (let i = 0; i < count; i++) {
    const enemy = rng.pick(allowed);
    const levels = DATA.monsterLevels.fixed_levels ?? {};
    const level = levels[enemy] ?? band[0];
    const localX = rng.float(8, tileSize - 8);
    const localY = rng.float(8, tileSize - 8);
    const uid = `bw:${cx},${cy}:${i}:${enemy}`;
    out.push({ uid, enemy, level, localX, localY });
  }
  return out;
}

/** Genererar all data för en chunk (D2 — en gång per game seed). */
export function generateChunkWorldData(gameSeed: number, cx: number, cy: number): ChunkWorldData {
  const catalog = getBigWorldCatalog();
  const { region, mellanmark } = primaryBiomeAt(catalog, cx, cy);
  const distance = chunkDistanceFromStart(cx, cy, catalog.startChunk);
  const ringar = catalog.data.meta.zonmodell?.ringar ?? [];
  const { ring, levelBand } = ringAtChunkDistance(distance, ringar);
  const band = region.nivaband ?? levelBand;
  const biome = catalog.data.biomer[region.biom];
  const blend = blendBiomesAtChunk(cx, cy, region.biom, neighborBiomeFactory(catalog));
  const { ids: roads, types: roadTypes } = roadsAtChunk(catalog.roads, cx, cy);
  const poiKey = `${region.chunk[0]},${region.chunk[1]}`;
  const pois = region.chunk[0] === cx && region.chunk[1] === cy ? (catalog.poisByRegionChunk.get(poiKey) ?? region.poi ?? []) : [];
  const placeholders = biomeRenderPlaceholders(biome);
  const town = isTownBiomeChunk(region.typ);
  const spawnSubtypes = filterSubtypesByBand(region.undertyper ?? [], band);

  return {
    cx,
    cy,
    chunkSeed: chunkSeed(gameSeed, cx, cy),
    distanceChunks: distance,
    ring,
    levelBand: band,
    mellanmark,
    regionId: region.id,
    regionTyp: region.typ,
    biomeId: region.biom,
    biomeBlend: blend,
    roads,
    roadTypes,
    pois,
    safe: region.sakert === true,
    act: region.akt ?? null,
    access: region.atkomst ?? 'oppen',
    monsterFamily: region.monsterfamilj ?? null,
    spawnSubtypes,
    generatedSpawn: region.genererad_spawn === true,
    tilePool: placeholders.tilePool,
    decorPool: placeholders.decorPool,
    music: town ? 'town' : placeholders.music,
    spawns: rollChunkSpawns(gameSeed, cx, cy, region, band),
  };
}

/** XP-mult baserat på avstånd från start (design: längre bort = mer XP via högre nivåmonster). */
export function xpDistanceMultiplier(distanceChunks: number): number {
  return 1 + Math.min(distanceChunks, 20) * 0.02;
}
