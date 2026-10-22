import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';

/** 24 speltimmar på 48 minuter realtid. */
export const SECONDS_PER_DAY = 48 * 60;
export const SECONDS_PER_HOUR = SECONDS_PER_DAY / 24;

/** Första morgon vid ny hjälte (06:00). */
export const DEFAULT_CLOCK_TIME = 6 * SECONDS_PER_HOUR;

export interface GameClockSnapshot {
  /** Total förfluten speltid i sekunder. */
  time: number;
  /** Speldygn (0-baserat). */
  day: number;
  isNight: boolean;
  hour: number;
  minute: number;
}

export function gameDay(time: number): number {
  return Math.floor(Math.max(0, time) / SECONDS_PER_DAY);
}

export function timeOfDaySeconds(time: number): number {
  const t = Math.max(0, time);
  return t % SECONDS_PER_DAY;
}

export function clockHourMinute(time: number): { hour: number; minute: number } {
  const totalMin = Math.floor((timeOfDaySeconds(time) / SECONDS_PER_DAY) * 24 * 60);
  return { hour: Math.floor(totalMin / 60) % 24, minute: totalMin % 60 };
}

export function formatClockTime(time: number): string {
  const { hour, minute } = clockHourMinute(time);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Dag 06:00–20:00, natt 20:00–06:00. */
export function isDaytime(time: number): boolean {
  const { hour, minute } = clockHourMinute(time);
  const m = hour * 60 + minute;
  return m >= 6 * 60 && m < 20 * 60;
}

/** 0 = full dag, 1 = full natt (mjuk övergång vid gryning/skymning). */
export function nightBlend(time: number): number {
  const { hour, minute } = clockHourMinute(time);
  const m = hour * 60 + minute;
  const dawnStart = 5 * 60;
  const dawnEnd = 6 * 60;
  const duskStart = 20 * 60;
  const duskEnd = 21 * 60;
  if (m >= dawnEnd && m < duskStart) return 0;
  if (m < dawnStart || m >= duskEnd) return 1;
  if (m < dawnEnd) return 1 - (m - dawnStart) / (dawnEnd - dawnStart);
  return (m - duskStart) / (duskEnd - duskStart);
}

export function snapshotAt(time: number): GameClockSnapshot {
  const { hour, minute } = clockHourMinute(time);
  return {
    time,
    day: gameDay(time),
    isNight: !isDaytime(time),
    hour,
    minute,
  };
}

/** Tickande spelklocka per hjälte (sparas i game.worldTime). */
export class GameClock {
  private time = DEFAULT_CLOCK_TIME;
  private lastDay = gameDay(this.time);
  readonly view: GameClockSnapshot = snapshotAt(this.time);

  constructor(private readonly bus?: EventBus<GameEvents>) {}

  get day(): number {
    return this.view.day;
  }

  get timeSeconds(): number {
    return this.time;
  }

  load(time: number | undefined): void {
    this.time = typeof time === 'number' && Number.isFinite(time) && time >= 0 ? time : DEFAULT_CLOCK_TIME;
    this.lastDay = gameDay(this.time);
    this.refreshView();
  }

  resetForNewHero(): void {
    this.load(DEFAULT_CLOCK_TIME);
  }

  advance(dt: number): void {
    if (dt <= 0) return;
    this.time += dt;
    const d = gameDay(this.time);
    if (d !== this.lastDay) {
      this.lastDay = d;
      this.bus?.emit('day_changed', { day: d });
    }
    this.refreshView();
  }

  private refreshView(): void {
    Object.assign(this.view, snapshotAt(this.time));
  }
}
