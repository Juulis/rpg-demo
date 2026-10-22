/** Speldygn och klockslag från världstid (90 enheter = ett dygn). */
export function gameDay(time: number): number {
  return Math.floor(time / 90);
}

export function gameMinutesOfDay(time: number): number {
  const frac = (time % 90) / 90;
  return Math.floor(frac * 24 * 60);
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
