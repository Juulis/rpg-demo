import type { LocaleManager } from '../i18n/LocaleManager';
import { button, el } from './dom';

/** Bekräftelse inne i menyns knapprad (t.ex. "Radera X för alltid?"). */
export class ConfirmDialog {
  constructor(private readonly i18n: LocaleManager) {}

  render(question: string, confirmLabel: string, onYes: () => void, onNo: () => void): HTMLDivElement {
    return el(
      'div',
      { class: 'btns confirm' },
      el('span', { text: question }),
      button(confirmLabel, onYes, false, 'hmYes'),
      button(this.i18n.t('common.cancel'), onNo, false, 'hmNo'),
    );
  }
}
