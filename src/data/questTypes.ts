export type QuestStatus = 'ej_startad' | 'aktiv' | 'klar';

export interface QuestTrigger {
  typ: string;
  npc?: string | string[];
  boss?: string;
  item?: string;
  region?: string;
  ankare?: string | string[];
  tid?: [string, string];
  val?: QuestTrigger[];
}

export interface QuestStep {
  id: string;
  text: string;
  trigger: QuestTrigger;
  garanterad_drop?: string;
}

export interface QuestChoice {
  id: string;
  text: string;
  konsekvens?: Record<string, unknown>;
  consequences?: Record<string, unknown>[];
}

export interface QuestDef {
  id: string;
  namn: string;
  givare: string;
  alternativ_givare?: string;
  akt: string;
  plats: string[];
  rekommenderad_niva?: number[];
  beskrivning: string;
  start: QuestTrigger;
  steg: QuestStep[];
  val?: QuestChoice[];
  redan_gjort?: string;
  belöning?: Record<string, unknown>;
  repliker?: Record<string, string>;
  rykten?: string[];
  boss?: string | null;
}

export interface QuestDataFile {
  meta?: Record<string, unknown>;
  akt_1: QuestDef[];
  skisser?: unknown[];
}

export interface QuestProgress {
  status: QuestStatus;
  steg?: string;
  val?: string;
  givare?: string;
  inspekterat?: string[];
}
