import type { LocaleManager } from './LocaleManager';
import { DEFAULT_LOCALE, type Locale } from './types';

/** En översättningsfil från Speldesign: platt map id → { fältnamn: text }, samma fältnamn som i svenska filen. */
export type DataOverlay = Readonly<Record<string, Readonly<Record<string, string>>>>;

/**
 * Lägger språk-overlays ovanpå svensk designdata, per fil och id.
 * Speldesign: design/i18n/en/<samma filnamn>.json, t.ex. foremal_bas.json →
 *   { "ristarens_mejsel": { "namn": "The Carver's Chisel", "beskrivning": "…" } }
 * I spelet ligger de i src/data/i18n/<locale>/<fil>.json och laddas med DataOverlayLoader.
 * Det som saknas faller tillbaka på svenskan (varning i dev-läge).
 */
export class DataLocalizer {
  private readonly overlays = new Map<Locale, Map<string, DataOverlay>>();

  constructor(private readonly i18n: LocaleManager) {}

  /** Registrera en overlay för en fil (filnamn utan sökväg, t.ex. "foremal_bas.json" eller "foremal_bas"). */
  addOverlay(locale: Locale, file: string, overlay: DataOverlay): void {
    let m = this.overlays.get(locale);
    if (!m) this.overlays.set(locale, (m = new Map()));
    m.set(DataLocalizer.norm(file), overlay);
  }

  hasOverlay(locale: Locale, file: string): boolean {
    return this.overlays.get(locale)?.has(DataLocalizer.norm(file)) ?? false;
  }

  /** Ett textfält för en post: overlay för aktivt språk, annars svenskt värde. */
  field(file: string, id: string, field: string, svValue: string): string {
    const loc = this.i18n.locale;
    if (loc === DEFAULT_LOCALE) return svValue;
    const v = this.overlays.get(loc)?.get(DataLocalizer.norm(file))?.[id]?.[field];
    if (v === undefined)
      this.i18n.missing(`data:${loc}:${file}:${id}.${field}`, `[i18n] Saknar ${loc} för ${file} ${id}.${field}, använder svenska`);
    return v ?? svValue;
  }

  /** Kopia av posten där alla strängfält som finns i overlayen ersatts (övriga fält orörda). */
  localize<T extends object>(file: string, id: string, record: T): T {
    const loc = this.i18n.locale;
    if (loc === DEFAULT_LOCALE) return record;
    const o = this.overlays.get(loc)?.get(DataLocalizer.norm(file))?.[id];
    if (!o) {
      this.i18n.missing(`data:${loc}:${file}:${id}`, `[i18n] Saknar ${loc} för ${file} ${id}, använder svenska`);
      return record;
    }
    const out: Record<string, unknown> = { ...(record as Record<string, unknown>) };
    for (const [k, v] of Object.entries(o)) if (typeof out[k] === 'string' || out[k] === undefined) out[k] = v;
    return out as T;
  }

  static norm(file: string): string {
    return (file.split('/').pop() ?? file).replace(/\.json$/, '');
  }
}
