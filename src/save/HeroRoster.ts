import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import type { SaveRepository } from './SaveRepository';
import { MAX_HEROES, SAVE_VERSION, type HeroIndexEntry, type SaveFile } from './types';

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

  /** Tom sträng = giltigt, annars felmeddelande på svenska. */
  validName(name: string, ignoreId?: string): string {
    const n = name.trim();
    if (n.length < 2 || n.length > 16) return 'Namnet måste vara 2–16 tecken.';
    if (!/^[\p{L}\p{N}][\p{L}\p{N} _-]*$/u.test(n)) return 'Bara bokstäver, siffror, mellanslag, - och _.';
    if (this.list().some((h) => h.id !== ignoreId && h.name.toLowerCase() === n.toLowerCase())) return 'Det finns redan en hjälte med det namnet.';
    return '';
  }

  create(name: string, cls: string): SaveFile {
    const err = this.validName(name);
    if (err) throw new Error(err);
    if (this.full) throw new Error('Alla hjälteplatser är upptagna.');
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
