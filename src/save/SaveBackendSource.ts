import type { SaveBackend } from '../core/SaveBackend';

/** Moduler som behöver samma SaveBackend-instans som SaveModule. */
export interface SaveBackendSource {
  readonly backend: SaveBackend;
}
