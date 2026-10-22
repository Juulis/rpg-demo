import type { EffectModule } from '../types';

export const xpGrant: EffectModule = (eff, { ws, runtime, notifyKey }) => {
  if (typeof eff.amount !== 'number' || !Number.isFinite(eff.amount)) return;
  runtime.grantXp?.(eff.amount);
  ws.values.quest_xp_granted = (ws.values.quest_xp_granted ?? 0) + eff.amount;
  notifyKey('consequence.xp', { amount: eff.amount });
};
