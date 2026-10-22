import raw from '../../spel/design/dialoger.json';
import { isRecord } from '../core/json';
import type { DialogDataFile, DialogLineDef, DialogTyp } from '../data/dialogTypes';

interface DesignDialogLine {
  id: string;
  typ: DialogTyp;
  text: string;
  villkor?: unknown;
}

interface DesignNpcDialog {
  npc: string;
  repliker: DesignDialogLine[];
}

interface DesignDialogFile {
  meta?: DialogDataFile['meta'];
  npcs: DesignNpcDialog[];
}

function normalizeVillkor(villkor: unknown): unknown {
  if (villkor === null || villkor === undefined) return true;
  if (isRecord(villkor) && Object.keys(villkor).length === 0) return true;
  return villkor;
}

/** Designer `spel/design/dialoger.json` → runtime shape for dialogPick / validateData. */
export function buildDialogDataFromDesign(): DialogDataFile {
  const file = raw as unknown as DesignDialogFile;
  const npcs: Record<string, Partial<Record<DialogTyp, DialogLineDef[]>>> = {};

  for (const block of file.npcs) {
    const npcId = block.npc;
    if (!npcs[npcId]) npcs[npcId] = {};
    for (const line of block.repliker) {
      const typ = line.typ;
      const bucket = npcs[npcId][typ] ?? [];
      bucket.push({
        id: line.id,
        text: line.text,
        villkor: normalizeVillkor(line.villkor),
      });
      npcs[npcId][typ] = bucket;
    }
  }

  return { meta: file.meta, npcs };
}

export const DIALOG_DATA: DialogDataFile = buildDialogDataFromDesign();
