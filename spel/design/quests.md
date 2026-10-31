# Runornas kall: Quests

Alla quests följer Juulis regler: inga döda X eller samla X, inga spärrar, valfri ordning, bossar kan dödas före questen (fältet redan_gjort), val ändrar världen permanent per hjälte men stänger den aldrig. Data i quests.json; konsekvenssystemet beskrivs i varld.md.

## Akt 1

### Sandalerna i mossan (miras_bror)

Givare: Lilla Mira. Rekommenderad nivå 2 till 4. Belöning 234 XP (45 % av nivå 3).

Lilla Mira väntar på sin bror som sprang mot Vargaby natten demonerna kom. Hjälten följer hans spår genom skogen och hittar vad som blev kvar.

Steg:

1. Hitta barnsandalen i mossan på vägen mot Vargaby.
2. Följ spåren till den övergivna kolarkojan längs Vargastigen.
3. I kojan finns pojkens sista spår. Flyktingens sandaler ligger under golvet, bevakade av en vargbest (champion).
4. Bestäm vad Mira ska få veta.

Val:

- **Ge sandalerna till Mira och berätta sanningen.** Konsekvens: lilla_mira: slutar vänta vid vägen, hjälper Sigrun i helartältet. Effekter: item_grant, npc_state, npc_location, faction_rep, town_growth, rumor_add.
- **Behåll sandalerna och säg att brodern lever i Vargaby.** Konsekvens: lilla_mira: fortsätter vänta, går senare till Vargaby när den återbefolkas och frågar efter brodern hos Hedda. Effekter: flag_set, npc_state, npc_location, rumor_add, faction_rep.

Redan gjort: Om sandalerna redan plockats upp hoppar questen till steget tillbaka.

### Benens visk (benens_visk)

Givare: Viskaren. Rekommenderad nivå 4 till 6. Belöning 447 XP (40 % av nivå 5).

Viskaren säger att hans brors skalle ligger kvar i hans gamla hus i Vargaby och viskar hans namn om nätterna. Han vill ha den tillbaka, eller vill han?

Steg:

1. Hitta Viskarens gamla hus i Vargaby, där benen ligger sorterade i högar.
2. Stå i huset efter mörkrets inbrott och lyssna. En av skallarna viskar.
3. Ta skallen. Två ruttnande lik (unika följeslagare) reser sig.
4. Gå tillbaka till Viskaren.

Val:

- **Ge skallen till Viskaren.** Konsekvens: viskaren: blir tyst och lugn, flyttar in i lägret och sitter vid Ylvas eld; sara_benlasare: blir besviken när hon dyker upp. Effekter: item_grant, npc_state, npc_location, area_change, rumor_add.
- **Behåll skallen (den är en del av Benviskarens dräkt).** Konsekvens: viskaren: skrattar och säger att skallen valde dig; ger en fri ledtråd om var resten av dräkten droppar; sara_benlasare: vill köpa skallen dyrt. Effekter: npc_state, merchant_stock, faction_rep, area_change, rumor_add.

Redan gjort: Om skallen redan hittats går questen direkt till atervand.

### Gråbjörnens päls (ulvhilds_pals)

Givare: Hedda, eller Bror. Rekommenderad nivå 5 till 7. Belöning 588 XP (40 % av nivå 6).

Ulvhild åt Heddas man och Brors son. Båda vill ha hennes päls, av olika skäl. Hedda för hämnd, Bror för att begrava sonen i den.

Steg:

1. Hitta kedjorna vid ingången till Ulvhilds ide i Vargaby.
2. Fäll Gråbjörnen Ulvhild.
3. Ta Ulvhilds päls (questföremål) och hitta Brors sons halsband av vargtänder bland benen i idet.
4. Välj vem som får pälsen.

Val:

- **Ge pälsen till Hedda.** Konsekvens: hedda_jagare: hänger pälsen i jaktstugan, säljer med 10 % rabatt till hjälten; bror_vakt: blir kort i tonen men står kvar på vakt. Effekter: item_grant, merchant_stock, npc_state, faction_rep, town_growth, rumor_add.
- **Ge pälsen och halsbandet till Bror.** Konsekvens: bror_vakt: begraver sonen vid lägret, nytt gravkors, Bror börjar le igen; hedda_jagare: säger att hjälten valde fel, men handlar ändå. Effekter: item_grant, npc_state, area_change, npc_state, npc_location, town_growth, faction_rep, rumor_add.

