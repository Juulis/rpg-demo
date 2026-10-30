import type { HeroState, Vec2 } from '../core/GameContext';
import { DATA } from '../data';
import type { HeroClass } from '../data/types';
import { canStartDodge, dodgeProfile } from './dodge';
import { barActiveSkills, passiveSkills, skillUnlocked } from './skills';
import type { HeroStats, Loot } from './loot/Loot';
import { SLOTS, type Equip, type Item } from './loot/types';
import { Inventory } from './Inventory';
import { isConsumableCategory } from './consumables';

/** Ren spellogik (ingen DOM/Pixi). Hjälten: tillstånd (delad HeroState), klass, beräknade attribut, väska och progression. */
export class HeroModel {
  readonly cls: HeroClass;
  stats: HeroStats;
  readonly inv: Inventory;
  moveTarget: Vec2 | null = null;
  moving = false;
  blocking = false;
  atkCd = 0;
  atkT = 0;
  /** Träff i attackanimation väntar på atkHitT (synkad med hitFrame). */
  atkPendingHit = false;
  atkHitT = 0;
  /** Visuell undvik-animation (synkad med undanmanöver). */
  dodgeT = 0;
  dodgeCd = 0;
  iframeT = 0;
  dodgeRemain = 0;
  dodgeVx = 0;
  dodgeVy = 0;
  shieldDodge = false;

  /** Avbryt pågående attackträff (död, zonbyte). */
  clearAttack(): void {
    this.atkPendingHit = false;
    this.atkHitT = 0;
    this.atkT = 0;
  }
  skillCd = 0;
  /** Cooldown per färdighets-id (sekunder kvar). */
  readonly skillCooldowns: Record<string, number> = {};
  stamina = 100;
  maxStamina = 100;
  staminaRegenDelay = 0;
  /** Temporära färdighetsbuffar. */
  skillDmgPct = 0;
  skillDmgT = 0;
  skillAtkSpeedPct = 0;
  skillTakeDmgPct = 0;
  nextCritBonus = 0;
  bannerDefT = 0;
  bannerDefBonus = 0;
  curse = 0;
  consumableBuffT = 0;
  consumableDmgPct = 0;
  consumableSpeedPct = 0;
  private hotLeft = 0;
  private hotPerTick = 0;
  private hotInterval = 0;
  private hotTimer = 0;
  readonly maxLevel = (DATA.portalVillage as unknown as { progression: { max_level: number } }).progression.max_level;

  constructor(
    readonly s: HeroState,
    private readonly L: Loot,
  ) {
    const c = DATA.classes.classes.find((k) => k.id === s.cls) ?? DATA.classes.classes[0];
    if (!c) throw new Error('Inga klasser i data');
    this.cls = c;
    s.inv ??= [];
    s.equip ??= {};
    this.inv = new Inventory(L, s.inv as Item[], s.equip as Equip, () => this.s.level);
    if (s.fresh) this.startGear();
    this.stats = this.compute();
    this.stamina = this.stats.maxSt;
    this.maxStamina = this.stats.maxSt;
    s.hp = s.maxHp = this.stats.maxHp;
  }

  get pos(): Vec2 {
    return this.s.pos;
  }
  get level(): number {
    return this.s.level;
  }
  forward(): Vec2 {
    return { x: Math.sin(this.s.facing), y: Math.cos(this.s.facing) };
  }

  compute(eq: Equip = this.inv.equip): HeroStats {
    return this.L.computeStats(this.cls, this.s.level, eq);
  }
  recalc(): void {
    this.stats = this.compute();
    this.maxStamina = this.stats.maxSt;
    this.stamina = Math.min(this.stamina, this.maxStamina);
    this.s.maxHp = this.stats.maxHp;
    this.s.hp = Math.min(this.s.hp, this.stats.maxHp);
  }

