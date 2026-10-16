import { LocalStore } from '../../core/storage';
import { KeyValueSaveBackend } from './KeyValueSaveBackend';

/** Webbläsarens localStorage som SaveBackend (det enda stället i sparningen som rör window.localStorage). */
export class LocalStorageSaveBackend extends KeyValueSaveBackend {
  constructor(storage: Storage = window.localStorage) {
    super(new LocalStore(storage));
  }
}
