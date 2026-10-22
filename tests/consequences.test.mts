/**
 * Konsekvenssystem (#43).
 * Kör: npx tsx tests/consequences.test.mts
 */
import assert from 'node:assert/strict';
import { applyConsequences } from '../src/consequences/apply';
import { consequenceTypeRank, CONSEQUENCE_BUILD_ORDER } from '../src/consequences/buildOrder';
import { clampFactionRep, FACTION_MERCHANT_DISCOUNT, factionMood, merchantPriceFactor } from '../src/consequences/factionRep';
import { applyFactionGreetingTone } from '../src/npc/factionGreeting';
import { consequenceNotifyText, setConsequenceNotifyLocale } from '../src/consequences/notifyText';
import { questAnchorsForArea, questAnchorById } from '../src/quest/questAnchors';
import { WorldStateService } from '../src/world/WorldStateService';
import { createEmptyWorldState } from '../src/world/worldStateTypes';

const svc = new WorldStateService();
const notes: string[] = [];
const rt = {
  grantItem: (id: string) => {
    notes.push(`item:${id}`);
    return id !== 'full_bag';
  },
  grantXp: (n: number) => notes.push(`xp:${n}`),
  notify: (m: string) => notes.push(`n:${m}`),
};

applyConsequences(svc, [{ typ: 'flag_set', flag: 'test_flag', value: true }], 1, rt);
assert.equal(svc.get().flags.test_flag, true);

applyConsequences(svc, [{ typ: 'value_add', key: 'hope', delta: 3 }], 1, rt);
assert.equal(svc.get().values.hope, 3);

applyConsequences(svc, [{ typ: 'faction_rep', faktion: 'byborna', delta: 40 }], 1, rt);
assert.equal(svc.get().faction_rep.byborna, 40);
assert.equal(clampFactionRep(200), 100);
assert.equal(factionMood(35), 'warm');
assert.equal(factionMood(-40), 'cold');
assert.ok(merchantPriceFactor(35) < 1 - FACTION_MERCHANT_DISCOUNT / 2);

applyConsequences(svc, [{ typ: 'npc_state', npc: 'lilla_mira', state: 'hjalper_sigrun', delay_dygn: 2 }], 5, rt);
assert.equal(svc.get().npc_states.lilla_mira, undefined);
assert.equal(svc.get().pending.length, 1);
svc.tickPending(7, rt);
assert.equal(svc.get().npc_states.lilla_mira, 'hjalper_sigrun');

applyConsequences(svc, [{ typ: 'npc_location', npc: 'lilla_mira', omrade: 'startlagret', plats: 'helartaltet' }], 1, rt);
assert.equal(svc.get().npc_locations.lilla_mira, 'startlagret:helartaltet');

applyConsequences(svc, [{ typ: 'npc_faction', npc: 'tor_kolare', faktion: 'askans_barn' }], 1, rt);
assert.equal(svc.get().npc_factions.tor_kolare, 'askans_barn');

applyConsequences(svc, [{ typ: 'town_growth', town: 'gamla_byn', delta: 2 }], 1, rt);
assert.equal(svc.get().town_growth.gamla_byn, 2);

applyConsequences(svc, [{ typ: 'merchant_stock', npc: 'olle_vardshus', add: ['valdemars_ol'], remove: [], prisfaktor_mult: 1.05 }], 1, rt);
assert.deepEqual(svc.get().merchant_stock.olle_vardshus?.add, ['valdemars_ol']);

applyConsequences(svc, [{ typ: 'area_change', region: 'gamla_byn', andring: 'ljus', ankare: 'kyrkogarden', value: 'stilla_ljus' }], 1, rt);
assert.ok(svc.get().area_changes['gamla_byn:ljus:kyrkogarden']);

applyConsequences(svc, [{ typ: 'rumor_add', rykte: 'rykte_test' }], 3, rt);
assert.equal(svc.get().rumors_active.rykte_test?.since_day, 3);

applyConsequences(svc, [{ typ: 'quest_exclude', quest: 'miras_bror', val: 'ljug' }], 1, rt);
assert.ok(svc.get().quest_excludes.includes('miras_bror:ljug'));

applyConsequences(svc, [{ typ: 'quest_alt_giver', quest: 'test_q', npc: 'hedda_jagare' }], 1, rt);
assert.equal(svc.get().flags['quest_alt_giver:test_q'], true);
assert.equal(svc.get().npc_locations['givare:test_q'], 'hedda_jagare');

notes.length = 0;
applyConsequences(svc, [{ typ: 'item_grant', item: 'miras_docka' }], 1, rt);
assert.ok(notes.some((n) => n === 'item:miras_docka'));

applyConsequences(svc, [{ typ: 'item_grant', item: 'full_bag' }], 1, rt);
assert.equal(svc.get().flags['item_grant_pending:full_bag'], true);

notes.length = 0;
applyConsequences(svc, [{ typ: 'xp_grant', amount: 50 }], 1, rt);
assert.ok(notes.some((n) => n === 'xp:50'));
assert.equal(svc.get().values.quest_xp_granted, 50);

assert.ok(consequenceTypeRank('item_grant') < consequenceTypeRank('faction_rep'));
assert.equal(CONSEQUENCE_BUILD_ORDER[0], 'flag_set');

const ws = createEmptyWorldState();
ws.faction_rep.de_kvarvarande = 40;
const warm = applyFactionGreetingTone('tor_kolare', ws, 'Hej.');
assert.ok(warm.includes('Hej.'));
assert.ok(warm.includes('varmt'));
ws.faction_rep.de_kvarvarande = -50;
const cold = applyFactionGreetingTone('tor_kolare', ws, 'Hej.');
assert.ok(cold.includes('kallt'));

setConsequenceNotifyLocale('en');
assert.ok(consequenceNotifyText('consequence.xp', { amount: 1 }).includes('experience'));

assert.ok(questAnchorById('startskogen_barnsandal'));
assert.ok(questAnchorsForArea('startskogen').length >= 3);

console.log('consequences.test.mts: ok');
