/**
 * Quest-legendary: mark-detektering och utrustning (#42 / Bugbot #96).
 */
import assert from 'node:assert/strict';
import { EventBus } from '../src/core/EventBus';
import { Inventory } from '../src/logic/Inventory';
import { Loot } from '../src/logic/loot/Loot';
import { Rng } from '../src/core/Rng';
import { Text } from '../src/text/Text';
import { groundHasItemId } from '../src/quest/questItems';
import { QuestEncounterSystem } from '../src/systems/QuestEncounterSystem';
import type { LootSystem } from '../src/systems/LootSystem';
import type { World } from '../src/systems/World';
import { WorldStateService } from '../src/world/WorldStateService';
import type { MonsterFactory } from '../src/entities/MonsterFactory';

const L = new Loot(new Text(), new Rng(1));

assert.ok(
  groundHasItemId(
    [{ data: { item: { uid: 'd1', base: 'sandaler', leg: 'flyktingens_sandaler', quality: 'legendary', affixes: [], ilvl: 2 } } }],
    'flyktingens_sandaler',
  ),
);
assert.ok(!groundHasItemId([{ data: { item: { uid: 'd2', base: 'sandaler', quality: 'normal', affixes: [], ilvl: 1 } } }], 'flyktingens_sandaler'));

let spawnCalls = 0;
const lootSys = { spawn: () => {
  spawnCalls++;
} } as unknown as LootSystem;
const bus = new EventBus();
const svc = new WorldStateService();
const ws = svc.get();
ws.flags.quest_mira_champion_slain = true;
ws.quests.miras_bror = { status: 'aktiv', steg: 'sanningen' };

const w = {
  drops: [
    {
      data: {
        item: L.makeLegendaryItem('flyktingens_sandaler', { ilvl: 2 }),
      },
    },
  ],
  hero: { level: 5, inv: new Inventory(L, [], {}, () => 5) },
  L,
  monsters: [],
  zone: { collide: () => undefined },
} as unknown as World;

const encounters = new QuestEncounterSystem(bus, svc, {} as MonsterFactory, lootSys, () => w);
encounters.update(w, { worldTime: 0, region: 'startskogen', hasItem: () => false });
assert.equal(spawnCalls, 0, 'spawn when legendary already on ground');

const inv = new Inventory(L, [], {}, () => 10);
const sandals = L.makeLegendaryItem('flyktingens_sandaler', { ilvl: 2 });
assert.ok(inv.add(sandals));
assert.ok(inv.equipTo(sandals, 'stovlar'));
assert.equal(inv.bag.length, 0);
assert.equal(inv.equip.stovlar, sandals);
assert.ok(inv.unequip('stovlar'));
assert.equal(inv.bag.length, 1);
assert.equal(inv.equip.stovlar, null);

const dropTarget = L.makeLegendaryItem('viskarens_skalle', { ilvl: 4 });
assert.ok(inv.add(dropTarget));
const before = inv.bag.length;
inv.remove(dropTarget);
assert.equal(inv.bag.length, before);

console.log('quest-legendary-items.test.mts: ok');
