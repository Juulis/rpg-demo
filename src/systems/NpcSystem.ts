import type { WorldStateService } from '../world/WorldStateService';
import type { AssetStore } from '../render/Assets';
import { NpcEntity } from '../entities/NpcEntity';
import { backgroundVillagerDefs } from '../npc/backgroundVillagers';
import { npcsForZone } from '../npc/npcCatalog';
import { resolveNpc, type NpcPlacementContext } from '../npc/npcPlacement';
import { resolveRoutinePlacement } from '../npc/resolveRoutine';
import { resolveDialogText } from '../npc/dialogResolve';
import type { Text } from '../text/Text';
import type { World } from './World';

const TALK_RANGE = 2.8;
const BARK_RANGE = 4.2;
const BARK_MIN = 2.6;
const BARK_COOLDOWN_S = 28;

/** Spawnar och håller NPC:er för aktuell zon. */
export class NpcSystem {
  private list: NpcEntity[] = [];
  private readonly barkNear = new Set<string>();
  private readonly barkCd = new Map<string, number>();
  private worldTime = 0;

  constructor(
    private readonly assets: AssetStore,
    private readonly worldState: WorldStateService,
  ) {}

  setWorldTime(t: number): void {
    this.worldTime = t;
  }

  sync(w: World): void {
    this.barkNear.clear();
    this.clear(w);
    const areaId = w.zone.areaId;
    const defs = [...npcsForZone(w.zone.name as 'forest' | 'village', areaId), ...backgroundVillagerDefs(areaId, this.worldState.get())];
    const state = this.worldState.get();
    const ctx: NpcPlacementContext = { zoneAreaId: areaId, worldTime: this.worldTime };
    for (const def of defs) {
      const resolved = resolveNpc(def, state, ctx);
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

  update(dt: number, w: World): void {
    const state = this.worldState.get();
    const ctx: NpcPlacementContext = { zoneAreaId: w.zone.areaId, worldTime: this.worldTime };
    for (const n of this.list) {
      const def = n.resolved.def;
      const placement = resolveRoutinePlacement(def, state, ctx.zoneAreaId, ctx.worldTime, def.routineTemplate);
      if (placement) n.setRoutineTarget(placement.pos.x, placement.pos.y, placement.aktivitet);
      n.update(dt, w.zone);
    }
  }

  /** Bark när hjälten går in i radie (inte under aktiv dialog). */
  updateBarks(w: World, text: Text, dialogOpen: boolean, onBark: (line: string, x: number, y: number) => void): void {
    if (dialogOpen) return;
    const ctx = { world: this.worldState.get(), day: this.worldState.getGameDay() };
    const hx = w.hero.pos.x;
    const hy = w.hero.pos.y;
    for (const n of this.list) {
      const id = n.resolved.def.id;
      const d = Math.hypot(n.resolved.pos.x - hx, n.resolved.pos.y - hy);
      const inBand = d < BARK_RANGE && d > BARK_MIN;
      if (inBand) {
        if (!this.barkNear.has(id)) {
          this.barkNear.add(id);
          const last = this.barkCd.get(id) ?? -1e9;
          if (w.time - last >= BARK_COOLDOWN_S) {
            const line = resolveDialogText(n.resolved.def, 'bark', ctx, text);
            if (line) {
              onBark(line, n.resolved.pos.x, n.resolved.pos.y);
              this.barkCd.set(id, w.time);
            }
          }
        }
      } else this.barkNear.delete(id);
    }
  }

  private clear(_w: World): void {
    for (const n of this.list) n.view.destroy({ children: true });
    this.list = [];
  }

  dispose(): void {
    this.list = [];
  }
}
