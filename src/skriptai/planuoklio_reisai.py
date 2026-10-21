import re
import json,collections,math
P=json.load(open('duomenys/stoteles.json')); T=json.load(open('duomenys/plakatu_reisai.json')); SEG=json.load(open('duomenys/gatviu_atkarpos.json'))
def mn(t): return int(t[:2])*60+int(t[3:])
def dist(a,b): return math.hypot((a[0]-b[0])*111320,(a[1]-b[1])*63600)
META={'1':('#1E3A9E','Autobusų stotis (Dukstyna) – Pieninė'),'2':('#7C3AED','Biofabrikas (Deltuva) – Žaliasis vienk. – Koklių f.'),
 '3':('#A16207','Turgus – Žaliasis vienk. (šeštadieniais)'),'4':('#C2410C','Autobusų stotis (Dukstyna) – Žaliasis vienk. – Pašilė'),
 '5':('#0E7490','Pašilė – Gamyklų (Linų g.) – Narbuto'),'6':('#0B7A3E','Autobusų stotis – Žaliasis vienk.'),'7':('#BE185D','Žaliasis vienk. (Krekšliai) – Narbuto')}
# --- manual fixes -------------------------------------------------------
BADPAIR={('pramones-link-pienines','umega-link-autobusu-stoties'):'umega-link-pienines'}
for t in T:
    for k in range(1,len(t['stops'])):
        a_,b_=t['stops'][k-1]['poster'],t['stops'][k]['poster']
        if (a_,b_) in BADPAIR: t['stops'][k]=dict(t['stops'][k],poster=BADPAIR[(a_,b_)])
# AP duty-sheet overrides replace poster-derived trips for that route + day type
import os
for o in (json.load(open('duomenys/reisai.json')) if os.path.exists('duomenys/reisai.json') else []):
    days=('WE','Sat') if o['day'] in ('WE','Sat') else ('W',)
    wblk=None if o['day']=='W' else o['route']+'-'+o['day']   # savaitgalį maršrutą važiuoja vienas autobusas – visi jo reisai viena grandinė
    T[:]=[t for t in T if not (t['route']==o['route'] and t['day'] in days and t['stops'][0]['poster'] not in o.get('keep',[]))]
    from autobuso_ratai import chain, TURN
    if o['route'] in TURN:   # same bus continues through the turnaround: one trip for the planner
        blk={(tr['stops'][0][0],tr['stops'][0][1]):tr.get('blk') or wblk for tr in o['trips']}
        for st in chain(o['route'],[tr['stops'] for tr in o['trips']]):
            T.append(dict(route=o['route'],day=o['day'],headsign='',notes=[],blk=blk.get((st[0][0],st[0][1])),stops=[dict(poster=p,t=t) for p,t in st]))
        continue
    for tr in o['trips']:
        T.append(dict(route=o['route'],day=o['day'],headsign=tr['dest'],notes=[tr['note']] if tr.get('note') else [],blk=tr.get('blk') or wblk,stops=[dict(poster=p,t=t) for p,t in tr['stops']]))
# AS: the first route-7 run drives from the bus station to Žaliasis vienkiemis as route 6,
# and only becomes route 7 at Žaliasis vienkiemis
for t in list(T):
    if t['route']!='7': continue
    ps=[x['poster'] for x in t['stops']]
    if 'zaliasis-vienkiemis' in ps and ps.index('zaliasis-vienkiemis')>0:
        k=ps.index('zaliasis-vienkiemis')
        T.append(dict(route='6',day=t['day'],headsign='Žaliasis vienkiemis',notes=[],stops=t['stops'][:k+1]))
        t['stops']=t['stops'][k:]
# AS: the run AS -> Pašilė is signed as route 4; it becomes route 5 only at Pašilė
for t in list(T):
    if t['route']!='5': continue
    ps=[x['poster'] for x in t['stops']]
    if 'pasile' in ps:
        k=ps.index('pasile')
        if k>0: T.append(dict(route='4',day=t['day'],headsign='Pašilė',notes=[],stops=t['stops'][:k+1]))
        t['stops']=t['stops'][k:]
T[:]=[t for t in T if len(t['stops'])>1]
T[:]=[t for t in T if not (t['route']=='7' and all(x['poster'] in ('autobusu-stotis','sodai-link-dukstynos','dukstynos-kaimas-link-dukstynos') for x in t['stops']))]
# variant prefixes: trips that start further out and join a route at a known stop
PREFIX=[]  # route 1 now comes from AP duty sheets (xl_overrides)
LP={p['poster']:p for p in json.load(open('duomenys/plakatu_laikai.json'))}
VARP=collections.defaultdict(set)
VARD={('1','A'):{'dukstyna-link-centro','dukstyvos_kaimas-link-centro','sodai-link-centro'},
      ('1','B'):{'sodai-link-dukstynos','dukstynos-kaimas-link-dukstynos','dukstyna-link-centro'},
      ('4','A'):{'dukstyna-link-centro','varine'},('4','B'):{'varine'}}
