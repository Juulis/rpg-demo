import './style.css';
import { Game } from './core/Game';
import type { GameModule } from './core/GameContext';
import { AudioModule, MapModule, MenuModule, SaveModule } from './index';
import { LocaleManager } from './i18n';

/**
 * Moduler registreras här. Varje modul får GameContext (bus, hero, zone, session, data) via init().
 * Utvecklare 2 lägger till: new AudioManager(), new SaveManager(), new MapUI(), new StartMenu(), new Lorebook().
 */
const i18n = new LocaleManager(); // först: övriga moduler får den via konstruktorn
const save = new SaveModule(i18n); // ersätter SaveManager (borttagen i #18)
const modules: GameModule[] = [i18n, save, new MenuModule(save, i18n), new AudioModule(i18n), new MapModule(i18n)]; // save före menu

const host = document.getElementById('app');
if (!host) throw new Error('#app saknas');
const game = new Game(modules);
await game.start(host);
document.getElementById('newGame')?.addEventListener('click', () => game.newGame());

// Debug-hook bara i dev-bygget (inga globaler i produktion).
if (import.meta.env.DEV) (window as unknown as { __game?: Game }).__game = game;
