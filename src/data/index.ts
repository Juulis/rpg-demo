/** Typad åtkomst till speldata. JSON importeras statiskt och valideras mot interfacen i types.ts vid uppstart (lätta kontroller). */
import affix from './affix.json';
import attribut from './attribut.json';
import dropTabeller from './drop_tabeller.json';
import foremalBas from './foremal_bas.json';
import klasser from './klasser.json';
import lootKvaliteter from './loot_kvaliteter.json';
import lorebok from './lorebok.json';
import monsterNiva from './monster_niva.json';
import monsterfamiljer from './monsterfamiljer.json';
import portalBy from './portal_by.json';
import set from './set.json';
import spawnzoner from './spawnzoner.json';
import stader from './stader.json';
import npc from './npc.json';
import type { NpcDataFile } from './npcTypes';
import type { Cities, Classes, GameData, MonsterDef, MonsterFamilies, MonsterLevels, PortalVillage, SpawnZones } from './types';

export const DATA: GameData = {
  classes: klasser as unknown as Classes,
  families: monsterfamiljer as unknown as MonsterFamilies,
  monsterLevels: monsterNiva as unknown as MonsterLevels,
  spawn: spawnzoner as unknown as SpawnZones,
  portalVillage: portalBy as unknown as PortalVillage,
  cities: stader as unknown as Cities,
  qualities: lootKvaliteter,
  items: foremalBas,
  affixes: affix,
  sets: set,
  drops: dropTabeller,
  attributes: attribut,
  lorebook: lorebok,
  npc: npc as unknown as NpcDataFile,
};

const MONSTERS = new Map<string, MonsterDef>(DATA.families.monsters.map((m) => [m.id, m]));

/** Monsterdefinition per undertyp. Kastar om id saknas (ingen tyst fallback). */
export function monsterDef(id: string): MonsterDef {
  const m = MONSTERS.get(id);
  if (!m) throw new Error(`Okänt monster-id i data: ${id}`);
  return m;
}

/** Enkel sanity-kontroll av data vid uppstart. Returnerar lista med problem (tom = ok). */
export function validateData(): string[] {
  const issues: string[] = [];
  for (const a of DATA.spawn.areas) {
    const rows = [
      ...(a.enemy_table ?? []),
      ...a.spawn_points.flatMap((p) => p.enemy_table ?? []),
      ...Object.values(a.zone_tables ?? {}).flat(),
    ];
    for (const r of rows) if (!MONSTERS.has(r.enemy)) issues.push(`${a.id}: okänd fiende ${r.enemy}`);
    if (a.boss && !MONSTERS.has(a.boss.enemy)) issues.push(`${a.id}: okänd boss ${a.boss.enemy}`);
  }
  for (const m of DATA.families.monsters) if (typeof m.damage !== 'number') issues.push(`${m.id}: damage saknas eller är inte ett tal`);
  for (const c of DATA.classes.classes) if (!Array.isArray(c.start_gear)) issues.push(`${c.id}: start_gear saknas`);
  const areas = new Set(DATA.spawn.areas.map((a) => a.id));
  for (const n of DATA.npc.npcs) {
    if (!areas.has(n.area)) issues.push(`npc ${n.id}: okänt område ${n.area}`);
    if (n.zone !== 'forest' && n.zone !== 'village') issues.push(`npc ${n.id}: okänd zon ${n.zone}`);
    if (!n.sprite) issues.push(`npc ${n.id}: sprite saknas`);
    if (!n.pos && !n.tile) issues.push(`npc ${n.id}: pos eller tile krävs`);
  }
  return issues;
}
