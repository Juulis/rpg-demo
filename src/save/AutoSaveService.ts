import { Disposables } from '../core/Disposables';
import type { GameEvents } from '../core/events';
import type { GameContext } from '../core/GameContext';
import type { HeroGateway } from './HeroGateway';
import type { SaveRepository } from './SaveRepository';
import { SAVE_VERSION, newSeed, type SaveFile } from './types';

/**
 * Autosparning drivs helt av bussen (issue #12): inga polling-timers.
 * Sparar (debounce 150 ms) vid spelhändelser samt direkt vid beforeunload/visibilitychange.
 */
export class AutoSaveService {
  static readonly TRIGGERS: ReadonlyArray<keyof GameEvents> = [
    'kill',
    'pickup',
    'loot_drop',
    'gold',
    'rune',
    'zone_enter',
    'portal_open',
    'boss_phase',
    'boss_start',
    'level_up',
    'lore_unlock',
  ];
  private current: SaveFile | null = null;
  private playing = false;
  private pending: ReturnType<typeof setTimeout> | undefined;
  private readonly d = new Disposables();
  lastSave: { reason: string; at: number } | null = null;

  constructor(
    private readonly ctx: GameContext,
    private readonly game: HeroGateway,
    private readonly repo: SaveRepository,
    private readonly onSaved: () => void = () => undefined,
    private readonly debounceMs = 150,
  ) {}

  start(): void {
    const bus = this.ctx.bus;
    for (const e of AutoSaveService.TRIGGERS) this.d.add(bus.on(e, () => this.saveSoon(e)));
    this.d.add(
      bus.on('new_game', () => {
        // nytt game (även från motorns "Spela igen"): Game har redan bytt session, spara snapshot
        this.saveSoon('new_game');
      }),
    );
    this.d.add(
      bus.on('hero_deleted', ({ heroId }) => {
        if (this.current?.hero.id === heroId) this.end(false);
      }),
    );
    if (typeof window !== 'undefined') {
      this.d.listen(window, 'beforeunload', () => this.saveNow('beforeunload'));
      this.d.listen(document, 'visibilitychange', () => {
        if (document.visibilityState === 'hidden') this.saveNow('hidden');
      });
    }
  }

  get isPlaying(): boolean {
    return this.playing;
  }
  get currentSave(): SaveFile | null {
    return this.current;
  }

  begin(save: SaveFile): void {
    this.current = save;
    this.playing = true;
  }

  /** Avslutar spelpass (t.ex. tillbaka till menyn). */
  end(saveFirst = true): void {
    if (saveFirst) this.saveNow('menu');
    clearTimeout(this.pending);
    this.playing = false;
    this.current = null;
  }

  saveSoon(reason: string): void {
    clearTimeout(this.pending);
    this.pending = setTimeout(() => this.saveNow(reason), this.debounceMs);
  }

  saveNow(reason = ''): boolean {
    if (!this.playing || !this.current) return false;
    const snap = this.snapshot(this.current);
    if (!this.repo.save(snap)) return false;
    this.current = snap;
    this.lastSave = { reason, at: snap.savedAt ?? Date.now() };
    this.onSaved();
    return true;
  }

  /** Sparfil från Game.getSnapshot(); behåller id/namn från sparfilen och lägger till riktning. */
  private snapshot(cur: SaveFile): SaveFile {
    const snap = this.game.getSnapshot();
    const g = snap.game;
    const r2 = (n: number, k: number): number => Number(n.toFixed(k));
    const h = snap.hero;
    return {
      version: SAVE_VERSION,
      hero: { id: cur.hero.id, name: cur.hero.name, cls: h.cls, level: h.level, xp: h.xp, gold: h.gold, inv: h.inv, equip: h.equip },
      game: {
        seed: g?.seed || cur.game?.seed || newSeed(),
        killed: g?.killed ?? [],
        zone: g?.zone || this.ctx.zone.name || 'forest',
        pos: g?.pos ? [r2(g.pos.x, 2), r2(g.pos.y, 2)] : null,
        rot: r2(this.ctx.hero.facing, 3),
        stage: g?.stage ?? 0,
        runes: g?.runes ?? 0,
        city: g?.city ?? 'besatt',
      },
      found: this.repo.foundCount(),
      savedAt: Date.now(),
    };
  }

  dispose(): void {
    clearTimeout(this.pending);
    this.d.dispose();
  }
}
