/**
 * Dygnscykel (#47).
 * Kör: npx tsx tests/day-cycle.test.mts
 */
import assert from 'node:assert/strict';
import { EventBus } from '../src/core/EventBus';
import type { GameEvents } from '../src/core/events';
import {
  DEFAULT_CLOCK_TIME,
  formatClockTime,
  GameClock,
  gameDay,
  isDaytime,
  nightBlend,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from '../src/world/GameClock';
import { inTimeWindow } from '../src/quest/questTime';
import { clockPeriodLabel, setClockLocale } from '../src/world/clockText';
import { SaveMigrator } from '../src/save/SaveMigrator';

assert.equal(SECONDS_PER_DAY, 48 * 60);
assert.equal(SECONDS_PER_HOUR, 120);
assert.equal(DEFAULT_CLOCK_TIME, 6 * SECONDS_PER_HOUR);
assert.equal(formatClockTime(DEFAULT_CLOCK_TIME), '06:00');

const noon = 12 * SECONDS_PER_HOUR;
assert.equal(isDaytime(noon), true);
assert.equal(nightBlend(noon), 0);

const midnight = 22 * SECONDS_PER_HOUR;
assert.equal(isDaytime(midnight), false);
assert.ok(nightBlend(midnight) > 0.5);

assert.equal(inTimeWindow(10 * SECONDS_PER_HOUR, '06:00', '20:00'), true);
assert.equal(inTimeWindow(midnight, '06:00', '20:00'), false);

const bus = new EventBus<GameEvents>();
let dayChanges = 0;
bus.on('day_changed', () => {
  dayChanges++;
});
const clock = new GameClock(bus);
clock.load(0);
assert.equal(gameDay(clock.timeSeconds), 0);
clock.advance(SECONDS_PER_DAY - 1);
assert.equal(dayChanges, 0);
clock.advance(2);
assert.equal(dayChanges, 1);
assert.equal(clock.day, 1);

setClockLocale('en');
assert.equal(clockPeriodLabel(false), 'Day');
assert.equal(clockPeriodLabel(true), 'Night');

const migrator = new SaveMigrator();
const migrated = migrator.migrate({
  version: 2,
  hero: { id: 'h1', name: 'T', cls: 'riddare', level: 1, xp: 0, gold: 0, inv: [], equip: {} },
  game: { seed: 1, killed: [], zone: 'forest', pos: null, stage: 0, runes: 0, city: 'besatt', worldTime: 9999 },
});
assert.equal(migrated?.game?.worldTime, 9999);

console.log('day-cycle.test.mts: ok');
