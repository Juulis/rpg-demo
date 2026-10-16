import { Graphics, Text } from 'pixi.js';
import { EventBus } from './EventBus';
import type { GameEvents } from './events';
import type { GameContext, GameModule, HeroSave, HeroState, ZoneView } from './GameContext';
import { createSession } from './Session';
import { DATA, validateData } from '../data';
import { Iso } from '../render/Iso';
import { Renderer } from '../render/Renderer';
import { SpawnSystem } from '../systems/SpawnSystem';

/**
 * Toppnivå: äger bussen, renderaren och systemen. Inga globala variabler; allt nås via Game-instansen.
 * PR 1 (skelett): startar renderaren och visar en förhandsvisning av D2-spawnen i isometrisk vy.
 * PR 2 lägger till Input, Camera, Hero/Monster, LootSystem, Inventory, Tooltip, MonsterBar.
 * Moduler (AudioManager, SaveManager, MapUI, StartMenu, Lorebook – Utvecklare 2) får GameContext via init().
 */
export class Game {
  readonly bus = new EventBus<GameEvents>();
  readonly renderer = new Renderer();
  readonly spawn = new SpawnSystem();
  private readonly hero: HeroState = {
    id: null,
    name: '',
    cls: 'riddare',
    level: 1,
    xp: 0,
    gold: 0,
    hp: 1,
    maxHp: 1,
    stamina: 1,
    maxStamina: 1,
    pos: { x: 0, y: 0 },
    inv: [],
    equip: {},
    stage: 0,
    runes: 0,
    city: 'besatt',
    zone: 'forest',
    facing: 0,
    playing: false,
    resumePos: null,
    fresh: true,
  };
  private readonly zone: ZoneView = {
    name: 'forest',
    areaId: 'startskogen',
    width: 90,
    height: 90,
    circle: 45,
    colliders: [],
    runes: [],
    portals: [],
    cleared: {},
  };
  readonly ctx: GameContext;

  constructor(private readonly modules: GameModule[] = []) {
    this.ctx = { bus: this.bus, hero: this.hero, zone: this.zone, session: createSession(), data: DATA };
  }

  get session() {
    return this.ctx.session;
  }

  async start(host: HTMLElement): Promise<void> {
    const issues = validateData();
    if (issues.length) console.warn('Datavarningar:', issues);
    await this.renderer.init(host);
    for (const m of this.modules) m.init(this.ctx);
    this.preview();
  }

  /**
   * Laddar en hjälte (från SaveManager/StartMenu). Enda sättet för moduler att ändra hjältens tillstånd.
   * Med save.game sätts sessionen (seed + killed) och återupptagningsposition; utan game startas en ny session.
   */
  loadHero(save: HeroSave): void {
    const h = this.hero;
    Object.assign(h, save.hero);
    const g = save.game;
    h.stage = g?.stage ?? 0;
    h.runes = g?.runes ?? 0;
    h.city = g?.city ?? 'besatt';
    h.zone = g?.zone ?? 'forest';
    h.resumePos = g?.pos ? { ...g.pos } : null;
    h.playing = false;
    const s = g ? createSession(g.seed, g.killed) : createSession();
    this.ctx.session.seed = s.seed;
    this.ctx.session.killed.clear();
    for (const id of s.killed) this.ctx.session.killed.add(id);
    if (h.id) this.bus.emit('hero_loaded', { heroId: h.id });
  }

  /** Sparbar ögonblicksbild (för SaveManager). */
  getSnapshot(): HeroSave {
    const h = this.hero;
    return {
      hero: {
        id: h.id,
        name: h.name,
        cls: h.cls,
        level: h.level,
        xp: h.xp,
        gold: h.gold,
        inv: structuredClone(h.inv),
        equip: structuredClone(h.equip),
        fresh: h.fresh,
      },
      game: {
        seed: this.ctx.session.seed,
        killed: [...this.ctx.session.killed],
        zone: h.zone,
        pos: { ...h.pos },
        stage: h.stage,
        runes: h.runes,
        city: h.city,
      },
    };
  }

  /** Stänger ner moduler och lyssnare (t.ex. vid HMR). */
  dispose(): void {
    for (const m of this.modules) m.dispose();
    this.bus.clear();
  }

  newGame(): void {
    const s = createSession();
    this.ctx.session.seed = s.seed;
    this.ctx.session.killed.clear();
    this.bus.emit('new_game', { seed: this.session.seed });
    this.preview();
  }

  /** Tillfällig vy: rutnät för Startskogen och dess genererade monster (prickar, färg efter elit). */
  private preview(): void {
    const r = this.renderer;
    r.ground.removeChildren();
    r.objects.removeChildren();
    const g = new Graphics();
    const N = 22;
    for (let i = -N; i < N; i++)
      for (let j = -N; j < N; j++) {
        const { x, y } = Iso.toScreen(i, j);
        const shade = (i * 7 + j * 13) & 3;
        g.poly([x, y - 32, x + 64, y, x, y + 32, x - 64, y]).fill([0x26301f, 0x2b3522, 0x232c1d, 0x2e3824][shade] ?? 0x26301f);
      }
    r.ground.addChild(g);
    const specs = this.spawn.roll(this.spawn.area(this.zone.areaId), this.session);
    for (const s of specs) {
      const { x, y } = Iso.worldToScreen(s.pos[0], s.pos[1]);
      const c = s.elite === 'unik' ? 0xc7a35a : s.elite ? 0x6a6aff : 0xb8323c;
      const dot = new Graphics().ellipse(0, 0, 14, 7).fill({ color: 0x000000, alpha: 0.4 }).circle(0, -14, 9).fill(c);
      dot.position.set(x, y);
      dot.zIndex = Iso.depth(s.pos[0], s.pos[1]);
      r.objects.addChild(dot);
    }
    const label = new Text({
      text: `2D-motor under uppbyggnad · seed ${this.session.seed} · ${specs.length} monster`,
      style: { fontFamily: 'Cinzel, Georgia, serif', fontSize: 18, fill: 0xe6dfcc },
    });
    label.position.set(-label.width / 2, -N * 32 - 40);
    r.objects.addChild(label);
    r.world.position.set(r.width / 2, r.height / 2);
    r.world.scale.set(0.6);
  }
}
