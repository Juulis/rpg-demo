import { devCheatsEnabled, isAnyDevCheatActive, subscribeDevCheats } from '../dev/DevCheats';
import type { Hero } from '../entities/Hero';
import type { Camera } from '../render/Camera';
import type { Text } from '../text/Text';
import type { FloatKind } from '../systems/World';
import type { Vec2 } from '../core/GameContext';
import { HeroModel as HeroCls } from '../logic/HeroModel';
import { SkillBar } from './SkillBar';

interface Floater {
  el: HTMLDivElement;
  pos: Vec2;
  lift: number;
  life: number;
}

/** HUD: liv/uthållighet, nivå och XP, drycker, meddelanden, flytande skadetal och bossmätare. */
export class Hud {
  private readonly root = document.createElement('div');
  private readonly msg = document.createElement('div');
  private readonly floaters: Floater[] = [];
  private msgT = 0;
  private readonly el: Record<string, HTMLElement> = {};
  private readonly cheatIndicator: HTMLDivElement | null;
  readonly skills: SkillBar;

  constructor(private readonly text: Text) {
    this.root.id = 'hud';
    this.root.innerHTML = `
      <div class="bars">
        <div class="bar hp"><i></i><span></span></div>
        <div class="bar st hidden"><i></i><span></span></div>
        <div class="bar xp"><i></i><span></span></div>
      </div>
      <div class="lvl"></div>
      <div class="clock"></div>
      <div class="pots"><div class="pot hp"><b>3</b><span></span></div><div class="pot st hidden"><b>4</b><span></span></div></div>
      <div class="help"></div>
      <div class="bossbar hidden"><div class="bbName"></div><div class="bbTrack"><i></i></div><div class="bbPhase"></div></div>`;
    document.body.appendChild(this.root);
    this.skills = new SkillBar(text);
    this.msg.id = 'msg';
    this.msg.className = 'hidden';
    document.body.appendChild(this.msg);
    for (const [k, sel] of Object.entries({
      hp: '.bar.hp i',
      hpT: '.bar.hp span',
      st: '.bar.st i',
      stT: '.bar.st span',
      xp: '.bar.xp i',
      xpT: '.bar.xp span',
      lvl: '.lvl',
      clock: '.clock',
      potHp: '.pot.hp span',
      potSt: '.pot.st span',
      help: '.help',
      boss: '.bossbar',
      bossName: '.bbName',
      bossFill: '.bbTrack i',
      bossPhase: '.bbPhase',
    })) {
      const e = this.root.querySelector<HTMLElement>(sel);
      if (e) this.el[k] = e;
    }
    if (devCheatsEnabled()) {
      const ind = document.createElement('div');
      ind.className = 'dev-cheat-indicator hidden';
      ind.textContent = 'FUSK';
      ind.title = 'Utvecklarfusk aktivt';
      this.root.appendChild(ind);
      this.cheatIndicator = ind;
      subscribeDevCheats(() => this.syncCheatIndicator());
      this.syncCheatIndicator();
    } else this.cheatIndicator = null;
    this.relabel();
  }

  private syncCheatIndicator(): void {
    this.cheatIndicator?.classList.toggle('hidden', !isAnyDevCheatActive());
  }

  relabel(): void {
    this.set('help', this.text.t('hud.help'));
  }

  private set(k: string, v: string): void {
    const e = this.el[k];
    if (e && e.textContent !== v) e.textContent = v;
  }
  private width(k: string, r: number): void {
    const e = this.el[k];
    if (e) e.style.width = Math.max(0, Math.min(1, r)) * 100 + '%';
  }

  flash(t: string, color?: string): void {
    this.msg.textContent = t;
    this.msg.style.color = color ?? '';
    this.msg.classList.remove('hidden');
    this.msgT = 2.2;
  }

  float(pos: Vec2, t: string, kind: FloatKind = '', lift = 60): void {
    const el = document.createElement('div');
    el.className = 'dmg ' + kind;
    el.textContent = t;
    document.body.appendChild(el);
    this.floaters.push({ el, pos: { ...pos }, lift, life: 0.9 });
  }

  boss(name: string | null, ratio = 1, phase = ''): void {
    this.el.boss?.classList.toggle('hidden', name === null);
    if (name === null) return;
    this.set('bossName', name);
    this.width('bossFill', ratio);
    this.set('bossPhase', phase);
  }

  update(dt: number, h: Hero, cam: Camera, clock?: { period: string; time: string }): void {
    const s = h.s;
    this.width('hp', s.hp / s.maxHp);
    this.set('hpT', `${Math.ceil(s.hp)} / ${s.maxHp}`);
    const stBar = this.root.querySelector<HTMLElement>('.bar.st');
    stBar?.classList.remove('hidden');
    this.width('st', h.stamina / h.maxStamina);
    this.set('stT', `${Math.ceil(h.stamina)} / ${h.maxStamina}`);
    const need = HeroCls.need(s.level);
    this.width('xp', s.xp / need);
    this.set('xpT', this.text.t('hud.xp', { xp: s.xp, need }));
    this.set('lvl', this.text.t('hud.level', { level: s.level }));
    if (clock) this.set('clock', this.text.t('hud.clock', { period: clock.period, time: clock.time }));
    this.set('potHp', this.text.t('hud.proviant', { count: h.inv.countConsumables('hp') }));
    this.skills.update(h);
    if (this.msgT > 0 && (this.msgT -= dt) <= 0) this.msg.classList.add('hidden');
    for (const f of [...this.floaters]) {
      f.life -= dt;
      const p = cam.toScreen(f.pos.x, f.pos.y, f.lift + (0.9 - f.life) * 60);
      f.el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%)`;
      f.el.style.opacity = String(Math.min(1, f.life * 2));
      if (f.life <= 0) {
        f.el.remove();
        this.floaters.splice(this.floaters.indexOf(f), 1);
      }
    }
  }

  dispose(): void {
    this.skills.dispose();
    this.root.remove();
    this.msg.remove();
    for (const f of this.floaters) f.el.remove();
  }
}
