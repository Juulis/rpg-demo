import assert from 'node:assert/strict';
import { Inventory } from '../src/logic/Inventory';
import { discardNeedsConfirm } from '../src/logic/inventoryDiscard';
import { Loot } from '../src/logic/loot/Loot';
import { Text } from '../src/text/Text';
import { Rng } from '../src/core/Rng';
import { LootSystem } from '../src/systems/LootSystem';
import type { World } from '../src/systems/World';
import { Zone } from '../src/world/Zone';

const L = new Loot(new Text(), new Rng(1));
const inv = new Inventory(L, [], {}, () => 1);
const normal = L.makeItem('torkat_kott', { n: 2 });
assert.ok(inv.add(normal));
const questStub = { uid: 'q1', base: 'quest_ulvhilds_pals', quality: 'common', affixes: [], ilvl: 1 };
assert.ok(discardNeedsConfirm(questStub, L));
assert.equal(discardNeedsConfirm(normal, L), false);

inv.detach(normal);
assert.equal(inv.bag.length, 0);

const zone = new Zone('forest', 'startskogen', 90, 90);
const heroPos = { x: 2, y: 3 };
const drops: { pos: { x: number; y: number }; data: { item?: { base: string } } }[] = [];
const world = {
  hero: { pos: heroPos, inv: { bag: [] } },
  rng: new Rng(99),
  zone,
  L,
  objects: { addChild: () => undefined },
  drops,
  text: new Text(),
  fb: { flash: () => undefined, float: () => undefined },
  bus: { emit: () => undefined },
} as unknown as World;

const sys = new LootSystem(
  () => world,
  { iconUrl: () => null, frameUrl: () => '' } as never,
  () => ({
    markFound: async () => false,
    unmarkFound: async () => undefined,
  }),
);
const dropped = L.makeItem('benflisa');
sys.dropFromHero(dropped);
assert.equal(drops.length, 1);
assert.equal(drops[0]?.data.item?.base, 'benflisa');
const p = drops[0]!.pos;
assert.ok(Math.hypot(p.x - heroPos.x, p.y - heroPos.y) < 1.5);

console.log('inventory-drop.test.mts: ok');
