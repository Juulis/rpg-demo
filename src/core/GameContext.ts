import type { EventBus } from './EventBus';
import type { GameEvents } from './events';
import type { Session } from './Session';
import type { GameData } from '../data/types';

/** Hjältens tillstånd som moduler får läsa (ändras bara av Game/gameplay-systemen). */
export interface HeroState {
  id: string | null;
  name: string;
  cls: string;
  level: number;
  xp: number;
  gold: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  /** Världsposition i rutor (iso-koordinater). */
  pos: { x: number; y: number };
}

/** Vad moduler behöver veta om aktuell zon (karta, ljud, lorebok …). */
export interface ZoneView {
  name: string;
  areaId: string;
  /** Storlek i rutor. */
  width: number;
  height: number;
}

/** Delas ut till varje modul via konstruktor eller init(). Inga globaler. */
export interface GameContext {
  bus: EventBus<GameEvents>;
  hero: Readonly<HeroState>;
  zone: Readonly<ZoneView>;
  session: Session;
  data: GameData;
}

/** En utbytbar del av spelet (AudioManager, SaveManager, MapUI, StartMenu, Lorebook …). Registreras i src/main.ts. */
export interface GameModule {
  init(ctx: GameContext): void;
  dispose(): void;
}
