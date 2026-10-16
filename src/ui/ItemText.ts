import type { Hero } from '../entities/Hero';
import type { HeroStats, Loot } from '../loot/Loot';
import type { Equip, Item } from '../loot/types';
import type { Text, TextKey } from '../text/Text';

const pct = (v: number): string => Math.round(v * 1000) / 10 + ' %';
const PCT_STATS = new Set([
  'damage_pct',
  'defense_pct',
  'block_chance',
  'magic_find',
  'lifesteal',
  'vs_demoner_damage_pct',
  'vs_ododa_damage_pct',
  'vs_bestar_damage_pct',
  'stamina_regen_pct',
  'attack_speed_pct',
  'move_speed_pct',
  'strong_hit_chance',
  'gold_find',
  'crit_chance',
  'resist_dark_magic',
  'speed_bonus',
]);
type CmpRow = [keyof HeroStats, TextKey, 0 | 1 | 2 | 3];
const CMP: CmpRow[] = [
  ['maxHp', 'stat.life', 0],
  ['maxSt', 'stat.stamina', 0],
  ['damage', 'stat.damage_avg', 0],
  ['defense', 'stat.defense', 0],
  ['block', 'stat.block', 1],
  ['AR', 'stat.ar', 0],
  ['strong', 'stat.strong', 1],
  ['crit', 'stat.crit', 1],
  ['mf', 'stat.mf', 2],
  ['speed', 'stat.speed', 3],
];

/** Bygger föremålstexter (tooltip med jämförelse) via Text – inga hårdkodade strängar. */
export class ItemText {
  constructor(
    private readonly L: Loot,
    private readonly text: Text,
  ) {}

  stat(k: string, v: number): string | null {
    const key = `affix_stat.${k}` as TextKey;
    const label = this.text.t(key);
    if (label === key) return null;
    const p = PCT_STATS.has(k);
    const n = p ? Math.round(v * 1000) / 10 : Math.round(v * 10) / 10;
    return `${n >= 0 ? '+' : ''}${n}${p ? '' : ' '}${label}`;
  }

  html(it: Item, hero: Hero, inBag: boolean): string {
    const L = this.L;
    const t = this.text;
    const b = L.base(it);
    const s = L.itemStats(it);
    const col = L.colorOf(it);
    const name = L.nameOf(it);
    const q = L.Q[it.quality];
    let h = `<div class="tn" style="color:${col}">${name}</div>`;
    const qn = b.category === 'dryck' || b.category === 'material' || !q ? '' : ` · ${t.data('loot_kvaliteter', q.id, 'name', q.name)}`;
    const bn = L.baseName(b);
    h += `<div class="tb">${name !== bn ? bn : ''}${qn}</div>`;
    if (s.wdmg)
      h += `<div>${t.t('tooltip.damage', { min: s.wdmg[0], max: s.wdmg[1] })} <small>(${b.damage_type ?? ''}${b.two_handed ? ', ' + t.t('tooltip.two_handed') : ''})</small></div>`;
    if (s.def) h += `<div>${t.t('tooltip.defense', { n: s.def })}</div>`;
    if (b.block_chance) h += `<div>${t.t('tooltip.block', { pct: pct((s.block_chance as number | undefined) ?? 0) })}</div>`;
    if (b.heal) h += `<div>${t.t('tooltip.heals', { n: b.heal })}</div>`;
    if (b.stamina) h += `<div>${t.t('tooltip.gives_stamina', { n: b.stamina })}</div>`;
    if (b.heal_pct) h += `<div>${t.t('tooltip.heals_pct', { pct: pct(b.heal_pct) })}</div>`;
    if (b.move_penalty) h += `<div class="bad">${t.t('tooltip.move_penalty', { pct: pct(b.move_penalty) })}</div>`;
    const req = b.requirements?.level ?? 1;
    if (req > 1) h += `<div class="${hero.inv.reqOk(it) ? 'tb' : 'bad'}">${t.t('tooltip.requires_level', { level: req })}</div>`;
    for (const a of it.affixes) h += `<div class="af">${this.stat(a.stat, a.value) ?? ''}</div>`;
    const fixed = L.fixedOf(it);
    if (fixed)
      for (const [k, v] of Object.entries(fixed)) {
        if (k === 'note') h += `<div class="tb"><i>${String(v)}</i></div>`;
        else if (typeof v === 'number') {
          const f = this.stat(k, v);
          if (f) h += `<div class="af" style="color:${col}">${f}</div>`;
        }
      }
    if (it.set) h += this.setHtml(it, hero);
    if (inBag && L.equipable(b)) h += this.compare(it, hero);
    if (b.category === 'dryck') h += `<div class="tb">${t.t('tooltip.rclick_drink')}</div>`;
    else if (L.equipable(b)) h += `<div class="tb">${t.t(inBag ? 'tooltip.rclick_equip' : 'tooltip.rclick_unequip')}</div>`;
    return h;
  }

