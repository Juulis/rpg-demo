import type { EffectModule } from '../types';
import { areaChange } from './areaChange';
import { factionRep } from './factionRep';
import { flagSet } from './flagSet';
import { itemGrant } from './itemGrant';
import { merchantStock } from './merchantStock';
import { npcFaction } from './npcFaction';
import { npcLocation } from './npcLocation';
import { npcState } from './npcState';
import { questAltGiver } from './questAltGiver';
import { questExclude } from './questExclude';
import { rumorAdd } from './rumorAdd';
import { townGrowth } from './townGrowth';
import { valueAdd } from './valueAdd';
import { xpGrant } from './xpGrant';

export const EFFECT_MODULES: Record<string, EffectModule> = {
  flag_set: flagSet,
  value_add: valueAdd,
  faction_rep: factionRep,
  npc_state: npcState,
  npc_location: npcLocation,
  npc_faction: npcFaction,
  town_growth: townGrowth,
  merchant_stock: merchantStock,
  area_change: areaChange,
  rumor_add: rumorAdd,
  quest_exclude: questExclude,
  quest_alt_giver: questAltGiver,
  item_grant: itemGrant,
  xp_grant: xpGrant,
};
