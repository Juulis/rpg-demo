import assert from 'node:assert/strict';
import { SaveMigrator } from '../src/save/SaveMigrator';
import { fromHeroSave, toHeroSave } from '../src/save/convert';
import { generateChunkWorldData } from '../src/world/bigWorld/worldGenerator';

const migrator = new SaveMigrator();
const worldSeed = 777;
const gameSeed = 111;

const raw = {
  version: 2,
  hero: {
    id: 'h1',
    name: 'Test',
    cls: 'riddare',
    level: 1,
    xp: 0,
    gold: 0,
    inv: [],
    equip: {},
  },
  game: {
    seed: gameSeed,
    worldSeed,
    killed: [],
    zone: 'forest',
    pos: [4, 4],
    stage: 0,
    runes: 0,
    city: 'besatt',
  },
};

const migrated = migrator.migrate(raw);
assert.ok(migrated?.game);
assert.equal(migrated.game.worldSeed, worldSeed, 'SaveMigrator ska behålla worldSeed');

const heroSave = toHeroSave(migrated);
assert.equal(heroSave.game?.worldSeed, worldSeed);
const round = migrator.migrate(fromHeroSave(heroSave));
assert.equal(round?.game?.worldSeed, worldSeed);
assert.equal(round?.game?.seed, gameSeed);

const layoutA = generateChunkWorldData(worldSeed, gameSeed, 2, 3);
const layoutB = generateChunkWorldData(worldSeed, gameSeed + 1, 2, 3);
assert.equal(layoutA.chunkSeed, layoutB.chunkSeed, 'world_seed styr chunk-layout');
assert.notDeepEqual(layoutA.spawns, layoutB.spawns, 'game_seed styr spawns');

console.log('save-world-seed.test.mts: ok');
