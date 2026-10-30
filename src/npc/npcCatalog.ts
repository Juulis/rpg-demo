import npcFile from '../data/npc.json';
import type { NpcDataFile, NpcDef } from '../data/npcTypes';

const data = npcFile as unknown as NpcDataFile;

export function allNpcs(): readonly NpcDef[] {
  return data.npcs;
}

export function npcsForZone(
  zoneName: 'forest' | 'village' | 'wolfstead' | 'dimmerstrand' | 'kopparberg' | 'askeborg',
  areaId: string,
): NpcDef[] {
  return data.npcs.filter((n) => n.zone === zoneName && n.area === areaId && n.act === 1);
}

export function npcById(id: string): NpcDef | undefined {
  return data.npcs.find((n) => n.id === id);
}
