import assert from 'node:assert/strict';
import { ChunkWorldCache } from '../src/world/bigWorld/chunkCache';

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

const seedA = 1;
const seedB = 2;
const cache2 = new ChunkWorldCache({ maxEntries: 64, keepRadius: 1 });
const rollA = cache2.get(seedA, 5, 5).spawns;
cache2.get(seedB, 5, 5);
const rollB = cache2.get(seedB, 5, 5).spawns;
if (rollA.length > 0 && rollB.length > 0) {
  assert.notDeepEqual(rollA, rollB);
}

console.log('big-world-chunk-cache.test.mts: ok');
