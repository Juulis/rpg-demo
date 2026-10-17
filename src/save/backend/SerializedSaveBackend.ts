import type { HeroSave } from '../../core/GameContext';
import type { FoundEntry, SaveBackend } from '../../core/SaveBackend';

/**
 * Serialiserar alla async-anrop till en underliggande SaveBackend.
 */
export class SerializedSaveBackend implements SaveBackend {
  private tail: Promise<void> = Promise.resolve();

  constructor(private readonly inner: SaveBackend) {}

  private run<T>(job: () => Promise<T>): Promise<T> {
    const next = this.tail.then(job, job);
    this.tail = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  setActiveHero(heroId: string | null): void {
    this.inner.setActiveHero(heroId);
  }

  markFound(id: string, entry: FoundEntry): Promise<boolean> {
    return this.run(() => this.inner.markFound(id, entry));
  }

  unmarkFound(id: string): Promise<void> {
    return this.run(() => this.inner.unmarkFound(id));
  }

  getSetting(key: string): Promise<string | null> {
    return this.run(() => this.inner.getSetting(key));
  }

  setSetting(key: string, value: string): Promise<void> {
    return this.run(() => this.inner.setSetting(key, value));
  }

  getFogMap(heroId: string): Promise<Record<string, string>> {
    return this.run(() => this.inner.getFogMap(heroId));
  }

  setFog(heroId: string, zone: string, base64: string): Promise<void> {
    return this.run(() => this.inner.setFog(heroId, zone, base64));
  }

  clearFog(heroId: string): Promise<void> {
    return this.run(() => this.inner.clearFog(heroId));
  }

  list(): Promise<Awaited<ReturnType<SaveBackend['list']>>> {
    return this.run(() => this.inner.list());
  }

  load(id: string): Promise<HeroSave | null> {
    return this.run(() => this.inner.load(id));
  }

  save(id: string, data: HeroSave): Promise<void> {
    return this.run(() => this.inner.save(id, data));
  }

  remove(id: string): Promise<void> {
    return this.run(() => this.inner.remove(id));
  }

  lastPlayedHeroId(): Promise<string | null> {
    return this.run(() => this.inner.lastPlayedHeroId());
  }
}
