import type { EnemyRow, SpawnArea, SpawnPoint } from './types';

const RING_TABLES: { radius: number; table: EnemyRow[]; groups: [number, number]; size: [number, number] }[] = [
  {
    radius: 52,
    groups: [1, 2],
    size: [1, 3],
    table: [
      { enemy: 'skogsvarg', weight: 60, group: [1, 3] },
      { enemy: 'vargbest', weight: 40, group: [1, 2] },
    ],
  },
  {
    radius: 72,
    groups: [1, 2],
    size: [2, 4],
    table: [
      { enemy: 'vargbest', weight: 55, group: [1, 3] },
      { enemy: 'skuggvarg', weight: 45, group: [1, 2] },
    ],
  },
  {
    radius: 92,
    groups: [1, 3],
    size: [2, 4],
    table: [
      { enemy: 'skuggvarg', weight: 50, group: [1, 3] },
      { enemy: 'vargbest', weight: 35, group: [1, 2] },
      { enemy: 'taggsvin', weight: 15, group: [1, 2] },
    ],
  },
  {
    radius: 112,
    groups: [2, 3],
    size: [2, 5],
    table: [
      { enemy: 'skuggvarg', weight: 45, group: [2, 4] },
      { enemy: 'skuggvarg', weight: 35, group: [2, 3] },
      { enemy: 'gravargsledare', weight: 20, group: [1, 2] },
    ],
  },
  {
    radius: 132,
    groups: [2, 4],
    size: [3, 6],
    table: [
      { enemy: 'gravargsledare', weight: 40, group: [2, 3] },
      { enemy: 'vargbest', weight: 35, group: [2, 4] },
      { enemy: 'vargbest', weight: 25, group: [2, 3] },
    ],
  },
];

function ringPoints(ringIndex: number, count: number, startDeg: number): SpawnPoint[] {
  const out: SpawnPoint[] = [];
  const cfg = RING_TABLES[ringIndex];
  if (!cfg) return out;
  for (let i = 0; i < count; i++) {
    const a = ((startDeg + (360 / count) * i) * Math.PI) / 180;
    const x = Math.cos(a) * cfg.radius;
    const y = Math.sin(a) * cfg.radius;
    out.push({
      id: `skog_ring${ringIndex}_${i}`,
      radius: 6,
      pos: [Math.round(x), Math.round(y)],
      groups: cfg.groups,
      group_size: cfg.size,
      enemy_table: cfg.table,
    });
  }
  return out;
}

/** Utökar Startskogen med ytterringar så bana 1 räcker till ~nivå 7. */
export function expandStartskogenArea(area: SpawnArea): SpawnArea {
  if (area.id !== 'startskogen') return area;
  const extra = RING_TABLES.flatMap((_, ri) => ringPoints(ri, 8, ri * 11));
  const session_roll = {
    ...area.session_roll,
    active_spawn_points: [14, 24] as [number, number],
    monsters_per_group: [2, 5] as [number, number],
    champions: { chance_per_group: 0.05, max: 2 },
  };
  return {
    ...area,
    min_player_distance: 22,
    spawn_points: [...area.spawn_points, ...extra],
    session_roll,
  };
}
