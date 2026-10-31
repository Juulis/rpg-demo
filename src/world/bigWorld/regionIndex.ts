import type { BigWorldRegion } from '../../data/bigWorldTypes';
import { chebyshevChunkDist } from './ringZone';

export interface RegionAtChunk {
  region: BigWorldRegion;
  /** Chebyshev inom regionens radie. */
  inside: boolean;
}

/** Närmaste region vars chunk ligger inom radie (chebyshev), annars mellanmark. */
export function resolveRegionAtChunk(cx: number, cy: number, regions: readonly BigWorldRegion[]): RegionAtChunk {
  let bestInside: BigWorldRegion | null = null;
  let bestInsideDist = Infinity;
  let bestNear: BigWorldRegion | null = null;
  let bestNearDist = Infinity;

  for (const region of regions) {
    const [rx, ry] = region.chunk;
    const d = chebyshevChunkDist(cx, cy, rx, ry);
    if (d <= region['radie']) {
      if (d < bestInsideDist || (d === bestInsideDist && region.id < (bestInside?.id ?? ''))) {
        bestInside = region;
        bestInsideDist = d;
      }
    }
    const eucl = Math.hypot(cx - rx, cy - ry);
    if (eucl < bestNearDist) {
      bestNear = region;
      bestNearDist = eucl;
    }
  }

  if (bestInside) return { region: bestInside, inside: true };
  if (!bestNear) throw new Error('varld_stor: inga regioner definierade');
  return { region: bestNear, inside: false };
}
