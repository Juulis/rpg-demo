import { chunkWorldSpan, worldToChunk } from './bigWorldCoords';

/** Migrerar bw:-uid från chunk-index utan offset 192 till nuvarande worldToChunk. */
export function migrateBigWorldKillIds(killed: readonly string[]): string[] {
  const span = chunkWorldSpan();
  return killed.map((uid) => {
    if (!uid.startsWith('bw:')) return uid;
    const rest = uid.slice(3);
    const comma = rest.indexOf(',');
    if (comma < 0) return uid;
    const oldCx = Number(rest.slice(0, comma));
    const after = rest.slice(comma + 1);
    const cyEnd = after.indexOf(':');
    if (cyEnd < 0) return uid;
    const oldCy = Number(after.slice(0, cyEnd));
    if (Number.isNaN(oldCx) || Number.isNaN(oldCy)) return uid;
    const wx = oldCx * span + span * 0.5;
    const wy = oldCy * span + span * 0.5;
    const { cx, cy } = worldToChunk(wx, wy);
    if (cx === oldCx && cy === oldCy) return uid;
    const tail = after.slice(cyEnd);
    return `bw:${cx},${cy}${tail}`;
  });
}

export const BIG_WORLD_COORD_EPOCH = 2;
