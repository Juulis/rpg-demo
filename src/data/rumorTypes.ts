export interface RumorDef {
  id: string;
  text: string;
  villkor?: unknown;
  talare: string[];
  prioritet: number;
  ersatter?: string;
}

export interface RumorDataFile {
  meta?: Record<string, string>;
  rykten: RumorDef[];
}
