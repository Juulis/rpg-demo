import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import type { QuestDef } from '../data/questTypes';
import { choiceText, questDescription, questTitle, setQuestLocale, stepText } from '../quest/questText';
import { readQuestProgress } from '../quest/questProgress';
import type { Text } from '../text/Text';
import type { WorldState } from '../world/worldStateTypes';

export class QuestLog {
  private readonly root = document.createElement('div');
  private readonly list = document.createElement('div');
  private open = false;
  private snapshot: { active: QuestDef[]; done: QuestDef[] } = { active: [], done: [] };
  private world: Readonly<WorldState> | null = null;

  constructor(
    private readonly text: Text,
    bus: EventBus<GameEvents>,
  ) {
    this.root.id = 'quest-log';
    this.root.className = 'quest-log hidden';
    const title = document.createElement('div');
    title.className = 'quest-log-title';
    title.textContent = this.text.t('quest.log_title');
    this.list.className = 'quest-log-list';
    const hint = document.createElement('div');
    hint.className = 'quest-log-hint';
    hint.textContent = this.text.t('quest.log_hint');
    this.root.append(title, this.list, hint);
    document.body.appendChild(this.root);
    bus.on('locale_changed', ({ locale }) => {
      setQuestLocale(locale);
      title.textContent = this.text.t('quest.log_title');
      hint.textContent = this.text.t('quest.log_hint');
      this.render();
    });
  }

  get isOpen(): boolean {
    return this.open;
  }

  update(world: Readonly<WorldState>, active: QuestDef[], done: QuestDef[]): void {
    this.world = world;
    this.snapshot = { active, done };
    if (this.open) this.render();
  }

  toggle(): void {
    this.open = !this.open;
    this.root.classList.toggle('hidden', !this.open);
    if (this.open) this.render();
  }

  close(): void {
    this.open = false;
    this.root.classList.add('hidden');
  }

  private render(): void {
    this.list.replaceChildren();
    const ws = this.world;
    if (!ws) return;
    const addSection = (label: string, quests: QuestDef[]): void => {
      if (!quests.length) return;
      const h = document.createElement('div');
      h.className = 'quest-log-section';
      h.textContent = label;
      this.list.append(h);
      for (const q of quests) {
        const p = readQuestProgress(ws, q.id);
        const el = document.createElement('div');
        el.className = 'quest-log-entry';
        const name = document.createElement('b');
        name.textContent = questTitle(q);
        el.append(name);
        const desc = document.createElement('div');
        desc.className = 'quest-log-desc';
        desc.textContent = questDescription(q);
        el.append(desc);
        if (p.status === 'aktiv' && p.steg) {
          const step = q.steg.find((s) => s.id === p.steg);
          if (step) {
            const st = document.createElement('div');
            st.className = 'quest-log-step';
            st.textContent = stepText(q, step);
            el.append(st);
          }
        }
        if (p.status === 'klar' && p.val) {
          const ch = q.val?.find((c) => c.id === p.val);
          if (ch) {
            const st = document.createElement('div');
            st.className = 'quest-log-step';
            st.textContent = choiceText(q, ch);
            el.append(st);
          }
        }
        this.list.append(el);
      }
    };
    addSection(this.text.t('quest.section_active'), this.snapshot.active);
    addSection(this.text.t('quest.section_done'), this.snapshot.done);
  }

  dispose(): void {
    this.root.remove();
  }
}
