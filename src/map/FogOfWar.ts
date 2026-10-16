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

/** Fog of war för aktuell hjälte: 64x64 rutor à 2 enheter (täcker ±64), avslöjas i radie 11 runt hjälten. */
export class FogOfWar {
  static readonly CELL = 2;
  static readonly RADIUS = 11;
  static readonly GRID = 64;
  static readonly HALF = (FogOfWar.GRID * FogOfWar.CELL) / 2;
  private readonly grids = new Map<string, FogGrid>();
  private dirty = false;

  /** loader hämtar sparad fog för zonen (eller null). */
  constructor(private readonly loader: (zone: string) => Uint8Array | null = () => null) {}

  grid(zone: string): FogGrid {
    let g = this.grids.get(zone);
    if (!g) {
      const cells = new Uint8Array(FogOfWar.GRID * FogOfWar.GRID);
      const saved = this.loader(zone);
      if (saved) cells.set(saved.subarray(0, cells.length));
      g = new FogGrid(cells);
      this.grids.set(zone, g);
    }
    return g;
  }

  /** Avslöjar runt (x, y). Returnerar true om något ändrades. */
  reveal(zone: string, x: number, y: number): boolean {
    const { CELL, RADIUS, GRID, HALF } = FogOfWar;
    const F = this.grid(zone);
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

  isRevealed(zone: string, x: number, y: number): boolean {
    const { CELL, GRID, HALF } = FogOfWar;
    const i = Math.floor((x + HALF) / CELL);
    const j = Math.floor((y + HALF) / CELL);
    return i >= 0 && j >= 0 && i < GRID && j < GRID && this.grid(zone).cells[j * GRID + i] === 1;
  }

  get isDirty(): boolean {
    return this.dirty;
  }

  /** Lämnar ut alla rutnät och nollställer dirty (för sparning). */
  takeDirty(): Array<[string, Uint8Array]> {
    if (!this.dirty) return [];
    this.dirty = false;
    return [...this.grids].map(([k, g]) => [k, g.cells]);
  }
}
