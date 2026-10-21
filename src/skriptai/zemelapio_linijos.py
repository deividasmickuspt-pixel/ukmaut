import json,sys
from marsrutu_trasos import ROUTES
P=json.load(open('duomenys/stoteles.json')); SEG=json.load(open('duomenys/gatviu_atkarpos.json'))
pairs=set()
for ms in ROUTES.values():
    for ds in ms.values():
        for v in ds.values():
            for seq in [v['main']]+[[x for x in s if x not in ('^','$','#')] for s in v['var']]:
                for a,b in zip(seq,seq[1:]):
                    if P[a]['id']!=P[b]['id']: pairs.add((a,b))
import os
for o in (json.load(open('duomenys/reisai.json')) if os.path.exists('duomenys/reisai.json') else []):
    for tr in o['trips']:
        ps=[p for p,_ in tr['stops']]
        for a,b in zip(ps,ps[1:]):
            if P[a]['id']!=P[b]['id']: pairs.add((a,b))
missing=[p for p in pairs if f"{p[0]}|{p[1]}" not in SEG]
if missing and '--geom' in sys.argv:
    from gatviu_marsrutai import route,snap,dist
    for a,b in missing:
        la=(P[a]['lat'],P[a]['lon']); lb=(P[b]['lat'],P[b]['lon'])
        r=route(snap(la),snap(lb))
        SEG[f"{a}|{b}"]=[list(la)]+[list(p) for p in (r or [])]+[list(lb)]
    json.dump(SEG,open('duomenys/gatviu_atkarpos.json','w')); print('computed',len(missing)); sys.exit()
print('missing segments:',len(missing))
D=json.load(open('tarpiniai/planuoklio_duomenys.json'))
segid={}; segs=D['segs']
def sid(a,b):
    k=f"{a}|{b}"
    if k not in segid:
        segid[k]=len(segs); segs.append([[round(x,5),round(y,5)] for x,y in SEG[k]])
    return segid[k]
layers=[]; dirs={}
for r,ms in ROUTES.items():
    dirs[r]={}
    for m,ds in ms.items():
        dirs[r][m]={}
        for d,v in ds.items():
            main=v['main']; order=list(main); var_ids=set(); hide_ids=set()
            for seq in v['var']:
                if seq[0]=='#':   # path only (drawn dashed, stops not listed in this direction)
                    hide_ids|={P[p]['id'] for p in seq[1:]}-{P[p]['id'] for p in main}; continue
                if seq[0]=='^' or seq[-1]=='$':   # separate start/end runs: drawn dashed, listed under 'Kitos šios krypties stotelės'
                    var_ids|={P[p]['id'] for p in seq if p not in ('^','$')}-{P[p]['id'] for p in main}; continue
                if seq[-1] in main and seq[0] not in main:      # prefix -> before anchor (alternative start: at the top)
                    ins=[p for p in seq[:-1] if p not in order]; k=order.index(seq[-1]); k=0 if main.index(seq[-1])<=1 else k; order[k:k]=ins
                elif seq[0] in main and seq[-1] not in main:    # suffix -> after anchor (alternative end: at the bottom)
                    ins=[p for p in seq[1:] if p not in order]; k=order.index(seq[0])+1; k=len(order) if main.index(seq[0])>=len(main)-2 else k; order[k:k]=ins
                else:                                           # detour between two main stops
                    ins=[p for p in seq[1:-1] if p not in order]; k=order.index(seq[0])+1; order[k:k]=ins
                var_ids|={P[p]['id'] for p in ins}
            ids=[]
            for p in order:
                i=P[p]['id']
                if not ids or ids[-1]!=i: ids.append(i)
            dirs[r][m][d]=dict(to=v['to'],fixed=True,order=ids,var=sorted(var_ids),hide=sorted(hide_ids))
            for vi,(seq,mainflag) in enumerate([(main,True)]+[([x for x in s if x not in ('^','$','#')],False) for s in v['var']]):
                for a,b in zip(seq,seq[1:]):
                    if P[a]['id']==P[b]['id']: continue
                    layers.append(dict(r=r,m=m,main=mainflag,g=sid(a,b),d=d,ds=[d],ab=[P[a]['id'],P[b]['id']],v=None if mainflag else f"{d}{vi-1}"))
