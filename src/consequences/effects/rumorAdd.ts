import type { EffectModule } from '../types';

export const rumorAdd: EffectModule = (eff, { ws, gameDay, notifyKey }) => {
  if (typeof eff.rykte !== 'string') return;
  ws.rumors_active[eff.rykte] = { since_day: gameDay };
  notifyKey('consequence.rumor');
};
