import type { FoundEntry } from '../core/SaveBackend';
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
  /** Legacy: antal fynd (js/save.js). */
  found?: number;
  /** Per-hjälte fyndregister (lorebok), ersätter globalt rpg_found i 2D. */
  foundItems?: Record<string, FoundEntry>;
  /** Kartfog per zon (base64-bytes, samma som legacy rpg_karta_<id>_<zon>). */
  fog?: Record<string, string>;
  savedAt?: number;
}

export interface HeroIndexEntry {
  id: string;
  name: string;
  cls: string;
  level: number;
  savedAt?: number;
}

export interface HeroClass {
  id: string;
  name: string;
  icon: string;
}

export const HERO_CLASSES: readonly HeroClass[] = [
  { id: 'amazonkrigare', name: 'Amazonkrigare', icon: '🔱' },
  { id: 'barbar', name: 'Barbar', icon: '💥' },
  { id: 'riddare', name: 'Riddare', icon: '🛡️' },
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
