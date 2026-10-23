/**
 * Vargaby (#36) — spawndata och zonkoordinater.
 */
import assert from 'node:assert/strict';
import { createSession } from '../src/core/Session';
import { DATA } from '../src/data';
import { SpawnSystem } from '../src/systems/SpawnSystem';
import { Zone } from '../src/world/Zone';
import { FOREST_VARGABY_PORTAL_X } from '../src/world/forestConstants';

const area = DATA.spawn.areas.find((a) => a.id === 'vargaby');
assert.ok(area, 'spawnzoner: vargaby');
assert.equal(area.city_id, 'vargaby');

const port = area.spawn_points.find((p) => p.id === 'vargaby_port');
assert.ok(port);
const z = new Zone('wolfstead', 'vargaby', 62, 62);
z.tileCoords = true;
const entry = z.toWorld(port.pos);
const expect = Zone.T(port.pos[0], port.pos[1]);
assert.ok(Math.hypot(entry.x - expect.x, entry.y - expect.y) < 0.01);

const spawn = new SpawnSystem();
const session = createSession('vargaby-test');
const specs = spawn.roll(area, session, { cityState: 'besatt' });
assert.ok(specs.length > 0, 'monster vid besatt stad');
assert.ok(specs.some((s) => s.boss && s.enemy === 'grabjornen_ulvhild'));

assert.ok(FOREST_VARGABY_PORTAL_X > 100, 'skogsportal österut');

console.log('vargaby-zone.test.mts: ok');
