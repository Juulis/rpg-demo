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
