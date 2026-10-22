import { WorldAmbientEntity } from '../entities/WorldAmbientEntity';
import type { AssetStore } from '../render/Assets';
import { worldAmbientSpawns } from '../world/worldAmbientSpawn';
import type { World } from './World';

/** Världsfigurer (jägare, handlare, djur) som vandrar i skogen. */
export class WorldAmbientSystem {
  private list: WorldAmbientEntity[] = [];
  private rng = Math.random;

  constructor(private readonly assets: AssetStore) {}

  sync(w: World, gameSeed: number): void {
    this.clear(w);
    for (const sp of worldAmbientSpawns(w.zone, gameSeed)) {
      const set = this.assets.worldFigures.get(sp.figure);
      if (!set) continue;
      const ent = new WorldAmbientEntity(sp.id, sp.figure, sp.pos, set);
      w.objects.addChild(ent.view);
      this.list.push(ent);
    }
  }

  update(dt: number, w: World): void {
    for (const e of this.list) e.update(dt, w.zone, this.rng);
  }

  private clear(w: World): void {
    for (const e of this.list) {
      w.objects.removeChild(e.view);
      e.view.destroy({ children: true });
    }
    this.list = [];
  }

  dispose(): void {
    this.list = [];
  }
}
