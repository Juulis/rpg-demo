import { DATA } from '../../data';
import type { PlayableCityZone } from '../cityZones';
import { chunkCenterWorld, chunkMinWorld, chunkTileCount, chunkWorldOffset } from './bigWorldCoords';
import { TILE_WORLD } from '../../render/Iso';

/** Region-chunk för stadsportar (varld_stor.json, issue #85). */
const CITY_REGION_CHUNK: Readonly<Record<PlayableCityZone, readonly [number, number]>> = {
  wolfstead: [3, 1],
  dimmerstrand: [-7, 0],
  kopparberg: [0, 9],
  askeborg: [1, -11],
};

export function bigWorldCityPortalWorld(city: PlayableCityZone): { x: number; y: number } {
  const [cx, cy] = CITY_REGION_CHUNK[city];
  const tiles = chunkTileCount();
  const region = DATA.varldStor.regioner.find((r) => r.chunk[0] === cx && r.chunk[1] === cy);
  const off = region?.typ === 'stad' ? 0.35 : 0.5;
  const min = chunkMinWorld(cx, cy);
  return {
    x: min.x + off * tiles * TILE_WORLD,
    y: min.y + off * tiles * TILE_WORLD,
  };
}

export { chunkCenterWorld } from './bigWorldCoords';

/** Chunkar vars centrum ligger inom ungefär r från wx,wy. */
export function chunksNearWorld(wx: number, wy: number, r: number): { cx: number; cy: number }[] {
  const span = chunkTileCount() * TILE_WORLD;
  const o = chunkWorldOffset();
  const minCx = Math.floor((wx + o) / span);
  const maxCx = Math.floor((wx + r + o) / span);
  const minCy = Math.floor((wy + o) / span);
  const maxCy = Math.floor((wy + r + o) / span);
  const out: { cx: number; cy: number }[] = [];
  for (let cx = minCx; cx <= maxCx; cx++) {
    for (let cy = minCy; cy <= maxCy; cy++) {
      const c = chunkCenterWorld(cx, cy);
      if (Math.hypot(c.x - wx, c.y - wy) <= r + span * 0.6) out.push({ cx, cy });
    }
  }
  return out;
}
