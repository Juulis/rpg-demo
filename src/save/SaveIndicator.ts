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

  private titleText(): string {
    return this.i18n?.t('save.saved') ?? 'Sparat';
  }

  show(): void {
    this.el.title = this.titleText();
    if (!this.el.isConnected) this.host.appendChild(this.el);
    this.el.classList.add('on');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.el.classList.remove('on'), this.visibleMs);
  }

  dispose(): void {
    clearTimeout(this.timer);
    this.el.remove();
  }
}
