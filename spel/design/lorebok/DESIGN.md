# Lorebok – design inför TypeScript/Vite (issue #7)

Källor: `../lorebok.json` (data, v1.0) och `../loot_design.md` (avsnittet "Lorebok (tangent H)"). Grafik: `../../grafik/2d/lorebok/`.

## 1. Innehåll och kategorier

| Kategori             | id             | Poster                                                                 |
| -------------------- | -------------- | ---------------------------------------------------------------------- |
| Set                  | `set`          | 5 set med 5 delar var = 25 upplåsbara delar (setet i sig är en rubrik) |
| Legendariska föremål | `legendariska` | 20                                                                     |

Det blir totalt **45 upplåsbara poster**. loot_design.md skriver "totalt 50", men enligt lorebok.json är det 25 + 20 = 45. Räknaren ska beräknas från datan.

Postfält i datan: `id, name, quality ('set'|'legendary'), base, item_level, lore, unlock` (legendariska har också `type`, set har `class` och `pieces[]`).
Egenskaper hämtas från spelets data, inte från lorebok.json: legendariska från `foremal_bas.json` → `legendary[].fixed`, setdelar från `set.json` → `sets[].pieces[].fixed` och setbonusar från `sets[].bonuses`. Bastypens namn finns i `foremal_bas.json` (weapons/armor/jewelry).

## 2. Upplåsningsregler

| Regel (`unlock.type`)                      | Gäller                            | Effekt                                                                                                                                     |
| ------------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `hittad` (`hidden_as: 'siluett'`)          | legendariska föremål och setdelar | Posten visas som mörk siluett (#2a2a2a) med ??? tills föremålet har plockats upp en första gång. Då visas namn, bild, egenskaper och lore. |
| `forsta_del_hittad` (`name_visible: true`) | set                               | Setnamnet syns alltid. Setets bild, lore och bonusar visas när någon del har hittats.                                                      |

- En upplåsning är permanent för hjälten och följer med även om föremålet säljs.
- Id-nyckeln är det legendariska id:t eller setdelens id. Formen `<set_id>.<bas_id>` ska också godtas som alias.

## 3. Händelser som låser upp

Typad EventBus (`EventMap` i types.ts):

- `pickup(itemId, first)`: den enda händelse som låser upp poster i v1.
- `kill`, `zone_enter`, `rune`: finns i EventMap så att regler som `dodad` (unik boss) eller `zon_besokt` kan läggas till senare utan att API:t ändras. De används inte av v1-reglerna.
- Tjänsten skickar själv `lore_unlock(entryId)`. Sparning och ljud lyssnar på den.

## 4. Lagring per hjälte

- `LoreRepository` läser och skriver hjältens upplåsningar, alltså id → `{ first: ISO-tid, ilvl? }`.
- Idag finns detta i `localStorage.rpg_found`, som save.js byter ut per hjälte. Efter migreringen ska repositoryt ta emot ett `heroId` (eller en `SaveSlot`) i stället för att använda en global nyckel.
- En befintlig post skrivs aldrig över, eftersom första upplocket gäller.
- När en annan hjälte laddas byts repositoryt (eller laddas om) och modellen byggs om utan notiser.

## 5. UI (overlay)

- Tangenten **H** växlar overlayn och **Esc** stänger den. Spelet pausas inte, men hjälten tar inte emot input medan boken är öppen. **Alt** (visa loot) måste fortsätta fungera, och högerklick är fortfarande avstängt.
- H gör ingenting när hjältevalet är öppet eller när fokus ligger i ett textfält. Tangenter som redan är upptagna: B/I, Esc, Alt, Q, M och Tab.
- Layouten är en läderbunden bok med två sidor:
  - Vänster sida: flikar per kategori med räknare (t.ex. `12/45` totalt och per flik). Den har ett ikonrutnät med ram i kvalitetsfärg (guld för legendariska, grönt för set). Seten visas som grupper med rubrik och `k/5`.
  - Höger sida: stor bild (16:9), namn i kvalitetsfärg, bastyp och item level, egenskaper och lore i kursiv sepia.
- En låst post visar siluett och `???`. Siluetterna finns i `grafik/2d/lorebok/siluetter/`, eller så används ikonen med `filter: brightness(0)`.
- Vid upplåsning visas en notis i stil med "Ny post i loreboken (H)" (se `notis.css`), och rutan glöder (`upplas_glod.png`). Ljud kan kopplas på via `lore_unlock`.
- Grafik: `set/<set_id>.jpg`, `legendariska/<id>.jpg`, `bokram.jpg`, `sidbakgrund.jpg`. Med Vite kan bilderna importeras som assets i stället för att bäddas in som base64.

## 6. Klassansvar (se types.ts)

| Klass                | Ansvar                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| `LoreBook`           | Ren modell: kategorier, poster, upplåsningsstatus, räknare. Ingen DOM och ingen lagring.             |
| `LoreRepository`     | Lagring per hjälte (läsa och lägga till upplåsningar).                                               |
| `LoreUnlockService`  | Lyssnar på EventBus, tillämpar reglerna, uppdaterar repository och modell och skickar `lore_unlock`. |
| `LoreBookView`       | Overlay i DOM, tangenterna H/Esc, rendering och notis. Läser bara från modellen.                     |
| `EventBus<EventMap>` | Typad on/emit. Skickas in via konstruktorn och är inte global.                                       |

Ingen klass använder `window`-globaler. Allt kopplas ihop i en `createLoreBook(deps)` i spelets bootstrap.
