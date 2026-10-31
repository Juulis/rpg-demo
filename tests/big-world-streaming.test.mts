import assert from 'node:assert/strict';
import { createSession } from '../src/core/Session';
import { DATA } from '../src/data';
import { buildBigWorldCatalog, generateChunkWorldData } from '../src/world/bigWorld/worldGenerator';
import { chunkSpawnToWorld, parseBigWorldSpawnUid, worldToChunk } from '../src/world/bigWorld/bigWorldCoords';
import { ChunkWorldCache } from '../src/world/bigWorld/chunkCache';
import { BIG_WORLD_CACHE_KEEP_RADIUS } from '../src/world/bigWorld/bigWorldConfig';
import { RUNE_POS } from '../src/world/ZoneFactory';
import { resetBigWorldMonsterSync, syncBigWorldChunkMonsters } from '../src/world/bigWorld/syncBigWorldChunkMonsters';
import type { World } from '../src/systems/World';
import { Zone } from '../src/world/Zone';
import { Container } from 'pixi.js';

const worldSeed = 424242;
const gameSeed = 9001;
const catalog = buildBigWorldCatalog(DATA.varldStor);

const a = generateChunkWorldData(worldSeed, gameSeed, 2, 3, catalog);
const b = generateChunkWorldData(worldSeed, gameSeed, 2, 3, catalog);
assert.deepEqual(a.spawns, b.spawns);
assert.notEqual(generateChunkWorldData(worldSeed + 1, gameSeed, 2, 3, catalog).chunkSeed, a.chunkSeed);

const sameLayout = generateChunkWorldData(worldSeed, gameSeed + 999, 2, 3, catalog);
assert.equal(sameLayout.chunkSeed, a.chunkSeed);
assert.notDeepEqual(sameLayout.spawns, a.spawns);

assert.ok(a.spawns.length > 0, 'chunk ska ha spawns');
const first = a.spawns[0];
const pos = chunkSpawnToWorld(2, 3, first.localX, first.localY);
const back = worldToChunk(pos.x, pos.y);
assert.equal(back.cx, 2);
assert.equal(back.cy, 3);

assert.deepEqual(parseBigWorldSpawnUid(first.uid), { cx: 2, cy: 3 });

const side = 2 * BIG_WORLD_CACHE_KEEP_RADIUS + 1;
const cache = new ChunkWorldCache({ maxEntries: side * side, keepRadius: BIG_WORLD_CACHE_KEEP_RADIUS });
cache.syncNear(worldSeed, gameSeed, 0, 0);
assert.ok(cache.size() <= side * side);
for (let i = 0; i < 3; i++) {
  cache.syncNear(worldSeed, gameSeed, i * 5, 0);
  assert.ok(cache.size() <= side * side);
}
const d0 = cache.get(worldSeed, gameSeed, 0, 0);
const d1 = cache.get(worldSeed, gameSeed, 0, 0);
assert.equal(d0, d1, 'cache get ska returnera samma chunkdata');

assert.equal(RUNE_POS.length, 3, 'akt 1 kräver tre runstenar i startskogen');

const migrated = createSession(5, [], 99);
assert.equal(migrated.worldSeed, 99);
const ng = createSession(10, []);
assert.equal(ng.worldSeed, 10);

function mockWorld(): World {
  const zone = new Zone('forest', 'startskogen', 4096, 4096);
  zone.bigWorldStreaming = true;
  return {
    zone,
    session: { seed: gameSeed, worldSeed, killed: new Set<string>() },
    monsters: [],
    objects: new Container(),
    spawnQueue: [],
    hero: { pos: { x: 0, y: 0 }, s: { playing: true } },
  } as unknown as World;
}

resetBigWorldMonsterSync();
const w = mockWorld();
const factory = {
  create(_w: World, id: string, p: { x: number; y: number }, lvl: number, spec: { uid: string }) {
    w.monsters.push({ uid: spec.uid, pos: p, view: { destroy: () => {} } } as never);
  },
} as never;
const spawn = a.spawns[0];
const near = chunkSpawnToWorld(2, 3, spawn.localX, spawn.localY);
w.hero.pos.x = near.x;
w.hero.pos.y = near.y;
syncBigWorldChunkMonsters(w, cache, factory, worldSeed, gameSeed, w.hero.pos);
assert.ok(w.monsters.some((m) => m.uid === spawn.uid));
assert.equal(w.monsters.filter((m) => m.uid === spawn.uid).length, 1);
w.session.killed.add(spawn.uid);
w.monsters.length = 0;
syncBigWorldChunkMonsters(w, cache, factory, worldSeed, gameSeed, w.hero.pos);
assert.equal(w.monsters.filter((m) => m.uid === spawn.uid).length, 0, 'dödade spawns återuppstår inte');
syncBigWorldChunkMonsters(w, cache, factory, worldSeed, gameSeed, w.hero.pos);
assert.equal(w.monsters.filter((m) => m.uid === spawn.uid).length, 0, 'inga dubbletter efter resync');

const neg = generateChunkWorldData(worldSeed, gameSeed, -3, -4, catalog);
assert.equal(neg.cx, -3);
assert.equal(neg.cy, -4);

console.log('big-world-streaming.test.mts: ok');
