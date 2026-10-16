import { Disposables } from '../core/Disposables';
import { heroOf } from '../core/context.ext';
import type { GameEvents } from '../core/events';
import type { GameContext } from '../core/GameContext';
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
    private readonly repo: SaveRepository,
    private readonly onSaved: () => void = () => undefined,
    private readonly debounceMs = 150,
  ) {}

  start(): void {
    const bus = this.ctx.bus;
    for (const e of AutoSaveService.TRIGGERS) this.d.add(bus.on(e, () => this.saveSoon(e)));
    this.d.add(
      bus.on('new_game', ({ seed }) => {
        // nytt game startat av motorn (t.ex. "Spela igen"): ny seed, tom dödlista
        if (this.current && this.ctx.session.seed !== seed) {
          this.ctx.session.seed = seed;
          this.ctx.session.killed.clear();
        }
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

  private snapshot(cur: SaveFile): SaveFile {
    const { session: s, zone } = this.ctx;
    const h = heroOf(this.ctx);
    const prev = cur.game;
    const r2 = (n: number, k: number): number => Number(n.toFixed(k));
    return {
      version: SAVE_VERSION,
      hero: {
        id: cur.hero.id,
        name: cur.hero.name,
        cls: h.cls,
        level: h.level,
        xp: h.xp,
        gold: h.gold,
        inv: h.inv ?? cur.hero.inv,
        equip: h.equip ?? cur.hero.equip,
      },
      game: {
        seed: s.seed || cur.game?.seed || newSeed(),
        killed: [...s.killed],
        zone: zone.name || cur.game?.zone || 'forest',
        pos: [r2(h.pos.x, 2), r2(h.pos.y, 2)],
        rot: r2(h.facing ?? 0, 3),
        stage: h.stage ?? prev?.stage ?? 0,
        runes: h.runes ?? prev?.runes ?? 0,
        city: h.city ?? prev?.city ?? 'besatt',
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
