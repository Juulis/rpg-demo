import { DATA } from '../../data';
import type { Rng } from '../../core/Rng';
import type { HeroClass } from '../../data/types';
import type { Text } from '../../text/Text';
import type {
  Affix,
  AffixDef,
  BaseItem,
  BossDrop,
  Dict,
  Drop,
  Equip,
  FamilyTable,
  Item,
  Legendary,
  MonsterDrop,
  Num2,
  QualityDef,
  SetDef,
  SetPiece,
  Slot,
} from './types';

/** Seedad slump per drop (mulberry32) så att buggar kan återskapas. */
export class LootRng {
  private a: number;
  constructor(seed: number) {
    this.a = seed >>> 0;
  }
  next(): number {
    this.a = (this.a + 0x6d2b79f5) | 0;
    let t = Math.imul(this.a ^ (this.a >>> 15), 1 | this.a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(lo: number, hi: number): number {
    return lo + this.next() * (hi - lo);
  }
  int(lo: number, hi: number): number {
    return Math.floor(lo + this.next() * (hi - lo + 1));
  }
  pick<T>(arr: readonly T[]): T {
    const v = arr[Math.floor(this.next() * arr.length)];
    if (v === undefined) throw new Error('pick på tom lista');
    return v;
  }
  weighted(obj: Dict<number>): string | null {
    const e = Object.entries(obj).filter(([, w]) => w > 0);
    const tot = e.reduce((s, [, w]) => s + w, 0);
    let r = this.next() * tot;
    for (const [k, w] of e) if ((r -= w) < 0) return k;
    return e.at(-1)?.[0] ?? null;
  }
}

export interface HeroStats {
  maxHp: number;
  maxSt: number;
  defense: number;
  defReduce: number;
  defRating: number;
  AR: number;
  block: number;
  strong: number;
  crit: number;
  mf: number;
  goldFind: number;
  dmgMin: number;
  dmgMax: number;
  damage: number;
  speed: number;
  regen: number;
  atkSpeed: number;
  reach: number;
  ranged: boolean;
  type: string;
  lifesteal: number;
  lifeOnHit: number;
  lifeRegen: number;
  thorns: number;
  bleed: number;
  vs: Dict<number>;
  setActive: string[];
  twoHanded: boolean;
}
export interface ItemStats extends Dict<number | Num2 | undefined> {
  wdmg?: Num2;
  def?: number;
}

const SIZE: Dict<Num2> = {
  svard: [1, 3],
  yxa: [2, 3],
  klubba: [1, 3],
  spjut: [2, 4],
  bage: [2, 3],
  dolk: [1, 2],
  skold: [2, 2],
  hjalm: [2, 2],
  brost: [2, 3],
  handskar: [2, 2],
  balte: [2, 1],
  stovlar: [2, 2],
};

/**
 * Ren spellogik (ingen DOM/Pixi): körbar på server.
 * Lootsystemet (port av legacy js/loot.js, loot_design.md): kvaliteter, affix, set, legendariska, 7-stegs dropalgoritm,
 * samlade attribut. Inga ädelstenar, inga hylsor, ingen föremålsmodifiering.
 */
export class Loot {
  readonly Q: Dict<QualityDef>;
  readonly B: Dict<BaseItem>;
  readonly LEG: Dict<Legendary>;
  readonly SETS: Dict<SetDef>;
  readonly SETPIECE: Dict<{ set: SetDef; piece: SetPiece }> = {};
  private readonly bas = DATA.items as unknown as {
    weapons: BaseItem[];
    armor: BaseItem[];
    jewelry: BaseItem[];
    potions: BaseItem[];
    materials: BaseItem[];
    legendary: Legendary[];
    meta: { tiers: Dict<{ ilvl: Num2 }> };
    gold: { gold_min_per_lvl: number; gold_max_per_lvl: number };
  };
  private readonly qual = DATA.qualities as unknown as {
    qualities: QualityDef[];
    roll_order: string[];
    rare_names: { forsta: string[]; andra: string[] };
  };
  private readonly affixes = (DATA.affixes as unknown as { affixes: AffixDef[] }).affixes;
  private readonly drops = DATA.drops as unknown as {
    family_tables: Dict<FamilyTable>;
    monsters: Dict<MonsterDrop>;
    bosses: Dict<BossDrop>;
    potion_weights_by_tier: Dict<Dict<number>>;
  };
  private readonly attr = DATA.attributes as unknown as {
    magic_find: { k: Dict<number | null> };
    hit_chance: { floor: number; cap: number };
    block_chance: { cap: number };
    strong_hit: { chance_cap: number };
    crit: { cap: number };
    move_speed: { penalty_cap: number };
    stamina: { regen_floor: number };
  };

  constructor(
    private readonly text: Text,
    private readonly rng: Rng,
  ) {
    this.Q = Object.fromEntries(this.qual.qualities.map((q) => [q.id, q]));
    const all = [...this.bas.weapons, ...this.bas.armor, ...this.bas.jewelry, ...this.bas.potions, ...this.bas.materials];
    this.B = Object.fromEntries(all.map((b) => [b.id, b]));
    this.LEG = Object.fromEntries(this.bas.legendary.map((l) => [l.id, l]));
    const sets = (DATA.sets as unknown as { sets: SetDef[] }).sets;
    this.SETS = Object.fromEntries(sets.map((s) => [s.id, s]));
    for (const s of sets) for (const p of s.pieces) this.SETPIECE[s.id + ':' + p.base] = { set: s, piece: p };
  }

  // ----- bastyp -----
  base(it: Item): BaseItem {
    const b = this.B[it.base];
    if (!b) throw new Error(`Okänd bastyp: ${it.base}`);
    return b;
  }
  slotOf(b: BaseItem): string | null {
    if (b.category === 'vapen') return b.weapon_type === 'skold' ? 'offhand' : 'vapen';
    if (b.category === 'rustning') return b.slot ?? null;
    if (b.category === 'amulett' || b.category === 'ring') return b.category;
    return null;
  }
  equipable(b: BaseItem): boolean {
    return !!this.slotOf(b) && !b.subtype && !b.stack;
  }
  sizeOf(b: BaseItem): Num2 {
    if (b.size) return b.size;
    if (b.id === 'handyxa' || b.id === 'knotpak') return [1, 3];
    if (b.id === 'tornskold') return [2, 3];
    if (b.two_handed && b.weapon_type === 'klubba') return [2, 4];
    return SIZE[b.weapon_type ?? ''] ?? SIZE[b.slot ?? ''] ?? [1, 1];
  }
  private affixGroups(b: BaseItem): string[] {
    const s = this.slotOf(b);
    if (s === 'vapen') return ['vapen_ej_skold'];
    if (s === 'offhand') return ['skold'];
    if (b.category === 'rustning') return ['rustning', b.slot ?? ''];
    return [s ?? ''];
  }

  // ----- föremål -----
  makeItem(baseId: string, o: Partial<Item> = {}): Item {
    const b = this.B[baseId];
    if (!b) throw new Error(`Okänd bastyp: ${baseId}`);
    const it: Item = {
      uid: this.rng.id(),
      base: baseId,
      quality: o.quality ?? 'normal',
      affixes: o.affixes ?? [],
      ilvl: o.ilvl ?? b.item_level ?? 1,
      seed: o.seed,
    };
    if (o.set) it.set = o.set;
    if (o.leg) it.leg = o.leg;
    if (o.rareName) it.rareName = o.rareName;
    if (b.stack) it.n = o.n ?? 1;
    return it;
  }
  setPiece(it: Item): SetPiece | undefined {
    return it.set ? this.SETPIECE[it.set + ':' + it.base]?.piece : undefined;
  }
  baseName(b: BaseItem): string {
    return this.text.data('foremal_bas', b.id, 'name', b.name);
  }
  nameOf(it: Item): string {
    const b = this.base(it);
    const leg = it.leg ? this.LEG[it.leg] : undefined;
    if (leg) return this.text.data('foremal_bas', leg.id, 'name', leg.name);
    const sp = this.setPiece(it);
    if (sp) return this.text.data('set', sp.id, 'name', sp.name);
    if (it.rareName) return it.rareName;
    const bn = this.baseName(b);
    if (it.quality === 'magic') {
      const pre = it.affixes.find((a) => a.kind === 'prefix');
      const suf = it.affixes.find((a) => a.kind === 'suffix');
      const an = (a: Affix): string => this.text.data('affix', a.id, 'name', a.name);
      return [pre && an(pre), pre ? bn.toLowerCase() : bn, suf && an(suf)].filter(Boolean).join(' ');
    }
    return bn;
  }
  colorOf(it: Item): string {
    const b = this.base(it);
    if (b.category === 'dryck') return b.heal || b.heal_pct ? '#e05a5a' : '#e0b24a';
    if (b.category === 'material') return '#b0a890';
    return this.Q[it.quality]?.color ?? '#e6dfcc';
  }
  fixedOf(it: Item): Dict<number | string> | null {
    if (it.leg) return this.LEG[it.leg]?.fixed ?? null;
    return this.setPiece(it)?.fixed ?? null;
  }
  itemStats(it: Item): ItemStats {
    const b = this.base(it);
    const s: ItemStats = {};
    const add = (k: string, v: number): void => {
      s[k] = ((s[k] as number | undefined) ?? 0) + v;
    };
    const num = (k: string): number => (s[k] as number | undefined) ?? 0;
    for (const a of it.affixes) add(a.stat, a.value);
    const fixed = this.fixedOf(it);
    if (fixed) for (const [k, v] of Object.entries(fixed)) if (typeof v === 'number') add(k, v);
    if (b.damage) {
      const pct = num('damage_pct');
      s.wdmg = [Math.round(b.damage[0] * (1 + pct)), Math.round(b.damage[1] * (1 + pct))];
    }
    if (b.defense != null || s.defense || s.defense_pct) s.def = Math.round(((b.defense ?? 0) + num('defense')) * (1 + num('defense_pct')));
    if (b.block_chance) add('block_chance', b.block_chance);
    if (b.max_hp_bonus) add('life', b.max_hp_bonus);
    if (b.speed_bonus) add('move_speed_pct', b.speed_bonus);
    return s;
  }

  // ----- affix och kvalitet -----
  private rollAffixes(b: BaseItem, ilvl: number, q: string, R: LootRng, maxVals: boolean): Affix[] {
    const groups = this.affixGroups(b);
    const out: Affix[] = [];
    const used = new Set<string>();
    const cfg = this.Q[q]?.affixes;
    if (!cfg) return out;
    const total = R.int(cfg.total[0], cfg.total[1]);
    let np = 0;
    let ns = 0;
    for (let i = 0; i < total * 4 && out.length < total; i++) {
      const pool = this.affixes.filter(
        (a) =>
          !used.has(a.id) &&
          a.slots.some((sl) => groups.includes(sl)) &&
          a.tiers.some((t) => t.min_ilvl <= ilvl) &&
          (a.kind === 'prefix' ? np < cfg.prefix[1] : ns < cfg.suffix[1]),
      );
      if (!pool.length) break;
      const a = R.pick(pool);
      const tiers = a.tiers.filter((t) => t.min_ilvl <= ilvl);
      const t = maxVals ? (tiers.at(-1) ?? R.pick(tiers)) : R.pick(tiers);
      let v = maxVals ? t.value[1] : R.range(t.value[0], t.value[1]);
      v = Number.isInteger(t.value[0]) && Number.isInteger(t.value[1]) ? Math.round(v) : Math.round(v * 100) / 100;
      used.add(a.id);
      if (a.kind === 'prefix') np++;
      else ns++;
      out.push({ id: a.id, name: a.name, kind: a.kind, stat: a.stat, value: v, tier: t.tier });
    }
    return out;
  }
  effMf(q: string, mf: number): number {
    const k = this.attr.magic_find.k[q];
    return k ? (mf * k) / (mf + k) : mf;
  }
  private qualityChance(q: string, mlvl: number, mf: number, bossBonus?: Dict<number> | null): number {
    return (this.Q[q]?.base_chance ?? 0) * (1 + this.effMf(q, mf) / 100) * (1 + (mlvl - 1) * 0.03) * (bossBonus?.[q] ?? 1);
  }
  private finishQuality(b: BaseItem, q: string, ilvl: number, R: LootRng): Item {
    let extra = false;
    let maxVals = false;
    if (q === 'legendary') {
      const c = this.bas.legendary.filter((l) => l.base === b.id && (l.item_level ?? l.level ?? 1) <= ilvl);
      if (c.length) return this.makeItem(b.id, { ilvl, quality: 'legendary', leg: R.pick(c).id });
      q = 'rare';
      extra = true;
    }
    if (q === 'set') {
      const c = Object.values(this.SETS).filter((s) => (s.item_level ?? s.level ?? 1) <= ilvl && s.pieces.some((p) => p.base === b.id));
      if (c.length) return this.makeItem(b.id, { ilvl, quality: 'set', set: R.pick(c).id });
      q = 'magic';
      maxVals = true;
    }
    if (q === 'magic' || q === 'rare') {
      let affixes = this.rollAffixes(b, ilvl, q, R, maxVals);
      if (extra) {
        const more = this.rollAffixes(b, ilvl, 'rare', R, true).filter((a) => !affixes.some((x) => x.id === a.id));
        affixes = affixes.concat(more).slice(0, 6);
      }
      const it = this.makeItem(b.id, { ilvl, quality: q, affixes });
      if (q === 'rare') it.rareName = R.pick(this.qual.rare_names.forsta) + ' ' + R.pick(this.qual.rare_names.andra);
      return it;
    }
    return this.makeItem(b.id, { ilvl, quality: 'normal' });
  }
  private rollQuality(mlvl: number, mf: number, bossBonus: Dict<number> | null | undefined, R: LootRng, minQ?: string): string {
    for (const q of this.qual.roll_order) {
      if (q === 'normal') break;
      if (R.next() < this.qualityChance(q, mlvl, mf, bossBonus)) return q;
    }
    return minQ ?? 'normal';
  }
  private pickBase(pool: BaseItem[], ilvl: number, R: LootRng): BaseItem | null {
    const ok = pool.filter((b) => (b.item_level ?? 1) <= ilvl && !b.subtype && b.id !== 'pilar' && !(ilvl >= 20 && b.tier === 1));
    if (!ok.length) return null;
    const top = Math.max(...ok.map((b) => b.tier ?? 1));
    const w: Dict<number> = {};
    for (const b of ok) w[b.id] = (b.tier ?? 1) === top ? 3 : 1;
    const id = R.weighted(w);
    return id ? (this.B[id] ?? null) : null;
  }
  private tierOf(ilvl: number): string {
    for (const [t, r] of Object.entries(this.bas.meta.tiers)) if (ilvl >= r.ilvl[0] && ilvl <= r.ilvl[1]) return t;
    return '3';
  }
  private rollCategory(
    cat: string,
    mlvl: number,
    ilvl: number,
    mf: number,
    bb: Dict<number> | null | undefined,
    R: LootRng,
    minQ?: string,
  ): Item | null {
    if (cat === 'dryck') {
      const id = R.weighted(this.drops.potion_weights_by_tier[this.tierOf(ilvl)] ?? {});
      return id ? this.makeItem(id) : null;
    }
    if (cat === 'material') return this.makeItem(R.pick(this.bas.materials).id);
    const pool =
      cat === 'vapen' ? this.bas.weapons : cat === 'rustning' ? this.bas.armor : this.bas.jewelry.filter((j) => j.category === cat);
    const b = this.pickBase(pool, ilvl, R);
    return b ? this.finishQuality(b, this.rollQuality(mlvl, mf, bb, R, minQ), ilvl, R) : null;
  }

  /** Dropalgoritmen (loot_design.md, 7 steg). */
  rollDrops(o: { id: string; mlvl?: number; ilvl?: number; mf?: number; goldFind?: number; firstKill?: boolean }): {
    seed: number;
    drops: Drop[];
  } {
    const seed = Math.floor(this.rng.next() * 2 ** 32) >>> 0;
    const R = new LootRng(seed);
    const out: Drop[] = [];
    const boss = this.drops.bosses[o.id];
    const mon = this.drops.monsters[o.id];
    const src = boss ?? mon;
    const fam = this.drops.family_tables[src?.table ?? src?.family ?? 'bestar'] ?? this.drops.family_tables.bestar;
    if (!fam) return { seed, drops: out };
    const mf = o.mf ?? 0;
    const mlvl = o.mlvl ?? (boss && typeof boss.monster_level === 'number' ? boss.monster_level : 1);
    const ilvl = o.ilvl ?? mlvl;
    const weights: Dict<number> = { ...fam.category_weights };
    const ov = mon?.table_override?.category_weights;
    if (ov) for (const k of Object.keys(weights)) weights[k] = ov[k] ?? 0;
    delete weights.adelsten;
    const goldMult = boss ? boss.gold_mult : fam.gold_mult;
    const gold = (): number =>
      Math.max(
        1,
        Math.round(mlvl * R.range(this.bas.gold.gold_min_per_lvl, this.bas.gold.gold_max_per_lvl) * goldMult * (1 + (o.goldFind ?? 0))),
      );
    const push = (it: Item | { gold: number } | null): void => {
      if (!it) return;
      out.push('gold' in it ? { gold: it.gold } : { item: it });
    };
    const one = (bb: Dict<number> | null | undefined, minQ?: string): Item | { gold: number } | null => {
      const wd = src?.weapon_drop;
      if (wd && R.next() < wd.chance) {
        const b = this.pickBase(
          this.bas.weapons.filter((w) => w.weapon_type === wd.weapon_type),
          ilvl,
          R,
        );
        if (b) return this.finishQuality(b, this.rollQuality(mlvl, mf, bb, R, minQ), ilvl, R);
      }
      if (mon?.shield_drop && R.next() < mon.shield_drop.chance) {
        const b = this.pickBase(
          this.bas.weapons.filter((w) => w.weapon_type === 'skold'),
          ilvl,
          R,
        );
        if (b) return this.finishQuality(b, this.rollQuality(mlvl, mf, bb, R, minQ), ilvl, R);
      }
      let cat = R.weighted(weights);
      if (minQ) cat = R.pick(['vapen', 'rustning', 'amulett', 'ring']);
      if (cat === 'guld') return { gold: gold() * 2 };
      return cat ? this.rollCategory(cat, mlvl, ilvl, mf, bb, R, minQ) : null;
    };
    if (boss) {
      const n = R.int(boss.drops[0], boss.drops[1]);
      const guaranteed = boss.guaranteed ?? [];
      for (const g of guaranteed) for (let i = 0; i < g.count; i++) out.push({ item: this.makeItem(g.item) });
      for (const nd of boss.named_drops ?? [])
        if (R.next() < nd.chance) {
          const l = nd.legendary ? this.LEG[nd.legendary] : undefined;
          if (l) out.push({ item: this.makeItem(l.base, { quality: 'legendary', leg: l.id, ilvl }) });
          const s = nd.set ? this.SETS[nd.set] : undefined;
          if (s) out.push({ item: this.makeItem(R.pick(s.pieces).base, { quality: 'set', set: s.id, ilvl }) });
        }
      if (o.firstKill && boss.first_kill_bonus)
        for (let i = 0; i < boss.first_kill_bonus.count; i++) push(one(boss.quality_bonus, boss.first_kill_bonus.min_quality));
      const want = n + guaranteed.reduce((s, g) => s + g.count, 0);
      for (let guard = 0; out.length < want && guard < 50; guard++) push(one(boss.quality_bonus));
      out.push({ gold: gold() });
    } else {
      if (R.next() < (mon?.drop_chance_override ?? fam.drop_chance)) push(one(null));
      if (R.next() < fam.gold_chance) out.push({ gold: gold() });
      for (const e of fam.extra ?? []) if (R.next() < e.chance) out.push({ item: this.makeItem(e.item) });
    }
    for (const d of out) if (d.item) d.item.seed = seed;
    return { seed, drops: out };
  }
  monsterFamily(id: string): string | undefined {
    return (this.drops.bosses[id] ?? this.drops.monsters[id])?.family;
  }

  // ----- samlade attribut (attribut.json) -----
  setCounts(equip: Equip): Dict<number> {
    const c: Dict<number> = {};
    for (const it of Object.values(equip)) if (it?.set) c[it.set] = (c[it.set] ?? 0) + 1;
    return c;
  }
  computeStats(cls: HeroClass, level: number, equip: Equip): HeroStats {
    const b = cls.base;
    const g = { hp: 0, stamina: 0, damage: 0, defense: 0, crit_chance: 0, ...(cls.growth as Dict<number> | undefined) };
    const L = level - 1;
    const t: Dict<number> = {};
    const add = (k: string, v: unknown): void => {
      if (typeof v === 'number') t[k] = (t[k] ?? 0) + v;
    };
    let wdmg: Num2 | null = null;
    let weapon: BaseItem | null = null;
    let itemDef = 0;
    let block = 0;
    let movePen = 0;
    let regenPen = 0;
    let shield = false;
    for (const [slot, it] of Object.entries(equip) as [Slot, Item | null | undefined][]) {
      if (!it) continue;
      const s = this.itemStats(it);
      const base = this.base(it);
      for (const [k, v] of Object.entries(s))
        if (!['defense', 'defense_pct', 'damage_pct', 'block_chance', 'wdmg', 'def'].includes(k)) add(k, v);
      if (s.wdmg && slot === 'vapen') wdmg = s.wdmg;
      if (s.def) itemDef += s.def;
      if (slot === 'offhand' && base.weapon_type === 'skold') {
        shield = true;
        block += (s.block_chance as number | undefined) ?? 0;
      }
      if (slot === 'vapen') weapon = base;
      if (s.damage_pct && slot !== 'vapen') add('damage_pct', s.damage_pct);
      let mp = base.move_penalty ?? 0;
      if (base.weight === 'plate' && cls.id === 'riddare') mp /= 2;
      movePen += mp;
      regenPen = Math.max(regenPen, base.stamina_regen_penalty ?? 0);
    }
    const setActive: string[] = [];
    for (const [sid, n] of Object.entries(this.setCounts(equip))) {
      const s = this.SETS[sid];
      if (!s || (s.class && s.class !== 'alla' && s.class !== cls.id)) continue;
      for (const [k, bon] of Object.entries(s.bonuses))
        if (n >= +k) {
          setActive.push(sid + ':' + k);
          for (const [bk, bv] of Object.entries(bon)) {
            if (bk === 'block_chance' && typeof bv === 'number') block += bv;
            else if (bk === 'defense' && typeof bv === 'number') itemDef += bv;
            else if (bk === 'magic_unlock_preview') add('stamina', (bv as { mana?: number }).mana);
            else add(bk, bv);
          }
        }
    }
    const v = (k: string): number => t[k] ?? 0;
    const defTotal = (b.defense + g.defense * L + itemDef) * (1 + v('defense_pct'));
    const maxHp = Math.round((b.hp + g.hp * L + v('life')) * (1 + v('life_pct')));
    const maxSt = Math.round((b.stamina + g.stamina * L + v('stamina')) * (1 + v('stamina_pct')));
    const AR = 15 + 8 * level + v('attack_rating');
    const dmgPct = v('damage_pct');
    const w = weapon as BaseItem | null;
    const flat = b.damage + g.damage * L + v('damage_flat');
    const dMin = (flat + (wdmg ? wdmg[0] : 0)) * (1 + dmgPct);
    const dMax = (flat + (wdmg ? wdmg[1] : 0)) * (1 + dmgPct);
    const pen = Math.min(this.attr.move_speed.penalty_cap, movePen);
    return {
      maxHp,
      maxSt,
      defense: defTotal,
      defReduce: defTotal * 0.5 + v('damage_reduction_flat'),
      defRating: defTotal * 10,
      AR,
      block: shield ? Math.min(this.attr.block_chance.cap, block) : 0,
      strong: Math.min(this.attr.strong_hit.chance_cap, v('strong_hit_chance')),
      crit: Math.min(this.attr.crit.cap, b.crit_chance + g.crit_chance * L + v('crit_chance')),
      mf: v('magic_find') * 100,
      goldFind: v('gold_find'),
      dmgMin: Math.round(dMin),
      dmgMax: Math.round(dMax),
      damage: (dMin + dMax) / 2,
      speed: b.speed * (1 + v('move_speed_pct') - pen),
      regen: Math.max(this.attr.stamina.regen_floor, 8 * (1 + v('stamina_regen_pct') - regenPen)),
      atkSpeed: (w?.attack_speed ?? 1) * (1 + v('attack_speed_pct')),
      reach: Math.max(2.0, w?.range && w.range < 5 ? w.range + 0.3 : 2.2) + v('range_bonus'),
      ranged: !!(w?.range && w.range > 5),
      type: w?.damage_type ?? cls.main_damage_type,
      lifesteal: v('lifesteal'),
      lifeOnHit: v('life_on_hit'),
      lifeRegen: v('life_regen'),
      thorns: v('thorns'),
      bleed: v('bleed_dps'),
      vs: { ododa: v('vs_ododa_damage_pct'), bestar: v('vs_bestar_damage_pct'), demoner: v('vs_demoner_damage_pct') },
      setActive,
      twoHanded: !!w?.two_handed,
    };
  }
  /** Träffchans (attribut.json): clamp(0,8·2·AR/(AR+DR) + nivåterm, 5 %, 95 %). */
  hitChance(AR: number, DR: number, alvl: number, dlvl: number): number {
    const d = alvl - dlvl;
    const lt = d < 0 ? 0.067 * d : 0.033 * d;
    return Math.min(this.attr.hit_chance.cap, Math.max(this.attr.hit_chance.floor, (0.8 * 2 * AR) / (AR + DR) + lt));
  }
  /** Lorebokens id för ett föremål: legendarisk id, setdelens id eller bastyp. */
  foundId(it: Item): string {
    return it.leg ?? this.setPiece(it)?.id ?? it.base;
  }
}
