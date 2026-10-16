import type { EventBus } from '../core/EventBus';
import type { GameEvents, UiPanel } from '../core/events';
import type { HeroLoader } from '../save/HeroLoader';
import type { HeroRoster } from '../save/HeroRoster';
import { MAX_HEROES, classById, type SaveFile } from '../save/types';
import type { ConfirmDialog } from './ConfirmDialog';
import type { CreateHeroDialog } from './CreateHeroDialog';
import { button, el } from './dom';
import type { MenuAssets } from './MenuAssets';

/** Hjälteval: 8 platser, Fortsätt / Nytt game / Ny hjälte / Radera (med bekräftelse). Dubbelklick startar. */
export class HeroSelectMenu {
  static readonly PANEL: UiPanel = 'menu';
  readonly root: HTMLDivElement;
  private selected: string | null = null;
  private open = false;

  constructor(
    private readonly deps: {
      bus: EventBus<GameEvents>;
      roster: HeroRoster;
      loader: HeroLoader;
      onLeaveGame: () => void;
      assets: MenuAssets;
      create: CreateHeroDialog;
      confirm: ConfirmDialog;
    },
  ) {
    this.root = el('div', { class: 'hero-menu overlay hidden' });
    // tangenter i menyn ska inte nå spelet (Tab, M, …)
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
    this.root.addEventListener('keyup', (e) => e.stopPropagation());
  }

  get isOpen(): boolean {
    return this.open;
  }

  show(): void {
    this.deps.onLeaveGame();
    if (!this.open) {
      this.open = true;
      this.root.classList.remove('hidden');
      this.deps.bus.emit('ui_open', { panel: HeroSelectMenu.PANEL });
    }
    this.renderList();
  }

  hide(): void {
    if (!this.open) return;
    this.open = false;
    const ae = document.activeElement;
    if (ae instanceof HTMLElement && this.root.contains(ae)) ae.blur(); // namnfältet får inte behålla fokus (Tab/M)
    this.root.classList.add('hidden');
    this.deps.bus.emit('ui_close', { panel: HeroSelectMenu.PANEL });
  }

  private start(d: SaveFile, resume: boolean): void {
    this.hide();
    void this.deps.loader.start(d, resume);
  }

  renderList(): void {
    const { roster, assets } = this.deps;
    const hs = roster.list();
    if (!hs.some((h) => h.id === this.selected)) this.selected = roster.defaultSelection();
    const d = this.selected ? roster.load(this.selected) : null;
    const slots = el('div', { class: 'hero-slots' });
    for (let i = 0; i < MAX_HEROES; i++) {
      const h = hs[i];
      if (!h) {
        slots.append(el('div', { class: 'hslot empty' }));
        continue;
      }
      const slot = el(
        'div',
        { class: `hslot${h.id === this.selected ? ' sel' : ''}`, 'data-id': h.id },
        assets.portrait(h.cls),
        el(
          'div',
          { class: 'info' },
          el('b', { text: h.name }),
          el('small', { text: `${classById(h.cls)?.name ?? h.cls} · Nivå ${h.level}` }),
        ),
      );
      slot.addEventListener('click', () => {
        this.selected = h.id;
        this.renderList();
      });
      slot.addEventListener('dblclick', () => {
        const x = roster.load(h.id);
        if (x) this.start(x, !!x.game);
      });
      slots.append(slot);
    }
    const btns = el(
      'div',
      { class: 'btns' },
      button('Fortsätt', () => d?.game && this.start(d, true), !d?.game, 'hmCont'),
      button('Nytt game', () => d && this.start(d, false), !d, 'hmNewGame'),
      button('Ny hjälte', () => this.renderCreate(), hs.length >= MAX_HEROES, 'hmNewHero'),
      button('Radera hjälte', () => d && btns.replaceWith(this.confirmDelete(d)), !d, 'hmDel'),
    );
    this.root.replaceChildren(assets.title(), el('div', { class: 'rubrik', text: 'Välj hjälte' }), slots, btns);
  }

  private confirmDelete(d: SaveFile): HTMLElement {
    return this.deps.confirm.render(
      `Radera ${d.hero.name} för alltid?`,
      'Ja, radera',
      () => {
        this.deps.roster.delete(d.hero.id);
        this.selected = null;
        this.renderList();
      },
      () => this.renderList(),
    );
  }

  private renderCreate(): void {
    const { root, focus } = this.deps.create.render(
      (d) => {
        this.selected = d.hero.id;
        this.start(d, false);
      },
      () => this.renderList(),
    );
    this.root.replaceChildren(this.deps.assets.title(), el('div', { class: 'rubrik', text: 'Ny hjälte' }), root);
    focus();
  }
}
