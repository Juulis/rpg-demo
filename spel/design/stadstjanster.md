# Runornas kall: Stadstjänster

Data i stader.json (prissystem, service_detail, snabbresa). Issue #50. Ingen tjänst ändrar föremål: ingen smedja, inga hylsor, ingen reparation.

## Vad låses upp när

| Stadstillstånd | Tjänster                                   |
| -------------- | ------------------------------------------ |
| Besatt, Rensad | inga                                       |
| Återbefolkad 1 | handlare                                   |
| Återbefolkad 2 | vapenhandlare, vakter                      |
| Återbefolkad 3 | kuriosahandlare, helare, tavern, snabbresa |

Lägret har alltid Tor Kolare (handlare) och Sigrun (gratis helning), oberoende av städerna. Broder Elias och Fyrvaktaren Hulda läker också alltid gratis.

## Handlarna

| Handlare        | Säljer                                                                                    | Köper                         | Säljfaktor | Köpfaktor | Platser |
| --------------- | ----------------------------------------------------------------------------------------- | ----------------------------- | ---------- | --------- | ------- |
| Handlare        | mat (#35) obegränsat, pilar, kastspjut, timmer, sten, vanliga vapen och rustning (Normal) | allt utom questföremål        | 1,15       | 0,30      | 12      |
| Vapenhandlare   | vapen, rustning, sköldar (Normal 60 %, Magisk 40 %), järn                                 | vapen, rustning, sköldar, ben | 1,25       | 0,35      | 18      |
| Kuriosahandlare | amuletter, ringar, benföremål (Magisk 70 %, Sällsynt 30 %)                                | amuletter, ringar, ben        | 1,40       | 0,40      | 10      |
| Helare          | skogsörtste, rökt hogrev, välbrygd                                                        | inget                         | 1,00       |           |         |

Lagret rullas vid varje nytt game. Stadens ilvl är bossens nivå: lägret 3, Vargaby 6, gamla byn 10, Dimmerstrand 14, Kopparberg 18, Askeborg 25. Bättre butiker finns alltså i svårare städer.

## Priser i guld

- Grundvärde för utrustning: 8 + 4 x item_level, gånger kvalitet (Normal 1, Magisk 2,5, Sällsynt 5, Set 8, Legendarisk 12).
- Mat: torkat kött 12, skogsörtste 12, vargblod 30, rökt hogrev 35, välbrygd 120. Pilar 20 per 20, kastspjut 20 per 5.
- Material: timmer 6, sten 6, järn 15, benflisa 4. Guld kan alltså ersätta material vid återbefolkning.
- Köp: värde x säljfaktor x rabattfaktor x prisfaktor_mult. Rabattfaktor = 1 minus invånarrabatt (5 % per 10 invånare, tak 20 %) minus fraktionsrabatt (de kvarvarande 30+ ger 5 %, 60+ ger 10 %, under minus 30 blir det 10 % dyrare), lägst 0,7.
- Sälj: värde x köpfaktor, ingen rabatt, minst 1 guld. Köp är alltid minst säljpris + 1.
- Exempel: magiskt svärd ilvl 10 har värde 120. Vapenhandlaren tar 150 guld, med 20 % rabatt 120. Hjälten får 42 guld om han säljer det.
- Questföremål går inte att sälja. Set och legendariska kan säljas men finns aldrig i butik. De 10 senast sålda kan köpas tillbaka till samma pris tills hjälten lämnar staden.

## Helare

Gratis. Full HP och uthållighet, tar bort gift, brännskada och förbannelse. Prata med helaren så sker det direkt.

## Snabbresa

- Nätverket är waypoints i varld_stor.json. Röda portalen är alltid med och aktiveras första gången hjälten går fram till den, utan runkrav.
- Varje stad som når Återbefolkad 3 reser en vägsten på torget (id stad_vagsten). Den aktiveras när hjälten besökt den.
- Vid en aktiv waypoint väljer hjälten mål i en lista med namn och rekommenderad nivå. Gratis, ingen nedkylning.
- Lore: vägstenarna är bitar av ristarens runor som invånarna grävt fram. De glöder rött som portalen. Hjälten använder kraften men styr den inte.
- Allt går att nå till fots. Snabbresa sparar bara tid.

## Handelsfönster (UI)

Vänster lagret, höger ryggsäcken. Pris i guld under varje föremål, rabatt visas som grön text. Questföremål gråa med texten Kan inte säljas. Flikar: Köp, Sälj, Köp tillbaka. Texter sv/en: Köp/Buy, Sälj/Sell, Köp tillbaka/Buy back, Kan inte säljas/Cannot be sold, Inte nog med guld/Not enough gold, Rabatt/Discount, Läk/Heal, Res till/Travel to.