Redan gjort: Om Ulvhild redan är död börjar questen på steget palsen; pälsen ligger kvar i idet.

### Runornas ristare (runornas_ristare)

Givare: Gamla Ylva. Rekommenderad nivå 3 till 10. Belöning 1131 XP (50 % av nivå 8).

Ylva vill veta vem som ristade runorna. Varje runsten bär ett litet märke som bara syns i månsken. Märkena leder till kryptan under Benkungens kapell.

Steg:

1. Undersök runstenarna på natten. Varje sten visar en del av ett tecken: en mejsel, ett öga, en spricka.
2. Visa tecknen för Ylva. Hon känner igen kapellets gamla symbol.
3. Hitta ristarens vägg djupt i Kapellets krypta, bakom Benkungens tron.
4. Ta mejseln som ligger kvar under väggen och läs inskriften om den fjärde stenen.
5. Berätta för Ylva vad du läste.

Val:

- **Berätta allt, även att ristaren själv släckte den fjärde stenen.** Konsekvens: gamla_ylva: tystnar en dag, sedan börjar hon tala om att tända den fjärde stenen (krok till akt 5). Effekter: item_grant, npc_state, flag_set, faction_rep, rumor_add.
- **Berätta bara om mejseln och säg att ristaren dog i strid.** Konsekvens: gamla_ylva: blir glad, men Fyrvaktaren Hulda i akt 5 vet sanningen och säger det rakt ut. Effekter: item_grant, flag_set, quest_alt_giver, faction_rep, rumor_add.

Redan gjort: Om kryptan redan besökts och mejseln hittats räcker det att undersöka stenarna och prata med Ylva.

### Gravvaktarnas sista strid (gravvaktarnas_sista_strid)

Givare: Gravvaktaren Ebbe. Rekommenderad nivå 7 till 9. Belöning 905 XP (40 % av nivå 8).

Ebbe är den siste gravvaktaren. Hans bröder föll i kryptan natten de döda reste sig, och deras krönika försvann med dem. Han vill veta hur de dog.

Steg:

1. Hitta den sista gravvaktarens kropp på Gravåsen, med en nyckel i handen.
2. Öppna gravvaktarnas kammare i Kapellets krypta med nyckeln. Kammaren vaktas av en Skelettväktare (unik) som en gång var deras kapten.
3. Ta gravvaktarnas krönika (questföremål).
4. Bestäm vem krönikan tillhör.

Val:

- **Ge krönikan till Ebbe.** Konsekvens: gravvaktaren_ebbe: läser krönikan för de nya bybornas barn vid portalgläntan. Effekter: item_grant, faction_rep, npc_state, town_growth, rumor_add.
- **Ge krönikan till Vaktkapten Ingrid, vars farfar står i den (om hon finns i byn, annars läggs den i hennes vakthus).** Konsekvens: vaktkapten_ingrid: börjar utbilda vakterna i gravvaktarnas sätt, bär farfaderns emblem; gravvaktaren_ebbe: respekterar valet, säger att orden lever i henne. Effekter: item_grant, npc_faction, npc_state, area_change, town_growth, faction_rep, rumor_add.

Redan gjort: Om kammaren redan rensats ligger krönikan kvar där.

### Begrav Benkungen (begrav_benkungen)

Givare: Gravvaktaren Ebbe, eller Sara Benläsare. Rekommenderad nivå 9 till 11. Belöning 1423 XP (45 % av nivå 10).

Valdemar var en god hövding innan kronan tog honom. Ebbe vill att han begravs som en man. Sara vill ha hans signet för sina egna skäl.

Steg:

1. Fäll Benkungen Valdemar i kapellet.
2. Bland hans ben ligger hövdingens signet (questföremål tills valet görs).
3. Bär hans ben till hövdingagraven på kyrkogården och bestäm vad som händer med signeten.

Val:

