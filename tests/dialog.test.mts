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
assert.equal(ylva.id, 'default');

ws.runes_active = 2;
const ylvaRunor = pickDialogLine('gamla_ylva', 'halsning', { world: ws, day: 3 });
assert.equal(ylvaRunor?.id, 'efter_runor');

ws.rumors_active.hjaltar = { since_day: 1, until_day: 10 };
const olle = pickDialogLine('olle_vardshus', 'halsning', { world: ws, day: 5 });
assert.equal(olle?.id, 'rykte');

ws.quests.rensningen = { status: 'active' };
const ingrid = pickDialogLine('vaktkapten_ingrid', 'halsning', { world: ws, day: 5 });
assert.equal(ingrid?.id, 'quest_aktiv');

const def = npcsForZone('forest', 'startskogen').find((n) => n.id === 'gamla_ylva');
assert.ok(def);
const text = new Text();
setDialogLocale('en');
const en = resolveDialogText(def, 'bark', base, text);
assert.ok(en.includes('fire') || en.includes('Fire'));

setDialogLocale('sv');
const sv = dialogLineText('gamla_ylva', 'bark', 'default', 'Elden är liten men envis.', text);
assert.equal(sv, 'Elden är liten men envis.');

console.log('dialog.test.mts: ok');
