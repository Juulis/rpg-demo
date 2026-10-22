import routinesFile from '../data/npcRoutines.json';
import type { NpcRoutineDef, NpcRoutinesFile, RoutineSegment } from './npcRoutineTypes';

const file = routinesFile as NpcRoutinesFile;

export function routineForNpc(npcId: string): NpcRoutineDef | undefined {
  return file.npcs[npcId];
}

export function routineTemplate(templateId: string): RoutineSegment[] | undefined {
  return file.templates[templateId]?.dygnsrutin;
}
