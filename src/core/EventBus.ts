/**
 * STUB – ersätts av Utvecklares EventBus i skelett-PR:en (Vite, EventBus, spelloop, 2D-motor).
 * Följer det överenskomna interfacet: on() returnerar en avregistreringsfunktion, emit() är typad per event.
 */
export type Listener<P> = (payload: P) => void;

export class EventBus<M extends Record<string, unknown>> {
  private readonly listeners = new Map<keyof M, Set<Listener<never>>>();

  on<K extends keyof M>(k: K, fn: (p: M[K]) => void): () => void {
    let set = this.listeners.get(k);
    if (!set) this.listeners.set(k, (set = new Set()));
    set.add(fn as Listener<never>);
    return () => {
      this.listeners.get(k)?.delete(fn as Listener<never>);
    };
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
}
