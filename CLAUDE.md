# Ukmergės miesto autobusai (ukmaut) – instrukcija Claude Code

Pirmiausia perskaityk **PERDAVIMAS.md** – ten visa projekto logika ir istorija.

## Svarbiausia
- Svetainė: https://ukmaut.vercel.app – Vercel rodo **`index.html`** saugyklos šaknyje (statinis failas, be serverio).
- Visa „virtuvė“ yra **`src/`**. Perstatymas: `sh src/perstatyti.sh` → sugeneruoja `index.html` saugyklos šaknyje.
- Po pakeitimų: commit + push į **darbo šaką** → Vercel sukuria peržiūros nuorodą (apsaugota Vercel prisijungimu). Į `main` (tikra svetainė) – tik naudotojui patvirtinus, per Pull Request.
- `src/`, `CLAUDE.md`, `PERDAVIMAS.md` į svetainę neįkeliami (`.vercelignore`).
- Naudotojas: Deividas, rašo lietuviškai, programavimo patirties neturi – aiškink paprastai, prieš didelius pakeitimus pasitark.

## Priklausomybės
- Python 3 (tik standartinė biblioteka).
- `src/duomenys/osm_gatves.osm` – OSM gatvės naujoms atkarpoms (`zemelapio_linijos.py --geom`).
- Seni grafikų įvedimo skriptai (`ovr_*.py`) į saugyklą neįkelti: dalis jų skaitė AP Excel failus, kurių nėra, o 1 maršruto darbo dienų skriptas pasenęs. Vienintelis tikras reisų šaltinis – `src/duomenys/reisai.json`.

## Kur kas (trumpai)
Visos komandos leidžiamos iš `src/` (skriptai naudoja kelius `duomenys/…`, `tarpiniai/…`; `perstatyti.sh` nustato `PYTHONPATH=duomenys`).

`src/duomenys/` – įvesties duomenys:
- `reisai.json` – **visi reisai** (laikai) iš AP grafikų: `{route, day: W|WE|Sat, trips:[{dest, note, blk, tail, nodep, stops:[[poster_id,"HH:MM"],…]}]}`. `blk` = autobusas (grafikas, pvz. „4-2“) – pagal jį planuoklis žino, kur keičiasi maršruto numeris.
- `stoteles.json` – stotelės (id, pavadinimas, pusė, koordinatės).
- `marsrutu_trasos.py` – maršrutų trasos ir variantai (stotelių sekos), importuojamas kaip `marsrutu_trasos`.
- `gatviu_atkarpos.json` – linijų geometrija tarp stotelių; `zemelapio_fonas.json` – įmontuotas žemėlapio pagrindas; `osm_gatves.osm` – OSM gatvės.
- `plakatu_laikai.json`, `plakatu_reisai.json`, `excel_reisai.json` – seni šaltiniai (plakatai, pirmas Excel ištraukimas). Vis dar skaitomi (krypčių užrašai, `keep` stotelės, atsarginis variantas), bet jų laikus perrašo `reisai.json`.

`src/skriptai/` – perstatymo žingsniai (eilė – `perstatyti.sh`):
- `tvarkarasciai.py` → `tarpiniai/tvarkarasciai.json` (stotelių tvarkaraščiai);
- `planuoklio_reisai.py` → `tarpiniai/planuoklio_duomenys.json` (reisai planuokliui);
- `zemelapio_linijos.py` (+ `--geom`: trūkstamos atkarpos per `gatviu_marsrutai.py`) – linijos, kryptys;
- `atkarpu_galai.py` – atkarpų galai iki stotelių; `autobuso_ratai.py` – 1 maršruto Dukstynos ratai;
- `ejimo_keliai.py` – pėsčiųjų keliai OSM gatvėmis tarp artimų stotelių (planuoklio ėjimo linijos);
- `surinkti_puslapi.py` – `puslapis/sablonas.html` + duomenys + `puslapis/programa.js` → `../index.html`.

`src/puslapis/` – `sablonas.html` (HTML/CSS „galva“, baigiasi `<script>`; čia ir favicon bei Vercel Web Analytics) ir `programa.js` (visa logika: planuoklis `computePlan`/`findTrips`, instrukcija `TOUR`, žemėlapis).

`src/tarpiniai/` – generuojami failai, į git neįtraukiami.

Saugyklos šaknyje (ranka redaguojami, ne generuojami): `manifest.webmanifest`, `sw.js` (veikimas be interneto: puslapis pirmiausia iš tinklo, be ryšio – kopija; pakeitus saugomų failų sąrašą, padidinti `CACHE` versiją), `icons/`, `favicon.svg`, `vercel.json`.

## Tikrinimas po pakeitimų
- `node --check src/puslapis/programa.js`
- Atidaryti `index.html` naršyklėje: maršrutai, stotelės, planuoklis (pvz. Kauno → Pašilė darbo dieną 8:00; Autobusų stotis → Muziejus 9:45; Gėlių → Pramonės 14:01).

## Kitas planuojamas darbas
Perkelti visus duomenis į **vieną lentelę** (Stotelės / Reisai / Laikai, GTFS principu) su automatiniu patikrinimu (laikai didėja, autobuso reisų grandinė nenutrūksta, visos stotelės egzistuoja) ir generuoti puslapį tik iš jos; pataisyti numerių keitimo klaidas; įkelti naujus laikų papildymus. Žr. PERDAVIMAS.md → „Kiti žingsniai“.
