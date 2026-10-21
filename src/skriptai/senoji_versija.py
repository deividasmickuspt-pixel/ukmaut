# Senoji versija (ukmaut.vercel.app/senas/): 2026-10-15 puslapis su naujausiais reisų duomenimis -> ../senas/index.html
# Programa ir išvaizda – senos (src/senas/senoji_2026-10-15.html), keičiami tik įmontuoti duomenys D ir TT.
import json
s=open('senas/senoji_2026-10-15.html',encoding='utf-8').read()
def swap(s,name,path):
    i=s.index('const '+name+'=')+len('const '+name+'='); _,n=json.JSONDecoder().raw_decode(s[i:])
    return s[:i]+open(path,encoding='utf-8').read().strip()+s[i+n:]
s=swap(s,'D','tarpiniai/planuoklio_duomenys.json')
s=swap(s,'TT','tarpiniai/tvarkarasciai.json')
old='<span class="beta" title="Puslapis dar tikrinamas – galimi netikslumai">bandomoji versija</span>'
assert old in s
s=s.replace(old,'<a class="beta" href="/" style="text-decoration:none;color:inherit" title="Atidaryti naują versiją">senoji versija · išbandykite naują →</a>')
s=s.replace('<title>','<title>Senoji versija – ',1)
import os; os.makedirs('../senas',exist_ok=True)
open('../senas/index.html','w',encoding='utf-8').write(s); print('senoji versija:',len(s)//1024,'KB')
