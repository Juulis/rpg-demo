import { Container, Graphics, Sprite } from 'pixi.js';
import { DATA } from '../data';
import type { AssetStore } from '../render/Assets';
import { Iso } from '../render/Iso';
import type { ZoneName } from '../world/Zone';
import type { World } from './World';

/** Runor och portaler. Portalen öppnas enbart av att alla runor är aktiva (+ fördröjning). Inga andra spärrar. */
export class PortalSystem {
  onEnter: (target: ZoneName) => void = () => undefined;
  private runeSprites: Sprite[] = [];
  private portalViews: Container[] = [];
  private opening = false;
  private t = 0;
  private readonly cfg = DATA.portalVillage.portal;

  constructor(
    private readonly w: () => World,
    private readonly assets: AssetStore,
  ) {}

  /** Anropas när en zon byggts. Återställer runornas tillstånd ur hjälten (hero.runes). */
  attach(runeSprites: Sprite[]): void {
    const w = this.w();
    this.runeSprites = runeSprites;
    this.portalViews = [];
    this.opening = false;
    w.zone.runes.forEach((r, i) => {
      r.active = i < w.hero.s.runes;
      this.paintRune(i);
    });
    if (w.zone.name === 'forest' && w.hero.s.runes >= this.cfg.trigger.required_runes) this.addForestPortal();
    for (const p of w.zone.portals) this.portalView(p.x, p.y);
  }

  nearRune(): number {
    const w = this.w();
    return w.zone.runes.findIndex((r) => !r.active && Math.hypot(r.x - w.hero.pos.x, r.y - w.hero.pos.y) < 2.6);
  }

  /** Väcker runan (E kostar 20 uthållighet, beröring är gratis). */
  activate(i: number, free: boolean): boolean {
    const w = this.w();
    const r = w.zone.runes[i];
    if (!w.hero.s.playing || !r || r.active) return false;
    if (!free && !w.hero.spend(20)) {
      w.fb.flash(w.text.t('msg.no_stamina'));
      return false;
    }
    r.active = true;
    w.hero.s.runes++;
    this.paintRune(i);
    w.fb.flash(w.text.t('msg.rune_awake', { n: w.hero.s.runes }));
    w.bus.emit('rune', { n: w.hero.s.runes });
    if (w.zone.runes.every((q) => q.active) && !this.opening) {
      this.opening = true;
      setTimeout(() => {
        if (this.w().zone.name !== 'forest') return;
        this.addForestPortal();
        const h = this.w().hero.s;
        h.stage = Math.max(h.stage, 1);
        this.w().fb.flash(this.w().text.t('msg.portal_open'), '#ff5566');
        this.w().bus.emit('portal_open', undefined);
      }, this.cfg.trigger.delay_s * 1000);
    }
    return true;
  }

  private addForestPortal(): void {
    const w = this.w();
    const [x, y] = this.cfg.forest_position;
    if (w.zone.portals.some((p) => p.target === 'village')) return;
    w.zone.portals.push({ x, y, target: 'village' });
    this.portalView(x, y);
  }

  private portalView(x: number, y: number): void {
    const w = this.w();
    const c = new Container();
    const glow = new Graphics().ellipse(0, 0, 70, 35).fill({ color: 0xff3344, alpha: 0.35 });
    c.addChild(glow);
    const d = this.assets.decor.get('rod_portal');
    if (d) {
      const s = new Sprite(d.tex);
      s.anchor.set(d.size.anchor[0] / d.size.w, d.size.anchor[1] / d.size.h);
      s.scale.set(0.55);
      c.addChild(s);
    }
    const p = Iso.worldToScreen(x, y);
    c.position.set(p.x, p.y);
    c.zIndex = x + y;
    w.objects.addChild(c);
    this.portalViews.push(c);
  }

  private paintRune(i: number): void {
    const s = this.runeSprites[i];
    const r = this.w().zone.runes[i];
    if (s && r) s.tint = r.active ? 0x9fe0ff : 0x808890;
  }

  update(dt: number): void {
    const w = this.w();
    const h = w.hero;
    this.t += dt;
    for (const v of this.portalViews) {
      const g = v.children[0];
      if (g) g.alpha = 0.7 + Math.sin(this.t * 3) * 0.3;
    }
    w.zone.runes.forEach((r, i) => {
      const s = this.runeSprites[i];
      if (s && r.active) s.alpha = 0.85 + Math.sin(this.t * 2 + i) * 0.15;
      if (!r.active && Math.hypot(r.x - h.pos.x, r.y - h.pos.y) < 1.9) this.activate(i, true);
    });
    if (!h.s.playing) return;
    for (const p of w.zone.portals)
      if (Math.hypot(p.x - h.pos.x, p.y - h.pos.y) < this.cfg.interaction_radius) {
        this.onEnter(p.target as ZoneName);
        return;
      }
  }
}
