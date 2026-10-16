import type { FoundEntry, FoundRegistry } from './SaveBackend';

/**
 * Minimal standard för fyndregistret när ingen SaveBackend är registrerad (localStorage['rpg_found'], legacy-format).
 * U2:s SaveBackend ersätter den via Game.setSaveBackend().
 */
export class LocalFoundRegistry implements FoundRegistry {
  markFound(id: string, entry: FoundEntry): boolean {
    try {
      const f = JSON.parse(localStorage.getItem('rpg_found') ?? '{}') as Record<string, unknown>;
      if (f[id]) return false;
      f[id] = entry;
      localStorage.setItem('rpg_found', JSON.stringify(f));
      return true;
    } catch {
      return false;
    }
  }
}
