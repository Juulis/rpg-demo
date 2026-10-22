import { consequenceTypeRank } from './buildOrder';
import { EFFECT_MODULES } from './effects';
import { consequenceNotifyText } from './notifyText';
import type { ConsequenceRuntime, EffectContext } from './types';
import type { WorldStateService } from '../world/WorldStateService';

function makeNotifyKey(runtime: ConsequenceRuntime): (key: string, params?: Record<string, string | number>) => void {
  return (key, params = {}) => {
    const msg = consequenceNotifyText(key, params);
    runtime.notify?.(msg);
  };
}

function applyOne(eff: Record<string, unknown>, ctx: EffectContext): void {
  const typ = String(eff.typ ?? '');
  const mod = EFFECT_MODULES[typ];
  if (mod) mod(eff, ctx);
}

/** Kör designer `consequences` mot world_state (#43). */
export function applyConsequences(
  world: WorldStateService,
  effects: Record<string, unknown>[],
  gameDay: number,
  runtime: ConsequenceRuntime = {},
): void {
  const ws = world.snapshot();
  const notifyKey = makeNotifyKey(runtime);
  const sorted = [...effects].sort((a, b) => consequenceTypeRank(String(a.typ ?? '')) - consequenceTypeRank(String(b.typ ?? '')));
  const ctx: EffectContext = { world, ws, gameDay, runtime, notifyKey };
  for (const eff of sorted) applyOne(eff, ctx);
  world.replace(ws);
  world.tickPending(gameDay, runtime);
}

export function applyPendingEffect(
  world: WorldStateService,
  effect: Record<string, unknown>,
  gameDay: number,
  runtime: ConsequenceRuntime,
): void {
  const ws = world.snapshot();
  const notifyKey = makeNotifyKey(runtime);
  applyOne(effect, { world, ws, gameDay, runtime, notifyKey, fromPending: true });
  world.replace(ws);
}
