import { DATA } from '../../data';
import { TILE_WORLD } from '../../render/Iso';

export function chunkTileCount(): number {
  return DATA.varldStor.meta.chunk?.storlek_rutor ?? 64;
}

/** Chunkbredd i världsenheter (samma som skala i worldGenerator). */
export function chunkWorldSpan(): number {
  return chunkTileCount() * TILE_WORLD;
}

export function worldToChunk(wx: number, wy: number): { cx: number; cy: number } {
  const span = chunkWorldSpan();
  return { cx: Math.floor(wx / span), cy: Math.floor(wy / span) };
}

/** localX/localY från generateChunkWorldData är rutor inom chunken. */
export function chunkSpawnToWorld(cx: number, cy: number, localX: number, localY: number): { x: number; y: number } {
  const tiles = chunkTileCount();
  return {
    x: (cx * tiles + localX) * TILE_WORLD,
    y: (cy * tiles + localY) * TILE_WORLD,
  };
}

export function parseBigWorldSpawnUid(uid: string): { cx: number; cy: number } | null {
  if (!uid.startsWith('bw:')) return null;
  const rest = uid.slice(3);
  const comma = rest.indexOf(',');
  if (comma < 0) return null;
  const cx = Number(rest.slice(0, comma));
  const after = rest.slice(comma + 1);
  const cyEnd = after.indexOf(':');
  if (cyEnd < 0) return null;
  const cy = Number(after.slice(0, cyEnd));
  if (Number.isNaN(cx) || Number.isNaN(cy)) return null;
  return { cx, cy };
}
