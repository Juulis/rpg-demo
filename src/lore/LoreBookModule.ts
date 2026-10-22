import { Disposables } from '../core/Disposables';
import type { GameContext, GameModule } from '../core/GameContext';
import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import { isTypingTarget } from '../core/keys';
import { DATA } from '../data/index';
import { assetUrl } from '../render/Assets';
import type { SaveBackendSource } from '../save/SaveBackendSource';
import { getNpcLocale } from '../npc/npcText';
import { LoreBookModel, type LorePieceRow } from './LoreBookModel';
import { registerLoreBookClose, setLoreBookOpen } from './LoreBookGate';
import './lorebook.css';

type TabId = 'set' | 'legendariska';

export class LoreBookModule implements GameModule {
  private readonly d = new Disposables();
  private readonly model = new LoreBookModel(DATA.lorebook);
  private ctx: GameContext | null = null;
  private open = false;
  private tab: TabId = 'set';
  private selected: string | null = null;
  private readonly root = document.createElement('div');
  private readonly toast = document.createElement('div');
  private grid!: HTMLDivElement;
  private detail!: HTMLDivElement;
  private progressEl!: HTMLDivElement;

  constructor(private readonly saves: SaveBackendSource) {}

  init(ctx: GameContext): void {
    this.ctx = ctx;
    this.buildDom();
    registerLoreBookClose(() => this.close());
    this.d.add(ctx.bus.on('hero_loaded', ({ heroId }) => void this.loadFound(heroId)));
    this.d.add(ctx.bus.on('pickup', ({ itemId, first }) => this.onPickup(ctx.bus, itemId, first)));
    this.d.add(ctx.bus.on('lore_unlock', ({ id }) => this.onLoreUnlock(id)));
    this.d.listen(window, 'keydown', (e) => this.onKey(e), { capture: true });
    void this.loadFound(ctx.hero.id);
  }

  dispose(): void {
    this.d.dispose();
    this.root.remove();
    this.toast.remove();
    setLoreBookOpen(false);
  }

  private buildDom(): void {
    this.root.id = 'loreBookWin';
    this.root.className = 'overlay hidden';
    this.root.innerHTML = `<div class="loreBook"><div class="loreHead"><span class="loreTitle"></span><button type="button" class="loreClose" aria-label="Stäng">✕</button></div>
      <div class="loreTabs"></div><div class="loreProgress"></div><div class="loreBody"><div class="loreGrid"></div><div class="loreDetail"></div></div></div>`;
    const tabs = this.root.querySelector('.loreTabs') as HTMLDivElement;
    for (const t of [
      { id: 'set' as TabId, sv: 'Set', en: 'Sets' },
      { id: 'legendariska' as TabId, sv: 'Legendariska', en: 'Legendaries' },
    ]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.tab = t.id;
      b.textContent = getNpcLocale() === 'en' ? t.en : t.sv;
      b.onclick = () => {
        this.tab = t.id;
        this.selected = null;
        this.render();
      };
      tabs.appendChild(b);
    }
    this.grid = this.root.querySelector('.loreGrid') as HTMLDivElement;
    this.detail = this.root.querySelector('.loreDetail') as HTMLDivElement;
    this.progressEl = this.root.querySelector('.loreProgress') as HTMLDivElement;
    (this.root.querySelector('.loreTitle') as HTMLElement).textContent = getNpcLocale() === 'en' ? 'Lorebook' : 'Lorebok';
    (this.root.querySelector('.loreClose') as HTMLButtonElement).onclick = () => this.close();
    document.body.appendChild(this.root);
    this.toast.id = 'loreToast';
    this.toast.className = 'hidden';
    document.body.appendChild(this.toast);
  }

  private async loadFound(heroId: string | null): Promise<void> {
    if (!heroId) {
      this.model.loadUnlocked([]);
      this.render();
      return;
    }
    const save = await this.saves.backend.load(heroId);
    const keys = save?.foundItems ? Object.keys(save.foundItems) : [];
    this.model.loadUnlocked(keys);
    this.render();
  }

  private onPickup(bus: EventBus<GameEvents>, itemId: string, first: boolean): void {
    if (!first) return;
    if (this.model.unlock(itemId)) bus.emit('lore_unlock', { id: itemId });
  }

  private onLoreUnlock(id: string): void {
    const row = this.model.pieces.get(id);
    const name = row?.name ?? id;
    const loc = getNpcLocale();
    const msg = loc === 'en' ? `New entry in the lorebook (H): ${name}` : `Ny post i loreboken (H): ${name}`;
    this.toast.textContent = msg;
    this.toast.classList.remove('hidden');
    window.setTimeout(() => this.toast.classList.add('hidden'), 4500);
    if (this.open) this.render();
  }

  private onKey(e: KeyboardEvent): void {
    if (isTypingTarget(document.activeElement)) return;
    if (e.key === 'Escape' && this.open) {
      e.preventDefault();
      e.stopPropagation();
      this.close();
      return;
    }
    if (e.key !== 'h' && e.key !== 'H') return;
    const playing = this.ctx?.hero.playing;
    if (!playing) return;
    e.preventDefault();
    this.toggle();
  }

