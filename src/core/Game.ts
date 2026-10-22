import { EventBus } from './EventBus';
import type { GameEvents } from './events';
import type { GameContext, GameModule, HeroSave, HeroState, Vec2, ZoneView } from './GameContext';
import { createSession } from './Session';
import { Rng } from './Rng';
import type { GameAuthority } from './GameAuthority';
import type { FoundRegistry, SaveBackend } from './SaveBackend';
import { NoOpFoundRegistry } from './NoOpFoundRegistry';
import { CombatRules } from '../logic/CombatRules';
import { LocalAuthority } from '../logic/LocalAuthority';
import { DATA, validateData } from '../data';
import { Hero } from '../entities/Hero';
import type { NpcEntity } from '../entities/NpcEntity';
import type { Monster } from '../entities/Monster';
import { MonsterFactory } from '../entities/MonsterFactory';
import { Input } from '../input/Input';
import { Loot } from '../logic/loot/Loot';
import { AssetStore, dirIndex } from '../render/Assets';
import { Camera } from '../render/Camera';
import { DirSprite } from '../render/DirSprite';
import { Iso } from '../render/Iso';
import { Parallax } from '../render/Parallax';
import { Renderer } from '../render/Renderer';
import { CombatSystem } from '../systems/CombatSystem';
import { LootSystem } from '../systems/LootSystem';
import { MonsterAI } from '../systems/MonsterAI';
import { PortalSystem } from '../systems/PortalSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import type { GroundDrop, World } from '../systems/World';
import { Text } from '../text/Text';
import { Hud } from '../ui/Hud';
import { InventoryUI } from '../ui/InventoryUI';
import { ItemText } from '../ui/ItemText';
import { LootLabels } from '../ui/LootLabels';
import { MonsterBar } from '../ui/MonsterBar';
import { NpcDialog } from '../ui/NpcDialog';
import { NpcLabels } from '../ui/NpcLabels';
import { NpcSystem } from '../systems/NpcSystem';
import { Tooltip } from '../ui/Tooltip';
import type { Zone, ZoneName } from '../world/Zone';
import { DevCheatsView } from '../dev/DevCheatsView';
import { WorldStateService } from '../world/WorldStateService';
import { hydrateWorldStateFromLegacy, parseWorldState } from '../world/worldStateTypes';
import { ZoneFactory } from '../world/ZoneFactory';

const CLASS_TINT: Record<string, number> = { riddare: 0xffffff, barbar: 0xffd2b8, amazonkrigare: 0xffe6c8 };

/**
 * Toppnivå: äger bussen, renderaren, systemen och UI. Inga globaler; allt nås via Game-instansen.
 * Moduler (AudioManager, SaveManager, MapUI, StartMenu, Lorebook – Utvecklare 2) får GameContext via init().
 * zone_enter { name } skickas när en zon är färdigladdad: vid newGame, loadHero och portalbyte.
 */
