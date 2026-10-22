/**
 * world_state och villkorsutvärderare (#37).
 * Kör: npx tsx tests/world-state.test.mts
 */
import assert from 'node:assert/strict';
import { evaluateCondition } from '../src/world/evaluateCondition';
import { WorldStateService } from '../src/world/WorldStateService';
import { createEmptyWorldState, hydrateWorldStateFromLegacy, parseWorldState } from '../src/world/worldStateTypes';
import { SAVE_VERSION } from '../src/save/types';
import { SaveMigrator } from '../src/save/SaveMigrator';

const svc = new WorldStateService();
svc.recordBossKilled('benkungen_valdemar');
assert.ok(svc.get().bosses_killed.includes('benkungen_valdemar'));

const ctx = { world: svc.get(), day: 5 };
assert.equal(evaluateCondition({ boss_killed: 'benkungen_valdemar' }, ctx), true);
assert.equal(evaluateCondition({ boss_not_killed: 'askfursten_morvath' }, ctx), true);
assert.equal(evaluateCondition({ bosses_killed_gte: 1 }, ctx), true);
assert.equal(evaluateCondition({ runes_active_gte: 0 }, ctx), true);

svc.setRunesActive(3);
assert.equal(evaluateCondition({ runes_active_gte: 2 }, { world: svc.get() }), true);
assert.equal(evaluateCondition({ runes_active_lt: 5 }, { world: svc.get() }), true);

svc.setCityState('gamla_byn', 'rensad');
assert.equal(evaluateCondition({ city_state_gte: { city: 'gamla_byn', min: 'rensad' } }, { world: svc.get() }), true);
assert.equal(evaluateCondition({ city_state_gte: { city: 'gamla_byn', min: 'aterbefolkad_1' } }, { world: svc.get() }), false);

const ws = createEmptyWorldState();
ws.faction_rep.byborna = 35;
assert.equal(evaluateCondition({ faction_rep_gte: { faction: 'byborna', value: 30 } }, { world: ws }), true);
assert.equal(evaluateCondition({ faction_rep_lt: { faction: 'byborna', value: 10 } }, { world: ws }), false);

ws.quests.test_quest = { status: 'active', step: 2 };
assert.equal(evaluateCondition({ quest_status: { id: 'test_quest', status: 'active' } }, { world: ws }), true);
ws.quests.test_quest = { choice: 'a' };
assert.equal(evaluateCondition({ quest_val: { id: 'test_quest', key: 'choice', value: 'a' } }, { world: ws }), true);

ws.rumors_active.hjaltar = { since_day: 1, until_day: 10 };
assert.equal(evaluateCondition({ rykte_aktivt: 'hjaltar' }, { world: ws, day: 5 }), true);
assert.equal(evaluateCondition({ rykte_aktivt: 'hjaltar' }, { world: ws, day: 11 }), false);

const legacy = hydrateWorldStateFromLegacy(
  { seed: 1, killed: ['benkungen_valdemar'], zone: 'forest', pos: null, stage: 0, runes: 2, city: 'rensad' },
  { leg_sword: { first: 'x', quality: 'legendary', base: 'svard', ilvl: 5 } },
);
assert.equal(legacy.runes_active, 2);
assert.equal(legacy.city_states.gamla_byn, 'rensad');
assert.ok(legacy.bosses_killed.includes('benkungen_valdemar'));
assert.ok(legacy.legendaries_found.includes('leg_sword'));

const roundtrip = parseWorldState(JSON.parse(JSON.stringify(legacy)));
assert.deepEqual(roundtrip?.bosses_killed, legacy.bosses_killed);

const migrator = new SaveMigrator();
const migrated = migrator.migrate({
  version: 1,
  hero: { id: 'h1', name: 'T', cls: 'riddare', level: 1, xp: 0, gold: 0, inv: [], equip: {} },
  game: { seed: 9, killed: [], zone: 'forest', pos: null, stage: 0, runes: 1, city: 'besatt' },
});
assert.equal(migrated?.version, SAVE_VERSION);
assert.equal(migrated?.worldState?.runes_active, 1);

console.log('world-state.test.mts: ok');