VARDM={('2','D','B'):{'deltuva-link-autobusu-stoties','deltuvos-kapines-link-centro','sodai-link-autobusu-stoties','statikai-link-autobusu-stoties'},
       ('2','D','A'):{'statikai1','sodai-link-deltuvos','deltuvos-kapines-link-deltuvos','deltuva-link-autobusu-stoties'},
       ('6','O','A'):{'sodai-link-dukstynos','dukstynos-kaimas-link-dukstynos','dukstyna-link-centro','dukstyvos_kaimas-link-centro','sodai-link-centro'},
       ('6','D','A'):set(),('6','O','B'):set()}
def vard(r,md,d): return VARDM.get((r,md,d),VARD.get((r,d),set()))
FORCE={('1','dukstyna-link-centro','dukstyvos_kaimas-link-centro'):'A',('1','dukstyvos_kaimas-link-centro','sodai-link-centro'):'A',('1','sodai-link-centro','autobusu-stotis'):'A',('1','dukstyna-link-centro','sodai-link-centro'):'A',
       ('1','autobusu-stotis','sodai-link-dukstynos'):'B',('1','ligonine','sodai-link-dukstynos'):'B',('1','sodai-link-dukstynos','dukstynos-kaimas-link-dukstynos'):'B',('1','dukstynos-kaimas-link-dukstynos','dukstyna-link-centro'):'B',
       ('2','biofabrikas-link-deltuvos','statikai1'):'A',('2','statikai-link-biofabriko','statikai1'):'A',('2','statikai1','sodai-link-deltuvos'):'A',('2','sodai-link-deltuvos','deltuvos-kapines-link-deltuvos'):'A',('2','deltuvos-kapines-link-deltuvos','deltuva-link-autobusu-stoties'):'A'}
def hm_(m): return f"{m//60:02d}:{m%60:02d}"
for r,chain,join in PREFIX:
    VARP[r]|=set(chain)
    zone=set(chain)|{join}
    T[:]=[x for x in T if not (x['route']==r and all(s_['poster'] in zone for s_ in x['stops']))]
    for day in ('W','WE'):
        cols=[next((c for c in LP[p]['cols'] if c['route']==r and c['day']==day),None) for p in chain]
        if not all(cols): continue
        for t0 in cols[0]['times']:
            seq=[(chain[0],mn(t0['t']))]
            for p,c in zip(chain[1:],cols[1:]):
                nxt=[mn(x['t']) for x in c['times'] if 0<mn(x['t'])-seq[-1][1]<=4]
                if not nxt: break
                seq.append((p,nxt[0]))
            if len(seq)<len(chain): continue
            last=seq[-1][1]
            if any(x['route']==r and x['day']==day and x['stops'][0]['poster']==chain[0] and mn(x['stops'][0]['t'])==seq[0][1] for x in T): continue
            tr=next((x for x in T if x['route']==r and x['day']==day and x['stops'][0]['poster'] in (join,'ligonine_-link-centro') and 1<=mn(x['stops'][0]['t'])-last<=6 and x['stops'][0]['poster'] not in zone-{join}),None)
            pre=[dict(poster=p,t=hm_(m)) for p,m in seq]
            if tr: tr['stops']=pre+tr['stops']
            else: T.append(dict(route=r,day=day,headsign='',notes=[],stops=pre+[dict(poster=join,t=hm_(last+2),est=True)]))
stops={}
for p,s in P.items():
    st=stops.setdefault(s['id'],dict(id=s['id'],name=s['name'],lat=round(s['lat'],6),lon=round(s['lon'],6),approx=s['id'].startswith('new:') and not s.get('confirmed'),routes=set()))
def MODE(t):
    # weekday timetable follows the bridge detour all day; weekends/holidays use the bridge both ways
    return 'D' if t['day']=='W' else 'O'
