import assert from 'node:assert/strict';
import { DATA } from '../src/data/index';
import { Loot } from '../src/logic/loot/Loot';
import type { Equip, Item } from '../src/logic/loot/types';
import { Text } from '../src/text/Text';
import { Rng } from '../src/core/Rng';

const L = new Loot(new Text(), new Rng(1));
const cls = DATA.classes.classes.find((c) => c.id === 'riddare');
if (!cls) throw new Error('riddare saknas');

function setPiece(base: string, setId: string): Item {
  return L.makeItem(base, { quality: 'set', set: setId, ilvl: 20 });
}

const gravEquip: Equip = {
  hjalm: null,
  amulett: null,
  brost: null,
  vapen: setPiece('tvahands_klubba', 'gravvaktarens_arv'),
  offhand: setPiece('kampskold', 'gravvaktarens_arv'),
  handskar: null,
  balte: null,
  stovlar: null,
  ring1: null,
  ring2: null,
};

const bare = L.computeStats(cls, 10, { ...gravEquip, vapen: null, offhand: null });
const st2 = L.computeStats(cls, 10, gravEquip);
assert.ok(st2.setActive.includes('gravvaktarens_arv:2'));
assert.ok(st2.vs.ododa - bare.vs.ododa >= 0.19, '2-del bonus vs odöda');

gravEquip.handskar = setPiece('laderhandskar', 'gravvaktarens_arv');
const st3 = L.computeStats(cls, 10, gravEquip);
assert.ok(st3.setActive.includes('gravvaktarens_arv:3'));
assert.ok(st3.defense > st2.defense, '3-del bonus ökar försvar via defense_pct');

gravEquip.brost = setPiece('ringbrynja', 'gravvaktarens_arv');
gravEquip.amulett = setPiece('bensmycke', 'gravvaktarens_arv');
const st5 = L.computeStats(cls, 10, gravEquip);
assert.ok(st5.setActive.includes('gravvaktarens_arv:5'));
assert.ok(Math.abs(st5.resistDarkMagic - 0.25) < 1e-6);
assert.ok(Math.abs(st5.mf - 20) < 1e-6);

const templar: Equip = { ...gravEquip };
for (const s of Object.keys(templar) as (keyof Equip)[]) templar[s] = null;
templar.vapen = setPiece('riddarsvard', 'tempelriddarens_ed');
templar.offhand = setPiece('tornskold', 'tempelriddarens_ed');
templar.hjalm = setPiece('riddarhjalm', 'tempelriddarens_ed');
templar.brost = setPiece('tempelpansar', 'tempelriddarens_ed');
templar.stovlar = setPiece('jarnstovlar', 'tempelriddarens_ed');
const stFull = L.computeStats(cls, 20, templar);
assert.equal(stFull.immuneKnockback, true);
assert.ok(stFull.skillBonus.skoldslag?.stun_s === 1.0);

console.log('set-bonuses.test.mts: ok');
