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
  /** App-inställningar (t.ex. språk). Endast backend-implementationen skriver till lagring. */
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
}
