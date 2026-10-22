import { inTimeWindow } from '../quest/questTime';
import type { WorldState } from '../world/worldStateTypes';
import type { NpcDef } from '../data/npcTypes';
import type { Vec2 } from '../core/GameContext';
import { anchorPosition, parseNpcLocationKey, routineAreaId } from './routineAnchors';
import { routineForNpc, routineTemplate } from './npcRoutineCatalog';
import type { RoutineSegment } from './npcRoutineTypes';

const TRADE_ACTIVITY = /köper|säljer|handlar/i;

export function isTradeActivity(aktivitet: string): boolean {
  return TRADE_ACTIVITY.test(aktivitet);
}

export function activeRoutineSegment(npcId: string, worldTime: number, templateId?: string): RoutineSegment | null {
  const routine = templateId ? { dygnsrutin: routineTemplate(templateId) ?? [] } : routineForNpc(npcId);
  if (!routine?.dygnsrutin?.length) return null;
  for (const seg of routine.dygnsrutin) {
    if (inTimeWindow(worldTime, seg.from, seg.to)) return seg;
  }
  return routine.dygnsrutin[0] ?? null;
}

export interface RoutinePlacement {
  pos: Vec2;
  plats: string;
  aktivitet: string;
  forcedByConsequence: boolean;
}

/** Rutinplats i aktuellt område; null om NPC ska döljas (konsekvensflytt till annat område). */
export function resolveRoutinePlacement(
  def: NpcDef,
  world: Readonly<WorldState>,
  zoneAreaId: string,
  worldTime: number,
  templateId?: string,
): RoutinePlacement | null {
  const override = world.npc_locations[def.id];
  if (override) {
    const { areaId, plats } = parseNpcLocationKey(override);
    if (areaId && areaId !== zoneAreaId) return null;
    const pos = anchorPosition(zoneAreaId, plats) ?? anchorPosition(def.area, plats);
    if (!pos) return null;
    const seg = activeRoutineSegment(def.id, worldTime, templateId);
    return {
      pos,
      plats,
      aktivitet: seg?.aktivitet ?? '',
      forcedByConsequence: true,
    };
  }

  const routine = templateId ? undefined : routineForNpc(def.id);
  const routineArea = routine?.omrade ? routineAreaId(routine.omrade) : def.area;
  if (routineArea !== zoneAreaId) return null;

  const seg = activeRoutineSegment(def.id, worldTime, templateId);
  const plats = seg?.plats ?? routine?.home;
  if (!plats) return null;
  const pos = anchorPosition(zoneAreaId, plats);
  if (!pos) return null;
  return {
    pos,
    plats,
    aktivitet: seg?.aktivitet ?? '',
    forcedByConsequence: false,
  };
}

export function merchantInTradeHours(npcId: string, worldTime: number): boolean {
  const routine = routineForNpc(npcId);
  if (!routine || routine.roll !== 'handlare') return true;
  const seg = activeRoutineSegment(npcId, worldTime);
  if (!seg) return true;
  return isTradeActivity(seg.aktivitet);
}
