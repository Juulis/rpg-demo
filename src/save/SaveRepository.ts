import type { SaveBackend } from '../core/SaveBackend';
import { fromHeroSave, toHeroSave } from './convert';
import type { HeroIndexEntry, SaveFile } from './types';

/**
 * Spar-logikens enda väg till lagringen: core-interfacet SaveBackend (lokalt nu, server senare). DOM-fri.
 * Översätter mellan menyns/autosparningens SaveFile och core-formatet HeroSave.
 * Anropen köas, så att en sen sparning aldrig kan hamna efter en radering av samma hjälte.
 */
export class SaveRepository {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(readonly backend: SaveBackend) {}

  private enqueue<T>(job: () => Promise<T>): Promise<T> {
    const run = this.queue.then(job, job);
    this.queue = run.catch(() => undefined);
    return run;
  }

  /** Hjältar, senast sparad först (SaveBackend-kontraktet). */
  index(): Promise<HeroIndexEntry[]> {
    return this.enqueue(() => this.backend.list());
  }

  async load(id: string): Promise<SaveFile | null> {
    const s = await this.enqueue(() => this.backend.load(id));
    return s ? fromHeroSave(s) : null;
  }

  /** false om lagringen misslyckas. */
  save(d: SaveFile): Promise<boolean> {
    const data = toHeroSave(d);
    return this.enqueue(async () => {
      try {
        await this.backend.save(d.hero.id, data);
        return true;
      } catch (e) {
        console.warn('Sparning misslyckades', e);
        return false;
      }
    });
  }

  remove(id: string): Promise<void> {
    return this.enqueue(() => this.backend.remove(id));
  }
}
