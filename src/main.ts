import './style.css';
import { Game } from './core/Game';

const host = document.getElementById('app');
if (!host) throw new Error('#app saknas');
const game = new Game();
await game.start(host);
document.getElementById('newGame')?.addEventListener('click', () => game.newGame());

// Debug-hook bara i dev-bygget (inga globaler i produktion).
if (import.meta.env.DEV) (window as unknown as { __game?: Game }).__game = game;
