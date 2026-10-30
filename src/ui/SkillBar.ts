import type { Hero } from '../entities/Hero';
import type { Skill } from '../data/types';
import { barActiveSkills, passiveSkills, skillUnlocked } from '../logic/skills';
import type { Text } from '../text/Text';

/** Färdighetsrad: fyra aktiva (fyrkant) + passiva (rund), cooldown och låst-läge. */
export class SkillBar {
  private readonly root: HTMLDivElement;
  private readonly slots: HTMLButtonElement[] = [];
  private readonly passives: HTMLDivElement[] = [];

  constructor(private readonly text: Text) {
    this.root = document.createElement('div');
    this.root.className = 'skillbar';
    for (let i = 0; i < 4; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'skill active';
      b.dataset.slot = String(i);
      const key = document.createElement('span');
      key.className = 'key';
      key.textContent = String(i + 1);
      b.append(key);
      this.slots.push(b);
    }
    const passRow = document.createElement('div');
    passRow.className = 'skill-passives';
    for (let i = 0; i < 2; i++) {
      const p = document.createElement('div');
      p.className = 'skill passive hidden';
      passRow.append(p);
      this.passives.push(p);
    }
    this.root.append(...this.slots, passRow);
    document.getElementById('hud')?.appendChild(this.root);
  }

  update(h: Hero): void {
    const actives = barActiveSkills(h.cls);
    for (let i = 0; i < 4; i++) {
      const sk = actives[i];
      const el = this.slots[i];
      if (!sk || !el) continue;
      el.classList.remove('hidden');
      const unlocked = skillUnlocked(sk, h.level);
      const cd = h.skillCdLeft(sk.id);
      el.classList.toggle('locked', !unlocked);
      el.classList.toggle('cooldown', cd > 0);
      el.title = this.tooltip(sk, unlocked, cd);
      el.replaceChildren();
      const key = document.createElement('span');
      key.className = 'key';
      key.textContent = String(i + 1);
      el.append(key);
      const name = document.createElement('span');
      name.className = 'nm';
      name.textContent = this.text.data('klasser', sk.id, 'name', sk.name).slice(0, 3);
      el.append(name);
      if (cd > 0) {
        const cdEl = document.createElement('span');
        cdEl.className = 'cd';
        cdEl.textContent = cd < 10 ? cd.toFixed(1) : String(Math.ceil(cd));
        el.append(cdEl);
      }
    }
    const ps = passiveSkills(h.cls);
    for (let i = 0; i < this.passives.length; i++) {
      const el = this.passives[i];
      const sk = ps[i];
      if (!el) continue;
      if (!sk) {
        el.classList.add('hidden');
        continue;
      }
      el.classList.remove('hidden');
      const unlocked = skillUnlocked(sk, h.level);
      el.classList.toggle('locked', !unlocked);
      el.title = this.tooltip(sk, unlocked, 0);
      el.textContent = unlocked ? this.text.data('klasser', sk.id, 'name', sk.name).slice(0, 2) : '?';
    }
  }

  private tooltip(sk: Skill, unlocked: boolean, cd: number): string {
    const name = this.text.data('klasser', sk.id, 'name', sk.name);
    const effect = this.text.data('klasser', sk.id, 'effect', sk.effect);
    if (!unlocked) return `${name}\n${this.text.t('skill.locked', { level: sk.unlock_level ?? 1 })}`;
    if (cd > 0) return `${name}\n${this.text.t('skill.cooldown', { s: cd.toFixed(1) })}`;
    return `${name}\n${effect}\n${this.text.t('skill.cost', { n: sk.stamina_cost })}`;
  }

  dispose(): void {
    this.root.remove();
  }
}
