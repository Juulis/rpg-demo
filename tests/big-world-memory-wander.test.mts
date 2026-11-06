import assert from 'node:assert/strict';
import { ChunkWorldCache } from '../src/world/bigWorld/chunkCache';
import { FogOfWar } from '../src/map/FogOfWar';

const cache = new ChunkWorldCache({ maxEntries: 49, keepRadius: 3 });
const worldSeed = 42;
const gameSeed = 7;
for (let step = 0; step < 120; step++) {
  cache.syncNear(worldSeed, gameSeed, step * 2, step);
  assert.ok(cache.size() <= 49, `chunk-cache ska capas vid steg ${step}`);
}

const fog = new FogOfWar();
fog.setWorldAnchored(true);
const zone = 'forest';
for (let step = 0; step < 200; step++) {
  fog.revealWorld(zone, step * 64, step * 32);
}
assert.ok(fog.chunkFogEntries() <= 625, 'fog-chunks trimmas runt hjälten');
fog.revealWorld(zone, 0, 0);
assert.ok(fog.chunkFogEntries() <= 625);

console.log('big-world-memory-wander.test.mts: ok');
