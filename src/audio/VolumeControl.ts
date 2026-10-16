import type { KeyValueStore } from '../core/storage';

/** Volym och mute, sparas i rpg_vol / rpg_mute (samma nycklar som js/audio.js). */
export class VolumeControl {
  static readonly K_VOL = 'rpg_vol';
  static readonly K_MUTE = 'rpg_mute';
  private vol: number;
  private muted: boolean;
  private readonly listeners = new Set<() => void>();

  constructor(private readonly store: KeyValueStore) {
    this.vol = VolumeControl.clamp(parseFloat(store.get(VolumeControl.K_VOL) ?? '0.7'));
    this.muted = store.get(VolumeControl.K_MUTE) === '1';
  }

  static clamp(x: number): number {
    return Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0.7;
  }

  get volume(): number {
    return this.vol;
  }
  get isMuted(): boolean {
    return this.muted;
  }
  /** Effektiv förstärkning (0 när mutad). */
  get gain(): number {
    return this.muted ? 0 : this.vol;
  }
  get audible(): boolean {
    return !this.muted && this.vol > 0;
  }

  setVolume(v: number): void {
    this.vol = VolumeControl.clamp(v);
    this.store.set(VolumeControl.K_VOL, String(this.vol));
    if (this.vol > 0 && this.muted) this.setMuted(false);
    else this.changed();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    this.store.set(VolumeControl.K_MUTE, m ? '1' : '0');
    this.changed();
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  onChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private changed(): void {
    for (const fn of this.listeners) fn();
  }
}