  /** Startutrustning: Normal tier 1 enligt klasser.json ({item, count, quality, affixes}). */
  private startGear(): void {
    this.inv.bag.length = 0;
    for (const sl of SLOTS) this.inv.equip[sl] = null;
    for (const g of this.cls.start_gear) {
      const b = this.L.B[g.item];
      if (!b) continue;
      const it = this.L.makeItem(g.item, { n: g.count || 1, quality: g.quality || 'normal', ilvl: 1 });
      const sl = this.L.slotOf(b);
      const slot = sl === 'ring' ? 'ring1' : sl;
      const autoEquip = this.L.equipable(b) && b.subtype !== 'kast' && slot && (SLOTS as readonly string[]).includes(slot);
      if (autoEquip && !this.inv.equip[slot as keyof Equip]) this.inv.equip[slot as keyof Equip] = it;
      else this.inv.add(it);
    }
    this.s.fresh = false;
  }

  /** XP-behov för nästa nivå: 100·n^1,5. Returnerar antal nya nivåer. */
  static need(n: number): number {
    return Math.round(100 * Math.pow(n, 1.5));
  }
  gainXp(n: number): number {
    const s = this.s;
    if (s.level >= this.maxLevel) return 0;
    s.xp += n;
    let ups = 0;
    while (s.level < this.maxLevel && s.xp >= HeroModel.need(s.level)) {
      s.xp -= HeroModel.need(s.level);
      s.level++;
      ups++;
      this.recalc();
      s.hp = this.stats.maxHp;
    }
    if (s.level >= this.maxLevel) s.xp = 0;
    return ups;
  }

  /** Äter eller dricker en förbrukningsvara ur väskan. */
  use(it: Item): void {
    const b = this.L.base(it);
    if (!isConsumableCategory(b.category)) return;
    const s = this.s;
    const st = this.stats;
    if (b.heal) s.hp = Math.min(st.maxHp, s.hp + b.heal);
    if (b.heal_pct) s.hp = Math.min(st.maxHp, s.hp + st.maxHp * b.heal_pct);
    const hot = b.heal_over_time;
    if (hot && hot.total > 0 && hot.duration_s > 0) {
      this.hotLeft = hot.total;
      this.hotInterval = hot.duration_s / Math.max(1, Math.ceil(hot.total / 3));
      this.hotPerTick = hot.total / Math.max(1, Math.ceil(hot.duration_s / this.hotInterval));
      this.hotTimer = this.hotInterval;
    }
    if (b.buff_duration_s && (b.buff_damage_pct || b.buff_speed_pct)) {
      this.consumableBuffT = b.buff_duration_s;
      this.consumableDmgPct = b.buff_damage_pct ?? 0;
      this.consumableSpeedPct = b.buff_speed_pct ?? 0;
    }
    it.n = (it.n ?? 1) - 1;
    if (it.n <= 0) this.inv.lift(it);
    else this.inv.onChange();
  }

  combatDamageMult(): number {
    let m = 1;
    if (this.consumableBuffT > 0 && this.consumableDmgPct > 0) m *= 1 + this.consumableDmgPct;
    if (this.skillDmgT > 0 && this.skillDmgPct > 0) m *= 1 + this.skillDmgPct;
    return m;
  }

  atkSpeedMult(): number {
    return this.skillDmgT > 0 && this.skillAtkSpeedPct > 0 ? 1 + this.skillAtkSpeedPct : 1;
  }

  passiveActive(id: string): boolean {
    const sk = this.cls.skills.find((s) => s.id === id);
    return !!sk && skillUnlocked(sk, this.s.level);
  }

  barSkills() {
    return barActiveSkills(this.cls);
  }

  passives() {
    return passiveSkills(this.cls);
  }

  skillCdLeft(id: string): number {
    const v = this.skillCooldowns[id] ?? 0;
    return v > 0 ? v : 0;
  }

  spendStamina(n: number): boolean {
    if (n <= 0) return true;
    if (this.stamina < n) return false;
    this.stamina -= n;
    this.staminaRegenDelay = DATA.classes.meta.resource?.regen_delay_s ?? 1;
    return true;
  }

  refundStamina(n: number): void {
    if (n <= 0) return;
    this.stamina = Math.min(this.maxStamina, this.stamina + n);
  }

  countJavelins(): number {
    return this.inv.bag.reduce((n, it) => n + (this.L.base(it).id === 'kastspjut' ? (it.n ?? 1) : 0), 0);
  }

