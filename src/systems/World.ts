import type { Container } from 'pixi.js';
import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import type { Session } from '../core/Session';
import type { Vec2 } from '../core/GameContext';
import type { Hero } from '../entities/Hero';
import type { Monster } from '../entities/Monster';
import type { Loot } from '../loot/Loot';
import type { Drop as DropData } from '../loot/types';
import type { Text } from '../text/Text';
import type { Zone } from '../world/Zone';

export interface GroundDrop {
  pos: Vec2;
  data: DropData;
  view: Container;
  t: number;
}
export interface Projectile {
  pos: Vec2;
  v: Vec2;
  dmg: number;
  life: number;
  from: Monster | null;
  view: Container;
}
export type FloatKind = 'hurt' | 'weak' | 'res' | 'crit' | '' | 'gold';

/** Tjänster som UI erbjuder systemen (meddelanden och flytande text). */
export interface Feedback {
  flash(text: string, color?: string): void;
  float(pos: Vec2, text: string, kind?: FloatKind, lift?: number): void;
}

/** Delat körtidstillstånd för aktuell zon. Ägs av Game; systemen läser och skriver. */
export interface World {
  bus: EventBus<GameEvents>;
  session: Session;
  L: Loot;
  text: Text;
  hero: Hero;
  zone: Zone;
  monsters: Monster[];
  drops: GroundDrop[];
  projectiles: Projectile[];
  objects: Container;
  effects: Container;
  fb: Feedback;
  time: number;
}
