import { button, el } from './dom';

/** Bekräftelse inne i menyns knapprad (t.ex. "Radera X för alltid?"). */
export class ConfirmDialog {
  render(question: string, confirmLabel: string, onYes: () => void, onNo: () => void): HTMLDivElement {
    return el('div', { class: 'btns confirm' }, el('span', { text: question }), button(confirmLabel, onYes, false, 'hmYes'), button('Avbryt', onNo, false, 'hmNo'));
  }
}
