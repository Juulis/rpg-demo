import type { BigWorldRing } from '../../data/bigWorldTypes';

/** Euklidiskt avstånd i chunkar från startchunk. */
export function chunkDistanceFromStart(cx: number, cy: number, start: readonly [number, number]): number {
  const [sx, sy] = start;
  return Math.hypot(cx - sx, cy - sy);
}

export function chebyshevChunkDist(ax: number, ay: number, bx: number, by: number): number {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}

/** Ring och nivåband enligt meta.zonmodell (avstånd från start). */
export function ringAtChunkDistance(distance: number, ringar: readonly BigWorldRing[]): { ring: number; levelBand: [number, number] } {
  for (const r of ringar) {
    const hi = r.till ?? Infinity;
    if (distance >= r.fran && distance < hi) {
      return { ring: r.ring, levelBand: r.nivaband };
    }
  }
  const last = ringar[ringar.length - 1];
  return { ring: last?.ring ?? 0, levelBand: last?.nivaband ?? [1, 3] };
}

/** Undertypens fasta nivå ska ligga inom ringens band. */
export function subtypeAllowedInBand(level: number, band: readonly [number, number]): boolean {
  return level >= band[0] && level <= band[1];
}
