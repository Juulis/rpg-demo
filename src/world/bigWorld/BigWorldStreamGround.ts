import type { Container, Renderer } from 'pixi.js';
import { Container as PixiContainer, Rectangle, RenderTexture, Sprite } from 'pixi.js';
import { Rng } from '../../core/Rng';
import type { Vec2, Collider } from '../../core/GameContext';
import type { AssetStore, DecorId } from '../../render/Assets';
import { Iso, TILE_WORLD } from '../../render/Iso';
import { ChunkWorldCache } from './chunkCache';
import type { ChunkWorldData } from './worldGenerator';
import { chunkTileCount, chunkWorldSpan, worldToChunk } from './bigWorldCoords';
import {
  BIG_WORLD_CACHE_KEEP_RADIUS,
  BIG_WORLD_GROUND_BAKE_SCALE,
  BIG_WORLD_GROUND_BUILD_BUDGET_MS,
  BIG_WORLD_GROUND_MAX_BAKES_PER_FRAME,
  BIG_WORLD_GROUND_PATCH_TILES,
  BIG_WORLD_RENDER_RADIUS,
  BIG_WORLD_SKY_CLEAR_COLOR,
} from './bigWorldConfig';
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

interface PatchVisual {
  layer: PixiContainer;
  tilesBuilt: number;
  totalTiles: number;
  baked: Sprite | null;
  renderTexture: RenderTexture | null;
}

interface ChunkVisual {
  root: PixiContainer;
  data: ChunkWorldData;
  patches: PatchVisual[][];
  rngTileIndex: number;
  decor: DecorEntry[];
  decorDone: boolean;
}

interface DecorEntry {
  sprite: Sprite;
  collider: Collider | null;
}

function visualKey(worldSeed: number, gameSeed: number, cx: number, cy: number): string {
  return `${worldSeed}|${gameSeed}|${cx}|${cy}`;
}

function clearContainerChildren(layer: PixiContainer): void {
  for (const ch of layer.removeChildren()) ch.destroy({ texture: true });
}