# ---- trip variants ("Kiti reisai"): trips that use any variant branch, grouped by start/end/via
import re as _re
NAME={s['id']:s['name'] for s in D['stops']}
ALIAS={'dusktynos kaimas':'Dukstynos kaimas','krekšlių':'Krekšliai','litagros centras':'Lytagros centras','žiedo st.':'Žiedo','statikai pirmi':'Statikai I',
       'koklių':'Koklių f.','autobusų st':'Autobusų stotis','autobusų st.':'Autobusų stotis','antakalnis':'Antakalnio','dariaus ir girėno':'Gelžbetonis (Dariaus ir Girėno g.)',
       'umega':'Umega','žaliasis vienk.':'Žaliasis vienkiemis','žaliasis vnk.':'Žaliasis vienkiemis'}
GEN={'Pieninė':'Pieninės','Autobusų stotis (Vytauto g.)':'Autobusų stoties (Vytauto g.)','Žaliasis vienkiemis':'Žaliojo vienkiemio','Koklių f.':'Koklių f.','Žiedo':'Žiedo','Statikai':'Statikų','Statikai I':'Statikų I','Deltuva':'Deltuvos','Dukstyna':'Dukstynos','Varinė':'Varinės','Pašilė':'Pašilės','Turgus':'Turgaus','Autobusų stotis':'Autobusų stoties','Pušų':'Pušų','Narbuto':'Narbuto','Biofabrikas':'Biofabriko'}
ACC={'Varinė':'Varinę','Dukstyna':'Dukstyną','Turgus':'Turgų','Pašilė':'Pašilę','Deltuva':'Deltuvą'}
KNOWN={n for n in NAME.values()}
def norm(n):
    k=n.strip().lower()
    if k.startswith('autobusų st') and 'vyt' in k: return 'Autobusų stotis (Vytauto g.)'
    if k in ALIAS: return ALIAS[k]
    for nm in KNOWN:
        if nm.lower()==k: return nm
    return n.strip()
def fix_sodai(names):
    out=list(names)
    for i,n in enumerate(out):
        if n=='Sodai':
            nb={out[j] for j in (i-1,i+1) if 0<=j<len(out)}
            if nb & {'Deltuvos kapinės','Statikai I','Deltuva'}: out[i]='Sodai (Deltuvos g.)'
    return out
def tmin(t): return int(t[:2])*60+int(t[3:])
OV={(o['route'],'D' if o['day']=='W' else 'O'):o for o in json.load(open('duomenys/reisai.json'))}
XL=json.load(open('duomenys/excel_reisai.json'))
def source(r,m):
    if (r,m) in OV:
        from autobuso_ratai import chain
        return [([P[p]['name'] for p,_ in st],[tmin(t) for _,t in st]) for st in chain(r,[tr['stops'] for tr in OV[(r,m)]['trips']])]
    day='W' if m=='D' else 'WE'
    out=[]
    for k,v in XL.items():
        dd,sh=k.split('|',1)
        if dd!=day or 'sav' in sh: continue
        if _re.match(r'^\s*'+r+r'\b',sh) is None: continue
        for tr in v['trips']:
            ts=[tmin(t) for _,t in tr]
            if any(b2<a2 for a2,b2 in zip(ts,ts[1:])) or ts[-1]-ts[0]>120: continue
            names=[];tt=[]
            for (n,_),t_ in zip(tr,ts):
                n=norm(n)
                if not names or names[-1]!=n: names.append(n); tt.append(t_)
            out.append((fix_sodai(names),tt))
    if out: return out
    return [([NAME[i] for i in D['pats'][t['p']]['s']],t['t']) for t in D['trips'] if t['r']==r and (('D' if t['d']=='W' else 'O')==m)]
def subseq(need,have):
    it=iter(have); return all(any(x==y for y in it) for x in need)
