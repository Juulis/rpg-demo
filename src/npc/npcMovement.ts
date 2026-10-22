import type { Vec2 } from '../core/GameContext';
import type { Zone } from '../world/Zone';

const NPC_SPEED = 2.4;
const ARRIVE = 0.35;

export function stepNpcToward(pos: Vec2, target: Vec2, dt: number, zone: Zone): boolean {
  const dx = target.x - pos.x;
  const dy = target.y - pos.y;
  const d = Math.hypot(dx, dy);
  if (d <= ARRIVE) {
    pos.x = target.x;
    pos.y = target.y;
    return true;
  }
  const step = Math.min(NPC_SPEED * dt, d);
  pos.x += (dx / d) * step;
  pos.y += (dy / d) * step;
  zone.collide(pos, 0.45);
  return false;
}

export function activityIsMoving(aktivitet: string): boolean {
  if (!aktivitet) return false;
  if (/sover|serverar|sitter|handlar vid|berättar och lagar|kokar örter|putsar|vaktar portalen/i.test(aktivitet)) return false;
  return /jagar|patrull|rundor|vakt|går|tittar/i.test(aktivitet) || aktivitet.includes('köper');
}
