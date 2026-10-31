import { chunkWorldSeed, generateChunkWorldData, type ChunkWorldData } from './worldGenerator';

export interface ChunkCacheOptions {
  /** Max antal chunkar i minnet (streaming). */
  maxEntries: number;
  /** Chebyshev-radie runt hjälten som hålls laddad. */
  keepRadius: number;
}

export function minChunkCacheEntries(keepRadius: number): number {
  const side = 2 * keepRadius + 1;
  return side * side;
}

function assertCacheOptions(opts: ChunkCacheOptions): void {
  const min = minChunkCacheEntries(opts.keepRadius);
  if (opts.maxEntries < min) {
    throw new Error(`ChunkWorldCache: maxEntries ${opts.maxEntries} < (${2 * opts.keepRadius + 1})^2 = ${min}`);
  }
}

const DEFAULT_OPTS: ChunkCacheOptions = { maxEntries: 49, keepRadius: 3 };

function cacheKey(gameSeed: number, cx: number, cy: number): string {
  return `${gameSeed}|${cx}|${cy}`;
}

/**
 * LRU-liknande cache: syncNear släpper chunkar utanför keepRadius och cap:ar storlek.
 * Nyckeln inkluderar gameSeed så olika sparfiler aldrig delar D2-rullningar.
 */
export class ChunkWorldCache {
  private readonly map = new Map<string, ChunkWorldData>();
  private readonly order: string[] = [];
  private heroCx = 0;
  private heroCy = 0;
  private activeSeed: number | null = null;
  private keepSet = new Set<string>();
  /** Senast laddade nyckel via get() — evictas inte direkt (get utan syncNear). */
  private pinnedKey: string | null = null;

  constructor(private readonly opts: ChunkCacheOptions = DEFAULT_OPTS) {
    assertCacheOptions(opts);
  }

  size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
    this.order.length = 0;
    this.activeSeed = null;
    this.keepSet.clear();
    this.pinnedKey = null;
  }

  private ensureSeed(gameSeed: number): void {
    if (this.activeSeed !== null && this.activeSeed !== gameSeed) this.clear();
    this.activeSeed = gameSeed;
  }

  get(gameSeed: number, cx: number, cy: number): ChunkWorldData {
    this.ensureSeed(gameSeed);
    const key = cacheKey(gameSeed, cx, cy);
    const hit = this.map.get(key);
    const expectedSeed = chunkWorldSeed(gameSeed, cx, cy);
    if (hit && hit.chunkSeed === expectedSeed) {
      this.touch(key);
      return hit;
    }
    const data = generateChunkWorldData(gameSeed, cx, cy);
    this.pinnedKey = key;
    this.store(key, data);
    this.evictIfNeeded();
    return data;
  }

  syncNear(gameSeed: number, heroCx: number, heroCy: number): void {
    this.ensureSeed(gameSeed);
    this.heroCx = heroCx;
    this.heroCy = heroCy;
    const r = this.opts.keepRadius;
    const keep = new Set<string>();
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const cx = heroCx + dx;
        const cy = heroCy + dy;
        const key = cacheKey(gameSeed, cx, cy);
        keep.add(key);
        const existing = this.map.get(key);
        const expectedSeed = chunkWorldSeed(gameSeed, cx, cy);
        if (existing && existing.chunkSeed === expectedSeed) {
          this.touch(key);
        } else {
          this.store(key, generateChunkWorldData(gameSeed, cx, cy));
        }
      }
    }
    this.keepSet = keep;
    for (const key of [...this.map.keys()]) {
      if (!keep.has(key)) {
        this.map.delete(key);
        const i = this.order.indexOf(key);
        if (i >= 0) this.order.splice(i, 1);
      }
    }
    this.evictIfNeeded();
  }

  private store(key: string, data: ChunkWorldData): void {
    this.map.set(key, data);
    this.touch(key);
  }

  private touch(key: string): void {
    const i = this.order.indexOf(key);
    if (i >= 0) this.order.splice(i, 1);
    this.order.push(key);
  }

  private evictIfNeeded(): void {
    while (this.map.size > this.opts.maxEntries) {
      const drop = this.farthestEvictableKey();
      if (!drop) break;
      this.map.delete(drop);
      const i = this.order.indexOf(drop);
      if (i >= 0) this.order.splice(i, 1);
    }
  }

  private farthestEvictableKey(): string | undefined {
    let best: string | undefined;
    let bestD = -1;
    for (const key of this.map.keys()) {
      if (this.keepSet.has(key)) continue;
      if (key === this.pinnedKey) continue;
      const parts = key.split('|');
      const cx = Number(parts[1]);
      const cy = Number(parts[2]);
      if (Number.isNaN(cx) || Number.isNaN(cy)) continue;
      const d = Math.max(Math.abs(cx - this.heroCx), Math.abs(cy - this.heroCy));
      if (d > bestD) {
        bestD = d;
        best = key;
      }
    }
    return best;
  }
}
