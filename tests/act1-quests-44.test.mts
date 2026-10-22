/**
 * Akt 1 quests del 1 (#44) — regionankare och XP.
 * Kör: npx tsx tests/act1-quests-44.test.mts
 */
import assert from 'node:assert/strict';
import { questAnchorById } from '../src/quest/questAnchors';
import { QuestEngine } from '../src/quest/questEngine';
import { WorldStateService } from '../src/world/WorldStateService';
import { readQuestProgress } from '../src/quest/questProgress';

const kol = questAnchorById('kolarkojan');
assert.ok(kol?.region === 'vargstigen' && kol.areaId === 'startskogen');

const svc = new WorldStateService();
const engine = new QuestEngine(svc);
let xp = 0;
const hooks = {
  worldTime: 0,
  region: 'startskogen',
  hasItem: (id: string) => id === 'flyktingens_sandaler',
};
engine.onNpcTalk('lilla_mira', hooks);
engine.applyChoice('miras_bror', 'ge_sandalerna', hooks, {
  grantXp: (n) => {
    xp += n;
  },
});
assert.equal(readQuestProgress(svc.get(), 'miras_bror').status, 'klar');
assert.equal(xp, 234);

console.log('act1-quests-44.test.mts: ok');
