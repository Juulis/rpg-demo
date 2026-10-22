import anchorsFile from '../data/routineAnchors.json';
import type { Vec2 } from '../core/GameContext';
import type { RoutineAnchorDef } from './npcRoutineTypes';
import { Zone } from '../world/Zone';

const anchors = (anchorsFile as unknown as { anchors: RoutineAnchorDef[] }).anchors;

const byAreaPlats = new Map<string, Map<string, RoutineAnchorDef>>();
for (const a of anchors) {
  let m = byAreaPlats.get(a.areaId);
  if (!m) {
    m = new Map();
    byAreaPlats.set(a.areaId, m);
  }
  m.set(a.id, a);
}

export function routineAreaId(designArea: string): string {
  if (designArea === 'startlagret') return 'startskogen';
  return designArea;
}

export function anchorPosition(areaId: string, plats: string): Vec2 | null {
  const a = byAreaPlats.get(areaId)?.get(plats);
  if (!a) return null;
  if (a.tile) return Zone.T(a.tile[0], a.tile[1]);
  if (a.pos) return { x: a.pos[0], y: a.pos[1] };
  return null;
}

export function parseNpcLocationKey(key: string): { areaId: string; plats: string } {
  const idx = key.indexOf(':');
  if (idx < 0) return { areaId: '', plats: key };
  const area = key.slice(0, idx);
  const plats = key.slice(idx + 1);
  return { areaId: routineAreaId(area), plats };
}
