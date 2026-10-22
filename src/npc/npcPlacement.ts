import type { Vec2 } from '../core/GameContext';
import type { NpcDef } from '../data/npcTypes';
import type { WorldState } from '../world/worldStateTypes';
import { Zone } from '../world/Zone';
import { resolveRoutinePlacement } from './resolveRoutine';

export interface ResolvedNpc {
  def: NpcDef;
  pos: Vec2;
  sprite: string;
  line: string;
  hidden: boolean;
  routinePlats?: string;
  routineActivity?: string;
}

export interface NpcPlacementContext {
  zoneAreaId: string;
  worldTime: number;
}

export function resolveNpcPosition(def: NpcDef): Vec2 {
  if (def.tile) {
    const p = Zone.T(def.tile[0], def.tile[1]);
    return { x: p.x, y: p.y };
  }
  const pos = def.pos ?? [0, 0];
  return { x: pos[0], y: pos[1] };
}

export function resolveNpc(def: NpcDef, world: Readonly<WorldState>, ctx?: NpcPlacementContext): ResolvedNpc {
  const state = world.npc_states[def.id] ?? 'levande';
  const variant = def.tillstand_varianter?.[state];
  let hidden = !!variant?.hidden;
  let pos = resolveNpcPosition(def);
  let routinePlats: string | undefined;
  let routineActivity: string | undefined;

  if (ctx) {
    const routine = resolveRoutinePlacement(def, world, ctx.zoneAreaId, ctx.worldTime, def.routineTemplate);
    if (routine) {
      pos = { ...routine.pos };
      routinePlats = routine.plats;
      routineActivity = routine.aktivitet;
    } else if (world.npc_locations[def.id] || def.routineTemplate) {
      hidden = true;
    }
  }

  return {
    def,
    pos,
    sprite: variant?.sprite ?? def.sprite,
    line: variant?.default_line ?? def.default_line,
    hidden,
    routinePlats,
    routineActivity,
  };
}
