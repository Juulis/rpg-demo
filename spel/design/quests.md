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

## Skisser akt 2 till 5

- **Klockorna under vattnet** (akt 2, Fiskaränkan Lova): Följ klockornas ljud genom dimman till Den sjunkna kyrkan och ta reda på varför Träsdrottningen håller de drunknade kvar. Val: befria Lovas man eller låta honom vakta stranden. Belöning: XP 45 % av nivå 14, Korpmoderns båge eller Dimvandrarens handskar.
- **Korpmoderns sista flykt** (akt 2, Fiskaränkan Lova): Korparna leder hjälten över ebbstigarna till Korpholmarna där Korpmodern väntar. Val: döda henne eller lösa hennes förbannelse så korparna blir hjältens vakter över Dimmerstrand. Belöning: XP 40 % av nivå 13, korpmoderns_bage.
- **Järnmunkens lås** (akt 3, Broder Elias): Elias öppnade dörren som skulle hållit bröderna inne. Hitta Järnmunken i Järnklostret och välj: döda honom eller låta Elias tala med honom en sista gång. Belöning: XP 45 % av nivå 17, jarnmunkens_gordel.
- **Martas dotter** (akt 3, Marta): Martas dotter flydde till Kopparberg. Spåren leder till gruvdjupen och en gruppbild bland nät och kristaller. Val om vad Marta får veta. Belöning: XP 40 % av nivå 16, klockarens_hammare.
- **Den fjärde stenen** (akt 4, Rask den avfallne): Rask vet att kulten letar efter den fjärde stenen. Smyg genom Kultens katakomber, avslöja Askans profet och hitta kartan till sprickans botten. Belöning: XP 50 % av nivå 23, tystnadens_stilett.
- **Pilgrimens väg** (akt 4, Rask den avfallne): Följ pilgrimens bönerader i träden längs askvägen till Askeborgs port och vidare in. Val: begrava hans stav eller bära den till Den brända katedralen. Belöning: XP 45 % av nivå 21, del av Askvandrarens börda.
- **Ljuset som håller** (akt 5, Fyrvaktaren Hulda): Varför håller fyren smittan borta? Ljuset är en runsten. Hitta varifrån den kom och skydda fyren när Fadern av smittan sänder sin församling. Belöning: XP 45 % av nivå 26, smittfaderns_kapa.
- **Tänd stenen** (akt 5, Gamla Ylva): Med ristarens mejsel och sanningen från kryptan går hjälten till sprickans botten. Möt Den slocknade. Val: tänd den fjärde stenen och stäng sprickan, eller ta dess kraft (låser upp magi). Belöning: XP 50 % av nivå 30, magi låses upp, nytt legendariskt föremål planeras.
