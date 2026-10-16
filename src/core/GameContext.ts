/**
 * STUB – ersätts av Utvecklares GameContext/GameModule. Innehåller bara de fält mina moduler läser.
 * Förväntningar på motorn står i PR-texten (t.ex. att new_game läser hero.zone/pos och att zone_enter emit:as när zonen är klar).
 */
import type { EventBus } from './EventBus';
import type { GameEvents } from './events';

export interface Vec2 {
  x: number;
  y: number;
}

export interface ItemInstance {
  base: string;
  quality?: string;
  ilvl?: number;
  affixes?: unknown[];
  n?: number;
}

export type Equipment = Record<string, ItemInstance | null | undefined>;

/** Hjältens levande state. Sparmodulen skriver hit före new_game (ersätter rk_inv_<klass>), motorn läser. */
export interface HeroState {
  id: string | null;
  name: string;
  cls: string;
  level: number;
  xp: number;
  gold: number;
  inv: ItemInstance[];
  equip: Equipment;
  stage: number;
  runes: number;
  city: string;
  /** Zon att starta i vid new_game, och aktuell zon under spel. */
  zone: string;
  /** Världskoordinater (2D: x, y). */
  pos: Vec2;
  /** Riktning i radianer; framåt = (sin, cos). */
  facing: number;
  playing: boolean;
  /** Satt av sparmodulen före new_game: position att återuppta på (null = zonens startpunkt). */
  resumePos?: Vec2 | null;
  /** Nyskapad hjälte: motorn delar ut startutrustning. */
  fresh?: boolean;
}

export interface Collider {
  x: number;
  y: number;
  r: number;
  off?: boolean;
}
export interface RuneView {
  x: number;
  y: number;
  active: boolean;
}
export interface PortalView {
  x: number;
  y: number;
  target: string;
}

/** Läsvy av aktuell zon (motorn äger datat). */
export interface ZoneView {
  name: string;
  circle?: number;
  rect?: readonly [number, number];
  colliders: readonly Collider[];
  runes: readonly RuneView[];
  portals: readonly PortalView[];
  cleared: Readonly<Record<string, boolean>>;
}

export interface Session {
  seed: number;
  killed: Set<string>;
}

export interface VillageZoneDef {
  id: string;
  tiles: [[number, number], [number, number]];
  safe?: boolean;
  boss_arena?: boolean;
}
export interface PortalVillageData {
  portal: { forest_position?: [number, number] };
  village: { zones: VillageZoneDef[] };
}

/** Typade JSON-data (delmängd). */
export interface GameData {
  portalVillage: PortalVillageData;
}

export interface GameContext {
  bus: EventBus<GameEvents>;
  hero: HeroState;
  zone: ZoneView;
  session: Session;
  data: GameData;
}

export interface GameModule {
  init(ctx: GameContext): void;
  dispose(): void;
}
