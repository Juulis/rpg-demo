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
import rykten from './rykten.json';
import quests from './quests.json';
import varldStor from './varld_stor.json';
import type { BigWorldDataFile } from './bigWorldTypes';
import type { QuestDataFile } from './questTypes';
import type { RumorDataFile } from './rumorTypes';
import type { DialogDataFile } from './dialogTypes';
import { DIALOG_DATA } from '../npc/designDialoger';
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
  dialoger: DIALOG_DATA as DialogDataFile,
  rykten: rykten as unknown as RumorDataFile,
  quests: quests as unknown as QuestDataFile,
  varldStor: varldStor as unknown as BigWorldDataFile,
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
  const npcIds = new Set(DATA.npc.npcs.map((n) => n.id));
  for (const n of DATA.npc.npcs) {
    if (!areas.has(n.area)) issues.push(`npc ${n.id}: okänt område ${n.area}`);
    if (
      n.zone !== 'forest' &&
      n.zone !== 'village' &&
      n.zone !== 'wolfstead' &&
      n.zone !== 'dimmerstrand' &&
      n.zone !== 'kopparberg' &&
      n.zone !== 'askeborg'
    )
      issues.push(`npc ${n.id}: okänd zon ${n.zone}`);
    if (!n.sprite) issues.push(`npc ${n.id}: sprite saknas`);
    if (!n.pos && !n.tile) issues.push(`npc ${n.id}: pos eller tile krävs`);
  }
  for (const id of Object.keys(DATA.dialoger.npcs)) {
    if (!npcIds.has(id)) issues.push(`dialog ${id}: okänd npc`);
  }
  for (const r of DATA.rykten.rykten) {
    if (r.ersatter && !DATA.rykten.rykten.some((x) => x.id === r.ersatter)) {
      issues.push(`rykte ${r.id}: okänt ersatter ${r.ersatter}`);
    }
  }
  for (const q of DATA.quests.akt_1) {
    if (!npcIds.has(q.givare)) issues.push(`quest ${q.id}: okänd givare ${q.givare}`);
    if (q.alternativ_givare && !npcIds.has(q.alternativ_givare)) {
      issues.push(`quest ${q.id}: okänd alternativ_givare ${q.alternativ_givare}`);
    }
    if (!q.steg.length) issues.push(`quest ${q.id}: inga steg`);
    for (const s of q.steg) {
      if (!s.id || !s.text) issues.push(`quest ${q.id}: steg saknar id/text`);
    }
  }
  const bw = DATA.varldStor;
  const regionIds = new Set(bw.regioner.map((r) => r.id));
  const biomIds = new Set(Object.keys(bw.biomer));
  for (const r of bw.regioner) {
    if (!biomIds.has(r.biom)) issues.push(`varld_stor region ${r.id}: okänt biom ${r.biom}`);
  }
  for (const road of bw.vagar) {
    for (const id of road.strackning) {
      if (!regionIds.has(id)) issues.push(`varld_stor väg ${road.id}: okänd region ${id}`);
    }
  }
  for (const poi of bw.pois) {
    if (!regionIds.has(poi.region)) issues.push(`varld_stor poi ${poi.id}: okänd region ${poi.region}`);
  }
  const rod = bw.pois.find((p) => p.id === 'rod_portal');
  if (!rod?.krav?.includes('runor')) issues.push('varld_stor: rod_portal saknar krav alla_tre_runor');
  return issues;
}