export class Game {
  readonly bus = new EventBus<GameEvents>();
  readonly renderer = new Renderer();
  readonly spawn = new SpawnSystem();
  readonly text = new Text();
  readonly assets = new AssetStore();
  readonly rng = new Rng(Rng.newSeed());
  readonly loot = new Loot(this.text, this.rng);
  readonly authority: GameAuthority = new LocalAuthority(this.loot, new CombatRules(this.loot, this.rng));
  readonly worldState = new WorldStateService();
  private readonly heroState: HeroState = {
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
    facing: Math.PI,
    playing: false,
    resumePos: null,
    fresh: true,
  };
  private readonly zoneView: ZoneView = {
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
  private foundRegistry: FoundRegistry = new NoOpFoundRegistry();

  private world: World | null = null;
  private camera!: Camera;
  private parallax!: Parallax;
  private input!: Input;
  private zones!: ZoneFactory;
  private factory!: MonsterFactory;
  private lootSys!: LootSystem;
  private combat!: CombatSystem;
  private ai!: MonsterAI;
  private portals!: PortalSystem;
  private hud!: Hud;
  private tip!: Tooltip;
  private invUI!: InventoryUI;
  private labels!: LootLabels;
  private monBar!: MonsterBar;
  private npcSys!: NpcSystem;
  private npcDialog!: NpcDialog;
  private npcLabels!: NpcLabels;
  private switching = false;
  private targetMonster: Monster | null = null;
  private targetDrop: GroundDrop | null = null;
  private dead = false;

  constructor(private readonly modules: GameModule[] = []) {
    this.ctx = {
      bus: this.bus,
      hero: this.heroState,
      zone: this.zoneView,
      session: createSession(),
      data: DATA,
      rng: this.rng,
      worldState: this.worldState,
    };
  }

  get session() {
    return this.ctx.session;
  }
  /** Aktuell värld (för tester/debug). */
  get state(): World | null {
    return this.world;
  }

  async start(host: HTMLElement): Promise<void> {
    const issues = validateData();
    if (issues.length) console.warn('Datavarningar:', issues);
    await this.renderer.init(host);
    await this.assets.load();
    const r = this.renderer;
    this.camera = new Camera(r.world);
    this.parallax = new Parallax(r.background);
    this.zones = new ZoneFactory(this.assets);
    this.factory = new MonsterFactory(this.assets, this.spawn);
    const w = (): World => this.mustWorld();
    this.lootSys = new LootSystem(w, this.assets, () => this.foundRegistry);
    this.combat = new CombatSystem(w, this.lootSys);
    this.ai = new MonsterAI(w, this.combat, this.factory);
    this.portals = new PortalSystem(w, this.assets);
    this.hud = new Hud(this.text);
    this.tip = new Tooltip();
    const itemText = new ItemText(this.loot, this.text);
    this.invUI = new InventoryUI(this.loot, this.text, itemText, this.tip, this.assets, this.bus, (t) => this.hud.flash(t));
    this.labels = new LootLabels(this.lootSys);
    this.monBar = new MonsterBar(this.text);
    this.npcSys = new NpcSystem(this.assets, this.worldState);
    this.npcDialog = new NpcDialog(this.text, this.bus);
    this.npcLabels = new NpcLabels(this.text);
    this.labels.onClick = (d) => this.goPickup(d);
    this.portals.onEnter = (z) => this.travel(z);
    this.combat.onBossDefeated = (m) => this.bossDefeated(m);
    this.combat.onHeroDied = () => this.heroDied();
    this.ai.onBossStart = (m) => this.bossStart(m);
    this.ai.onBossPhase = (m, ph) => {
      const name = m.def.phases?.[ph]?.name ?? '';
      this.hud.flash(name);
      this.bus.emit('boss_phase', { phase: ph });
    };
    // Kartan (U2, MapView) täcker skärmen med rubrik överst och legend nederst: dölj HUD-delar som annars krockar.
    this.bus.on('map_toggle', ({ open }) => document.body.classList.toggle('map-open', open));
    this.bus.on('locale_changed', () => {
      this.hud.relabel();
      this.invUI.relabel();
    });
    this.bindInput(r.app.canvas);
    DevCheatsView.tryCreate(this.input);
    const resize = (): void => {
      this.camera.resize(r.width, r.height);
      this.parallax.resize(r.width, r.height);
    };
    resize();
    r.app.renderer.on('resize', resize);
    r.app.ticker.add((t) => this.tick(Math.min(0.05, t.deltaMS / 1000)));
    for (const m of this.modules) m.init(this.ctx);
    // Utan startmeny (U2) startas en standardhjälte direkt: ?cls=riddare|barbar|amazonkrigare.
    if (!this.world) {
      const cls = new URLSearchParams(location.search).get('cls');
      if (cls && DATA.classes.classes.some((c) => c.id === cls)) this.heroState.cls = cls;
      this.newGame();
    }
  }

  /**
   * Laddar en hjälte (från SaveManager/StartMenu) och startar spelet i sparad zon. Enda sättet för moduler att ändra hjältens tillstånd.
   * Med save.game sätts sessionen (seed + killed) och återupptagningsposition; utan game startas en ny session.
   */
  loadHero(save: HeroSave): void {
    const h = this.heroState;
    Object.assign(h, structuredClone(save.hero));
    const g = save.game;
    const legacyGame = g
      ? {
          seed: g.seed,
          killed: g.killed,
          zone: g.zone,
          pos: g.pos ? ([g.pos.x, g.pos.y] as [number, number]) : null,
          stage: g.stage,
          runes: g.runes,
          city: g.city,
        }
      : null;
    const ws = (save.worldState && parseWorldState(save.worldState)) || hydrateWorldStateFromLegacy(legacyGame, save.foundItems);
    this.worldState.replace(ws);
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
    if (this.camera) this.enterZone(h.zone === 'village' ? 'village' : 'forest', h.resumePos ?? undefined);
  }

  /** U2:s SaveBackend (#19) registreras här; motorn använder den för fyndregistret (loreboken). */
  setSaveBackend(b: SaveBackend): void {
    this.foundRegistry = b;
  }

  /** Sparbar ögonblicksbild (för SaveManager). */
  getSnapshot(): HeroSave {
    const h = this.heroState;
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
      worldState: this.worldState.snapshot(),
    };
  }

