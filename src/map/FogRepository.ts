import type { SaveBackend } from '../core/SaveBackend';

/** Kartfog per hjälte via SaveBackend (lagras i hjältefilen). */
export class FogRepository {
  private heroId: string | null = null;
  private readonly cache = new Map<string, string>();
  private lastSaveError: string | null = null;

  constructor(private readonly backend: SaveBackend) {}

  /** Senaste fel vid dimsparning (t.ex. full localStorage). */
  get lastError(): string | null {
    return this.lastSaveError;
  }

  /** Läser in fog för en hjälte (async) innan synkron FogOfWar-laddning. */
  async prepare(heroId: string | null): Promise<void> {
    this.heroId = heroId;
    this.cache.clear();
    this.lastSaveError = null;
    if (!heroId) return;
    const map = await this.backend.getFogMap(heroId);
    for (const [zone, data] of Object.entries(map)) this.cache.set(zone, data);
  }

  load(heroId: string, zone: string): Uint8Array | null {
    if (heroId !== this.heroId) return null;
    try {
      const s = this.cache.get(zone);
      if (!s) return null;
      const b = atob(s);
      const out = new Uint8Array(b.length);
      for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
      return out;
    } catch {
      return null;
    }
  }

  async save(heroId: string, zone: string, cells: Uint8Array): Promise<boolean> {
    if (heroId !== this.heroId) return false;
    try {
      let s = '';
      for (const v of cells) s += String.fromCharCode(v);
      const b64 = btoa(s);
      this.cache.set(zone, b64);
      await this.backend.setFog(heroId, zone, b64);
      this.lastSaveError = null;
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.lastSaveError = msg;
      console.warn('[FogRepository] kunde inte spara dimma (lagring full?):', e);
      return false;
    }
  }

  deleteHero(heroId: string): void {
    if (this.heroId === heroId) {
      this.cache.clear();
      this.heroId = null;
      this.lastSaveError = null;
    }
    void this.backend.clearFog(heroId);
  }
}
