# Leverans: loadingskärm (#132)

Skärmen ska synas direkt när sidan öppnas, innan PixiJS och tunga sprites. CSS-först: färger och Cinzel räcker utan bilder. Assets är tillval för polish.

## Placering i repo
Källa: `spel/grafik/meny/loading/`
I spelet: `public/assets/ui/loading/` (samma mapp som övrig meny-UI: titel, knapp, bg).

## Filer för första målning (summa ca 55 KB)
| Fil | Mått | Storlek | Roll |
|---|---|---|---|
| loading.css | – | ~3,8 KB | layout, palett, progress |
| titel.webp | 360×172 | ~48 KB | logotyp (valfri) |
| runa.webp | 256×256 | ~2 KB | svag bakgrundsruna #4a6a7a |
| runsten.webp | 96×144 | ~2 KB | mask, fylls underifrån |
| stenram.webp | 128×128 | ~0,5 KB | 9-slice stenram |
| progress_track.webp | 320×16 | &lt;1 KB | listens skål |
| progress_fill.webp | 320×16 | &lt;1 KB | fyllning gastljus |
| progress_fill_rod.webp | 320×16 | &lt;1 KB | valfri röd fyllning |
| snippet.html | – | – | exempelmarkup till index.html |
| README.md | – | – | kort bruk |

PNG-varianter av runa/runsten/stenram/progress_* finns som källa bredvid. `titel.png` levereras inte (för stor).

## Vad som ska in i index.html
1. Cinzel finns redan via Google Fonts i head (behåll).
2. Infoga markup från `snippet.html` i `<body>` före `#app` (eller `#fade`).
3. Länka `assets/ui/loading/loading.css` (relativt BASE_URL, t.ex. med Vite: använd samma `import.meta.env.BASE_URL` som övriga assets, eller skriv sökvägen i den statiska HTML:en som `./assets/ui/loading/loading.css` efter build).
4. För absolut första målning utan nätverksbilder: ta bort `class="rk-has-art"` så bara CSS-text och CSS-list ritas. Lägg till `rk-has-art` när (eller om) bilderna är cachade, eller låt den stå kvar: webp:erna är små.
5. Inline fallback-färg på body: `background:#0d0f12` så det aldrig är tomt svart utan avsikt.

### Progress 0..1 (ingen ny grafik per procent)
```js
const el = document.getElementById('rk-loading');
function setProgress(p) { // p i [0, 1]
  el.style.setProperty('--rk-p', String(p));
  el.setAttribute('aria-valuenow', String(Math.round(p * 100)));
  const t = el.querySelector('[data-rk-pct]');
  if (t) t.textContent = String(Math.round(p * 100));
}
// när klar:
el.classList.add('rk-done'); // fade ut, ta sedan bort ur DOM
```
- Listen fylls vänster → höger (`width: calc(var(--rk-p) * 100%)`).
- Runstenen fylls underifrån (`height: calc(var(--rk-p) * 100%)` med CSS-mask).
- Färg: gastljus `#4a6a7a` → `#6a9aaa`. Valfritt byt till `progress_fill_rod.webp` / `--rk-rod #c0182a` nära 100 %.
- Text: svensk `Världen vaknar` i `.rk-sub` (data-i18n=`loading.hint` för senare i18n). Procent i `[data-rk-pct]`.

### Placering och storlek
- Overlay: `position:fixed; inset:0; z-index:9999`.
- Titelbild: maxbredd 360 px, centrerad.
- CSS-titel: Cinzel 700, letter-spacing 0.12em, text-shadow med röd glöd `rgba(192,24,42,.35)`.
- List: maxbredd 360 px, höjd 10–12 px, centrerad under runstenen.
- Runsten: 48×72 px visad (källa 96×144).

## CSS utan bilder (minimum)
```css
body{background:#0d0f12;margin:0}
#rk-loading{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;
  background:#0d0f12;font-family:Cinzel,serif;color:#e6dfcc}
#rk-loading .rk-title{font:700 40px Cinzel,serif;letter-spacing:.12em;text-transform:uppercase;
  text-shadow:0 0 18px rgba(192,24,42,.35)}
#rk-loading .rk-bar{width:360px;height:10px;background:#0a0c0e;border:1px solid #2a2e34;border-radius:6px;overflow:hidden}
#rk-loading .rk-bar-fill{height:100%;width:calc(var(--rk-p,0)*100%);
  background:linear-gradient(90deg,#2a4050,#4a6a7a,#6a9aaa)}
```

## Preview
`/workspace/spel/grafik/preview_loading.png`: fyra paneler (CSS 0 %, assets 0 %, ca 40 %, 100 %).

## Saknas / kodarens jobb
- Koppla `setProgress` till faktisk asset-laddning i `Assets.ts` / `main.ts` (räkna laddade texturer eller bytes).
- Dölj och ta bort `#rk-loading` när menyn är redo (`SaveModule.ready` + första meny-paint).
- i18n-nycklar `loading.hint` / `loading.aria` (sv/en).
- Vite BASE_URL för sökvägar i Pages-deploy (`/rpg-demo/`).
- Eventuell röd fill nära 100 % är valfri.
