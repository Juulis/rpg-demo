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

console.log('big-world-spawn-density.test.mts: ok');
