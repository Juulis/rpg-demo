/** Migrerar bw:-uid från chunk-index före offset 192 (+1 chunk i x och y). */
export function migrateBigWorldKillIds(killed: readonly string[]): string[] {
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
    const cx = oldCx + 1;
    const cy = oldCy + 1;
    if (cx === oldCx && cy === oldCy) return uid;
    const tail = after.slice(cyEnd);
    return `bw:${cx},${cy}${tail}`;
  });
}

export const BIG_WORLD_COORD_EPOCH = 2;
