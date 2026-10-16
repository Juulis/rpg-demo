import type { HeroSave } from '../core/GameContext';

/** Det sparmodulen behöver av Game (#18): laddning (skickar hero_loaded) och ögonblicksbild. Injiceras från main.ts. */
export interface HeroGateway {
  loadHero(save: HeroSave): void;
  getSnapshot(): HeroSave;
}
