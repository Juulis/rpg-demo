import assert from 'node:assert/strict';
import { CombatRules } from '../src/logic/CombatRules';
import { Loot } from '../src/logic/loot/Loot';
import { Rng } from '../src/core/Rng';
import { xpDistanceMultiplier } from '../src/world/bigWorld/worldGenerator';

const rules = new CombatRules(new Loot(new Rng(1)), new Rng(2));
const m = { lvl: 5, boss: false, xp: 10, xpMult: 1 };
const base = rules.monsterXp(m, 5, 0);
const far = rules.monsterXp(m, 5, 10);
assert.equal(far, Math.round(base * xpDistanceMultiplier(10)));

console.log('big-world-xp.test.mts: ok');
