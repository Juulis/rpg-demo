import assert from 'node:assert/strict';
import { MemoryStore } from '../src/core/storage';
import { LocalStorageSaveBackend } from '../src/save/backend/LocalStorageSaveBackend';
import { FogRepository } from '../src/map/FogRepository';
import { FogOfWar } from '../src/map/FogOfWar';
import { SAVE_VERSION } from '../src/save/types';

const store = new MemoryStore();
const backend = new LocalStorageSaveBackend(store);
const repo = new FogRepository(backend);

const raw = {
  version: SAVE_VERSION,
  hero: { id: 'hf', name: 'F', cls: 'riddare', level: 1, xp: 0, gold: 0, inv: [], equip: {} },
  game: { seed: 1, killed: [], zone: 'forest', pos: null, stage: 0, runes: 0, city: 'besatt', bwCoordEpoch: 2 },
};
store.set('rpg_heroes', JSON.stringify([{ id: 'hf', name: 'F', cls: 'riddare', level: 1 }]));
store.set('rpg_hero_hf', JSON.stringify(raw));

await repo.prepare('hf');

// Simulate game flow: create FogOfWar wired to repo (as MapModule does)
const fog = new FogOfWar((zone) => repo.load('hf', zone));
fog.setWorldAnchored(true);

// 1. Reveal (0,0)
fog.revealWorld('forest', 0, 0);
assert.ok(fog.isWorldRevealed('forest', 0, 0), 'origin ska vara avslöjad efter reveal');

// 2. Walk 20 chunks away (128*20 = 2560 world units east)
fog.revealWorld('forest', 128 * 20, 0);
assert.ok(!fog.isWorldRevealed('forest', 0, 0) === false, 'efter walk ska origin fortfarande vara känd i minnet');
assert.ok(fog.chunkFogEntries() <= 625, 'trim ska ha hänt');

// 3. Flush dirty (saves via repo -> backend)
for (const [zone, cells] of fog.takeDirty()) {
  const ok = await repo.save('hf', zone, cells);
  assert.ok(ok, 'save av dimma ska lyckas');
}

// 4. Simulate reload: new FogOfWar instance with same loader
const encBeforeReload = repo.load('hf', 'forest');
assert.ok(encBeforeReload, 'det ska finnas sparad dimma efter save');

const fog2 = new FogOfWar((zone) => repo.load('hf', zone));
fog2.setWorldAnchored(true);
assert.ok(fog2.isWorldRevealed('forest', 0, 0), '(0,0) ska vara avslöjat efter reload');

console.log('fog-persist-far.test.mts: ok');
