import type { SaveBackend } from '../core/SaveBackend';

/** Volym och mute via SaveBackend-inställningar (nycklar vol / mute). */
export class VolumeControl {
  private vol = 0.7;
  private muted = false;
  private backend: SaveBackend | null = null;
  private readonly listeners = new Set<() => void>();

  static clamp(x: number): number {
    return Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0.7;
  }

  /** Läser sparade värden (anropas från AudioModule.init när SaveBackend finns). */
  async bind(backend: SaveBackend): Promise<void> {
    this.backend = backend;
    const v = await backend.getSetting('vol');
    const m = await backend.getSetting('mute');
    if (v !== null) this.vol = VolumeControl.clamp(parseFloat(v));
    if (m !== null) this.muted = m === '1';
    this.changed();
  }

  get volume(): number {
    return this.vol;
  }
  get isMuted(): boolean {
    return this.muted;
  }
  get gain(): number {
    return this.muted ? 0 : this.vol;
  }
  get audible(): boolean {
    return !this.muted && this.vol > 0;
  }

  setVolume(v: number): void {
    this.vol = VolumeControl.clamp(v);
    void this.backend?.setSetting('vol', String(this.vol));
    if (this.vol > 0 && this.muted) this.setMuted(false);
    else this.changed();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    void this.backend?.setSetting('mute', m ? '1' : '0');
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
