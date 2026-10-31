# Runornas kall: Röda portalen och Den gamla byn

Version 2. Den gamla byn är den första staden att rensa och återbefolka. Alla fiender här hör till familjen Odöda (svaga mot kross, resistenta mot stick, se monsterfamiljer.json). Hjälten använder ingen magi; Runpräst och Benkungen använder mörk magi.

All data finns i portal_by.json. Värdena utgår från demon: spelaren har 100 HP, 100 uthållighet, slår 25 skada, går i fart 5,5. Skogsmonstret har 50 HP, gör 8 till 12 skada per sekund och jagar i fart 3,6 inom 10 enheter.

## 1. Portalen

När den tredje runan aktiveras visas inte längre vinstskärmen. Efter 2 s öppnas `rod_portal` i skogens mitt (0, 0), den fria cirkeln som ligger lika långt från alla tre runor. Spelaren går in inom radie 2 och hamnar på portalgläntan i byn (ruta 16,30). Returportalen bredvid leder alltid tillbaka.

## 2. Fiender

| id               | Namn            | Nivå | HP  | Skada | Försvar | Fart | XP  | Beteende                             |
| ---------------- | --------------- | ---- | --- | ----- | ------- | ---- | --- | ------------------------------------ |
| skelett_hund     | Benhund         | 7    | 48  | 9     | 2       | 5,0  | 67  | Flock om 2 till 4, cirklar           |
| skelett_krigare  | Skelettkrigare  | 7    | 97  | 15    | 4       | 3,4  | 111 | Närstrid med svärd                   |
| skelett_bagskytt | Skelettbågskytt | 8    | 71  | 13    | 2       | 3,0  | 170 | Håller avstånd, skjuter pilar        |
| skelett_runprast | Runpräst        | 8    | 89  | 21    | 3       | 2,8  | 238 | Återupplivar döda, eldboll, teleport |
| skelett_vakt     | Skelettväktare  | 9    | 234 | 27    | 9       | 2,4  | 364 | Tank med sköld, patrull              |
| skelett_kapten   | Skelettkapten   | 9    | 187 | 22    | 7       | 3,4  | 324 | Leder krigare, ger +15 % skada       |

Fasta stats, ingen slump eller skalning (källa monsterfamiljer.json).

Skada efter försvar: max(1, skada minus försvar).

### Boss: Benkungen Valdemar

En gång byns hövding, återuppväckt av demonernas runor.
(900 HP, försvar 5, 400 XP)

- Fas 1 (100 till 60 %): liehugg 32 skada i båge, benstorm med 8 spjut.
- Fas 2 (60 till 30 %): kallar 2 krigare och 1 bågskytt var 15:e s, gravslag 41 skada med röd markering (1,2 s varning).
- Fas 3 (under 30 %): enrage, snabbare, tre röda runcirklar som måste trampas i turordning. Försvar 0 i 3 s om gravslaget missar.

## 3. Loot

Byn följer lootsystemet i loot_design.md (kvaliteter Normal, Magisk, Sällsynt, Set, Legendarisk). Odöda droppar vapen, rustning, drycker, smycken och guld. Beväpnade skelett släpper sin vapentyp: Skelettkrigare svärd, Skelettbågskytt båge, Gravvakt klubba och sköld, Runpräst dolk. Benhunden är vapenlös och släpper drycker, smycken och guld. Benkungen ger 5 till 7 föremål, 2 stora hälsodrycker, 20 % chans var på Benkungens lie och Benkungens krona samt 15 % på en del av setet Gravvaktarens arv. Allt finns i drop_tabeller.json.

## 4. XP och nivåer

Byn har monsternivå 7 till 9 (byporten 7, torget 7 till 8, husen 8, kyrkogården 9) och Benkungen nivå 10. Alla stats är fasta per typ. Formel: XP till nästa nivå = round(100 × n^1,5). Maxnivå 30 (hela tabellen i monster_niva.json), nedan nivå 1 till 10. Stats per nivå beror på klass (klasser.json); kolumnerna HP och Skada nedan visar en generell referens nära Riddaren. Full HP och uthållighet vid nivåupp. Skogsmonster ger 10 XP.

| Nivå | XP till nästa | Totalt | HP  | Skada |
| ---- | ------------- | ------ | --- | ----- |
| 1    | 100           | 0      | 100 | 25    |
| 2    | 283           | 100    | 115 | 28    |
| 3    | 520           | 383    | 130 | 31    |
| 4    | 800           | 903    | 145 | 34    |
| 5    | 1118          | 1703   | 160 | 37    |
| 6    | 1470          | 2821   | 175 | 40    |
| 7    | 1852          | 4291   | 190 | 43    |
| 8    | 2263          | 6143   | 205 | 46    |
| 9    | 2700          | 8406   | 220 | 49    |
| 10   | 3162          | 11106  | 235 | 52    |

