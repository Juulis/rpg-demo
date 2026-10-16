import { villageLayout, type MapZone, type VillageLayout, type VillageZoneDef } from '../core/context.ext';
import type { GameData } from '../data/types';
import type { LocaleManager } from '../i18n/LocaleManager';
import type { Key } from '../i18n/types';
import sv from '../i18n/sv.json';

export type Bounds = readonly [x0: number, y0: number, x1: number, y1: number];

/** Statisk kartgeometri och namn. All zon-geometri läses ur ZoneView/GameData, inget hårdkodat utöver namn. */
export class MapModel {
  private readonly layout: VillageLayout;

  constructor(
    data: GameData,
    private readonly i18n: LocaleManager,
  ) {
    this.layout = villageLayout(data);
  }

  /** Zonnamn via i18n (map.zones.<namn>); okänd zon visas med sitt id. */
  zoneName(z: MapZone): string {
    return z.name in sv.map.zones ? this.i18n.t(`map.zones.${z.name}` as Key) : z.name;
  }

  /** Områdesnamn via i18n (map.areas.<id>). */
  areaName(id: string): string {
    return id in sv.map.areas ? this.i18n.t(`map.areas.${id}` as Key) : id;
  }

  t(key: Key): string {
    return this.i18n.t(key);
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
