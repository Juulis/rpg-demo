import assert from 'node:assert/strict';
import { MemoryStore } from '../src/core/storage';
import { LocalStorageSaveBackend } from '../src/save/backend/LocalStorageSaveBackend';
import { SaveRepository } from '../src/save/SaveRepository';
import { SaveMigrator } from '../src/save/SaveMigrator';
import { BIG_WORLD_COORD_EPOCH } from '../src/world/bigWorld/saveCoordMigrate';
import type { HeroSave } from '../src/core/GameContext';

const old = 'bw:4,2:1:skogsvarg';
const legacy = 'bw:0,0:1:skogsvarg';

const m = new SaveMigrator();
const save = m.migrate({
  version: 2,
  hero: { id: 'h1', name: 'T', cls: 'riddare', level: 1, xp: 0, gold: 0, inv: [], equip: {} },
  game: { seed: 1, killed: [old, legacy, 'zone:forest:1'], zone: 'forest', pos: [0, 0], stage: 0, runes: 0, city: 'besatt' },
});
assert.ok(save?.game);
assert.equal(save.game.bwCoordEpoch, 2);
assert.ok(!save.game.killed.some((k) => k.startsWith('bw:')));
assert.ok(save.game.killed.includes('zone:forest:1'));

const store = new MemoryStore();
store.set('rpg_heroes', JSON.stringify([]));
const backend = new LocalStorageSaveBackend(store);
const repo = new SaveRepository(backend);

const heroSave: HeroSave = {
  hero: { id: 'h2', name: 'A', cls: 'riddare', level: 1, xp: 0, gold: 0, inv: [], equip: {} },
  game: {
    seed: 9,
    worldSeed: 9,
    killed: ['bw:1,1:0:varg'],
    zone: 'forest',
    pos: { x: 0, y: 4 },
    stage: 0,
    runes: 0,
    city: 'besatt',
    bwCoordEpoch: BIG_WORLD_COORD_EPOCH,
  },
};

await backend.save('h2', heroSave);
for (let i = 0; i < 5; i++) {
  const loaded = await repo.load('h2');
  assert.ok(loaded?.game);
  assert.equal(loaded.game.bwCoordEpoch, BIG_WORLD_COORD_EPOCH);
  assert.deepEqual(loaded.game.killed, ['bw:1,1:0:varg']);
  await repo.save(loaded);
}

const raw = store.get('rpg_hero_h2');
assert.ok(raw);
const remigrate = m.migrate(JSON.parse(raw));
assert.equal(remigrate?.game?.bwCoordEpoch, BIG_WORLD_COORD_EPOCH);
assert.deepEqual(remigrate?.game?.killed, ['bw:1,1:0:varg']);

console.log('save-bw-coord-migrate.test.mts: ok');
