import json,collections,re
L=json.load(open('duomenys/plakatu_laikai.json')); PS=json.load(open('duomenys/stoteles.json'))
LINK={'centro':'centro','pienines':'Pieninės','dukstynos':'Dukstynos','pasiles':'Pašilės','autobusu-stoties':'Autobusų stoties','biofabriko':'Biofabriko',
 'deltuvos':'Deltuvos','zaliojo-vienkiemio':'Žaliojo vienkiemio','narbuto':'Narbuto','gamyklu':'Gamyklų','pivonijos':'Pivonijos','pasile':'Pašilės'}
def pid(p): return PS[re.sub(r'_\d+$','',p)]['id'] if re.sub(r'_\d+$','',p) in PS else PS[p]['id']
TT=collections.defaultdict(dict); posters=collections.defaultdict(set)
for p in L:
    sid=pid(p['poster']); posters[sid].add(p['poster'])
    vy=p['poster'].startswith('autobusu-stotis-vytauto')
    for c in p['cols']:
        if c['route']=='5' and 'Pašil' in c['dest']:
            c=dict(c,route='4',dest='Pašilė')  # AS: AS -> Pašilė run is signed as route 4
        if c['route']=='7' and p['poster'] in ('sodai-link-dukstynos','dukstynos-kaimas-link-dukstynos','autobusu-stotis-vytauto-g-link-dukstynos'):
            c=dict(c,route='6',dest='Žaliasis vnk.')  # AS: this run is signed as route 6 until Žaliasis vienkiemis
        dest=c['dest'].replace('?','')
        b=TT[sid].setdefault((c['route'],dest),dict(r=c['route'],dest=dest,W=[],Sat=[],WE=[],notes={}))
        for t in c['times']:
            b[c['day']].append([int(t['t'][:2]),int(t['t'][3:]),t['star']])
            if t['star']: b['notes'][str(t['star'])]=t['note']
# AP duty-sheet overrides replace poster times for that route + day type
import os
OVR_T=json.load(open('duomenys/reisai.json')) if os.path.exists('duomenys/reisai.json') else []
for o in OVR_T:
    clear=['WE','Sat'] if o['day'] in ('WE','Sat') else ['W']
    keep_ids={PS[p]['id'] for p in o.get('keep',[])}
    for sid,bl in TT.items():
        if sid in keep_ids: continue
        for key,b in bl.items():
            if b['r']==o['route']:
                for d in clear: b[d]=[]; 
    for tr in o['trips']:
        tail=False
        for p,t in tr['stops'][:-1]:
            if tr.get('tail') and p==tr['tail']['at']: tail=True
            if p in tr.get('nodep',[]): continue
            dest=tr['tail']['dest'] if tail else tr['dest']
            sid=PS[p]['id']; h_,m_=int(t[:2]),int(t[3:])
            b=TT[sid].setdefault((o['route'],dest,'xl'),dict(r=o['route'],dest=dest,W=[],Sat=[],WE=[],notes={}))
            st=0
            note_=tr['tail'].get('note') if tail else tr.get('note')
            if note_:
                hit=[k for k,v in b['notes'].items() if v==note_]
                if hit: st=int(hit[0])
                else:
                    st=1
                    while str(st) in b['notes']: st+=1
                    b['notes'][str(st)]=note_
            b[o['day']].append([h_,m_,st])
out={}
for sid,bl in TT.items():
    lst=[]
    for b in bl.values():
        for d in ('W','Sat','WE'): b[d]=sorted({tuple(x) for x in b[d]})
        if b['W'] or b['Sat'] or b['WE']: lst.append(b)
    # one card per route + destination: merge blocks, renumbering footnote stars if meanings differ
    merged={}
    for b in lst:
        k=(b['r'],b['dest'])
        if k not in merged: merged[k]=b; continue
        m=merged[k]; remap={}
        for st,txt in b['notes'].items():
            same=[s for s,t in m['notes'].items() if t==txt]
            if same: remap[int(st)]=int(same[0])
            else:
                n=1
                while str(n) in m['notes']: n+=1
                m['notes'][str(n)]=txt; remap[int(st)]=n
        for d in ('W','Sat','WE'):
            m[d]=sorted(set(map(tuple,m[d]))|{(x[0],x[1],remap.get(x[2],x[2]) if x[2] else 0) for x in b[d]})
    out[sid]=sorted(merged.values(),key=lambda b:(int(b['r']),b['dest']))
# direction hints
name={}
for p,s in PS.items(): name[s['id']]=s['name']
byname=collections.defaultdict(list)
for sid in out: byname[name[sid]].append(sid)
hint={}
for n,ids in byname.items():
    if len(ids)<2: continue
    for sid in ids:
        links=sorted({m.group(1) for p in posters[sid] for m in [re.search(r'-link[-_](.+?)(?:_\d+)?$',re.sub(r'_\d+$','',p))] if m})
        links=[LINK.get(x,x) for x in links]
        if links: hint[sid]='link '+' / '.join(links)
    for sid in ids:
        if sid in hint: continue
        sib=[hint[x] for x in ids if x!=sid and x in hint]
        if sib and sib[0]!='link centro': hint[sid]='link centro'
        else:
            c=collections.Counter(re.split(r' \(| - ',b['dest'])[0] for b in out[sid])
            hint[sid]='kryptis: '+c.most_common(1)[0][0]
OVR={'muziejaus':'link centro','muziejus-savaitgalinis':'link Užupio',
 'deltuvos-kapines-link-deltuvos':'link Deltuvos','deltuvos-kapines-link-centro':'link centro','sodai-link-deltuvos':'link Deltuvos','sodai-link-autobusu-stoties':'link centro',
 'biofabrikas-link-centro':'link centro','statikai-link-autobusu-stoties':'link centro','statikai1':'link Deltuvos','statikai':'link centro','statikai-link-biofabriko':'link Biofabriko',
 'basanaviciaus':'link stoties','autoservisas':'link centro','anyksciu':'link stoties','geliu-link-pivonijos':'link Pivonijos','geliu-link-gamyklu':'link Gamyklų',
 'smeliu':'link centro','smeliu-link-pasiles':'link Pašilės','lytagros-centras-link-autobusu-stoties':'link centro','lytagros-centras-link-biofabriko':'link Biofabriko',
 'autobusu-stotis-vytauto-g-link-centro':'link centro','autobusu-stotis-vytauto-g-link-dukstynos':'link Dukstynos'}
for sid in out:
    for p in posters[sid]:
        for k,v in OVR.items():
            if re.sub(r'_\d+$','',p)==k: hint[sid]=v
json.dump(dict(tt=out,hint=hint),open('tarpiniai/tvarkarasciai.json','w'),ensure_ascii=False,separators=(',',':'))
for n,ids in sorted(byname.items()):
    if len(ids)>1: print(n,[hint[i] for i in ids])
