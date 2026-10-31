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
const byChunk = generateChunkWorldData(worldSeed, gameSeed, gamla.chunk[0], gamla.chunk[1], catalog);
assert.ok(byChunk.spawns.length <= mellanmarkSpawnCountRange(byChunk.ring)[1], 'namngiven region ska inte använda full mellanmark-täthet');

console.log('big-world-spawn-density.test.mts: ok');
