/**
 * Kartmål i byn (#16).
 * Kör: npx tsx tests/map-goal.test.mts
 */
import assert from 'node:assert/strict';
import { DATA } from '../src/data/index';
import type { ZoneView } from '../src/core/GameContext';
import { GoalTracker } from '../src/map/GoalTracker';
import { MapModel } from '../src/map/MapModel';

const model = new MapModel(DATA);
const goals = new GoalTracker(model);
const z: ZoneView = {
  name: 'village',
  areaId: 'gamla_byn',
  width: 62,
  height: 62,
  rect: [-31, 31],
  colliders: [],
  runes: [],
  portals: [],
  cleared: {},
};

const g1 = goals.goal(z, { x: 0, y: 0 });
assert.ok(g1);
assert.ok(g1.text.includes('Byporten'));

z.cleared.byporten = true;
z.cleared.torget = true;
z.cleared.vasterhus = true;
z.cleared.osterhus = true;
z.cleared.kyrkogarden = true;
const g2 = goals.goal(z, { x: 0, y: 0 });
assert.ok(g2);
assert.ok(g2.text.includes('kapell'));

const forest: ZoneView = {
  name: 'forest',
  areaId: 'startskogen',
  width: 80,
  height: 80,
  circle: 40,
  colliders: [],
  runes: [{ x: 5, y: 5, active: false }],
  portals: [],
  cleared: {},
};
const g3 = goals.goal(forest, { x: 0, y: 0 });
assert.ok(g3?.text.includes('runsten'));

console.log('map-goal.test.mts: ok');
