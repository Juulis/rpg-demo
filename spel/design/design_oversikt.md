# Runornas kall: Designöversikt

> **Designregel:** Inga spärrar av typen döda alla, rensa området eller kräv nivå. Världen är fri att röra sig i, och svårigheten styrs bara av monstrens nivå. Rekommenderade nivåer är ren information. (Köp av stadstjänster och nivåkrav för att bära utrustning eller låsa upp färdigheter är inga rörelsespärrar.)

## Setting

Se lore.md för hela historien och akter.json för de fem akterna (nivå 1 till 30).
Världen är övergiven. Demoner och monster har tagit städerna, och de få överlevande gömmer sig i skogarna. Hjälten är en vanlig människa med vapen, färdigheter och utrustning. Stämningen är mörk och lite läskig: dimma, ödehus, kyrkogårdar, avlägsna skrik. Magi finns i världen men bara hos fienderna; för hjälten är magi en framtida upplåsning (troligen via runorna).

## Kärnloop

1. Utforska skogen och väck runorna.
2. Gå in i valfri besatt stad, slåss mot monster på den nivå du klarar, döda bossen.
3. Staden blir Rensad. Investera guld och material för att återbefolka (nivå 1 till 3).
4. Invånare ger handlare, vapenhandlare, helare, vakter, inkomst och nya rykten. Ingen tjänst ändrar föremål.
5. Starkare utrustning och nivåer låser upp nästa stad.

## Filer

