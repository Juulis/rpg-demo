import assert from 'node:assert/strict';
import { worldFighterSpawns } from '../src/world/worldFighterSpawn';
import { Zone } from '../src/world/Zone';

const zone = new Zone('forest', 'startskogen', 900, 900);
zone.circle = 142;

const a = worldFighterSpawns(zone, 99);
const b = worldFighterSpawns(zone, 99);
assert.deepEqual(
  a.map((s) => ({ figure: s.figure, group: s.group, x: Math.round(s.pos.x), y: Math.round(s.pos.y) })),
  b.map((s) => ({ figure: s.figure, group: s.group, x: Math.round(s.pos.x), y: Math.round(s.pos.y) })),
);
assert.ok(a.length >= 4);
assert.ok(a.every((s) => ['jagare', 'aventyrare', 'varld_vakt'].includes(s.figure)));
const groups = new Set(a.map((s) => s.group));
assert.ok(groups.size >= 2);

const village = new Zone('village', 'gamla_byn', 60, 60);
assert.equal(worldFighterSpawns(village, 99).length, 0);

console.log('world-fighters.test.mts: ok');
