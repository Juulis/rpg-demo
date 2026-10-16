import type { HeroSave } from './GameContext';

/** En post i fyndregistret (loreboken), samma format som legacy localStorage['rpg_found']. */
export interface FoundEntry {
  first: string;
  quality: string;
  base: string;
  ilvl: number;
}
/** Registrerar första upplock per föremåls-id. Returnerar true om det var första gången. */
export interface FoundRegistry {
  markFound(id: string, entry: FoundEntry): boolean;
}

/**
 * Lagring av hjältar. Bara interfacet definieras här; Utvecklare 2 (#19) äger sparningen och implementerar det
 * (lokalt via localStorage nu, server senare). Motorn sparar aldrig själv – den lämnar Game.getSnapshot().
 */
export interface SaveBackend extends FoundRegistry {
  list(): Promise<{ id: string; name: string; cls: string; level: number }[]>;
  load(id: string): Promise<HeroSave | null>;
  save(id: string, data: HeroSave): Promise<void>;
  remove(id: string): Promise<void>;
}
