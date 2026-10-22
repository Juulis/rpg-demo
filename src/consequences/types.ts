import type { WorldState } from '../world/worldStateTypes';
import type { WorldStateService } from '../world/WorldStateService';

export interface ConsequenceRuntime {
  grantItem?: (itemId: string) => boolean;
  grantXp?: (amount: number) => void;
  /** Visningsbar notis (redan lokaliserad). */
  notify?: (message: string) => void;
}

export interface EffectContext {
  world: WorldStateService;
  ws: WorldState;
  gameDay: number;
  runtime: ConsequenceRuntime;
  notifyKey: (key: string, params?: Record<string, string | number>) => void;
  /** När true körs delay_dygn inte (pending som förfaller). */
  fromPending?: boolean;
}

export type EffectModule = (eff: Record<string, unknown>, ctx: EffectContext) => void;
