import questsFile from '../data/quests.json';
import type { QuestDataFile, QuestDef } from '../data/questTypes';

const data = questsFile as unknown as QuestDataFile;

export function act1Quests(): readonly QuestDef[] {
  return data.akt_1;
}

export function questById(id: string): QuestDef | undefined {
  return data.akt_1.find((q) => q.id === id);
}

export function questDataMeta(): QuestDataFile['meta'] {
  return data.meta;
}
