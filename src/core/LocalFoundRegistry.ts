import type { FoundEntry, FoundRegistry } from './SaveBackend';

/**
 * Minimal standard för fyndregistret när ingen SaveBackend är registrerad (localStorage['rpg_found'], legacy-format).
 * U2:s SaveBackend ersätter den via Game.setSaveBackend().
 */
export class LocalFoundRegistry implements FoundRegistry {
  private heroId: string | null = null;

  setActiveHero(heroId: string | null): void {
    this.heroId = heroId;
  }

  async markFound(id: string, entry: FoundEntry): Promise<boolean> {
    if (!this.heroId) return false;
    try {
      const key = `rpg_found_${this.heroId}`;
      const f = JSON.parse(localStorage.getItem(key) ?? localStorage.getItem('rpg_found') ?? '{}') as Record<string, unknown>;
      if (f[id]) return false;
      f[id] = entry;
      localStorage.setItem(key, JSON.stringify(f));
      return true;
    } catch {
      return false;
    }
  }
}
