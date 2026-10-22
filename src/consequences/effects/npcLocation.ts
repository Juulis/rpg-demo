import type { EffectModule } from '../types';

export const npcLocation: EffectModule = (eff, { ws }) => {
  if (typeof eff.npc !== 'string') return;
  const key = `${eff.omrade ?? ''}:${eff.plats ?? ''}`;
  ws.npc_locations[eff.npc] = key;
};
