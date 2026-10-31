import { chunkMinWorld, chunkTileCount, worldToChunk } from '../world/bigWorld/bigWorldCoords';
import { fogRevealRadiusWorld } from '../world/bigWorld/spawnDensity';
import { TILE_WORLD } from '../render/Iso';

export type Rgba = readonly [number, number, number, number];

/** Ett fog-rutnät för en zon. Bilden (en pixel per ruta) cachas tills fogen ändras. */
export class FogGrid {
  ver = 1;
  private img: HTMLCanvasElement | null = null;
  private imgVer = 0;
  private imgColor = '';

  constructor(readonly cells: Uint8Array) {}

  image(size: number, color: Rgba): HTMLCanvasElement | null {
    const key = color.join();
    if (this.img && this.imgVer === this.ver && this.imgColor === key) return this.img;
    const cv = this.img ?? document.createElement('canvas');
    cv.width = cv.height = size;
    const c = cv.getContext('2d');
    if (!c) return null;
    const d = c.createImageData(size, size);
    const [r, g, b, a] = color;
    for (let i = 0; i < size * size; i++) {
      if (this.cells[i]) continue;
      d.data[i * 4] = r;
      d.data[i * 4 + 1] = g;
      d.data[i * 4 + 2] = b;
      d.data[i * 4 + 3] = a;
    }
    c.putImageData(d, 0, 0);
    this.img = cv;
    this.imgVer = this.ver;
    this.imgColor = key;
    return cv;
  }
}

const SAVE_V2 = 2;
const SAVE_V3 = 3;
const SECTOR = 32;
const CHUNK_FOG_BYTES = 512;
const MAX_FOG_SAVE_BYTES = 512 * 1024;

function fogRadius(): number {
  return fogRevealRadiusWorld();
}

function chunkFogKey(zone: string, cx: number, cy: number): string {
  return `${zone}|${cx},${cy}`;
}

/** Fog of war: lokalt rutnät (legacy skog) eller chunk-bitmask i världskoordinater (stor skog). */
export class FogOfWar {
  static readonly CELL = 2;
  static readonly RADIUS = 11;
  static readonly GRID = 64;
  static readonly HALF = (FogOfWar.GRID * FogOfWar.CELL) / 2;
  private readonly grids = new Map<string, FogGrid>();
  /** 512 B bitmask per chunk (64×64 rutor). */
  private readonly chunkFog = new Map<string, Uint8Array>();
  private worldAnchored = false;
  private dirty = false;
  private storageFull = false;

  constructor(private readonly loader: (zone: string) => Uint8Array | null = () => null) {}

  setWorldAnchored(on: boolean): void {
    this.worldAnchored = on;
  }

  isWorldAnchored(): boolean {
    return this.worldAnchored;
  }

  get storageQuotaExceeded(): boolean {
    return this.storageFull;
  }

  /** @deprecated stor skog använder världskoordinater direkt */
  getAnchor(): { x: number; y: number } {
    return { x: 0, y: 0 };
  }

  grid(zone: string): FogGrid {
    let g = this.grids.get(zone);
    if (!g) {
      const cells = new Uint8Array(FogOfWar.GRID * FogOfWar.GRID);
      g = new FogGrid(cells);
      this.grids.set(zone, g);
    }
    return g;
  }

  private chunkMask(zone: string, cx: number, cy: number): Uint8Array {
    const key = chunkFogKey(zone, cx, cy);
    let m = this.chunkFog.get(key);
    if (!m) {
      m = new Uint8Array(CHUNK_FOG_BYTES);
      this.chunkFog.set(key, m);
    }
    return m;
  }

  private tileIndex(ti: number, tj: number, tiles: number): number {
    return tj * tiles + ti;
  }

  private setChunkTile(zone: string, cx: number, cy: number, ti: number, tj: number, on: boolean): boolean {
    const tiles = chunkTileCount();
    if (ti < 0 || tj < 0 || ti >= tiles || tj >= tiles) return false;
    const mask = this.chunkMask(zone, cx, cy);
    const bit = this.tileIndex(ti, tj, tiles);
    const byte = bit >> 3;
    const bitIn = bit & 7;
    const cur = mask[byte] ?? 0;
    const prev = (cur >> bitIn) & 1;
    const next = on ? 1 : 0;
    if (prev === next) return false;
    if (on) mask[byte] = cur | (1 << bitIn);
    else mask[byte] = cur & ~(1 << bitIn);
    return true;
  }

  private chunkTileAtWorld(wx: number, wy: number): { cx: number; cy: number; ti: number; tj: number } {
    const { cx, cy } = worldToChunk(wx, wy);
    const min = chunkMinWorld(cx, cy);
    const ti = Math.floor((wx - min.x) / TILE_WORLD);
    const tj = Math.floor((wy - min.y) / TILE_WORLD);
    return { cx, cy, ti, tj };
  }

