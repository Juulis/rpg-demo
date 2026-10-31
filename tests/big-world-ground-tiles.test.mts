import assert from 'node:assert/strict';
import { Rng } from '../src/core/Rng';
import {
  chunkGroundTileGrid,
  pickChunkGroundTileId,
  buildChunkGroundViaPatchOrder,
  patchOrderByDistance,
} from '../src/world/bigWorld/groundTiles';
import { chunkTileCount } from '../src/world/bigWorld/bigWorldCoords';
import { generateChunkWorldData, buildBigWorldCatalog } from '../src/world/bigWorld/worldGenerator';
import { DATA } from '../src/data';
import { BIG_WORLD_GROUND_PATCH_TILES } from '../src/world/bigWorld/bigWorldConfig';

const pool = ['gras_1', 'gras_2', 'gras_3'];
const chunkSeed = 99887766;
const tiles = chunkTileCount();
const patchTiles = BIG_WORLD_GROUND_PATCH_TILES;

const gridA = chunkGroundTileGrid(chunkSeed, tiles, pool);
const gridB = chunkGroundTileGrid(chunkSeed, tiles, pool);
assert.deepEqual(gridA, gridB);

const orderA = patchOrderByDistance(0, 0, tiles, patchTiles);
const orderB = patchOrderByDistance(3, 3, tiles, patchTiles);
const builtA = buildChunkGroundViaPatchOrder(chunkSeed, tiles, pool, patchTiles, orderA);
const builtB = buildChunkGroundViaPatchOrder(chunkSeed, tiles, pool, patchTiles, orderB);
assert.deepEqual(builtA, gridA, 'patchordning via fillPatchGroundTiles ska ge fullständig chunk');
assert.deepEqual(builtB, gridA, 'annan patchstart ska ge samma slutgrid');

const catalog = buildBigWorldCatalog(DATA.varldStor);
const c10a = generateChunkWorldData(555, 777, 1, 0, catalog);
const c10b = generateChunkWorldData(555, 777, 1, 0, catalog);
assert.equal(c10a.chunkSeed, c10b.chunkSeed);
const p10 = c10a.tilePool.length ? c10a.tilePool : ['gras_1'];
const fromWest = chunkGroundTileGrid(c10a.chunkSeed, tiles, p10);
const fromEast = buildChunkGroundViaPatchOrder(c10a.chunkSeed, tiles, p10, patchTiles, patchOrderByDistance(3, 0, tiles, patchTiles));
for (let ti = 0; ti < tiles; ti++) {
  for (let tj = 0; tj < tiles; tj++) {
    assert.equal(fromEast[ti]?.[tj], fromWest[ti]?.[tj], `chunk (1,0) tile ${ti},${tj}`);
  }
}

assert.notEqual(
  pickChunkGroundTileId(chunkSeed, 0, 0, pool),
  pickChunkGroundTileId(Rng.hash(chunkSeed, 1), 0, 0, pool),
  'annat chunkSeed ska ge annat mönster',
);

console.log('big-world-ground-tiles.test.mts: ok');
