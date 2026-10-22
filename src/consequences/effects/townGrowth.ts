import type { EffectModule } from '../types';

export const townGrowth: EffectModule = (eff, { ws, notifyKey }) => {
  if (typeof eff.town !== 'string' || typeof eff.delta !== 'number') return;
  ws.town_growth[eff.town] = (ws.town_growth[eff.town] ?? 0) + eff.delta;
  notifyKey('consequence.town', { town: eff.town });
};
