import { factionMood, npcFaction } from '../consequences/factionRep';
import { consequenceNotifyText } from '../consequences/notifyText';
import type { WorldState } from '../world/worldStateTypes';

/** Lägger till varm/kall hälsning när fraktionsrykte passerar trösklar (#43). */
export function applyFactionGreetingTone(npcId: string, world: WorldState, base: string): string {
  const faction = npcFaction(npcId, world.npc_factions);
  if (!faction) return base;
  const rep = world.faction_rep[faction] ?? 0;
  const mood = factionMood(rep);
  if (mood === 'neutral') return base;
  const extra = consequenceNotifyText(mood === 'warm' ? 'consequence.greeting_warm' : 'consequence.greeting_cold');
  return `${base}\n\n${extra}`;
}
