/**
 * Enhetstester för utvecklarfusk-multiplikatorer.
 * Kör: npx tsx tests/dev-cheats.test.mts
 */
import assert from 'node:assert/strict';
import {
  _resetDevCheatsForTest,
  effectiveMagicFind,
  mfMultiplier,
  setDevCheat,
  xpMultiplier,
} from '../src/dev/DevCheats';

_resetDevCheatsForTest();

assert.equal(xpMultiplier(), 1);
assert.equal(mfMultiplier(), 1);
assert.equal(effectiveMagicFind(12), 12);

setDevCheat('xp5', true);
assert.equal(xpMultiplier(), 5);
setDevCheat('xp5', false);
assert.equal(xpMultiplier(), 1);

setDevCheat('mf100', true);
assert.equal(mfMultiplier(), 100);
assert.equal(effectiveMagicFind(12), 1200);
setDevCheat('mf100', false);
assert.equal(effectiveMagicFind(50), 50);

// Kombination
setDevCheat('xp5', true);
setDevCheat('mf100', true);
assert.equal(xpMultiplier(), 5);
assert.equal(effectiveMagicFind(10), 1000);

_resetDevCheatsForTest();
console.log('dev-cheats.test.mts: ok');
