import { Rng } from '../core/Rng';
import { WorldAmbientEntity } from '../entities/WorldAmbientEntity';
import type { AssetStore } from '../render/Assets';
import { worldAmbientSpawns } from '../world/worldAmbientSpawn';
import type { World } from './World';

/** Världsfigurer (jägare, handlare, djur) som vandrar i skogen. */
export class WorldAmbientSystem {
  private list: WorldAmbientEntity[] = [];
  private wanderRng = new Rng(1);

  constructor(private readonly assets: AssetStore) {}

  sync(w: World, gameSeed: number): void {
    this.clear(w);
    this.wanderRng = new Rng(Rng.hash('ambient-wander', gameSeed, w.zone.areaId));
    for (const sp of worldAmbientSpawns(w.zone, gameSeed)) {
      const set = this.assets.worldFigures.get(sp.figure);
      if (!set) continue;
      const ent = new WorldAmbientEntity(sp.id, sp.figure, sp.pos, set);
      w.objects.addChild(ent.view);
      this.list.push(ent);
    }
  }

  update(dt: number, w: World): void {
    const next = (): number => this.wanderRng.next();
    for (const e of this.list) e.update(dt, w.zone, next);
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
