import { Rng } from './Rng';

/**
 * Ett "game" i D2-mening: seed + EN lista över dödade monster-id (den enda källan, även bossar).
 * Sparas av SaveManager som { seed, killed: string[] } (kompatibelt med legacy save.js).
 */
export class Session {
  readonly killed: Set<string>;

  constructor(
    readonly seed: number = Rng.newSeed(),
    killed: Iterable<string> = [],
  ) {
    this.killed = new Set(killed);
  }

  isKilled(uid: string): boolean {
    return this.killed.has(uid);
  }

  markKilled(uid: string): void {
    this.killed.add(uid);
  }

  toJSON(): { seed: number; killed: string[] } {
    return { seed: this.seed, killed: [...this.killed] };
  }
}
