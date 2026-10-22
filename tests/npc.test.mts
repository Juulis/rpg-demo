/**
 * NPC-data och tillstånd (#38).
 * Kör: npx tsx tests/npc.test.mts
 */
import assert from 'node:assert/strict';
import { validateData } from '../src/data/index';
import { npcsForZone } from '../src/npc/npcCatalog';
import { resolveNpc } from '../src/npc/npcPlacement';
import { npcLine, npcName, setNpcLocale } from '../src/npc/npcText';
import { createEmptyWorldState } from '../src/world/worldStateTypes';
import { Text } from '../src/text/Text';

const issues = validateData();
assert.ok(!issues.some((i) => i.startsWith('npc ')), issues.join('; '));

const forest = npcsForZone('forest', 'startskogen');
assert.ok(forest.some((n) => n.id === 'gamla_ylva'));
const village = npcsForZone('village', 'gamla_byn');
assert.ok(village.length >= 5);

const ws = createEmptyWorldState();
ws.npc_states.gamla_ylva = 'dod';
const hidden = resolveNpc(forest[0]!, ws);
assert.equal(hidden.hidden, true);

ws.npc_states.gamla_ylva = 'levande';
const shown = resolveNpc(forest[0]!, ws);
assert.equal(shown.hidden, false);

const text = new Text();
setNpcLocale('en');
const ylva = forest[0]!;
assert.equal(npcName(text, ylva), 'Old Ylva');
assert.ok(npcLine(text, ylva).includes('fire'));

setNpcLocale('sv');
assert.equal(npcName(text, ylva), 'Gamla Ylva');

console.log('npc.test.mts: ok');
