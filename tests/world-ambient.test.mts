import assert from 'node:assert/strict';
import { worldAmbientSpawns } from '../src/world/worldAmbientSpawn';
import { Zone } from '../src/world/Zone';

const zone = new Zone('forest', 'startskogen', 90, 90);
zone.circle = 45;

const a = worldAmbientSpawns(zone, 42);
const b = worldAmbientSpawns(zone, 42);
assert.deepEqual(
  a.map((s) => ({ figure: s.figure, x: Math.round(s.pos.x * 10), y: Math.round(s.pos.y * 10) })),
  b.map((s) => ({ figure: s.figure, x: Math.round(s.pos.x * 10), y: Math.round(s.pos.y * 10) })),
);
assert.ok(a.length >= 2);
assert.ok(a.every((s) => ['jagare', 'aventyrare', 'varld_vakt', 'handlare', 'bjorn', 'radjur', 'hare', 'rav'].includes(s.figure)));

const village = new Zone('village', 'gamla_byn', 60, 60);
assert.equal(worldAmbientSpawns(village, 42).length, 0);

console.log('world-ambient.test.mts: ok');
