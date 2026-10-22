export interface NpcStateVariant {
  hidden?: boolean;
  sprite?: string;
  default_line?: string;
}

export interface NpcDef {
  id: string;
  /** Nyckel i assets/2d/sprites/npc/npc.json */
  sprite: string;
  area: string;
  zone: 'forest' | 'village';
  act: number;
  name: string;
  default_line: string;
  pos?: [number, number];
  tile?: [number, number];
  tillstand_varianter?: Record<string, NpcStateVariant>;
}

export interface NpcDataFile {
  meta?: Record<string, string>;
  npcs: NpcDef[];
}
