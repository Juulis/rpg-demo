import assert from 'node:assert/strict';
import { DATA } from '../src/data';
import { Loot } from '../src/logic/loot/Loot';
import { Text } from '../src/text/Text';
import { Rng } from '../src/core/Rng';

/** Speglar famKey i Loot.rollDrops — ska inte hårdkoda bestar när drop-rad saknas. */
function dropFamilyKey(loot: Loot, id: string): string {
  const boss = DATA.drops.bosses[id];
  const mon = DATA.drops.monsters[id];
  const src = boss ?? mon;
  return src?.table ?? src?.family ?? loot.monsterFamily(id) ?? 'bestar';
}

const id = 'lyktgast';
assert.ok(!DATA.drops.monsters[id]);
const loot = new Loot(new Text(), new Rng(1));
assert.equal(loot.monsterFamily(id), 'gastar');
assert.equal(dropFamilyKey(loot, id), 'gastar');
assert.notEqual(dropFamilyKey(loot, id), 'bestar');

const { drops } = loot.rollDrops({ id, mlvl: 16, ilvl: 16, mf: 0, goldFind: 0 });
assert.ok(Array.isArray(drops));

console.log('loot-family-fallback.test.mts: ok');
