import { Container, Sprite } from 'pixi.js';
import { Rng } from '../../core/Rng';
import type { Vec2 } from '../../core/GameContext';
import type { AssetStore, DecorId } from '../../render/Assets';
import { Iso, TILE_WORLD } from '../../render/Iso';
import { ChunkWorldCache } from './chunkCache';
import type { ChunkWorldData } from './worldGenerator';
import { chunkTileCount, chunkWorldSpan, worldToChunk } from './bigWorldCoords';
import { BIG_WORLD_CACHE_KEEP_RADIUS } from './bigWorldConfig';

const DECOR_ALIASES: Record<string, DecorId> = {
  gran: 'gran',
  björk: 'gran',
  runsten: 'runsten',
  vägrös: 'buske',
  kolmila: 'stubbe',
  stubbe: 'stubbe',
};

/** Chunkad mark/dekor från varld_stor-generatorn (world_seed = session.seed). */
export class BigWorldStreamGround extends Container {
  private readonly visuals = new Map<string, Container>();
  private readonly cache: ChunkWorldCache;
  private lastCx = NaN;
  private lastCy = NaN;
  private activeSeed = 0;

  constructor(
    private readonly assets: AssetStore,
    cache?: ChunkWorldCache,
  ) {
    super();
    const keep = BIG_WORLD_CACHE_KEEP_RADIUS;
    const side = 2 * keep + 1;
    this.cache = cache ?? new ChunkWorldCache({ maxEntries: side * side, keepRadius: keep });
  }

  get chunkCache(): ChunkWorldCache {
    return this.cache;
  }

  sync(hero: Vec2, gameSeed: number): void {
    const { cx, cy } = worldToChunk(hero.x, hero.y);
    if (cx === this.lastCx && cy === this.lastCy && gameSeed === this.activeSeed) return;
    this.lastCx = cx;
    this.lastCy = cy;
    this.activeSeed = gameSeed;
    this.cache.syncNear(gameSeed, cx, cy);
    const r = BIG_WORLD_CACHE_KEEP_RADIUS;
    const keep = new Set<string>();
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const k = `${cx + dx},${cy + dy}`;
        keep.add(k);
        if (!this.visuals.has(k)) {
          const data = this.cache.get(gameSeed, cx + dx, cy + dy);
          this.visuals.set(k, this.buildChunkVisual(data));
        }
      }
    }
    for (const [key, layer] of this.visuals) {
      if (!keep.has(key)) {
        layer.destroy({ children: true });
        this.visuals.delete(key);
      }
    }
    for (const layer of this.visuals.values()) {
      if (!layer.parent) this.addChild(layer);
    }
  }

  private buildChunkVisual(data: ChunkWorldData): Container {
    const layer = new Container();
    const tiles = chunkTileCount();
    const span = chunkWorldSpan();
    const rng = new Rng(data.chunkSeed);
    const pool = data.tilePool.length ? data.tilePool : ['gras_1'];
    for (let ti = 0; ti < tiles; ti++) {
      for (let tj = 0; tj < tiles; tj++) {
        const tileId = rng.pick(pool);
        const tex = this.assets.tiles.get(tileId);
        if (!tex) continue;
        const wx = data.cx * span + ti * TILE_WORLD;
        const wy = data.cy * span + tj * TILE_WORLD;
        const s = new Sprite(tex);
        s.anchor.set(0.5, 0.85);
        const p = Iso.worldToScreen(wx, wy);
        s.position.set(p.x, p.y);
        s.zIndex = wx + wy;
        layer.addChild(s);
      }
    }
    if (data.decorPool.length && !data.safe) {
      const decorEvery = 11;
      for (let ti = 0; ti < tiles; ti += decorEvery) {
        for (let tj = 0; tj < tiles; tj += decorEvery) {
          if (rng.next() > 0.55) continue;
          const raw = rng.pick(data.decorPool);
          const decorId = DECOR_ALIASES[raw] ?? (this.assets.decor.has(raw as DecorId) ? (raw as DecorId) : null);
          if (!decorId) continue;
          const d = this.assets.decor.get(decorId);
          if (!d?.tex) continue;
          const wx = data.cx * span + (ti + rng.float(0, decorEvery - 1)) * TILE_WORLD;
          const wy = data.cy * span + (tj + rng.float(0, decorEvery - 1)) * TILE_WORLD;
          const s = new Sprite(d.tex);
          s.anchor.set(d.size.anchor[0] / d.size.w, d.size.anchor[1] / d.size.h);
          s.scale.set(0.35 + rng.next() * 0.2, 0.35 + rng.next() * 0.2);
          const p = Iso.worldToScreen(wx, wy);
          s.position.set(p.x, p.y);
          s.zIndex = wx + wy + 0.5;
          layer.addChild(s);
        }
      }
    }
    return layer;
  }
}
