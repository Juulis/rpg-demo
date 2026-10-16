# Assets (TS/Vite)

Koden laddar binärer från dessa sökvägar (Vite serverar `public/` från roten):

- `public/assets/sfx/<namn>.ogg`: boss, click, drop, drop_rare, gold, hit1, hit2, kill, pickup, pickup_first, portal, rune, step1, step2, step3, toggle, zone (Kenney CC0, avkodade från `js/sfx-data.js`)
- `public/assets/ui/<namn>.webp`: bg, titel, plats, tom, knapp, textfalt, save, amazonkrigare, barbar, riddare (avkodade från `js/menu-data.js`)

Filerna kräver en vanlig git-push (GitHub-connectorn kan bara skriva textfiler). Saknas en ljudfil används syntetiserad reserv; saknas ett porträtt visas klassikonen.
