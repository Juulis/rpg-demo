import type { Input } from '../input/Input';
import { devCheatsEnabled, getDevCheatsState, setDevCheat, type DevCheatId } from './DevCheats';

const LABELS: Record<DevCheatId, string> = {
  xp5: 'XP x5',
  mf100: 'Magic find x100',
};

/** Tunn DOM-vy för utvecklarfusk (F10). Ingen spellogik här. */
export class DevCheatsView {
  private readonly panel: HTMLDivElement;
  private readonly checks: Record<DevCheatId, HTMLInputElement>;
  private open = false;

  constructor(input: Input) {
    this.panel = document.createElement('div');
    this.panel.id = 'dev-cheats';
    this.panel.className = 'dev-cheats hidden';
    this.panel.innerHTML = `<div class="dev-cheats-title">Utvecklarfusk</div><div class="dev-cheats-hint">F10 · stäng</div>`;
    const body = document.createElement('div');
    body.className = 'dev-cheats-body';
    this.checks = {} as Record<DevCheatId, HTMLInputElement>;
    for (const id of ['xp5', 'mf100'] as const) {
      const row = document.createElement('label');
      row.className = 'dev-cheats-row';
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = getDevCheatsState()[id];
      box.addEventListener('change', () => setDevCheat(id, box.checked));
      const span = document.createElement('span');
      span.textContent = LABELS[id];
      row.append(box, span);
      body.appendChild(row);
      this.checks[id] = box;
    }
    this.panel.appendChild(body);
    for (const t of ['pointerdown', 'mousedown', 'click', 'keydown']) {
      this.panel.addEventListener(t, (e) => e.stopPropagation());
    }
    document.body.appendChild(this.panel);
    input.bind('F10', () => this.toggle());
  }

  static tryCreate(input: Input): DevCheatsView | null {
    if (!devCheatsEnabled()) return null;
    return new DevCheatsView(input);
  }

  toggle(): void {
    this.open = !this.open;
    this.panel.classList.toggle('hidden', !this.open);
    if (this.open) this.syncFromState();
  }

  private syncFromState(): void {
    const s = getDevCheatsState();
    this.checks.xp5.checked = s.xp5;
    this.checks.mf100.checked = s.mf100;
  }

  dispose(): void {
    this.panel.remove();
  }
}