  private isChunkTileRevealed(zone: string, cx: number, cy: number, ti: number, tj: number): boolean {
    const tiles = chunkTileCount();
    if (ti < 0 || tj < 0 || ti >= tiles || tj >= tiles) return false;
    const key = chunkFogKey(zone, cx, cy);
    const mask = this.chunkFog.get(key);
    if (!mask) return false;
    const bit = this.tileIndex(ti, tj, tiles);
    return (((mask[bit >> 3] ?? 0) >> (bit & 7)) & 1) === 1;
  }

  private loadBlob(zone: string, saved: Uint8Array | null): void {
    if (!saved || saved.length === 0) return;
    if (saved[0] === SAVE_V3) {
      const view = new DataView(saved.buffer, saved.byteOffset, saved.byteLength);
      let o = 1;
      while (o + 4 + CHUNK_FOG_BYTES <= saved.length) {
        const cx = view.getInt16(o, true);
        const cy = view.getInt16(o + 2, true);
        o += 4;
        const slice = saved.subarray(o, o + CHUNK_FOG_BYTES);
        o += CHUNK_FOG_BYTES;
        this.chunkFog.set(chunkFogKey(zone, cx, cy), slice.slice());
      }
      return;
    }
    if (saved[0] === SAVE_V2) {
      const view = new DataView(saved.buffer, saved.byteOffset, saved.byteLength);
      let o = 1;
      while (o + 4 <= saved.length) {
        let sx = view.getInt16(o, true);
        let sy = view.getInt16(o + 2, true);
        if (sx > 400 || sx < -400) sx = view.getUint16(o) > 32767 ? view.getUint16(o) - 65536 : view.getUint16(o);
        if (sy > 400 || sy < -400) sy = view.getUint16(o + 2) > 32767 ? view.getUint16(o + 2) - 65536 : view.getUint16(o + 2);
        o += 4;
        if (o + SECTOR * SECTOR > saved.length) break;
        for (let ly = 0; ly < SECTOR; ly++) {
          for (let lx = 0; lx < SECTOR; lx++) {
            if (!saved[o + ly * SECTOR + lx]) continue;
            const wx = (sx * SECTOR + lx + 0.5) * FogOfWar.CELL;
            const wy = (sy * SECTOR + ly + 0.5) * FogOfWar.CELL;
            const { cx, cy, ti, tj } = this.chunkTileAtWorld(wx, wy);
            this.setChunkTile(zone, cx, cy, ti, tj, true);
          }
        }
        o += SECTOR * SECTOR;
      }
      return;
    }
    if (saved.length >= FogOfWar.GRID * FogOfWar.GRID) {
      for (let j = 0; j < FogOfWar.GRID; j++) {
        for (let i = 0; i < FogOfWar.GRID; i++) {
          if (!saved[j * FogOfWar.GRID + i]) continue;
          const wx = (i - FogOfWar.GRID / 2) * FogOfWar.CELL;
          const wy = (j - FogOfWar.GRID / 2) * FogOfWar.CELL;
          const { cx, cy, ti, tj } = this.chunkTileAtWorld(wx, wy);
          this.setChunkTile(zone, cx, cy, ti, tj, true);
        }
      }
    }
  }

  ensureLoaded(zone: string): void {
    if (this.chunkFog.size > 0 || this.grids.get(zone)?.cells.some((c) => c)) return;
    this.loadBlob(zone, this.loader(zone));
  }

  revealWorld(zone: string, wx: number, wy: number): boolean {
    this.ensureLoaded(zone);
    const RADIUS = fogRadius();
    let changed = false;
    const step = TILE_WORLD;
    for (let dy = -RADIUS; dy <= RADIUS; dy += step) {
      for (let dx = -RADIUS; dx <= RADIUS; dx += step) {
        const px = wx + dx;
        const py = wy + dy;
        if (Math.hypot(dx, dy) > RADIUS) continue;
        const { cx, cy, ti, tj } = this.chunkTileAtWorld(px, py);
        if (this.setChunkTile(zone, cx, cy, ti, tj, true)) changed = true;
      }
    }
    if (changed) this.dirty = true;
    return changed;
  }

  isWorldRevealed(zone: string, wx: number, wy: number): boolean {
    this.ensureLoaded(zone);
    const { cx, cy, ti, tj } = this.chunkTileAtWorld(wx, wy);
    return this.isChunkTileRevealed(zone, cx, cy, ti, tj);
  }

