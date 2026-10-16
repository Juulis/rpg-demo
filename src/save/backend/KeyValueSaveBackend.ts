import type { KeyValueStore } from '../../core/storage';
import type { SaveBackend } from './SaveBackend';

/**
 * SaveBackend ovanpå ett synkront key-value-lager (localStorage, MemoryStore i tester).
 * Skrivningen sker synkront innan promisen löses, så att sparning vid beforeunload hinner klart.
 */
export class KeyValueSaveBackend implements SaveBackend {
  constructor(private readonly kv: KeyValueStore) {}

  load(key: string): Promise<string | null> {
    return Promise.resolve(this.kv.get(key));
  }
  save(key: string, data: string): Promise<void> {
    try {
      this.kv.set(key, data);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e instanceof Error ? e : new Error(String(e)));
    }
  }
  remove(key: string): Promise<void> {
    this.kv.remove(key);
    return Promise.resolve();
  }
  list(prefix: string): Promise<string[]> {
    return Promise.resolve(this.kv.keys().filter((k) => k.startsWith(prefix)));
  }
}
