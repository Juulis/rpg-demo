/**
 * Akt 1 quests del 2 (#45).
 * Kör: npx tsx tests/act1-quests-45.test.mts
 */
import assert from 'node:assert/strict';
import { questAnchorById } from '../src/quest/questAnchors';
import { QuestEngine } from '../src/quest/questEngine';
import { initialStepId } from '../src/quest/questAlreadyDone';
import { questById } from '../src/quest/questCatalog';
import { WorldStateService } from '../src/world/WorldStateService';
import { readQuestProgress } from '../src/quest/questProgress';
import { createEmptyWorldState } from '../src/world/worldStateTypes';

const ulvIde = questAnchorById('ulvhilds_ide');
assert.ok(ulvIde?.region === 'ulvhilds_ide');
const krypta = questAnchorById('gravvaktarnas_kammare');
assert.ok(krypta?.areaId === 'gamla_byn' && krypta.region === 'kapellets_krypta');

const ulv = questById('ulvhilds_pals');
assert.ok(ulv);
const ws = createEmptyWorldState();
ws.bosses_killed.push('grabjornen_ulvhild');
assert.equal(
  initialStepId(ulv, {
    ctx: { world: ws, day: 0 },
    worldTime: 0,
    hasItem: () => false,
    region: 'startskogen',
  }),
  'palsen',
);

const svc = new WorldStateService();
const engine = new QuestEngine(svc);
let xp = 0;
svc.get().bosses_killed.push('grabjornen_ulvhild');
const hooks = {
  worldTime: 0,
  region: 'startskogen',
  hasItem: (id: string) => id === 'quest_ulvhilds_pals',
};
engine.onNpcTalk('hedda_jagare', hooks);
engine.applyChoice('ulvhilds_pals', 'ge_hedda', hooks, {
  grantXp: (n) => {
    xp += n;
  },
});
assert.equal(readQuestProgress(svc.get(), 'ulvhilds_pals').status, 'klar');
assert.equal(xp, 588);

const grav = questById('gravvaktarnas_sista_strid');
assert.ok(grav);
const ws2 = createEmptyWorldState();
ws2.flags.krypta_besokt = true;
assert.equal(
  initialStepId(grav, {
    ctx: { world: ws2, day: 0 },
    worldTime: 0,
    hasItem: (id) => id === 'quest_gravvaktarnas_kronika',
    region: 'gamla_byn',
  }),
  'valet',
);

console.log('act1-quests-45.test.mts: ok');
