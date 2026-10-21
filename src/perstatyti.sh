#!/bin/sh
# Visa perstatymo grandinė. Paleisti iš aplanko src/:  sh perstatyti.sh
set -e
cd "$(dirname "$0")"
export PYTHONPATH=duomenys
mkdir -p tarpiniai
python3 skriptai/tvarkarasciai.py > /dev/null        # stotelių tvarkaraščiai          -> tarpiniai/tvarkarasciai.json
python3 skriptai/planuoklio_reisai.py > /dev/null    # reisai planuokliui              -> tarpiniai/planuoklio_duomenys.json
python3 skriptai/zemelapio_linijos.py --geom         # trūkstamos atkarpos OSM gatvėmis -> duomenys/gatviu_atkarpos.json
python3 skriptai/atkarpu_galai.py > /dev/null        # atkarpų galai iki stotelių
python3 skriptai/planuoklio_reisai.py > /dev/null
python3 skriptai/zemelapio_linijos.py                # linijos, kryptys, „Kiti reisai“
python3 skriptai/ejimo_keliai.py                    # pėsčiųjų keliai tarp artimų stotelių -> tarpiniai/ejimo_keliai.json
python3 skriptai/surinkti_puslapi.py                 # -> ../index.html (tai, ką rodo Vercel)
echo "Paruošta: ../index.html"
