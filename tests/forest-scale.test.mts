import assert from 'node:assert/strict';
import { DATA, monsterDef } from '../src/data/index';
import { expandStartskogenArea } from '../src/data/startskogenExpand';
import { HeroModel } from '../src/logic/HeroModel'; // need()
import { SpawnSystem } from '../src/systems/SpawnSystem';
import { createSession } from '../src/core/Session';
import { FOREST_AREA_SCALE, FOREST_LEGACY_RADIUS, FOREST_PLAY_RADIUS } from '../src/world/forestConstants';

const base = DATA.spawn.areas.find((a) => a.id === 'startskogen');
assert.ok(base);
const expanded = expandStartskogenArea(base);
assert.ok(expanded.spawn_points.length >= base.spawn_points.length + 32);

const areaRatio = (FOREST_PLAY_RADIUS / FOREST_LEGACY_RADIUS) ** 2;
assert.ok(Math.abs(areaRatio - FOREST_AREA_SCALE) < 0.05, `yta ~10×: ${areaRatio}`);

const spawn = new SpawnSystem();
const session = createSession();
session.worldSeed = 424242;
session.seed = 424242;
const specs = spawn.roll(spawn.area('startskogen'), session, {});
let xp = 0;
for (const s of specs) {
  const def = monsterDef(s.enemy);
  xp += def.xp ?? 0;
}
let level = 1;
let pool = xp;
while (level < 7 && pool >= HeroModel.need(level)) {
  pool -= HeroModel.need(level);
  level++;
}
assert.ok(level >= 7, `förväntad nivå ≥7 vid full rensning, fick ${level} (${xp} xp totalt)`);

console.log('forest-scale.test.mts: ok');
