import xml.etree.ElementTree as ET, math, heapq, json, collections
def dist(a,b): return math.hypot((a[0]-b[0])*111320,(a[1]-b[1])*63600)
N={};ways=[]
for ev,el in ET.iterparse('duomenys/osm_gatves.osm'):
  if el.tag=='node': N[el.get('id')]=(float(el.get('lat')),float(el.get('lon')))
  elif el.tag=='way':
    tags={t.get('k'):t.get('v') for t in el.findall('tag')}
    nds=[n.get('ref') for n in el.findall('nd')]
    if 'highway' in tags: ways.append((tags,nds))
    el.clear()
FACT={'motorway':1,'trunk':1,'primary':1,'secondary':1,'tertiary':1,'unclassified':1.1,'residential':1.15,'living_street':1.6,'service':1.8}
adj=collections.defaultdict(dict)
for tags,nds in ways:
  hw=tags['highway'].replace('_link','')
  f=FACT.get(hw)
  if f is None: continue
  if tags.get('access') in ('no','private') and tags.get('bus')!='yes' and tags.get('psv')!='yes': continue
  ow=tags.get('oneway'); rb=tags.get('junction') in ('roundabout','circular')
  fwd=True; bwd=not(ow in('yes','1','true') or rb or (hw=='motorway' and ow!='no'))
  if ow=='-1': fwd,bwd=False,True
  if tags.get('oneway:bus')=='no' or tags.get('oneway:psv')=='no': bwd=True
  for a,b in zip(nds,nds[1:]):
    if a not in N or b not in N: continue
    d=dist(N[a],N[b])*f
    if fwd: adj[a][b]=min(d,adj[a].get(b,1e18))
    if bwd: adj[b][a]=min(d,adj[b].get(a,1e18))
NODES=[n for n in adj if hw]
# corridor from old routes
import os
OLD=json.load(open('skriptai/routes_osm.json')) if os.path.exists('skriptai/routes_osm.json') else {'routes':[]}   # senų trasų koridorius (failo nebeturime)
grid=collections.defaultdict(list)
def cell(p): return (int(p[0]*111320//60),int(p[1]*63600//60))
for r in OLD['routes']:
  for p in r['line']: grid[cell(p)].append(tuple(p))
cache={}
def pen(n):
  if n in cache: return cache[n]
  p=N[n]; c=cell(p); best=1e9
  for dx in (-2,-1,0,1,2):
    for dy in (-2,-1,0,1,2):
      for q in grid.get((c[0]+dx,c[1]+dy),()):
        d=dist(p,q)
        if d<best: best=d
  cache[n]=1.0 if best<45 or not OLD['routes'] else 1.6
  return cache[n]
GN=list(adj.keys())
def snap(p):
  return min(GN,key=lambda n:dist(N[n],p))
def route(sa,sb):
  D={sa:0};Pv={};h=[(0,sa)]
  while h:
    d,u=heapq.heappop(h)
    if u==sb: break
    if d>D[u]: continue
    for v,w in adj[u].items():
      nd=d+w*pen(v)
      if nd<D.get(v,1e18): D[v]=nd;Pv[v]=u;heapq.heappush(h,(nd,v))
  if sb not in D: return None
  path=[sb]
  while path[-1]!=sa: path.append(Pv[path[-1]])
  return [N[n] for n in reversed(path)]
def plen(p): return sum(dist(p[i],p[i+1]) for i in range(len(p)-1))
