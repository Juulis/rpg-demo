import type { FoundEntry, FoundRegistry } from './SaveBackend';

/** Ingen lagring – fynd registreras först när SaveModule kopplat in SaveBackend. */
export class NoOpFoundRegistry implements FoundRegistry {
  setActiveHero(_heroId: string | null): void {
    /* väntar på SaveModule.init */
  }

  async markFound(_id: string, _entry: FoundEntry): Promise<boolean> {
    return false;
  }
}
