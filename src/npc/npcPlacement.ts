import type { Vec2 } from '../core/GameContext';
import type { NpcDef } from '../data/npcTypes';
import type { WorldState } from '../world/worldStateTypes';
import { Zone } from '../world/Zone';

export interface ResolvedNpc {
  def: NpcDef;
  pos: Vec2;
  sprite: string;
  line: string;
  hidden: boolean;
}

export function resolveNpcPosition(def: NpcDef): Vec2 {
  if (def.tile) {
    const p = Zone.T(def.tile[0], def.tile[1]);
    return { x: p.x, y: p.y };
  }
  const pos = def.pos ?? [0, 0];
  return { x: pos[0], y: pos[1] };
}

export function resolveNpc(def: NpcDef, world: Readonly<WorldState>): ResolvedNpc {
  const state = world.npc_states[def.id] ?? 'levande';
  const variant = def.tillstand_varianter?.[state];
  const hidden = !!variant?.hidden;
  return {
    def,
    pos: resolveNpcPosition(def),
    sprite: variant?.sprite ?? def.sprite,
    line: variant?.default_line ?? def.default_line,
    hidden,
  };
}
