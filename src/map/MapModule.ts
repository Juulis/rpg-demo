import { Disposables } from '../core/Disposables';
import type { GameContext, GameModule } from '../core/GameContext';
import { LocalStore, type KeyValueStore } from '../core/storage';
import type { LocaleManager } from '../i18n/LocaleManager';
import { FogOfWar } from './FogOfWar';
import { FogRepository } from './FogRepository';
import { GoalTracker } from './GoalTracker';
import { MapInput } from './MapInput';
import { MapModel } from './MapModel';
import { MapPainter } from './MapPainter';
import { MapView } from './MapView';
import { MiniMapView } from './MiniMapView';

/**
 * Karta (issue #6): Tab-karta, minikarta, målmarkör och fog of war per hjälte-id.
 * Hjälte-id kommer från hero_loaded, radering från hero_deleted, avslöjande på step/zone_enter. Inga globaler, ingen polling.
 */
export class MapModule implements GameModule {
  static readonly SAVE_MS = 5000;
  private readonly fogRepo: FogRepository;
  private readonly d = new Disposables();
  private ctx: GameContext | null = null;
  private fog = new FogOfWar();
  private heroId: string | null = null;
  private open = false;
  private saveTimer: ReturnType<typeof setTimeout> | undefined;
  private raf = 0;
  private views: { big: MapView; mini: MiniMapView } | null = null;
  private input: MapInput | null = null;

  constructor(
    private readonly i18n: LocaleManager,
    store: KeyValueStore = new LocalStore(),
    private readonly host: () => HTMLElement = () => document.body,
    private readonly animate = true,
  ) {
    this.fogRepo = new FogRepository(store);
  }

  get isOpen(): boolean {
    return this.open;
  }
  get fogOfWar(): FogOfWar {
    return this.fog;
  }

  init(ctx: GameContext): void {
    this.ctx = ctx;
    const model = new MapModel(ctx.data, this.i18n);
    const goals = new GoalTracker(model);
    const bus = ctx.bus;
    this.resetFog(ctx.hero.id);
    const painter = new MapPainter(model, () => this.fog);
    this.views = { big: new MapView(painter, model, goals), mini: new MiniMapView(painter, goals, model) };
    this.host().append(this.views.big.canvas, this.views.mini.canvas);
    this.input = new MapInput(
      () => this.playing(),
      () => this.toggle(),
    );
    this.input.bind(bus);
    this.d.add(
      bus.on('hero_loaded', ({ heroId }) => {
        this.flush();
        this.resetFog(heroId);
      }),
    );
    this.d.add(
      bus.on('hero_deleted', ({ heroId }) => {
        this.fogRepo.deleteHero(heroId);
        if (heroId === this.heroId) {
          clearTimeout(this.saveTimer);
          this.fog.takeDirty();
          this.heroId = null;
        }
      }),
    );
    this.d.add(
      bus.on('zone_enter', () => {
        this.flush();
        this.reveal();
      }),
    );
    this.d.add(bus.on('step', () => this.reveal()));
    this.d.listen(window, 'beforeunload', () => this.flush());
    this.d.listen(document, 'visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush();
    });
    if (this.animate) this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  private resetFog(heroId: string | null): void {
    this.heroId = heroId;
    this.fog = new FogOfWar((zone) => (heroId ? this.fogRepo.load(heroId, zone) : null));
  }

  private playing(): boolean {
    return !!this.ctx && !!this.ctx.hero.playing && !this.input?.panelOpen;
  }

  toggle(force?: boolean): void {
    const next = force ?? !this.open;
    if (next === this.open) return;
    this.open = next;
    this.views?.big.setVisible(next);
    this.ctx?.bus.emit('map_toggle', { open: next });
  }

  reveal(): void {
    const ctx = this.ctx;
    if (!ctx || !ctx.hero.playing) return;
    if (this.fog.reveal(ctx.zone.name, ctx.hero.pos.x, ctx.hero.pos.y) && !this.saveTimer) {
      this.saveTimer = setTimeout(() => this.flush(), MapModule.SAVE_MS);
    }
  }

  /** Sparar fog direkt (vid zonbyte, hjältebyte, stängning) eller efter debounce. */
  flush(): void {
    clearTimeout(this.saveTimer);
    this.saveTimer = undefined;
    const id = this.heroId;
    if (!id) return;
    for (const [zone, cells] of this.fog.takeDirty()) this.fogRepo.save(id, zone, cells);
  }

  /** Ritning per bildruta (bara rendering; state kommer via bussen och ctx). */
  private frame(t: number): void {
    this.raf = requestAnimationFrame((n) => this.frame(n));
    this.render(t);
  }

  render(t: number): void {
    const ctx = this.ctx;
    const v = this.views;
    if (!ctx || !v) return;
    const playing = this.playing();
    v.mini.setVisible(playing);
    if (!playing) {
      if (this.open) this.toggle(false);
      return;
    }
    const z = ctx.zone;
    const h = ctx.hero;
    v.mini.draw(z, h, t);
    if (this.open) v.big.draw(z, h, t);
  }

  dispose(): void {
    this.flush();
    cancelAnimationFrame(this.raf);
    this.d.dispose();
    this.input?.dispose();
    this.views?.big.canvas.remove();
    this.views?.mini.canvas.remove();
    this.views = null;
    this.ctx = null;
  }
}
