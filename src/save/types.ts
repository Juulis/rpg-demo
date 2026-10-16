import type { Equipment, ItemInstance } from '../core/GameContext';

export const SAVE_VERSION = 1;
export const MAX_HEROES = 8;

export interface HeroRecord {
  id: string;
  name: string;
  cls: string;
  level: number;
  xp: number;
  gold: number;
  inv: ItemInstance[];
  equip: Equipment;
  /** Nyskapad, aldrig spelad: motorn ger startutrustning. */
  fresh?: boolean;
}

export interface GameRecord {
  seed: number;
  killed: string[];
  zone: string;
  /** [x, y] i 2D (legacy-3D sparade [x, z], samma axlar på kartan). */
  pos: [number, number] | null;
  rot?: number;
  stage: number;
  runes: number;
  city: string;
}

export interface SaveFile {
  version: number;
  hero: HeroRecord;
  game: GameRecord | null;
  found?: number;
  savedAt?: number;
}

export interface HeroIndexEntry {
  id: string;
  name: string;
  cls: string;
  level: number;
  savedAt?: number;
}

export const HERO_CLASS_IDS = ['amazonkrigare', 'barbar', 'riddare'] as const;
export type HeroClassId = (typeof HERO_CLASS_IDS)[number];

/** Klass-id + ikon. Visningsnamn: i18n-nyckeln `classes.<id>`. */
export interface HeroClass {
  id: HeroClassId;
  icon: string;
}

export const HERO_CLASSES: readonly HeroClass[] = [
  { id: 'amazonkrigare', icon: '🔱' },
  { id: 'barbar', icon: '💥' },
  { id: 'riddare', icon: '🛡️' },
];
export const classById = (id: string): HeroClass | undefined => HERO_CLASSES.find((c) => c.id === id);

export const newGameRecord = (seed: number): GameRecord => ({
  seed,
  killed: [],
  zone: 'forest',
  pos: null,
  stage: 0,
  runes: 0,
  city: 'besatt',
});
