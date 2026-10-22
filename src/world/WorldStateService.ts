import { cloneWorldState, createEmptyWorldState, type WorldState } from './worldStateTypes';
import { canonicalBossId } from './bossIds';

/** Muterbar per-hjälte världstillstånd (DOM-fri). */
export class WorldStateService {
  private state: WorldState = createEmptyWorldState();
  private gameDay = 0;

  get(): Readonly<WorldState> {
    return this.state;
  }

  replace(next: WorldState): void {
    this.state = cloneWorldState(next);
  }

  resetForNewRun(): void {
    this.state = createEmptyWorldState();
    this.gameDay = 0;
  }

  setGameDay(day: number): void {
    if (Number.isFinite(day) && day >= 0) this.gameDay = Math.floor(day);
  }

  lastRumorForNpc(npcId: string): string | undefined {
    return this.state.rumors_last[npcId];
  }

  recordRumorSpoken(npcId: string, rumorId: string): void {
    this.state.rumors_last[npcId] = rumorId;
  }

  recordBossKilled(monsterId: string): void {
    const id = canonicalBossId(monsterId) ?? monsterId;
    if (!this.state.bosses_killed.includes(id)) this.state.bosses_killed.push(id);
    this.pushEvent(`boss_killed:${id}`);
  }

  recordLegendaryFound(itemId: string): void {
    if (!this.state.legendaries_found.includes(itemId)) this.state.legendaries_found.push(itemId);
    this.pushEvent(`legendary_found:${itemId}`, this.gameDay);
  }

  setCityState(city: string, state: string): void {
    this.state.city_states[city] = state;
    this.pushEvent(`city_state:${city}:${state}`);
  }

  setRunesActive(count: number): void {
    this.state.runes_active = count;
    this.pushEvent(`runes:${count}`);
  }

  private pushEvent(id: string, day?: number): void {
    const d = day ?? this.gameDay;
    this.state.last_events.push({ id, at: Date.now(), day: d });
    if (this.state.last_events.length > 64) this.state.last_events.splice(0, this.state.last_events.length - 64);
  }

  snapshot(): WorldState {
    return cloneWorldState(this.state);
  }
}
