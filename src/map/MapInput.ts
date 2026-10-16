import { Disposables } from '../core/Disposables';
import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import { isTypingTarget } from '../core/keys';

/**
 * Tab-regler (som js/map.js):
 * - textfält i fokus eller annan panel öppen (ui_open/ui_close): Tab släpps igenom, ingen preventDefault;
 * - annars preventDefault (fokus får inte hoppa), och kartan växlar bara när man spelar och inte vid autorepeat.
 */
export class MapInput {
  private readonly openPanels = new Set<string>();
  private readonly d = new Disposables();

  constructor(
    private readonly isPlaying: () => boolean,
    private readonly onToggle: () => void,
  ) {}

  bind(bus: EventBus<GameEvents>, target: Window = window): void {
    this.d.add(bus.on('ui_open', ({ panel }) => this.openPanels.add(panel)));
    this.d.add(bus.on('ui_close', ({ panel }) => this.openPanels.delete(panel)));
    this.d.listen(target, 'keydown', (e) => this.onKey(e), { capture: true });
  }

  /** Öppen panel enligt bussen, eller en synlig .overlay (fångar paneler som öppnades före kartans init). */
  get panelOpen(): boolean {
    return this.openPanels.size > 0 || document.querySelector('.overlay:not(.hidden)') !== null;
  }

  onKey(e: KeyboardEvent): void {
    if (e.key !== 'Tab' && e.code !== 'Tab') return;
    if (this.panelOpen || isTypingTarget(document.activeElement)) return;
    e.preventDefault();
    if (e.repeat || !this.isPlaying()) return;
    this.onToggle();
  }

  dispose(): void {
    this.d.dispose();
    this.openPanels.clear();
  }
}
