import type { SfxLibrary, SoundName } from './SfxLibrary';
import type { VolumeControl } from './VolumeControl';

export interface PlayOptions {
  rate?: number;
  gain?: number;
  /** Slumpad tonhöjdsvariation (andel), standard 0.06. */
  vary?: number;
}

type AudioContextCtor = new () => AudioContext;

/** WebAudio: startas vid första användarinteraktion (krav i webbläsare), laddar OGG-filer, syntetiserad reserv. */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private readonly buffers = new Map<string, AudioBuffer>();
  private unsubVolume: (() => void) | null = null;

  constructor(
    private readonly library: SfxLibrary,
    private readonly volume: VolumeControl,
    private readonly fetcher: (url: string) => Promise<ArrayBuffer> = (u) => fetch(u).then((r) => r.arrayBuffer()),
    private readonly ctor: AudioContextCtor | undefined = AudioEngine.findCtor(),
  ) {}

  private static findCtor(): AudioContextCtor | undefined {
    if (typeof window === 'undefined') return undefined;
    const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };
    return w.AudioContext ?? w.webkitAudioContext;
  }

  get unlocked(): boolean {
    return this.ctx !== null;
  }

  /** Skapar/återupptar AudioContext. Anropas från en användarhändelse. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    if (!this.ctor) return;
    const ctx = new this.ctor();
    const master = ctx.createGain();
    master.connect(ctx.destination);
    master.gain.value = this.volume.gain;
    this.ctx = ctx;
    this.master = master;
    this.unsubVolume = this.volume.onChange(() => this.applyGain());
    for (const v of this.library.variants()) {
      this.fetcher(this.library.url(v))
        .then((ab) => ctx.decodeAudioData(ab))
        .then((b) => this.buffers.set(v, b))
        .catch(() => undefined); // reserv: synth
    }
  }

  play(name: SoundName, opts: PlayOptions = {}): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master || !this.volume.audible) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const rate = (opts.rate ?? 1) * (1 + (Math.random() * 2 - 1) * (opts.vary ?? 0.06));
    const gain = this.library.def(name).gain * (opts.gain ?? 1);
    const buf = this.buffers.get(this.library.pickVariant(name));
    if (!buf) {
      this.synth(ctx, master, name, rate, gain);
      return;
    }
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    src.buffer = buf;
    src.playbackRate.value = rate;
    g.gain.value = gain;
    src.connect(g).connect(master);
    src.start();
  }

  dispose(): void {
    this.unsubVolume?.();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.buffers.clear();
  }

  private applyGain(): void {
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(this.volume.gain, this.ctx.currentTime, 0.02);
  }

  private synth(ctx: AudioContext, master: GainNode, name: SoundName, rate: number, gain: number): void {
    const p = this.library.synth(name);
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = p.type;
    o.frequency.setValueAtTime(p.freq * rate, t);
    if (p.sweepTo) o.frequency.exponentialRampToValueAtTime(p.sweepTo, t + p.dur);
    g.gain.setValueAtTime(0.3 * gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + p.dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + p.dur + 0.02);
  }
}
