import type { EffectModule } from '../types';

function stockEntry(ws: { merchant_stock: Record<string, { add: string[]; remove: string[] }> }, npc: string) {
  if (!ws.merchant_stock[npc]) ws.merchant_stock[npc] = { add: [], remove: [] };
  return ws.merchant_stock[npc];
}

export const merchantStock: EffectModule = (eff, { ws }) => {
  if (typeof eff.npc !== 'string') return;
  const entry = stockEntry(ws, eff.npc);
  if (Array.isArray(eff.add)) {
    for (const line of eff.add) if (typeof line === 'string' && !entry.add.includes(line)) entry.add.push(line);
  }
  if (Array.isArray(eff.remove)) {
    for (const line of eff.remove) if (typeof line === 'string' && !entry.remove.includes(line)) entry.remove.push(line);
  }
  if (typeof eff.prisfaktor_mult === 'number') {
    ws.merchant_mods[eff.npc] = (ws.merchant_mods[eff.npc] ?? 0) + (eff.prisfaktor_mult - 1);
  }
};
