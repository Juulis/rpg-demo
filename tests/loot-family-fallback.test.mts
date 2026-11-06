import assert from 'node:assert/strict';
import { DATA } from '../src/data';
import { Loot } from '../src/logic/loot/Loot';
import { Text } from '../src/text/Text';
import { Rng } from '../src/core/Rng';

const id = 'lyktgast';
assert.ok(!DATA.drops.monsters[id]);
const loot = new Loot(new Text(), new Rng(1));
assert.equal(loot.monsterFamily(id), 'gastar');
assert.equal(loot.monsterFamily('totally_unknown_monster_xyz'), undefined);

const { drops } = loot.rollDrops({ id, mlvl: 16, ilvl: 16, mf: 0, goldFind: 0 });
assert.ok(Array.isArray(drops));

let weaponOrArmor = false;
for (let seed = 1; seed <= 400 && !weaponOrArmor; seed++) {
  const L = new Loot(new Text(), new Rng(seed));
  const rolled = L.rollDrops({ id: 'brandskelett', mlvl: 12, ilvl: 12, mf: 50, goldFind: 0 });
  for (const d of rolled.drops) {
    if (!d.item) continue;
    const base = L.base(d.item);
    const slot = L.slotOf(base);
    if (slot === 'vapen' || base.category === 'rustning') {
      weaponOrArmor = true;
      break;
    }
  }
}
assert.ok(weaponOrArmor, 'brandskelett ska via rollDrops kunna droppa vapen eller rustning');

console.log('loot-family-fallback.test.mts: ok');
