# Loadingskärm (#132)

Syns direkt när sidan öppnas, innan PixiJS. CSS-först: utan bilder räcker `#0d0f12`, Cinzel-titel och CSS-list.

## Filer (första målning, webp)
| Fil | Mått | Ca storlek | Roll |
|---|---|---|---|
| loading.css | – | ~3 KB | layout, färger, progress |
| titel.webp | 360x172 | ~45 KB | logotyp (valfri, CSS-text finns) |
| runa.webp | 256x256 | ~3 KB | svag bakgrundsruna |
| runsten.webp | 96x144 | ~4 KB | mask, fylls underifrån |
| stenram.webp | 128x128 | ~1 KB | 9-slice ram |
| progress_track.webp | 320x16 | <1 KB | listens skål |
| progress_fill.webp | 320x16 | <1 KB | listens fyllning (gastljus) |
| progress_fill_rod.webp | 320x16 | <1 KB | valfri röd fyllning nära klar |

PNG-varianter finns som källa. `titel.png` är för stor för första målning, använd webp.

## Progress 0..1
Sätt CSS-variabeln `--rk-p` på `#rk-loading` (t.ex. `0.42`). Samma värde driver listen (width) och runstenen (height underifrån). Uppdatera `aria-valuenow` och texten i `[data-rk-pct]`. Inga nya bilder per procent.

## Placering i repo
`public/assets/ui/loading/` (samma mapp som övrig meny-UI).
