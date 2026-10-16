import type { HeroSave } from './GameContext';

/**
 * Lagring av hjältar. Bara interfacet definieras här; Utvecklare 2 (#19) äger sparningen och implementerar det
 * (lokalt via localStorage nu, server senare). Motorn sparar aldrig själv – den lämnar Game.getSnapshot().
 */
export interface SaveBackend {
  list(): Promise<{ id: string; name: string; cls: string; level: number }[]>;
  load(id: string): Promise<HeroSave | null>;
  save(id: string, data: HeroSave): Promise<void>;
  remove(id: string): Promise<void>;
}
