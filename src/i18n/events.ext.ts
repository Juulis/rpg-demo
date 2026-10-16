/**
 * TILLFÄLLIG UTÖKNING av GameEvents med `locale_changed` tills Utvecklare lägger till det i core/events.ts (#18).
 * Ta bort filen och använd ctx.bus direkt när eventet finns där.
 */
import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import type { Locale } from './types';

export type I18nEvents = GameEvents & { locale_changed: { locale: Locale } };

/** Samma bussinstans, typad med locale_changed. */
export const i18nBus = (bus: EventBus<GameEvents>): EventBus<I18nEvents> => bus as unknown as EventBus<I18nEvents>;
