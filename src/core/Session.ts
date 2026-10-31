import { Rng } from './Rng';

/**
 * Ett "game" i D2-mening: game_seed + world_seed + EN lista över dödade monster-id.
 * world_seed: geografi (chunk-tiles/dekor) — skapas en gång per sparfil, ändras inte vid newGame().
 * seed (game_seed): spawnzoner, elites, butiker — nytt vid newGame().
 */
export interface Session {
  seed: number;
  worldSeed: number;
  killed: Set<string>;
}

export function createSession(seed: number = Rng.newSeed(), killed: Iterable<string> = [], worldSeed: number = seed): Session {
  return { seed, worldSeed, killed: new Set(killed) };
}
