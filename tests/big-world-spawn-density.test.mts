import assert from 'node:assert/strict';
import { DATA } from '../src/data';
import { buildBigWorldCatalog, generateChunkWorldData } from '../src/world/bigWorld/worldGenerator';
import { mellanmarkSpawnCountRange } from '../src/world/bigWorld/spawnDensity';

const catalog = buildBigWorldCatalog(DATA.varldStor);
const worldSeed = 42;
const gameSeed = 99;

const far = generateChunkWorldData(worldSeed, gameSeed, 8, 2, catalog);
assert.ok(far.spawns.length >= mellanmarkSpawnCountRange(far.ring)[0], 'mellanmark ska följa design-täthet (min)');

const start = generateChunkWorldData(worldSeed, gameSeed, 1, 1, catalog);
assert.equal(start.spawns.length, 0, 'startskogen-chunk ska inte få genererade chunk-spawns (legacy spawnzoner)');

const gamla = DATA.varldStor.regioner.find((r) => r.id === 'gamla_byn');
assert.ok(gamla);
const gamlaBudget = (gamla.tathet as { monster_per_game?: number })?.monster_per_game ?? 2;
let gamlaSpawns = 0;
for (let dx = -gamla.radie; dx <= gamla.radie; dx++) {
  for (let dy = -gamla.radie; dy <= gamla.radie; dy++) {
    const d = generateChunkWorldData(worldSeed, gameSeed, gamla.chunk[0] + dx, gamla.chunk[1] + dy, catalog);
    if (d.regionId === 'gamla_byn') gamlaSpawns += d.spawns.length;
  }
}
assert.ok(gamlaSpawns <= gamlaBudget, 'region ska följa tathet.monster_per_game, inte mellanmark per chunk');

console.log('big-world-spawn-density.test.mts: ok');
