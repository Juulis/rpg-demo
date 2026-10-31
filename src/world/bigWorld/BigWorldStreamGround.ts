import type { Container, Renderer } from 'pixi.js';
import { Container as PixiContainer, RenderTexture, Sprite } from 'pixi.js';
import { Rng } from '../../core/Rng';
import type { Vec2, Collider } from '../../core/GameContext';
import type { AssetStore, DecorId } from '../../render/Assets';
import { Iso, TILE_WORLD } from '../../render/Iso';
import { ChunkWorldCache } from './chunkCache';
import type { ChunkWorldData } from './worldGenerator';
import { chunkTileCount, chunkWorldSpan, worldToChunk } from './bigWorldCoords';
import { BIG_WORLD_CACHE_KEEP_RADIUS, BIG_WORLD_GROUND_BUILD_BUDGET_MS, BIG_WORLD_RENDER_RADIUS } from './bigWorldConfig';
import type { Zone } from '../Zone';

const DECOR_ALIASES: Record<string, DecorId> = {
  gran: 'gran',
  björk: 'gran',
  runsten: 'runsten',
  vägrös: 'buske',
  kolmila: 'stubbe',
  stubbe: 'stubbe',
};

export interface BigWorldStreamScene {
  objects: Container;
  zone: Zone;
}

interface DecorEntry {
  sprite: Sprite;
  collider: Collider | null;
}

interface ChunkVisual {
  root: PixiContainer;
  data: ChunkWorldData;
  decor: DecorEntry[];
  decorDone: boolean;
  pending?: {
    layer: PixiContainer;
    ti: number;
    tiles: number;
  };
}

function visualKey(worldSeed: number, gameSeed: number, cx: number, cy: number): string {
  return `${worldSeed}|${gameSeed}|${cx}|${cy}`;
}

function countPixiDisplayObjects(root: PixiContainer): number {
  let n = 0;
  const walk = (c: PixiContainer) => {
    for (const ch of c.children) {
      n++;
      if (ch instanceof PixiContainer) walk(ch);
    }
  };
  walk(root);
  return n;
}

/**
 * Chunkad mark från varld_stor (world_seed layout, game_seed spawns i cache).
 * Iso-sortering mellan chunkar: dekorsprites ligger i zone.objects (sortableChildren);
 * mark bakas per chunk till en sprite (cross-chunk tile z-fights dokumenterade i #85).
 */
export class BigWorldStreamGround extends PixiContainer {
  private readonly visuals = new Map<string, ChunkVisual>();
  private readonly cache: ChunkWorldCache;
  private lastCx = NaN;
  private lastCy = NaN;
  private activeWorldSeed = 0;
  private activeGameSeed = 0;
  private scene: BigWorldStreamScene | null = null;

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

  countGroundDisplayObjects(): number {
    return countPixiDisplayObjects(this);
  }

  sync(hero: Vec2, worldSeed: number, gameSeed: number, scene: BigWorldStreamScene | null, renderer: Renderer | null): void {
    this.scene = scene;
    const { cx, cy } = worldToChunk(hero.x, hero.y);
    const movedChunk = cx !== this.lastCx || cy !== this.lastCy;
    const seedChanged = worldSeed !== this.activeWorldSeed || gameSeed !== this.activeGameSeed;
    if (seedChanged) {
      this.dropAllVisuals();
      this.activeWorldSeed = worldSeed;
      this.activeGameSeed = gameSeed;
      this.lastCx = NaN;
      this.lastCy = NaN;
    }
    if (!movedChunk && !seedChanged && !this.pendingBuild()) return;
    this.lastCx = cx;
    this.lastCy = cy;
    this.cache.syncNear(worldSeed, gameSeed, cx, cy);

    const rr = BIG_WORLD_RENDER_RADIUS;
    const keep = new Set<string>();
    for (let dx = -rr; dx <= rr; dx++) {
      for (let dy = -rr; dy <= rr; dy++) {
        const k = visualKey(worldSeed, gameSeed, cx + dx, cy + dy);
        keep.add(k);
        if (!this.visuals.has(k)) {
          const data = this.cache.get(worldSeed, gameSeed, cx + dx, cy + dy);
          this.startChunkVisual(k, data);
        }
      }
    }
    for (const [key, vis] of this.visuals) {
      if (!keep.has(key)) this.dropChunkVisual(key, vis);
    }
    for (const vis of this.visuals.values()) {
      if (!vis.root.parent) this.addChild(vis.root);
    }
    this.tickBuildBudget(renderer);
  }

  private pendingBuild(): boolean {
    for (const v of this.visuals.values()) {
      if (v.pending) return true;
    }
    return false;
  }

