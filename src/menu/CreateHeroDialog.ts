import type { LocaleManager } from '../i18n/LocaleManager';
import type { Key } from '../i18n/types';
import type { HeroRoster } from '../save/HeroRoster';
import { HERO_CLASSES, type SaveFile } from '../save/types';
import { button, el } from './dom';
import type { MenuAssets } from './MenuAssets';

const NAME_MIN = 2;
const NAME_MAX = 16;

/** Ny hjälte: välj klass, namn med validering i realtid, Enter skapar. */
export class CreateHeroDialog {
  private cls = 'riddare';

  constructor(
    private readonly roster: HeroRoster,
    private readonly assets: MenuAssets,
    private readonly i18n: LocaleManager,
  ) {}

  private rosterMsg(s: string): string {
    if (!s) return '';
    if (s.startsWith('Namnet måste vara')) return this.i18n.t('errors.name_length', { min: NAME_MIN, max: NAME_MAX });
    if (s.startsWith('Bara bokstäver')) return this.i18n.t('errors.name_chars');
    if (s.startsWith('Det finns redan')) return this.i18n.t('errors.name_taken');
    if (s.startsWith('Alla hjälteplatser')) return this.i18n.t('errors.slots_full');
    return s;
  }

  render(onCreated: (d: SaveFile) => void, onBack: () => void): { root: HTMLElement; focus: () => void } {
    this.cls = 'riddare';
    const row = el('div', { class: 'clsrow' });
    const btns = HERO_CLASSES.map((c) => {
      const b = el(
        'div',
        { class: `clsbtn${c.id === this.cls ? ' sel' : ''}`, 'data-c': c.id },
        this.assets.portrait(c.id),
        el('span', { text: this.i18n.t(`classes.${c.id}` as Key) }),
      );
      b.addEventListener('click', () => {
        this.cls = c.id;
        btns.forEach((x) => x.classList.toggle('sel', x === b));
      });
      return b;
    });
    row.append(...btns);
    const input = el('input', {
      class: 'hero-name',
      maxlength: String(NAME_MAX),
      placeholder: this.i18n.t('menu.name_placeholder', { min: NAME_MIN, max: NAME_MAX }),
      autocomplete: 'off',
    });
    const err = el('div', { class: 'hero-err' });
    input.addEventListener('input', () => {
      err.textContent = input.value.trim().length >= NAME_MIN ? this.rosterMsg(this.roster.validName(input.value)) : '';
    });
    const ok = (): void => {
      const e = this.roster.validName(input.value);
      if (e) {
        err.textContent = this.rosterMsg(e);
        return;
      }
      this.roster.create(input.value, this.cls).then(onCreated, (x: unknown) => {
        err.textContent = x instanceof Error ? this.rosterMsg(x.message) : String(x);
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
      el(
        'div',
        { class: 'btns' },
        button(this.i18n.t('menu.create_play'), ok, false, 'hnOk'),
        button(this.i18n.t('common.back'), onBack, false, 'hnBack'),
      ),
    );
    return { root, focus: () => input.focus() };
  }
}
