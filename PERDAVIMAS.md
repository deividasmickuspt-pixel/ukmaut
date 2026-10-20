# Ukmergės miesto autobusai – perdavimas (atnaujinta 2026-10-20)

## Kas tai
Statinis puslapis **ukmaut.vercel.app** (failas `index.html`, ~460 KB): žemėlapis, maršrutai, stotelių tvarkaraščiai, kelionės planuoklis, interaktyvi instrukcija. Be serverio ir duomenų bazės. Kodas: GitHub `deividasmickuspt-pixel/ukmaut`, Vercel projektas `ukmaut` (komanda „MyDep's“), atnaujinama per push į `main`; kitos šakos – peržiūros nuorodos.
Autorius: Deividas Mickus (asmeninė iniciatyva, bandomoji versija). Atsiliepimai – Google forma (mygtukas „!“, `FEEDBACK_URL` `src/puslapis/programa.js` pradžioje).

## Duomenų šaltiniai
1. **AP darbo grafikai nuo 2026-10-05** (Excel iš J. Skapienės; `2.xlsx`, `4.xlsx`, `nauji_darbo_dienomis.xlsx`, savaitgalio failas). Visi 7 maršrutai, darbo ir poilsio dienos → `src/duomenys/reisai.json`. Plakatų laikai nebenaudojami.
2. Stotelės: VINTRA GTFS + rankinės pataisos (`src/duomenys/stoteles.json`, `confirmed`); 24 dar nepatikrintos vietoje.
3. OSM (`duomenys/export.osm`) – gatvės ir įmontuotas žemėlapio pagrindas (`basemap.json`).

## Tilto remontas
Darbo dienomis visą dieną į Užupį – apylanka per magistralę; poilsio dienomis – per tiltą abiem kryptimis. Žemėlapyje du režimai (`D`/`O`).

## Autobusai ir numerių keitimas (`blk`)
| Autobusas | Diena |
|---|---|
| 1-1, 1-2 | tik 1 |
| 2-1 | 4:40 AS→Biofabrikas (2), ratai 2; paskutinis Deltuva 20:50 → Narbuto 21:56 (atvykimas įvertintas); 23:15 Narbute → **4** iki Pašilės 0:06 → **5** iki Žiedo 0:18 (*spėjimas*) |
| 2-2 | tik 2 |
| 4-1 | tik 4 |
| 4-2 | 4 → Pašilėje **5** (5:10) → Narbute **1** (5:50); popietė 4 → Pašilėje **5** (13:42) → Narbute **4** (14:45, „TIKRINTI“) |
| 6-1 / 6-2 | 6 (AS→Žaliasis) → **7** iki Narbuto → **1** (6:00 / 14:45) → 6 ratai |

## Planuoklio taisyklės (`computePlan`, `findTrips` – `src/puslapis/programa.js`)
- Tiesiogiai arba su 1 persėdimu; „likite autobuse“, kai tas pats `blk` tęsia kitu numeriu.
- Ėjimas: pradžioje (iki 400 m nuo pasirinktos stotelės; ≤120 m = „ta pati vieta“), persėdant (≤400 m), pabaigoje (≤400 m); daugiausia 2 ėjimai.
- Atmetama: 0 min važiavimai, važiavimai tarp gretimų (≤150 m) stotelių, ėjimai ne trumpesni už visą kelią pėsčiomis, važiavimai >1,6× ilgesni už trumpiausią variantą, kelionės >1,5×+10 min ilgesnės už greičiausią.
- Lygus atvykimas → trumpesnis kelias (km, min autobuse). Rikiuojama pagal atvykimą; pirmas „⭐ Rekomenduojama“.
- „Pėsčiomis bus greičiau“: stotelės ≤1,2 km ir autobusas gerokai lėtesnis (ratai šalinami); 1,2–2 km – pasiūlymas šalia.
- Atsarginiai variantai: ilgesnis ėjimas (≤800 m) → kitos dienos (iki 3 d., visa diena).
- Data → dienos tipas automatiškai (savaitgaliai + LT valstybinės šventės, Velykos).
- Auditas (visos poros × 4 laikai, 8 648 paieškos): 92 % protinga, 6 % pėsčiomis, 1,5 % ilgas ratas be alternatyvos (retai aptarnaujamos stotelės: Gamyklų, Gėlių, Narbuto, Deltuva), 0 „nieko nerasta“.

## Sąsaja
- Antraštė (pavadinimas, „Bandomoji versija“, mygtukai „?“ instrukcija ir „!“ forma) ir poraštė (autorius, žemėlapio autoriai, prieinamumo deklaracija) per visą plotį.
- Kompiuteryje: žemėlapis (apvalinti kampai) virš planuoklio, dešinėje skydelis; telefone: antraštė → planuoklis → žemėlapis → rezultatai/maršrutai.
- Pradinis vaizdas rodo šiandienos schemą; dienos mygtukai tik maršruto ir stotelės vaizde. Rodant planuoklio rezultatus maršrutų sąrašas paslėptas.
- Visada šviesus dizainas (tamsus režimas išjungtas: `color-scheme: light only`).
- Instrukcija `TOUR` (9 žingsniai su gyvais pavyzdžiais; telefone kortelė apačioje, braukimas).

## Prieinamumas
axe-core (WCAG 2.0/2.1/2.2 A+AA) – 0 pažeidimų. Žemėlapio elementai be fokuso ir paslėpti nuo skaitytuvų (info yra tekstu); DOM tvarka antraštė→planuoklis→žemėlapis→`main`; „praleisti“ nuorodos; `role=status` pranešimai; deklaracija (`<dialog id="a11ydlg">`). Dar reikia testų su ekrano skaitytuvais ir žmonėmis.

## Failai (`src/`)
- `perstatyti.sh` – vienas paleidimas surenka `index.html`.
- `duomenys/` – `reisai.json` (visi reisai), `stoteles.json`, `marsrutu_trasos.py`, `gatviu_atkarpos.json`, `zemelapio_fonas.json`, `osm_gatves.osm`; seni šaltiniai `plakatu_laikai.json`, `plakatu_reisai.json`, `excel_reisai.json`.
- `skriptai/` – `tvarkarasciai.py`, `planuoklio_reisai.py`, `zemelapio_linijos.py`, `atkarpu_galai.py`, `gatviu_marsrutai.py`, `autobuso_ratai.py`, `surinkti_puslapi.py`.
- `puslapis/` – `sablonas.html` (išvaizda) ir `programa.js` (logika).
- 2026-10-20 failai pervadinti pagal paskirtį; seni pagalbiniai ir `ovr_*.py` skriptai nebeįkelti (jų rezultatas – `duomenys/reisai.json`). Perstatytas puslapis patikrintas: visos 17 296 planuoklio paieškos sutampa su ankstesne versija.

## Atviri klausimai AS
2-1 naktiniai numeriai (23:15, 0:06); 14:45 nuo Narbuto („TIKRINTI“); 4:37 iš Kęstučio a. keleivinis?; „narbutas pietinis“; Biofabrikas link Deltuvos – atskira stotelė?; įvertintas atvykimas Narbuto 21:56.

## Kiti žingsniai
1. **Vienas duomenų šaltinis**: lentelė Stotelės (ID, pavadinimas, pusė, koord.) / Reisai (ID, maršruto Nr., dienos, autobusas `blk`, kryptis, pastaba) / Laikai (reiso ID, eilė, stotelė, laikas); generavimas tik iš jos; automatinis patikrinimas; GTFS eksportas (stops.lt / Google Maps).
2. Įkelti naujus laikų papildymus; pataisyti numerių keitimo klaidas.
3. Galimai: vietos planuoklyje (ligoninė, turgus… → artimiausia stotelė iš OSM), Vercel Web Analytics, kodo išvalymas.
