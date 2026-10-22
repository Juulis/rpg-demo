# Runornas kall: Lootsystem

Lootsystemet är inspirerat av Diablo 2 och ersätter de gamla sällsynthetsnivåerna i portal_by.json (common blir Normal, uncommon Magisk, rare Sällsynt, epic och legendary blir Legendarisk). Hjälten har ingen magi; ordet magisk syftar på föremålets kvalitet, förtrollningar som smiddes innan världen föll.

## Filer

- [loot_kvaliteter.json](loot_kvaliteter.json): kvaliteter, färger, affixantal, grundchanser.
- [foremal_bas.json](foremal_bas.json): alla bastyper (vapen, sköldar, rustning, smycken, drycker, material, guld) och legendariska föremål.
- [affix.json](affix.json): prefix och suffix med tre tiers.
- [set.json](set.json): fem set med fem delar var.
- [drop_tabeller.json](drop_tabeller.json): per familj, monster och boss.
- [attribut.json](attribut.json): formler och tak.
- [lorebok.json](lorebok.json): lore för set och legendariska föremål.

## 1. Kvaliteter

| Kvalitet                | Färg         | Affix    | Grundchans |
| ----------------------- | ------------ | -------- | ---------- |
| Normal                  | vit #e8e8e8  | 0        | resten     |
| Magisk (Magic)          | blå #6a6aff  | 1 till 2 | 20 %       |
| Sällsynt (Rare)         | gul #ffff64  | 3 till 6 | 5 %        |
| Set                     | grön #00c400 | fasta    | 1,2 %      |
| Legendarisk (Legendary) | guld #c7a35a | fasta    | 0,8 %      |

Rullordning: Legendarisk, Set, Sällsynt, Magisk, annars Normal.

## Item level

- ilvl = undertypens fasta nivå. Champions +1, unika +3 och +1 till, bossar +2 (Benkungen nivå 10 ger ilvl 12, Askfursten 25 ger 27). Tak 30.
- En bastyp kan droppa när dess item_level ≤ ilvl. Tier 1 bas: ilvl 1 till 6 (slutar droppa vid 20), tier 2: 7 till 14, tier 3: 15 och uppåt.
- Affixtiers kräver ilvl 1, 9 och 18. Stor hälsodryck ilvl 7, föryngringsdryck 15.
- Set droppar från setets level: Gravvaktarens arv 9, Bergsklanens raseri och Jaktgudinnans döttrar 15, Tempelriddarens ed 17, Askvandrarens börda 21. Legendariska föremål nivå 6 till 10.
- Resultat: startskogen ger bara tier 1, portalbyn tier 2, tier 3 och de bästa affixen finns först från Kopparberg.
- Champions: 100 % drop, +1 rull, kvalitet × 1,5. Unika: +2 rull, kvalitet × 2, minst Magisk.

## 2. Vapen

| Typ    | Skadetyp | Tier 1                     | Tier 2                   | Tier 3                       | Klasser         |
| ------ | -------- | -------------------------- | ------------------------ | ---------------------------- | --------------- |
| Svärd  | hugg     | Rostigt kortsvärd 3 till 7 | Långsvärd 6 till 12      | Riddarsvärd 11 till 20       | Riddare, Barbar |
| Yxa    | hugg     | Handyxa 4 till 8           | Järnyxa 7 till 15        | Tvåhänd stridsyxa 14 till 28 | Barbar          |
| Klubba | kross    | Knölpåk 3 till 8           | Tvåhandsklubba 8 till 18 | Stridshammare 13 till 24     | Barbar, Riddare |
| Spjut  | stick    | Jaktspjut 4 till 9         | Krigsspjut 7 till 15     | Valkyriespjut 12 till 24     | Amazonkrigare   |
| Båge   | stick    | Kortbåge 2 till 7          | Långbåge 5 till 12       | Kompositbåge 9 till 19       | Amazonkrigare   |
| Dolk   | stick    | Kniv 2 till 5              | Stilett 4 till 9         | Ritualdolk 7 till 14         | Amazonkrigare   |
| Sköld  | block    | Eksköld 20 %               | Kampsköld 28 %           | Tornsköld 38 %               | Riddare         |

Tier 1 har item level 1, tier 2 item level 5 till 9, tier 3 item level 15 till 17 (krav på hjältens nivå samma värde). Vapnets skada läggs till klassens grundskada. Attackfart, räckvidd och tvåhand finns i JSON.

## 3. Kategorier

Vapen, rustning, drycker, amuletter (charms), ringar, guld samt material (benflisa, timmer, sten, järn) för återbefolkning.

Ädelstenar och hylsor är borttagna tills vidare. Deras dropvikt är fördelad på drycker (40 %), amuletter (20 %), ringar (20 %) och guld (20 %). Alternativ finns i arkiv/itemization_ideer.md (arkiverad, inga system för att ändra föremål).

## 4. Rustning

