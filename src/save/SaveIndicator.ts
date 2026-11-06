import { assetUrl } from '../core/assets';
import type { LocaleManager } from '../i18n/LocaleManager';

/** Sparikonen uppe till höger som tonas in kort efter varje sparning. */
export class SaveIndicator {
  private readonly el: HTMLDivElement;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly i18n?: LocaleManager,
    private readonly host: HTMLElement = document.body,
    private readonly visibleMs = 900,
  ) {
    this.el = document.createElement('div');
    this.el.className = 'save-icon';
    this.el.title = this.titleText();
    this.el.style.backgroundImage = `url(${assetUrl('ui/save.webp')})`;
  }

  private titleText(success = true): string {
    return success ? (this.i18n?.t('save.saved') ?? 'Sparat') : (this.i18n?.t('save.failed') ?? 'Kunde inte spara spelet.');
  }

  show(): void {
    this.el.title = this.titleText(true);
    if (!this.el.isConnected) this.host.appendChild(this.el);
    this.el.classList.remove('save-error');
    this.el.classList.add('on');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.el.classList.remove('on'), this.visibleMs);
  }

  showError(): void {
    this.el.title = this.titleText(false);
    if (!this.el.isConnected) this.host.appendChild(this.el);
    this.el.classList.add('on', 'save-error');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.el.classList.remove('on', 'save-error');
    }, this.visibleMs);
  }

  dispose(): void {
    clearTimeout(this.timer);
    this.el.remove();
  }
}
