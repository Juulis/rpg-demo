# Designverktyg

Python 3, inga beroenden. Kör från repots rot (eller ange designmappen som första argument). Alla läser bara data i `spel/design/` och skriver inget.

| Skript          | Vad                                                                                                                                                                                                                                   | Körs                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `spelregler.py` | Delade regler: ringar, biompooler, celler per biom och ring, vikter, `zoner()` (fältet `zones` i monsterfamiljer.json) och `grannfel()` (grannar i varld_stor.json). Importeras av de andra.                                          | importeras                                          |
| `tackning.py`   | Täckning biom x ring (0 luckor, 0 tunna celler), andel per undertyp i mellanmarken mot `max_andel`, drop-tabeller för alla monster, `fixed_levels`, `zones`, grannar och att lägrets NPC:er står inom 12 enheter från lägerelden.     | `python3 spel/design/verktyg/tackning.py`           |
| `tathet.py`     | XP och nivå per ring med tätheten i data (mellanmark, regioner, delområden, bossar). `--forslag` räknar boss_xp_faktor per akt (monster_niva.json), `--forslag-tathet` räknar mellanmarkens täthet per ring mot `malniva_yttre_kant`. | `python3 spel/design/verktyg/tathet.py [--forslag]` |
| `akt1.py`       | XP-takt i akt 1 delområde för delområde: hela akt 1 och kortaste vägen (bana1_stor.json nivakurva.maltavla och kortaste_vag).                                                                                                         | `python3 spel/design/verktyg/akt1.py`               |

Räkna om med `tathet.py` och `akt1.py` när täthet, monstrens XP eller boss_xp_faktor ändras, och för in siffrorna i `varldsgenerator.json monsterpooler.tathet.resultat`, `monster_niva.json boss_xp_faktor.resultat` och `bana1_stor.json nivakurva`. Kör `tackning.py` efter varje ändring av monster, biom eller regioner; den ska skriva `luckor: 0` och inga fel utöver rader märkta INFO.
