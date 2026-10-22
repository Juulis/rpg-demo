/** Designer build order (quests.json meta.konsekvenssystem.bygg_ordning). */
export const CONSEQUENCE_BUILD_ORDER: readonly string[] = [
  'flag_set',
  'item_grant',
  'xp_grant',
  'rumor_add',
  'faction_rep',
  'npc_state',
  'npc_location',
  'merchant_stock',
  'town_growth',
  'area_change',
  'npc_faction',
  'quest_exclude',
  'quest_alt_giver',
  'value_add',
];

export function consequenceTypeRank(typ: string): number {
  const i = CONSEQUENCE_BUILD_ORDER.indexOf(typ);
  return i >= 0 ? i : CONSEQUENCE_BUILD_ORDER.length;
}
