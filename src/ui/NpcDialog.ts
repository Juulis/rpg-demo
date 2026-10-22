import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import { setDialogLocale } from '../npc/dialogText';
import { npcName, setNpcLocale } from '../npc/npcText';
import { setRumorLocale } from '../rumor/rumorText';
import type { ResolvedNpc } from '../npc/npcPlacement';
import type { Text } from '../text/Text';

/** Enkel pratruta (Esc stänger). */
export class NpcDialog {
  private readonly root = document.createElement('div');
  private readonly row = document.createElement('div');
  private readonly portrait = document.createElement('img');
  private readonly textCol = document.createElement('div');
  private readonly title = document.createElement('div');
  private readonly body = document.createElement('div');
  private readonly hint = document.createElement('div');
  private open = false;
  private current: ResolvedNpc | null = null;
  private portraitUrl: string | null = null;
  private bodyText: string | null = null;

  constructor(
    private readonly text: Text,
    bus: EventBus<GameEvents>,
  ) {
    this.root.id = 'npc-dialog';
    this.root.className = 'npc-dialog hidden';
    this.row.className = 'npc-dialog-row';
    this.portrait.className = 'npc-dialog-portrait hidden';
    this.portrait.alt = '';
    this.textCol.className = 'npc-dialog-text';
    this.title.className = 'npc-dialog-title';
    this.body.className = 'npc-dialog-body';
    this.hint.className = 'npc-dialog-hint';
    this.hint.textContent = 'Esc';
    this.textCol.append(this.title, this.body, this.hint);
    this.row.append(this.portrait, this.textCol);
    this.root.append(this.row);
    document.body.appendChild(this.root);
    bus.on('locale_changed', ({ locale }) => {
      setNpcLocale(locale);
      setDialogLocale(locale);
      setRumorLocale(locale);
      if (this.open && this.current) this.render(this.current, this.portraitUrl, this.bodyText);
    });
  }

  get isOpen(): boolean {
    return this.open;
  }

  show(npc: ResolvedNpc, portraitUrl: string | null = null, body: string | null = null): void {
    this.current = npc;
    this.portraitUrl = portraitUrl;
    this.bodyText = body;
    this.open = true;
    this.root.classList.remove('hidden');
    this.render(npc, portraitUrl, body);
  }

  close(): void {
    this.open = false;
    this.current = null;
    this.portraitUrl = null;
    this.bodyText = null;
    this.root.classList.add('hidden');
    this.portrait.classList.add('hidden');
  }

  private render(npc: ResolvedNpc, portraitUrl: string | null, body: string | null): void {
    this.title.textContent = npcName(this.text, npc.def);
    this.body.textContent = body ?? npc.line;
    if (portraitUrl) {
      this.portrait.src = portraitUrl;
      this.portrait.classList.remove('hidden');
    } else {
      this.portrait.removeAttribute('src');
      this.portrait.classList.add('hidden');
    }
  }

  dispose(): void {
    this.root.remove();
  }
}