  /** Avslöjar runt (x, y) i lokala koordinater (legacy). */
  reveal(zone: string, x: number, y: number): boolean {
    if (this.worldAnchored) return this.revealWorld(zone, x, y);
    const { CELL, GRID, HALF } = FogOfWar;
    const RADIUS = fogRadius();
    const F = this.grid(zone);
    const saved = this.loader(zone);
    if (saved && saved[0] !== SAVE_V2 && saved[0] !== SAVE_V3 && F.cells.every((c) => c === 0)) {
      F.cells.set(saved.subarray(0, F.cells.length));
    }
    const g = F.cells;
    const fx = (x + HALF) / CELL;
    const fy = (y + HALF) / CELL;
    const cx = Math.floor(fx);
    const cy = Math.floor(fy);
    const r = Math.ceil(RADIUS / CELL);
    let changed = false;
    for (let j = cy - r; j <= cy + r; j++) {
      for (let i = cx - r; i <= cx + r; i++) {
        if (i < 0 || j < 0 || i >= GRID || j >= GRID || g[j * GRID + i]) continue;
        if (Math.hypot(i + 0.5 - fx, j + 0.5 - fy) * CELL <= RADIUS) {
          g[j * GRID + i] = 1;
          changed = true;
        }
      }
    }
    if (changed) {
      F.ver++;
      this.dirty = true;
    }
    return changed;
  }

  revealSliding(zone: string, x: number, y: number): boolean {
    return this.reveal(zone, x, y);
  }

  isRevealed(zone: string, x: number, y: number): boolean {
    if (this.worldAnchored) return this.isWorldRevealed(zone, x, y);
    const { CELL, GRID, HALF } = FogOfWar;
    const i = Math.floor((x + HALF) / CELL);
    const j = Math.floor((y + HALF) / CELL);
    return i >= 0 && j >= 0 && i < GRID && j < GRID && this.grid(zone).cells[j * GRID + i] === 1;
  }

  /** Rita mörker över okända celler inom kartans världsbounds (stor skog). */
  drawWorldFogOverlay(
    c: CanvasRenderingContext2D,
    zone: string,
    wx0: number,
    wy0: number,
    wx1: number,
    wy1: number,
    project: (wx: number, wy: number) => { x: number; y: number },
    color: Rgba,
  ): void {
    this.ensureLoaded(zone);
    const { CELL } = FogOfWar;
    const [r, g, b, a] = color;
    c.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
    const i0 = Math.floor(wx0 / CELL);
    const j0 = Math.floor(wy0 / CELL);
    const i1 = Math.ceil(wx1 / CELL);
    const j1 = Math.ceil(wy1 / CELL);
    const s = project(0, CELL).x - project(0, 0).x;
    const cellPx = Math.max(1, Math.abs(s));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const wx = (i + 0.5) * CELL;
        const wy = (j + 0.5) * CELL;
        if (this.isWorldRevealed(zone, wx, wy)) continue;
        const p = project(i * CELL, j * CELL);
        c.fillRect(p.x, p.y, cellPx, cellPx);
      }
    }
  }

  encodeZone(zone: string): Uint8Array | null {
    if (!this.worldAnchored) return this.grid(zone).cells;
    const chunks: { cx: number; cy: number; mask: Uint8Array }[] = [];
    for (const [key, mask] of this.chunkFog) {
      if (!key.startsWith(`${zone}|`)) continue;
      let any = false;
      for (const b of mask) {
        if (b !== 0) {
          any = true;
          break;
        }
      }
      if (!any) continue;
      const coords = key.slice(zone.length + 1).split(',');
      const cx = Number(coords[0]);
      const cy = Number(coords[1]);
      if (Number.isNaN(cx) || Number.isNaN(cy)) continue;
      chunks.push({ cx, cy, mask });
    }
    const size = 1 + chunks.length * (4 + CHUNK_FOG_BYTES);
    if (size > MAX_FOG_SAVE_BYTES) {
      this.storageFull = true;
      return null;
    }
    const out = new Uint8Array(size);
    out[0] = SAVE_V3;
    const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
    let o = 1;
    for (const ch of chunks) {
      view.setInt16(o, ch.cx, true);
      view.setInt16(o + 2, ch.cy, true);
      o += 4;
      out.set(ch.mask, o);
      o += CHUNK_FOG_BYTES;
    }
    return out;
  }

  get isDirty(): boolean {
    return this.dirty;
  }

  takeDirty(): Array<[string, Uint8Array]> {
    if (!this.dirty) return [];
    let keepDirty = false;
    if (this.worldAnchored) {
      const zones = new Set<string>();
      for (const key of this.chunkFog.keys()) zones.add(key.split('|')[0] ?? 'forest');
      const out: Array<[string, Uint8Array]> = [];
      for (const z of zones) {
        const enc = this.encodeZone(z);
        if (enc) out.push([z, enc]);
        else keepDirty = true;
      }
      this.dirty = keepDirty;
      return out;
    }
    this.dirty = false;
    return [...this.grids].map(([k, g]) => [k, g.cells]);
  }
}
