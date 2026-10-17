import { Graphics } from 'pixi.js';
import { DATA } from '../data';
import type { Vec2 } from '../core/GameContext';
import type { Monster } from '../entities/Monster';
import { Iso } from '../render/Iso';
import type { MonsterSnapshot } from '../logic/CombatRules';
import type { LootSystem } from './LootSystem';
import type { World } from './World';

interface HitOpts {
  kb?: number;
  stun?: number;
  ranged?: boolean;
}

/** Strid i klienten: effekter, knuff, projektiler. Utfall (träff, skada, XP, droppar) avgörs av GameAuthority. Hjältens anfall och färdigheter, träffchans, skada, krosslag, knuff, livsstöld, taggar, XP och död. */
export class CombatSystem {
  /** Anropas när bossen dör. */
  onBossDefeated: (m: Monster) => void = () => undefined;
  onHeroDied: () => void = () => undefined;

  constructor(
    private readonly w: () => World,
    private readonly loot: LootSystem,
  ) {}

  /** Ren data om monstret för spellogiken (GameAuthority). */
  snapshot(m: Monster): MonsterSnapshot {
    const h = this.w().hero;
    const f = { x: Math.sin(m.facing), y: Math.cos(m.facing) };
    const to = this.norm({ x: h.pos.x - m.pos.x, y: h.pos.y - m.pos.y });
    return {
      id: m.id,
      lvl: m.lvl,
      hp: m.hp,
      max: m.max,
      defense: m.defense,
      boss: m.boss,
      family: m.def.family,
      weak: m.def.weak,
      resist: m.def.resist,
      immune: m.immune > 0,
      vulnerable: m.vuln > 0,
      shieldedFront: m.id === 'skelett_vakt' && f.x * to.x + f.y * to.y > 0.3,
      xp: m.def.xp,
      xpMult: m.es?.xp ?? 1,
    };
  }

  damageMonster(m: Monster, mult = 1, opts: HitOpts = {}): void {
    const w = this.w();
    const h = w.hero;
    const st = h.stats;
    const t = w.text;
    if (m.dead) return;
    m.aggroed = true;
    const r = w.authority.heroHit(st, h.level, this.snapshot(m), mult);
    if (!r.hit) {
      w.fb.float(m.pos, t.t('fx.miss'), 'res', m.view.height2);
      return;
    }
    const { dmg, crit, strong, fm } = r;
    m.hp -= dmg;
    m.flash = 0.15;
    m.lastHit = w.time;
    if (dmg > 0 && st.lifeOnHit) h.s.hp = Math.min(st.maxHp, h.s.hp + st.lifeOnHit);
    const o = this.norm({ x: m.pos.x - h.pos.x, y: m.pos.y - h.pos.y });
    const k = (opts.kb ?? 8) * (1 - (m.def.knockback_resist ?? 0)) * (m.boss ? 0.15 : 1) * (m.es?.knockbackImmune ? 0 : 1);
    m.kb = { x: o.x * k, y: o.y * k };
    if (opts.stun) m.stun = opts.stun;
    if (m.es?.thorns && dmg > 0 && !opts.ranged) {
      const th = Math.max(1, Math.round(dmg * m.es.thorns));
      h.s.hp = Math.max(1, h.s.hp - th);
      w.fb.float(h.pos, t.t('fx.thorns', { n: th }), 'hurt', 90);
    }
    w.bus.emit('hit', { target: m.uid ?? m.id, dmg, crit });
    const label = m.immune > 0 ? t.t('fx.immune') : (crit ? `${dmg}!` : `${dmg}`) + (strong ? ' ' + t.t('fx.strong') : '');
    w.fb.float(m.pos, label, fm > 1 ? 'weak' : fm < 1 ? 'res' : crit ? 'crit' : '', m.view.height2);
    if (st.lifesteal) h.s.hp = Math.min(st.maxHp, h.s.hp + dmg * st.lifesteal);
    if (m.id === 'skelett_runprast' && !((m.timers.tp ?? 0) > 0) && m.hp > 0) {
      m.timers.tp = 6;
      const a = w.rng.float(0, 6.28);
      m.pos.x += Math.cos(a) * 5;
      m.pos.y += Math.sin(a) * 5;
      w.zone.collide(m.pos, 0.5);
    }
    if (m.hp <= 0) this.kill(m);
  }