  /** Nytt game (D2): ny seed, tomma killed, runor nollställs, start i skogen. Hjälte och utrustning behålls. */
  newGame(): void {
    const s = createSession();
    this.ctx.session.seed = s.seed;
    this.ctx.session.killed.clear();
    const h = this.heroState;
    h.runes = 0;
    h.stage = 0;
    h.city = 'besatt';
    h.resumePos = null;
    this.worldState.resetForNewRun();
    this.worldState.setRunesActive(0);
    this.worldState.setCityState('gamla_byn', 'besatt');
    this.bus.emit('new_game', { seed: s.seed });
    this.enterZone('forest');
  }

  dispose(): void {
    for (const m of this.modules) m.dispose();
    this.input.dispose();
    this.hud.dispose();
    this.tip.dispose();
    this.invUI.dispose();
    this.labels.dispose();
    this.monBar.dispose();
    this.npcDialog.dispose();
    this.npcLabels.dispose();
    this.npcSys.dispose();
    this.bus.clear();
    this.renderer.destroy();
  }

  // ---------- zoner ----------
  private mustWorld(): World {
    if (!this.world) throw new Error('Ingen zon laddad');
    return this.world;
  }

  private travel(target: ZoneName): void {
    if (this.switching) return;
    this.switching = true;
    const fade = document.getElementById('fade');
    fade?.classList.add('on');
    setTimeout(() => {
      this.enterZone(target, target === 'forest' ? { x: 0, y: 4 } : undefined);
      fade?.classList.remove('on');
      setTimeout(() => (this.switching = false), 800);
    }, 380);
  }

