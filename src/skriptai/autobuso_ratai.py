TURN={'1':['dukstyna-link-centro']}
def _m(t): return int(t[:2])*60+int(t[3:])
def chain(route,trips,gap=20):
    """Join a trip ending at a turnaround with the same bus's next trip starting there (within `gap` min)."""
    turn=TURN.get(route,[]); nxt={}; taken=set()
    order=sorted(range(len(trips)),key=lambda i:_m(trips[i][-1][1]))
    for i in order:
        a=trips[i]
        if a[-1][0] not in turn: continue
        c=[j for j,b in enumerate(trips) if j!=i and j not in taken and b[0][0]==a[-1][0] and 0<=_m(b[0][1])-_m(a[-1][1])<=gap]
        if c:
            j=min(c,key=lambda j:_m(trips[j][0][1])); nxt[i]=j; taken.add(j)
    out=[]
    for i in range(len(trips)):
        if i in taken: continue
        cur=list(trips[i]); k=i
        while k in nxt:
            k=nxt[k]; b=trips[k]
            cur=cur+b[1:]   # keep arrival time at the turnaround (safe for boarding there)
        out.append(cur)
    return out
