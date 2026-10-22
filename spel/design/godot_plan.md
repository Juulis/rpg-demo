# Plan: Runornas kall till Godot 4 med C#

**Utgångsläge (läst 2026-10-17):** Juulis/rpg-demo har 601 filer (cirka 66 MB, mest grafik och ljud) och cirka 95 TS-filer med ungefär 370 KB källkod. Modulerna är core (EventBus, Rng, GameAuthority, SaveBackend), logic (CombatRules, HeroModel, Inventory, loot), systems (Combat, Loot, MonsterAI, Portal, Spawn), save (migrering, roster, backends), world/map (zoner, dimma, minikarta), render (Iso, Camera, DirSprite), ui, menu, audio och text. Designdata ligger i /workspace/spel/design (cirka 20 json-filer, i18n/en, lore) och NPC-röster för 14 NPC:er i /workspace/spel/audio/npc (14 MB).

## 1. C# eller GDScript

**Rekommendation: C#.** Statisk typning ligger närmast nuvarande TS strict. Den DOM-fria logiken kan bli ett rent .NET-bibliotek (Game.Core) som testas med xUnit utan motor, och molnagenter skriver C# pålitligt. **Nackdelen:** Godot 4 med C# kan i dag inte exportera till webb. Det står i den officiella dokumentationen för 4.6 och senare. Godot 4.7 kom i juni 2026, och PR #119330 för C# på webb är fortfarande ett öppet utkast. GDScript kan exporteras till webb men saknar riktig typsäkerhet och ett fristående testbart kärnbibliotek. **Förslag:** behåll webbversionen i TS/PixiJS som demo tills C# på webb finns i en stabil release.

## 2. Återanvändning och omskrivning

**Återanvänds direkt:** all json-designdata (klasser, affix, set, drop_tabeller, monster, quests, dialoger, spawnzoner, städer), i18n, lore, NPC-röster och SFX samt befintliga sprites som platshållare.
**Porteras 1:1 till C#:** regler och algoritmer, alltså CombatRules, loot, Inventory, HeroModel, seedad Rng (samma algoritm så att gyllene tester ger samma utfall), den typade EventBusen (som C#-events eller generisk bus), sparformat och SaveMigrator.
**Skrivs om helt:** rendering (Pixi ersätts av TileMapLayer, Sprite2D och Camera2D), UI och menyer (Godot Control), input, ljudmotor (AudioStreamPlayer och bussar), dimma och minikarta (shader) samt sparbackend (user:// i stället för localStorage).

## 3. Faser (en molnagent i taget)

1. **Grund:** skapa Godot 4.7 .NET-projektet med solution Game.Core och Game.Tests samt GitHub Actions för bygge och test. _Milstolpe:_ CI grönt och en tom scen startar headless.
2. **Kärnlogik:** portera core, logic och loot till Game.Core och ladda json med samma scheman. _Milstolpe:_ xUnit-tester, och gyllene tester med samma seed ger samma loot som TS.
3. **Spar och system:** SaveBackend, migrering, Combat, Spawn, MonsterAI och Portal som ren logik. _Milstolpe:_ simulerad strid i tester och sparfiler som laddas om utan förlust.
4. **Isometrisk värld:** zon från ZoneFactory, hjälte, monster, kamera och klicka för att gå. _Milstolpe:_ man kan spela en zon med strid och loot.
5. **UI:** HUD, inventarie, tooltips, hjälteval, dialoger och i18n. _Milstolpe:_ funktionsparitet med webbversionen.
6. **Ljud:** bussar, SFX via EventBus och NPC-röster. _Milstolpe:_ allt ljud kopplat och volym sparas.
7. **Grafiklyft:** 2D-ljus (PointLight2D, normalmaps), GPUParticles2D, shaders för dimma och träffeffekter samt WorldEnvironment-glow. _Milstolpe:_ före- och efterbilder och stabil FPS på svag hårdvara.
8. **Release:** exportmallar för Windows, macOS och Linux, versionstaggar och release-workflow. _Milstolpe:_ v0.1.0 på GitHub Releases.
9. _(Senare)_ 3D-utforskning eller 2.5D som eget beslut.

## 4. CI i GitHub Actions

Vid push och PR körs `dotnet test` på Game.Tests, vilket är snabbt och kräver ingen motor. Därefter körs Godot .NET headless (`godot --headless --build-solutions --quit` och en scen-smoke-test med en GdUnit4-svit) i en container som barichello/godot-ci (mono) eller med chickensoft-games/setup-godot. Vid tagg `v*` byggs en matris med `--export-release` för Windows, Linux och macOS, och artefakterna zippas och laddas upp med softprops/action-gh-release. macOS behöver signering och notarisering (Apple Developer-konto) för att slippa Gatekeeper-varningar. Utan det bifogas instruktioner för högerklick och Öppna. Windows kan få SmartScreen-varning om programmet inte är kodsignerat.

## 5. Grafikkällor

**UI-genererat (GenerateImage):** snabbt för koncept, ikoner, porträtt och föremålsikoner. Isometriska animationsark blir dock ojämna, så det passar bäst för stillbilder. **Köpta paket:** isometriska Diablo-liknande paket på itch.io och Unity/Humble-buntar ger hög kvalitet och konsekvent stil. Kontrollera att licensen tillåter Godot och distribution. **CC0:** Kenney (isometriska tiles, partiklar, UI) och OpenGameArt, där varje tillgång måste vara märkt CC0. Spåra allt i en CREDITS- eller licensfil. En realistisk mix är köpta karaktärer och monster, CC0 för tiles, effekter och UI samt genererade ikoner och porträtt.

## 6. Risker

Ingen webbexport med C# (se ovan). Tidplanen beror på en extern PR. Exakt RNG-paritet mellan TS och C# (64-bitars heltal och flyttal) kan vara svår att uppnå. Stilen kan bli inkonsekvent när genererad, köpt och CC0-grafik blandas. Godot .NET i headless-CI kan vara trögt och kräver rätt version av exportmallar. Signering för macOS och Windows kostar pengar och tid. Scope creep i grafikfasen. Molnagenter kan inte se spelet själva, så visuell kvalitet kräver Juulis granskning eller skärmdumpar från CI. Två kodbaser (TS-demo och Godot) under en övergångsperiod.

## 7. Grov kostnad i molnagentkörningar

| Fas                | Körningar (uppskattning) |
| ------------------ | ------------------------ |
| 1 Grund och CI     | 1 till 2                 |
| 2 Kärnlogik        | 2 till 3                 |
| 3 Spar och system  | 2 till 4                 |
| 4 Isometrisk värld | 3 till 5                 |
| 5 UI               | 3 till 5                 |
| 6 Ljud             | 1                        |
| 7 Grafiklyft       | 3 till 6 (iterativt)     |
| 8 Release          | 1 till 2                 |
| **Totalt**         | **cirka 16 till 28**     |

Osäkerheten är stor, uppåt 50 procent åt båda håll. Antalet beror mest på hur mycket visuell iteration som behövs och på hur många körningar som slutar med rött CI. Priset per körning beror på Cursors aktuella prissättning och körningens längd, så det har jag inte räknat ut här.
