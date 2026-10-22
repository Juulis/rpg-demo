import type { DialogLineDef, DialogTyp } from '../data/dialogTypes';
import { DIALOG_DATA } from './designDialoger';
import { evaluateCondition, type ConditionContext } from '../world/evaluateCondition';

const data = DIALOG_DATA;

/** Sista repliken av typen vars villkor är sant (designfiler listar standard först, specifikt sist). */
export function pickDialogLine(npcId: string, typ: DialogTyp, ctx: ConditionContext): DialogLineDef | null {
  const block = data.npcs[npcId]?.[typ];
  if (!block?.length) return null;
  let picked: DialogLineDef | null = null;
  for (const line of block) {
    if (evaluateCondition(line.villkor ?? true, ctx)) picked = line;
  }
  return picked;
}

export function dialogNpcIds(): string[] {
  return Object.keys(data.npcs);
}