  /** Bygger zonen, placerar hjälten, befolkar monster och skickar zone_enter när allt är klart. */
  enterZone(name: ZoneName, spawn?: Vec2): void {
    const r = this.renderer;
    r.ground.removeChildren().forEach((c) => c.destroy({ children: true }));
    r.objects.removeChildren().forEach((c) => c.destroy({ children: true }));
    r.effects.removeChildren().forEach((c) => c.destroy({ children: true }));
    const built = this.zones.build(name);
    r.ground.addChild(built.ground);
    for (const d of built.decor) r.objects.addChild(d);
    const hs = this.heroState;
    const heroView = new DirSprite(this.assets.heroes.setFor(hs.cls), 1, 26);
    heroView.sprite.tint = CLASS_TINT[hs.cls] ?? 0xffffff;
    r.objects.addChild(heroView);
    const hero =
      this.world && this.world.hero.inv.bag === hs.inv && this.world.hero.cls.id === hs.cls
        ? this.rebindHero(this.world.hero, heroView)
        : new Hero(hs, this.loot, heroView);
    hero.inv.onChange = () => {
      hero.recalc();
      if (this.invUI.isOpen()) this.invUI.render();
    };
    const zone: Zone = built.zone;
    this.world = {
      bus: this.bus,
      session: this.session,
      L: this.loot,
      rng: this.rng,
      authority: this.authority,
      text: this.text,
      hero,
      zone,
      monsters: [],
      drops: [],
      projectiles: [],
      objects: r.objects,
      effects: r.effects,
      fb: { flash: (t, c) => this.hud.flash(t, c), float: (p, t, k, l) => this.hud.float(p, t, k, l) },
      time: 0,
    };
    const p = spawn ?? zone.entry;
    hs.pos.x = p.x;
    hs.pos.y = p.y;
    zone.collide(hs.pos, 0.5);
    hs.zone = name;
    if (name === 'village' && hs.stage < 2) hs.stage = 2;
    hero.clearAttack();
    hero.view.playbackRate = 1;
    hero.moveTarget = null;
    this.targetMonster = null;
    this.targetDrop = null;
    this.factory.populate(this.world, hs.city);
    this.portals.attach(built.runeSprites);
    this.parallax.set(
      this.assets.backgrounds.get('himmel'),
      this.assets.backgrounds.get(name === 'village' ? 'fjarran_portalby' : 'fjarran_skog'),
    );
    this.camera.snap(hs.pos);
    this.hud.boss(null);
    this.invUI.setHero(hero);
    this.syncZoneView(zone);
    this.dead = false;
    hs.playing = true;
    this.npcSys.sync(this.world);
    this.hud.flash(this.text.t(name === 'village' ? 'msg.zone_village' : 'msg.zone_forest'));
    // DOM-signal för röktestet (ingen global): zon laddad och spelbar.
    document.documentElement.dataset.zone = name;
    this.bus.emit('zone_enter', { name });
  }

  private rebindHero(h: Hero, view: DirSprite): Hero {
    h.view = view;
    return h;
  }

  private syncZoneView(z: Zone): void {
    const v = this.zoneView as ZoneView & Record<string, unknown>;
    delete v.circle;
    delete v.rect;
    Object.assign(v, {
      name: z.name,
      areaId: z.areaId,
      width: z.width,
      height: z.height,
      colliders: z.colliders,
      runes: z.runes,
      portals: z.portals,
      cleared: z.cleared,
    });
    if (z.circle) v.circle = z.circle;
    if (z.rect) v.rect = z.rect;
  }

  // ---------- boss / död ----------
  private bossName(m: Monster): string {
    return this.text.data('monsterfamiljer', m.id, 'name', m.def.name);
  }
  private bossStart(m: Monster): void {
    this.heroState.stage = 3;
    this.hud.flash(this.text.t('msg.boss_wakes', { name: this.bossName(m) }), '#ff5566');
    this.bus.emit('boss_start', undefined);
    this.bus.emit('boss_phase', { phase: 0 });
  }
  private bossDefeated(m: Monster): void {
    this.heroState.stage = 4;
    this.heroState.city = 'rensad';
    this.bus.emit('boss_killed', { id: m.id });
    this.bus.emit('city_state_changed', { city: 'gamla_byn', state: 'rensad' });
    this.hud.boss(null);
    this.hud.flash(this.text.t('msg.boss_dead', { name: this.bossName(m) }), '#c7a35a');
  }
  private heroDied(): void {
    this.mustWorld().hero.clearAttack();
    this.dead = true;
    this.hud.flash(this.text.t('msg.died'), '#ff6060');
  }
  private respawn(): void {
    const h = this.mustWorld().hero;
    h.s.hp = h.stats.maxHp;
    h.s.stamina = h.stats.maxSt;
    this.enterZone('forest', { x: 0, y: 4 });
  }

