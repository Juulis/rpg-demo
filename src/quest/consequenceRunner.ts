import type { WorldStateService } from '../world/WorldStateService';

/** Kör designer `consequences` mot world_state (#42 / varld.md). */
export function applyConsequences(world: WorldStateService, effects: Record<string, unknown>[], gameDay: number): void {
  const ws = world.snapshot();
  for (const eff of effects) {
    const typ = String(eff.typ ?? '');
    if (typ === 'flag_set' && typeof eff.flag === 'string') {
      ws.flags[eff.flag] = eff.value !== false && eff.value !== 0 && eff.value !== '';
    }
    if (typ === 'value_add' && typeof eff.key === 'string' && typeof eff.delta === 'number') {
      ws.values[eff.key] = (ws.values[eff.key] ?? 0) + eff.delta;
    }
    if (typ === 'faction_rep' && typeof eff.faktion === 'string' && typeof eff.delta === 'number') {
      ws.faction_rep[eff.faktion] = (ws.faction_rep[eff.faktion] ?? 0) + eff.delta;
    }
    if (typ === 'npc_state' && typeof eff.npc === 'string' && typeof eff.state === 'string') {
      const delay = typeof eff.delay_dygn === 'number' ? eff.delay_dygn : 0;
      if (delay > 0) {
        ws.pending.push({
          id: `npc_state:${eff.npc}:${eff.state}`,
          due_day: gameDay + delay,
          effect: { typ: 'npc_state', npc: eff.npc, state: eff.state },
        });
      } else ws.npc_states[eff.npc] = eff.state;
    }
    if (typ === 'npc_location' && typeof eff.npc === 'string') {
      const key = `${eff.omrade ?? ''}:${eff.plats ?? ''}`;
      ws.npc_locations[eff.npc] = key;
    }
    if (typ === 'npc_faction' && typeof eff.npc === 'string' && typeof eff.faktion === 'string') {
      ws.npc_factions[eff.npc] = eff.faktion;
    }
    if (typ === 'town_growth' && typeof eff.town === 'string' && typeof eff.delta === 'number') {
      ws.town_growth[eff.town] = (ws.town_growth[eff.town] ?? 0) + eff.delta;
    }
    if (typ === 'merchant_stock' && typeof eff.npc === 'string') {
      ws.merchant_mods[eff.npc] =
        (ws.merchant_mods[eff.npc] ?? 0) + (typeof eff.prisfaktor_mult === 'number' ? eff.prisfaktor_mult - 1 : 0);
    }
    if (typ === 'area_change' && typeof eff.region === 'string') {
      const k = `${eff.region}:${eff.andring ?? ''}:${eff.ankare ?? ''}`;
      ws.area_changes[k] = JSON.stringify(eff.value ?? null);
    }
    if (typ === 'rumor_add' && typeof eff.rykte === 'string') {
      ws.rumors_active[eff.rykte] = { since_day: gameDay };
    }
    if (typ === 'quest_exclude' && typeof eff.quest === 'string') {
      const tag = eff.val ? `${eff.quest}:${eff.val}` : eff.quest;
      if (!ws.quest_excludes.includes(tag)) ws.quest_excludes.push(tag);
    }
    if (typ === 'quest_alt_giver' && typeof eff.quest === 'string' && typeof eff.npc === 'string') {
      ws.flags[`quest_alt_giver:${eff.quest}`] = true;
      ws.npc_locations[`givare:${eff.quest}`] = eff.npc;
    }
    if (typ === 'item_grant' && typeof eff.item === 'string') {
      ws.flags[`item_grant_pending:${eff.item}`] = true;
    }
    if (typ === 'xp_grant' && typeof eff.amount === 'number') {
      ws.values.quest_xp_pending = (ws.values.quest_xp_pending ?? 0) + eff.amount;
    }
  }
  world.replace(ws);
  world.tickPending(gameDay);
}
