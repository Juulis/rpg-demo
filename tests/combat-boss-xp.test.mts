import assert from 'node:assert/strict';
import { DATA } from '../src/data';
import { CombatRules, bossXpFactorFor } from '../src/logic/CombatRules';
import { Loot } from '../src/logic/loot/Loot';
import { Rng } from '../src/core/Rng';

const rules = new CombatRules(new Loot(), new Rng(1));
const ulv = DATA.families.monsters.find((m) => m.id === 'grabjornen_ulvhild');
assert.ok(ulv?.boss);

const xp = rules.monsterXp({ lvl: 6, boss: true, xp: ulv.xp, xpMult: 1, bossAct: 'akt_1' }, 6);
assert.equal(bossXpFactorFor('akt_1'), 1);
assert.equal(xp, 2425, 'Ulvhild ska ge 2425 XP vid samma nivå (faktor endast här)');

const low = rules.monsterXp({ lvl: 6, boss: true, xp: ulv.xp, xpMult: 1, bossAct: 'akt_1' }, 12);
assert.ok(low < xp, 'högre hjältenivå ger lägre boss-XP via penalty');

console.log('combat-boss-xp.test.mts: ok');
