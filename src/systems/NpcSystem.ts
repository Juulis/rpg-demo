import type { WorldStateService } from '../world/WorldStateService';
import type { AssetStore } from '../render/Assets';
import { NpcEntity } from '../entities/NpcEntity';
import { npcsForZone } from '../npc/npcCatalog';
import { resolveNpc } from '../npc/npcPlacement';
import type { World } from './World';

const TALK_RANGE = 2.8;

/** Spawnar och håller NPC:er för aktuell zon. */
export class NpcSystem {
  private list: NpcEntity[] = [];

  constructor(
    private readonly assets: AssetStore,
    private readonly worldState: WorldStateService,
  ) {}

  sync(w: World): void {
    this.clear(w);
    const defs = npcsForZone(w.zone.name as 'forest' | 'village', w.zone.areaId);
    const state = this.worldState.get();
    for (const def of defs) {
      const resolved = resolveNpc(def, state);
      if (resolved.hidden) continue;
      const anim = this.assets.npcs.get(resolved.sprite) ?? null;
      const ent = new NpcEntity(resolved, anim);
      w.objects.addChild(ent.view);
      this.list.push(ent);
    }
  }

  nearest(w: World, maxDist = TALK_RANGE): NpcEntity | null {
    const h = w.hero.pos;
    let best: NpcEntity | null = null;
    let bd = maxDist;
    for (const n of this.list) {
      const d = Math.hypot(n.resolved.pos.x - h.x, n.resolved.pos.y - h.y);
      if (d < bd) {
        bd = d;
        best = n;
      }
    }
    return best;
  }

  pickAt(sx: number, sy: number, cam: { toScreen: (x: number, y: number, lift?: number) => { x: number; y: number } }): NpcEntity | null {
    let best: NpcEntity | null = null;
    let bd = Infinity;
    for (const n of this.list) {
      const foot = cam.toScreen(n.resolved.pos.x, n.resolved.pos.y);
      if (Math.abs(sx - foot.x) > 36 || Math.abs(sy - foot.y) > 70) continue;
      const d = Math.abs(sx - foot.x) + Math.abs(sy - foot.y);
      if (d < bd) {
        bd = d;
        best = n;
      }
    }
    return best;
  }

  readonly entities = (): readonly NpcEntity[] => this.list;

  private clear(_w: World): void {
    for (const n of this.list) n.view.destroy({ children: true });
    this.list = [];
  }

  dispose(): void {
    this.list = [];
  }
}
