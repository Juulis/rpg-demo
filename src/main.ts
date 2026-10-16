import './style.css';
import { Game } from './core/Game';
import type { GameModule } from './core/GameContext';

/**
 * Moduler registreras här. Varje modul får GameContext (bus, hero, zone, session, data) via init().
 * Utvecklare 2 lägger till: new AudioManager(), new SaveManager(), new MapUI(), new StartMenu(), new Lorebook().
 */
const modules: GameModule[] = [];

const host = document.getElementById('app');
if (!host) throw new Error('#app saknas');
const game = new Game(modules);
await game.start(host);
document.getElementById('newGame')?.addEventListener('click', () => game.newGame());

// Debug-hook bara i dev-bygget (inga globaler i produktion).
if (import.meta.env.DEV) (window as unknown as { __game?: Game }).__game = game;
