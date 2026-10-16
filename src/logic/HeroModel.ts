import type { HeroState, Vec2 } from '../core/GameContext';
import { DATA } from '../data';
import type { HeroClass } from '../data/types';
import type { HeroStats, Loot } from './loot/Loot';
import { SLOTS, type Equip, type Item } from './loot/types';
import { Inventory } from './Inventory';

/** Ren spellogik (ingen DOM/Pixi). Hjälten: tillstånd (delad HeroState), klass, beräknade attribut, väska och progression. */
export class HeroModel {
  readonly cls: HeroClass;
  stats: HeroStats;
  readonly inv: Inventory;
  stDelay = 0;
  moveTarget: Vec2 | null = null;
  moving = false;
  blocking = false;
  atkCd = 0;
  atkT = 0;
  skillCd = 0;
  curse = 0;
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
    s.hp = s.maxHp = this.stats.maxHp;
    s.stamina = s.maxStamina = this.stats.maxSt;
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
    this.s.maxHp = this.stats.maxHp;
    this.s.maxStamina = this.stats.maxSt;
    this.s.hp = Math.min(this.s.hp, this.stats.maxHp);
    this.s.stamina = Math.min(this.s.stamina, this.stats.maxSt);
  }

  /** Startutrustning: Normal tier 1 enligt klasser.json ({item, count, quality, affixes}). */
  private startGear(): void {
    this.inv.bag.length = 0;
    for (const sl of SLOTS) this.inv.equip[sl] = null;
    for (const g of this.cls.start_gear) {
      const b = this.L.B[g.item];
      if (!b || b.subtype) continue;
      const it = this.L.makeItem(g.item, { n: g.count || 1, quality: g.quality || 'normal', ilvl: 1 });
      const sl = this.L.slotOf(b);
      const slot = sl === 'ring' ? 'ring1' : sl;
      if (this.L.equipable(b) && slot && (SLOTS as readonly string[]).includes(slot) && !this.inv.equip[slot as keyof Equip])
        this.inv.equip[slot as keyof Equip] = it;
      else this.inv.add(it);
    }
    this.s.fresh = false;
  }

  spend(n: number): boolean {
    if (this.s.stamina < n) return false;
    this.s.stamina -= n;
    this.stDelay = (DATA.classes.meta as unknown as { resource: { regen_delay_s: number } }).resource.regen_delay_s;
    return true;
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
      s.stamina = this.stats.maxSt;
    }
    if (s.level >= this.maxLevel) s.xp = 0;
    return ups;
  }

  /** Dricker en dryck ur väskan. */
  use(it: Item): void {
    const b = this.L.base(it);
    if (b.category !== 'dryck') return;
    const s = this.s;
    const st = this.stats;
    if (b.heal) s.hp = Math.min(st.maxHp, s.hp + b.heal);
    if (b.heal_pct) s.hp = Math.min(st.maxHp, s.hp + st.maxHp * b.heal_pct);
    if (b.stamina) s.stamina = Math.min(st.maxSt, s.stamina + b.stamina);
    if (b.stamina_pct) s.stamina = Math.min(st.maxSt, s.stamina + st.maxSt * b.stamina_pct);
    it.n = (it.n ?? 1) - 1;
    if (it.n <= 0) this.inv.lift(it);
    else this.inv.onChange();
  }

  /** Regenerering per bildruta. */
  regen(dt: number): void {
    const s = this.s;
    this.stDelay -= dt;
    if (this.stDelay <= 0 && !this.blocking) s.stamina = Math.min(this.stats.maxSt, s.stamina + this.stats.regen * dt);
    if (this.blocking) s.stamina = Math.max(0, s.stamina - 4 * dt);
    if (this.stats.lifeRegen) s.hp = Math.min(this.stats.maxHp, s.hp + this.stats.lifeRegen * dt);
    this.atkCd -= dt;
    this.atkT -= dt;
    this.skillCd -= dt;
    this.curse -= dt;
  }
}
