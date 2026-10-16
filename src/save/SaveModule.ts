import type { GameContext, GameModule } from '../core/GameContext';
import { LocalStore, type KeyValueStore } from '../core/storage';
import type { LocaleManager } from '../i18n/LocaleManager';
import { AutoSaveService } from './AutoSaveService';
import type { HeroGateway } from './HeroGateway';
import { HeroLoader } from './HeroLoader';
import { HeroRoster } from './HeroRoster';
import { LegacyImporter } from './LegacyImporter';
import { SaveIndicator } from './SaveIndicator';
import { SaveRepository } from './SaveRepository';

/** Sparmodulen (issue #9). Exponerar roster/loader/autosave till menyn via konstruktorinjektion, inga globaler. */
export class SaveModule implements GameModule {
  readonly repo: SaveRepository;
  private parts: { roster: HeroRoster; loader: HeroLoader; autosave: AutoSaveService; indicator: SaveIndicator | null } | null = null;

  constructor(
    private readonly i18n: LocaleManager,
    private readonly game: HeroGateway,
    store: KeyValueStore = new LocalStore(),
    private readonly showIndicator = true,
  ) {
    this.repo = new SaveRepository(store);
  }

  init(ctx: GameContext): void {
    const indicator = this.showIndicator ? new SaveIndicator(this.i18n) : null;
    const autosave = new AutoSaveService(ctx, this.game, this.repo, () => indicator?.show());
    const roster = new HeroRoster(this.repo, ctx.bus);
    new LegacyImporter(this.repo, roster).run();
    autosave.start();
    this.parts = { roster, loader: new HeroLoader(ctx, this.game, autosave), autosave, indicator };
  }

  private get p(): NonNullable<SaveModule['parts']> {
    if (!this.parts) throw new Error('SaveModule.init() har inte körts');
    return this.parts;
  }
  get roster(): HeroRoster {
    return this.p.roster;
  }
  get loader(): HeroLoader {
    return this.p.loader;
  }
  get autosave(): AutoSaveService {
    return this.p.autosave;
  }

  dispose(): void {
    this.parts?.autosave.dispose();
    this.parts?.indicator?.dispose();
    this.parts = null;
  }
}
