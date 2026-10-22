import { DEV_CHEATS_MENU_ENABLED } from './config';

export type DevCheatId = 'xp5' | 'mf100';

export interface DevCheatsState {
  xp5: boolean;
  mf100: boolean;
}

const STORAGE_KEY = 'rpg-dev-cheats';

let state: DevCheatsState = loadState();
const listeners = new Set<() => void>();

function loadState(): DevCheatsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { xp5: false, mf100: false };
    const p = JSON.parse(raw) as Partial<DevCheatsState>;
    return { xp5: !!p.xp5, mf100: !!p.mf100 };
  } catch {
    return { xp5: false, mf100: false };
  }
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private mode */
  }
}

function notify(): void {
  for (const fn of listeners) fn();
}

export function devCheatsEnabled(): boolean {
  return DEV_CHEATS_MENU_ENABLED;
}

export function getDevCheatsState(): Readonly<DevCheatsState> {
  return state;
}

export function setDevCheat(id: DevCheatId, on: boolean): void {
  if (!devCheatsEnabled()) return;
  const next = id === 'xp5' ? { ...state, xp5: on } : { ...state, mf100: on };
  if (next.xp5 === state.xp5 && next.mf100 === state.mf100) return;
  state = next;
  persist();
  notify();
}

export function subscribeDevCheats(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Multiplikator på all XP från monsterXp (1 eller 5). */
export function xpMultiplier(): number {
  if (!devCheatsEnabled() || !state.xp5) return 1;
  return 5;
}

/** Multiplikator på hjältens magic find vid loot-rullningar (1 eller 100). */
export function mfMultiplier(): number {
  if (!devCheatsEnabled() || !state.mf100) return 1;
  return 100;
}

export function effectiveMagicFind(heroMf: number): number {
  return heroMf * mfMultiplier();
}

export function isAnyDevCheatActive(): boolean {
  if (!devCheatsEnabled()) return false;
  return state.xp5 || state.mf100;
}

/** Endast för tester – återställer tillstånd utan att skriva localStorage. */
export function _resetDevCheatsForTest(s: DevCheatsState = { xp5: false, mf100: false }): void {
  state = { ...s };
  notify();
}
