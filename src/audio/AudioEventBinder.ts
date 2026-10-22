import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import type { PlayOptions } from './AudioEngine';
import type { SoundName } from './SfxLibrary';

export interface SoundPlayer {
  play(name: SoundName, opts?: PlayOptions): void;
}

const RARE = new Set(['rare', 'set', 'legendary', 'unique']);

/** Kopplar typade bus-events till ljud. Ingen polling: bussen kommer från GameContext. */
export class AudioEventBinder {
  private lastStep = -Infinity;
  private lastHit = -Infinity;

  constructor(
    private readonly player: SoundPlayer,
    private readonly now: () => number = () => performance.now(),
  ) {}

  bind(bus: EventBus<GameEvents>): Array<() => void> {
    return [
      bus.on('hit', () => this.throttled('hit', 40)),
      bus.on('kill', (p) => this.player.play(p.boss ? 'boss' : 'kill')),
      bus.on('loot_drop', (p) =>
        this.player.play(RARE.has(p.quality) ? 'drop_rare' : 'drop', { rate: p.quality === 'legendary' ? 0.8 : 1 }),
      ),
      bus.on('pickup', (p) => this.player.play(p.first ? 'pickup_first' : 'pickup')),
      bus.on('gold', () => this.player.play('gold')),
      bus.on('rune', (p) => this.player.play('rune', { rate: 1 + 0.12 * Math.max(0, (p.n || 1) - 1), vary: 0 })),
      bus.on('portal_open', () => this.player.play('portal', { vary: 0 })),
      bus.on('zone_enter', () => this.player.play('zone')),
      bus.on('boss_start', () => this.player.play('boss')),
      bus.on('boss_phase', () => this.player.play('boss', { rate: 0.85 })),
      bus.on('step', () => this.throttled('step', 320, { vary: 0.1 })),
      bus.on('map_toggle', () => this.player.play('toggle')),
      bus.on('ui_open', () => this.player.play('click')),
      bus.on('level_up', () => this.player.play('rune', { rate: 1.25, vary: 0 })),
      bus.on('night_ambient', (p) => this.player.play('night', { rate: 0.7 + p.intensity * 0.2, vary: 0.15 })),
    ];
  }

  private throttled(name: 'hit' | 'step', ms: number, opts?: PlayOptions): void {
    const n = this.now();
    const key = name === 'hit' ? 'lastHit' : 'lastStep';
    if (n - this[key] <= ms) return;
    this[key] = n;
    this.player.play(name, opts);
  }
}
