import type { SpawnArea } from './types';

/** Startskogen följer spawnzoner.json. Ingen kodoverride av punkter eller gruppstorlek. */
export function expandStartskogenArea(area: SpawnArea): SpawnArea {
  return area;
}
