/** Samlar avregistreringar (bus-lyssnare, DOM-lyssnare, timers) så att dispose() städar allt. */
export class Disposables {
  private readonly fns: Array<() => void> = [];

  add(fn: () => void): void {
    this.fns.push(fn);
  }

  listen<K extends keyof WindowEventMap>(target: Window, type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions): void;
  listen(target: EventTarget, type: string, fn: (e: Event) => void, opts?: AddEventListenerOptions): void;
  listen(target: EventTarget, type: string, fn: (e: never) => void, opts?: AddEventListenerOptions): void {
    const h = fn as EventListener;
    target.addEventListener(type, h, opts);
    this.fns.push(() => target.removeEventListener(type, h, opts));
  }

  dispose(): void {
    while (this.fns.length) this.fns.pop()?.();
  }
}
