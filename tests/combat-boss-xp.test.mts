import assert from 'node:assert/strict';
import { DATA } from '../src/data';
import { CombatRules, bossXpFactorFor } from '../src/logic/CombatRules';
import { HeroModel } from '../src/logic/HeroModel';
import { Loot } from '../src/logic/loot/Loot';
import { Rng } from '../src/core/Rng';

const rules = new CombatRules(new Loot(), new Rng(1));
const ulv = DATA.families.monsters.find((m) => m.id === 'grabjornen_ulvhild');
assert.ok(ulv?.boss);
assert.equal(ulv.xp, 550, 'Ulvhilds xp_bas är rå, inte förberäknad kill-XP');

const xp = rules.monsterXp({ lvl: 6, boss: true, xp: ulv.xp, xpMult: 1, bossAct: 'akt_1' }, 6);
assert.equal(bossXpFactorFor('akt_1'), 1);
assert.equal(xp, 2425, 'Ulvhild ska ge 2425 XP vid samma nivå (faktor endast här)');
const doubledUlv = rules.monsterXp({ lvl: 6, boss: true, xp: xp, xpMult: 1, bossAct: 'akt_1' }, 6);
assert.notEqual(doubledUlv, xp, 'faktorn får inte bakas in i xp_bas och räknas en gång till');

const low = rules.monsterXp({ lvl: 6, boss: true, xp: ulv.xp, xpMult: 1, bossAct: 'akt_1' }, 12);
assert.ok(low < xp, 'högre hjältenivå ger lägre boss-XP via penalty');

const korp = DATA.families.monsters.find((m) => m.id === 'korpmodern');
assert.ok(korp?.underboss);
assert.equal(korp.boss, false);
assert.equal(korp.xp, 700, 'Korpmoderns xp_bas är rå');
const korpFactor = bossXpFactorFor('akt_2', true);
assert.ok(Math.abs(korpFactor - 0.17 * 0.4) < 1e-9);
const korpXp = rules.monsterXp({ lvl: 13, boss: false, underboss: true, xp: korp.xp, xpMult: 1, bossAct: 'akt_2' }, 13);
assert.equal(korpXp, 669, 'underboss-faktor 0,17×0,4 en gång');
const doubledKorp = Math.round(korpXp * korpFactor);
assert.notEqual(doubledKorp, korpXp);

function levelAfter(total: number): number {
  let level = 1;
  let left = total;
  while (level < 99 && left >= HeroModel.need(level)) {
    left -= HeroModel.need(level);
    level++;
  }
  return level;
}
assert.equal(levelAfter(802), 3, 'ring 0: 802 XP → nivå 3');
assert.equal(levelAfter(10953), 9, 'ring 1: 10953 XP → nivå 9');

console.log('combat-boss-xp.test.mts: ok');
