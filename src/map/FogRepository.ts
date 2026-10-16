import type { KeyValueStore } from '../core/storage';

/** Fog per hjälte-id och zon i localStorage: rpg_karta_<hjälteId>_<zon> = base64 av bytes (samma format som js/map.js). */
export class FogRepository {
  static readonly PREFIX = 'rpg_karta_';
  static key = (heroId: string, zone: string): string => `${FogRepository.PREFIX}${heroId}_${zone}`;

  constructor(private readonly store: KeyValueStore) {}

  load(heroId: string, zone: string): Uint8Array | null {
    try {
      const s = this.store.get(FogRepository.key(heroId, zone));
      if (!s) return null;
      const b = atob(s);
      const out = new Uint8Array(b.length);
      for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
      return out;
    } catch {
      return null;
    }
  }

  save(heroId: string, zone: string, cells: Uint8Array): void {
    try {
      let s = '';
      for (const v of cells) s += String.fromCharCode(v);
      this.store.set(FogRepository.key(heroId, zone), btoa(s));
    } catch {
      /* full lagring: fog är inte kritisk */
    }
  }

  /** Raderar all fog för en hjälte (vid hero_deleted, i stället för polling mot rpg_heroes). */
  deleteHero(heroId: string): void {
    const p = `${FogRepository.PREFIX}${heroId}_`;
    for (const k of this.store.keys()) if (k.startsWith(p)) this.store.remove(k);
  }
}
