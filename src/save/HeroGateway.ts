import type { HeroSave } from '../core/GameContext';
import type { SaveBackend } from '../core/SaveBackend';

/** Det sparmodulen behöver av Game (#18): laddning (skickar hero_loaded) och ögonblicksbild. Injiceras från main.ts. */
export interface HeroGateway {
  loadHero(save: HeroSave): void;
  getSnapshot(): HeroSave;
  setSaveBackend(backend: SaveBackend): void;
}
