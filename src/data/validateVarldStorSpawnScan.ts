import type { BigWorldDataFile } from './bigWorldTypes';
import type { VarldStorValidateCtx } from './validateVarldStor';
import { buildBigWorldCatalog, generateChunkWorldData } from '../world/bigWorld/worldGenerator';
import { mellanmarkLevelBand } from '../world/bigWorld/spawnRules';
import { chunkDistanceFromStart, ringAtChunkDistance } from '../world/bigWorld/ringZone';
import { DATA } from './index';
import { KNOWN_EMPTY_MELLANMARK, mellanmarkEmptyIssues } from '../world/bigWorld/knownEmptyMellanmark';

export interface SpawnScanOptions {
  seeds?: number[];
  radius?: number;
  maxRing?: number;
  /** Standard: KNOWN_EMPTY_MELLANMARK. Sätt tom Set för att kräva full täckning. */
  knownEmptyMellanmark?: ReadonlySet<string>;
  /** Om false, hoppar mellanmark-tomhetskontroll (band/spawn kvar). */
  checkKnownEmpty?: boolean;
}

const DEFAULT_SEEDS = [1, 5, 42, 12345];

/** Tung chunk-skanning för tester/CI — anropas inte från validateData vid uppstart. */
export function validateVarldStorSpawnScan(bw: BigWorldDataFile, _ctx: VarldStorValidateCtx, opts: SpawnScanOptions = {}): string[] {
  const issues: string[] = [];
  const seeds = opts.seeds ?? DEFAULT_SEEDS;
  const scanR = opts.radius ?? 40;
  const maxRing = opts.maxRing ?? 7;
  const catalog = buildBigWorldCatalog(bw);
  const ringar = bw.meta.zonmodell?.ringar ?? [];
  const start = bw.meta.startpunkt.chunk;
  const fixed = DATA.monsterLevels.fixed_levels ?? {};

  for (const seed of seeds) {
    for (let cx = -scanR; cx <= scanR; cx++) {
      for (let cy = -scanR; cy <= scanR; cy++) {
        const d = generateChunkWorldData(seed, cx, cy, catalog);
        if (d.ring > maxRing) continue;

        const dist = chunkDistanceFromStart(cx, cy, start);
        const chunkRing = ringAtChunkDistance(dist, ringar);
        const expectedBand = d.mellanmark ? mellanmarkLevelBand(bw, chunkRing.ring, chunkRing.levelBand) : d.levelBand;

        if (d.mellanmark && (d.levelBand[0] !== expectedBand[0] || d.levelBand[1] !== expectedBand[1])) {
          issues.push(
            `varld_stor spawn seed ${seed} chunk ${cx},${cy}: levelBand ${d.levelBand.join('-')} != ringband ${expectedBand.join('-')}`,
          );
        }

        if (!d.generatedSpawn || d.spawns.length === 0) continue;
        for (const s of d.spawns) {
          if (s.level < expectedBand[0] || s.level > expectedBand[1]) {
            issues.push(
              `varld_stor spawn seed ${seed} chunk ${cx},${cy} ring ${d.ring}: ${s.enemy} nivå ${s.level} utanför ${expectedBand.join('-')}`,
            );
          }
        }
        for (const id of d.spawnSubtypes) {
          const lv = fixed[id];
          if (lv != null && (lv < expectedBand[0] || lv > expectedBand[1])) {
            issues.push(
              `varld_stor spawn seed ${seed} chunk ${cx},${cy}: undertyp ${id} nivå ${lv} utanför band ${expectedBand.join('-')}`,
            );
          }
        }
      }
    }
  }

  if (opts.checkKnownEmpty !== false) {
    const known = opts.knownEmptyMellanmark ?? KNOWN_EMPTY_MELLANMARK;
    issues.push(...mellanmarkEmptyIssues(mellanmarkEmptyCoverage(bw, opts), known));
  }

  return issues;
}

/** Tom mellanmark per ring/biom — separat från band-larm (data saknar undertyper i bandet). */
export function mellanmarkEmptyCoverage(bw: BigWorldDataFile, opts: SpawnScanOptions = {}): Map<string, { empty: number; total: number }> {
  const seeds = opts.seeds ?? DEFAULT_SEEDS;
  const scanR = opts.radius ?? 40;
  const maxRing = opts.maxRing ?? 7;
  const catalog = buildBigWorldCatalog(bw);
  const emptyByRingBiome = new Map<string, { empty: number; total: number }>();

  for (const seed of seeds) {
    for (let cx = -scanR; cx <= scanR; cx++) {
      for (let cy = -scanR; cy <= scanR; cy++) {
        const d = generateChunkWorldData(seed, cx, cy, catalog);
        if (d.ring > maxRing) continue;
        if (!d.mellanmark || d.safe) continue;
        const key = `${d.ring}|${d.biomeId}`;
        const stat = emptyByRingBiome.get(key) ?? { empty: 0, total: 0 };
        stat.total++;
        if (d.spawnSubtypes.length === 0) stat.empty++;
        emptyByRingBiome.set(key, stat);
      }
    }
  }
  return emptyByRingBiome;
}
