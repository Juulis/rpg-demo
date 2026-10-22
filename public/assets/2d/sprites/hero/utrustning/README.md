# Utrustning som lager (paper doll), ärende #87, test med riddaren

Kör: `python3 bygg_utrustning.py` (bygger alla lager, ca 2,5 min), `python3 kontroll.py` (verifierar), `python3 forhands_utrustning.py` (utrustning_forhands.gif).

## Format
* Ett ark per anim och lager: `riddare_<anim>_<lager>_8dir.png/.json`. Arket har exakt samma layout, bildmått och JSON nycklar som kroppsarket (image, frameW, frameH, anchor, dirs, frames, fps, loop, hitFrame där den finns, rects). Två nycklar tillkommer:
  * `layer`: lagrets namn.
  * `order`: per riktning en lista med lager nerifrån och upp.
* Ritas lagren i riktningens ordning med samma rect och ankare som kroppen blir resultatet dagens riddare (varje pixel tillhör ett lager).
* `riddare_utrustning.json` är ett index: `lager`, och per anim `kropp`, `filer`, `order` och `svardPixlar` (svärdpixlar utanför och över kroppen per riktning).
* Anims: idle (från 2d/sprites, 1 frame), walk (12f fps 18), run (12f fps 28), attack (6f), dodge (6f). Död finns inte än.

## Lager
* `bas`: kroppen med huva i stället för hjälm, utan sköld. Metall (ringbrynja, plåt) är omfärgad till ljusbrunt tyg med samma ljushet. Där svärd eller sköld låg över kroppen är ytan ifylld (inpaint); sköldyta räknas som kropp där kroppen finns högst 75 px ovanför och under i samma kolumn eller runt om; övrig sköldyta är genomskinlig.
* `rustning`: originalpixlarna för metallen utom hjälmen.
* `hjalm`: hjälmens originalpixlar.
* `skold`: sköldens originalpixlar, fram och baksida.
* `svard_bak`: svärdpixlar utanför kroppen. `svard_fram`: svärdpixlar över kroppen, inklusive klingan framför kroppen och hela svepbågen i attack.

## Ordning per riktning
* Normalt: `svard_bak, bas, rustning, hjalm, svard_fram, skold` (skölden överst).
* Där klingan någon gång i riktningen ligger över skölden: `svard_bak, bas, rustning, hjalm, skold, svard_fram`.
* Vilken riktning som har vilken står i `order` i varje JSON och i indexet.

## Lägga till fler
* Ny rustning, hjälm eller sköld: nytt ark i samma layout som motsvarande lager, ritas på samma plats i `order`.
* Nytt vapen: två ark `<vapen>_bak` och `<vapen>_fram` som ersätter svärdlagren.

## Metod
* Metall: Lab kroma under 9.
* Svärd: tunna raka utskott ur kroppens kontur (öppning radie 4), linjen anpassas med PCA och följs in över kroppen. Klingor som ligger helt över kroppen hittas med HoughLinesP på ljus metall. Svepbågar (bara attack) är långa smala ljusa komponenter med lågt kroma, plus deras halvgenomskinliga kant. Under klingan fylls basen med inpaint.
* Hjälm: största metallkomponenten i figurens översta 17 %, i basen omfärgad till huva.
* Sköld: framsida som största röda blocket, baksida som tjockaste mörka blocket (avståndstransform), sedan konvext hölje. Per riktning jämförs frames med radens median; avvikare ersätts med närmaste bra frames mask flyttad med mallmatchning, annars får frame ingen sköldmask.
