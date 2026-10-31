import { DATA } from '../../data';
import type { BigWorldDataFile, BigWorldRegion } from '../../data/bigWorldTypes';
import type { EliteKind } from '../../data/types';
import { Rng } from '../../core/Rng';
import { blendBiomesAtChunk, biomeRenderPlaceholders, isTownBiomeChunk } from './biomeBlend';
import { buildRoadIndex, roadsAtChunk, type RoadIndex } from './roads';
import { resolveRegionAtChunk } from './regionIndex';
import { chunkDistanceFromStart, ringAtChunkDistance } from './ringZone';
import { planMellanmarkSpawn, filterSubtypesByBand, regionSpawnLevelBand, mellanmarkLevelBand } from './spawnRules';
import { applyRoadSpawnFactor, mellanmarkSpawnCountRange } from './spawnDensity';
import { isInsideStartskogenChunk } from './heroRegion';

export interface BigWorldSpawnRoll {
  uid: string;
  enemy: string;
  level: number;
  localX: number;
  localY: number;
  elite?: EliteKind | null;
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

export function buildBigWorldCatalog(data: BigWorldDataFile): BigWorldCatalog {
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
  return {
    data,
    roads,
    regionById,
    poisByRegionChunk,
    startChunk: data.meta.startpunkt.chunk,
  };
}

export function resetBigWorldCatalogCache(): void {
  catalogSingleton = null;
}

export function getBigWorldCatalog(): BigWorldCatalog {
  if (catalogSingleton) return catalogSingleton;
  catalogSingleton = buildBigWorldCatalog(DATA.varldStor);
  return catalogSingleton;
}

function chunkLayoutSeed(worldSeed: number, cx: number, cy: number): number {
  return Rng.hash('chunk', worldSeed, cx, cy);
}

function chunkSpawnRollSeed(gameSeed: number, cx: number, cy: number): number {
  return Rng.hash('spawn', gameSeed, cx, cy);
}

/** Publik för cache-validering (world_seed per chunk). */
export function chunkWorldSeed(worldSeed: number, cx: number, cy: number): number {
  return chunkLayoutSeed(worldSeed, cx, cy);
}

function primaryBiomeAt(catalog: BigWorldCatalog, cx: number, cy: number): { region: BigWorldRegion; mellanmark: boolean } {
  const { region, inside } = resolveRegionAtChunk(cx, cy, catalog.data.regioner);
  return { region, mellanmark: !inside };
}

function neighborBiomeFactory(catalog: BigWorldCatalog): (ncx: number, ncy: number) => string {
  return (ncx, ncy) => primaryBiomeAt(catalog, ncx, ncy).region.biom;
}

function rollChunkSpawns(
  gameSeed: number,
  cx: number,
  cy: number,
  subtypes: readonly string[],
  genereradSpawn: boolean,
  band: readonly [number, number],
  ring: number,
  onRoad: boolean,
): BigWorldSpawnRoll[] {
  if (!genereradSpawn || subtypes.length === 0) return [];
  const allowed = filterSubtypesByBand(subtypes, band);
  if (allowed.length === 0) return [];
  const rng = new Rng(chunkSpawnRollSeed(gameSeed, cx, cy));
  let count = rng.int(mellanmarkSpawnCountRange(ring));
  count = applyRoadSpawnFactor(count, onRoad);
  const out: BigWorldSpawnRoll[] = [];
  const tileSize = catalogSingleton?.data.meta.chunk?.storlek_rutor ?? 64;
  const fixed = DATA.monsterLevels.fixed_levels ?? {};
  for (let i = 0; i < count; i++) {
    const enemy = rng.pick(allowed);
    const level = fixed[enemy] ?? band[0];
    const localX = rng.float(8, tileSize - 8);
    const localY = rng.float(8, tileSize - 8);
    const uid = `bw:${cx},${cy}:${i}:${enemy}`;
    out.push({ uid, enemy, level, localX, localY });
  }
  return out;
}

/** Generererar all data för en chunk (layout = world_seed, spawns = game_seed). */
export function generateChunkWorldData(
  worldSeed: number,
  gameSeed: number,
  cx: number,
  cy: number,
  catalog: BigWorldCatalog = getBigWorldCatalog(),
): ChunkWorldData {
  const { region, mellanmark } = primaryBiomeAt(catalog, cx, cy);
  const distance = chunkDistanceFromStart(cx, cy, catalog.startChunk);
  const ringar = catalog.data.meta.zonmodell?.ringar ?? [];
  const chunkRing = ringAtChunkDistance(distance, ringar);
  const biome = catalog.data.biomer[region.biom];
  const blend = blendBiomesAtChunk(cx, cy, region.biom, neighborBiomeFactory(catalog));
  const { ids: roads, types: roadTypes } = roadsAtChunk(catalog.roads, cx, cy);
  const poiKey = `${region.chunk[0]},${region.chunk[1]}`;
  const pois =
    !mellanmark && region.chunk[0] === cx && region.chunk[1] === cy ? (catalog.poisByRegionChunk.get(poiKey) ?? region.poi ?? []) : [];

  const placeholders = biomeRenderPlaceholders(biome);
  const town = !mellanmark && isTownBiomeChunk(region.typ);

  let spawnSubtypes: string[];
  let generatedSpawn: boolean;
  let access: string;
  let regionTyp: string;
  let safe: boolean;
  let act: string | null;
  let monsterFamily: string | null = region.monsterfamilj ?? null;
  let spawnBand = mellanmark
    ? mellanmarkLevelBand(catalog.data, chunkRing.ring, chunkRing.levelBand)
    : regionSpawnLevelBand(catalog.data, region);

  if (mellanmark) {
    const plan = planMellanmarkSpawn(catalog.data, biome, region, chunkRing.ring, chunkRing.levelBand);
    spawnBand = plan.spawnBand;
    monsterFamily = plan.monsterFamily;
    spawnSubtypes = plan.spawnSubtypes;
    generatedSpawn = spawnSubtypes.length > 0;
    access = 'oppen';
    regionTyp = 'mellanmark';
    safe = false;
    act = region.akt ?? null;
  } else {
    spawnSubtypes = filterSubtypesByBand(region.undertyper ?? [], spawnBand);
    generatedSpawn = region.genererad_spawn === true;
    access = region.atkomst ?? 'oppen';
    regionTyp = region.typ;
    safe = region.sakert === true;
    act = region.akt ?? null;
  }

  return {
    cx,
    cy,
    chunkSeed: chunkLayoutSeed(worldSeed, cx, cy),
    distanceChunks: distance,
    ring: chunkRing.ring,
    levelBand: spawnBand,
    mellanmark,
    regionId: mellanmark ? `mellanmark:${region.id}` : region.id,
    regionTyp,
    biomeId: region.biom,
    biomeBlend: blend,
    roads,
    roadTypes,
    pois,
    safe,
    act,
    access,
    monsterFamily,
    spawnSubtypes,
    generatedSpawn,
    tilePool: placeholders.tilePool,
    decorPool: placeholders.decorPool,
    music: town ? 'town' : placeholders.music,
    spawns: rollChunkSpawns(
      gameSeed,
      cx,
      cy,
      spawnSubtypes,
      generatedSpawn && !isInsideStartskogenChunk(cx, cy),
      spawnBand,
      chunkRing.ring,
      roads.length > 0,
    ),
  };
}

/** XP-mult baserat på avstånd från start (design: längre bort = mer XP via högre nivåmonster). */
export function xpDistanceMultiplier(distanceChunks: number): number {
  return 1 + Math.min(distanceChunks, 20) * 0.02;
}
