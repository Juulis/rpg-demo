import type { EffectModule } from '../types';

export const npcFaction: EffectModule = (eff, { ws }) => {
  if (typeof eff.npc !== 'string' || typeof eff.faktion !== 'string') return;
  ws.npc_factions[eff.npc] = eff.faktion;
};
