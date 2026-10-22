import type { LocaleManager } from '../i18n/LocaleManager';
import { REGISTERED_LOCALES } from '../i18n/localeRegistry';
import { el } from './dom';

/** Språkval (Svenska/English) i huvudmenyn. Språknamnen visas alltid på respektive språk. */
export class LocalePicker {
  constructor(private readonly i18n: LocaleManager) {}

  render(): HTMLDivElement {
    const row = el('div', { class: 'lang-picker', role: 'group', 'aria-label': this.i18n.t('lang.label') });
    for (const loc of REGISTERED_LOCALES) {
      const b = el('button', {
        type: 'button',
        class: loc === this.i18n.locale ? 'lang sel' : 'lang',
        'data-locale': loc,
        lang: loc,
        'aria-pressed': String(loc === this.i18n.locale),
      });
      b.textContent = this.i18n.t(`lang.${loc}` as import('../i18n/types').Key);
      b.addEventListener('click', () => void this.i18n.setLocale(loc));
      row.append(b);
    }
    return row;
  }
}
