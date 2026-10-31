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
const SECTOR = 32;

/** Fog of war: lokalt rutnät (legacy skog) eller världsförankrade sektorer (stor skog). */
export class FogOfWar {
  static readonly CELL = 2;
  static readonly RADIUS = 11;
  static readonly GRID = 64;
  static readonly HALF = (FogOfWar.GRID * FogOfWar.CELL) / 2;
  private readonly grids = new Map<string, FogGrid>();
  private readonly worldCells = new Map<string, Uint8Array>();
  private worldAnchored = false;
  private dirty = false;

  constructor(private readonly loader: (zone: string) => Uint8Array | null = () => null) {}

  setWorldAnchored(on: boolean): void {
    this.worldAnchored = on;
  }

  isWorldAnchored(): boolean {
    return this.worldAnchored;
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

  private sectorKey(zone: string, sx: number, sy: number): string {
    return `${zone}|${sx},${sy}`;
  }

  private sectorFor(zone: string, ci: number, cj: number): { sector: Uint8Array; lx: number; ly: number } {
    const sx = Math.floor(ci / SECTOR);
    const sy = Math.floor(cj / SECTOR);
    const key = this.sectorKey(zone, sx, sy);
    let sector = this.worldCells.get(key);
    if (!sector) {
      sector = new Uint8Array(SECTOR * SECTOR);
      this.worldCells.set(key, sector);
    }
    const lx = ((ci % SECTOR) + SECTOR) % SECTOR;
    const ly = ((cj % SECTOR) + SECTOR) % SECTOR;
    return { sector, lx, ly };
  }

  private loadBlob(zone: string, saved: Uint8Array | null): void {
    if (!saved || saved.length === 0) return;
    if (saved[0] === SAVE_V2) {
      let o = 1;
      while (o + 4 < saved.length) {
        const sx = (saved[o]! << 8) | saved[o + 1]!;
        const sy = (saved[o + 2]! << 8) | saved[o + 3]!;
        o += 4;
        const sector = new Uint8Array(SECTOR * SECTOR);
        sector.set(saved.subarray(o, o + SECTOR * SECTOR));
        o += SECTOR * SECTOR;
        this.worldCells.set(this.sectorKey(zone, sx, sy), sector);
      }
      return;
    }
    if (saved.length >= FogOfWar.GRID * FogOfWar.GRID) {
      for (let j = 0; j < FogOfWar.GRID; j++) {
        for (let i = 0; i < FogOfWar.GRID; i++) {
          if (!saved[j * FogOfWar.GRID + i]) continue;
          const wx = (i - FogOfWar.GRID / 2) * FogOfWar.CELL;
          const wy = (j - FogOfWar.GRID / 2) * FogOfWar.CELL;
          this.setWorldCell(zone, wx, wy, true);
        }
      }
    }
  }

  ensureLoaded(zone: string): void {
    if (this.worldCells.size > 0 || this.grids.get(zone)?.cells.some((c) => c)) return;
    this.loadBlob(zone, this.loader(zone));
  }

  private setWorldCell(zone: string, wx: number, wy: number, on: boolean): boolean {
    const ci = Math.floor(wx / FogOfWar.CELL);
    const cj = Math.floor(wy / FogOfWar.CELL);
    const { sector, lx, ly } = this.sectorFor(zone, ci, cj);
    const idx = ly * SECTOR + lx;
    if (sector[idx] === (on ? 1 : 0)) return false;
    sector[idx] = on ? 1 : 0;
    return true;
  }

  revealWorld(zone: string, wx: number, wy: number): boolean {
    this.ensureLoaded(zone);
    const { CELL, RADIUS } = FogOfWar;
    let changed = false;
    const r = Math.ceil(RADIUS / CELL);
    const cx = Math.floor(wx / CELL);
    const cy = Math.floor(wy / CELL);
    for (let j = cy - r; j <= cy + r; j++) {
      for (let i = cx - r; i <= cx + r; i++) {
        const wx2 = (i + 0.5) * CELL;
        const wy2 = (j + 0.5) * CELL;
        if (Math.hypot(wx2 - wx, wy2 - wy) > RADIUS) continue;
        if (this.setWorldCell(zone, wx2, wy2, true)) changed = true;
      }
    }
    if (changed) this.dirty = true;
    return changed;
  }

  isWorldRevealed(zone: string, wx: number, wy: number): boolean {
    this.ensureLoaded(zone);
    const ci = Math.floor(wx / FogOfWar.CELL);
    const cj = Math.floor(wy / FogOfWar.CELL);
    const { sector, lx, ly } = this.sectorFor(zone, ci, cj);
    return sector[ly * SECTOR + lx] === 1;
  }

  /** Avslöjar runt (x, y) i lokala koordinater (legacy). */
  reveal(zone: string, x: number, y: number): boolean {
    if (this.worldAnchored) return this.revealWorld(zone, x, y);
    const { CELL, RADIUS, GRID, HALF } = FogOfWar;
    const F = this.grid(zone);
    const saved = this.loader(zone);
    if (saved && saved[0] !== SAVE_V2 && F.cells.every((c) => c === 0)) {
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

  encodeZone(zone: string): Uint8Array {
    if (!this.worldAnchored) return this.grid(zone).cells;
    const parts: number[] = [SAVE_V2];
    for (const [key, sector] of this.worldCells) {
      if (!key.startsWith(`${zone}|`)) continue;
      const coords = key.slice(zone.length + 1).split(',');
      const sx = Number(coords[0]);
      const sy = Number(coords[1]);
      if (Number.isNaN(sx) || Number.isNaN(sy)) continue;
      parts.push((sx >> 8) & 255, sx & 255, (sy >> 8) & 255, sy & 255);
      parts.push(...sector);
    }
    return Uint8Array.from(parts);
  }

  get isDirty(): boolean {
    return this.dirty;
  }

  takeDirty(): Array<[string, Uint8Array]> {
    if (!this.dirty) return [];
    this.dirty = false;
    if (this.worldAnchored) {
      const zones = new Set<string>();
      for (const key of this.worldCells.keys()) zones.add(key.split('|')[0] ?? 'forest');
      return [...zones].map((z) => [z, this.encodeZone(z)]);
    }
    return [...this.grids].map(([k, g]) => [k, g.cells]);
  }
}