pats=[];pidx={};trips=[];segs=[];segid={}
segcount=collections.Counter()
for t in T:
    if len(t['stops'])<2: continue
    seq=tuple(P[s['poster']]['id'] for s in t['stops'])
    key=(t['route'],tuple(s['poster'] for s in t['stops']))
    if key not in pidx:
        ps=key[1]; g=[]
        for a,b in zip(ps,ps[1:]):
            k=f"{a}|{b}"
            if k not in segid:
                g_=SEG.get(k) or [[P[a]['lat'],P[a]['lon']],[P[b]['lat'],P[b]['lon']]]
                segid[k]=len(segs); segs.append([[round(x,5),round(y,5)] for x,y in g_])
            g.append(segid[k])
        pidx[key]=len(pats); pats.append(dict(r=t['route'],s=list(seq),g=g))
    for i in seq: stops[i]['routes'].add(t['route'])
    for a,b in zip(t['stops'],t['stops'][1:]): segcount[(t['route'],MODE(t),a['poster'],b['poster'])]+=1
    notes=[n for n in t['notes'] if 'Vytauto' not in n]
    vyt=any('Vytauto' in n for n in t['notes'])
    trips.append(dict(r=t['route'],d=t['day'],p=pidx[key],t=[mn(s['t']) for s in t['stops']],n=notes,v=1 if vyt else 0,**({'b':t['blk']} if t.get('blk') else {})))
# directions
TERM_NOTE='7: AS duomenys 2026-10'
TERM={'1':('Autobusų stotis','Pieninė'),'2':('Autobusų stotis','Biofabrikas'),'3':('Turgus','Žaliasis vienkiemis'),'4':('Autobusų stotis','Pašilė'),
 '5':('Narbuto','Pašilė'),'6':('Autobusų stotis','Žaliasis vienkiemis'),'7':('Žaliasis vienkiemis','Narbuto')}
TERMM={('2','O'):('Pašilė','Biofabrikas')}
def terms(r,md): return TERMM.get((r,md),TERM[r])
# poster headsigns: where the bus is heading from this poster (route, day)
KW=[('stotis','Autobusų stotis'),('Pienin','Pieninė'),('Pašil','Pašilė'),('Biofabrik','Biofabrikas'),('Žaliasis','Žaliasis vienkiemis'),('Turgus','Turgus'),('Narbut','Narbuto'),('Kokli','Koklių f.'),('Deltuv','Deltuva')]
HS={}
for p_ in json.load(open('duomenys/plakatu_laikai.json')):
    for c in p_['cols']:
        parts=[]
        for piece in re.split(r' - |\(',c['dest']):
            for k,v in KW:
                if k in piece and v not in parts: parts.append(v)
        for dd in (['W'] if c['day']=='W' else ['WE','Sat']):
            cur_=HS.setdefault((p_['poster'],c['route'],dd),[])
            for x in parts:
                if x not in cur_: cur_.append(x)
def hs_dir(p,r,day,t1,t2):
    parts=HS.get((p,r,day)) or HS.get((p,r,'W')) or HS.get((p,r,'WE')) or []
    a_,b_=t2 in parts,t1 in parts
    if a_ and not b_: return 'A'
    if b_ and not a_: return 'B'
    return None  # ambiguous (e.g. 'Pašilė (Autobusų stotis)') -> use trip logic
def nmp(p): return P[p]['name']
def ll(p): return (P[p]['lat'],P[p]['lon'])
T2LL={}
votes=collections.defaultdict(collections.Counter); runs=collections.defaultdict(list)
for t in T:
    r=t['route']; md=MODE(t); ps=[s['poster'] for s in t['stops']]
    if len(ps)<2 or r not in TERM: continue
    t1,t2=terms(r,md); names=[nmp(p) for p in ps]
    t2p=next(p for p in P if P[p]['name']==t2)
    term=[(k,'A' if n==t2 else 'B') for k,n in enumerate(names) if n in (t1,t2)]
    dirs=[]
    for k in range(len(ps)-1):
        nxt=[d for q,d in term if q>k]; prv=[d for q,d in term if q<=k]
        if nxt: d=nxt[0]
        elif prv: d='A' if prv[-1]=='B' else 'B'
        else: d='A' if dist(ll(ps[k+1]),ll(t2p))<dist(ll(ps[k]),ll(t2p)) else 'B'
        h_=hs_dir(ps[k],r,t['day'],t1,t2)
        if h_ and not (r,ps[k],ps[k+1]) in FORCE: d=h_
        d=FORCE.get((r,ps[k],ps[k+1]),d)
        dirs.append(d); votes[(r,md,ps[k],ps[k+1])][d]+=1
    # contiguous runs per dir (stop ids)
    cur=[ps[0]];cd=dirs[0]
    for k,d in enumerate(dirs):
        if d!=cd: runs[(r,md,cd)].append(cur); cur=[ps[k]]; cd=d
        cur.append(ps[k+1])
    runs[(r,md,cd)].append(cur)
