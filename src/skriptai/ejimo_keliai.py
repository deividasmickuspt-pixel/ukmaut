# Pėsčiųjų keliai tarp artimų stotelių OSM gatvėmis (planuoklio ėjimo linijoms žemėlapyje)
# -> tarpiniai/ejimo_keliai.json: {"idA|idB": [[lat,lon],...]} (tik viena kryptis, idA < idB)
import xml.etree.ElementTree as ET, math, heapq, json, collections
MAXM=850   # stotelių poros iki tiek metrų tiesiai (planuoklis eina iki 800 m)
def dist(a,b): return math.hypot((a[0]-b[0])*111320,(a[1]-b[1])*63600)
N={};ways=[]
for ev,el in ET.iterparse('duomenys/osm_gatves.osm'):
  if el.tag=='node': N[el.get('id')]=(float(el.get('lat')),float(el.get('lon')))
  elif el.tag=='way':
    tags={t.get('k'):t.get('v') for t in el.findall('tag')}
    if 'highway' in tags: ways.append((tags,[n.get('ref') for n in el.findall('nd')]))
    el.clear()
# pėsčiomis – visos gatvės abiem kryptimis, išskyrus magistrales
adj=collections.defaultdict(dict); segs=[]
for tags,nds in ways:
  hw=tags['highway']
  if hw.startswith('motorway') or hw in ('crossing','give_way','stop','traffic_signals','motorway_junction','mini_roundabout'): continue
  if tags.get('access') in ('no','private'): continue
  for a,b in zip(nds,nds[1:]):
    if a in N and b in N:
      d=dist(N[a],N[b]); adj[a][b]=adj[b][a]=d; segs.append((a,b))
# stotelė prijungiama prie artimiausios gatvės atkarpos (statmeniu)
def proj(p,a,b):
  ax,ay=a[0]*111320,a[1]*63600; bx,by=b[0]*111320,b[1]*63600; px,py=p[0]*111320,p[1]*63600
  dx,dy=bx-ax,by-ay; L=dx*dx+dy*dy; t=0 if not L else max(0,min(1,((px-ax)*dx+(py-ay)*dy)/L))
  return (a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t)
grid=collections.defaultdict(list)
def cell(p): return (int(p[0]*111320//80),int(p[1]*63600//80))
for a,b in segs:
  for c in {cell(N[a]),cell(N[b])}: grid[c].append((a,b))
D=json.load(open('tarpiniai/planuoklio_duomenys.json'))
ST={s['id']:(s['lat'],s['lon']) for s in D['stops']}
for sid,p in ST.items():
  c=cell(p); best=None
  for dx in (-2,-1,0,1,2):
    for dy in (-2,-1,0,1,2):
      for a,b in grid.get((c[0]+dx,c[1]+dy),()):
        q=proj(p,N[a],N[b]); d=dist(p,q)
        if best is None or d<best[0]: best=(d,a,b,q)
  if not best: continue
  _,a,b,q=best; v='S:'+sid; N[v]=q
  adj[v][a]=adj[a][v]=dist(q,N[a]); adj[v][b]=adj[b][v]=dist(q,N[b])
def dijkstra(src,lim):
  Dd={src:0};Pv={};h=[(0,src)]
  while h:
    d,u=heapq.heappop(h)
    if d>Dd[u] or d>lim: continue
    for v,w in adj[u].items():
      nd=d+w
      if nd<Dd.get(v,1e18): Dd[v]=nd;Pv[v]=u;heapq.heappush(h,(nd,v))
  return Dd,Pv
def rdp(P,eps=4):
  if len(P)<3: return P
  a,b=P[0],P[-1]; best=(0,0)
  for i in range(1,len(P)-1):
    q=proj(P[i],a,b); d=dist(P[i],q)
    if d>best[0]: best=(d,i)
  if best[0]<=eps: return [a,b]
  return rdp(P[:best[1]+1],eps)[:-1]+rdp(P[best[1]:],eps)
out={}; ids=sorted(ST)
for i,a in enumerate(ids):
  if 'S:'+a not in N: continue
  near=[b for b in ids[i+1:] if 'S:'+b in N and dist(ST[a],ST[b])<=MAXM]
  if not near: continue
  Dd,Pv=dijkstra('S:'+a,MAXM*2.5)
  for b in near:
    t='S:'+b
    if t not in Dd: continue
    path=[t]
    while path[-1]!='S:'+a: path.append(Pv[path[-1]])
    P=[ST[b]]+[N[n] for n in path]+[ST[a]]; P=rdp(P[::-1])
    out[a+'|'+b]=[[round(x,5),round(y,5)] for x,y in P]
json.dump(out,open('tarpiniai/ejimo_keliai.json','w'),separators=(',',':'))
print('ėjimo keliai:',len(out))
