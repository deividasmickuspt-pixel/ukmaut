# Ukmergės miesto autobusai – perdavimas (atnaujinta 2026-10-20)

## Kas tai
Statinis puslapis **ukmaut.vercel.app** (failas `index.html`, ~460 KB): žemėlapis, maršrutai, stotelių tvarkaraščiai, kelionės planuoklis, interaktyvi instrukcija. Be serverio ir duomenų bazės. Kodas: GitHub `deividasmickuspt-pixel/ukmaut`, Vercel projektas `ukmaut` (komanda „MyDep's“), atnaujinama per push į `main`; kitos šakos – peržiūros nuorodos.
Autorius: Deividas Mickus (asmeninė iniciatyva, bandomoji versija). Atsiliepimai – Google forma (mygtukas „!“, `FEEDBACK_URL` `src/puslapis/programa.js` pradžioje).

## Duomenų šaltiniai
1. **AP darbo grafikai nuo 2026-10-05, atnaujinti nuo 2026-10-19** (Excel iš J. Skapienės; `2.xlsx`, `4.xlsx`, `nauji_darbo_dienomis.xlsx`, savaitgalio failas; 2026-10-20 gauti nauji `nauji_darbo_dienomis.xlsx` ir `NAUJAUSIAS (AST MIEST. Savaitgaliais)` – Excel failai į saugyklą nekeliami). Visi 7 maršrutai, darbo ir poilsio dienos → `src/duomenys/reisai.json`. Plakatų laikai nebenaudojami.
2. Stotelės: VINTRA GTFS + rankinės pataisos (`src/duomenys/stoteles.json`, `confirmed`); 24 dar nepatikrintos vietoje.
3. OSM (`duomenys/export.osm`) – gatvės ir įmontuotas žemėlapio pagrindas (`basemap.json`).

## Tilto remontas
Darbo dienomis visą dieną į Užupį – apylanka per magistralę; poilsio dienomis – per tiltą abiem kryptimis. Žemėlapyje du režimai (`D`/`O`).

## Autobusai ir numerių keitimas (`blk`)
| Autobusas | Diena |
|---|---|
| 1-1, 1-2 | tik 1 (nuo 2026-10-20 visi 1 maršruto darbo dienų reisai `reisai.json` pažymėti `blk` 1-1 / 1-2 pagal Excel lapus) |
| 2-1 | 4:15 AS→Biofabrikas (2); 4:36 Biofabrikas → Pašilė 5:20, 5:40 Pašilė → Deltuva; ratai 2; vakare 19:47 AS→Biofabrikas, 20:35 Biofabrikas → Pašilė 21:20, 21:40 Pašilė → Žiedo 21:59 (visi **2**); 23:15 Narbute → **4** iki Pašilės 0:06 → **5** iki Žiedo 0:21 (*spėjimas*) |
| 2-2 | tik 2 |
| 4-1 | tik 4; nuo 10-19 pradeda 4:45 pilna trasa (Pašilė 5:16), 5:25 atgal, 6:19 iš Pašilės |
| 4-2 | 4:45 trumpuoju keliu (Boruvka → Pušų) → Pašilėje **5** (5:10) → Narbute **1** (5:50) – tebegalioja nuo 10-19; popietė 4 → Pašilėje **5** (13:42) → Narbute **4** (14:45, „TIKRINTI“) |
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
- **Telefone** (≤820 px; ~90 % lankytojų): kompaktiška antraštė (pavadinimas – nuoroda į pradžią) su meniu ☰ (maršruto planuoklis, maršrutai, „Kaip naudotis“, klaidų forma, įsidiegimas, prieinamumo deklaracija; vietoj ? ir !); žemėlapis (aukštis – ¾ pločio) tik su mažais geltonais stotelių taškais (be maršrutų linijų ir užrašų) su „Padidinti“; rezultatai iškart po juo; tilto pranešimas išskleidžiamas; instrukcija pati nesirodo. Du „puslapiai“ (`page` programa.js): planuoklis ir maršrutai/stotelės/tvarkaraščiai (`#marsrutai`, veikia telefono „Atgal“; maršrutas atsidaro skirtuke `routeTab` po „Maršrutai ir tvarkaraščiai“ antrašte, uždaromas ✕ arba „Atgal“; puslapis – tik sąrašas, be žemėlapio (žemėlapis paslėptas, jo judinimas tada nieko nedaro); atidarius maršrutą (`routeBodyPhone`): be dienos mygtukų, kryptis → visos krypties stotelės viename sąraše (sudarytos iš tikrų reisų atkarpų `tripRuns`/`rbOrder`; stotelės, pro kurias važiuoja <50 % reisų – punktyru „tik dalis reisų“); jei poilsio dienų maršrutas kitoks (2, 4, 6) – nuoroda „rodyti poilsio dienų ›“ (`rbDay`); be kitų maršrutų ženkliukų ir „Kiti reisai“; paspausta stotelė iškart atidaro tos stotelės to maršruto laikus skirtuke su ✕, telefono „Atgal“ uždaro; slenka tik sąrašas, poraštė – sąrašo gale `.pfoot`); planuoklio žemėlapyje paspaudus stotelę – langelis „Iš čia / Į čia“ (`stopPopup`), niekur neperjungiant; pasirinkta išvykimo stotelė žalia, atvykimo – raudona (`markSel`). Mygtukas 📍 (`locateMe`): telefono vieta (niekur nesiunčiama) – mėlynas taškas ir artimiausios stotelės langelis. Kompiuterio vaizdas nepakeistas.
- **Kryptis pagal galinę stotelę** (`legTo`, `DIRAT`/`dirTxt` programa.js): planuoklio rezultatuose, žemėlapio užrašuose, stotelės langelyje ir tvarkaraščio antraštėje vietoj senų „link centro“ (`TT.hint`, nebenaudojama) rodoma oficiali maršruto kryptis, pvz. „kryptis Pašilė“ (iš reisų, kurie iš tos stotelės išvyksta; daugiausia 3, ≥20 % reisų). Atidarius maršrutą – to maršruto kryptis. Tvarkaraščio blokų „kryptis“ – kaip plakate.
- **Atsimenamos paieškos** (paskutinės 3, `localStorage` – tik tame telefone ir naršyklėje): telefone atidarius iškart rodomi artimiausi reisai, greiti mygtukai po planuokliu. **Nuoroda su stotelėmis** `?is=Kauno&i=Pašilė` (veikia bet kur), mygtukas 🔗 dalintis. Laikas – „dabar“, kol žmogus jo nepakeičia; grįžus į puslapį po >15 min. jis perkraunamas.
- **PWA**: galima įsidėti į telefono ekraną (Android – naršyklės pasiūlymas, iPhone – instrukcija), veikia be interneto.
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
2026-10-19 Excel'yje rasta ir pataisyta: 2-2 Dariaus ir Girėno 6:29→6:19, 2-1P 15:24→15:09, 4-1 4:45 reise Sodai/Dukstynos k. 4:45/4:47→4:47/4:48; 4-2 lape du 6:51/6:55 stulpeliai – galioja 6:55; 2-1 lape senas 4:40 rytinis – galioja 4:15; 2-1P 13:38 reise Smėlių 14:02 → Kęstučio a. 14:03 (1 min) – palikta kaip Excel'yje.
2-1 naktiniai numeriai (23:15, 0:06); 14:45 nuo Narbuto („TIKRINTI“); ~~4:37 iš Kęstučio a.~~ (nuo 10-19 nebėra); „narbutas pietinis“; Biofabrikas link Deltuvos – atskira stotelė?; įvertintas atvykimas Narbuto 21:56.

## Kiti žingsniai
1. **Vienas duomenų šaltinis**: lentelė Stotelės (ID, pavadinimas, pusė, koord.) / Reisai (ID, maršruto Nr., dienos, autobusas `blk`, kryptis, pastaba) / Laikai (reiso ID, eilė, stotelė, laikas); generavimas tik iš jos; automatinis patikrinimas; GTFS eksportas (stops.lt / Google Maps).
2. Įkelti naujus laikų papildymus; pataisyti numerių keitimo klaidas.
3. Galimai: vietos planuoklyje (ligoninė, turgus… → artimiausia stotelė iš OSM), Vercel Web Analytics, kodo išvalymas.