  // ---------- input ----------
  private bindInput(canvas: HTMLCanvasElement): void {
    const i = (this.input = new Input(canvas));
    const toggleInv = (): void => this.invUI.toggle();
    i.bind('KeyB', toggleInv);
    i.bind('KeyI', toggleInv);
    i.bind('Escape', () => {
      if (this.npcDialog.isOpen) {
        this.npcDialog.close();
        this.bus.emit('ui_close', { panel: 'npc' });
        return;
      }
      if (this.invUI.isOpen()) this.invUI.close();
    });
    i.bind('KeyF', () => this.tryTalkNpc());
    i.bind('Digit3', () => this.quaff('hp'));
    i.bind('Digit4', () => this.quaff('st'));
    i.bind('KeyE', () => {
      const n = this.portals.nearRune();
      if (n >= 0) this.portals.activate(n, false);
    });
    i.bind('KeyQ', () => this.combat.skill(true));
    i.bind('up:KeyQ', () => this.combat.skill(false));
    i.bind('reset', () => this.combat.skill(false));
    canvas.addEventListener('pointerdown', (e) => {
      if (!this.world) return;
      if (this.dead) return this.respawn();
      if (e.button === 2) return this.combat.skill(true);
      if (e.button === 0) this.worldClick();
    });
    canvas.addEventListener('pointerup', (e) => {
      if (e.button === 2) this.combat.skill(false);
    });
  }

  private quaff(kind: 'hp' | 'st'): void {
    const h = this.world?.hero;
    if (!h) return;
    const it = h.inv.findPotion(kind);
    if (it) h.use(it);
    else this.hud.flash(this.text.t('msg.no_potions'));
  }

  private monsterAt(sx: number, sy: number): Monster | null {
    const w = this.world;
    if (!w) return null;
    let best: Monster | null = null;
    let bd = Infinity;
    for (const m of w.monsters) {
      if (m.dead) continue;
      const foot = this.camera.toScreen(m.pos.x, m.pos.y);
      const hgt = m.view.height2 * this.camera.zoom;
      const halfW = Math.max(26, hgt * 0.35);
      if (sx < foot.x - halfW || sx > foot.x + halfW || sy > foot.y + 12 || sy < foot.y - hgt) continue;
      const d = Math.abs(sx - foot.x) + Math.abs(sy - (foot.y - hgt / 2));
      if (d < bd) {
        bd = d;
        best = m;
      }
    }
    return best;
  }
  private dropAt(sx: number, sy: number): GroundDrop | null {
    const w = this.world;
    if (!w) return null;
    for (const d of w.drops) {
      const p = this.camera.toScreen(d.pos.x, d.pos.y, 8);
      if (Math.abs(p.x - sx) < 22 && Math.abs(p.y - sy) < 18) return d;
    }
    return null;
  }

  private openNpcDialog(ent: NpcEntity): void {
    const w = this.world;
    if (!w) return;
    const d = Math.hypot(ent.resolved.pos.x - w.hero.pos.x, ent.resolved.pos.y - w.hero.pos.y);
    if (d > 3.2) {
      w.fb.flash(w.text.t('msg.too_far'));
      return;
    }
    w.hero.moveTarget = null;
    this.targetMonster = null;
    this.targetDrop = null;
    this.npcDialog.show(ent.resolved);
    this.bus.emit('ui_open', { panel: 'npc' });
  }

  private tryTalkNpc(): void {
    const w = this.world;
    if (!w || this.npcDialog.isOpen) return;
    const n = this.npcSys.nearest(w);
    if (n) this.openNpcDialog(n);
  }

  private worldClick(): void {
    if (this.invUI.holding || this.npcDialog.isOpen) return;
    const { x, y } = this.input.mouse;
    const w = this.world;
    if (w) {
      const npc = this.npcSys.pickAt(x, y, this.camera);
      if (npc) return this.openNpcDialog(npc);
    }
    const d = this.dropAt(x, y);
    if (d && !d.data.gold) return this.goPickup(d);
    const m = this.monsterAt(x, y);
    this.targetDrop = null;
    if (m) {
      this.targetMonster = m;
      return;
    }
    this.targetMonster = null;
    this.mustWorld().hero.moveTarget = this.camera.toWorld(x, y);
  }

  private goPickup(d: GroundDrop): void {
    this.targetDrop = d;
    this.targetMonster = null;
    this.mustWorld().hero.moveTarget = { ...d.pos };
  }

