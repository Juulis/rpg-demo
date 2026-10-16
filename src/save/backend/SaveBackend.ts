/**
 * ⚠️ TILLFÄLLIGT: ersätts av Utvecklares SaveBackend i src/core (kommande 2D-PR). Byt importerna då och ta bort filen.
 *
 * Lagringsgräns för sparning. Async så att den kan bytas mot en server senare.
 * Spar-logiken (SaveRepository, SaveMigrator, HeroRoster, AutoSaveService) pratar bara med detta interface.
 */
export interface SaveBackend {
  load(key: string): Promise<string | null>;
  save(key: string, data: string): Promise<void>;
  remove(key: string): Promise<void>;
  /** Alla nycklar som börjar med prefix. */
  list(prefix: string): Promise<string[]>;
}
