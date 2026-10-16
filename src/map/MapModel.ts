import { villageLayout, type MapZone, type VillageLayout, type VillageZoneDef } from '../core/context.ext';
import type { GameData } from '../data/types';

export type Bounds = readonly [x0: number, y0: number, x1: number, y1: number];

/** Statisk kartgeometri och namn. All zon-geometri läses ur ZoneView/GameData, inget hårdkodat utöver namn. */
export class MapModel {
  static readonly ZONE_NAME: Readonly<Record<string, string>> = { forest: 'Den dimmiga skogen', village: 'Den gamla byn' };
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

  zoneName(z: MapZone): string {
    return MapModel.ZONE_NAME[z.name] ?? z.name;
  }

  areaName(id: string): string {
    return MapModel.AREA_NAME[id] ?? id;
  }

  bounds(z: MapZone): Bounds {
    if (z.rect) return [z.rect[0] - 3, z.rect[0] - 3, z.rect[1] + 3, z.rect[1] + 3];
    const c = z.circle ?? 45;
    return [-c - 3, -c - 3, c + 3, c + 3];
  }

  /** Samma rutsystem som spelet (32x32 rutor, 1 ruta = 2 enheter). */
  tileToWorld(tx: number, ty: number): [number, number] {
    return [(tx - 15.5) * 2, (ty - 15.5) * 2];
  }

  villageZones(): readonly VillageZoneDef[] {
    return this.layout.zones;
  }

  forestPortal(): [number, number] | null {
    return this.layout.forestPortal;
  }
}
