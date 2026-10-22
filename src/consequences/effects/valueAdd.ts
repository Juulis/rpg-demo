import type { EffectModule } from '../types';

export const valueAdd: EffectModule = (eff, { ws }) => {
  if (typeof eff.key !== 'string' || typeof eff.delta !== 'number') return;
  ws.values[eff.key] = (ws.values[eff.key] ?? 0) + eff.delta;
};
