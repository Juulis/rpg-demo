import assert from 'node:assert/strict';
import { DATA } from '../src/data';
import { isConsumableCategory } from '../src/logic/consumables';
import { Loot } from '../src/logic/loot/Loot';
import { Text } from '../src/text/Text';
import { Rng } from '../src/core/Rng';
import { SV } from '../src/text/sv';

const ids = DATA.items.potions.map((p) => p.id);
assert.ok(!ids.some((id) => id.includes('dryck') || id.includes('potion')));
assert.ok(ids.includes('torkat_kott') && ids.includes('vargblod'));
for (const p of DATA.items.potions) {
  assert.equal(p.category, 'mat');
  assert.ok(isConsumableCategory(p.category));
}

const text = new Text();
const loot = new Loot(text, new Rng(1));
const jerky = loot.makeItem('torkat_kott');
assert.equal(loot.base(jerky).heal_over_time?.total, 18);

const beast = DATA.drops.family_tables.bestar.category_weights;
assert.ok((beast.mat ?? 0) > 0 && !('dryck' in beast));
const tier1 = DATA.drops.potion_weights_by_tier['1'];
assert.ok(tier1.torkat_kott > 0);

assert.ok(!JSON.stringify(SV).match(/halsodryck|Livsdryck|potion/i));

console.log('natural-consumables.test.mts: ok');
