/** Typer för varld_stor.json (#85). Fält speglar designfilen; valfria fält där data saknas. */

export interface BigWorldRing {
  ring: number;
  fran: number;
  till: number | null;
  nivaband: [number, number];
}

export interface BigWorldBiome {
  id: string;
  namn: string;
  kansla?: string;
  resurser?: string[];
  tiles?: string[];
  dekor?: string[];
  nivaband?: [number, number];
  regioner?: string[];
  monsterfamiljer?: Record<string, string[]>;
  egna_monster?: readonly BigWorldBiomeMonster[];
  overgangar?: readonly { till: string; beskrivning?: string }[];
}

export interface BigWorldBiomeMonster {
  id: string;
  roll?: string;
  familj: string;
  nivaband: [number, number];
  undertyper_nu: string[];
  platshallare?: boolean;
  ersatts_av?: string | null;
}

export interface BigWorldRegion {
  id: string;
  namn: string;
  biom: string;
  typ: string;
  chunk: [number, number];
  radie: number;
  ringzon?: number;
  nivaband?: [number, number];
  grannar?: string[];
  vagar?: string[];
  byar?: string[];
  poi?: string[];
  monsterfamilj?: string | null;
  undertyper?: string[];
  boss?: string | null;
  spawnzoner?: string[];
  genererad_spawn?: boolean;
  akt?: string;
  sakert?: boolean;
  monsterplatser?: string[];
  atkomst?: string;
  ingang_poi?: string;
}

export interface BigWorldRoad {
  id: string;
  namn: string;
  typ: string;
  strackning: string[];
  oppen?: string;
}

export interface BigWorldPoi {
  id: string;
  namn: string;
  typ: string;
  region: string;
  npc?: string[];
  quests?: string[];
  quest_mallar?: string[];
  sakert?: boolean;
  atkomst?: string;
  waypoint?: boolean;
  krav?: string;
}

export interface BigWorldDataFile {
  meta: {
    version?: string;
    startpunkt: { region: string; poi?: string; chunk: [number, number] };
    chunk?: { storlek_rutor?: number; seed?: string; region_for_chunk?: string; generering?: string };
    zonmodell?: { avstand?: string; ringar?: BigWorldRing[]; regel?: string; ytterkant?: string };
    waypoints?: { regel?: string; punkter?: string[]; stadsvagstenar?: string };
  };
  biomer: Record<string, BigWorldBiome>;
  regioner: BigWorldRegion[];
  vagar: BigWorldRoad[];
  pois: BigWorldPoi[];
  poi_mallar?: Record<string, unknown>;
  quest_mallar?: Record<string, unknown>;
}