  private dropAllVisuals(): void {
    for (const [key, vis] of this.visuals) this.dropChunkVisual(key, vis);
  }

  private dropChunkVisual(key: string, vis: ChunkVisual): void {
    if (this.scene) {
      for (const d of vis.decor) {
        d.sprite.parent?.removeChild(d.sprite);
        d.sprite.destroy();
        if (d.collider) {
          const i = this.scene.zone.colliders.indexOf(d.collider);
          if (i >= 0) this.scene.zone.colliders.splice(i, 1);
        }
      }
    }
    vis.pending?.layer.destroy({ children: true });
    vis.root.destroy({ children: true });
    this.visuals.delete(key);
  }

  private startChunkVisual(key: string, data: ChunkWorldData): void {
    const root = new PixiContainer();
    const layer = new PixiContainer();
    root.addChild(layer);
    const tiles = chunkTileCount();
    this.visuals.set(key, {
      root,
      data,
      decor: [],
      decorDone: false,
      pending: { layer, ti: 0, tiles },
    });
  }

  private spawnDecorForChunk(vis: ChunkVisual): void {
    if (vis.decorDone || !this.scene) return;
    const data = vis.data;
    if (data.decorPool.length === 0 || data.safe) {
      vis.decorDone = true;
      return;
    }
    const rng = new Rng(data.chunkSeed);
    const span = chunkWorldSpan();
    const tiles = chunkTileCount();
    const pool = data.tilePool.length ? data.tilePool : ['gras_1'];
    for (let ti = 0; ti < tiles; ti++) {
      for (let tj = 0; tj < tiles; tj++) rng.pick(pool);
    }
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
        this.scene.objects.addChild(s);
        const collider: Collider | null =
          decorId === 'gran' ? { x: wx, y: wy, r: 0.9 } : decorId === 'stenhog' || decorId === 'stubbe' ? { x: wx, y: wy, r: 0.8 } : null;
        if (collider) this.scene.zone.colliders.push(collider);
        vis.decor.push({ sprite: s, collider });
      }
    }
    vis.decorDone = true;
  }

  private tickBuildBudget(renderer: Renderer | null): void {
    const t0 = performance.now();
    while (performance.now() - t0 < BIG_WORLD_GROUND_BUILD_BUDGET_MS) {
      let progressed = false;
      for (const vis of this.visuals.values()) {
        if (!vis.pending) continue;
        progressed = this.buildTilesStep(vis) || progressed;
        if (performance.now() - t0 >= BIG_WORLD_GROUND_BUILD_BUDGET_MS) break;
      }
      if (!progressed) break;
    }
    if (!renderer) return;
    for (const vis of this.visuals.values()) {
      const p = vis.pending;
      if (!p || p.ti < p.tiles * p.tiles) continue;
      this.bakeChunk(vis, renderer);
      this.spawnDecorForChunk(vis);
    }
  }

  private buildTilesStep(vis: ChunkVisual): boolean {
    const p = vis.pending;
    if (!p) return false;
    const { data, layer, tiles } = { data: vis.data, layer: p.layer, tiles: p.tiles };
    const span = chunkWorldSpan();
    const pool = data.tilePool.length ? data.tilePool : ['gras_1'];
    const rng = new Rng(data.chunkSeed);
    for (let i = 0; i < p.ti; i++) rng.pick(pool);
    const batch = 512;
    let built = 0;
    while (p.ti < tiles * tiles && built < batch) {
      const ti = Math.floor(p.ti / tiles);
      const tj = p.ti % tiles;
      const tileId = rng.pick(pool);
      const tex = this.assets.tiles.get(tileId);
      if (tex) {
        const wx = data.cx * span + ti * TILE_WORLD;
        const wy = data.cy * span + tj * TILE_WORLD;
        const s = new Sprite(tex);
        s.anchor.set(0.5, 0.85);
        const pos = Iso.worldToScreen(wx, wy);
        s.position.set(pos.x, pos.y);
        s.zIndex = wx + wy;
        layer.addChild(s);
      }
      p.ti++;
      built++;
    }
    return built > 0;
  }

  private bakeChunk(vis: ChunkVisual, renderer: Renderer): void {
    const p = vis.pending;
    if (!p) return;
    const bounds = p.layer.getBounds();
    const w = Math.max(1, Math.ceil(bounds.width));
    const h = Math.max(1, Math.ceil(bounds.height));
    const rt = RenderTexture.create({ width: w, height: h });
    renderer.render({ container: p.layer, target: rt, clear: true });
    p.layer.destroy({ children: true });
    const baked = new Sprite(rt);
    baked.position.set(bounds.x, bounds.y);
    vis.root.addChild(baked);
    vis.pending = undefined;
  }
}