  consumeJavelin(): boolean {
    const it = this.inv.bag.find((x) => this.L.base(x).id === 'kastspjut' && (x.n ?? 1) > 0);
    if (!it) return false;
    it.n = (it.n ?? 1) - 1;
    if (it.n <= 0) this.inv.lift(it);
    else this.inv.onChange();
    return true;
  }

  effectiveDefense(): number {
    let d = this.stats.defense;
    if (this.passiveActive('jarnvilja') && this.s.hp / this.s.maxHp < 0.3) d += 5;
    if (this.bannerDefT > 0) d += this.bannerDefBonus;
    return d;
  }

  moveSpeedMult(): number {
    return this.consumableBuffT > 0 && this.consumableSpeedPct > 0 ? 1 + this.consumableSpeedPct : 1;
  }

  /** Startar undanmanöver mot (dx, dy) i världsriktning. */
  tryDodge(dx: number, dy: number, animDuration = 0): boolean {
    const prof = dodgeProfile(this.cls.id);
    if (
      !canStartDodge({
        playing: this.s.playing,
        dodgeCd: this.dodgeCd,
        dodgeRemain: this.dodgeRemain,
        atkT: this.atkT,
      })
    )
      return false;
    const len = Math.hypot(dx, dy);
    if (len < 0.01) {
      const f = this.forward();
      dx = f.x;
      dy = f.y;
    } else {
      dx /= len;
      dy /= len;
    }
    this.clearAttack();
    this.moveTarget = null;
    this.blocking = false;
    this.dodgeCd = prof.cooldown_s;
    this.iframeT = prof.iframes_s;
    this.dodgeRemain = prof.duration_s;
    const spd = prof.distance / prof.duration_s;
    this.dodgeVx = dx * spd;
    this.dodgeVy = dy * spd;
    this.shieldDodge = !!prof.shield;
    this.s.facing = Math.atan2(dx, dy);
    this.dodgeT = Math.max(prof.duration_s, animDuration);
    return true;
  }

  dodging(): boolean {
    return this.dodgeRemain > 0;
  }

  invulnerable(): boolean {
    return this.iframeT > 0;
  }

  /** Regenerering per bildruta. */
  regen(dt: number): void {
    const s = this.s;
    if (this.stats.lifeRegen) s.hp = Math.min(this.stats.maxHp, s.hp + this.stats.lifeRegen * dt);
    this.atkCd -= dt;
    this.atkT -= dt;
    if (this.atkHitT > 0) this.atkHitT -= dt;
    if (this.dodgeT > 0) this.dodgeT -= dt;
    if (this.dodgeCd > 0) this.dodgeCd -= dt;
    if (this.iframeT > 0) this.iframeT -= dt;
    if (this.dodgeRemain > 0) this.dodgeRemain -= dt;
    if (this.dodgeRemain <= 0) this.shieldDodge = false;
    this.skillCd -= dt;
    for (const id of Object.keys(this.skillCooldowns)) {
      this.skillCooldowns[id] = Math.max(0, (this.skillCooldowns[id] ?? 0) - dt);
      if ((this.skillCooldowns[id] ?? 0) <= 0) this.skillCooldowns[id] = 0;
    }
    if (this.skillDmgT > 0) this.skillDmgT -= dt;
    if (this.bannerDefT > 0) this.bannerDefT -= dt;
    if (this.staminaRegenDelay > 0) this.staminaRegenDelay -= dt;
    else if (this.stamina < this.maxStamina) this.stamina = Math.min(this.maxStamina, this.stamina + this.stats.regen * dt);
    this.curse -= dt;
    if (this.consumableBuffT > 0) this.consumableBuffT -= dt;
    if (this.hotLeft > 0) {
      this.hotTimer -= dt;
      if (this.hotTimer <= 0) {
        const tick = Math.min(this.hotLeft, this.hotPerTick);
        this.hotLeft -= tick;
        s.hp = Math.min(this.stats.maxHp, s.hp + tick);
        this.hotTimer = this.hotInterval;
      }
    }
  }
}
