import type { LocaleManager } from '../i18n/LocaleManager';
import type { VolumeControl } from './VolumeControl';

/** Ljudknapp + volymreglage (svenska etiketter). Klick når inte spelets canvas. */
export class VolumeWidget {
  readonly root: HTMLSpanElement;
  private readonly btn: HTMLButtonElement;
  private readonly range: HTMLInputElement;
  private readonly unsubs: Array<() => void>;

  constructor(
    private readonly volume: VolumeControl,
    private readonly i18n: LocaleManager,
    actions: { onInteract: () => void; onToggle: () => void; onCommit: () => void },
  ) {
    this.root = document.createElement('span');
    this.root.className = 'sfx-ctl';
    this.btn = document.createElement('button');
    this.btn.type = 'button';
    this.range = document.createElement('input');
    Object.assign(this.range, { type: 'range', min: '0', max: '100', step: '5' });
    this.btn.addEventListener('click', (e) => {
      e.stopPropagation();
      actions.onInteract();
      actions.onToggle();
      this.btn.blur();
    });
    this.range.addEventListener('input', () => {
      actions.onInteract();
      this.volume.setVolume(Number(this.range.value) / 100);
    });
    this.range.addEventListener('change', () => {
      actions.onCommit();
      this.range.blur();
    });
    for (const t of ['pointerdown', 'mousedown', 'click']) this.root.addEventListener(t, (e) => e.stopPropagation());
    this.root.append(this.btn, this.range);
    this.unsubs = [volume.onChange(() => this.sync()), i18n.onChange(() => this.sync())];
    this.sync();
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.root);
  }

  sync(): void {
    const silent = this.volume.isMuted || this.volume.volume === 0;
    this.btn.textContent = silent ? '🔇' : '🔊';
    this.btn.title = this.i18n.t(this.volume.isMuted ? 'audio.sound_off' : 'audio.sound_on');
    this.range.title = this.i18n.t('audio.volume');
    this.range.setAttribute('aria-label', this.range.title);
    this.range.value = String(Math.round(this.volume.volume * 100));
  }

  dispose(): void {
    this.unsubs.forEach((u) => u());
    this.root.remove();
  }
}
