import type { LocaleManager } from '../../i18n/LocaleManager';
import { DATA } from '../../data';

/** Visningsnamn för biom/region från varld_stor (sv i data, en via overlay). */
export function bigWorldBiomeName(locale: LocaleManager, biomeId: string): string {
  const sv = DATA.varldStor.biomer[biomeId]?.namn ?? biomeId;
  return locale.data.field('varld_stor', biomeId, 'namn', sv);
}

export function bigWorldRegionName(locale: LocaleManager, regionId: string): string {
  const sv = DATA.varldStor.regioner.find((r) => r.id === regionId)?.namn ?? regionId;
  return locale.data.field('varld_stor', regionId, 'namn', sv);
}
