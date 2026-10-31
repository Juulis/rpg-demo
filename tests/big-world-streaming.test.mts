import assert from 'node:assert/strict';
import { DATA } from '../src/data';
import { buildBigWorldCatalog, generateChunkWorldData } from '../src/world/bigWorld/worldGenerator';
import { chunkSpawnToWorld, parseBigWorldSpawnUid, worldToChunk } from '../src/world/bigWorld/bigWorldCoords';
import { ChunkWorldCache } from '../src/world/bigWorld/chunkCache';
import { BIG_WORLD_CACHE_KEEP_RADIUS } from '../src/world/bigWorld/bigWorldConfig';

const seedA = 424242;
const seedB = 999001;
const catalog = buildBigWorldCatalog(DATA.varldStor);

const a = generateChunkWorldData(seedA, 2, 3, catalog);
const b = generateChunkWorldData(seedA, 2, 3, catalog);
assert.deepEqual(a.spawns, b.spawns);
assert.notEqual(generateChunkWorldData(seedB, 2, 3, catalog).chunkSeed, a.chunkSeed);

const pos = chunkSpawnToWorld(2, 3, a.spawns[0]?.localX ?? 10, a.spawns[0]?.localY ?? 10);
const back = worldToChunk(pos.x, pos.y);
assert.equal(back.cx, 2);
assert.equal(back.cy, 3);

const uid = a.spawns[0]?.uid ?? 'bw:2,3:0:skogsvarg';
assert.deepEqual(parseBigWorldSpawnUid(uid), { cx: 2, cy: 3 });

const side = 2 * BIG_WORLD_CACHE_KEEP_RADIUS + 1;
const cache = new ChunkWorldCache({ maxEntries: side * side, keepRadius: BIG_WORLD_CACHE_KEEP_RADIUS });
cache.syncNear(seedA, 0, 0);
assert.ok(cache.size() <= side * side);
for (let i = 0; i < 3; i++) {
  cache.syncNear(seedA, i * 5, 0);
  assert.ok(cache.size() <= side * side);
}
const d0 = cache.get(seedA, 0, 0);
const d1 = cache.get(seedA, 0, 0);
assert.equal(d0, d1, 'cache get ska returnera samma chunkdata');

console.log('big-world-streaming.test.mts: ok');
