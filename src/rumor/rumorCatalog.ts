import ryktenFile from '../data/rykten.json';
import type { RumorDataFile, RumorDef } from '../data/rumorTypes';

const data = ryktenFile as unknown as RumorDataFile;

export function allRumors(): readonly RumorDef[] {
  return data.rykten;
}
