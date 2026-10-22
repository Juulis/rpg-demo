/**
 * Dygnsrutiner (#48).
 * Kör: npx tsx tests/npc-routines.test.mts
 */
import assert from 'node:assert/strict';
import { SECONDS_PER_HOUR } from '../src/world/GameClock';
import { inTimeWindow } from '../src/quest/questTime';
import { anchorPosition, parseNpcLocationKey, routineAreaId } from '../src/npc/routineAnchors';
import { activeRoutineSegment, isTradeActivity, merchantInTradeHours, resolveRoutinePlacement } from '../src/npc/resolveRoutine';
import { resolveNpc } from '../src/npc/npcPlacement';
import { createEmptyWorldState } from '../src/world/worldStateTypes';
import { npcById } from '../src/npc/npcCatalog';
import { merchantNightGreeting, routineActivityLabel } from '../src/npc/routineText';
import { setNpcLocale } from '../src/npc/npcText';
import { backgroundVillagerDefs } from '../src/npc/backgroundVillagers';

assert.equal(routineAreaId('startlagret'), 'startskogen');

const midnight = 23 * SECONDS_PER_HOUR;
assert.equal(inTimeWindow(midnight, '22:00', '07:00'), true);
assert.equal(inTimeWindow(10 * SECONDS_PER_HOUR, '22:00', '07:00'), false);

const torNight = activeRoutineSegment('tor_kolare', midnight);
assert.ok(torNight?.plats === 'tors_talt');
assert.equal(isTradeActivity(torNight?.aktivitet ?? ''), false);
assert.equal(merchantInTradeHours('tor_kolare', midnight), false);
assert.equal(merchantInTradeHours('tor_kolare', 12 * SECONDS_PER_HOUR), true);

const campFire = anchorPosition('startskogen', 'lagerelden');
assert.ok(campFire && Math.abs(campFire.x - 5) < 0.01);

const ws = createEmptyWorldState();
ws.npc_locations.tor_kolare = 'startlagret:tors_talt';
const torDef = npcById('tor_kolare');
assert.ok(torDef);
const placed = resolveRoutinePlacement(torDef, ws, 'startskogen', midnight);
assert.ok(placed?.plats === 'tors_talt');

const hidden = resolveRoutinePlacement(torDef, ws, 'gamla_byn', midnight);
assert.equal(hidden, null);

const resolved = resolveNpc(torDef, ws, { zoneAreaId: 'startskogen', worldTime: midnight });
assert.equal(resolved.hidden, false);
const home = torDef.pos ?? [0, 0];
assert.ok(resolved.pos.x !== home[0] || resolved.pos.y !== home[1]);

const { areaId, plats } = parseNpcLocationKey('startlagret:lagerelden');
assert.equal(areaId, 'startskogen');
assert.equal(plats, 'lagerelden');

setNpcLocale('en');
assert.ok(merchantNightGreeting('tor_kolare').includes('gold'));
assert.ok(routineActivityLabel('sover').includes('sleep'));

ws.city_states.gamla_byn = 'aterbefolkad_1';
const bybor = backgroundVillagerDefs('gamla_byn', ws);
assert.ok(bybor.length >= 5);
assert.ok(bybor.every((b) => b.routineTemplate));

console.log('npc-routines.test.mts: ok');
