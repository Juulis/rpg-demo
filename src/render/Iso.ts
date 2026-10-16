/** Isometrisk projektion 2:1 (tiles 128x64): ruta (i,j) → skärm x=(i-j)*64, y=(i+j)*32. */
export const TILE_W = 128;
export const TILE_H = 64;

/** En iso-ruta = 2 världsenheter (samma som byns tile_size i portal_by.json). */
export const TILE_WORLD = 2;

export const Iso = {
  /** Världsposition (x österut, y söderut, origo = zonens mitt) → skärm-px relativt världens origo. */
  worldToScreen(x: number, y: number): { x: number; y: number } {
    return Iso.toScreen(x / TILE_WORLD, y / TILE_WORLD);
  },
  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    const t = Iso.toTile(sx, sy);
    return { x: t.i * TILE_WORLD, y: t.j * TILE_WORLD };
  },
  toScreen(i: number, j: number): { x: number; y: number } {
    return { x: (i - j) * (TILE_W / 2), y: (i + j) * (TILE_H / 2) };
  },
  toTile(x: number, y: number): { i: number; j: number } {
    return { i: (y / (TILE_H / 2) + x / (TILE_W / 2)) / 2, j: (y / (TILE_H / 2) - x / (TILE_W / 2)) / 2 };
  },
  /** Djupsortering på fotpunktens i+j. */
  depth(i: number, j: number): number {
    return i + j;
  },
};
