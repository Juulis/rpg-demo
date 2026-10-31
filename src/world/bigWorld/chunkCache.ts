import { generateChunkWorldData, type ChunkWorldData } from './worldGenerator';

export interface ChunkCacheOptions {
  /** Max antal chunkar i minnet (streaming). */
  maxEntries: number;
  /** Chebyshev-radie runt hjälten som hålls laddad. */
  keepRadius: number;
}

const DEFAULT_OPTS: ChunkCacheOptions = { maxEntries: 48, keepRadius: 3 };

/**
 * LRU-liknande cache: syncNear släpper chunkar utanför keepRadius och cap:ar storlek.
 * Används av streaming (PR 2) och minnestester.
 */
export class ChunkWorldCache {
  private readonly map = new Map<string, ChunkWorldData>();
  private readonly order: string[] = [];
  private heroCx = 0;
  private heroCy = 0;

  constructor(private readonly opts: ChunkCacheOptions = DEFAULT_OPTS) {}

  size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
    this.order.length = 0;
  }

  get(gameSeed: number, cx: number, cy: number): ChunkWorldData {
    const key = `${cx},${cy}`;
    const hit = this.map.get(key);
    if (hit) {
      this.touch(key);
      return hit;
    }
    const data = generateChunkWorldData(gameSeed, cx, cy);
    this.store(key, data);
    this.evictIfNeeded();
    return data;
  }

  syncNear(gameSeed: number, heroCx: number, heroCy: number): void {
    this.heroCx = heroCx;
    this.heroCy = heroCy;
    const r = this.opts.keepRadius;
    const keep = new Set<string>();
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const cx = heroCx + dx;
        const cy = heroCy + dy;
        const key = `${cx},${cy}`;
        keep.add(key);
        if (!this.map.has(key)) {
          this.store(key, generateChunkWorldData(gameSeed, cx, cy));
        } else {
          this.touch(key);
        }
      }
    }
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
      const drop = this.farthestKey() ?? this.order[0];
      if (!drop) break;
      this.map.delete(drop);
      const i = this.order.indexOf(drop);
      if (i >= 0) this.order.splice(i, 1);
    }
  }

  private farthestKey(): string | undefined {
    let best: string | undefined;
    let bestD = -1;
    for (const key of this.map.keys()) {
      const parts = key.split(',').map(Number);
      const cx = parts[0];
      const cy = parts[1];
      if (cx === undefined || cy === undefined) continue;
      const d = Math.max(Math.abs(cx - this.heroCx), Math.abs(cy - this.heroCy));
      if (d > bestD) {
        bestD = d;
        best = key;
      }
    }
    return best;
  }
}
