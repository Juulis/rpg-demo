import { Container, Sprite } from 'pixi.js';
import { Rng } from '../core/Rng';
import type { Vec2 } from '../core/GameContext';
import type { AssetStore } from '../render/Assets';
import { Iso, TILE_WORLD } from '../render/Iso';
import { FOREST_GROUND_CHUNK_RADIUS, FOREST_GROUND_CHUNK_TILES, FOREST_PLAY_RADIUS, FOREST_TILE_CUTOFF } from './forestConstants';

/** Chunkad mark för stora skogen — bygger bara rutor nära hjälten. */
export class ForestGroundChunks extends Container {
  private readonly chunks = new Map<string, Container>();
  private lastCx = NaN;
  private lastCy = NaN;

  constructor(private readonly assets: AssetStore) {
    super();
  }

  sync(hero: Vec2): void {
    const cx = Math.floor(hero.x / (FOREST_GROUND_CHUNK_TILES * TILE_WORLD));
    const cy = Math.floor(hero.y / (FOREST_GROUND_CHUNK_TILES * TILE_WORLD));
    if (cx === this.lastCx && cy === this.lastCy) return;
    this.lastCx = cx;
    this.lastCy = cy;
    const reach = Math.ceil(FOREST_GROUND_CHUNK_RADIUS / (FOREST_GROUND_CHUNK_TILES * TILE_WORLD)) + 1;
    const keep = new Set<string>();
    for (let dx = -reach; dx <= reach; dx++) {
      for (let dy = -reach; dy <= reach; dy++) {
        const key = `${cx + dx},${cy + dy}`;
        keep.add(key);
        if (!this.chunks.has(key)) this.chunks.set(key, this.buildChunk(cx + dx, cy + dy));
      }
    }
    for (const [key, c] of this.chunks) {
      if (!keep.has(key)) {
        c.destroy({ children: true });
        this.chunks.delete(key);
      }
    }
    for (const c of this.chunks.values()) {
      if (!c.parent) this.addChild(c);
    }
  }

  private buildChunk(cx: number, cy: number): Container {
    const layer = new Container();
    const R = new Rng(Rng.hash(7, cx, cy));
    const i0 = cx * FOREST_GROUND_CHUNK_TILES;
    const j0 = cy * FOREST_GROUND_CHUNK_TILES;
    for (let di = 0; di < FOREST_GROUND_CHUNK_TILES; di++) {
      for (let dj = 0; dj < FOREST_GROUND_CHUNK_TILES; dj++) {
        const i = i0 + di;
        const j = j0 + dj;
        const x = i * TILE_WORLD;
        const y = j * TILE_WORLD;
        const d = Math.hypot(x, y);
        if (d > FOREST_TILE_CUTOFF) continue;
        const id =
          d < 7 * Math.sqrt(10)
            ? R.pick(['lera_1', 'lera_2', 'lera_3'])
            : d < 9 * Math.sqrt(10)
              ? 'gras_till_lera'
              : d > FOREST_PLAY_RADIUS * 0.97
                ? R.pick(['skogsbotten_lov', 'skogsbotten_ormbunke'])
                : R.next() < 0.18
                  ? R.pick(['skogsbotten_lov', 'skogsbotten_ormbunke'])
                  : R.pick(['gras_1', 'gras_2', 'gras_3', 'gras_4']);
        const t = this.assets.tiles.get(id);
        if (!t) continue;
        const s = new Sprite(t);
        const p = Iso.worldToScreen(x, y);
        s.position.set(p.x, p.y);
        s.anchor.set(0.5, 0.85);
        s.zIndex = x + y;
        layer.addChild(s);
      }
    }
    return layer;
  }
}
