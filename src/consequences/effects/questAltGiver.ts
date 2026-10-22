import type { EffectModule } from '../types';

export const questAltGiver: EffectModule = (eff, { ws }) => {
  if (typeof eff.quest !== 'string' || typeof eff.npc !== 'string') return;
  ws.flags[`quest_alt_giver:${eff.quest}`] = true;
  ws.npc_locations[`givare:${eff.quest}`] = eff.npc;
};
