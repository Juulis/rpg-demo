import type { HeroSave } from './GameContext';

/** En post i fyndregistret (loreboken), samma format som legacy localStorage['rpg_found']. */
export interface FoundEntry {
  first: string;
  quality: string;
  base: string;
  ilvl: number;
}
/** Registrerar första upplock per föremåls-id för aktiv hjälte. Returnerar true om det var första gången. */
export interface FoundRegistry {
  setActiveHero(heroId: string | null): void;
  markFound(id: string, entry: FoundEntry): Promise<boolean>;
  /** Tar bort ett fynd (t.ex. vid rollback av misslyckat upplock). */
  unmarkFound(id: string): Promise<void>;
}

/**
 * Lagring av hjältar. Bara interfacet definieras här; implementeras i save/backend (localStorage nu, server senare).
 * Motorn sparar aldrig själv – den lämnar Game.getSnapshot() och registrerar backend via Game.setSaveBackend().
 */
export interface SaveBackend extends FoundRegistry {
  list(): Promise<{ id: string; name: string; cls: string; level: number; savedAt?: number }[]>;
  load(id: string): Promise<HeroSave | null>;
  save(id: string, data: HeroSave): Promise<void>;
  remove(id: string): Promise<void>;
  lastPlayedHeroId(): Promise<string | null>;
  /** App-inställningar (nycklar utan prefix; lagras som rpg_setting_<key>). */
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
  /** Kartfog per hjälte (zon → base64, samma format som legacy js/map.js). */
  getFogMap(heroId: string): Promise<Record<string, string>>;
  setFog(heroId: string, zone: string, base64: string): Promise<void>;
  clearFog(heroId: string): Promise<void>;
}