- **Begrav Valdemar med signeten.** Konsekvens: gravvaktaren_ebbe: håller en ceremoni; kyrkogården blir en lugn plats med ljus; olle_vardshus: döper ett öl efter Valdemar. Effekter: xp_grant, area_change, faction_rep, town_growth, merchant_stock, rumor_add.
- **Begrav honom men behåll signeten.** Konsekvens: gravvaktaren_ebbe: godtar det, säger att byn nu bärs av hjälten. Effekter: item_grant, faction_rep, faction_rep, value_add, rumor_add.
- **Ge benen och signeten till Sara Benläsare.** Konsekvens: sara_benlasare: bygger ett benaltare i kapellet, säljer till hjälten med 15 % rabatt; gravvaktaren_ebbe: vänder hjälten ryggen i tre speldygn, sedan förlåter han. Effekter: item_grant, faction_rep, merchant_stock, area_change, npc_state, quest_exclude, npc_location, town_growth, npc_state, rumor_add, rumor_add.

Redan gjort: Om Benkungen dödats innan questen börjar startar den direkt på steget signeten och Ebbe kommer själv fram till hjälten.

## Underbossar akt 2 till 4

Stats räknas med monster_niva.json underboss_regel: aktens huvudboss skalad till underbossens nivå, HP x 0,45, skada x 0,85, XP x 0,4 och sedan aktens boss_xp_faktor (monster_niva.json: akt 2 0,1, akt 3 0,36, akt 4 0,27). Data i monsterfamiljer.json.

| Namn          | Familj    | Nivå | HP   | Skada | Försvar | XP   | Område             |
| ------------- | --------- | ---- | ---- | ----- | ------- | ---- | ------------------ |
| Korpmodern    | gastar    | 13   | 1544 | 44    | 8       | 394  | korpholmarna       |
| Järnmunken    | forvridna | 17   | 2311 | 57    | 13      | 2422 | jarnklostret       |
| Askans profet | forvridna | 23   | 4699 | 91    | 16      | 4289 | kultens_katakomber |

- **Korpmodern**: Underboss. Skjuter tre korpfjäderpilar i solfjäder. Var 20:e sekund kallar hon 2 dimgaster. Under 50 % liv löses hon upp i en korpsvärm och landar på en ny klippa på arenan, sedan skjuter hon igen.
- **Järnmunken**: Underboss. Långsam och tung. Slår med järnkedjan i en båge framför sig och gör markslag som knuffar. Under 40 % liv river han av en länk ur gördeln och blir snabbare (fart x 1,3) och kallar 2 förvridna gruvarbetare.
- **Askans profet**: Underboss. Håller avstånd och kastar eldklot. Tänder askcirklar på golvet som bränner den som står kvar. Kallar 2 askkultister var 25:e sekund. Under 30 % liv brinner masken av och han går till närstrid med ritualdolken.

## Akt 2

### Klockorna under vattnet (klockorna_under_vattnet)

Givare: lova_fiskarankan. Rekommenderad nivå 13 till 15. Belöning 2357 XP (45 % av nivå 14).

Lovas man Arvid drunknade när dimman kom. Nu går han upp på stranden om nätterna, och under vattnet ringer kyrkklockor som ingen har ringt på trettio år. Lova vill veta varför han inte får vila.

Steg:

1. Stå på bryggan efter mörkrets inbrott och lyssna. Klockorna hörs ute i dimman.
2. Följ ljudet till Den sjunkna kyrkan.
3. Fäll Träsdrottningen. Det är hennes sång som håller de drunknade kvar.
4. När sången tystnar står en drunknad man kvar vid klockrepet. Han bär Lovas vigselring.
5. Gå tillbaka till Lova och bestäm vad som händer med Arvid.

Val:

- **Ge ringen till Lova och låt Arvid vila.** Konsekvens: lova_fiskarankan: sörjer i frid, flyttar upp från båten till ett av husen vid bryggan. Föremål: dimvandrarens_handskar. Effekter: item_grant, rumor_add, faction_rep, npc_state, npc_location, town_growth, area_change.
- **Låt Arvid vakta stranden som förut.** Konsekvens: lova_fiskarankan: sitter kvar i båten och pratar med sin man om nätterna. Extra XP: 786. Effekter: xp_grant, rumor_add, faction_rep, npc_state, area_change, area_change.

Redan gjort: Om Träsdrottningen redan är fälld har klockorna tystnat. Lova säger att Arvid ändå står kvar i kyrkan, och questen startar på steget arvid.

