// Lorebok – typer och klass-skisser inför TS/Vite-migreringen. Inga globaler; beroenden injiceras.

// ---------- Data (speglar lorebok.json) ----------
export type LoreQuality = 'set' | 'legendary';
export type LoreUnlockRule = { type: 'hittad'; hidden_as: 'siluett' } | { type: 'forsta_del_hittad'; name_visible: boolean };

export interface LoreEntry {
  id: string;
  name: string;
  quality: LoreQuality;
  base: string;
  lore: string;
  unlock: LoreUnlockRule;
  item_level?: number;
  type?: string; // legendariska: vapentyp
  setId?: string; // setdelar: tillhör set
}
export interface LoreSet {
  id: string;
  name: string;
  quality: 'set';
  class: string | null;
  item_level: number;
  lore: string;
  unlock: Extract<LoreUnlockRule, { type: 'forsta_del_hittad' }>;
  pieces: LoreEntry[];
}
export interface LoreCategory {
  id: 'set' | 'legendariska' | (string & {});
  name: string;
  entries: Array<LoreEntry | LoreSet>;
}
export interface LoreData {
  meta: { version: string; hotkey: string; unlock: { default: string; rule: string }; progress: string };
  categories: LoreCategory[];
}
export type StatMap = Record<string, number>;
export interface LoreStats {
  // från foremal_bas.json / set.json
  fixed(entryId: string): StatMap | undefined;
  setBonuses(setId: string): Record<number, StatMap>;
  baseName(baseId: string): string;
}

// ---------- Events ----------
export interface KillInfo {
  id: string;
  area: string;
  lvl: number;
  champion: boolean;
  unique: boolean;
}
export interface EventMap {
  pickup: [itemId: string, first: boolean];
  kill: [info: KillInfo];
  zone_enter: [name: string];
  rune: [n: number];
  lore_unlock: [entryId: string];
  hero_loaded: [heroId: string];
}
export class EventBus<M extends { [K in keyof M]: unknown[] }> {
  private ls = new Map<keyof M, Set<(...a: never[]) => void>>();
  on<K extends keyof M>(ev: K, fn: (...a: M[K]) => void): () => void {
    let s = this.ls.get(ev);
    if (!s) this.ls.set(ev, (s = new Set()));
    s.add(fn as never);
    return () => s!.delete(fn as never);
  }
  emit<K extends keyof M>(ev: K, ...a: M[K]): void {
    this.ls.get(ev)?.forEach((fn) => {
      try {
        (fn as unknown as (...x: M[K]) => void)(...a);
      } catch (e) {
        console.error(e);
      }
    });
  }
}

// ---------- Lagring ----------
export interface FoundRecord {
  first: string;
  ilvl?: number;
  quality?: string;
  base?: string;
}
export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

/** Upplåsningar per hjälte. Första upplocket vinner, skrivs aldrig över. */
export class LoreRepository {
  constructor(
    private store: KeyValueStore,
    private heroId: string,
  ) {}
  private get key() {
    return `rpg_found:${this.heroId}`;
  } // i dag: 'rpg_found' som save.js växlar per hjälte
  all(): Record<string, FoundRecord> {
    /* parse JSON, {} vid fel */ throw new Error('skiss');
  }
  has(id: string): boolean {
    return id in this.all();
  }
  add(id: string, rec: FoundRecord): boolean {
    /* false om redan finns */ throw new Error('skiss');
  }
}

// ---------- Modell ----------
export type EntryState = 'locked' | 'unlocked';
export interface Progress {
  found: number;
  total: number;
}

/** Ren modell: inga DOM- eller lagringsberoenden. */
export class LoreBook {
  private entries = new Map<string, LoreEntry>();
  private aliases = new Map<string, string>(); // "<set>.<bas>" -> piece id
  private unlocked = new Set<string>();
  constructor(
    readonly data: LoreData,
    readonly stats: LoreStats,
  ) {
    /* indexera poster och alias */
  }
  resolve(itemId: string): string | null {
    return this.entries.has(itemId) ? itemId : (this.aliases.get(itemId) ?? null);
  }
  entry(id: string): LoreEntry | undefined {
    return this.entries.get(id);
  }
  state(id: string): EntryState {
    return this.unlocked.has(id) ? 'unlocked' : 'locked';
  }
  isSetRevealed(setId: string): boolean {
    /* minst en del upplåst */ throw new Error('skiss');
  }
  load(ids: Iterable<string>): void {
    this.unlocked = new Set([...ids].filter((i) => this.entries.has(i)));
  }
  unlock(id: string): boolean {
    if (this.unlocked.has(id)) return false;
    this.unlocked.add(id);
    return true;
  }
  progress(categoryId?: string): Progress {
    throw new Error('skiss');
  }
}

// ---------- Upplåsning ----------
/** Lyssnar på bussen, tillämpar reglerna, sparar och meddelar. */
export class LoreUnlockService {
  private off: Array<() => void> = [];
  constructor(
    private bus: EventBus<EventMap>,
    private book: LoreBook,
    private repo: LoreRepository,
  ) {}
  start(): void {
    this.book.load(Object.keys(this.repo.all()));
    this.off.push(this.bus.on('pickup', (id) => this.onPickup(id)));
    // kill / zone_enter / rune: reserverade för framtida regler
  }
  stop(): void {
    this.off.forEach((f) => f());
    this.off = [];
  }
  setRepository(repo: LoreRepository): void {
    this.repo = repo;
    this.book.load(Object.keys(repo.all()));
  } // hjältebyte, inga notiser
  private onPickup(itemId: string): void {
    const id = this.book.resolve(itemId);
    if (!id) return;
    this.repo.add(id, { first: new Date().toISOString() });
    if (this.book.unlock(id)) this.bus.emit('lore_unlock', id);
  }
}

// ---------- Vy ----------
export interface LoreImages {
  illustration(id: string): string | undefined;
  silhouette(id: string): string | undefined;
  icon(id: string): string | undefined;
}
export interface InputGate {
  isBlocked(): boolean;
} // t.ex. hjälteval öppet / fokus i textfält

/** Overlay: H växlar, Esc stänger, svalde spelinput medan öppen (utom Alt). Läser bara modellen. */
export class LoreBookView {
  private root!: HTMLElement;
  private isOpen = false;
  private tab: string;
  private selected: string | null = null;
  constructor(
    private book: LoreBook,
    private bus: EventBus<EventMap>,
    private images: LoreImages,
    private gate: InputGate,
    private doc: Document = document,
  ) {
    this.tab = book.data.categories[0].id;
  }
  mount(parent: HTMLElement): void {
    /* bygg DOM, keydown i capture-fas, contextmenu preventDefault */ this.bus.on('lore_unlock', (id) => this.notify(id));
  }
  open(): void {
    this.isOpen = true;
    this.render();
  }
  close(): void {
    this.isOpen = false;
  }
  toggle(): void {
    this.isOpen ? this.close() : this.open();
  }
  get opened(): boolean {
    return this.isOpen;
  }
  private render(): void {
    /* vänster: flikar + rutnät; höger: vald post (låst = siluett + ???) */
  }
  private notify(entryId: string): void {
    /* "Ny post i loreboken (H)" + glöd på rutan */
  }
}

export interface LoreBookDeps {
  data: LoreData;
  stats: LoreStats;
  bus: EventBus<EventMap>;
  store: KeyValueStore;
  heroId: string;
  images: LoreImages;
  gate: InputGate;
  parent: HTMLElement;
}
export declare function createLoreBook(deps: LoreBookDeps): { book: LoreBook; service: LoreUnlockService; view: LoreBookView };
