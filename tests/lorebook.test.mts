/**
 * Lorebok (#7).
 * Kör: npx tsx tests/lorebook.test.mts
 */
import assert from 'node:assert/strict';
import { DATA } from '../src/data/index';
import { LoreBookModel } from '../src/lore/LoreBookModel';

const model = new LoreBookModel(DATA.lorebook);
assert.ok(model.total() >= 40);
assert.equal(model.unlock('okant'), false);
assert.equal(model.unlock('runsmidd_klinga'), true);
assert.equal(model.unlock('runsmidd_klinga'), false);
assert.equal(model.isUnlocked('runsmidd_klinga'), true);
const setId = model.pieces.get('edens_klinga')?.setId;
assert.ok(setId);
assert.equal(model.setRevealed(setId ?? ''), false);
model.unlock('edens_klinga');
assert.equal(model.setRevealed(setId ?? ''), true);
const prog = model.progressForCategory('legendariska');
assert.ok(prog.total >= 15);

console.log('lorebook.test.mts: ok');
