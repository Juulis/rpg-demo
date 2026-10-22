import type { Lorebook } from '../data/types';

export interface LorePieceRow {
  id: string;
  name: string;
  quality: 'set' | 'legendary';
  base: string;
  lore: string;
  item_level?: number;
  type?: string;
  setId?: string;
}

export interface LoreSetRow {
  id: string;
  name: string;
  lore: string;
  pieceIds: string[];
}

/** Indexerar lorebok.json och håller upplåsta poster per hjälte. */
export class LoreBookModel {
  readonly pieces = new Map<string, LorePieceRow>();
  readonly sets = new Map<string, LoreSetRow>();
  private unlocked = new Set<string>();

  constructor(data: Lorebook) {
    for (const cat of data.categories) {
      for (const raw of cat.entries) {
        if ('pieces' in raw && Array.isArray((raw as { pieces?: unknown }).pieces)) {
          const set = raw as {
            id: string;
            name: string;
            lore: string;
            pieces: { id: string; name: string; base: string; lore: string; item_level?: number }[];
          };
          const pieceIds: string[] = [];
          for (const p of set.pieces) {
            pieceIds.push(p.id);
            this.pieces.set(p.id, {
              id: p.id,
              name: p.name,
              quality: 'set',
              base: p.base,
              lore: p.lore,
              item_level: p.item_level,
              setId: set.id,
            });
          }
          this.sets.set(set.id, { id: set.id, name: set.name, lore: set.lore, pieceIds });
        } else {
          const leg = raw as {
            id: string;
            name: string;
            base: string;
            lore: string;
            item_level?: number;
            type?: string;
          };
          this.pieces.set(leg.id, {
            id: leg.id,
            name: leg.name,
            quality: 'legendary',
            base: leg.base,
            lore: leg.lore,
            item_level: leg.item_level,
            type: leg.type,
          });
        }
      }
    }
  }

  total(): number {
    return this.pieces.size;
  }

  foundCount(): number {
    return this.unlocked.size;
  }

  isUnlocked(id: string): boolean {
    return this.unlocked.has(id);
  }

  setRevealed(setId: string): boolean {
    const set = this.sets.get(setId);
    if (!set) return false;
    return set.pieceIds.some((id) => this.unlocked.has(id));
  }

  resolve(itemId: string): string | null {
    if (this.pieces.has(itemId)) return itemId;
    for (const [id, row] of this.pieces) {
      if (row.base === itemId) return id;
    }
    return null;
  }

  loadUnlocked(ids: Iterable<string>): void {
    this.unlocked = new Set();
    for (const id of ids) {
      const r = this.resolve(id);
      if (r) this.unlocked.add(r);
    }
  }

  /** Returnerar true om posten nyss låstes upp. */
  unlock(itemId: string): boolean {
    const id = this.resolve(itemId);
    if (!id || this.unlocked.has(id)) return false;
    this.unlocked.add(id);
    return true;
  }

  progressForCategory(categoryId: 'set' | 'legendariska'): { found: number; total: number } {
    let total = 0;
    let found = 0;
    if (categoryId === 'set') {
      for (const set of this.sets.values()) {
        for (const id of set.pieceIds) {
          total++;
          if (this.unlocked.has(id)) found++;
        }
      }
    } else {
      for (const p of this.pieces.values()) {
        if (p.quality !== 'legendary') continue;
        total++;
        if (this.unlocked.has(p.id)) found++;
      }
    }
    return { found, total };
  }
}
