import { DATA } from '../data';
import { Zone, type ZoneName } from './Zone';

/** Spelbara städer (zonnamn; Vargaby använder wolfstead / areaId vargaby). */
export const PLAYABLE_CITIES = ['wolfstead', 'dimmerstrand', 'kopparberg', 'askeborg'] as const satisfies readonly ZoneName[];
export type PlayableCityZone = (typeof PLAYABLE_CITIES)[number];

const AREA_BY_ZONE: Readonly<Record<PlayableCityZone, string>> = {
  wolfstead: 'vargaby',
  dimmerstrand: 'dimmerstrand',
  kopparberg: 'kopparberg',
  askeborg: 'askeborg',
};

export function cityAreaId(zone: PlayableCityZone): string {
  return AREA_BY_ZONE[zone];
}

export function isPlayableCityZone(name: string): name is PlayableCityZone {
  return (PLAYABLE_CITIES as readonly string[]).includes(name);
}

export function parseSavedZone(zone: string): ZoneName {
  if (zone === 'forest' || zone === 'village') return zone;
  if (isPlayableCityZone(zone)) return zone;
  return 'forest';
}

export function cityPortTile(areaId: string): [number, number] {
  const area = DATA.spawn.areas.find((a) => a.id === areaId);
  const port = area?.spawn_points.find((p) => p.id.endsWith('_port'));
  if (!port) return [16, 25];
  return port.pos as [number, number];
}

export function cityPortEntry(zoneName: PlayableCityZone): { entry: { x: number; y: number }; portal: { x: number; y: number } } {
  const areaId = cityAreaId(zoneName);
  const z = new Zone(zoneName, areaId, 62, 62);
  z.tileCoords = true;
  const port = z.toWorld(cityPortTile(areaId));
  return { entry: { x: port.x, y: port.y - 2 }, portal: { x: port.x, y: port.y + 1 } };
}

export function cityArenaTiles(areaId: string): { center: [number, number]; halfW: number; halfH: number } {
  const area = DATA.spawn.areas.find((a) => a.id === areaId);
  const bossPos = area?.boss?.pos as [number, number] | undefined;
  const center: [number, number] = bossPos ?? [16, 4];
  return { center, halfW: 8, halfH: 5 };
}

export type CityVisualTheme = 'wolf' | 'mist' | 'copper' | 'ash';

export function cityTheme(areaId: string): CityVisualTheme {
  switch (areaId) {
    case 'vargaby':
      return 'wolf';
    case 'dimmerstrand':
      return 'mist';
    case 'kopparberg':
      return 'copper';
    case 'askeborg':
      return 'ash';
    default:
      return 'wolf';
  }
}

export const CITY_RNG_SEED: Readonly<Record<PlayableCityZone, number>> = {
  wolfstead: 41,
  dimmerstrand: 42,
  kopparberg: 43,
  askeborg: 44,
};