### Korpmoderns sista flykt (korpmoderns_sista_flykt)

Givare: lova_fiskarankan. Rekommenderad nivå 12 till 14. Belöning 1875 XP (40 % av nivå 13).

Korparna på Dimmerstrands tak väntar på sin moder. Korpmodern var en jägerska som bad dimman om vingar när vattnet steg. Hon fick dem, och mer.

Steg:

1. Följ korparna från taken ut mot havet.
2. Gå över ebbstigarna till Korpholmarna. Stigarna är alltid farbara, vattnet bara skvalpar runt fötterna.
3. I boet ligger en flätad krans av människohår och idegran. Någon har gråtit här.
4. Fäll Korpmodern på klipporna.
5. Ta kransen ur hennes fjädrar och bestäm vad som händer med den.

Val:

- **Bryt kransen. Hon ska aldrig flyga igen.** Konsekvens: lova_fiskarankan: säger att taken är tysta nu, och att hon saknar ljudet. Föremål: korpmoderns_bage. Effekter: item_grant, rumor_add, faction_rep, area_change.
- **Lägg kransen i havet och lös förbannelsen.** Konsekvens: lova_fiskarankan: matar korparna på bryggan. Extra XP: 703. Effekter: xp_grant, rumor_add, town_growth, area_change, area_change.

Redan gjort: Om Korpmodern redan är fälld ligger kransen kvar i boet. Questen startar på steget kransen när hjälten pratar med Lova eller går in på Korpholmarna.

## Akt 3

### Järnmunkens lås (jarnmunkens_las)

Givare: broder_elias. Rekommenderad nivå 16 till 18. Belöning 3154 XP (45 % av nivå 17).

Bröderna i Järnklostret låste in sig för att inte förvridas. Elias var den ende som öppnade dörren, och smittan gick in. Den starkaste brodern, Härmod, bar en järngördel som botgöring. Nu har järnet vuxit in i köttet.

Steg:

1. Gå till Järnklostret. Porten Elias öppnade står fortfarande på glänt.
2. Läs brödernas sista böner i kapitelsalen. Den sista sidan handlar om Härmod och gördeln.
3. Fäll Järnmunken i klostergården.
4. Han andas fortfarande, och för en stund är han Härmod igen. Bestäm vem som tar farväl.

Val:

- **Avsluta det själv och ta gördeln.** Konsekvens: broder_elias: sörjer, ber vid porten varje natt. Föremål: jarnmunkens_gordel. Effekter: item_grant, rumor_add, faction_rep, npc_state.
- **Hämta Elias så han får tala med sin bror en sista gång.** Konsekvens: broder_elias: flyttar till klostret, hänger gördeln vid altaret, läker där och säljer välbrygd billigare. Extra XP: 1051. Effekter: xp_grant, rumor_add, faction_rep, npc_state, npc_location, merchant_stock, area_change.

Redan gjort: Om Järnmunken redan är fälld ligger gördeln kvar på hans plats. Steget farvalet blir att bära gördeln till Elias. Valen blir behåll gördeln (samma som avsluta_sjalv) eller ge den till Elias (samma som lat_elias_tala, Elias går själv till klostret för att begrava brodern).

### Martas dotter (martas_dotter)

Givare: marta_torghandlare. Rekommenderad nivå 15 till 17. Belöning 2560 XP (40 % av nivå 16).

Martas dotter Hanna flydde till Kopparberg och gifte sig med gruvans klockare. Inga brev har kommit på tjugo år. Marta frågar varje resenär.

Steg:

1. Leta i gästgiveriet i Kopparberg. Hannas namn är ristat i en bjälke, bredvid klockarens.
2. Följ klockarens spår ner i Gruvdjupen.
3. Bland nät och kristaller hänger gruvlagets målade gruppbild. Hanna står längst ut med Martas röda huvudduk. En unik gruvspindel vaktar nätet.
4. Bredvid nätet ligger klockarens hammare. Han ringde larmklockan tills nätet tog dem båda.
5. Gå tillbaka till Marta och bestäm vad hon ska få veta.

Val:

