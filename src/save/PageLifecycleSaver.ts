import { Disposables } from '../core/Disposables';
import type { AutoSaveService } from './AutoSaveService';

/** DOM-delen av autosparningen: sparar direkt när sidan stängs eller döljs. */
export class PageLifecycleSaver {
  private readonly d = new Disposables();

  constructor(
    private readonly autosave: AutoSaveService,
    private readonly win: Window = window,
  ) {}

  start(): void {
    const doc = this.win.document;
    this.d.listen(this.win, 'beforeunload', () => void this.autosave.saveNow('beforeunload'));
    this.d.listen(doc, 'visibilitychange', () => {
      if (doc.visibilityState === 'hidden') void this.autosave.saveNow('hidden');
    });
  }

  dispose(): void {
    this.d.dispose();
  }
}