| Plats    | Lätt                 | Läder                                                | Plate                                                     |
| -------- | -------------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| Hjälm    | Tygluva (Cap)        | Benhjälm (Bone Helm)                                 | Riddarhjälm (Knight Helm)                                 |
| Bröst    | Pälsväst (Fur Vest)  | Läderharnesk (Leather Armor), Ringbrynja (Ring Mail) | Tempelpansar (Templar Armor), Riddarpansar (Knight Armor) |
| Handskar | Tyghandskar (Gloves) | Läderhandskar (Leather Gloves)                       | Järnhandskar (Gauntlets)                                  |
| Bälte    | Repbälte (Sash)      | Läderbälte (Belt)                                    | Platebälte (Plated Belt)                                  |
| Stövlar  | Sandaler (Sandals)   | Läderstövlar (Leather Boots)                         | Järnstövlar (Greaves)                                     |

Plate ger mest försvar men fartstraff (upp till 8 % per del, tak 20 % totalt) och 15 % sämre uthållighetsregen. Riddaren halverar fartstraffet. Bälten ger dryckesplatser.

## Material och benföremål

Alla vapen, rustningar och smycken har fältet material (järn, trä, läder, tyg, päls, ben, sten, silver). Ben är ett eget tema:

- Benvapen: Bendolk (ilvl 2), Benklubba (3), Benyxa (10), Benspjut (12), Jättebensklubba (19), Revbensdolk (22). Ger liv per träff 1, 2 eller 3 efter tier.
- Benrustning i viktklass läder (hårdare än läder, inget fartstraff, 3 % sämre uthållighetsregen): Benhjälm (6), Benhandskar (8), Benstövlar (9), Benharnesk (11), Benbälte (13). Ger +5 eller +10 liv.
- Kategorin ben i drop_tabeller.json väljer bland alla benbaser och rullar kvalitet som vanligt, Normal till Set och Legendarisk. Bestar, kryp, demoner och obeväpnade odöda och förvridna (Benhund, Ruttnande lik, Smittad bybo, Smittbärare, Köttklump) har ben i sina vikter.
- Set: Benviskarens dräkt (nivå 13). Legendariska: Likätarens käke (yxa, 11) och Revbensburen (bröst, 14).

## 5. Logiska droppar

Alla monster har dropchans. Djur, demoner, gastar och kryp har inga vapen och släpper drycker, amuletter, ringar och guld. Beväpnade fiender rullar först sin vapentyp (25 %, boss 60 %), därefter familjetabellen.

| Monster            | Vapentyp         |
| ------------------ | ---------------- |
| Skelettkrigare     | svärd            |
| Skelettbågskytt    | båge             |
| Skelettväktare     | klubba och sköld |
| Skelettkapten      | svärd            |
| Askriddare         | svärd            |
| Runpräst           | dolk             |
| Benkungen Valdemar | yxa              |
| Hornslaktare       | yxa              |
| Galen munk         | klubba           |

| Familj    | Dropchans | Kategorier                                  |
| --------- | --------- | ------------------------------------------- |
| Odöda     | 45 %      | vapen, rustning, drycker, smycken, benflisa |
| Bestar    | 45 %      | drycker, smycken, guld, benföremål          |
| Gastar    | 45 %      | drycker, smycken, guld                      |
| Kryp      | 45 %      | drycker, smycken, guld, benföremål, järn    |
| Förvridna | 50 %      | allt, mest drycker                          |
| Demoner   | 60 %      | drycker, smycken, mycket guld, benföremål   |

Bossar ger 5 till 7 föremål, alltid 2 stora hälsodrycker, kvalitetsbonus ×2 till ×3, minst ett sällsynt föremål vid första dödandet och namngivna droppar.

## 6. Set

| Set                   | Klass         | Bonus vid 5 delar                                                                                |
| --------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| Tempelriddarens ed    | Riddare       | Sköldslag bedövar 1 s längre, immun mot knuff                                                    |
| Bergsklanens raseri   | Barbar        | Berserkerrus 4 s längre utan skadestraff                                                         |
| Jaktgudinnans döttrar | Amazonkrigare | Kastspjut kastar 2 extra spjut                                                                   |
| Gravvaktarens arv     | alla          | 25 % skydd mot mörk magi, 20 % Magic Find                                                        |
| Benviskarens dräkt    | alla          | De dödas visk: var 10:e s blir nästa träff ett garanterat krosslag och fiender inom 5 tvekar 1 s |
| Askvandrarens börda   | alla          | +30 mana när magi låses upp, annars +30 uthållighet                                              |

Bonusar vid 2, 3 och 4 delar finns i set.json.

## 7. Attribut och formler

