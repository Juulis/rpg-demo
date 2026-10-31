import assert from 'node:assert/strict';
import { MemoryStore } from '../src/core/storage';
import { LocalStorageSaveBackend } from '../src/save/backend/LocalStorageSaveBackend';
import { FogRepository } from '../src/map/FogRepository';
import { SAVE_VERSION } from '../src/save/types';

class QuotaStore extends MemoryStore {
  failFog = false;
  set(key: string, value: string): void {
    if (this.failFog && key.includes('hero')) throw new Error('QuotaExceededError');
    super.set(key, value);
  }
}

const store = new QuotaStore();
const backend = new LocalStorageSaveBackend(store);
const fogRepo = new FogRepository(backend);

const raw = {
  version: SAVE_VERSION,
  hero: { id: 'hq', name: 'Q', cls: 'riddare', level: 1, xp: 0, gold: 0, inv: [], equip: {} },
  game: { seed: 1, killed: [], zone: 'forest', pos: null, stage: 0, runes: 0, city: 'besatt', bwCoordEpoch: 2 },
};
store.set('rpg_heroes', JSON.stringify([{ id: 'hq', name: 'Q', cls: 'riddare', level: 1 }]));
store.set('rpg_hero_hq', JSON.stringify(raw));

await fogRepo.prepare('hq');
store.failFog = true;
const ok = await fogRepo.save('hq', 'forest', new Uint8Array([3, 0, 0]));
assert.equal(ok, false);
assert.ok(fogRepo.lastError);

await backend.save('hq', {
  hero: raw.hero,
  game: { seed: 1, killed: [], zone: 'forest', pos: { x: 1, y: 1 }, stage: 0, runes: 0, city: 'besatt', bwCoordEpoch: 2 },
});

console.log('fog-storage-quota.test.mts: ok');
