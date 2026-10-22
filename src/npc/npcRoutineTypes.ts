export interface RoutineSegment {
  from: string;
  to: string;
  plats: string;
  aktivitet: string;
}

export interface NpcRoutineDef {
  roll?: string;
  omrade?: string;
  home?: string;
  dygnsrutin: RoutineSegment[];
}

export interface NpcRoutinesFile {
  meta: { version: string };
  npcs: Record<string, NpcRoutineDef>;
  templates: Record<string, { dygnsrutin: RoutineSegment[] }>;
}

export interface RoutineAnchorDef {
  id: string;
  areaId: string;
  pos?: [number, number];
  tile?: [number, number];
}
