import type { NpcDef } from '../data/npcTypes';
import type { WorldState } from '../world/worldStateTypes';

const TEMPLATE_CYCLE = ['bybo_bonde', 'bybo_barn', 'bybo_vakt'] as const;
const SPRITE_BY_TEMPLATE: Record<string, string> = {
  bybo_bonde: 'bror_vakt',
  bybo_barn: 'lilla_mira',
  bybo_vakt: 'bror_vakt',
};

function settlersForCity(state: string | undefined): number {
  if (!state?.startsWith('aterbefolkad')) return 0;
  if (state === 'aterbefolkad_1') return 6;
  if (state === 'aterbefolkad_2') return 12;
  return state === 'aterbefolkad_3' ? 18 : 4;
}

/** Syntetiska bybor i återbefolkad gamla_byn. */
export function backgroundVillagerDefs(areaId: string, world: Readonly<WorldState>): NpcDef[] {
  if (areaId !== 'gamla_byn') return [];
  const city = world.city_states.gamla_byn ?? 'besatt';
  const count = settlersForCity(city);
  if (count <= 0) return [];
  const out: NpcDef[] = [];
  for (let i = 0; i < count; i++) {
    const template = TEMPLATE_CYCLE[i % TEMPLATE_CYCLE.length] ?? 'bybo_bonde';
    const id = `bybo_${template}_${i}`;
    out.push({
      id,
      sprite: SPRITE_BY_TEMPLATE[template] ?? 'bror_vakt',
      area: 'gamla_byn',
      zone: 'village',
      tile: [10 + (i % 5), 12 + Math.floor(i / 5)],
      act: 1,
      name: 'Bybo',
      default_line: '…',
      routineTemplate: template,
    });
  }
  return out;
}
