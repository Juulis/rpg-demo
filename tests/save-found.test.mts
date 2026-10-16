/**
 * Sparning: per-hjälte fynd och migrering från globalt rpg_found.
 * Kör: npx tsx tests/save-found.test.mts
 */
import assert from 'node:assert/strict';
import { MemoryStore } from '../src/core/storage';
import { LocalStorageSaveBackend } from '../src/save/backend/LocalStorageSaveBackend';
import { GlobalFoundMigration, MIGRATED_KEY } from '../src/save/GlobalFoundMigration';
import { SAVE_VERSION } from '../src/save/types';

function must<T>(v: T | null | undefined, what: string): T {
  if (v === null || v === undefined) throw new Error(`saknas: ${what}`);
  return v;
}

// --- migrering till senast spelad (rpg_save.last)
{
  const store = new MemoryStore();
  store.set('rpg_heroes', JSON.stringify([{ id: 'h_a', name: 'A', cls: 'riddare', level: 1 }]));
  store.set(
    'rpg_hero_h_a',
    JSON.stringify({
      version: SAVE_VERSION,
      hero: { id: 'h_a', name: 'A', cls: 'riddare', level: 1, xp: 0, gold: 0, inv: [], equip: {} },
      game: null,
      found: 2,
    }),
  );
  store.set(
    'rpg_hero_h_b',
    JSON.stringify({
      version: SAVE_VERSION,
      hero: { id: 'h_b', name: 'B', cls: 'barbar', level: 1, xp: 0, gold: 0, inv: [], equip: {} },
      game: null,
    }),
  );
  store.set(
    'rpg_heroes',
    JSON.stringify([
      { id: 'h_a', name: 'A', cls: 'riddare', level: 1 },
      { id: 'h_b', name: 'B', cls: 'barbar', level: 1 },
    ]),
  );
  store.set(
    'rpg_found',
    JSON.stringify({
      ring: { first: '2020-01-01', quality: 'magic', base: 'ring', ilvl: 5 },
      svard: { first: '2020-01-02', quality: 'normal', base: 'langsvard', ilvl: 1 },
    }),
  );
  store.set('rpg_save', JSON.stringify({ version: SAVE_VERSION, last: 'h_a' }));

  new GlobalFoundMigration(store).run();
  assert.equal(store.get(MIGRATED_KEY), '1');
  const migratedA = JSON.parse(must(store.get('rpg_hero_h_a'), 'h_a efter migrering'));
  assert.ok(migratedA.foundItems?.ring);
  const migratedB = JSON.parse(must(store.get('rpg_hero_h_b'), 'h_b'));
  assert.equal(migratedB.foundItems, undefined, 'endast senast spelad får globala fynd');
}

// --- utan rpg_save: högst savedAt vinner
{
  const store = new MemoryStore();
  store.set(
    'rpg_heroes',
    JSON.stringify([
      { id: 'h_old', name: 'O', cls: 'riddare', level: 1, savedAt: 10 },
      { id: 'h_new', name: 'N', cls: 'barbar', level: 1, savedAt: 99 },
    ]),
  );
  for (const id of ['h_old', 'h_new']) {
    store.set(
      `rpg_hero_${id}`,
      JSON.stringify({
        version: SAVE_VERSION,
        hero: { id, name: id, cls: 'riddare', level: 1, xp: 0, gold: 0, inv: [], equip: {} },
        game: null,
      }),
    );
  }
  store.set('rpg_found', JSON.stringify({ gem: { first: 'x', quality: 'normal', base: 'g', ilvl: 1 } }));

  new GlobalFoundMigration(store).run();
  const newHero = JSON.parse(must(store.get('rpg_hero_h_new'), 'h_new'));
  const oldHero = JSON.parse(must(store.get('rpg_hero_h_old'), 'h_old'));
  assert.ok(newHero.foundItems?.gem);
  assert.equal(oldHero.foundItems, undefined);
}

// --- inga hjältar: flagga sätts inte (försök igen senare)
{
  const store = new MemoryStore();
  store.set('rpg_found', JSON.stringify({ x: { first: 'a', quality: 'normal', base: 'b', ilvl: 1 } }));
  new GlobalFoundMigration(store).run();
  assert.equal(store.get(MIGRATED_KEY), null);
}

// --- per hjälte vid spel
{
  const store = new MemoryStore();
  const backend = new LocalStorageSaveBackend(store, undefined, () => 'h_test1');
  store.set('rpg_heroes', JSON.stringify([{ id: 'h_a', name: 'A', cls: 'riddare', level: 1 }]));
  store.set(
    'rpg_hero_h_a',
    JSON.stringify({
      version: SAVE_VERSION,
      hero: { id: 'h_a', name: 'A', cls: 'riddare', level: 1, xp: 0, gold: 0, inv: [], equip: {} },
      game: null,
    }),
  );
  store.set(
    'rpg_hero_h_b',
    JSON.stringify({
      version: SAVE_VERSION,
      hero: { id: 'h_b', name: 'B', cls: 'barbar', level: 1, xp: 0, gold: 0, inv: [], equip: {} },
      game: null,
    }),
  );
  store.set(
    'rpg_heroes',
    JSON.stringify([
      { id: 'h_a', name: 'A', cls: 'riddare', level: 1 },
      { id: 'h_b', name: 'B', cls: 'barbar', level: 1 },
    ]),
  );

  backend.setActiveHero('h_a');
  assert.equal(await backend.markFound('unik', { first: 'x', quality: 'rare', base: 'hjalm', ilvl: 3 }), true);
  backend.setActiveHero('h_b');
  assert.equal(await backend.markFound('unik', { first: 'z', quality: 'rare', base: 'hjalm', ilvl: 3 }), true);

  const fileA = JSON.parse(must(store.get('rpg_hero_h_a'), 'h_a'));
  const fileB = JSON.parse(must(store.get('rpg_hero_h_b'), 'h_b'));
  assert.ok(fileA.foundItems.unik);
  assert.ok(fileB.foundItems.unik);
  assert.notEqual(fileA.foundItems.unik.first, fileB.foundItems.unik.first);
}

console.log('SAVE_FOUND_OK');
