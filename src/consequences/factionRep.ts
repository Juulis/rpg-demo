export const FACTION_REP_MIN = -100;
export const FACTION_REP_MAX = 100;
export const FACTION_WARM_THRESHOLD = 30;
export const FACTION_COLD_THRESHOLD = -30;
export const FACTION_MERCHANT_DISCOUNT = 0.05;

export function clampFactionRep(value: number): number {
  return Math.max(FACTION_REP_MIN, Math.min(FACTION_REP_MAX, Math.round(value)));
}

export function merchantPriceFactor(rep: number, merchantMod = 0): number {
  const warm = rep > FACTION_WARM_THRESHOLD ? 1 - FACTION_MERCHANT_DISCOUNT : 1;
  return warm * (1 + merchantMod);
}

export function factionMood(rep: number): 'warm' | 'neutral' | 'cold' {
  if (rep > FACTION_WARM_THRESHOLD) return 'warm';
  if (rep < FACTION_COLD_THRESHOLD) return 'cold';
  return 'neutral';
}

/** Standardfraktion per handlare/NPC tills npc_factions sätts i world_state. */
const DEFAULT_NPC_FACTION: Record<string, string> = {
  tor_kolare: 'de_kvarvarande',
  marta_torghandlare: 'de_kvarvarande',
  gunnar_jarnhand: 'de_kvarvarande',
  olle_vardshus: 'de_kvarvarande',
  sara_benlasare: 'gravvaktarna',
  gravvaktaren_ebbe: 'gravvaktarna',
  bror_vakt: 'de_kvarvarande',
  vaktkapten_ingrid: 'de_kvarvarande',
};

export function npcFaction(npcId: string, npcFactions: Record<string, string>): string | undefined {
  return npcFactions[npcId] ?? DEFAULT_NPC_FACTION[npcId];
}
