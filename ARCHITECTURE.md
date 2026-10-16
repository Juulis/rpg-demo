# Arkitektur – Runornas kall (2D, TypeScript)

Huvudspåret är en isometrisk 2D-motor i **PixiJS v8**, byggd med **Vite + TypeScript (strict)**.
Den gamla 3D-versionen ligger orörd som spelbart arkiv i `legacy-3d/` (Three via CDN) och publiceras på `/rpg-demo/legacy-3d/`.

## Regler

- **Modulärt och objektorienterat:** en klass per ansvar. Systemen känner inte till DOM eller Pixi om de inte måste (logik testbar utan renderare).
- **Inga globala variabler.** Allt nås via `Game`. Kommunikation mellan system sker via den **typade `EventBus<GameEvents>`** (`src/core/events.ts`), inte `window.__rpg`. Enda undantaget är en debug-hook (`window.__game`) i dev-bygget.
- **Speldata är typad JSON** i `src/data/` (kopierad från Speldesigns `/spel/design/`) med interfaces i `src/data/types.ts`. Saknade id ger fel, inga tysta fallbacks (t.ex. bossens skada kommer bara från `monsterfamiljer.json`).
- **En sanning per tillstånd:** dödade monster finns bara i `Session.killed` (även bossar).
- **Sparformatet** är bakåtkompatibelt med legacy `js/save.js` (`rpg_heroes`, `rpg_hero_<id>`, `rpg_save`, `rpg_found`). `SaveManager.migrate()` uppgraderar äldre versioner.
- Svenska UI-texter. Tangenter: Tab (karta), H (lorebok), M (ljud av/på), B/I (inventory), Alt (visa föremål).

## Mappar

```
index.html            Vite-ingång
src/
  main.ts             startar Game (+ debug-hook i dev)
  core/               Game, EventBus, events (typer), Rng, Session
  data/               *.json + types.ts + index.ts (typad åtkomst, validering)
  render/             Renderer (Pixi-lager), Iso (projektion), Camera, Parallax
  systems/            SpawnSystem, LootSystem, CombatSystem, ...
  entities/           Entity, Hero, Monster, Drop
  input/              Input (Diablo-klick, WASD, tangenter)
  ui/                 Hud, Tooltip, MonsterBar, InventoryUI, MapUI, LorebookUI, StartMenu
  audio/              AudioManager (portad från legacy js/audio.js)
  save/               SaveManager
  assets/             inbäddade bilder (base64-moduler, genererade)
legacy-3d/            arkiverad 3D-version (kopieras oförändrad till dist/legacy-3d)
.github/workflows/    pages.yml (npm ci, typecheck, lint, build → Pages), ci.yml (PR-kontroller)
```

## Flöde

`Game` skapar `Renderer`, `Input`, `Camera` och systemen. En spelomgång (`Session`: seed + killed) väljs av startmenyn via `SaveManager`
(Fortsätt = sparfilens session, Nytt game = ny seed). `SpawnSystem.roll(area, session)` ger deterministiska `SpawnSpec` med id
`${area}:${spawnpunktIndex}:${monsterIndex}` (boss `${area}:boss`). Systemen emit:ar händelser (`kill`, `loot_drop`, `pickup`, ...) som
`AudioManager`, `SaveManager`, UI och lorebok lyssnar på.

## Kommandon

`npm run dev` · `npm run build` · `npm run typecheck` · `npm run lint` · `npm run format`
