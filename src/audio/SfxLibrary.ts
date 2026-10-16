import { assetUrl } from '../core/assets';

/** Ljudnamn som spelet kan spela. */
export type SoundName =
  | 'hit'
  | 'kill'
  | 'drop'
  | 'drop_rare'
  | 'pickup'
  | 'pickup_first'
  | 'gold'
  | 'rune'
  | 'portal'
  | 'zone'
  | 'boss'
  | 'step'
  | 'click'
  | 'toggle';

export interface SoundDef {
  /** Filvarianter (slumpas) under public/assets/sfx/<variant>.ogg. */
  variants: readonly string[];
  gain: number;
}

export interface SynthPatch {
  freq: number;
  type: OscillatorType;
  dur: number;
  sweepTo?: number;
}

/** Ljudkatalog: Kenney CC0 (RPG Audio, Impact Sounds, Interface Sounds), se CREDITS.md. */
export class SfxLibrary {
  static readonly SOUNDS: Readonly<Record<SoundName, SoundDef>> = {
    hit: { variants: ['hit1', 'hit2'], gain: 0.7 },
    kill: { variants: ['kill'], gain: 0.8 },
    drop: { variants: ['drop'], gain: 0.6 },
    drop_rare: { variants: ['drop_rare'], gain: 0.7 },
    pickup: { variants: ['pickup'], gain: 0.6 },
    pickup_first: { variants: ['pickup_first'], gain: 0.6 },
    gold: { variants: ['gold'], gain: 0.6 },
    rune: { variants: ['rune'], gain: 0.8 },
    portal: { variants: ['portal'], gain: 0.8 },
    zone: { variants: ['zone'], gain: 0.6 },
    boss: { variants: ['boss'], gain: 0.9 },
    step: { variants: ['step1', 'step2', 'step3'], gain: 0.25 },
    click: { variants: ['click'], gain: 0.5 },
    toggle: { variants: ['toggle'], gain: 0.5 },
  };

  /** Syntetiserad reserv om en fil saknas eller inte kan avkodas (t.ex. utan OGG-stöd). */
  private static readonly SYNTH: Partial<Record<SoundName, SynthPatch>> = {
    hit: { freq: 180, type: 'square', dur: 0.08 },
    kill: { freq: 110, type: 'sawtooth', dur: 0.25 },
    step: { freq: 80, type: 'triangle', dur: 0.05 },
    gold: { freq: 1400, type: 'triangle', dur: 0.12 },
    rune: { freq: 520, type: 'sine', dur: 0.8 },
    portal: { freq: 300, type: 'sine', dur: 0.7, sweepTo: 900 },
    boss: { freq: 70, type: 'sawtooth', dur: 0.5 },
    drop_rare: { freq: 880, type: 'sine', dur: 0.3 },
  };
  private static readonly DEFAULT_SYNTH: SynthPatch = { freq: 660, type: 'sine', dur: 0.12 };

  def(name: SoundName): SoundDef {
    return SfxLibrary.SOUNDS[name];
  }

  synth(name: SoundName): SynthPatch {
    return SfxLibrary.SYNTH[name] ?? SfxLibrary.DEFAULT_SYNTH;
  }

  /** Alla unika filvarianter. */
  variants(): string[] {
    return [...new Set(Object.values(SfxLibrary.SOUNDS).flatMap((s) => s.variants))];
  }

  url(variant: string): string {
    return assetUrl(`sfx/${variant}.ogg`);
  }

  pickVariant(name: SoundName, rnd: () => number = Math.random): string {
    const v = this.def(name).variants;
    return v[Math.floor(rnd() * v.length)] ?? v[0] ?? name;
  }
}
