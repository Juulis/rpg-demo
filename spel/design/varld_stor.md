# Runornas kall: Den stora världen

Del B av GitHub Juulis/rpg-demo #85. En sammanhängande värld i chunkar ersätter portaler till nya ställen. Data finns i [varld_stor.json](varld_stor.json). Akter, städer, spawnzoner, monster och quests ligger kvar i sina filer och refereras med id.

## Regler (permanenta)

- Inga rörelsespärrar: inga krav på att döda alla, rensa eller ha nivå. Alla vägar är alltid öppna.
- Svårigheten styrs bara av monsternivå. Avståndet väljer undertyper, stats är fasta per undertyp.
- D2 spawn: varje chunk och region rullas en gång per game, ingen respawn.
- Inga ädelstenar, hylsor eller system som ändrar föremål.
- Quests är aldrig döda X eller samla X.
- Ingen monstermix mellan familjer förrän 2D grafiken är klar: en region spawnar bara sin huvudfamilj.
- Instanser (grottor, banor, bossplatser, händelser) nås med teleport från en ingång i öppna världen. Teleporten är alltid öppen.

## Översiktskarta

Norr uppåt. En ruta är ungefär en chunk (64 rutor). Siffran är ringzon. `=` väg, `:` stig, ebbstig eller schakt.

```
                 [jarnklostret 4]:[KOPPARBERG 4]:[gruvdjupen 4]        FJÄLL
                                       =
                                 [bergsvagen 4]
                                       =
                                 [fjallfoten 3]
                                       =
 [korpholmarna 3]                [GAMLA BYN 2]:[krypta 2]
        :                              =
        :                        [gravasen 2]
        :                         :         =
 [DIMMERSTRAND 3]=[dimvagen 3]=[myrkanten 2]=[kolarmon 1]=[LÄGRET 0]=[startskogen 0]=[vargstigen 1]=[VARGABY 1]:[ide 1]
        :              TRÄSK                  SKOG       =
 [sjunkna_kyrkan 3]                                [sodra_mon 1]
   KUST                                                  =
                                                 [brandkanten 2]   ASK
                                                         =
                                                  [rokkarret 3]   TRÄSK
                                                         =
                                                 [glodstranden 4] ASK
                                                         =
 [sista_ljuset 6]=====[brandkusten 5]=============[askfalten 5]   ASK
  KUST
        =                                                =
 [ruttmarken 6] TRÄSK (rutt)                    [ASKEBORG 5]:[katakomber 5]
        :                                                :
 [smittans_katedral 6]:[sprickans_botten 6]       [katedralen 5]
```

Ide, krypta, sjunkna kyrkan, klostret, gruvdjupen, katakomberna, katedralen, Smittans katedral och Sprickans botten är instanser som nås med teleport (se Åtkomst). Norra vägen går från startskogen till Gravåsen. Kolarstigen binder ihop Kolarmon och Gravåsen.

## Svårighet och zonmodell

Avstånd mäts i chunkar (euklidiskt) från Lägret vid skogsbrynet. Ringen ger nivåbandet. Undertyper vars fasta nivå ligger i bandet får spawna.

| Ring | Avstånd    | Nivå       | Akt               |
| ---- | ---------- | ---------- | ----------------- |
| 0    | 0 till 2   | 1 till 3   | 1                 |
| 1    | 2 till 4   | 3 till 6   | 1 (Vargaby)       |
| 2    | 4 till 6   | 7 till 10  | 1 (Den gamla byn) |
| 3    | 6 till 8   | 10 till 15 | 2 (Dimmerstrand)  |
| 4    | 8 till 10  | 14 till 19 | 3 (Kopparberg)    |
| 5    | 10 till 12 | 19 till 25 | 4 (Askeborg)      |
| 6    | 12 till 15 | 24 till 30 | 5                 |
| 7+   | 15 och ut  | 28 till 30 | ytterkant         |

Akterna blir riktningar: öster och norr (akt 1), väster (akt 2), norr i fjällen (akt 3), söder längs askvägen (akt 4), sydväst på kusten (akt 5). Man kan gå vart man vill. Längre bort betyder bara starkare undertyper.

## Biomer

