# Utrustning som lager (paper doll), ärende #87, test med riddaren

Kör: `python3 bygg_utrustning.py` (bygger alla lager), `python3 kontroll.py` (verifierar), `python3 forhands_utrustning.py` (utrustning_forhands.gif).

## Format
* Ett ark per anim och lager: `riddare_<anim>_<lager>_8dir.png/.json`. Arket har exakt samma layout, bildmått och JSON nycklar som kroppsarket (image, frameW, frameH, anchor, dirs, frames, fps, loop, hitFrame där den finns, rects). Två nycklar tillkommer:
  * `layer`: lagrets namn.
  * `order`: per riktning en lista med lager nerifrån och upp, t.ex. `"N": ["svard_bak","bas","rustning","svard_fram"]`.
* Kroppen motsvaras av lagret `bas`. Ritas varje lager i ordningen med samma rect och samma ankare som kroppen blir resultatet dagens riddare.
* `riddare_utrustning.json` är ett index: anims, kroppsark per anim, lagerfiler, ordning och `svardPixlar` (antal svärdpixlar utanför och över kroppen per riktning, som hjälp när andra vapen ska ritas bakom eller framför).
* Anims: idle (från 2d/sprites, 1 frame), walk (12f fps 18), run (12f fps 28), attack (6f), dodge (6f). Död finns inte än.

## Lager
* `bas`: kroppen i enkel underdräkt. Metallpixlar (hjälm, ringbrynja, plåt) är omfärgade till ljusbrunt tyg med samma ljushet, så formen är densamma. Där svärdet låg över kroppen är ytan ifylld (inpaint). Vapenröret utanför kroppen är borttaget. Surcoat och sköld ligger kvar i bas.
* `rustning`: originalpixlarna för metallen, inklusive hjälmen.
* `svard_bak`: svärdpixlar utanför kroppens kontur. `svard_fram`: svärdpixlar över kroppen. Delningen gör att ett vapen kan ligga bakom kroppen utan att handtaget försvinner.

## Lägga till fler
* Ny rustningsnivå: ett nytt ark i samma layout som `rustning` (samma frames och ankare), t.ex. `riddare_<anim>_rustning_lader_8dir`, som ritas på bas på samma plats i `order`.
* Nytt vapen: två ark `<vapen>_bak` och `<vapen>_fram` som ersätter `svard_bak` och `svard_fram` i ordningen. `svardPixlar` visar per riktning om vapnet mest syns bredvid eller över kroppen.
* Hjälm: separera i ett eget lager över `rustning` (görs inte än).

## Metod
Segmentering av befintliga frames med färg och form: metall har låg Lab kroma (under 9). Svärdet hittas som tunna, raka utskott ur kroppens kontur (öppning med radie 4), linjen anpassas med PCA och följs över kroppen så länge ljus metall syns. Vita svepbågar i attack följer med svärdet. Lagren bygger på samma pixlar, så de passar per konstruktion.