  // ---------- spelloop ----------
  private tick(dt: number): void {
    const w = this.world;
    if (!w) return;
    w.time += dt;
    const h = w.hero;
    if (h.s.playing) this.heroUpdate(dt);
    this.ai.update(dt);
    this.combat.update(dt);
    this.lootSys.update(dt);
    this.portals.update(dt);
    this.camera.follow(h.pos, dt);
    this.parallax.update(this.camera.pos);
    this.hud.update(dt, h, this.camera);
    this.labels.update(w.drops, this.input.altHeld || this.input.labelsToggled, this.camera);
    this.npcLabels.update(this.npcSys.entities(), this.camera);
    this.hoverUpdate();
    const boss = w.monsters.find((m) => m.boss && m.active && !m.dead);
    if (boss)
      this.hud.boss(
        this.bossName(boss),
        boss.hp / boss.max,
        this.text.t('monster.phase', { n: boss.phase + 1, name: boss.def.phases?.[boss.phase]?.name ?? '' }),
      );
  }

  private heroUpdate(dt: number): void {
    const w = this.mustWorld();
    const h = w.hero;
    if (this.npcDialog.isOpen) {
      h.regen(dt);
      h.moveTarget = null;
      return;
    }
    const s = h.s;
    h.regen(dt);
    if (h.blocking && s.stamina <= 0) h.blocking = false;
    // fortsatt klick-och-håll styr mot muspekaren (D2)
    if (this.input.leftDown && !this.targetMonster && !this.targetDrop && !this.invUI.holding && this.input.overCanvas())
      h.moveTarget = this.camera.toWorld(this.input.mouse.x, this.input.mouse.y);
    let vx = 0;
    let vy = 0;
    const k = this.input;
    const sx = (k.isDown('KeyD') ? 1 : 0) - (k.isDown('KeyA') ? 1 : 0);
    const sy = (k.isDown('KeyS') ? 1 : 0) - (k.isDown('KeyW') ? 1 : 0);
    if (sx || sy) {
      // skärmriktning → värld (iso): skärm-x = x − y, skärm-y = (x + y)/2
      vx = sx / 2 + sy;
      vy = -sx / 2 + sy;
      h.moveTarget = null;
      this.targetMonster = null;
      this.targetDrop = null;
    }
    const tm = this.targetMonster;
    if (tm && (tm.dead || !w.monsters.includes(tm))) this.targetMonster = null;
    if (this.targetMonster) {
      const m = this.targetMonster;
      const d = Math.hypot(m.pos.x - h.pos.x, m.pos.y - h.pos.y);
      s.facing = Math.atan2(m.pos.x - h.pos.x, m.pos.y - h.pos.y);
      if (d <= h.stats.reach + (m.boss ? 0.6 : 0.2)) {
        h.moveTarget = null;
        this.combat.attack();
        if (!this.input.leftDown) this.targetMonster = null;
      } else h.moveTarget = { ...m.pos };
    }
    const td = this.targetDrop;
    if (td) {
      if (!w.drops.includes(td)) this.targetDrop = null;
      else if (Math.hypot(td.pos.x - h.pos.x, td.pos.y - h.pos.y) < 1.3) {
        void this.lootSys.pickup(td);
        this.targetDrop = null;
        h.moveTarget = null;
      }
    }
    if (h.moveTarget && !vx && !vy) {
      const dx = h.moveTarget.x - h.pos.x;
      const dy = h.moveTarget.y - h.pos.y;
      const d = Math.hypot(dx, dy);
      if (d < 0.15) h.moveTarget = null;
      else {
        vx = dx;
        vy = dy;
      }
    }
    const len = Math.hypot(vx, vy);
    h.moving = len > 0 && h.atkT <= 0;
    const sprintCfg = DATA.classes.meta.sprint;
    const wantSprint = (k.isDown('ShiftLeft') || k.isDown('ShiftRight')) && h.moving && !h.blocking && !!sprintCfg;
    let sprinting = false;
    if (wantSprint && h.s.stamina > 0) {
      sprinting = true;
      h.s.stamina = Math.max(0, h.s.stamina - sprintCfg.stamina_per_s * dt);
      h.stDelay = DATA.classes.meta.resource?.regen_delay_s ?? 1;
    }
    if (h.moving) {
      const runMult = sprinting && sprintCfg ? sprintCfg.speed_mult : 1;
      const sp = h.stats.speed * runMult * (h.blocking ? 0.4 : 1) * (h.curse > 0 ? 0.8 : 1);
      const step = Math.min(
        sp * dt,
        h.moveTarget && !this.targetMonster ? Math.hypot(h.moveTarget.x - h.pos.x, h.moveTarget.y - h.pos.y) : Infinity,
      );
      h.pos.x += (vx / len) * step;
      h.pos.y += (vy / len) * step;
      s.facing = Math.atan2(vx, vy);
      const before = { ...h.pos };
      w.zone.collide(h.pos, 0.5);
      if (h.moveTarget && Math.hypot(before.x - h.pos.x, before.y - h.pos.y) > step * 0.9) h.moveTarget = null;
      if (Math.floor(w.time * 3) !== Math.floor((w.time - dt) * 3)) this.bus.emit('step', undefined);
    }
    if (h.atkPendingHit && h.atkHitT <= 0) this.combat.resolveAttackHit();
    const v = h.view;
    v.dir = dirIndex(Math.sin(s.facing), Math.cos(s.facing));
    if (h.atkT > 0 && v.hasAnim('attack')) v.play('attack');
    else if (h.moving) v.play(sprinting && v.hasAnim('run') ? 'run' : 'gang');
    else v.play('idle');
    v.bobY = h.atkT > 0 && !v.hasAnim('attack') ? -Math.sin((h.atkT / 0.3) * Math.PI) * 6 : 0;
    v.update(dt);
    if (h.atkT <= 0) v.playbackRate = 1;
    v.sprite.tint = h.blocking ? 0xa0c8ff : (CLASS_TINT[s.cls] ?? 0xffffff);
    const sp = Iso.worldToScreen(h.pos.x, h.pos.y);
    v.position.set(sp.x, sp.y);
    v.zIndex = h.pos.x + h.pos.y;
  }