- Magic Find: effektiv MF = MF × k / (MF + k) med k = 600 för Sällsynt, 500 för Set och 250 för Legendarisk. Magisk får full MF. MF 200 % ger Legendarisk 111 %. Chans = grundchans × (1 + effektiv MF/100) × nivåfaktor × bossbonus.
- Liv: (klassens HP + tillväxt + platt) × (1 + procent).
- Uthållighet: driver färdigheter, undanmanöver och block. Regen 8 per sekund, sänks av tung rustning, aldrig under 2.
- Mana: blir en egen resurs när magi låses upp via runorna. Uthållighet driver fortfarande vapenfärdigheter, mana bara magi. Föremål med mana visar värdet grått tills dess och ger hälften som uthållighet.
- Försvar: hälften av totalt försvar dras platt från varje träff (minst 1 skada) och försvar × 10 är försvarsvärde mot fiendens träffchans.
- Blockchans: sköld plus bonusar, halveras när man springer, tak 75 %. Ingen block bakifrån.
- Träffchans: 2 × AR / (AR + DR) × anfallarnivå / (anfallarnivå + försvararnivå), golv 5 %, tak 95 %.
- Krosslag (Strong hit): chans tak 50 %, tar 25 % av fiendens nuvarande HP, mot bossar 10 % och högst 3 % av max HP per träff.
- Krit: tak 50 %, skada × 1,75. Fart: fartstraff tak 20 %.

## 8. Etiketter med Alt

- Håll Alt för att visa etiketter; ett val i inställningarna låter Alt växla av och på.
- Etiketten visar namnet i kvalitetsfärg på mörk halvgenomskinlig platta (#000000 med 70 % opacitet). Guld visas som "123 guld" i guldfärg, drycker i sina egna färger.
- Klick på etiketten går till föremålet och plockar upp det. Guld plockas automatiskt när man går över det.
- Etiketter som skulle överlappa staplas uppåt i en kolumn ovanför föremålet, med en tunn linje ner till marken. Max 12 synliga, sorterade efter kvalitet (Legendarisk och Set överst).
- Legendarisk och Set får en ljuspelare i sin färg och ett ljud när de faller, även utan Alt.
- Hovra visar jämförelse med utrustat föremål.

## Lorebok (tangent H)

- H öppnar och stänger loreboken, Esc stänger. Spelet pausas inte men hjälten tar inte emot input.
- Innehåll: lorebok.json med två flikar, Set (5 set med 5 delar var) och Legendariska föremål (20), totalt 50 poster.
- Upplåsning: en post visas som mörk siluett med ??? tills föremålet plockats upp första gången; då visas namn, ikon, egenskaper och lore. Setnamn syns direkt, delar låses upp var för sig, setbonusar syns när första delen hittats. Upplåsningen sparas per sparfil och följer med även om föremålet säljs.
- UI layout: gammal läderbunden bok på mörk bakgrund. Vänster sida en lista eller rutnät med ikoner i kvalitetsfärg (guld för legendariska, grönt för set) och räknare som 12/50. Höger sida stor föremålsbild, namn i kvalitetsfärg, bastyp och item level, egenskaper och lore i kursiv sepia text. Siluetter visas i mörkgrått #2a2a2a. En liten glöd och ljud när en ny post låses upp, plus en notis "Ny post i loreboken (H)".

## Notis till Utvecklare

Algoritm när ett monster dör:

1. Drop eller inte: slå mot drop_chance (monstrets override eller familjens). Bossar droppar alltid, drops gånger.
2. Beväpnat monster: slå weapon_drop först; träff ger ett vapen av den typen.
3. Kategori: viktat slumpval ur familjens category_weights (eller monstrets override). Guld rullas separat mot gold_chance.
4. Bastyp: räkna ilvl (monster_level, plus 1 för unik, plus 2 för boss) och filtrera baser i kategorin där item_level ≤ ilvl; den högsta tillåtna tiern väger 3, lägre 1.
5. Kvalitet (bara vapen, rustning, smycken): gå igenom roll_order, slå p(q) med MF enligt attribut.json; första träff vinner. Set och Legendarisk faller tillbaka om inget passar basen.
6. Affix: för Magisk och Sällsynt, välj antal enligt kvaliteten, välj slumpvis affix som tillåter platsen och vars tier har min_ilvl ≤ ilvl (1, 9, 18), slumpa värde inom intervallet.
7. Drycker väljs med tier vikterna.
8. Lägg föremålet på marken med en liten slumpad förskjutning och skapa etikett.
   Använd ett seedat slumptal per drop för att kunna återskapa buggar. Spara föremål som objekt {base, quality, affixes, ilvl}.

## Notis till UI

- Ikoner för 21 vapenbaser, 3 sköldar, kastspjut och pilar, 17 rustningsbaser, 4 smycken, 4 drycker, 4 material och guldhögar i tre storlekar.
- Unika ikoner för 22 legendariska föremål (visuella beskrivningar i foremal_bas.json, fältet visual) och 30 setdelar.
- Kvalitetsfärger: vit #e8e8e8, blå #6a6aff, gul #ffff64, grön #00c400, guld #c7a35a. Ljuspelare i grönt och guld.
- Inventarie och utrustning med platser för vapen, sköld, hjälm, bröst, handskar, bälte, stövlar, amulett, 2 ringar och dryckesbälte.
- Tooltip: namn i kvalitetsfärg, bas i grått, skada eller försvar, krav i rött om de inte uppfylls, affix i blått, setbonusar i grönt (aktiva ljusa, inaktiva mörka), vilande mana i grått.
- Ikoner för skadetyperna hugg, stick och kross samt för block, krosslag och Magic Find.
