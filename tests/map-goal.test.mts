/**
 * Kartmål i byn (#16).
 * Kör: npx tsx tests/map-goal.test.mts
 */
import assert from 'node:assert/strict';
import { DATA } from '../src/data/index';
import type { ZoneView } from '../src/core/GameContext';
import { LocaleManager } from '../src/i18n/LocaleManager';
import { GoalTracker } from '../src/map/GoalTracker';
import { MapModel } from '../src/map/MapModel';

const backend = {
  settings: new Map<string, string>(),
  async getSetting(key: string) {
    return backend.settings.get(key) ?? null;
  },
  async setSetting(key: string, value: string) {
    backend.settings.set(key, value);
  },
};

const i18n = new LocaleManager({ dev: false });
await i18n.bindSettings(backend as never);
const model = new MapModel(DATA, i18n);
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
assert.ok(model.t(g1.text, g1.params).includes('Byporten'));

z.cleared.byporten = true;
z.cleared.torget = true;
z.cleared.vasterhus = true;
z.cleared.osterhus = true;
z.cleared.kyrkogarden = true;
const g2 = goals.goal(z, { x: 0, y: 0 });
assert.ok(g2);
assert.ok(model.t(g2.text, g2.params).includes('kapell'));

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
assert.ok(model.t(g3!.text, g3!.params).includes('runsten'));

console.log('map-goal.test.mts: ok');
