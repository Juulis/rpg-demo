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

/** Hjälteplatser: lista, validera namn, skapa och radera (emit:ar hero_deleted så att t.ex. kartans fog städas). */
export class HeroRoster {
  constructor(
    private readonly repo: SaveRepository,
    private readonly bus: EventBus<GameEvents>,
  ) {}

  list(): HeroIndexEntry[] {
    return this.repo.index();
  }

  get full(): boolean {
    return this.list().length >= MAX_HEROES;
  }

  load(id: string): SaveFile | null {
    return this.repo.load(id);
  }

  /** null = giltigt, annars fel som i18n-nyckel. */
  validName(name: string, ignoreId?: string): RosterError | null {
    const n = name.trim();
    if (n.length < NAME_MIN || n.length > NAME_MAX) return { key: 'errors.name_length', params: { min: NAME_MIN, max: NAME_MAX } };
    if (!/^[\p{L}\p{N}][\p{L}\p{N} _-]*$/u.test(n)) return { key: 'errors.name_chars' };
    if (this.list().some((h) => h.id !== ignoreId && h.name.toLowerCase() === n.toLowerCase())) return { key: 'errors.name_taken' };
    return null;
  }

  create(name: string, cls: string): SaveFile {
    const err = this.validName(name);
    if (err) throw new RosterException(err);
    if (this.full) throw new RosterException({ key: 'errors.slots_full' });
    const id = `h${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const d: SaveFile = {
      version: SAVE_VERSION,
      hero: { id, name: name.trim(), cls, level: 1, xp: 0, gold: 0, inv: [], equip: {}, fresh: true },
      game: null,
      savedAt: Date.now(),
    };
    this.repo.save(d, false);
    return d;
  }

  delete(id: string): void {
    this.repo.remove(id);
    this.bus.emit('hero_deleted', { heroId: id });
  }

  /** Förvald hjälte: senast spelad om den finns, annars första. */
  defaultSelection(): string | null {
    const hs = this.list();
    const last = this.repo.lastHeroId();
    return last && hs.some((h) => h.id === last) ? last : (hs[0]?.id ?? null);
  }
}
