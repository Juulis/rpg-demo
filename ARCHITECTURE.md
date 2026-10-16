# Arkitektur – Runornas kall (2D, TypeScript)

Huvudspåret är en isometrisk 2D-motor i **PixiJS v8**, byggd med **Vite + TypeScript (strict)**.
Den gamla 3D-versionen ligger som spelbart arkiv i `legacy-3d/` och publiceras på `/rpg-demo/legacy-3d/`.

## Regler (permanenta)

- **Inga tvingande spärrar.** Fri rörelse mellan alla områden; inga krav på rensade zoner, dödade fiender eller hjältenivå.
  Svårigheten styrs enbart av monsternivå. Portalen öppnas bara av att alla runor är aktiva. `recommended_level` i data är ren information (tooltip).
- **Modulärt och objektorienterat:** en klass per ansvar. Logik känner inte till DOM/Pixi om den inte måste.
- **Inga globaler.** Allt nås via `Game` / `GameContext`. Kommunikation via den typade `EventBus<GameEvents>`
  (`src/core/EventBus.ts`, `src/core/events.ts`) – inte `window.__rpg`. Undantag: debug-hook `window.__game` i dev.
- **En namnform per event** (inga alias som `death`/`rune_activate`). Nya events läggs till i `GameEvents`.
- **Typad speldata** i `src/data/` (kopia av Speldesigns `/spel/design/`), interface i `src/data/types.ts`, åtkomst via `ctx.data`.
  Saknade id ger fel, inga tysta fallbacks (bossens skada kommer bara från data).
- **En sanning per tillstånd:** dödade monster (även bossar) finns bara i `session.killed`.
- **Sparformatet** är bakåtkompatibelt med legacy `js/save.js` (`rpg_heroes`, `rpg_hero_<id>`, `rpg_save`, `rpg_found`).
- **Assets** som vanliga filer i `public/assets/` (inget base64).
- Svenska UI-texter. Tangenter: Tab karta, H lorebok, M ljud, B/I inventory, Alt visa föremål, Z etiketter på/av.

## Moduler och GameContext

```ts
interface GameContext {
  bus: EventBus<GameEvents>;
  hero: Readonly<HeroState>;
  zone: Readonly<ZoneView>;
  session: Session;
  data: GameData;
}
interface GameModule {
  init(ctx: GameContext): void;
  dispose(): void;
}
```

En modul skapas i `src/main.ts` och läggs i `modules`; `Game` anropar `init(ctx)` efter att renderaren startat och `dispose()` vid nedstängning.
Moduler läser tillstånd via `ctx` och kommunicerar enbart via `ctx.bus` (emit/on; `on` returnerar en avregistreringsfunktion att anropa i `dispose`).

## Mappar och ägare

```
index.html            Vite-ingång
public/assets/        grafik/ljud som filer
src/
  main.ts             skapar Game, registrerar moduler (+ debug-hook i dev)
  core/               Game, EventBus, events (GameEvents), GameContext, Rng, Session          – U1
  data/               *.json + types.ts + index.ts                                              – U1 (data: Speldesign)
  render/             Renderer, Iso, Camera, Parallax                                           – U1
  systems/            SpawnSystem, LootSystem, CombatSystem, PortalSystem                       – U1
  entities/           Entity, Hero, Monster, Drop                                               – U1
  input/              Input (Diablo-klick, Alt/Z, tangenter)                                    – U1
  ui/                 Hud, Tooltip, MonsterBar, InventoryUI                                     – U1
  audio/              AudioManager (port av legacy js/audio.js)                                 – U2 (tom plats)
  save/               SaveManager + hjälteplatser                                               – U2 (tom plats)
  map/                MapUI (Tab)                                                               – U2 (tom plats)
  menu/               StartMenu / hjälteval                                                     – U2 (tom plats)
  lore/               Lorebook (H)                                                              – U2 (tom plats)
legacy-3d/            arkiverad 3D-version (kopieras till dist/legacy-3d)
.github/workflows/    pages.yml (npm ci, typecheck, lint, build → Pages), ci.yml (PR-kontroller)
```

## Flöde

`Game` skapar `Renderer` och systemen och initierar modulerna. Startmenyn (U2) väljer hjälte och session (seed + killed).
`SpawnSystem.roll(area, session)` ger deterministiska `SpawnSpec` med id `${area}:${spawnpunkt}:${monster}` (boss `${area}:boss`).
Gameplay emit:ar events (`kill`, `loot_drop`, `pickup` …) som ljud, sparning, karta och lorebok lyssnar på.

## Kommandon

`npm run dev` · `npm run build` · `npm run typecheck` · `npm run lint` · `npm run format`
