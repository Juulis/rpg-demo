import { villageLayout, type VillageLayout, type ZoneView } from '../core/GameContext';
import type { GameData, VillageZoneDef } from '../data/types';

export type Bounds = readonly [x0: number, y0: number, x1: number, y1: number];

/** Statisk kartgeometri och namn. All zon-geometri läses ur ZoneView/GameData, inget hårdkodat utöver namn. */
export class MapModel {
  static readonly ZONE_NAME: Readonly<Record<string, string>> = {
    forest: 'Den dimmiga skogen',
    village: 'Den gamla byn',
    wolfstead: 'Vargaby',
  };
  static readonly AREA_NAME: Readonly<Record<string, string>> = {
    portalgladet: 'Portalgläntan',
    byporten: 'Byporten',
    torget: 'Torget',
    vasterhus: 'Västerhusen',
    osterhus: 'Österhusen',
    kyrkogarden: 'Kyrkogården',
    benkungens_kapell: 'Benkungens kapell',
  };

  private readonly layout: VillageLayout;

  constructor(data: GameData) {
    this.layout = villageLayout(data);
  }

  zoneName(z: ZoneView): string {
    return MapModel.ZONE_NAME[z.name] ?? z.name;
  }

  areaName(id: string): string {
    return MapModel.AREA_NAME[id] ?? id;
  }

  bounds(z: ZoneView): Bounds {
    if (z.rect) return [z.rect[0] - 3, z.rect[0] - 3, z.rect[1] + 3, z.rect[1] + 3];
    const c = z.circle ?? 45;
    return [-c - 3, -c - 3, c + 3, c + 3];
  }

  /** Rutcentrum → världsenheter (origo i byns mitt), från villageLayout: grid och tileSize. */
  tileToWorld(tx: number, ty: number): [number, number] {
    const { grid, tileSize } = this.layout;
    return [(tx - (grid[0] - 1) / 2) * tileSize, (ty - (grid[1] - 1) / 2) * tileSize];
  }

  villageZones(): readonly VillageZoneDef[] {
    return this.layout.zones;
  }

  forestPortal(): [number, number] {
    return this.layout.forestPortal;
  }
}
