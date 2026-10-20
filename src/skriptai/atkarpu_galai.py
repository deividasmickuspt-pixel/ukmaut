import json,math
P=json.load(open('duomenys/stoteles.json')); S=json.load(open('duomenys/gatviu_atkarpos.json'))
K=(111320,63600)
def proj(p,a,b):
    ax,ay=a[0]*K[0],a[1]*K[1]; bx,by=b[0]*K[0],b[1]*K[1]; px,py=p[0]*K[0],p[1]*K[1]
    dx,dy=bx-ax,by-ay; L=dx*dx+dy*dy
    t=0 if L==0 else max(0,min(1,((px-ax)*dx+(py-ay)*dy)/L))
    q=(ax+t*dx,ay+t*dy); return math.hypot(px-q[0],py-q[1]),[q[0]/K[0],q[1]/K[1]]
def fix_start(line,stop):
    n=max(2,len(line)//3)
    best=min(((proj(stop,line[i],line[i+1]),i) for i in range(min(n,len(line)-1))),key=lambda x:x[0][0])
    (d,q),i=best
    out=[list(stop)]
    if d>3: out.append(q)
    return out+line[i+1:]
def fix_end(line,stop):
    r=fix_start(line[::-1],stop); return r[::-1]
n=0
for k,line in S.items():
    a,b=k.split('|')
    if len(line)<2: continue
    sa=(P[a]['lat'],P[a]['lon']); sb=(P[b]['lat'],P[b]['lon'])
    new=fix_end(fix_start(line,sa),sb)
    S[k]=[[round(x,6),round(y,6)] for x,y in new]; n+=1
json.dump(S,open('duomenys/gatviu_atkarpos.json','w'))
print('trimmed',n)
