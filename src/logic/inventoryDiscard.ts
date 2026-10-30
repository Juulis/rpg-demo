import type { Item } from './loot/types';
import { isQuestItemProtected } from '../quest/questItems';

/** Kräver bekräftelse innan föremålet slängs på marken (ej questföremål — de blockeras helt). */
export function discardNeedsConfirm(it: Item): boolean {
  if (isQuestItemProtected(it)) return false;
  const q = it.quality;
  if (q === 'legendary' || q === 'set') return true;
  if (it.leg) return true;
  if (it.rareName) return true;
  return false;
}
