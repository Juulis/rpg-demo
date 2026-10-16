import { assetUrl } from '../core/assets';

/** Sparikonen uppe till höger som tonas in kort efter varje sparning. */
export class SaveIndicator {
  private readonly el: HTMLDivElement;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly host: HTMLElement = document.body,
    private readonly visibleMs = 900,
  ) {
    this.el = document.createElement('div');
    this.el.className = 'save-icon';
    this.el.title = 'Sparat';
    this.el.style.backgroundImage = `url(${assetUrl('ui/save.webp')})`;
  }

  show(): void {
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
