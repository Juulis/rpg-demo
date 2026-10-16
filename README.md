# Runornas kall

Action-RPG i Diablo 2-stil.

- **Spela (3D, roten):** https://juulis.github.io/rpg-demo/ – byggs från `legacy-3d/`.
- **2D/TypeScript (under uppbyggnad):** https://juulis.github.io/rpg-demo/next/ – PixiJS 8 + Vite, källkod i `src/`. Ersätter roten först när 2D är komplett.

Utveckling: `npm ci && npm run dev` (öppna `/rpg-demo/next/`). Kontroller: `npm run typecheck`, `npm run lint`, `npm run pages && npm run smoke`.

Struktur, ägarskap (U1 motor/logik, U2 ljud/sparning/meny/karta/i18n), EventBus/GameContext/GameAuthority/SaveBackend/Rng, koordinatsystem, CI och öppna punkter: se [ARCHITECTURE.md](ARCHITECTURE.md).
