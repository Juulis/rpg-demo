import type { SeedSource } from '../core/entropy';
import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import type { SaveRepository } from './SaveRepository';
import { MAX_HEROES, SAVE_VERSION, type HeroIndexEntry, type SaveFile } from './types';

/** Valideringsfel som i18n-nyckel + parametrar (översätts i UI). */
export interface RosterError {
  key: 'errors.name_length' | 'errors.name_chars' | 'errors.name_taken' | 'errors.slots_full';
  params?: Readonly<Record<string, number>>;
}

/** Undantag från create(); bär en RosterError så att UI kan översätta. */
export class RosterException extends Error {
  constructor(readonly error: RosterError) {
    super(error.key);
  }
}

export const NAME_MIN = 2;
export const NAME_MAX = 16;

/**
 * Hjälteplatser: lista, validera namn, skapa och radera (emit:ar hero_deleted så att t.ex. kartans fog städas).
 * Ingen DOM. Lagringen är async (SaveBackend), så rostern håller en cache som fylls av refresh();
 * list/load/validName läser cachen synkront så att menyn kan rita utan att vänta.
 */
export class HeroRoster {
  private heroes: HeroIndexEntry[] = [];
  private readonly saves = new Map<string, SaveFile>();
  private last: string | null = null;

  constructor(
    private readonly repo: SaveRepository,
    private readonly bus: EventBus<GameEvents>,
    /** Slumpdel i hjälte-id; injiceras. */
    private readonly idEntropy: SeedSource,
  ) {}

  /** Läser index, sparfiler och senast spelad från lagringen. */
  async refresh(): Promise<void> {
    const heroes = await this.repo.index();
    const loaded = await Promise.all(heroes.map((h) => this.repo.load(h.id)));
    this.saves.clear();
    loaded.forEach((d) => d && this.saves.set(d.hero.id, d));
    this.heroes = heroes;
    this.last = await this.repo.lastHeroId();
  }

  list(): HeroIndexEntry[] {
    return [...this.heroes];
  }

  get full(): boolean {
    return this.heroes.length >= MAX_HEROES;
  }

  load(id: string): SaveFile | null {
    return this.saves.get(id) ?? null;
  }

  /** null = giltigt, annars fel som i18n-nyckel. */
  validName(name: string, ignoreId?: string): RosterError | null {
    const n = name.trim();
    if (n.length < NAME_MIN || n.length > NAME_MAX) return { key: 'errors.name_length', params: { min: NAME_MIN, max: NAME_MAX } };
    if (!/^[\p{L}\p{N}][\p{L}\p{N} _-]*$/u.test(n)) return { key: 'errors.name_chars' };
    if (this.heroes.some((h) => h.id !== ignoreId && h.name.toLowerCase() === n.toLowerCase())) return { key: 'errors.name_taken' };
    return null;
  }

  async create(name: string, cls: string): Promise<SaveFile> {
    const err = this.validName(name);
    if (err) throw new RosterException(err);
    if (this.full) throw new RosterException({ key: 'errors.slots_full' });
    const id = `h${Date.now().toString(36)}${this.idEntropy().toString(36).slice(0, 4)}`;
    const d: SaveFile = {
      version: SAVE_VERSION,
      hero: { id, name: name.trim(), cls, level: 1, xp: 0, gold: 0, inv: [], equip: {}, fresh: true },
      game: null,
      savedAt: Date.now(),
    };
    await this.store(d);
    return d;
  }

  /** Sparar en hjälte (utan att markera som senast spelad) och uppdaterar cachen. */
  async store(d: SaveFile): Promise<void> {
    if (!(await this.repo.save(d))) throw new Error('Kunde inte spara hjälten.');
    this.track(d);
  }

  /** Håller cachen i takt med sparningar som görs av andra (t.ex. AutoSaveService). */
  track(d: SaveFile, markLast = false): void {
    this.saves.set(d.hero.id, d);
    const entry: HeroIndexEntry = { id: d.hero.id, name: d.hero.name, cls: d.hero.cls, level: d.hero.level };
    if (d.savedAt) entry.savedAt = d.savedAt;
    const i = this.heroes.findIndex((h) => h.id === d.hero.id);
    if (i >= 0) this.heroes[i] = entry;
    else this.heroes.push(entry);
    if (markLast) this.last = d.hero.id;
  }

  async delete(id: string): Promise<void> {
    await this.repo.remove(id);
    this.saves.delete(id);
    this.heroes = this.heroes.filter((h) => h.id !== id);
    if (this.last === id) this.last = null;
    this.bus.emit('hero_deleted', { heroId: id });
  }

  /** Förvald hjälte: senast spelad om den finns, annars första. */
  defaultSelection(): string | null {
    const last = this.last;
    return last && this.heroes.some((h) => h.id === last) ? last : (this.heroes[0]?.id ?? null);
  }
}
