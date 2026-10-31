import assert from 'node:assert/strict';
import { ChunkWorldCache } from '../src/world/bigWorld/chunkCache';
import { chunkWorldSeed } from '../src/world/bigWorld/worldGenerator';

const cache = new ChunkWorldCache({ maxEntries: 64, keepRadius: 2 });
const seed = 99;
cache.syncNear(seed, 0, 0);
assert.equal(cache.size(), 25);
cache.syncNear(seed, 20, 20);
assert.ok(cache.size() <= 25);
for (let dx = -2; dx <= 2; dx++) {
  for (let dy = -2; dy <= 2; dy++) {
    assert.equal(cache.get(seed, 20 + dx, 20 + dy).cx, 20 + dx);
  }
}

const bounded = new ChunkWorldCache({ maxEntries: 12, keepRadius: 2 });
for (let step = 0; step < 40; step++) {
  bounded.syncNear(seed, step, 0);
  assert.ok(bounded.size() <= 12);
}

const evict = new ChunkWorldCache({ maxEntries: 4, keepRadius: 99 });
for (let i = 0; i < 20; i++) evict.get(seed, i, 0);
assert.ok(evict.size() <= 4);

const seedA = 111;
const seedB = 222;
const cx = 0;
const cy = -3;
const cache2 = new ChunkWorldCache({ maxEntries: 64, keepRadius: 2 });
cache2.syncNear(seedA, cx, cy);
const rollA = cache2.get(seedA, cx, cy);
assert.equal(rollA.chunkSeed, chunkWorldSeed(seedA, cx, cy));
assert.ok(rollA.spawns.length > 0);
cache2.syncNear(seedB, cx, cy);
const rollB = cache2.get(seedB, cx, cy);
assert.equal(rollB.chunkSeed, chunkWorldSeed(seedB, cx, cy));
assert.ok(rollB.spawns.length > 0);
assert.notEqual(rollA.chunkSeed, rollB.chunkSeed);

const cache3 = new ChunkWorldCache({ maxEntries: 64, keepRadius: 1 });
cache3.get(seedA, 0, 0);
cache3.get(seedB, 0, 0);
assert.equal(cache3.get(seedB, 0, 0).chunkSeed, chunkWorldSeed(seedB, 0, 0));

console.log('big-world-chunk-cache.test.mts: ok');
