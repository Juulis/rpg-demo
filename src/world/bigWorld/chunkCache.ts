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

function cacheKey(worldSeed: number, gameSeed: number, cx: number, cy: number): string {
  return `${worldSeed}|${gameSeed}|${cx}|${cy}`;
}

/**
 * LRU-liknande cache: syncNear släpper chunkar utanför keepRadius och cap:ar storlek.
 * Nyckeln inkluderar world_seed + game_seed så layout och spawns hålls isär.
 */
export class ChunkWorldCache {
  private readonly map = new Map<string, ChunkWorldData>();
  private readonly order: string[] = [];
  private heroCx = 0;
  private heroCy = 0;
  private activeWorldSeed: number | null = null;
  private activeGameSeed: number | null = null;
  private keepSet = new Set<string>();

  constructor(private readonly opts: ChunkCacheOptions = DEFAULT_OPTS) {
    assertCacheOptions(opts);
  }

  size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
    this.order.length = 0;
    this.activeWorldSeed = null;
    this.activeGameSeed = null;
    this.keepSet.clear();
  }

  private ensureSeeds(worldSeed: number, gameSeed: number): void {
    if (
      (this.activeWorldSeed !== null && this.activeWorldSeed !== worldSeed) ||
      (this.activeGameSeed !== null && this.activeGameSeed !== gameSeed)
    ) {
      this.clear();
    }
    this.activeWorldSeed = worldSeed;
    this.activeGameSeed = gameSeed;
  }

  get(worldSeed: number, gameSeed: number, cx: number, cy: number): ChunkWorldData {
    this.ensureSeeds(worldSeed, gameSeed);
    const key = cacheKey(worldSeed, gameSeed, cx, cy);
    const hit = this.map.get(key);
    const expectedSeed = chunkWorldSeed(worldSeed, cx, cy);
    if (hit && hit.chunkSeed === expectedSeed) {
      this.touch(key);
      return hit;
    }
    while (this.map.size >= this.opts.maxEntries) {
      if (!this.evictOne(key)) break;
    }
    const data = generateChunkWorldData(worldSeed, gameSeed, cx, cy);
    this.store(key, data);
    while (this.map.size > this.opts.maxEntries) {
      if (!this.evictOne(key)) break;
    }
    return data;
  }

  syncNear(worldSeed: number, gameSeed: number, heroCx: number, heroCy: number): void {
    this.ensureSeeds(worldSeed, gameSeed);
    this.heroCx = heroCx;
    this.heroCy = heroCy;
    const r = this.opts.keepRadius;
    const keep = new Set<string>();
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const cx = heroCx + dx;
        const cy = heroCy + dy;
        const key = cacheKey(worldSeed, gameSeed, cx, cy);
        keep.add(key);
        const existing = this.map.get(key);
        const expectedSeed = chunkWorldSeed(worldSeed, cx, cy);
        if (existing && existing.chunkSeed === expectedSeed) {
          this.touch(key);
        } else {
          while (this.map.size >= this.opts.maxEntries) {
            if (!this.evictOne(key)) break;
          }
          this.store(key, generateChunkWorldData(worldSeed, gameSeed, cx, cy));
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
      if (!this.evictOne()) break;
    }
  }

  /** Släpper en chunk; undvik excludeKey om möjligt, evicta ur keep vid behov. */
  private evictOne(excludeKey?: string): boolean {
    let drop = this.pickEvictKey(false, excludeKey);
    if (!drop) drop = this.pickEvictKey(true, excludeKey);
    if (!drop) return false;
    this.map.delete(drop);
    const i = this.order.indexOf(drop);
    if (i >= 0) this.order.splice(i, 1);
    return true;
  }

  private pickEvictKey(allowKeep: boolean, excludeKey?: string): string | undefined {
    let best: string | undefined;
    let bestD = -1;
    for (const key of this.map.keys()) {
      if (key === excludeKey) continue;
      if (!allowKeep && this.keepSet.has(key)) continue;
      const parts = key.split('|');
      const cx = Number(parts[2]);
      const cy = Number(parts[3]);
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
