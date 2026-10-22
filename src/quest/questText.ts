import questEn from '../data/i18n/en/quests.json';
import type { QuestChoice, QuestDef, QuestStep } from '../data/questTypes';
import type { NpcLocale } from '../npc/npcText';

type EnQuest = {
  namn?: string;
  beskrivning?: string;
  steg?: Record<string, { text?: string }>;
  val?: Record<string, { text?: string }>;
  repliker?: Record<string, string>;
};

const EN = questEn as Record<string, EnQuest>;

let locale: NpcLocale = 'sv';

export function setQuestLocale(next: NpcLocale): void {
  locale = next;
}

function enBlock(questId: string): EnQuest | undefined {
  return EN[questId];
}

export function questTitle(def: QuestDef): string {
  if (locale === 'en') return enBlock(def.id)?.namn ?? def.namn;
  return def.namn;
}

export function questDescription(def: QuestDef): string {
  if (locale === 'en') return enBlock(def.id)?.beskrivning ?? def.beskrivning;
  return def.beskrivning;
}

export function stepText(def: QuestDef, step: QuestStep): string {
  if (locale === 'en') return enBlock(def.id)?.steg?.[step.id]?.text ?? step.text;
  return step.text;
}

export function choiceText(def: QuestDef, choice: QuestChoice): string {
  if (locale === 'en') return enBlock(def.id)?.val?.[choice.id]?.text ?? choice.text;
  return choice.text;
}

export function questReply(def: QuestDef, key: string, fallback = ''): string {
  if (locale === 'en') return enBlock(def.id)?.repliker?.[key] ?? def.repliker?.[key] ?? fallback;
  return def.repliker?.[key] ?? fallback;
}
