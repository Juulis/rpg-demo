import { Rng } from './Rng';

/**
 * Ett "game" i D2-mening: seed + EN lista över dödade monster-id (den enda källan, även bossar).
 * Id-format: `${areaId}:${spawnPointIndex}:${monsterIndex}`, boss `${areaId}:boss`.
 * Sparas av U2:s SaveManager som { seed, killed: string[] } (kompatibelt med legacy save.js).
 */
export interface Session {
  seed: number;
  killed: Set<string>;
}

export function createSession(seed: number = Rng.newSeed(), killed: Iterable<string> = []): Session {
  return { seed, killed: new Set(killed) };
}
