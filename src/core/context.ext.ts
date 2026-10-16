/**
 * TILLFÄLLIG UTÖKNING (Utvecklare 2) av HeroState/ZoneView/GameData, ersätts när core/GameContext.ts får motsvarande fält/API.
 * Skelettets typer (#18) täcker ännu inte allt som sparning och karta behöver (väska, utrustning, runor,
 * zonens runstenar/portaler …). Fälten här är valfria och läses med säkra standardvärden. Inga ändringar i Utvecklares filer.
 * (Events behöver ingen utökning: alla events finns i #18:s events.ts.)
 */
import type { GameContext, HeroState, ZoneView } from './GameContext';
import type { GameData } from '../data/types';

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

/** Hjältefält som gameplay (PR 2) förväntas lägga till i HeroState. */
export interface HeroExtras {
  inv: ItemInstance[];
  equip: Equipment;
  stage: number;
  runes: number;
  city: string;
  /** Zon att starta i vid new_game, och aktuell zon under spel. */
  zone: string;
  /** Riktning i radianer; framåt = (sin, cos). */
  facing: number;
  playing: boolean;
  /** Satt av sparmodulen före new_game: position att återuppta på (null = zonens startpunkt). */
  resumePos: Vec2 | null;
  /** Nyskapad hjälte: motorn delar ut startutrustning. */
  fresh: boolean;
}
export type PlayHero = HeroState & Partial<HeroExtras>;

export const heroOf = (ctx: GameContext): Readonly<PlayHero> => ctx.hero as Readonly<PlayHero>;

/**
 * Skrivåtkomst för HeroLoader (laddning före new_game) och menyn (playing=false).
 * TILLFÄLLIG: ersätts av ett laddnings-API i Game (t.ex. game.loadHero(save)).
 */
export const heroWriter = (ctx: GameContext): PlayHero => ctx.hero as PlayHero;

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
export interface ZoneExtras {
  circle: number;
  rect: readonly [number, number];
  colliders: readonly Collider[];
  runes: readonly RuneView[];
  portals: readonly PortalView[];
  cleared: Readonly<Record<string, boolean>>;
}
export type MapZone = ZoneView &
  Partial<Pick<ZoneExtras, 'circle' | 'rect'>> &
  Pick<ZoneExtras, 'colliders' | 'runes' | 'portals' | 'cleared'>;

/** Zon med kartdata; listor är alltid satta (tomma om motorn inte levererar dem än). */
export function zoneOf(ctx: GameContext): MapZone {
  const z = ctx.zone as Readonly<ZoneView & Partial<ZoneExtras>>;
  return { ...z, colliders: z.colliders ?? [], runes: z.runes ?? [], portals: z.portals ?? [], cleared: z.cleared ?? {} };
}

export interface VillageZoneDef {
  id: string;
  tiles: [[number, number], [number, number]];
  safe?: boolean;
  boss_arena?: boolean;
}
export interface VillageLayout {
  zones: VillageZoneDef[];
  forestPortal: [number, number] | null;
}
/** Bylayout och skogsportal ur portal_by.json (finns i JSON men inte i PortalVillage-typen än). */
export function villageLayout(data: GameData): VillageLayout {
  const pv = data.portalVillage as unknown as { village?: { zones?: unknown }; portal?: { forest_position?: unknown } };
  const raw = pv.village?.zones;
  const zones = Array.isArray(raw) ? (raw as VillageZoneDef[]).filter((z) => Array.isArray(z.tiles) && z.tiles.length === 2) : [];
  const fp = pv.portal?.forest_position;
  const forestPortal =
    Array.isArray(fp) && typeof fp[0] === 'number' && typeof fp[1] === 'number' ? ([fp[0], fp[1]] as [number, number]) : null;
  return { zones, forestPortal };
}
