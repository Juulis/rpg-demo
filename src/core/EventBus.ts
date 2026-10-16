/** Typad event-bus. Eventnamn och payloads definieras i GameEvents (core/events.ts). Ersätter window.__rpg.on/emit. */
export type Listener<P> = (payload: P) => void;

export class EventBus<M extends Record<string, unknown>> {
  private readonly listeners = new Map<keyof M, Set<Listener<never>>>();

  /** Prenumerera. Returnerar en funktion som avregistrerar lyssnaren. */
  on<K extends keyof M>(k: K, fn: (p: M[K]) => void): () => void {
    let set = this.listeners.get(k);
    if (!set) this.listeners.set(k, (set = new Set()));
    set.add(fn as Listener<never>);
    return () => this.off(k, fn);
  }

  once<K extends keyof M>(k: K, fn: (p: M[K]) => void): () => void {
    const off = this.on(k, (p) => {
      off();
      fn(p);
    });
    return off;
  }

  off<K extends keyof M>(k: K, fn: (p: M[K]) => void): void {
    this.listeners.get(k)?.delete(fn as Listener<never>);
  }

  emit<K extends keyof M>(k: K, p: M[K]): void {
    const set = this.listeners.get(k);
    if (!set) return;
    for (const fn of [...set]) {
      try {
        (fn as Listener<M[K]>)(p);
      } catch (err) {
        console.error(`[EventBus] ${String(k)}`, err);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
