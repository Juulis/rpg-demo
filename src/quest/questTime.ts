import { clockHourMinute, isDaytime, gameDay, SECONDS_PER_DAY, timeOfDaySeconds } from '../world/GameClock';

/** Speldygn och klockslag från spelklockan (48 min = ett dygn). */
export { gameDay };

export function gameMinutesOfDay(time: number): number {
  const { hour, minute } = clockHourMinute(time);
  return hour * 60 + minute;
}

function parseHm(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((x) => Number(x));
  return (h ?? 0) * 60 + (m ?? 0);
}

export function inTimeWindow(time: number, from: string, to: string): boolean {
  const cur = gameMinutesOfDay(time);
  const a = parseHm(from);
  const b = parseHm(to);
  if (a <= b) return cur >= a && cur < b;
  return cur >= a || cur < b;
}

export { isDaytime, SECONDS_PER_DAY, timeOfDaySeconds };
