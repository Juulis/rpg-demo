import assert from 'node:assert/strict';
import { Rng } from '../src/core/Rng';
import { chunkGroundTileGrid, pickChunkGroundTileId } from '../src/world/bigWorld/groundTiles';
import { chunkTileCount } from '../src/world/bigWorld/bigWorldCoords';
import { generateChunkWorldData, buildBigWorldCatalog } from '../src/world/bigWorld/worldGenerator';
import { DATA } from '../src/data';

const pool = ['gras_1', 'gras_2', 'gras_3'];
const chunkSeed = 99887766;
const tiles = chunkTileCount();

const gridA = chunkGroundTileGrid(chunkSeed, tiles, pool);
const gridB = chunkGroundTileGrid(chunkSeed, tiles, pool);
assert.deepEqual(gridA, gridB);

/** Simulera två patch-byggordningar: samma tile per (ti,tj). */
function buildOrder(seed: number, firstPi: number, firstPj: number, tilePool: readonly string[]): string[][] {
  const side = Math.ceil(tiles / 16);
  const out: string[][] = Array.from({ length: tiles }, () => Array.from({ length: tiles }, () => ''));
  const order: [number, number][] = [];
  for (let pi = 0; pi < side; pi++) for (let pj = 0; pj < side; pj++) order.push([pi, pj]);
  order.sort((a, b) => {
    const da = (a[0] - firstPi) ** 2 + (a[1] - firstPj) ** 2;
    const db = (b[0] - firstPi) ** 2 + (b[1] - firstPj) ** 2;
    return da - db;
  });
  const patchTiles = 16;
  for (const [pi, pj] of order) {
    const ti0 = pi * patchTiles;
    const tj0 = pj * patchTiles;
    const tw = Math.min(patchTiles, tiles - ti0);
    const th = Math.min(patchTiles, tiles - tj0);
    for (let di = 0; di < tw; di++) {
      for (let dj = 0; dj < th; dj++) {
        const ti = ti0 + di;
        const tj = tj0 + dj;
        const row = out[ti];
        if (!row) continue;
        row[tj] = pickChunkGroundTileId(seed, ti, tj, tilePool);
      }
    }
  }
  return out;
}

assert.deepEqual(buildOrder(chunkSeed, 0, 0, pool), buildOrder(chunkSeed, 3, 3, pool), 'patchordning ska inte påverka tile-val');

const catalog = buildBigWorldCatalog(DATA.varldStor);
const c10a = generateChunkWorldData(555, 777, 1, 0, catalog);
const c10b = generateChunkWorldData(555, 777, 1, 0, catalog);
assert.equal(c10a.chunkSeed, c10b.chunkSeed);
const p10 = c10a.tilePool.length ? c10a.tilePool : ['gras_1'];
const fromWest = chunkGroundTileGrid(c10a.chunkSeed, tiles, p10);
const fromEast = buildOrder(c10a.chunkSeed, 3, 0, p10);
// patchordningstest använder samma pool som chunk
for (let pi = 0; pi < Math.ceil(tiles / 16); pi++) {
  for (let pj = 0; pj < Math.ceil(tiles / 16); pj++) {
    const patchTiles = 16;
    const ti0 = pi * patchTiles;
    const tj0 = pj * patchTiles;
    const tw = Math.min(patchTiles, tiles - ti0);
    const th = Math.min(patchTiles, tiles - tj0);
    for (let di = 0; di < tw; di++) {
      for (let dj = 0; dj < th; dj++) {
        const ti = ti0 + di;
        const tj = tj0 + dj;
        const row = fromEast[ti];
        const west = fromWest[ti];
        if (!row || !west) continue;
        assert.equal(row[tj], west[tj], `chunk (1,0) tile ${ti},${tj}`);
      }
    }
  }
}

assert.notEqual(
  pickChunkGroundTileId(chunkSeed, 0, 0, pool),
  pickChunkGroundTileId(Rng.hash(chunkSeed, 1), 0, 0, pool),
  'annat chunkSeed ska ge annat mönster',
);

console.log('big-world-ground-tiles.test.mts: ok');
