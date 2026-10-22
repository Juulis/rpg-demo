import type { EffectModule } from '../types';

export const areaChange: EffectModule = (eff, { ws }) => {
  if (typeof eff.region !== 'string') return;
  const k = `${eff.region}:${eff.andring ?? ''}:${eff.ankare ?? ''}`;
  ws.area_changes[k] = JSON.stringify(eff.value ?? null);
};