Spelaren väntas komma hit på nivå 7 efter Startskogen och Vargaby. XP per monster följer monster_niva.json (t.ex. Skelettkrigare nivå 7 ger 111 XP, Benkungen nivå 10 cirka 3795 XP).

## 5. Byn

Rutnät 32 × 32, ruta = 2 enheter. Söder till norr: portalglänta (säker), byport, torg, väster och öster hus, kyrkogård, Benkungens kapell (bossarena längst norrut). Fiender slumpas en gång per game (spawnzoner.json) och återkommer inte efter att de dödats; i ett nytt game slumpas nya, tills byn är rensad.

```
################################
#...........#######............#
#..........#B.KAPELL#...........#
#..........#...@....#...........#
#..........###...####...........#
#..+..+..+..G..G..G...+..+..+...#
#..............................#
#.HH...HH....t.t.t.t....HH..HH..#
#.HH.b.HH....TORGET.....HH.d.HH.#
#..r.........w..w..w.....w......#
#.HH...HH.....a...a.....HH..HH..#
#.HH.b.HH...............HH.dHH..#
#..........==BYPORT==...........#
#............d.w.w..............#
#...........~~~~~~~~~...........#
#...........~~~P/R~~~...........#
################################
```

@ boss, G gravvakt, w krigare, a/b bågskytt, r runpräst, d benhundar, ~ säker glänta, P/R portaler.

## 6. Återbefolkning

När Benkungen är död och alla zoner rensade blir byn Rensad: dimman lättar, portalen blir varmt orange, inga skelett genereras längre i något game. Därefter nivå 1 (handlare på torget), nivå 2 (vapenhandlare i västerhus, vakter vid byporten), nivå 3 (kuriosahandlare i kapellet, tavern i österhus, uppdraget Begrav Benkungen). Krav och belöningar finns i stader.json.

## Notis till Utvecklare

- I `activate()` i game.js: ersätt vinstskärmen vid `S.count >= 3` med `openPortal()` efter 2 s, behåll `S.playing = true`.
- Byn bör vara en egen scen eller zon som laddas vid portalen; återanvänd `monsters`, `updateCombat` och `hurt`, men gör dem datadrivna från `enemies` i JSON (hp, damage, speed, aggro_range, attack_cd).
- Byt `S.mana` mot `S.stamina`. Runaktivering kostar uthållighet.
- Skada multipliceras med familjens svaghet (1,5) eller resistens (0,6) enligt vapnets skadetyp.
- Spara stadstillstånd för gamla_byn och byt spawns och dekor efter tillstånd.
- `hurt(n)` ska dra av spelarens försvar, `attack()` ska använda `S.attack` i stället för fast 25.
- Nytt i `S`: class, level, xp, stamina, attack, defense, crit, gold, inventory, equipment.
- Behövs: projektilsystem (pilar, eldboll, benspjut), markeringar på marken för gravslag och runcirklar, enkel AI per typ samt fasmaskin för bossen.
- Uthållighet regenererar 8/s efter 1 s utan förbrukning.
- Den passiva HP regenen (2/s utanför strid) kan behållas.

## Notis till UI

Färger: portal #c0182a med glöd #ff3344, kvaliteter enligt loot_kvaliteter.json.

- Modeller eller sprites: 5 skelettyper, Benkungen (3 fasvarianter eller färgskift), röd portal och returportal, byhus, gravstenar, kapell, byport.
- Effekter: pil, röd eldboll, benspjut, röd markering för gravslag, röda runcirklar, återupplivningsglöd, nivåupp.
- Ikoner: hälsodrycker och uthållighetsdryck (grön), benflisa, guld, 5 vapen, 6 rustningar, ramar i 5 kvalitetsfärger.
- Byns tillstånd: dimma och röd portal (besatt), lättad dimma och orange portal (rensad), eldar, lagade hus, marknadsstånd, vapenbod med släckt härd, vakter, tavernskylt (nivå 1 till 3).
- HUD: XP mätare och nivåsiffra, guldräknare, bossens HP bar med namn och fasmarkeringar vid 60 % och 30 %, enkel inventarieruta, lootetikett på marken i kvalitetsfärg.