- [lore.md](lore.md): världens historia, fraktioner, akter och tidslinje.
- [akter.json](akter.json): fem akter med regioner, biom, nivåer, bossar och quest krokar.
- [varld.md](varld.md): levande värld, dygn, miljöberättande, ryktessystem och rutiner.
- [varld_stor.md](varld_stor.md) och [varld_stor.json](varld_stor.json): den stora sammanhängande världen med chunkar, biomer, ringzoner, regioner, vägar och POI:er.
- [npc.json](npc.json): NPC:er med roller, rutiner, repliker och handel (akt 1 markerade för grafik först).
- [rykten.json](rykten.json): alla rykten med villkor.
- [quests.json](quests.json) och [quests.md](quests.md): quests för akt 1 till 4 med underbossar, skisser för akt 5, konsekvenssystem.
- [dialoger.json](dialoger.json): dialogträd och röstprofiler för akt 1 NPC:er.
- [klasser.json](klasser.json): klasser, stats, tillväxt, färdigheter, startutrustning.
- [stader.json](stader.json): stadstillstånd, kostnader för återbefolkning, belöningar, de fem första städerna.
- [stadstjanster.md](stadstjanster.md): handlare, vapenhandlare, kuriosahandlare, helare och snabbresa, priser i guld (#50).
- [monsterfamiljer.json](monsterfamiljer.json): sex familjer med svagheter och resistenser.
- [spawnzoner.json](spawnzoner.json): slumpade spawnpunkter, fiendeurval och vikter per område.
- [loot_design.md](loot_design.md): lootsystem i Diablo 2 stil, med [loot_kvaliteter.json](loot_kvaliteter.json), [foremal_bas.json](foremal_bas.json), [affix.json](affix.json), [set.json](set.json), [drop_tabeller.json](drop_tabeller.json) och [attribut.json](attribut.json).
- [monster_niva.json](monster_niva.json): statiska monsternivåer, skalning, item level, champions och unika, XP avdrag.
- [arkiv/itemization_ideer.md](arkiv/itemization_ideer.md): arkiverad, inga system för att ändra föremål.
- [lorebok.json](lorebok.json): lore för alla set, setdelar och legendariska föremål (tangent H).
- [portal_by.json](portal_by.json) och [portal_by.md](portal_by.md): Den gamla byn, första staden.
- [bana1_stor.json](bana1_stor.json): stor bana 1 (#33), 10 delområden i ring 0 och 1 med monstertabeller och nivåkurvan till nivå 7.
- [npc_grupper.json](npc_grupper.json): NPC-grupper ute i världen med fraktion, HP, skada och flaggor och rykten om man hjälper dem.
- [varldshandelser.json](varldshandelser.json): små världshändelser och platser i akt 1, inga döda X.
- [vandrare.json](vandrare.json): vandrande handlare och läger med syfte i lore.
- [varldsgenerator.json](varldsgenerator.json): generatorregler för #85: biomgränser, monsterpooler, platsplacering, nivå per avstånd, ljud och musik per biom, questplatser.

## Klasser

Resurs: Uthållighet (regen 8/s), ersätter mana. Kritisk träff ger 175 % skada. Formler för liv, uthållighet, mana (framtida), försvar, block och träff finns i attribut.json.

| Klass         | HP  | Uthållighet | Skada | Försvar | Fart | Krit | Tillväxt per nivå                   |
| ------------- | --- | ----------- | ----- | ------- | ---- | ---- | ----------------------------------- |
| Amazonkrigare | 90  | 120         | 7     | 2       | 6,2  | 12 % | +12 HP, +6 uth, +3 skada, +0,5 förs |
| Barbar        | 120 | 100         | 9     | 1       | 5,4  | 8 %  | +18 HP, +4 uth, +4 skada, +0,5 förs |
| Riddare       | 110 | 100         | 8     | 5       | 5,2  | 5 %  | +15 HP, +5 uth, +3 skada, +1 förs   |

Amazonkrigare (stick, start: jaktspjut, läderharnesk, 5 kastspjut, 3 små hälsodrycker): Spjutstöt (nv 1), Kastspjut (2), Vig undanmanöver (3), Jägarblick passiv (5), Virvelspjut (7), Sårande kast (9).

Barbar (kross, start: knölpåk, pälsväst, repbälte, 3 små hälsodrycker): Tungt slag (1), Stridsvrål (2), Markskakning (4), Blodtörst passiv (5), Berserkerrus (7), Yxkast (9).

Riddare (hugg, start: rostigt kortsvärd, eksköld, läderharnesk, 2 små hälsodrycker): Sköldblock (1), Sköldslag (2), Framstöt (3), Järnvilja passiv (5), Motattack (7), Fanbärarens rop (9).

Kostnad, cooldown och effekt finns i klasser.json. Startutrustningen är Normal kvalitet, tier 1, nivåkrav 1, utan affix. Kolumnen Skada är klassens skadebonus; slagskada = bonus + vapnets skada, vilket ger 3 till 4 slag mot en varg nivå 1.

## Monsterfamiljer

| Familj    | Svag mot    | Resistent mot | Boss               |
| --------- | ----------- | ------------- | ------------------ |
| Odöda     | kross       | stick         | Benkungen Valdemar |
| Bestar    | hugg        |               | Gråbjörnen Ulvhild |
| Gastar    | hugg        | kross, stick  | Träsdrottningen    |
| Kryp      | kross       | hugg          | Spinnmodern        |
| Förvridna | hugg, stick |               | Fadern av smittan  |
| Demoner   | stick       | kross         | Askfursten Morvath |

Svag ger 150 % skada, resistent 60 %.

## Städer

Tillstånd: Besatt, Rensad, Återbefolkad 1 (handlare), 2 (vapenhandlare, vakter), 3 (kuriosahandlare, helare, tavern, snabbresa). Priser och tjänster i stadstjanster.md.
Underbossar: Korpmodern (13, Korpholmarna), Järnmunken (17, Järnklostret), Askans profet (23, Kultens katakomber). Stats i quests.md och monsterfamiljer.json.
Före städerna: Startskogen, nivå 1 till 3, Bestar. Rekommenderad väg: Startskogen (2 till 3 games), Vargaby (1 game), sedan portalbyn på nivå 7.

1. Vargaby, nivå 4 till 6, boss nivå 6, Bestar
2. Den gamla byn (portalbyn), nivå 7 till 9, Benkungen nivå 10, Odöda
3. Dimmerstrand, nivå 11 till 14, boss 14, Gastar
4. Kopparberg, nivå 15 till 18, boss 18, Kryp
5. Askeborg, nivå 19 till 23, Askfursten nivå 25, Demoner
   Förvridna är reserverade för ett framtida slutområde 24 till 28. Hjältens maxnivå är 30.

## Notis till Utvecklare

- Byt `S.mana` mot `S.stamina` i game.js (HUD, regen, kostnad vid runaktivering). Behåll fältet för framtida magi men dölj det.
- Lägg till klassval på startskärmen; läs bas och tillväxt från klasser.json. `attack()` använder klassens skada, krit och vapnets skadetyp i stället för fast 25.
- Skademodell: skada × familjsmultiplikator × krit, minus försvar, minst 1.
- Färdigheter: knappar 1 till 4 plus undanmanöver; data styr kostnad, cooldown och upplåsningsnivå.
- Stadssystem: spara tillstånd per stad (localStorage), byt spawns, dekor och tjänster efter tillstånd. Invandrare och inkomst tickar med speltid.
- Vinstskärmen vid tre runor ersätts av röda portalen (se portal_by.md).

## Spawnalgoritm (för Utvecklare)

Kartor och byar är statiska; bara fienderna slumpas, en gång per game som i Diablo 2. Data i spawnzoner.json under session_roll.

1. Nytt game skapar game_seed. Inom samma game används samma seed: områdets frö = hash(game_seed, area_id), så samma monster genereras om området laddas om.
2. Om stadens tillstånd är rensad eller återbefolkad genereras inga monster alls (permanent). Bossen genereras bara om den inte är besegrad i sparfilen.
3. Välj antal aktiva spawnpunkter inom session_roll.active_spawn_points (always_active ingår alltid), slumpa vilka.
4. Per aktiv punkt: antal grupper inom groups. Per grupp: välj fiende med viktat slumpval ur punktens enemy_table (annars zone_tables eller områdets enemy_table): dra r = random() × summa vikter och ta raden där löpande summan först överstiger r. Storlek inom radens group eller punktens group_size. Nivå och stats är undertypens fasta värden.
5. Champions: rulla chance_per_group per grupp tills champions.max nåtts. Unika: rulla chance_per_game upp till uniques.max; en unik ersätter en slumpad grupp och får minions enligt monster_niva.json.
6. Placera varje monster inom punktens radie, fritt från colliders och minst min_player_distance från hjältens ingång. Monster genereras vid inladdning, så synfältsregeln behövs bara för ingångspunkten.
7. Varje monster får id area_id:point_id:grupp:index. När det dör sparas id:t i game_state.dead_monsters; vid omladdning inom samma game hoppas det över. Inga respawns. Döda monster återkommer först i ett nytt game.
   Startskogens spawnWolf och spawnPack i game.js ersätts av detta system med fiendetypen skogsvarg.

## Loot

Kvaliteter Normal (vit), Magisk (blå), Sällsynt (gul), Set (grön), Legendarisk (guld). Beväpnade fiender släpper sin vapentyp, djur och demoner släpper drycker, smycken och guld. Ädelstenar och hylsor är borttagna tills vidare (se arkiv/itemization_ideer.md (arkiverad, inga system för att ändra föremål)). Benföremål (vapen och rustning av ben, setet Benviskarens dräkt och två legendariska) släpps av djur och obeväpnade monster i alla kvaliteter. Detaljer och algoritm i loot_design.md.

## Progression

Juulis har satt portalbyn till nivå 7 till 9. Den röda portalen öppnas när alla tre runor är aktiva, utan andra villkor. Rekommenderad väg (bara information): Startskogen (nivå 1 till 3), Vargaby (4 till 6), portalbyn (7 till 9). Monstrens nivå och träffchansen gör att en för låg hjälte märker skillnaden direkt. XP kontroll (monster_niva.json progression_check): skogen ger cirka 123 XP per game, Vargaby cirka 2025 (20 monster) plus Gråbjörnen 2425, vilket ger nivå 7 före portalbyn för den som följer den rekommenderade vägen. Med stor bana 1 (bana1_stor.json) når hjälten nivå 7 före ring 2 och nivå 11 till 13 före akt 2.

BESLUT: ingen avstånds-XP. Hjältens XP kommer bara från monstrens XP per monster (monsterfamiljer.json, champions och unika med sina multiplikatorer) med XP avdraget i monster_niva.json. Svårigheten styrs enbart av monsternivån efter ring (varldsgenerator.json svarighet_avstand.malniva och ringens band). Tätheten är data (varldsgenerator.json monsterpooler.tathet_per_chunk, varld_stor.json regioner[].tathet, bana1_stor.json) och XP takten per ring kontrolleras med spel/design/verktyg/tathet.py.

Boss-XP: bossar och underbossar får XP = xp_bas × aktens boss_xp_faktor (monster_niva.json boss_xp_faktor): akt 1 1,0, akt 2 0,1, akt 3 0,36, akt 4 0,27, akt 5 1,0. Faktorerna räknas med spel/design/verktyg/tathet.py --forslag så att hjälten är nivå 15 efter ring 3, 19 efter ring 4, 24 efter ring 5 och 29 till 30 efter ring 6 med 0,5 monster per chunk i mellanmarken.

Kartan: dimma som avslöjas i radie 14 rutor runt hjälten, sparas per chunk i sparfilen, ingen spärr (varldsgenerator.json karta_och_dimma).

Utvecklare: i activate() när S.count når 3, öppna portalen efter 2 s. Inga nivå eller rensningsvillkor.

## Träffchans

hit = clamp(0,80 × 2 × AR / (AR + DR) + nivåterm, 5 %, 95 %), nivåterm −6,7 % per nivå under och +3,3 % per nivå över. AR = 15 + 8 × level, DR = 15 + 8 × level + försvar × 2. Jämn nivå ger 80 %, 3 under 60 %, 3 över 90 %. Detaljer och exempel i attribut.json.

## Monsternivåer och undertyper

Alla monster av samma typ har exakt samma stats: fast nivå, fast HP, fast skada per träff, inget slumpspann och ingen nivåskalning. Variation kommer från undertyper inom familjen. Stats räknades fram en gång med formlerna i monster_niva.json (designverktyg) och står som fasta tal i monsterfamiljer.json.

Bestar

| Namn                      | Nivå | HP   | Skada | Försvar | XP   | Zon         |
| ------------------------- | ---- | ---- | ----- | ------- | ---- | ----------- |
| Varg                      | 1    | 50   | 10    | 0       | 3    | startskogen |
| Vargbest                  | 3    | 79   | 13    | 2       | 22   | startskogen |
| Taggsvin                  | 4    | 88   | 16    | 3       | 48   | vargaby     |
| Gråvarg                   | 5    | 85   | 14    | 2       | 60   | vargaby     |
| Gråvargsledare            | 6    | 168  | 19    | 4       | 154  | vargaby     |
| Ruttbjörn                 | 6    | 293  | 29    | 6       | 265  | vargaby     |
| Gråbjörnen Ulvhild (boss) | 6    | 1730 | 34    | 8       | 2425 | vargaby     |

Odöda

| Namn                      | Nivå | HP   | Skada | Försvar | XP   | Zon       |
| ------------------------- | ---- | ---- | ----- | ------- | ---- | --------- |
| Benhund                   | 7    | 48   | 9     | 2       | 67   | gamla_byn |
| Skelettkrigare            | 7    | 97   | 15    | 4       | 111  | gamla_byn |
| Skelettbågskytt           | 8    | 71   | 13    | 2       | 170  | gamla_byn |
| Runpräst                  | 8    | 89   | 21    | 3       | 238  | gamla_byn |
| Skelettväktare            | 9    | 234  | 27    | 9       | 364  | gamla_byn |
| Skelettkapten             | 9    | 187  | 22    | 7       | 324  | gamla_byn |
| Benkungen Valdemar (boss) | 10   | 1594 | 32    | 7       | 3795 | gamla_byn |

Gastar

| Namn                   | Nivå | HP   | Skada | Försvar | XP   | Zon          |
| ---------------------- | ---- | ---- | ----- | ------- | ---- | ------------ |
| Dimgast                | 11   | 106  | 18    | 2       | 241  | dimmerstrand |
| Klagokvinna            | 12   | 136  | 12    | 3       | 436  | dimmerstrand |
| Träsknäcken            | 13   | 236  | 29    | 5       | 562  | dimmerstrand |
| Träsdrottningen (boss) | 14   | 3773 | 55    | 8       | 1100 | dimmerstrand |

Kryp

| Namn               | Nivå | HP   | Skada | Försvar | XP   | Zon        |
| ------------------ | ---- | ---- | ----- | ------- | ---- | ---------- |
| Gruvspindel        | 15   | 106  | 17    | 6       | 279  | kopparberg |
| Syrabagge          | 16   | 233  | 25    | 10      | 576  | kopparberg |
| Kitinvakt          | 18   | 565  | 47    | 15      | 1260 | kopparberg |
| Spinnmodern (boss) | 18   | 5649 | 72    | 13      | 6598 | kopparberg |

Demoner

| Namn                      | Nivå | HP    | Skada | Försvar | XP    | Zon      |
| ------------------------- | ---- | ----- | ----- | ------- | ----- | -------- |
| Askimp                    | 19   | 157   | 25    | 5       | 596   | askeborg |
| Eldpiskedemon             | 21   | 552   | 53    | 9       | 1877  | askeborg |
| Hornslaktare              | 22   | 759   | 72    | 12      | 2167  | askeborg |
| Askriddare                | 23   | 919   | 70    | 16      | 2647  | askeborg |
| Askfursten Morvath (boss) | 25   | 12636 | 123   | 17      | 12150 | askeborg |

Förvridna

| Namn                     | Nivå | HP    | Skada | Försvar | XP    | Zon                 |
| ------------------------ | ---- | ----- | ----- | ------- | ----- | ------------------- |
| Smittbärare              | 24   | 404   | 35    | 8       | 705   | framtida_slutomrade |
| Galen munk               | 25   | 500   | 47    | 9       | 1125  | framtida_slutomrade |
| Köttklump                | 27   | 1682  | 74    | 10      | 2104  | framtida_slutomrade |
| Fadern av smittan (boss) | 28   | 11100 | 116   | 13      | 28892 | framtida_slutomrade |

Elitmonster har fasta multiplikatorer: Champion nivå +1, HP × 2,5, skada × 1,4, försvar +3, XP × 3. Unik nivå +3, HP × 4, skada × 1,6, försvar +5, XP × 5, en modifierare med fast effekt, 2 till 3 champion följeslagare. XP sänks när hjälten är mer än 3 nivåer över monstret (ned till 5 %) och höjs upp till 25 % när hjälten är lägre.

Utvecklare: läs stats direkt från monsterfamiljer.json via id; ingen runtime skalning. Spawnpunkter väljer undertyp ur sin enemy_table (spawnzoner.json). Visa nivå på monstrets HP bar. ilvl = undertypens nivå (champion +1, unik +3 och +1, boss +2).

## Lorebok (tangent H)

- H öppnar och stänger loreboken, Esc stänger. Spelet pausas inte men hjälten tar inte emot input.
- Innehåll: lorebok.json med två flikar, Set (5 set med 5 delar var) och Legendariska föremål (20), totalt 50 poster.
- Upplåsning: en post visas som mörk siluett med ??? tills föremålet plockats upp första gången; då visas namn, ikon, egenskaper och lore. Setnamn syns direkt, delar låses upp var för sig, setbonusar syns när första delen hittats. Upplåsningen sparas per sparfil och följer med även om föremålet säljs.
- UI layout: gammal läderbunden bok på mörk bakgrund. Vänster sida en lista eller rutnät med ikoner i kvalitetsfärg (guld för legendariska, grönt för set) och räknare som 12/50. Höger sida stor föremålsbild, namn i kvalitetsfärg, bastyp och item level, egenskaper och lore i kursiv sepia text. Siluetter visas i mörkgrått #2a2a2a. En liten glöd och ljud när en ny post låses upp, plus en notis "Ny post i loreboken (H)".

## Notis till UI

- Klasssprites eller modeller: Amazonkrigare, Barbar, Riddare, var och en med gång, attack, undanmanöver, skada och död.
- Färdighetsikoner (18): spjutstöt, kastspjut, vig undanmanöver, jägarblick, virvelspjut, sårande kast, tungt slag, stridsvrål, markskakning, blodtörst, berserkerrus, yxkast, sköldblock, sköldslag, framstöt, järnvilja, motattack, fanbärarens rop. Passiva får rund ram, aktiva fyrkantig.
- Skadetypsikoner: hugg, stick, kross. Ikoner för svag och resistent.
- Monsterfamiljer: emblem för Odöda, Bestar, Gastar, Kryp, Förvridna, Demoner samt 3 exempelmonster och en boss per familj.
- Stadstillstånd: kartikon och stadsgrafik för Besatt (röd dimma), Rensad (grå, tom), Återbefolkad 1 till 3 (gradvis ljus, rök från skorstenar, folk). Ikoner för handlare, vapenhandlare, vakter, kuriosahandlare, helare, tavern, snabbresa, invånare, inkomst.
- Elitmonster: blå glöd och blått namn för champions, guldglöd och guldnamn för unika, ikoner för modifierarna extra stark, extra snabb, stenhud, vampyrisk, förbannad, tornig. Monsterlevel visas vid HP baren, rött om monstret är 5+ nivåer över hjälten, grått om 6+ under.
- HUD: uthållighetsmätare (ersätter mana), låst magiikon med hänglås.
- Mörk palett: bakgrund #0d0f12, dimma #1c2128, sten #3a3f45, dött gräs #3d4430, blod #7a1018, portal #c0182a, glöd #ff3344, fackla #e08a2a, hopp och återbefolkning #f2c46b, odöda ben #a8b0a0, demon #8a1a1a, gast #4a6a7a.
