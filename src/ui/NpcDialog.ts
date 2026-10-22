import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import { npcLine, npcName, setNpcLocale } from '../npc/npcText';
import type { ResolvedNpc } from '../npc/npcPlacement';
import type { Text } from '../text/Text';

/** Enkel pratruta (Esc stänger). */
export class NpcDialog {
  private readonly root = document.createElement('div');
  private readonly title = document.createElement('div');
  private readonly body = document.createElement('div');
  private readonly hint = document.createElement('div');
  private open = false;
  private current: ResolvedNpc | null = null;

  constructor(
    private readonly text: Text,
    bus: EventBus<GameEvents>,
  ) {
    this.root.id = 'npc-dialog';
    this.root.className = 'npc-dialog hidden';
    this.root.innerHTML = '';
    this.title.className = 'npc-dialog-title';
    this.body.className = 'npc-dialog-body';
    this.hint.className = 'npc-dialog-hint';
    this.hint.textContent = 'Esc';
    this.root.append(this.title, this.body, this.hint);
    document.body.appendChild(this.root);
    bus.on('locale_changed', ({ locale }) => {
      setNpcLocale(locale);
      if (this.open && this.current) this.render(this.current);
    });
  }

  get isOpen(): boolean {
    return this.open;
  }

  show(npc: ResolvedNpc): void {
    this.current = npc;
    this.open = true;
    this.root.classList.remove('hidden');
    this.render(npc);
  }

  close(): void {
    this.open = false;
    this.current = null;
    this.root.classList.add('hidden');
  }

  private render(npc: ResolvedNpc): void {
    this.title.textContent = npcName(this.text, npc.def);
    this.body.textContent = npcLine(this.text, npc.def, npc.line);
  }

  dispose(): void {
    this.root.remove();
  }
}
