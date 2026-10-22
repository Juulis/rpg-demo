/**
 * Dialoger.json och villkorsval (#39).
 * Kör: npx tsx tests/dialog.test.mts
 */
import assert from 'node:assert/strict';
import { validateData } from '../src/data/index';
import { pickDialogLine } from '../src/npc/dialogPick';
import { resolveDialogText } from '../src/npc/dialogResolve';
import { dialogLineText, setDialogLocale } from '../src/npc/dialogText';
import { createEmptyWorldState } from '../src/world/worldStateTypes';
import { Text } from '../src/text/Text';
import { npcsForZone } from '../src/npc/npcCatalog';

const issues = validateData();
assert.ok(!issues.some((i) => i.startsWith('dialog ')), issues.join('; '));

const ws = createEmptyWorldState();
const base = { world: ws, day: 3 };
const ylva = pickDialogLine('gamla_ylva', 'halsning', base);
assert.ok(ylva);
assert.equal(ylva.id, 'ylva_halsning_01');

ws.runes_active = 3;
const ylvaRunor = pickDialogLine('gamla_ylva', 'halsning', { world: ws, day: 3 });
assert.equal(ylvaRunor?.id, 'ylva_halsning_02');

ws.rumors_active.rykte_dimmerstrand = { since_day: 1, until_day: 10 };
const olle = pickDialogLine('olle_vardshus', 'rykte', { world: ws, day: 5 });
assert.equal(olle?.id, 'olle_rykte_01');

ws.quests.ulvhilds_pals = { status: 'aktiv' };
const bror = pickDialogLine('bror_vakt', 'quest', { world: ws, day: 5 });
assert.equal(bror?.id, 'bror_quest_02');

const def = npcsForZone('forest', 'startskogen').find((n) => n.id === 'gamla_ylva');
assert.ok(def);
const text = new Text();
setDialogLocale('en');
const en = resolveDialogText(def, 'bark', base, text);
assert.ok(en.toLowerCase().includes('bells') || en.toLowerCase().includes('dream'));

setDialogLocale('sv');
const sv = dialogLineText('gamla_ylva', 'bark', 'ylva_bark_01', 'Stenarna drömmer i natt.', text);
assert.equal(sv, 'Stenarna drömmer i natt.');

console.log('dialog.test.mts: ok');
