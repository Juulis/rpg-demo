const QUEST_ITEM_IDS = new Set([
  'flyktingens_sandaler',
  'viskarens_skalle',
  'ristarens_mejsel',
  'quest_ulvhilds_pals',
  'quest_gravvaktarnas_kronika',
  'quest_valdemars_signet',
]);

/** Logiskt föremåls-id (unika/legendary: id i `leg`, generisk bastyp i `base`). */
export function itemLogicId(it: { base: string; leg?: string }): string {
  return it.leg ?? it.base;
}

/** Questföremål (design: quest_* och listade unika quest-loot). */
export function isQuestItemId(itemId: string): boolean {
  return itemId.startsWith('quest_') || QUEST_ITEM_IDS.has(itemId);
}

/** Questföremål får inte slängas på marken eller säljas. */
export function isQuestItemProtected(it: { base: string; leg?: string }): boolean {
  return isQuestItemId(itemLogicId(it));
}

export function inventoryHasItemId(
  inv: {
    bag: readonly { base: string; leg?: string }[];
    equip: Readonly<Record<string, { base: string; leg?: string } | null | undefined>>;
  },
  id: string,
): boolean {
  const hit = (it: { base: string; leg?: string }) => it.base === id || it.leg === id;
  return inv.bag.some(hit) || Object.values(inv.equip).some((it) => it && hit(it));
}

/** Markloot på marken: jämför quest-/legendary-id (leg ?? base). */
export function groundHasItemId(
  drops: readonly { data: { item?: { base: string; leg?: string } } }[],
  id: string,
): boolean {
  return drops.some((d) => {
    const it = d.data.item;
    return !!it && itemLogicId(it) === id;
  });
}
