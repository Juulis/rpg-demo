import { isRecord } from './json';

export { isRecord };
/** Nyckel–värde-lagring (localStorage i webbläsaren, MemoryStore i tester). */
export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  keys(): string[];
}

export class LocalStore implements KeyValueStore {
  constructor(private readonly ls: Storage = localStorage) {}
  get(key: string): string | null {
    return this.ls.getItem(key);
  }
  set(key: string, value: string): void {
    this.ls.setItem(key, value);
  }
  remove(key: string): void {
    this.ls.removeItem(key);
  }
  keys(): string[] {
    return Object.keys(this.ls);
  }
}

export class MemoryStore implements KeyValueStore {
  private readonly m = new Map<string, string>();
  get(key: string): string | null {
    return this.m.get(key) ?? null;
  }
  set(key: string, value: string): void {
    this.m.set(key, value);
  }
  remove(key: string): void {
    this.m.delete(key);
  }
  keys(): string[] {
    return [...this.m.keys()];
  }
}

export function readJson(store: KeyValueStore, key: string): unknown {
  try {
    const s = store.get(key);
    return s == null ? null : (JSON.parse(s) as unknown);
  } catch {
    return null;
  }
}

export function writeJson(store: KeyValueStore, key: string, value: unknown): boolean {
  try {
    store.set(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('Sparning misslyckades', e);
    return false;
  }
}
