/**
 * Questmotor (#42).
 * Kör: npx tsx tests/quests.test.mts
 */
import assert from 'node:assert/strict';
import { validateData } from '../src/data/index';
import { isQuestItemId } from '../src/quest/questItems';
import { QuestEngine } from '../src/quest/questEngine';
import { readQuestProgress, writeQuestProgress } from '../src/quest/questProgress';
import { initialStepId } from '../src/quest/questAlreadyDone';
import { questById } from '../src/quest/questCatalog';
import { questTitle, setQuestLocale } from '../src/quest/questText';
import { Inventory } from '../src/logic/Inventory';
import { Loot } from '../src/logic/loot/Loot';
import { Rng } from '../src/core/Rng';
import { Text } from '../src/text/Text';
import { WorldStateService } from '../src/world/WorldStateService';

const issues = validateData();
assert.equal(issues.length, 0, issues.join('; '));

assert.ok(isQuestItemId('quest_ulvhilds_pals'));
assert.ok(isQuestItemId('flyktingens_sandaler'));

const svc = new WorldStateService();
const engine = new QuestEngine(svc);
const hooks = {
  worldTime: 10,
  region: 'startskogen',
  hasItem: () => false,
};

const mira = questById('miras_bror');
assert.ok(mira);
engine.onNpcTalk('lilla_mira', hooks);
let p = readQuestProgress(svc.get(), 'miras_bror');
assert.equal(p.status, 'aktiv');
assert.equal(p.steg, 'spar_i_skogen');

svc.get().bosses_killed.push('grabjornen_ulvhild');
const ulv = questById('ulvhilds_pals');
assert.ok(ulv);
const jump = initialStepId(ulv, {
  ctx: { world: svc.get(), day: 0 },
  worldTime: 0,
  hasItem: () => false,
  region: 'vargaby',
});
assert.equal(jump, 'palsen');

const svc2 = new WorldStateService();
const engine2 = new QuestEngine(svc2);
const hooksSandals = { worldTime: 0, region: 'startskogen', hasItem: () => true };
engine2.onNpcTalk('lilla_mira', hooksSandals);
assert.equal(readQuestProgress(svc2.get(), 'miras_bror').steg, 'tillbaka');

const svc3 = new WorldStateService();
writeQuestProgress(svc3.get(), 'miras_bror', { status: 'aktiv', steg: 'sanningen' });
const engine3 = new QuestEngine(svc3);
engine3.onPickup('flyktingens_sandaler', hooks);
assert.equal(readQuestProgress(svc3.get(), 'miras_bror').steg, 'tillbaka');

const ben = questById('benens_visk');
assert.ok(ben);
assert.equal(
  initialStepId(ben, {
    ctx: { world: svc.get(), day: 0 },
    worldTime: 0,
    hasItem: () => true,
    region: 'vargaby',
  }),
  'atervand',
);

setQuestLocale('en');
if (mira) assert.equal(questTitle(mira), 'Sandals in the Moss');
setQuestLocale('sv');

engine2.onNpcTalk('lilla_mira', hooksSandals);
const pending = engine2.pendingChoices('lilla_mira', hooksSandals);
assert.ok(pending.length >= 1);
engine2.applyChoice('miras_bror', 'ge_sandalerna', hooksSandals);
p = readQuestProgress(svc2.get(), 'miras_bror');
assert.equal(p.status, 'klar');
assert.equal(p.val, 'ge_sandalerna');
assert.equal(svc2.get().faction_rep.de_kvarvarande, 10);

const loot = new Loot(new Text(), new Rng(1));
const inv = new Inventory(loot, [], {}, () => 1);
const questLeg = loot.makeLegendaryItem('flyktingens_sandaler', { ilvl: 2 });
assert.ok(inv.add(questLeg));
assert.equal(inv.bag.length, 1);
inv.remove(questLeg);
assert.equal(inv.bag.length, 1);

const inv2 = new Inventory(loot, [{ base: 'flyktingens_sandaler' }], {}, () => 1);
const item = inv2.bag[0];
assert.ok(item);
inv2.remove(item);
assert.equal(inv2.bag.length, 1);

console.log('quests.test.mts: ok');
