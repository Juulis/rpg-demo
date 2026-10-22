import type { Monster } from '../entities/Monster';
import { WorldFighter } from '../entities/WorldFighter';
import type { AssetStore } from '../render/Assets';
import { worldFighterSpawns } from '../world/worldFighterSpawn';
import type { CombatSystem } from './CombatSystem';
import type { World } from './World';

const MAX_HP = 200;
const DAMAGE = 3;
const MOVE = 2.2;
const AGGRO = 16;
const ATTACK_RANGE = 1.35;
const ATTACK_CD = 1.15;
const RESPAWN_S = 105;

export class WorldFighterSystem {
  private fighters: WorldFighter[] = [];

  constructor(
    private readonly assets: AssetStore,
    private readonly combat: CombatSystem,
  ) {}

  sync(w: World, gameSeed: number): void {
    this.clear(w);
    for (const sp of worldFighterSpawns(w.zone, gameSeed)) {
      const set = this.assets.worldFigures.get(sp.figure);
      if (!set) continue;
      const f = new WorldFighter(sp.id, sp.figure, sp.pos, set, { maxHp: MAX_HP, damage: DAMAGE });
      w.objects.addChild(f.view);
      this.fighters.push(f);
    }
    w.worldFighters = this.fighters;
  }

  update(dt: number, w: World): void {
    for (const f of this.fighters) {
      if (f.respawn > 0) {
        f.respawn -= dt;
        if (f.respawn <= 0) {
          f.hp = f.maxHp;
          f.dead = 0;
          f.pos.x = f.home.x;
          f.pos.y = f.home.y;
          f.view.visible = true;
          f.playIdle();
        }
        continue;
      }
      if (f.dead > 0) {
        f.dead += dt;
        f.updateSprite(dt);
        if (f.dead > 1.4) {
          f.view.visible = false;
          f.respawn = RESPAWN_S;
        }
        continue;
      }
      f.atkCd -= dt;
      const target = this.nearestMonster(f, w, AGGRO);
      if (!target) {
        f.playIdle();
        f.updateSprite(dt);
        continue;
      }
      const dx = target.pos.x - f.pos.x;
      const dy = target.pos.y - f.pos.y;
      const dist = Math.hypot(dx, dy) || 0.01;
      f.setFacing(dx, dy);
      if (dist > ATTACK_RANGE) {
        const step = Math.min(dist, MOVE * dt);
        f.pos.x += (dx / dist) * step;
        f.pos.y += (dy / dist) * step;
        f.collide(w.zone);
        f.playMove(dist > 6);
      } else if (f.atkCd <= 0) {
        f.atkCd = ATTACK_CD;
        f.playAttack();
        this.combat.damageMonsterFromFighter(target, f.damage);
      } else {
        f.playIdle();
      }
      f.updateSprite(dt);
    }
  }

  private nearestMonster(f: WorldFighter, w: World, range: number): Monster | null {
    let best: Monster | null = null;
    let bestD = range;
    for (const m of w.monsters) {
      if (m.dead || m.boss) continue;
      const d = Math.hypot(m.pos.x - f.pos.x, m.pos.y - f.pos.y);
      if (d < bestD) {
        bestD = d;
        best = m;
      }
    }
    return best;
  }

  private clear(w: World): void {
    for (const f of this.fighters) {
      w.objects.removeChild(f.view);
      f.view.destroy({ children: true });
    }
    this.fighters = [];
    w.worldFighters = this.fighters;
  }

  dispose(): void {
    this.fighters = [];
  }
}
