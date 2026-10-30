const QUEST_ITEM_IDS = new Set([
  'flyktingens_sandaler',
  'viskarens_skalle',
  'ristarens_mejsel',
  'quest_ulvhilds_pals',
  'quest_gravvaktarnas_kronika',
  'quest_valdemars_signet',
]);

/** Questföremål (design: quest_* och listade unika quest-loot). */
export function isQuestItemId(itemId: string): boolean {
  return itemId.startsWith('quest_') || QUEST_ITEM_IDS.has(itemId);
}

/** Questföremål får inte slängas på marken eller säljas. */
export function isQuestItemProtected(it: { base: string }): boolean {
  return isQuestItemId(it.base);
}
