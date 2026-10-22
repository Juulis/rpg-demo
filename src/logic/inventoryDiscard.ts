import type { Item } from './loot/types';
import { isQuestItemId } from '../quest/questItems';

/** Kräver bekräftelse innan föremålet slängs på marken. */
export function discardNeedsConfirm(it: Item): boolean {
  if (isQuestItemId(it.base)) return true;
  const q = it.quality;
  if (q === 'legendary' || q === 'set') return true;
  if (it.leg) return true;
  if (it.rareName) return true;
  return false;
}
