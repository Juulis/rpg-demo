/**
 * Serialiserad SaveBackend: markFound vs autosave och remove vs sent markFound.
 * Kör: npx tsx tests/save-queue.test.mts
 */
import assert from 'node:assert/strict';
import type { HeroSave } from '../src/core/GameContext';
import type { FoundEntry, SaveBackend } from '../src/core/SaveBackend';
import { MemoryStore } from '../src/core/storage';
import { LocalStorageSaveBackend } from '../src/save/backend/LocalStorageSaveBackend';
import { SerializedSaveBackend } from '../src/save/backend/SerializedSaveBackend';
import { SAVE_VERSION } from '../src/save/types';

function must<T>(v: T | null | undefined, what: string): T {
  if (v === null || v === undefined) throw new Error(`saknas: ${what}`);
  return v;
}

/** Långsamma markFound/save för att stressa SerializedSaveBackend. */
class DelayingSaveBackend implements SaveBackend {
  constructor(
    private readonly inner: SaveBackend,
    private readonly delayMs: number,
  ) {}

  setActiveHero(heroId: string | null): void {
    this.inner.setActiveHero(heroId);
  }

  async markFound(id: string, entry: FoundEntry): Promise<boolean> {
    await new Promise((r) => setTimeout(r, this.delayMs));
    return await this.inner.markFound(id, entry);
  }

  async save(id: string, data: HeroSave): Promise<void> {
    await new Promise((r) => setTimeout(r, this.delayMs));
    await this.inner.save(id, data);
  }

  list(): Promise<Awaited<ReturnType<SaveBackend['list']>>> {
    return this.inner.list();
  }
  load(id: string): Promise<HeroSave | null> {
    return this.inner.load(id);
  }
  remove(id: string): Promise<void> {
    return this.inner.remove(id);
  }
  lastPlayedHeroId(): Promise<string | null> {
    return this.inner.lastPlayedHeroId();
  }
  unmarkFound(id: string): Promise<void> {
    return this.inner.unmarkFound(id);
  }
  getSetting(key: string): Promise<string | null> {
    return this.inner.getSetting(key);
  }
  setSetting(key: string, value: string): Promise<void> {
    return this.inner.setSetting(key, value);
  }
  getFogMap(heroId: string): Promise<Record<string, string>> {
    return this.inner.getFogMap(heroId);
  }
  setFog(heroId: string, zone: string, base64: string): Promise<void> {
    return this.inner.setFog(heroId, zone, base64);
  }
  clearFog(heroId: string): Promise<void> {
    return this.inner.clearFog(heroId);
  }
}

const store = new MemoryStore();
const heroId = 'h_q1';
store.set('rpg_heroes', JSON.stringify([{ id: heroId, name: 'Q', cls: 'riddare', level: 1, savedAt: 1 }]));
store.set(
  `rpg_hero_${heroId}`,
  JSON.stringify({
    version: SAVE_VERSION,
    hero: { id: heroId, name: 'Q', cls: 'riddare', level: 1, xp: 0, gold: 0, inv: [], equip: {} },
    game: { seed: 1, killed: [], zone: 'forest', pos: null, stage: 0, runes: 0, city: 'besatt' },
  }),
);

const backend = new SerializedSaveBackend(new DelayingSaveBackend(new LocalStorageSaveBackend(store), 25));
backend.setActiveHero(heroId);

const entry: FoundEntry = { first: 't', quality: 'normal', base: 'ring', ilvl: 1 };
const snap: HeroSave = {
  hero: { id: heroId, name: 'Q', cls: 'riddare', level: 1, xp: 0, gold: 5, inv: [], equip: {}, fresh: false },
  game: { seed: 1, killed: [], zone: 'forest', pos: { x: 0, y: 0 }, stage: 0, runes: 0, city: 'besatt' },
};

const markP = backend.markFound('ring', entry);
const saveP = backend.save(heroId, snap);
await Promise.all([markP, saveP]);

const file = JSON.parse(must(store.get(`rpg_hero_${heroId}`), 'sparfil'));
assert.ok(file.foundItems?.ring, 'fynd ska finnas efter parallell markFound+save');
assert.equal(file.hero.gold, 5, 'autosparning ska inte skriva över fynd');

// markFound efter remove ska inte återskapa hjälten
{
  const store2 = new MemoryStore();
  const id = 'h_del';
  store2.set('rpg_heroes', JSON.stringify([{ id, name: 'D', cls: 'riddare', level: 1 }]));
  store2.set(
    `rpg_hero_${id}`,
    JSON.stringify({
      version: SAVE_VERSION,
      hero: { id, name: 'D', cls: 'riddare', level: 1, xp: 0, gold: 0, inv: [], equip: {} },
      game: null,
    }),
  );
  const backend2 = new SerializedSaveBackend(new LocalStorageSaveBackend(store2));
  backend2.setActiveHero(id);
  await backend2.remove(id);
  assert.equal(await backend2.markFound('late', { first: 'x', quality: 'normal', base: 'b', ilvl: 1 }), false);
  assert.equal(store2.get(`rpg_hero_${id}`), null);
  assert.equal(JSON.parse(must(store2.get('rpg_heroes'), 'index')).length, 0);
}

console.log('SAVE_QUEUE_OK');