- **Ge Marta bilden och berätta sanningen.** Konsekvens: marta_torghandlare: hänger bilden i ståndet, blir tystare en tid och sedan pratsam igen. Effekter: rumor_add, faction_rep, npc_state, town_growth, area_change.
- **Behåll bilden och säg att Hanna lever längre in i bergen.** Konsekvens: marta_torghandlare: glad, ger rabatt, frågar alla från Kopparberg efter Hanna. Extra XP: 640. Effekter: xp_grant, rumor_add, flag_set, npc_state, merchant_stock.

Redan gjort: Om gruppbilden eller hammaren redan plockats upp hoppar questen till steget tillbaka när hjälten pratar med Marta.

## Akt 4

### Den fjärde stenen (den_fjarde_stenen)

Givare: rask_avfallen. Rekommenderad nivå 22 till 24. Belöning 5515 XP (50 % av nivå 23).

Rask vet att Askans barn letar efter den fjärde stenen. Deras profet vill släcka den en andra gång så att sprickan aldrig kan stängas. Under masken av aska finns en gravvaktare som läste ristarens anteckningar.

Steg:

1. Ta dig ner i Kultens katakomber. Rask säger att vägen går under det brända brunnshuset i Askeborg.
2. Lyssna vid de tre ritualkamrarna. Profeten predikar om en sten som ska släckas igen.
3. Fäll Askans profet. När masken brinner av syns gravvaktarnas märke på hans hals.
4. I hans kåpa ligger en karta ristad i ben. Den visar vägen till sprickans botten.
5. Gå tillbaka till Rask och bestäm vem som ska bära kartan.

Val:

- **Bär kartan till Gamla Ylva.** Konsekvens: gamla_ylva: blir sökare, pratar bara om den fjärde stenen. rask_avfallen: stannar i ruinen, lättad. Föremål: tystnadens_stilett. Effekter: item_grant, rumor_add, flag_set, faction_rep, npc_state.
- **Låt Rask behålla kartan och sona sin skuld.** Konsekvens: rask_avfallen: flyttar till lägret vid skogsbrynet, läser kartan högt vid elden. gunnar_jarnhand: muttrar men låter honom vara. Extra XP: 1654. Effekter: xp_grant, rumor_add, flag_set, faction_rep, faction_rep, npc_state, npc_location.

Redan gjort: Om profeten redan är fälld ligger kartan kvar i hans kåpa. Questen startar på steget kartan när hjälten pratar med Rask eller plockar upp kartan.

### Pilgrimens väg (pilgrimens_vag)

Givare: rask_avfallen. Rekommenderad nivå 20 till 22. Belöning 4330 XP (45 % av nivå 21).

En pilgrim gick förbi Raskas ruin och hälsade. Han band böneremsor i de brända träden längs askvägen och gick in genom Askeborgs port. Han kom aldrig ut.

Steg:

1. Följ pilgrimens böneremsor i de brända träden längs askvägen.
2. Gå in genom Askeborgs port.
3. Innanför porten ligger pilgrimens stav och en tom ryggsäck. En unik askriddare står vakt.
4. Bestäm vad som händer med staven: begrav den vid porten eller bär den till altaret i Den brända katedralen.

Val:

- **Begrav staven vid porten.** Konsekvens: Föremål: askvagen (del av Askvandrarens börda). Effekter: item_grant, rumor_add, faction_rep, area_change.
- **Bär staven till altaret i Den brända katedralen.** Konsekvens: Föremål: pilgrimens_torn (del av Askvandrarens börda). Effekter: item_grant, rumor_add, faction_rep, area_change.

Redan gjort: Om staven redan plockats upp hoppar questen till steget vilan.

## Skisser akt 5

- **Ljuset som håller** (akt 5, Fyrvaktaren Hulda): Varför håller fyren smittan borta? Ljuset är en runsten. Hitta varifrån den kom och skydda fyren när Fadern av smittan sänder sin församling. Belöning: XP 45 % av nivå 26, smittfaderns_kapa.
- **Tänd stenen** (akt 5, Gamla Ylva): Med ristarens mejsel och sanningen från kryptan går hjälten till sprickans botten. Möt Den slocknade. Val: tänd den fjärde stenen och stäng sprickan, eller ta dess kraft (låser upp magi). Belöning: XP 50 % av nivå 30, magi låses upp, nytt legendariskt föremål planeras.
