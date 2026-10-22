import dialogFile from '../data/dialoger.json';
import type { DialogDataFile, DialogLineDef, DialogTyp } from '../data/dialogTypes';
import { evaluateCondition, type ConditionContext } from '../world/evaluateCondition';

const data = dialogFile as unknown as DialogDataFile;

/** Första repliken av typen vars villkor är sant (listor sorterade mest specifik först). */
export function pickDialogLine(npcId: string, typ: DialogTyp, ctx: ConditionContext): DialogLineDef | null {
  const block = data.npcs[npcId]?.[typ];
  if (!block?.length) return null;
  for (const line of block) {
    if (evaluateCondition(line.villkor ?? true, ctx)) return line;
  }
  return null;
}

export function dialogNpcIds(): string[] {
  return Object.keys(data.npcs);
}
