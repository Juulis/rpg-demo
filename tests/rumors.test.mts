/**
 * Rykten från rykten.json (#41).
 * Kör: npx tsx tests/rumors.test.mts
 */
import assert from 'node:assert/strict';
import { validateData } from '../src/data/index';
import { eligibleRumorsForNpc, npcHasNewRumor, pickRumorForNpc } from '../src/rumor/pickRumor';
import { formatRumorText, setRumorLocale } from '../src/rumor/rumorText';
import { evaluateCondition } from '../src/world/evaluateCondition';
import { createEmptyWorldState } from '../src/world/worldStateTypes';
import { Text } from '../src/text/Text';

const issues = validateData();
assert.equal(issues.length, 0, issues.join('; '));

const ws = createEmptyWorldState();
const base = { world: ws, day: 1 };

let ylva = eligibleRumorsForNpc('gamla_ylva', base);
assert.ok(ylva.some((r) => r.id === 'rykte_runorna_sover'));

ws.runes_active = 3;
ylva = eligibleRumorsForNpc('gamla_ylva', { world: ws, day: 1 });
assert.ok(ylva.some((r) => r.id === 'rykte_portalen_oppen'));
assert.ok(!ylva.some((r) => r.id === 'rykte_runorna_sover'));

ws.bosses_killed.push('grabjornen_ulvhild');
const tor = eligibleRumorsForNpc('tor_kolare', { world: ws, day: 1 });
assert.ok(tor.some((r) => r.id === 'rykte_ulvhild_dod'));
assert.ok(!tor.some((r) => r.id === 'rykte_vargarna_okar'));

const pick1 = pickRumorForNpc('gamla_ylva', { world: ws, day: 1 }, undefined);
assert.ok(pick1);
const pick2 = pickRumorForNpc('gamla_ylva', { world: ws, day: 1 }, pick1.id);
assert.ok(pick2);
assert.notEqual(pick2.id, pick1.id);

ws.rumors_last.gamla_ylva = pick1.id;
assert.equal(npcHasNewRumor('gamla_ylva', { world: ws, day: 1 }, pick1.id), false);
assert.equal(npcHasNewRumor('gamla_ylva', { world: ws, day: 1 }, pick2.id), true);

ws.last_events.push({ id: 'legendary_found:runsmidd_klinga', at: 1, day: 5 });
assert.equal(evaluateCondition({ event: 'legendary_found' }, { world: ws, day: 6 }), true);
assert.equal(evaluateCondition({ event: 'legendary_found' }, { world: ws, day: 8 }), false);

ws.city_states.gamla_byn = 'aterbefolkad_1';
assert.equal(evaluateCondition({ city_state_gte: { gamla_byn: 'aterbefolkad_1' } }, { world: ws, day: 1 }), true);

const text = new Text();
ws.bosses_killed.push('benkungen_valdemar');
ws.bosses_killed.push('trasdrottningen');
const hjalten = eligibleRumorsForNpc('olle_vardshus', { world: ws, day: 1 }).find((r) => r.id === 'rykte_hjalten');
assert.ok(hjalten);
const line = formatRumorText(hjalten, { heroName: 'Aldric', text, world: ws });
assert.ok(line.includes('Aldric'));
assert.ok(line.includes('3'));

setRumorLocale('en');
const en = formatRumorText(hjalten, { heroName: 'Aldric', text, world: ws });
assert.ok(en.includes('Aldric'));

console.log('rumors.test.mts: ok');
