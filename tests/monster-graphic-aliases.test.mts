import assert from 'node:assert/strict';
import { monsterLook } from '../src/entities/MonsterDefs';

const has = (sheet: string): boolean =>
  sheet === 'skuggvarg' || sheet === 'smittad_bybo' || sheet === 'gravgast' || sheet === 'ruttnande_lik' || sheet === 'forvriden_jagare';

assert.equal(monsterLook('gravargsledare', 'bestar', has).sheet, 'skuggvarg');
assert.equal(monsterLook('sprickvasen', 'forvridna', has).sheet, 'smittad_bybo');
assert.equal(monsterLook('lyktgast', 'gastar', has).sheet, 'gravgast');
assert.equal(monsterLook('klockdrunknad', 'ododa', has).sheet, 'ruttnande_lik');
assert.equal(monsterLook('havsgast', 'gastar', has).sheet, 'gravgast');

assert.equal(monsterLook('sprickvasen', 'forvridna', has).tint, 0xc8a882);
assert.equal(monsterLook('lyktgast', 'gastar', has).tint, 0xaaccff);
assert.equal(monsterLook('havsgast', 'gastar', has).tint, 0x6688aa);

console.log('monster-graphic-aliases.test.mts: ok');
