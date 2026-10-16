# Arkitektur – Runornas kall (2D, TypeScript)

Huvudspåret är en isometrisk 2D-motor i **PixiJS v8**, byggd med **Vite + TypeScript (strict)**.
3D-spelet ligger i `legacy-3d/` och publiceras **på roten** (`/rpg-demo/`) tills 2D är spelbart. TS-versionen byggs till `/rpg-demo/next/` (Vite base, `dist/next`).
`scripts/assemble-pages.mjs` lägger 3D-filerna på roten av `dist/`; `scripts/smoke.mjs` (Playwright) kräver i CI och Pages att roten är spelbar och att `next/` laddar.

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

### Laddning och sparning

Moduler skriver aldrig till `ctx.hero`. `Game.loadHero(save: HeroSave)` laddar hjälte + session (seed, killed, zon, position, runor, stad)
och emit:ar `hero_loaded`; `Game.getSnapshot(): HeroSave` ger en sparbar ögonblicksbild. Bylayouten fås typad via `villageLayout(ctx.data)`.

## Koordinatsystem

- **Världsenheter** = enheten i speldata (`spawnzoner.json`, `portal_by.json`, 3D-versionens meter). `hero.pos`, `zone.runes/portals/colliders`,
  `circle`, `rect`, `width/height` anges alla i världsenheter.
- **Axlar:** `x` österut, `y` söderut (3D-versionens `z`). **Origo** = zonens mitt (skogen: cirkel r = 45; byn: rektangel −31…31).
- **Riktning** `facing` i radianer; framåt = `(sin facing, cos facing)` i `(x, y)`.
- **Rutor:** en iso-ruta = **2 världsenheter** (`TILE_WORLD`, samma som byns `tile_size`; byn är 32 × 32 rutor). En ruta ritas som 128 × 64 px (2:1).
- **Skärm:** `Iso.worldToScreen(x, y)` → `sx = (x − y) / 2 · 64`, `sy = (x + y) / 2 · 32` px relativt världens origo (före kamerans zoom).
  +x går snett ned åt höger, +y snett ned åt vänster på skärmen. Djupsortering på `x + y`.

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
legacy-3d/            3D-spelet (kopieras oförändrat till roten av dist/)
scripts/              assemble-pages.mjs (Pages-artefakt), smoke.mjs (röktest i headless Chromium)
.github/workflows/    pages.yml (3D på roten alltid; next/ bara om typecheck/lint/build går igenom; röktest före deploy), ci.yml (PR-kontroller + röktest)
```

## Flöde

`Game` skapar `Renderer` och systemen och initierar modulerna. Startmenyn (U2) väljer hjälte och session (seed + killed).
`SpawnSystem.roll(area, session)` ger deterministiska `SpawnSpec` med id `${area}:${spawnpunkt}:${monster}` (boss `${area}:boss`).
Gameplay emit:ar events (`kill`, `loot_drop`, `pickup` …) som ljud, sparning, karta och lorebok lyssnar på.

## Kommandon

`npm run dev` · `npm run build` (→ dist/next) · `npm run pages` (+ 3D på roten) · `npm run smoke` · `npm run typecheck` · `npm run lint` · `npm run format`
