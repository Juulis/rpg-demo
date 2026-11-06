import { DATA } from '../../data';
import { TILE_WORLD } from '../../render/Iso';

export function chunkTileCount(): number {
  return DATA.varldStor.meta.chunk?.storlek_rutor ?? 64;
}

/** Chunkbredd i världsenheter. */
export function chunkWorldSpan(): number {
  return chunkTileCount() * TILE_WORLD;
}

/** Design: floor((x + offset) / 128); origo (0,0) = mitt i chunk [1,1] (Rungläntan). */
export function chunkWorldOffset(): number {
  return DATA.varldStor.meta.chunk_koordinater?.offset_enheter ?? 192;
}

export function worldToChunk(wx: number, wy: number): { cx: number; cy: number } {
  const span = chunkWorldSpan();
  const o = chunkWorldOffset();
  return { cx: Math.floor((wx + o) / span), cy: Math.floor((wy + o) / span) };
}

export function chunkMinWorld(cx: number, cy: number): { x: number; y: number } {
  const span = chunkWorldSpan();
  const o = chunkWorldOffset();
  return { x: cx * span - o, y: cy * span - o };
}

export function chunkCenterWorld(cx: number, cy: number): { x: number; y: number } {
  const span = chunkWorldSpan();
  const min = chunkMinWorld(cx, cy);
  return { x: min.x + span * 0.5, y: min.y + span * 0.5 };
}

/** localX/localY från generateChunkWorldData är rutor inom chunken. */
export function chunkSpawnToWorld(cx: number, cy: number, localX: number, localY: number): { x: number; y: number } {
  const min = chunkMinWorld(cx, cy);
  return {
    x: min.x + localX * TILE_WORLD,
    y: min.y + localY * TILE_WORLD,
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