  private toggle(): void {
    if (this.open) this.close();
    else this.openPanel();
  }

  private openPanel(): void {
    this.open = true;
    setLoreBookOpen(true);
    this.root.classList.remove('hidden');
    this.ctx?.bus.emit('ui_open', { panel: 'lore' });
    this.render();
  }

  private close(): void {
    if (!this.open) return;
    this.open = false;
    setLoreBookOpen(false);
    this.root.classList.add('hidden');
    this.ctx?.bus.emit('ui_close', { panel: 'lore' });
  }

  private render(): void {
    if (!this.open) return;
    const total = this.model.total();
    const found = this.model.foundCount();
    const cat = this.model.progressForCategory(this.tab);
    this.progressEl.textContent =
      getNpcLocale() === 'en'
        ? `${found}/${total} total · ${cat.found}/${cat.total} in tab`
        : `${found}/${total} totalt · ${cat.found}/${cat.total} i fliken`;
    this.grid.replaceChildren();
    if (this.tab === 'set') this.renderSetTab();
    else this.renderLegendTab();
    this.renderDetail();
    for (const btn of this.root.querySelectorAll<HTMLButtonElement>('.loreTabs button')) {
      btn.classList.toggle('active', btn.dataset.tab === this.tab);
    }
  }

  private renderSetTab(): void {
    for (const set of this.model.sets.values()) {
      const head = document.createElement('div');
      head.className = 'loreSetHead';
      head.textContent = set.name;
      this.grid.appendChild(head);
      const row = document.createElement('div');
      row.className = 'loreSetRow';
      for (const id of set.pieceIds) {
        row.appendChild(this.cellButton(this.model.pieces.get(id)));
      }
      this.grid.appendChild(row);
      if (this.model.setRevealed(set.id)) {
        const lore = document.createElement('p');
        lore.className = 'loreSetBlurb';
        lore.textContent = set.lore;
        this.grid.appendChild(lore);
      }
    }
  }

  private renderLegendTab(): void {
    const wrap = document.createElement('div');
    wrap.className = 'loreLegendGrid';
    for (const p of this.model.pieces.values()) {
      if (p.quality !== 'legendary') continue;
      wrap.appendChild(this.cellButton(p));
    }
    this.grid.appendChild(wrap);
  }

  private cellButton(row: LorePieceRow | undefined): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'loreCell';
    if (!row) return b;
    const unlocked = this.model.isUnlocked(row.id);
    b.classList.toggle('locked', !unlocked);
    b.classList.toggle('selected', this.selected === row.id);
    b.dataset.id = row.id;
    const q = row.quality === 'legendary' ? 'legendary' : 'set';
    b.style.borderColor = q === 'legendary' ? '#c7a35a' : '#3d8f4a';
    const icon = document.createElement('div');
    icon.className = 'loreIcon';
    if (unlocked) {
      const url = assetUrl(`ikoner/ram_${q}.png`);
      icon.style.backgroundImage = `url(${url})`;
      icon.title = row.name;
    } else {
      icon.textContent = '???';
    }
    b.appendChild(icon);
    if (unlocked) {
      const cap = document.createElement('span');
      cap.className = 'loreCellName';
      cap.textContent = row.name;
      b.appendChild(cap);
    }
    b.onclick = () => {
      this.selected = row.id;
      this.render();
    };
    return b;
  }

  private renderDetail(): void {
    this.detail.replaceChildren();
    const id = this.selected;
    if (!id) {
      this.detail.textContent = getNpcLocale() === 'en' ? 'Select an entry.' : 'Välj en post i listan.';
      return;
    }
    const row = this.model.pieces.get(id);
    if (!row) return;
    const unlocked = this.model.isUnlocked(id);
    const title = document.createElement('h2');
    title.textContent = unlocked ? row.name : '???';
    title.className = unlocked ? 'loreName unlocked' : 'loreName locked';
    this.detail.appendChild(title);
    if (!unlocked) {
      const hint = document.createElement('p');
      hint.className = 'loreHint';
      hint.textContent =
        getNpcLocale() === 'en'
          ? 'Find this item in the world to unlock its story.'
          : 'Hitta föremålet i världen för att låsa upp berättelsen.';
      this.detail.appendChild(hint);
      return;
    }
    const meta = document.createElement('p');
    meta.className = 'loreMeta';
    meta.textContent = row.item_level ? `${row.base} · nivå ${row.item_level}` : row.base;
    this.detail.appendChild(meta);
    const lore = document.createElement('p');
    lore.className = 'loreText';
    lore.textContent = row.lore;
    this.detail.appendChild(lore);
    const leg = DATA.items.legendary?.find((i) => i.id === row.id);
    if (leg?.fixed) {
      const stats = document.createElement('ul');
      stats.className = 'loreStats';
      for (const [k, v] of Object.entries(leg.fixed)) {
        const li = document.createElement('li');
        li.textContent = `${k}: ${typeof v === 'number' && v < 2 ? Math.round(v * 100) + '%' : String(v)}`;
        stats.appendChild(li);
      }
      this.detail.appendChild(stats);
    }
  }
}
