import { clampFactionRep } from '../factionRep';
import type { EffectModule } from '../types';

export const factionRep: EffectModule = (eff, { ws, notifyKey }) => {
  if (typeof eff.faktion !== 'string' || typeof eff.delta !== 'number') return;
  const before = ws.faction_rep[eff.faktion] ?? 0;
  const after = clampFactionRep(before + eff.delta);
  ws.faction_rep[eff.faktion] = after;
  if (eff.delta > 0) notifyKey('consequence.faction_up', { faction: eff.faktion });
  else if (eff.delta < 0) notifyKey('consequence.faction_down', { faction: eff.faktion });
};
