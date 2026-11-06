import { Rng } from '../../core/Rng';

/** Per-ruta tile — oberoende av byggordning (chunkSeed + rutindex). */
export function pickChunkGroundTileId(chunkSeed: number, ti: number, tj: number, pool: readonly string[]): string {
  if (pool.length === 0) return 'gras_1';
  return new Rng(Rng.hash(chunkSeed, 'ground', ti, tj)).pick(pool);
}

/** Samma val som pickChunkGroundTileId — för tester utan Pixi. */
export function chunkGroundTileGrid(chunkSeed: number, tiles: number, pool: readonly string[]): string[][] {
  const grid: string[][] = [];
  for (let ti = 0; ti < tiles; ti++) {
    const row: string[] = [];
    for (let tj = 0; tj < tiles; tj++) row.push(pickChunkGroundTileId(chunkSeed, ti, tj, pool));
    grid.push(row);
  }
  return grid;
}

/** En patch à patchTiles — samma tile-indexering som BigWorldStreamGround.buildTilesStep. */
export function fillPatchGroundTiles(
  grid: string[][],
  chunkSeed: number,
  pool: readonly string[],
  pi: number,
  pj: number,
  patchTiles: number,
  tiles: number,
): void {
  const ti0 = pi * patchTiles;
  const tj0 = pj * patchTiles;
  const tw = Math.min(patchTiles, tiles - ti0);
  const th = Math.min(patchTiles, tiles - tj0);
  for (let built = 0; built < tw * th; built++) {
    const di = Math.floor(built / tw);
    const dj = built % tw;
    const ti = ti0 + di;
    const tj = tj0 + dj;
    const row = grid[ti];
    if (!row) continue;
    row[tj] = pickChunkGroundTileId(chunkSeed, ti, tj, pool);
  }
}

export function buildChunkGroundViaPatchOrder(
  chunkSeed: number,
  tiles: number,
  pool: readonly string[],
  patchTiles: number,
  patchOrder: readonly [number, number][],
): string[][] {
  const grid: string[][] = Array.from({ length: tiles }, () => Array.from({ length: tiles }, () => ''));
  for (const [pi, pj] of patchOrder) fillPatchGroundTiles(grid, chunkSeed, pool, pi, pj, patchTiles, tiles);
  return grid;
}

export function patchOrderByDistance(firstPi: number, firstPj: number, tiles: number, patchTiles: number): [number, number][] {
  const side = Math.ceil(tiles / patchTiles);
  const order: [number, number][] = [];
  for (let pi = 0; pi < side; pi++) for (let pj = 0; pj < side; pj++) order.push([pi, pj]);
  order.sort((a, b) => (a[0] - firstPi) ** 2 + (a[1] - firstPj) ** 2 - ((b[0] - firstPi) ** 2 + (b[1] - firstPj) ** 2));
  return order;
}