  private hoverUpdate(): void {
    const w = this.mustWorld();
    if (this.invUI.isOpen() && !this.input.overCanvas()) return;
    const { x, y } = this.input.mouse;
    const over = this.input.overCanvas();
    const m = over ? this.monsterAt(x, y) : null;
    const recent = w.monsters.find((q) => !q.dead && w.time - q.lastHit < 3 && q.lastHit > 0) ?? null;
    this.monBar.show(m ?? this.targetMonster ?? recent);
    if (!over) return;
    const t = this.text;
    if (m) {
      const hc = this.loot.hitChance(w.hero.stats.AR, 15 + 8 * m.lvl + m.defense * 2, w.hero.level, m.lvl);
      this.tip.show(
        `<div class="tn">${this.monBar.name(m)}</div><div class="tb">${t.t('tooltip.level', { level: m.lvl })}</div><div class="tb">${t.t('tooltip.hit_chance', { pct: Math.round(hc * 100) + ' %' })}</div>`,
        x,
        y,
      );
      return;
    }
    const pw = this.camera.toWorld(x, y);
    const rune = w.zone.runes.find((r) => Math.hypot(r.x - pw.x, r.y - pw.y) < 1.6);
    if (rune) {
      this.tip.show(
        `<div class="tn">${t.t('tooltip.rune')}</div><div class="tb">${t.t(rune.active ? 'tooltip.rune_active' : 'tooltip.rune_inactive')}</div>`,
        x,
        y,
      );
      return;
    }
    const portal = w.zone.portals.find((p) => Math.hypot(p.x - pw.x, p.y - pw.y) < 2);
    if (portal) {
      this.tip.show(
        `<div class="tn">${t.t('tooltip.portal')}</div><div class="tb">${t.t(portal.target === 'village' ? 'tooltip.portal_to_village' : 'tooltip.portal_to_forest')}</div>`,
        x,
        y,
      );
      return;
    }
    const d = this.dropAt(x, y);
    if (d?.data.item) {
      this.tip.show(
        `<div class="tn" style="color:${this.lootSys.color(d.data)}">${this.lootSys.label(d.data)}</div>`,
        x,
        y,
        d.data.item.quality,
      );
      return;
    }
    this.tip.hide();
  }
}