function destroyPatch(patch: PatchVisual): void {
  if (patch.baked) {
    patch.baked.destroy({ texture: true });
    patch.baked = null;
  }
  if (patch.renderTexture) {
    patch.renderTexture.destroy(true);
    patch.renderTexture = null;
  }
  clearContainerChildren(patch.layer);
  patch.layer.destroy();
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

/** Räknar RenderTexture-baserade mark-patchar (GPU-minne). */
export function countBigWorldGroundRenderTextures(ground: BigWorldStreamGround): number {
  return ground.countRenderTextures();
}

/**
 * Chunkad mark från varld_stor. Mark bakas i 16×16-rutors patchar med lokala bounds (inte kamerans getBounds).
 */
export class BigWorldStreamGround extends PixiContainer {
  private readonly visuals = new Map<string, ChunkVisual>();
  private readonly cache: ChunkWorldCache;
  private readonly bakeQueue: PatchVisual[] = [];
  private lastCx = NaN;
  private lastCy = NaN;
  private activeWorldSeed = 0;
  private activeGameSeed = 0;
  private scene: BigWorldStreamScene | null = null;
  private allowBake = true;

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

  countRenderTextures(): number {
    let n = 0;
    for (const vis of this.visuals.values()) {
      for (const row of vis.patches) {
        for (const p of row) {
          if (p.renderTexture) n++;
        }
      }
    }
    return n;
  }

  /** Inga ofärdiga patchar eller väntande bakningar. */
  isGroundReady(): boolean {
    if (this.bakeQueue.length > 0) return false;
    for (const vis of this.visuals.values()) {
      for (const row of vis.patches) {
        for (const p of row) {
          if (p.tilesBuilt < p.totalTiles) return false;
          if (this.allowBake && !p.baked && p.totalTiles > 0) return false;
        }
      }
    }
    return this.visuals.size > 0;
  }

  sync(hero: Vec2, worldSeed: number, gameSeed: number, scene: BigWorldStreamScene | null, renderer: Renderer | null): void {
    this.scene = scene;
    this.allowBake = renderer != null;
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
    if (this.bakeQueue.length > 0) return true;
    for (const vis of this.visuals.values()) {
      for (const row of vis.patches) {
        for (const p of row) {
          if (p.tilesBuilt < p.totalTiles) return true;
          if (this.allowBake && p.tilesBuilt >= p.totalTiles && !p.baked && p.totalTiles > 0) return true;
        }
      }
    }
    return false;
  }

  private dropAllVisuals(): void {
    this.bakeQueue.length = 0;
    for (const [key, vis] of this.visuals) this.dropChunkVisual(key, vis);
  }

  private dropChunkVisual(_key: string, vis: ChunkVisual): void {
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
    for (const row of vis.patches) {
      for (const p of row) destroyPatch(p);
    }
    vis.root.destroy({ children: true });
    this.visuals.delete(_key);
  }

  private startChunkVisual(key: string, data: ChunkWorldData): void {
    const root = new PixiContainer();
    const tiles = chunkTileCount();
    const patchTiles = BIG_WORLD_GROUND_PATCH_TILES;
    const patchesPerSide = Math.ceil(tiles / patchTiles);
    const patches: PatchVisual[][] = [];
    for (let pi = 0; pi < patchesPerSide; pi++) {
      const row: PatchVisual[] = [];
      for (let pj = 0; pj < patchesPerSide; pj++) {
        const ti0 = pi * patchTiles;
        const tj0 = pj * patchTiles;
        const tw = Math.min(patchTiles, tiles - ti0);
        const th = Math.min(patchTiles, tiles - tj0);
        const layer = new PixiContainer();
        root.addChild(layer);
        row.push({ layer, tilesBuilt: 0, totalTiles: tw * th, baked: null, renderTexture: null });
      }
      patches.push(row);
    }
    this.visuals.set(key, { root, data, patches, rngTileIndex: 0, decor: [], decorDone: false });
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
      if (!this.buildTilesStep()) break;
    }
    if (renderer) {
      let baked = 0;
      while (this.bakeQueue.length > 0 && baked < BIG_WORLD_GROUND_MAX_BAKES_PER_FRAME) {
        const patch = this.bakeQueue.shift();
        if (patch) {
          this.bakePatch(patch, renderer);
          baked++;
        }
      }
    } else {
      this.bakeQueue.length = 0;
    }
    for (const vis of this.visuals.values()) {
      if (this.chunkTilesComplete(vis) && !vis.decorDone) this.spawnDecorForChunk(vis);
    }
  }

  private chunkTilesComplete(vis: ChunkVisual): boolean {
    for (const row of vis.patches) {
      for (const p of row) {
        if (p.tilesBuilt < p.totalTiles) return false;
      }
    }
    return true;
  }

  private buildTilesStep(): boolean {
    for (const vis of this.visuals.values()) {
      const data = vis.data;
      const span = chunkWorldSpan();
      const tiles = chunkTileCount();
      const patchTiles = BIG_WORLD_GROUND_PATCH_TILES;
      const pool = data.tilePool.length ? data.tilePool : ['gras_1'];
      const rng = new Rng(data.chunkSeed);
      for (let pi = 0; pi < vis.patches.length; pi++) {
        const prow = vis.patches[pi];
        if (!prow) continue;
        for (let pj = 0; pj < prow.length; pj++) {
          const patch = prow[pj];
          if (!patch) continue;
          if (patch.tilesBuilt >= patch.totalTiles) continue;
          const ti0 = pi * patchTiles;
          const tj0 = pj * patchTiles;
          const tw = Math.min(patchTiles, tiles - ti0);
          let built = 0;
          while (patch.tilesBuilt < patch.totalTiles && built < 128) {
            const local = patch.tilesBuilt;
            const di = Math.floor(local / tw);
            const dj = local % tw;
            const ti = ti0 + di;
            const tj = tj0 + dj;
            const linear = ti * tiles + tj;
            while (vis.rngTileIndex < linear) {
              rng.pick(pool);
              vis.rngTileIndex++;
            }
            const tileId = rng.pick(pool);
            vis.rngTileIndex++;
            const tex = this.assets.tiles.get(tileId);
            if (tex) {
              const wx = data.cx * span + ti * TILE_WORLD;
              const wy = data.cy * span + tj * TILE_WORLD;
              const s = new Sprite(tex);
              s.anchor.set(0.5, 0.85);
              const pos = Iso.worldToScreen(wx, wy);
              s.position.set(pos.x, pos.y);
              patch.layer.addChild(s);
            }
            patch.tilesBuilt++;
            built++;
          }
          if (patch.tilesBuilt >= patch.totalTiles && this.allowBake && !patch.baked) {
            this.bakeQueue.push(patch);
          }
          if (built > 0) return true;
        }
      }
    }
    return false;
  }

  private bakePatch(patch: PatchVisual, renderer: Renderer): void {
    if (patch.baked || patch.tilesBuilt < patch.totalTiles) return;
    const lb = patch.layer.getLocalBounds();
    if (lb.width < 2 || lb.height < 2) {
      clearContainerChildren(patch.layer);
      return;
    }
    const scale = BIG_WORLD_GROUND_BAKE_SCALE;
    const pad = 2;
    const rw = Math.max(1, Math.ceil((lb.width + pad * 2) * scale));
    const rh = Math.max(1, Math.ceil((lb.height + pad * 2) * scale));
    const rt = RenderTexture.create({ width: rw, height: rh });
    const prevX = patch.layer.position.x;
    const prevY = patch.layer.position.y;
    patch.layer.position.set(-lb.x + pad, -lb.y + pad);
    renderer.render({ container: patch.layer, target: rt, clear: true });
    clearContainerChildren(patch.layer);
    patch.layer.position.set(prevX, prevY);
    const spr = new Sprite(rt);
    spr.scale.set(1 / scale, 1 / scale);
    spr.position.set(lb.x - pad, lb.y - pad);
    patch.layer.parent?.addChild(spr);
    patch.baked = spr;
    patch.renderTexture = rt;
  }

  /** Sample canvas under hjälten — true om pixel skiljer sig från himmel. */
  probeGroundPixel(renderer: Renderer, heroScreenX: number, heroScreenY: number): boolean {
    if (this.countRenderTextures() === 0) return false;
    const x = Math.max(0, Math.floor(heroScreenX));
    const y = Math.max(0, Math.floor(heroScreenY));
    try {
      const out = renderer.extract.pixels({
        target: renderer.canvas as unknown as Container,
        frame: new Rectangle(x, y, 1, 1),
      });
      const px = out?.pixels;
      if (!px || px.length < 3) return false;
      const r = px[0] ?? 0;
      const g = px[1] ?? 0;
      const b = px[2] ?? 0;
      const sky = BIG_WORLD_SKY_CLEAR_COLOR;
      const sr = (sky >> 16) & 255;
      const sg = (sky >> 8) & 255;
      const sb = sky & 255;
      return Math.abs(r - sr) + Math.abs(g - sg) + Math.abs(b - sb) > 24;
    } catch {
      return false;
    }
  }
}
