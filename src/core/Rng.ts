/** Deterministisk slump (mulberry32) och FNV-1a-hash för seeds. */
export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  static hash(...parts: (string | number)[]): number {
    let h = 2166136261 >>> 0;
    for (const c of parts.join('|')) {
      h ^= c.charCodeAt(0);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  static newSeed(): number {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return (a[0] ?? 1) >>> 1 || 1;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Heltal i [a, b] eller fast tal. */
  int(v: number | readonly [number, number]): number {
    if (typeof v === 'number') return v;
    const [a, b] = v;
    return a + Math.floor(this.next() * (b - a + 1));
  }

  /** Flyttal i [a, b). */
  float(a = 0, b = 1): number {
    return a + this.next() * (b - a);
  }

  /** Kort slumpat id (föremål). */
  id(): string {
    return Math.floor(this.next() * 2 ** 32).toString(36) + Math.floor(this.next() * 2 ** 16).toString(36);
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(list: readonly T[]): T {
    const v = list[Math.floor(this.next() * list.length)];
    if (v === undefined) throw new Error('Rng.pick på tom lista');
    return v;
  }

  weighted<T extends { weight: number }>(rows: readonly T[]): T {
    const sum = rows.reduce((a, r) => a + r.weight, 0);
    let v = this.next() * sum;
    for (const r of rows) if ((v -= r.weight) < 0) return r;
    return this.pick(rows);
  }

  shuffle<T>(list: readonly T[]): T[] {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j] as T, a[i] as T];
    }
    return a;
  }
}
