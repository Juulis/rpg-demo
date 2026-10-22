import type { EffectModule } from '../types';

export const flagSet: EffectModule = (eff, { ws }) => {
  if (typeof eff.flag !== 'string') return;
  ws.flags[eff.flag] = eff.value !== false && eff.value !== 0 && eff.value !== '';
};
