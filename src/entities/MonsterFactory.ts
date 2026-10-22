import type { Vec2 } from '../core/GameContext';
import type { AssetStore } from '../render/Assets';
import { DirSprite } from '../render/DirSprite';
import { scaleKForWorldHeightM, shadowRadiusForWorldHeightM, worldHeightMForMonster } from '../render/figureWorldHeights';
import type { SpawnSpec, SpawnSystem } from '../systems/SpawnSystem';
import type { World } from '../systems/World';
import { Monster } from './Monster';
import { fullDef, monsterLook } from './MonsterDefs';

/** Skapar monster (data + figur) och lägger dem i världen. */
export class MonsterFactory {
  constructor(
    private readonly assets: AssetStore,
    private readonly spawn: SpawnSystem,
  ) {}

  create(w: World, id: string, pos: Vec2, lvl: number | null, spec: SpawnSpec | null): Monster {
    const def = fullDef(id);
    const look = monsterLook(id, def.family, (k) => this.assets.monsters.has(k));
    const set = this.assets.monsters.get(look.sheet) ?? this.assets.monsters.get('forvriden_jagare') ?? {};
    const hm = worldHeightMForMonster(id, def.family, def.boss);
    const view = new DirSprite(set, scaleKForWorldHeightM(set, hm), shadowRadiusForWorldHeightM(hm));
    view.sprite.tint = look.tint;
    const es = spec?.elite ? this.spawn.eliteStats(spec) : null;
    const m = new Monster(def, lvl ?? spec?.level ?? def.level, pos, view, spec, es, () => w.rng.next());
    if (m.elite) {
      const c = m.elite === 'unik' ? 0xc7a35a : 0x8a8aff;
      view.sprite.tint = c === 0xc7a35a ? 0xffe8b0 : 0xc8c8ff;
    }
    w.objects.addChild(view);
    w.monsters.push(m);
    return m;
  }

  /** Spawnlista per game; Startskogen instansierar nära hjälten (se syncProximitySpawns). */
  populate(w: World, cityState: string): void {
    const area = this.spawn.area(w.zone.areaId);
    const specs = this.spawn.roll(area, w.session, { cityState });
    if (w.zone.areaId === 'startskogen') {
      w.spawnQueue = specs.map((s) => {
        const p = w.zone.toWorld(s.pos);
        w.zone.collide(p, 0.5);
        return { spec: s, pos: p, done: false };
      });
      return;
    }
    w.spawnQueue = [];
    for (const s of specs) {
      if (w.session.killed.has(s.uid)) continue;
      const p = w.zone.toWorld(s.pos);
      w.zone.collide(p, 0.5);
      this.create(w, s.enemy, p, s.boss ? (area.boss?.level ?? null) : s.level, s);
    }
  }
}