variants={}
for r,ms in ROUTES.items():
    variants[r]={}
    for m,ds in ms.items():
        vdefs=[]
        for d,v in ds.items():
            mainn={P[p]['name'] for p in v['main']}
            for vi,seq in enumerate(v['var']):
                if seq[0]=='#': continue
                s=[x for x in seq if x not in ('^','$')]
                key=[]
                for p in s:
                    n=P[p]['name']
                    if n not in mainn and n not in key: key.append(n)
                if not key: continue
                first,last=P[s[0]]['name'],P[s[-1]]['name']
                if seq[0]=='^' or (first not in mainn and last in mainn): kind,place=('nuo',first)
                elif seq[-1]=='$' or (first in mainn and last not in mainn): kind,place=('iki',last)
                else: kind,place=('per',key[0])
                vdefs.append((d,vi,key,kind,place))
        groups={}
        for names,tt in source(r,m):
            hit=[x for x in vdefs if subseq(x[2],names)]
            if not hit: continue
            names=['Autobusų stotis' if n=='Autobusų stotis (Vytauto g.)' and i_ in (0,len(names)-1) else n for i_,n in enumerate(names)]
            detours=[place for d,vi,k,kind,place in hit if kind=='per']
            places={}
            for d,vi,k,kind,place in hit:
                if kind=='iki' and place!=names[-1]: kind='per'
                if kind=='nuo' and place!=names[0]: kind='per'
                places.setdefault(place,set()).add(kind)
            places=dict(sorted(places.items(),key=lambda kv:names.index(kv[0]) if kv[0] in names else 0))
            parts=[]
            for place,kinds in places.items():
                if kinds>={'nuo','iki'}: parts.append(f"užsuka į {ACC.get(place,place)}")
                elif 'iki' in kinds:
                    if not any(f"iki {GEN.get(place,place)}" in p_ for p_ in parts): parts.append(f"iki {GEN.get(place,place)}")
                elif 'nuo' in kinds: parts.append(f"nuo {GEN.get(place,place)} iki {GEN.get(names[-1],names[-1])}")
                else: parts.append(f"per {ACC.get(place,place)}")
            if names[0]==names[-1] and names[0] in places and places[names[0]]>={'nuo','iki'}:
                label=f"Visas ratas: nuo {GEN.get(names[0],names[0])} iki {GEN.get(names[0],names[0])}"
            elif detours:
                label=' – '.join([names[0]]+detours+[names[-1]])
            elif all(k=={'per'} for k in places.values()):
                label=' – '.join([names[0]]+list(places)+[names[-1]])   # e.g. Pieninė – Dukstyna – Autobusų stotis
            else:
                if not any(p_.startswith('iki ') or ' iki ' in p_ for p_ in parts): parts[-1]+=f" iki {GEN.get(names[-1],names[-1])}"
                label=', '.join(parts); label=label[0].upper()+label[1:]
            if label not in groups:
                # representative path: follow this trip along the route's drawn segments
                path=[];a_id=b_id=None;seq=[]
                for k_,(n1,n2) in enumerate(zip(names,names[1:])):
                    cands=[l for l in layers if l['r']==r and l['m']==m and NAME[l['ab'][0]]==n1 and NAME[l['ab'][1]]==n2]
                    if cands:
                        l=sorted(cands,key=lambda l:(not l['main']))[0]; path.append(l['g'])
                        if a_id is None: a_id=l['ab'][0]
                        b_id=l['ab'][1]
                        if not seq or seq[-1][0]!=l['ab'][0]: seq.append([l['ab'][0],tt[k_]])
                        seq.append([l['ab'][1],tt[k_+1]])
                groups[label]=dict(label=label,dir=hit[0][0],vars=set(),times=[],starts=set(),path=path,a=a_id,b=b_id,ta=tt[0],tb=tt[-1],seq=seq)
            g=groups[label]
            g['vars']|={f"{d}{vi}" for d,vi,*_ in hit}; g['times'].append(tt[0]); g['starts'].add(names[0])
        for g in groups.values():
            g['vars']=sorted(g['vars']); st=sorted(g.pop('starts'))
            g['from']=st[0] if len(st)==1 else ''
        variants[r][m]=sorted(groups.values(),key=lambda g:min(g['times']))
        for g in variants[r][m]:
            ts=sorted(set(g['times'])); keep=[]
            for x in ts:
                if not keep or x-keep[-1]>3: keep.append(x)
            g['times']=keep
D['variants']=variants
D['layers']=layers; D['dirs']=dirs; D['segs']=segs
json.dump(D,open('tarpiniai/planuoklio_duomenys.json','w'),ensure_ascii=False,separators=(',',':'))
print('layers',len(layers))
