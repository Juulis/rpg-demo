import type { Vec2 } from '../core/GameContext';

type KeyFn = (e: KeyboardEvent) => void;

/**
 * Tangentbord och mus. Alt blockeras helt i capture-fasen (webbläsarens meny) och nollställs vid blur/fokus/synlighet.
 * Z växlar etiketter permanent (LootLabels läser altHeld/labelsToggled).
 */
export class Input {
  readonly keys = new Set<string>();
  readonly mouse: Vec2 = { x: 0, y: 0 };
  leftDown = false;
  rightDown = false;
  altHeld = false;
  labelsToggled = false;
  private readonly handlers = new Map<string, KeyFn>();
  private readonly off: (() => void)[] = [];

  constructor(private readonly canvas: HTMLCanvasElement) {
    const on = <K extends keyof WindowEventMap>(t: K, fn: (e: WindowEventMap[K]) => void, capture = false): void => {
      window.addEventListener(t, fn, capture);
      this.off.push(() => window.removeEventListener(t, fn, capture));
    };
    on('keydown', (e) => this.keyDown(e), true);
    on('keyup', (e) => this.keyUp(e), true);
    on('contextmenu', (e) => e.preventDefault(), true);
    on('blur', () => this.reset());
    on('focus', () => this.reset());
    const vis = (): void => this.reset();
    document.addEventListener('visibilitychange', vis);
    this.off.push(() => document.removeEventListener('visibilitychange', vis));
    on('pointermove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    on('pointerup', (e) => {
      if (e.button === 0) this.leftDown = false;
      if (e.button === 2) this.rightDown = false;
    });
    const down = (e: PointerEvent): void => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      if (e.button === 0) this.leftDown = true;
      if (e.button === 2) this.rightDown = true;
    };
    const ctx = (e: Event): void => e.preventDefault();
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('contextmenu', ctx);
    this.off.push(() => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('contextmenu', ctx);
    });
  }

  /** Registrera en tangent (KeyboardEvent.code eller key i gemener). */
  bind(key: string, fn: KeyFn): void {
    this.handlers.set(key, fn);
  }

  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  /** Muspekaren över spelytan (inte över ett DOM-fönster). */
  overCanvas(): boolean {
    return document.elementFromPoint(this.mouse.x, this.mouse.y) === this.canvas;
  }

  private keyDown(e: KeyboardEvent): void {
    if (e.key === 'Alt' || e.altKey) {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Alt') {
        this.altHeld = true;
        return;
      }
    }
    if (e.key === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') e.preventDefault();
    if ((e.target as HTMLElement | null)?.closest?.('input,textarea')) return;
    this.keys.add(e.code);
    if (e.repeat) return;
    if (e.code === 'KeyZ') this.labelsToggled = !this.labelsToggled;
    (this.handlers.get(e.code) ?? this.handlers.get(e.key.toLowerCase()))?.(e);
  }

  private keyUp(e: KeyboardEvent): void {
    if (e.key === 'Alt') {
      e.preventDefault();
      e.stopPropagation();
      this.altHeld = false;
    }
    this.keys.delete(e.code);
    this.handlers.get('up:' + e.code)?.(e);
  }

  private reset(): void {
    this.altHeld = false;
    this.keys.clear();
    this.leftDown = false;
    this.rightDown = false;
    this.handlers.get('reset')?.(new KeyboardEvent('keyup'));
  }

  dispose(): void {
    for (const f of this.off) f();
  }
}
