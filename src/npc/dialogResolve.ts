import type { NpcDef } from '../data/npcTypes';
import { dialogLineText } from './dialogText';
import { pickDialogLine } from './dialogPick';
import type { DialogTyp } from '../data/dialogTypes';
import { npcLine } from './npcText';
import type { Text } from '../text/Text';
import type { ConditionContext } from '../world/evaluateCondition';

/** Lokaliserad replik för en dialogtyp, med fallback till npc default_line. */
export function resolveDialogText(def: NpcDef, typ: DialogTyp, ctx: ConditionContext, text: Text): string {
  const picked = pickDialogLine(def.id, typ, ctx);
  if (picked) return dialogLineText(def.id, typ, picked.id, picked.text, text);
  return npcLine(text, def);
}
