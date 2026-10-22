/**
 * Akt 1 quests del 3 (#46).
 * Kör: npx tsx tests/act1-quests-46.test.mts
 */
import assert from 'node:assert/strict';
import { questAnchorById } from '../src/quest/questAnchors';
import { QuestEngine } from '../src/quest/questEngine';
import { initialStepId } from '../src/quest/questAlreadyDone';
import { questById } from '../src/quest/questCatalog';
import { WorldStateService } from '../src/world/WorldStateService';
import { readQuestProgress } from '../src/quest/questProgress';
import { createEmptyWorldState } from '../src/world/worldStateTypes';
import { inTimeWindow } from '../src/quest/questTime';
import { SECONDS_PER_HOUR } from '../src/world/GameClock';
import { uniqueRepopulationQuestId, repopulationCityAfterQuest } from '../src/world/repopulation';

const vagg = questAnchorById('ristarens_vagg');
assert.ok(vagg?.areaId === 'gamla_byn' && vagg.region === 'kapellets_krypta');
assert.equal(uniqueRepopulationQuestId('gamla_byn'), 'begrav_benkungen');

const run = questById('runornas_ristare');
assert.ok(run);
const wsRun = createEmptyWorldState();
wsRun.flags.krypta_besokt = true;
assert.equal(
  initialStepId(run, {
    ctx: { world: wsRun, day: 0 },
    worldTime: 0,
    hasItem: () => false,
    region: 'startskogen',
  }),
  'markena',
);

const svc = new WorldStateService();
const engine = new QuestEngine(svc);
writeRunornasActive(svc);
const night = 22 * SECONDS_PER_HOUR;
const day = 12 * SECONDS_PER_HOUR;
assert.ok(inTimeWindow(night, '20:00', '06:00'));
assert.ok(!inTimeWindow(day, '20:00', '06:00'));
engine.onInspect('runsten_1', { worldTime: day, region: 'startskogen', hasItem: () => false });
assert.equal(readQuestProgress(svc.get(), 'runornas_ristare').inspekterat?.length ?? 0, 0);
engine.onInspect('runsten_1', { worldTime: night, region: 'startskogen', hasItem: () => false });
engine.onInspect('runsten_2', { worldTime: night, region: 'startskogen', hasItem: () => false });
engine.onInspect('runsten_3', { worldTime: night, region: 'startskogen', hasItem: () => false });
assert.equal(readQuestProgress(svc.get(), 'runornas_ristare').steg, 'ylva_tolkar');

let xp = 0;
svc.get().quests.runornas_ristare = { status: 'aktiv', steg: 'berätta' };
const hooks = { worldTime: night, region: 'startskogen', hasItem: (id: string) => id === 'ristarens_mejsel' };
engine.onNpcTalk('gamla_ylva', hooks);
engine.applyChoice('runornas_ristare', 'skona', hooks, {
  grantXp: (n) => {
    xp += n;
  },
});
assert.equal(readQuestProgress(svc.get(), 'runornas_ristare').status, 'klar');
assert.equal(xp, 1131);
assert.equal(svc.get().flags['quest_alt_giver:tand_stenen'], true);
assert.equal(svc.get().flags.ristarens_sanning, false);

const ben = questById('begrav_benkungen');
assert.ok(ben);
const wsBen = createEmptyWorldState();
wsBen.bosses_killed.push('benkungen_valdemar');
assert.equal(
  initialStepId(ben, {
    ctx: { world: wsBen, day: 0 },
    worldTime: 0,
    hasItem: () => false,
    region: 'gamla_byn',
  }),
  'signeten',
);

const svc2 = new WorldStateService();
svc2.setCityState('gamla_byn', 'aterbefolkad_2');
const engine2 = new QuestEngine(svc2);
writeBegravActive(svc2);
engine2.applyChoice(
  'begrav_benkungen',
  'begrav_med_signet',
  { worldTime: 0, region: 'gamla_byn', hasItem: () => true },
  { grantXp: (n) => (xp += n) },
);
assert.equal(svc2.get().city_states.gamla_byn, 'aterbefolkad_3');
assert.equal(repopulationCityAfterQuest(svc2.get(), 'begrav_benkungen'), null);

console.log('act1-quests-46.test.mts: ok');

function writeRunornasActive(svc: WorldStateService): void {
  svc.get().quests.runornas_ristare = { status: 'aktiv', steg: 'markena' };
}

function writeBegravActive(svc: WorldStateService): void {
  svc.get().quests.begrav_benkungen = { status: 'aktiv', steg: 'graven' };
}
