import type { Container } from 'pixi.js';
import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import type { Session } from '../core/Session';
import type { Rng } from '../core/Rng';
import type { GameAuthority } from '../core/GameAuthority';
import type { Vec2 } from '../core/GameContext';
import type { Hero } from '../entities/Hero';
import type { Monster } from '../entities/Monster';
import type { WorldFighter } from '../entities/WorldFighter';
import type { Loot } from '../logic/loot/Loot';
import type { Drop as DropData } from '../logic/loot/types';
import type { Text } from '../text/Text';
import type { SpawnSpec } from './SpawnSystem';
import type { Zone } from '../world/Zone';

export interface QueuedSpawn {
  spec: SpawnSpec;
  pos: Vec2;
  done: boolean;
}

export interface GroundDrop {
  pos: Vec2;
  data: DropData;
  view: Container;
  t: number;
  /** Plockning pågår (async markFound) – hindrar dubbelplock. */
  picking?: boolean;
}
export interface Projectile {
  pos: Vec2;
  v: Vec2;
  dmg: number;
  life: number;
  from: Monster | null;
  view: Container;
  /** Hjältes kast / färdighetsprojektil. */
  heroShot?: boolean;
  mult?: number;
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
  rng: Rng;
  authority: GameAuthority;
  text: Text;
  hero: Hero;
  zone: Zone;
  monsters: Monster[];
  /** Patrull-NPC:er som slåss mot monster (startskogen). */
  worldFighters: WorldFighter[];
  /** Startskogen: monster skapas när hjälten närmar sig. */
  spawnQueue: QueuedSpawn[];
  drops: GroundDrop[];
  projectiles: Projectile[];
  objects: Container;
  effects: Container;
  fb: Feedback;
  time: number;
}
