import assert from 'node:assert/strict';
import { DATA } from '../src/data/index';
import { expandStartskogenArea } from '../src/data/startskogenExpand';
import { SpawnSystem } from '../src/systems/SpawnSystem';
import { createSession } from '../src/core/Session';
import { FOREST_AREA_SCALE, FOREST_LEGACY_RADIUS, FOREST_PLAY_RADIUS } from '../src/world/forestConstants';

const base = DATA.spawn.areas.find((a) => a.id === 'startskogen');
assert.ok(base);
const expanded = expandStartskogenArea(base);
assert.equal(expanded.session_roll?.active_spawn_points?.[0], 7);
assert.equal(expanded.session_roll?.active_spawn_points?.[1], 7);

const areaRatio = (FOREST_PLAY_RADIUS / FOREST_LEGACY_RADIUS) ** 2;
assert.ok(Math.abs(areaRatio - FOREST_AREA_SCALE) < 0.05, `yta ~10×: ${areaRatio}`);

const spawn = new SpawnSystem();
let totalMonsters = 0;
for (let seed = 0; seed < 50; seed++) {
  const session = createSession();
  session.worldSeed = seed;
  session.seed = seed;
  totalMonsters += spawn.roll(spawn.area('startskogen'), session, {}).length;
}
const avg = totalMonsters / 50;
assert.ok(avg >= 12 && avg <= 16, `Rungläntan ~14 monster/game, medel ${avg}`);

console.log('forest-scale.test.mts: ok');
