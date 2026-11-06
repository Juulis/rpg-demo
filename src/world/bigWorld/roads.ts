import type { BigWorldRegion, BigWorldRoad } from '../../data/bigWorldTypes';

function chunkKey(cx: number, cy: number): string {
  return `${cx},${cy}`;
}

/** Bresenham-liknande linje mellan chunkcentra. */
function lineChunks(ax: number, ay: number, bx: number, by: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let x0 = ax;
  let y0 = ay;
  const x1 = bx;
  const y1 = by;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  for (;;) {
    out.push([x0, y0]);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
  return out;
}

export interface RoadIndex {
  /** chunkKey -> vag-id */
  byChunk: Map<string, string[]>;
  /** chunkKey -> vägtyp (väg, stig, …) */
  typeByChunk: Map<string, string[]>;
}

/** Förbyggd karta: vilka chunkar varje väg passerar. */
export function buildRoadIndex(roads: readonly BigWorldRoad[], regions: readonly BigWorldRegion[]): RoadIndex {
  const byId = new Map(regions.map((r) => [r.id, r]));
  const byChunk = new Map<string, string[]>();
  const typeByChunk = new Map<string, string[]>();

  const add = (cx: number, cy: number, road: BigWorldRoad) => {
    const k = chunkKey(cx, cy);
    const ids = byChunk.get(k) ?? [];
    if (!ids.includes(road.id)) ids.push(road.id);
    byChunk.set(k, ids);
    const types = typeByChunk.get(k) ?? [];
    if (!types.includes(road.typ)) types.push(road.typ);
    typeByChunk.set(k, types);
  };

  for (const road of roads) {
    const pts = road.strackning.map((id) => byId.get(id)).filter((r): r is BigWorldRegion => r != null);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      if (!a || !b) continue;
      const [ax, ay] = a.chunk;
      const [bx, by] = b.chunk;
      for (const [cx, cy] of lineChunks(ax, ay, bx, by)) add(cx, cy, road);
    }
  }

  return { byChunk, typeByChunk };
}

export function roadsAtChunk(index: RoadIndex, cx: number, cy: number): { ids: string[]; types: string[] } {
  const k = chunkKey(cx, cy);
  return {
    ids: index.byChunk.get(k) ?? [],
    types: index.typeByChunk.get(k) ?? [],
  };
}

/** Lokal ruta inom chunk ligger i vägkorridor (centrum ±4 rutor när chunk har väg). */
export function roadTileInChunk(
  index: RoadIndex,
  cx: number,
  cy: number,
  localTileI: number,
  localTileJ: number,
  tileSize: number,
): boolean {
  if ((index.byChunk.get(chunkKey(cx, cy)) ?? []).length === 0) return false;
  const center = tileSize / 2;
  return Math.abs(localTileI - center) + Math.abs(localTileJ - center) <= 4;
}