Varje biom har egna monsterplatser i `biomer.<id>.egna_monster`: roll, familj, nivåband och `undertyper_nu`. Där `platshallare: true` står används befintliga undertyper tills UI gör den nya undertypen som anges i `ersatts_av`. Regionerna pekar på sina platser med `monsterplatser`.

**Skog** (1 till 10). Tät granskog i dimma, runstenar, kolarkojor.

- Egna monster: vargar och björnar (bestar 1 till 6), förvridna kolare (3 till 5), gravfolk (odöda 7 till 10). Inga platshållare.
- Resurser: timmer, guld i övergivna hus.
- Mål: spåret vid kolarkojorna (spår), Kolmilan (budbärare), Ulvhilds päls i Vargaby (val mellan två), den brunna gården (återlämning).

**Träsk** (7 till 30). Myr, spångar, lyktor och klockor under ytan. Variant rutt i Ruttmarken.

- Egna monster: myrlik och myrhund (7 till 9, grafik klar), dimgastar (10 till 14), ruttfolk (24 till 28), sprickans väsen (29 till 30, platshållare kottklump).
- Resurser: sjunket timmer, guld i sjunkna gårdar.
- Mål: den sjunkna gården (mysterium), Hedkapellet (spår), Rökkärrets tingshus (återlämning), den andande lunden (mysterium).

**Fjäll** (11 till 19). Kal sluttning, vind, gruvhål och tysta kloster.

- Egna monster: fjällvättar (11 till 13, grafik klar), bergsulvar (14 till 15, grafik klar), gruvkryp (15 till 19), järnbröder (16 till 17, platshållare forvriden_gruvarbetare).
- Resurser: sten, järn.
- Mål: Fäbodlägret (eskort), vaktstugan (spår), lampan i schaktet (mysterium).

**Kust** (12 till 15, Sista ljuset 24). Klippor, ebb, korpar, vrak och fyrar.

- Egna monster: korpfolk (12 till 13, platshållare gastar), klockans drunknade (14 till 15, platshållare drunknad).
- Resurser: sten, drivved, guld i vrak.
- Mål: korpspåret till Korpvården (spår), Den sjunkna kyrkan (mysterium), fyren i Sista ljuset.

**Ask** (8 till 25). Förbränd slätt och brinnande stad vid havet, aska som snö, kulttecken i blod.

- Regioner: Brandkanten, Glödstranden, Askfälten, Askeborg, Kultens katakomber, Den brinnande katedralen, Brandkusten.
- Egna monster: kolnade skelett (8 till 10, platshållare skelett), glödbaggar (15 till 18, platshållare kryp), askdemoner (19 till 25), askans präster (22 till 24, platshållare askkultist), katedralväktare (24 till 25, platshållare hornslaktare och askriddare).
- Resurser: sten, järn från smälta statyer, guld i brända hus.
- Tiles: aska, sotig jord, glödspricka, lavasten, bränd väg. Dekor: svarta stammar, smälta statyer, kulttecken, pilgrimsstavar, rökpelare.
- Mål: vraket på Glödstranden (mysterium), Saltbrännarnas läger (eskort), Askeborgs port (återlämning), flyktinglägret i Brandkanten (val mellan två).

**Övergångar** (`overgangar` per biom): skog och träsk (mossa blir myr), skog och fjäll (vindtall och ljung), skog och ask (svarta stammar, sotig mossa), träsk och kust (vass blir tång), träsk och ask (rykande gölar), kust och ask (sand blir aska, vraken pyr).

## Städer och akter

- **Vargaby** (akt 1, ring 1, skog): Östra vägen från lägret via Vargstigen. Ulvhilds ide ligger på en stig bakom byn.
- **Den gamla byn** (akt 1, ring 2, skog): Norra vägen via Gravåsen, alltid öppen. Kyrkogården med Benkungen nås med teleport (`gamla_byn_kyrkogard`). Röda portalen i startskogen är en waypoint utan runkrav.
- **Dimmerstrand** (akt 2, ring 3, träsk mot kust): Västra vägen via Kolarmon, Myrkanten och Dimvägen. Ebbstigar till Korpholmarna, spång till Den sjunkna kyrkan.
- **Kopparberg** (akt 3, ring 4, fjäll): Norra vägen fortsätter förbi Den gamla byn upp genom Fjällfoten och Bergsvägen.
- **Askeborg** (akt 4, ring 5, ask): Askvägen söderut genom Södra mon, Brandkanten, Rökkärret och Glödstranden.
- **Sista ljuset** (akt 5, ring 6, kust): Kustvägen västerut från Askfälten, sedan Ruttstigen in i Ruttmarken.

