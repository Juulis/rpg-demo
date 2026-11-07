/** 0..1. Icke-finita tal blir 0. */
export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Klar andel av en fas. Tom fas räknas som klar. */
export function fraction(done: number, total: number): number {
  if (!(total > 0)) return 1;
  return clamp01(done / total);
}

/**
 * Vägd summa av fasandelar 0..1. Varje fas rapporterar verkligt klar/planerat arbete.
 * Okänd fas ignoreras. Icke-finit värde lämnar föregående andel orörd.
 */
export class WeightedLoadProgress {
  private readonly weights: ReadonlyMap<string, number>;
  private readonly fractions = new Map<string, number>();
  private sealed = false;
  private readonly listeners = new Set<(ratio: number) => void>();

  constructor(weights: Readonly<Record<string, number>>) {
    const entries = Object.entries(weights).filter(([, weight]) => weight > 0);
    this.weights = new Map(entries);
    for (const phase of this.weights.keys()) this.fractions.set(phase, 0);
  }

  subscribe(fn: (ratio: number) => void): () => void {
    this.listeners.add(fn);
    fn(this.ratio);
    return () => this.listeners.delete(fn);
  }

  setPhase(phase: string, value: number): void {
    if (this.sealed || !this.weights.has(phase) || !Number.isFinite(value)) return;
    const next = clamp01(value);
    if (this.fractions.get(phase) === next) return;
    this.fractions.set(phase, next);
    this.emit();
  }

  /** Allt startarbete är slut. Kvoten blir 1. */
  seal(): void {
    if (this.sealed) return;
    this.sealed = true;
    for (const phase of this.fractions.keys()) this.fractions.set(phase, 1);
    this.emit();
  }

  get ratio(): number {
    if (this.sealed) return 1;
    let weight = 0;
    let acc = 0;
    for (const [phase, phaseWeight] of this.weights) {
      weight += phaseWeight;
      acc += phaseWeight * (this.fractions.get(phase) ?? 0);
    }
    return weight <= 0 ? 0 : clamp01(acc / weight);
  }

  private emit(): void {
    const ratio = this.ratio;
    for (const fn of this.listeners) fn(ratio);
  }
}
