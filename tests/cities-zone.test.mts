/**
 * Spelbara städer (#36) — spawnzoner och skogsportar.
 */
import assert from 'node:assert/strict';
import { createSession } from '../src/core/Session';
import { DATA } from '../src/data';
import { SpawnSystem } from '../src/systems/SpawnSystem';
import { Zone } from '../src/world/Zone';
import { FOREST_CITY_PORTALS } from '../src/world/forestConstants';
import { cityAreaId, cityPortTile, cityArenaTiles, PLAYABLE_CITIES } from '../src/world/cityZones';
import { LocaleManager } from '../src/i18n/LocaleManager';
import { GoalTracker } from '../src/map/GoalTracker';
import { MapModel } from '../src/map/MapModel';
import type { Key } from '../src/i18n/types';

const i18nBackend = {
  settings: new Map<string, string>(),
  async getSetting(key: string) {
    return i18nBackend.settings.get(key) ?? null;
  },
  async setSetting(key: string, value: string) {
    i18nBackend.settings.set(key, value);
  },
};
const i18n = new LocaleManager({ dev: false });
await i18n.bindSettings(i18nBackend as never);
const mapModel = new MapModel(DATA, i18n);
const goalTracker = new GoalTracker(mapModel);

const CITY_GOAL: Record<(typeof PLAYABLE_CITIES)[number], Key> = {
  wolfstead: 'map.goal_wolf_den',
  dimmerstrand: 'map.goal_dimmerstrand',
  kopparberg: 'map.goal_kopparberg',
  askeborg: 'map.goal_askeborg',
};

const spawn = new SpawnSystem();

for (const zoneName of PLAYABLE_CITIES) {
  const areaId = cityAreaId(zoneName);
  const area = DATA.spawn.areas.find((a) => a.id === areaId);
  assert.ok(area, `spawnzoner: ${areaId}`);

  const [tx, ty] = cityPortTile(areaId);
  const z = new Zone(zoneName, areaId, 62, 62);
  z.tileCoords = true;
  const entry = z.toWorld([tx, ty]);
  const expect = Zone.T(tx, ty);
  assert.ok(Math.hypot(entry.x - expect.x, entry.y - expect.y) < 0.01, `${areaId} port tile`);

  const session = createSession(`city-${areaId}`);
  const specs = spawn.roll(area, session, { cityState: 'besatt' });
  assert.ok(specs.length > 0, `${areaId} spawnar monster när besatt`);

  const arena = cityArenaTiles(areaId);
  assert.deepEqual(arena.center, area.boss?.pos, `${areaId} arena centrum = boss`);

  const g = goalTracker.goal(
    {
      name: zoneName,
      areaId,
      width: 62,
      height: 62,
      rect: [-31, 31],
      colliders: [],
      runes: [],
      portals: [],
      cleared: {},
      arena: { x0: 0, y0: 0, x1: 1, y1: 1 },
    },
    { x: 0, y: 0 },
  );
  assert.equal(g?.text, CITY_GOAL[zoneName], `${zoneName} kartmål`);
}

assert.ok(FOREST_CITY_PORTALS.wolfstead.x > 100);
assert.ok(FOREST_CITY_PORTALS.dimmerstrand.x < -100);

console.log('cities-zone.test.mts: ok');
