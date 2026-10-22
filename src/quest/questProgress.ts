import type { QuestProgress, QuestStatus } from '../data/questTypes';
import type { WorldState } from '../world/worldStateTypes';
import { isRecord } from '../core/json';

export function readQuestProgress(world: Readonly<WorldState>, questId: string): QuestProgress {
  const raw = world.quests[questId];
  if (!isRecord(raw)) return { status: 'ej_startad' };
  const status = String(raw.status ?? 'ej_startad') as QuestStatus;
  return {
    status,
    ...(typeof raw.steg === 'string' ? { steg: raw.steg } : {}),
    ...(typeof raw.val === 'string' ? { val: raw.val } : {}),
    ...(typeof raw.givare === 'string' ? { givare: raw.givare } : {}),
    ...(Array.isArray(raw.inspekterat) ? { inspekterat: raw.inspekterat.filter((x): x is string => typeof x === 'string') } : {}),
  };
}

export function writeQuestProgress(world: WorldState, questId: string, next: QuestProgress): void {
  world.quests[questId] = { ...next };
}
