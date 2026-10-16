import type { AudioEngine } from './AudioEngine';
import type { VoiceResolver } from '../i18n/VoiceResolver';

/** Spelar NPC-röstfiler via VoiceResolver; tyst om ingen fil finns eller ljud inte är upplåst. */
export class NpcVoicePlayer {
  constructor(
    private readonly engine: AudioEngine,
    private readonly voices: VoiceResolver,
  ) {}

  async play(npc: string, lineId: string): Promise<void> {
    const url = await this.voices.resolve(npc, lineId);
    if (!url) return;
    this.engine.playUrl(url);
  }
}
