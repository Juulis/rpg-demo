import { cryptoSeed, type SeedSource } from '../core/entropy';
import type { GameContext, GameModule } from '../core/GameContext';
import type { SaveBackend } from '../core/SaveBackend';
import { AutoSaveService } from './AutoSaveService';
import { LocalStorageSaveBackend } from './backend/LocalStorageSaveBackend';
import type { HeroGateway } from './HeroGateway';
import { HeroLoader } from './HeroLoader';
import { HeroRoster } from './HeroRoster';
import { PageLifecycleSaver } from './PageLifecycleSaver';
import { SaveIndicator } from './SaveIndicator';
import { SaveRepository } from './SaveRepository';

interface Parts {
  roster: HeroRoster;
  loader: HeroLoader;
  autosave: AutoSaveService;
  lifecycle: PageLifecycleSaver | null;
  indicator: SaveIndicator | null;
}

/**
 * Sparmodulen (issue #9). Komponerar spar-logiken (DOM-fri, bakom core SaveBackend) med DOM-delarna
 * (sparikon, sidans livscykel). Exponerar roster/loader/autosave till menyn via konstruktorinjektion, inga globaler.
 */
export class SaveModule implements GameModule {
  readonly repo: SaveRepository;
  private parts: Parts | null = null;
  private readyP: Promise<void> = Promise.resolve();
  private loaded = false;

  constructor(
    private readonly game: HeroGateway,
    backend: SaveBackend = new LocalStorageSaveBackend(),
    private readonly withDom = true,
    /** Plattformens slumpkälla för seeds och id:n (crypto.getRandomValues). */
    private readonly entropy: SeedSource = cryptoSeed,
  ) {
    this.repo = new SaveRepository(backend);
  }

  init(ctx: GameContext): void {
    this.game.setSaveBackend(this.repo.backend);
    const indicator = this.withDom ? new SaveIndicator() : null;
    const roster = new HeroRoster(this.repo, ctx.bus, this.entropy);
    const autosave = new AutoSaveService(ctx, this.game, this.repo, (d) => {
      roster.track(d, true);
      indicator?.show();
    });
    const lifecycle = this.withDom ? new PageLifecycleSaver(autosave) : null;
    autosave.start();
    lifecycle?.start();
    this.parts = { roster, loader: new HeroLoader(ctx, this.game, autosave, this.entropy), autosave, lifecycle, indicator };
    this.readyP = (async () => {
      await roster.refresh();
      this.loaded = true;
    })();
  }

  /** Löses när engångsmigreringen är klar och hjältelistan är inläst. */
  get ready(): Promise<void> {
    return this.readyP;
  }

  /** true när ready har lösts (menyn kan då visas synkront). */
  get isReady(): boolean {
    return this.loaded;
  }

  private get p(): Parts {
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
    this.parts?.lifecycle?.dispose();
    this.parts?.indicator?.dispose();
    this.parts = null;
  }
}