ORDER_OVR={
 ('2','O','A'):['pasile','baznycios','pasiles-kryzkele','misku','kokliu-link-centro','pusu','pivonijos','smeliu','kestucio-a-link-pienines','kauno-link-pienines','senasis-pastas-link-pienines','pramones-link-pienines','ziedo-link-narbuto','lytagros-centras-link-biofabriko','statikai-link-biofabriko','biofabrikas-link-deltuvos'],
 ('2','D','B'):['deltuva-link-autobusu-stoties','deltuvos-kapines-link-centro','sodai-link-autobusu-stoties','statikai-link-autobusu-stoties','biofabrikas-link-centro','statikai','lytagros-centras-link-autobusu-stoties','ziedo-link-autobusu-stoties','pramones-link-centro','senasis-pastas-link-centro','kauno-link-centro','kestucio-a-link-autobusu-stoties','basanaviciaus','kudirkos','anyksciu','ligonine','autobusu-stotis'],
 ('7','D','A'):['zaliasis-vienkiemis','saltalankiu-link-centro','kreksliai','vysniu','boruvka-link-centro','gelzbetonis-link-centro','antakalnio-link-centro','muziejaus','basanaviciaus','kudirkos','anyksciu','ligonine','autobusu-stotis','ligonine_-link-centro','kudirkos_-link_centro','autoservisas','kestucio-a-link-pienines','kauno-link-pienines','senasis-pastas-link-pienines','pramones-link-pienines','ziedo-link-narbuto','narbuto'],
 ('3','O','A'):['turgus','kestucio-a-link-autobusu-stoties','muziejus-savaitgalinis','antakalnio-link-zaliojo-vienkiemio','gelzbetonis-savaitgalinis','boruvka-link-zaliojo-vienkiemio','vysniu-savaitgalinis','kreksliai-savaitgalinis','saltalankiu-savaitgalinis','zaliasis-vienkiemis'],
 ('6','O','A'):['autobusu-stotis','sodai-link-dukstynos','dukstynos-kaimas-link-dukstynos','dukstyna-link-centro','dukstyvos_kaimas-link-centro','sodai-link-centro','ligonine_-link-centro','kudirkos_-link_centro','autoservisas','muziejus-savaitgalinis','antakalnio-link-zaliojo-vienkiemio','gelzbetonis-savaitgalinis','boruvka-link-zaliojo-vienkiemio','vysniu-savaitgalinis','kreksliai-savaitgalinis','saltalankiu-savaitgalinis','zaliasis-vienkiemis'],
 ('5','D','A'):['narbuto','pramones-link-centro','senasis-pastas-link-centro','kauno-link-centro','kestucio-a-link-autobusu-stoties','basanaviciaus','kudirkos','ligonine','autobusu-stotis','sodai-link-dukstynos','dukstynos-kaimas-link-dukstynos','zaliasis-vienkiemis','saltalankiu-link-centro','kreksliai','vysniu','boruvka-link-centro','gelzbetonis-link-centro','antakalnio-link-centro','smeliu-link-pasiles','linu-link-gamyklu','geliu-link-gamyklu','gamyklu','linu-link-pivonijos','pusu-link-pasiles','misku-link-pasiles','pasiles-kryzkele-link-pasiles','baznycios-link-pasile','pasile'],
 ('5','D','B'):['pasile','baznycios','pasiles-kryzkele','misku','pusu','pivonijos','linu-link-gamyklu','geliu-link-gamyklu','gamyklu','linu-link-pivonijos','smeliu','kestucio-a-link-pienines','kauno-link-pienines','senasis-pastas-link-pienines','pramones-link-pienines','ziedo-link-narbuto','narbuto']}
