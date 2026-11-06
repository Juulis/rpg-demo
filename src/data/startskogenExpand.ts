import type { EnemyRow, SpawnArea, Range } from './types';

const TWO: Range = [2, 2];
const ONE: Range = [1, 1];

function normalizeEnemyRows(rows: EnemyRow[]): EnemyRow[] {
  return rows.map((row) => ({ ...row, group: TWO }));
}

/** Utökar Startskogen för stor värld: ~14 monster/game (design), inga ytterringar. */
export function expandStartskogenArea(area: SpawnArea): SpawnArea {
  if (area.id !== 'startskogen') return area;
  const baseTable = area.enemy_table ?? [];
  const spawn_points = area.spawn_points.map((p) => ({
    ...p,
    groups: ONE,
    group_size: TWO,
    enemy_table: normalizeEnemyRows(p.enemy_table ?? baseTable),
  }));
  return {
    ...area,
    spawn_points,
    min_player_distance: 22,
    session_roll: {
      ...area.session_roll,
      active_spawn_points: [7, 7],
      monsters_per_group: TWO,
      champions: { chance_per_group: 0.03, max: 1 },
      uniques: area.session_roll?.uniques,
    },
  };
}