  kill(m: Monster): void {
    const w = this.w();
    m.dead = 0.001;
    m.view.play('dod');
    const first = !!m.uid && m.boss && !w.session.killed.has(m.uid);
    if (m.uid) w.session.killed.add(m.uid);
    const st = w.hero.stats;
    const lo = m.es?.extraLoot;
    const reward = w.authority.killReward({
      m: this.snapshot(m),
      heroLvl: w.hero.level,
      mf: st.mf,
      goldFind: st.goldFind,
      firstKill: first,
      ilvl: Math.min(DATA.monsterLevels.item_level.cap, m.lvl + (m.boss ? 2 : m.elite === 'unik' ? 1 : 0)),
      extraRolls: lo?.extra_rolls ?? 0,
      qualityMult: lo?.quality_mult ?? 1,
    });
    const ups = w.hero.gainXp(reward.xp);
    if (ups) {
      w.fb.flash(w.text.t('msg.level_up', { level: w.hero.level }));
      w.bus.emit('level_up', { level: w.hero.level });
    }
    this.loot.scatter(m.pos, reward.drops);
    w.bus.emit('kill', {
      id: m.uid ?? m.id,
      area: w.zone.areaId,
      lvl: m.lvl,
      champion: m.elite === 'champion' || m.elite === 'minion',
      unique: m.elite === 'unik',
      boss: m.boss,
    });
    if (m.boss) this.onBossDefeated(m);
  }

  /** Hjälten tar skada. from = varifrån slaget kom (för block), m = anfallaren. */
  hurt(raw: number, from: Vec2 | null, m: Monster | null): void {
    const w = this.w();
    const h = w.hero;
    const st = h.stats;
    const t = w.text;
    if (!h.s.playing) return;
    const f = h.forward();
    const to = from ? this.norm({ x: from.x - h.pos.x, y: from.y - h.pos.y }) : null;
    const front = to ? f.x * to.x + f.y * to.y > 0.2 : true;
    const r = w.authority.monsterHit({
      raw: raw * (m?.dmgMult ?? 1),
      monsterLvl: m?.lvl ?? h.level,
      st,
      heroLvl: h.level,
      front,
      moving: h.moving,
      stamina: h.s.stamina,
      blocking: h.blocking && !!from,
    });
    if (r.kind === 'dodge') return w.fb.float(h.pos, t.t('fx.dodge'), 'weak', 100);
    if (r.kind === 'block' || r.reduced) {
      h.s.stamina -= 5;
      h.stDelay = 1;
    }
    if (r.kind === 'block') return w.fb.float(h.pos, t.t('fx.block'), 'weak', 100);
    const d = r.dmg;
    h.s.hp = Math.max(0, h.s.hp - d);
    if (m?.es?.lifeSteal && !m.dead) m.hp = Math.min(m.max, m.hp + d * m.es.lifeSteal);
    if (m?.es?.curse) h.curse = 4;
    if (st.thorns && m && !m.dead) {
      m.hp -= st.thorns;
      if (m.hp <= 0) this.kill(m);
    }
    w.fb.float(h.pos, '-' + d, 'hurt', 100);
    h.view.sprite.tint = 0xff8080;
    if (h.s.hp <= 0) {
      h.s.playing = false;
      this.onHeroDied();
    }
  }

  arcHit(range: number, dot: number, mult: number, opts: HitOpts = {}, max = 99): number {
    const w = this.w();
    const h = w.hero;
    const f = h.forward();
    let n = 0;
    for (const m of [...w.monsters]) {
      if (m.dead || n >= max) continue;
      const ox = m.pos.x - h.pos.x;
      const oy = m.pos.y - h.pos.y;
      const d = Math.hypot(ox, oy);
      const r = range + (m.boss ? 0.8 : 0.4);
      if (d < r && (d < 0.01 || (ox * f.x + oy * f.y) / d > dot)) {
        this.damageMonster(m, mult, opts);
        n++;
      }
    }
    return n;
  }

