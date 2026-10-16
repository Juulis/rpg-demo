import { nextEvent } from '../core/nextEvent';
import type { GameContext } from '../core/GameContext';
import type { AutoSaveService } from './AutoSaveService';
import { newGameRecord, newSeed, type SaveFile } from './types';

/**
 * Startar en hjälte: skriver hjältens data till ctx.hero och ctx.session (ersätter rk_inv_<klass>),
 * emit:ar hero_loaded + new_game och väntar på zone_enter för startzonen (riktig signal i stället för wait(1300)).
 */
export class HeroLoader {
  constructor(
    private readonly ctx: GameContext,
    private readonly autosave: AutoSaveService,
    private readonly zoneTimeoutMs = 10_000,
  ) {}

  async start(save: SaveFile, resume: boolean): Promise<void> {
    this.autosave.end(this.autosave.isPlaying);
    const g = resume && save.game ? save.game : newGameRecord(newSeed());
    if (!resume || !save.game) save.game = g;
    const h = save.hero;
    const hero = this.ctx.hero;
    this.ctx.session = { seed: g.seed, killed: new Set(g.killed) };
    Object.assign(hero, {
      id: h.id, name: h.name, cls: h.cls, level: h.level, xp: h.xp, gold: h.gold,
      inv: h.fresh ? [] : h.inv, equip: h.fresh ? {} : h.equip, fresh: !!h.fresh,
      stage: resume ? g.stage : 0, runes: resume ? g.runes : 0, city: resume ? g.city : 'besatt',
      zone: resume ? g.zone : 'forest',
      resumePos: resume && g.pos ? { x: g.pos[0], y: g.pos[1] } : null,
      facing: resume ? (g.rot ?? 0) : 0,
    });
    if (h.fresh) delete h.fresh;
    this.ctx.bus.emit('hero_loaded', { heroId: h.id });
    const ready = nextEvent(this.ctx.bus, 'zone_enter', (p) => p.name === hero.zone, this.zoneTimeoutMs);
    this.ctx.bus.emit('new_game', { seed: g.seed });
    try {
      await ready;
    } catch (e) {
      console.warn('[HeroLoader] zone_enter uteblev', e);
    }
    this.autosave.begin(save);
    this.autosave.saveNow('start');
  }
}
