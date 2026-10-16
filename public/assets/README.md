# public/assets

Grafik och ljud som vanliga filer (inget base64). Nås i koden via `import.meta.env.BASE_URL + "assets/..."`.

## Ljud och menygrafik (Utvecklare 2, PR #19)

Koden laddar dessa filer. **De är inte incheckade än** (kräver vanlig git-push; GitHub-connectorn kan bara skriva text). Tills dess gäller fallbacks: syntetiserat ljud i stället för saknad `.ogg`, klassikon i stället för saknat porträtt, och CSS-bakgrunder som saknas lämnas tomma.

- `sfx/*.ogg` (Kenney CC0): boss, click, drop, drop_rare, gold, hit1, hit2, kill, pickup, pickup_first, portal, rune, step1, step2, step3, toggle, zone
- `ui/*.webp` (UI-boten): bg, titel, plats, tom, knapp, textfalt, save, amazonkrigare, barbar, riddare

Filerna finns avkodade (från legacy `js/sfx-data.js` / `js/menu-data.js`) i `/workspace/ts-port/public/assets/` på boxen.
