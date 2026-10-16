import type { EventBus } from './EventBus';

/** Promise som löses vid nästa event K (valfritt filter). Ersätter fasta fördröjningar som wait(1300). */
export function nextEvent<M extends Record<string, unknown>, K extends keyof M>(
  bus: EventBus<M>,
  k: K,
  filter: (p: M[K]) => boolean = () => true,
  timeoutMs = 10_000,
): Promise<M[K]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      off();
      reject(new Error(`Timeout i väntan på ${String(k)}`));
    }, timeoutMs);
    const off = bus.on(k, (p) => {
      if (!filter(p)) return;
      clearTimeout(timer);
      off();
      resolve(p);
    });
  });
}
