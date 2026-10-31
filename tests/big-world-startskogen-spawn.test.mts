import assert from 'node:assert/strict';
import { DATA } from '../src/data';
import {
  mapStartskogenSpecsToQueue,
  offsetToStartskogenAnchor,
  releaseStartskogenQueueSlot,
  spawnPointInsideStartskogenFootprint,
  startskogenLegacyAnchor,
} from '../src/world/bigWorld/startskogenSpawn';
import { isInsideStartskogenChunk } from '../src/world/bigWorld/heroRegion';
import { Zone } from '../src/world/Zone';
import type { World } from '../src/systems/World';
import type { SpawnSpec } from '../src/systems/SpawnSystem';

const skog = DATA.varldStor.regioner.find((r) => r.id === 'startskogen');
assert.ok(skog);
const anchor = startskogenLegacyAnchor();
assert.ok(Math.abs(anchor.x) < 1 && Math.abs(anchor.y) < 1, 'legacy spawnzoner ankade vid Rungläntans mitt (0,0)');

const legacyAtOrigin = offsetToStartskogenAnchor({ x: 0, y: 0 });
assert.ok(spawnPointInsideStartskogenFootprint(legacyAtOrigin));

const zone = new Zone('forest', 'startskogen', 4096, 4096);
zone.bigWorldStreaming = true;
zone.toWorld = (p: readonly [number, number]) => ({ x: p[0], y: p[1] });
zone.collide = () => undefined;

const spec: SpawnSpec = {
  uid: 'startskogen:test',
  enemy: 'skuggvarg',
  pos: [10, 10],
  level: 3,
  elite: null,
  modifiers: [],
  boss: false,
};

const w = {
  zone,
  session: { killed: new Set<string>() },
  spawnQueue: [],
  monsters: [],
} as unknown as World;

w.spawnQueue = mapStartskogenSpecsToQueue(w, [spec]);
assert.equal(w.spawnQueue.length, 1);
assert.ok(isInsideStartskogenChunk(skog.chunk[0], skog.chunk[1]));

const q0 = w.spawnQueue[0];
assert.ok(q0);
q0.done = true;
releaseStartskogenQueueSlot(w, 'startskogen:test');
assert.equal(q0.done, false, 'despawn ska frigöra spawnkön om monstret inte dödades');

q0.done = true;
w.session.killed.add('startskogen:test');
releaseStartskogenQueueSlot(w, 'startskogen:test');
assert.equal(q0.done, true, 'dödade monster ska inte återaktivera kön');

console.log('big-world-startskogen-spawn.test.mts: ok');