STOPLL={P[p]['id']:(P[p]['lat'],P[p]['lon']) for p in P}
def nmp_id(i): return next(P[p]['name'] for p in P if P[p]['id']==i)
DIRS={}
for r in TERM:
    DIRS[r]={}
    for md in ('D','O'):
      t1,t2=terms(r,md)
      DIRS[r][md]={}
      for d,lab in (('A',t2),('B',t1)):
        rr=runs.get((r,md,d),[])
        if not rr: continue
        rr2=[x for x in rr if any(nmp(p)==lab for p in x)]
        if not rr2 or max(map(len,rr2))<0.6*max(map(len,rr)): rr2=rr
        cnt=collections.Counter(tuple(x) for x in rr2 if len({P[p]['id'] for p in x})==len(x))
        best=list(max(cnt,key=lambda x:(len(x),cnt[x])) if cnt else max(rr,key=len)); order=[]
        # stitch continuation fragments (sparse routes split into several pieces)
        for _ in range(6):
            ids_=[P[p]['id'] for p in best]; grown=False
            for x in sorted(rr,key=len,reverse=True):
                xid=[P[p]['id'] for p in x]
                if xid[0]==ids_[-1] and len(x)>1 and not set(xid[1:])&set(ids_):
                    best+=list(x[1:]); grown=True; break
                if xid[-1]==ids_[0] and len(x)>1 and not set(xid[:-1])&set(ids_):
                    best=list(x[:-1])+best; grown=True; break
            if not grown and nmp(best[-1])!=lab:
                last=ll(best[-1])
                cands_=[x for x in rr if len(x)>1 and not set(P[p]['id'] for p in x)&set(ids_) and dist(ll(x[0]),last)<700]
                if cands_:
                    x=min(cands_,key=lambda x:dist(ll(x[0]),last)); best+=list(x); grown=True
            if not grown: break
        for p in best:
            if p in vard(r,md,d) and (r,md,d) not in ORDER_OVR: continue
            i_=P[p]['id']
            if i_ not in order: order.append(i_)
        if (r,md,d) in ORDER_OVR: order=[P[p]['id'] for p in ORDER_OVR[(r,md,d)]]
        # terminal arrival is often missing from posters: append the terminal stop
        if order and nmp_id(order[-1])!=lab:
            tp=[p for p in P if P[p]['name']==lab]
            if tp: order.append(P[min(tp,key=lambda p:dist(ll(p),(STOPLL[order[-1]])))]['id'])
        seen_=[]; [seen_.append(i) for i in order if i not in seen_]; order=seen_
        DIRS[r][md][d]=dict(to=lab,fixed=(r,md,d) in ORDER_OVR,order=order,var=sorted({P[p]['id'] for p in vard(r,md,d)}))
# map layer: per route segments, solid if heavily used
layers=[]
for r in META:
  for md in ('D','O'):
    cs={(a,b):c for (rr,m_,a,b),c in segcount.items() if rr==r and m_==md}
    if not cs: continue
    mx=max(cs.values())
    for (a,b),c in cs.items():
        v=votes[(r,md,a,b)]; dd_=v.most_common(1)[0][0] if v else 'A'
        tot_=sum(v.values()); ds_=[x for x in 'AB' if v[x] and (v[x]>=2 or v[x]>=0.3*tot_)] or [dd_]
        layers.append(dict(r=r,m=md,main=c>=max(1 if mx<6 else 2,0.2*mx) and a not in vard(r,md,dd_) and b not in vard(r,md,dd_),g=segid[f"{a}|{b}"],d=dd_,ds=ds_,ab=[P[a]['id'],P[b]['id']]))
# complete hand-checked sequences so the drawn line is continuous
STRICT={('7','D','A')}   # sequences confirmed by AS: draw exactly these segments
for (r,md,d),lst in ORDER_OVR.items():
    seq=[(a,b) for a,b in zip(lst,lst[1:]) if P[a]['id']!=P[b]['id'] and f"{a}|{b}" in SEG]
    want={(P[a]['id'],P[b]['id']) for a,b in seq}
    if (r,md,d) in STRICT:
        layers[:]=[l for l in layers if not (l['r']==r and l['m']==md and (tuple(l['ab']) not in want))]
    have={tuple(l['ab']) for l in layers if l['r']==r and l['m']==md}
    for a,b in seq:
        if (P[a]['id'],P[b]['id']) in have: continue
        k=f"{a}|{b}"
        if k not in segid: segid[k]=len(segs); segs.append([[round(x,5),round(y,5)] for x,y in SEG[k]])
        vv=vard(r,md,d)
        layers.append(dict(r=r,m=md,main=a not in vv and b not in vv,g=segid[k],d=d,ds=[d],ab=[P[a]['id'],P[b]['id']]))
for s in stops.values(): s['routes']=sorted(s['routes'],key=int)
used={i for p in pats for i in p['s']}
D=dict(meta={r:dict(color=c,legend=l) for r,(c,l) in META.items()},stops=list(stops.values()),pats=pats,trips=trips,layers=layers,segs=segs,dirs=DIRS)
s=json.dumps(D,ensure_ascii=False,separators=(',',':'))
open('tarpiniai/planuoklio_duomenys.json','w').write(s)
print(len(s)//1024,'KB','stops',len(D['stops']),'pats',len(pats),'trips',len(trips),'layers',len(layers))
print(collections.Counter((t['r'],t['d']) for t in trips))