  attack(): void {
    const h = this.w().hero;
    if (!h.s.playing || h.atkCd > 0 || h.atkT > 0) return;
    const attackAnim = h.view.getAnim('attack');
    h.atkCd = 0.5 / h.stats.atkSpeed;
    if (attackAnim?.hitFrame !== undefined && attackAnim.frames[0]?.length) {
      const spd = Math.max(0.25, h.stats.atkSpeed);
      const n = attackAnim.frames[0].length;
      h.atkT = n / attackAnim.fps / spd;
      h.atkHitT = attackAnim.hitFrame / attackAnim.fps / spd;
      h.atkPendingHit = true;
      h.view.playbackRate = spd;
      h.view.play('attack', true);
      return;
    }
    h.atkPendingHit = false;
    h.atkT = 0.3;
    this.arcHit(h.stats.reach, 0.3, 1);
  }

  /** Träfffas i attackanimationen (anropas från Game när atkHitT når 0). */
  resolveAttackHit(): void {
    const h = this.w().hero;
    if (!h.atkPendingHit) return;
    h.atkPendingHit = false;
    this.arcHit(h.stats.reach, 0.3, 1);
  }

  /** Klassfärdighet (första färdigheten): riddare blockerar medan knappen hålls, amazon spjutstöt, barbar markslag. */
  skill(down: boolean): void {
    const w = this.w();
    const h = w.hero;
    if (!h.s.playing) return;
    const c = h.cls;
    const sk = c.skills[0];
    if (c.id === 'riddare') {
      h.blocking = down && h.s.stamina > 0;
      return;
    }
    if (!down || !sk || h.skillCd > 0) return;
    if (!h.spend(sk.stamina_cost)) {
      w.fb.flash(w.text.t('msg.no_stamina'));
      return;
    }
    h.skillCd = sk.cooldown_s;
    h.atkT = 0.3;
    h.atkCd = 0.5;
    if (c.id === 'amazonkrigare') this.arcHit(3.5, 0.85, 1.5, { kb: 5 }, 2);
    if (c.id === 'barbar') {
      this.arcHit(2.4, 0.2, 2.0, { kb: 10, stun: 1 });
      this.ring(h.pos, 2.4, 0xc8b090, 0.35);
    }
    w.fb.flash(w.text.data('klasser', sk.id, 'name', sk.name));
  }

  projectile(from: Vec2, to: Vec2, speed: number, dmg: number, kind: 'arrow' | 'fire', src: Monster | null): void {
    const w = this.w();
    const v = this.norm({ x: to.x - from.x, y: to.y - from.y });
    const view =
      kind === 'fire'
        ? new Graphics().circle(0, -40, 7).fill(0xff5530)
        : new Graphics().moveTo(-10, -40).lineTo(10, -40).stroke({ color: 0xe8e0c8, width: 3 });
    const sv = Iso.worldToScreen(v.x, v.y);
    if (kind === 'arrow') view.rotation = Math.atan2(sv.y, sv.x);
    w.objects.addChild(view);
    w.projectiles.push({ pos: { ...from }, v: { x: v.x * speed, y: v.y * speed }, dmg, life: 3, from: src, view });
  }

  /** Ring på marken (telegraf eller effekt). Tas bort efter life sekunder. */
  ring(c: Vec2, r: number, color: number, life: number): Graphics {
    const w = this.w();
    const g = new Graphics();
    const pts: number[] = [];
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const s = Iso.worldToScreen(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r);
      pts.push(s.x, s.y);
    }
    g.poly(pts).stroke({ color, width: 4, alpha: 0.9 });
    w.effects.addChild(g);
    setTimeout(() => g.destroy(), life * 1000);
    return g;
  }

  update(dt: number): void {
    const w = this.w();
    const h = w.hero;
    for (const p of [...w.projectiles]) {
      p.pos.x += p.v.x * dt;
      p.pos.y += p.v.y * dt;
      p.life -= dt;
      const s = Iso.worldToScreen(p.pos.x, p.pos.y);
      p.view.position.set(s.x, s.y);
      p.view.zIndex = p.pos.x + p.pos.y;
      let gone = p.life <= 0 || !w.zone.contains(p.pos);
      if (!gone && Math.hypot(p.pos.x - h.pos.x, p.pos.y - h.pos.y) < 0.7) {
        this.hurt(p.dmg, p.pos, p.from);
        gone = true;
      }
      if (gone) {
        p.view.destroy();
        w.projectiles.splice(w.projectiles.indexOf(p), 1);
      }
    }
  }

  private norm(v: Vec2): Vec2 {
    const d = Math.hypot(v.x, v.y) || 1;
    return { x: v.x / d, y: v.y / d };
  }
}
