import { Assets as PixiAssets, Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { DATA } from '../data';
import type { Vec2 } from '../core/GameContext';
import type { Monster } from '../entities/Monster';
import type { AssetStore } from '../render/Assets';
import { Iso } from '../render/Iso';
import type { Drop, Item } from '../loot/types';
import type { GroundDrop, World } from './World';

const QRANK: Record<string, number> = { legendary: 0, set: 1, rare: 2, magic: 3, normal: 4 };

/** Lägger loot på marken (rollDrops), plockar upp (guld automatiskt) och registrerar fynd för loreboken (rpg_found). */
export class LootSystem {
  constructor(
    private readonly w: () => World,
    private readonly assets: AssetStore,
  ) {}

  dropFor(m: Monster, firstKill: boolean): void {
    const w = this.w();
    const st = w.hero.stats;
    const cap = DATA.monsterLevels.item_level.cap;
    const ilvl = Math.min(cap, m.lvl + (m.boss ? 2 : m.elite === 'unik' ? 1 : 0));
    const { drops } = w.L.rollDrops({ id: m.id, mlvl: m.lvl, ilvl, mf: st.mf, goldFind: st.goldFind, firstKill });
    const lo = m.es?.extraLoot;
    if (lo)
      for (let i = 0; i < (lo.extra_rolls || 0); i++)
        drops.push(
          ...w.L.rollDrops({ id: m.id, mlvl: m.lvl, ilvl, mf: st.mf + ((lo.quality_mult || 1) - 1) * 100, goldFind: st.goldFind }).drops,
        );
    drops.forEach((d, i) => {
      const a = (i / drops.length) * 6.28 + Math.random();
      const r = drops.length > 1 ? 0.6 + Math.random() * 0.6 : Math.random() * 0.3;
      const p = { x: m.pos.x + Math.cos(a) * r, y: m.pos.y + Math.sin(a) * r };
      w.zone.collide(p, 0.2);
      this.spawn(p, d);
    });
  }

  label(d: Drop): string {
    const L = this.w().L;
    if (d.gold) return this.w().text.t('tooltip.gold', { n: d.gold });
    const it = d.item as Item;
    return L.nameOf(it) + ((it.n ?? 1) > 1 ? ` (${it.n})` : '');
  }
  color(d: Drop): string {
    return d.gold ? '#f2c46b' : this.w().L.colorOf(d.item as Item);
  }
  rank(d: Drop): number {
    return d.item ? (QRANK[d.item.quality] ?? 5) : 6;
  }

  spawn(pos: Vec2, d: Drop): void {
    const w = this.w();
    const view = new Container();
    const col = parseInt(this.color(d).slice(1), 16);
    const glow = new Graphics().ellipse(0, 0, 22, 11).fill({ color: col, alpha: 0.25 });
    view.addChild(glow);
    if (d.gold) view.addChild(new Graphics().circle(0, -6, 7).fill(0xf2c46b).stroke({ color: 0x8a6420, width: 2 }));
    else {
      const it = d.item as Item;
      const q = it.quality;
      if (q === 'set' || q === 'legendary') view.addChild(new Graphics().rect(-6, -260, 12, 260).fill({ color: col, alpha: 0.22 }));
      const url = this.assets.iconUrl([it.leg, w.L.setPiece(it)?.id, it.set && `${it.set}.${it.base}`, it.base]);
      if (url) {
        const s = new Sprite();
        s.anchor.set(0.5, 0.85);
        s.scale.set(0.32);
        s.rotation = -0.35;
        view.addChild(s);
        void PixiAssets.load<Texture>(url).then((t) => {
          if (!s.destroyed) s.texture = t;
        });
      } else view.addChild(new Graphics().poly([0, -18, 8, -8, 0, 0, -8, -8]).fill(col));
      w.bus.emit('loot_drop', { quality: q });
      if (q === 'set' || q === 'legendary') w.fb.flash(w.text.t('msg.fell', { name: this.label(d) }), this.color(d));
    }
    const s = Iso.worldToScreen(pos.x, pos.y);
    view.position.set(s.x, s.y);
    view.zIndex = pos.x + pos.y - 0.5;
    w.objects.addChild(view);
    w.drops.push({ pos: { ...pos }, data: d, view, t: Math.random() * 6 });
  }

  remove(g: GroundDrop): void {
    const w = this.w();
    g.view.destroy({ children: true });
    const i = w.drops.indexOf(g);
    if (i >= 0) w.drops.splice(i, 1);
  }

  /** Plockar upp. Returnerar false om väskan är full. */
  pickup(g: GroundDrop): boolean {
    const w = this.w();
    const h = w.hero;
    if (g.data.gold) {
      h.s.gold += g.data.gold;
      w.bus.emit('gold', { amount: g.data.gold });
      w.fb.float(h.pos, w.text.t('msg.gold', { amount: g.data.gold }), 'gold');
      this.remove(g);
      return true;
    }
    const it = g.data.item as Item;
    const name = this.label(g.data);
    if (!h.inv.add(it)) {
      w.fb.flash(w.text.t('msg.bag_full'));
      return false;
    }
    w.bus.emit('pickup', { itemId: w.L.foundId(it), first: this.recordFound(it) });
    w.fb.flash(w.text.t('msg.found', { name }), this.color(g.data));
    this.remove(g);
    return true;
  }

  /** Första upplock per föremåls-id sparas i localStorage['rpg_found'] (samma format som 3D-versionen). */
  private recordFound(it: Item): boolean {
    const id = this.w().L.foundId(it);
    try {
      const f = JSON.parse(localStorage.getItem('rpg_found') ?? '{}') as Record<string, unknown>;
      if (f[id]) return false;
      f[id] = { first: new Date().toISOString(), quality: it.quality, base: it.base, ilvl: it.ilvl };
      localStorage.setItem('rpg_found', JSON.stringify(f));
      return true;
    } catch {
      return false;
    }
  }

  update(dt: number): void {
    const w = this.w();
    for (const g of [...w.drops]) {
      g.t += dt;
      const top = g.view.children.at(-1);
      if (top) top.y = Math.sin(g.t * 3) * 2;
      if (g.data.gold && Math.hypot(g.pos.x - w.hero.pos.x, g.pos.y - w.hero.pos.y) < 1.2) this.pickup(g);
    }
  }
}
