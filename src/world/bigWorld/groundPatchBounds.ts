/** Delad patch-bounds (test + BigWorldStreamGround). */
import { chunkMinWorld } from './bigWorldCoords';
import { TILE_WORLD } from '../../render/Iso';

export function patchWorldBounds(
  cx: number,
  cy: number,
  pi: number,
  pj: number,
  patchTiles: number,
  tiles: number,
): { minX: number; minY: number; maxX: number; maxY: number } {
  const ti0 = pi * patchTiles;
  const tj0 = pj * patchTiles;
  const tw = Math.min(patchTiles, tiles - ti0);
  const th = Math.min(patchTiles, tiles - tj0);
  const min = chunkMinWorld(cx, cy);
  const minX = min.x + ti0 * TILE_WORLD;
  const minY = min.y + tj0 * TILE_WORLD;
  return { minX, minY, maxX: minX + tw * TILE_WORLD, maxY: minY + th * TILE_WORLD };
}