  private setHtml(it: Item, hero: Hero): string {
    const L = this.L;
    const set = it.set ? L.SETS[it.set] : undefined;
    if (!set) return '';
    const eq = hero.inv.equip;
    const n = L.setCounts(eq)[set.id] ?? 0;
    const wrong = !!set.class && set.class !== 'alla' && set.class !== hero.cls.id;
    let h = `<div class="setH">${this.text.data('set', set.id, 'name', set.name)} (${n}/${set.pieces.length})${wrong ? ` <span class="bad">– ${this.text.t('tooltip.set_class_only', { cls: set.class ?? '' })}</span>` : ''}</div>`;
    h += set.pieces
      .map(
        (p) =>
          `<div class="setP ${Object.values(eq).some((e) => e?.set === set.id && e.base === p.base) ? 'on' : ''}">${this.text.data('set', p.id, 'name', p.name)}</div>`,
      )
      .join('');
    for (const [k, bon] of Object.entries(set.bonuses)) {
      const parts = Object.entries(bon)
        .map(([bk, bv]) => (typeof bv === 'number' ? this.stat(bk, bv) : bk.replace(/_/g, ' ')))
        .filter(Boolean)
        .join(', ');
      h += `<div class="setB ${n >= +k && !wrong ? 'on' : ''}">${this.text.t('tooltip.set_parts', { n: k })}: ${parts}</div>`;
    }
    return h;
  }

  private compare(it: Item, hero: Hero): string {
    const L = this.L;
    const t = this.text;
    const slot = hero.inv.bestSlot(it);
    if (!slot) return '';
    const cur = hero.inv.equip[slot];
    const a = hero.compute();
    const eq2: Equip = { ...hero.inv.equip, [slot]: it };
    if (slot === 'vapen' && L.base(it).two_handed) eq2.offhand = null;
    const c = hero.compute(eq2);
    let h = `<div class="cmpH">${t.t('tooltip.compare')} ${cur ? `<span style="color:${L.colorOf(cur)}">${L.nameOf(cur)}</span>` : t.t('tooltip.empty_slot')}</div>`;
    let any = false;
    for (const [k, lab, f] of CMP) {
      const d = (c[k] as number) - (a[k] as number);
      if (Math.abs(d) < 1e-6) continue;
      any = true;
      const v =
        f === 1
          ? Math.round(Math.abs(d) * 1000) / 10 + ' %'
          : f === 2
            ? Math.round(Math.abs(d)) + ' %'
            : f === 3
              ? Math.abs(d).toFixed(2)
              : Math.round(Math.abs(d) * 10) / 10;
      h += `<div class="${d > 0 ? 'good' : 'bad'}">${d > 0 ? '+' : '−'}${v} ${t.t(lab)}</div>`;
    }
    if (!any) h += `<div class="tb">${t.t('tooltip.no_diff')}</div>`;
    if (!hero.inv.reqOk(it)) h += `<div class="bad">${t.t('tooltip.cannot_wear')}</div>`;
    return h;
  }
}
