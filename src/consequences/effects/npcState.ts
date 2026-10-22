import type { EffectModule } from '../types';

export const npcState: EffectModule = (eff, { ws, gameDay, fromPending }) => {
  if (typeof eff.npc !== 'string' || typeof eff.state !== 'string') return;
  const delay = typeof eff.delay_dygn === 'number' ? eff.delay_dygn : 0;
  if (!fromPending && delay > 0) {
    ws.pending.push({
      id: `npc_state:${eff.npc}:${eff.state}:${gameDay}`,
      due_day: gameDay + delay,
      effect: { typ: 'npc_state', npc: eff.npc, state: eff.state },
    });
    return;
  }
  ws.npc_states[eff.npc] = eff.state;
};
