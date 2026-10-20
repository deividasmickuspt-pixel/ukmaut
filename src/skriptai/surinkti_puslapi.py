# Surenka galutinį puslapį: šablonas (HTML + CSS) + duomenys + programa -> ../index.html
t=open('puslapis/sablonas.html',encoding='utf-8').read()
out=t+'const D='+open('tarpiniai/planuoklio_duomenys.json').read()+';\nconst TT='+open('tarpiniai/tvarkarasciai.json').read()+';\nconst BASEMAP='+open('duomenys/zemelapio_fonas.json').read()+';\n'+open('puslapis/programa.js',encoding='utf-8').read()+'</script>\n</body>\n</html>'
open('../index.html','w',encoding='utf-8').write(out); print('ok',len(out)//1024,'KB')
