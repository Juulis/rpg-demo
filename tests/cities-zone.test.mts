/**
 * Spelbara städer (#36) — spawnzoner och skogsportar.
 */
import assert from 'node:assert/strict';
import { createSession } from '../src/core/Session';
import { DATA } from '../src/data';
import { SpawnSystem } from '../src/systems/SpawnSystem';
import { Zone } from '../src/world/Zone';
import { FOREST_CITY_PORTALS } from '../src/world/forestConstants';
import { cityAreaId, cityPortTile, PLAYABLE_CITIES } from '../src/world/cityZones';

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
}

assert.ok(FOREST_CITY_PORTALS.wolfstead.x > 100);
assert.ok(FOREST_CITY_PORTALS.dimmerstrand.x < -100);

console.log('cities-zone.test.mts: ok');
