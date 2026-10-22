import type { EffectModule } from '../types';

export const itemGrant: EffectModule = (eff, { ws, runtime, notifyKey }) => {
  if (typeof eff.item !== 'string') return;
  const granted = runtime.grantItem?.(eff.item);
  if (granted) {
    notifyKey('consequence.item', { item: eff.item });
    ws.flags[`item_grant_pending:${eff.item}`] = false;
  } else {
    ws.flags[`item_grant_pending:${eff.item}`] = true;
    notifyKey('consequence.item_bag_full', { item: eff.item });
  }
};
