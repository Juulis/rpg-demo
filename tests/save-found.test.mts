/**
 * Sparning: per-hjälte fynd och migrering från globalt rpg_found.
 * Kör: npx tsx tests/save-found.test.mts
 */
import assert from 'node:assert/strict';

function must<T>(v: T | null | undefined, what: string): T {
  if (v === null || v === undefined) throw new Error(`saknas: ${what}`);
  return v;
}
import { MemoryStore } from '../src/core/storage';
import { LocalStorageSaveBackend } from '../src/save/backend/LocalStorageSaveBackend';
import { GlobalFoundMigration } from '../src/save/GlobalFoundMigration';
import { SAVE_VERSION } from '../src/save/types';

const store = new MemoryStore();
const backend = new LocalStorageSaveBackend(store, undefined, () => 'h_test1');

// index + en hjälte
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
assert.equal(store.get('rpg_found_per_hero_v1'), '1');
const migratedA = JSON.parse(must(store.get('rpg_hero_h_a'), 'h_a efter migrering'));
assert.ok(migratedA.foundItems?.ring);
assert.equal(migratedA.found, 2);

// per hjälte: fynd på A syns inte på B
backend.setActiveHero('h_a');
assert.equal(await backend.markFound('unik', { first: 'x', quality: 'rare', base: 'hjalm', ilvl: 3 }), true);
assert.equal(await backend.markFound('unik', { first: 'y', quality: 'rare', base: 'hjalm', ilvl: 3 }), false);

backend.setActiveHero('h_b');
assert.equal(await backend.markFound('unik', { first: 'z', quality: 'rare', base: 'hjalm', ilvl: 3 }), true);

const fileA = JSON.parse(must(store.get('rpg_hero_h_a'), 'h_a'));
const fileB = JSON.parse(must(store.get('rpg_hero_h_b'), 'h_b'));
assert.ok(fileA.foundItems.unik);
assert.ok(fileB.foundItems.unik);
assert.notEqual(fileA.foundItems.unik.first, fileB.foundItems.unik.first);

console.log('SAVE_FOUND_OK');