## Byar, POI:er och vägar

POI typer: by, läger, ruin, grotta, kyrka, fyr, gruva, runsten, portal (waypoint) och teleport. Mallarna i `poi_mallar` anger NPC roller, tjänster, spawn och questkrokar.

- Säkra platser: Lägret, Viskarens eld, Kolmilan, Brandkantens flyktingläger, Fäbodlägret, Rasks gömställe, Saltbrännarnas läger, Sista ljuset med fyren.
- Banor (grotta, kyrka, gruva): Ulvhilds ide, Kryptans port, Den sjunkna kyrkan, Järnklostret, Gruvlaven och schaktet, Katakomberna, Katedralen, Smittans port, Den fjärde stenen.
- Vägar (`vagar`): Östra, Norra, Västra, Askvägen och Kustvägen är huvudleder. Stigar, ebbstigar, schakt och trappor leder till banor. Alla har `oppen: alltid`.

Questmallar i `quest_mallar`: spår, budbärare, mysterium, val mellan två NPC:er, eskort och återlämning. De byggs av triggertyperna i quests.json. Eskort kan aldrig misslyckas så att något spärras: faller NPC:n blir det ett nytt steg.

## Åtkomst

- `atkomst: oppen`: vanlig chunk i öppna världen.
- `atkomst: teleport`: instans med ingång i öppna världen (`ingang_poi` på regionen). Gäller grottor, banor, bossplatser och händelser. Teleporten kräver inget och är alltid öppen. Instansen rullas en gång per game.
- Waypoints (`meta.waypoints`): snabbresa utan krav. Röda portalen är en.
- Bosslåset i portal_by.json (arenan låses under striden, återställs om spelaren dör) är kvar och godkänt av Juulis.

## Beslutat

- Askfälten är ett eget biom, ask.
- Röda portalen är en waypoint, inget runkrav.
- Varje biom har egna monster, befintliga undertyper är markerade platshållare.
- Instanser nås med teleport som alltid är öppen. Bosslåset är godkänt.

## Lägga till en ny region

1. Välj en chunk i mellanmarken. Ringen följer av avståndet, så nivåbandet är redan givet.
2. Lägg en post i `regioner` med id, biom, chunk, radie, huvudfamilj och undertyper vars fasta nivå ligger i ringens band.
3. Koppla den med en ny post i `vagar` eller förläng en väg, och lägg grannar åt båda hållen.
4. Lägg POI:er av en befintlig typ i `pois` och välj questkrokar ur `quest_mallar`. Instanser får `atkomst: teleport` och en ingång.
5. Lägg till en monsterplats i biomet, med platshållare om undertypen inte finns än. Den nya undertypen läggs sedan i monsterfamiljer.json med fasta stats (räknas med monster_niva.json). Inget annat ändras.

Andra regioner påverkas inte: chunkar utanför alla radier är mellanmark, och en ny region tar bara sina egna chunkar.
Exempel: Vrakkusten på chunk (-8,-5), ring 4, kust, som binder ihop Den sjunkna kyrkan med Brandkusten.

## Generatorregler och stor bana 1

Regler som generatorn behöver finns i [varldsgenerator.json](varldsgenerator.json): vilken region en chunk tillhör vid överlapp, övergångsband mellan biom, monsterpool med fallback, täthet, placering av läger, ruiner, grottor och andra platser (min avstånd, antal per biom, relativt start och vägar), malniva(d) som funktion av avstånd, ambient och musik per biom samt questankare.
Ring 0 och 1 är delade i 10 delområden i [bana1_stor.json](bana1_stor.json). Liv i världen: [npc_grupper.json](npc_grupper.json), [varldshandelser.json](varldshandelser.json) och [vandrare.json](vandrare.json).
