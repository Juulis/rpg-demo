import type { HeroRoster } from '../save/HeroRoster';
import { HERO_CLASSES, type SaveFile } from '../save/types';
import { button, el } from './dom';
import type { MenuAssets } from './MenuAssets';

/** Ny hjälte: välj klass, namn med validering i realtid, Enter skapar. */
export class CreateHeroDialog {
  private cls = 'riddare';

  constructor(
    private readonly roster: HeroRoster,
    private readonly assets: MenuAssets,
  ) {}

  render(onCreated: (d: SaveFile) => void, onBack: () => void): { root: HTMLElement; focus: () => void } {
    this.cls = 'riddare';
    const row = el('div', { class: 'clsrow' });
    const btns = HERO_CLASSES.map((c) => {
      const b = el(
        'div',
        { class: `clsbtn${c.id === this.cls ? ' sel' : ''}`, 'data-c': c.id },
        this.assets.portrait(c.id),
        el('span', { text: c.name }),
      );
      b.addEventListener('click', () => {
        this.cls = c.id;
        btns.forEach((x) => x.classList.toggle('sel', x === b));
      });
      return b;
    });
    row.append(...btns);
    const input = el('input', { class: 'hero-name', maxlength: '16', placeholder: 'Namn (2–16 tecken)', autocomplete: 'off' });
    const err = el('div', { class: 'hero-err' });
    input.addEventListener('input', () => {
      err.textContent = input.value.trim().length >= 2 ? this.roster.validName(input.value) : '';
    });
    const ok = (): void => {
      const e = this.roster.validName(input.value);
      if (e) {
        err.textContent = e;
        return;
      }
      this.roster.create(input.value, this.cls).then(onCreated, (x: unknown) => {
        err.textContent = x instanceof Error ? x.message : String(x);
      });
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') ok();
    });
    const root = el(
      'div',
      { class: 'hero-new' },
      row,
      input,
      err,
      el('div', { class: 'btns' }, button('Skapa och spela', ok, false, 'hnOk'), button('Tillbaka', onBack, false, 'hnBack')),
    );
    return { root, focus: () => input.focus() };
  }
}
