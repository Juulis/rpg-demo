import { Disposables } from '../core/Disposables';
import type { GameContext, GameModule } from '../core/GameContext';
import { isTypingTarget } from '../core/keys';
import type { SaveBackendSource } from '../save/SaveBackendSource';
import { AudioEngine } from './AudioEngine';
import { AudioEventBinder } from './AudioEventBinder';
import { SfxLibrary } from './SfxLibrary';
import { VolumeControl } from './VolumeControl';
import { VolumeWidget } from './VolumeWidget';

/** Ljudmodulen (issue #5): sätter ihop motor, bibliotek, volym, event-koppling, M-tangent och volymreglage. */
export class AudioModule implements GameModule {
  readonly volume = new VolumeControl();
  readonly engine: AudioEngine;
  private readonly d = new Disposables();
  private widget: VolumeWidget | null = null;

  constructor(
    private readonly saves: SaveBackendSource,
    private readonly widgetHost: () => HTMLElement | null = () => document.getElementById('plate'),
    engine?: AudioEngine,
  ) {
    this.engine = engine ?? new AudioEngine(new SfxLibrary(), this.volume);
  }

  init(ctx: GameContext): void {
    void this.volume.bind(this.saves.backend);
    for (const off of new AudioEventBinder(this.engine).bind(ctx.bus)) this.d.add(off);
    const unlock = (): void => this.engine.unlock();
    for (const t of ['pointerdown', 'keydown', 'touchstart'] as const) this.d.listen(window, t, unlock, { capture: true, passive: true });
    this.d.listen(window, 'keydown', (e) => this.onKey(e));
    const host = this.widgetHost();
    if (host) {
      this.widget = new VolumeWidget(this.volume, {
        onInteract: unlock,
        onToggle: () => this.toggleMute(),
        onCommit: () => this.engine.play('click'),
      });
      this.widget.mount(host);
    }
  }

  toggleMute(): void {
    if (!this.volume.toggleMute()) this.engine.play('toggle');
  }

  private onKey(e: KeyboardEvent): void {
    if (e.code !== 'KeyM' || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
    if (isTypingTarget(e.target)) return;
    this.toggleMute();
  }

  dispose(): void {
    this.d.dispose();
    this.widget?.dispose();
    this.widget = null;
    this.engine.dispose();
  }
}
