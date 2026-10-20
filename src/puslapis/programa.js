const TTS=TT.tt;
D.stops.forEach(s=>{const rs=new Set((TTS[s.id]||[]).map(b=>b.r));(s.routes||[]).forEach(r=>rs.add(r));s.routes=[...rs].sort((a,b)=>a-b);});
D.stops=D.stops.filter(s=>TTS[s.id]||s.routes.length);
const STOP=Object.fromEntries(D.stops.map(s=>[s.id,s]));
const sname=id=>STOP[id].name+(dirTxt(id)?` (${dirTxt(id)})`:'');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const R=Object.keys(D.meta).filter(r=>D.trips.some(t=>t.r===r));
const C=r=>D.meta[r].color;
const badge=(r,lg,btn)=>`<${btn?'button':'span'} class="b${lg?' lg':''}" style="background:${C(r)}"${btn?` data-sel="${r}"`:''} aria-label="${r} maršrutas">${r}</${btn?'button':'span'}>`;
const hm=m=>{m=((m%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
const nm=id=>STOP[id].name;
const DAYS={W:'Darbo diena',WE:'Poilsio diena'};
const inDay=(t,d)=>d==='W'?t.d==='W':(t.d==='Sat'||t.d==='WE');
const satOnly=t=>t.d==='Sat';
const isPhone=()=>innerWidth<=820;
const now=new Date(); const today=(now.getDay()===0||now.getDay()===6)?'WE':'W';
const nowMin=now.getHours()*60+now.getMinutes();
// pattern geometry
D.pats.forEach(p=>{p.line=[];p.idx=[0];p.g.forEach((gi,k)=>{const sg=D.segs[gi];p.line.push(...(p.line.length?sg.slice(1):sg));p.idx.push(p.line.length-1);});});
D.trips.forEach((t,i)=>{t.id=i;t.P=D.pats[t.p];});
const NAMES=[...new Set(D.stops.map(s=>s.name))].sort((a,b)=>a.localeCompare(b,'lt'));
const tripTo=t=>nm(t.P.s.at(-1));
const NOTEKW=[['Varin','Varinė'],['Dukstyn','Dukstyna'],['Kokli','Koklių f.'],['Linų','Linų'],['Žiedo','Žiedo'],['Biofabrik','Biofabrikas'],['Deltuv','Deltuva'],['autobusų stot','Autobusų stotis'],['Pašil','Pašilė']];
function legTo(l){ // where the bus is heading on this leg
  const md=l.t.d==='W'?'D':'O', a=l.t.P.s[l.i], b=l.t.P.s[l.i+1];
  const ly=D.layers.find(x=>x.r===l.t.r&&x.m===md&&x.ab[0]===a&&x.ab[1]===b)||D.layers.find(x=>x.r===l.t.r&&x.ab[0]===a&&x.ab[1]===b);
  const dd=ly&&((D.dirs[l.t.r]||{})[md]||{})[ly.d]; return dd?dd.to:nm(l.t.P.s.at(-1));}
function legNotes(l){const names=new Set(l.t.P.s.slice(l.i,l.j+1).map(nm)); const out=[];
  l.t.n.forEach(n=>{const kw=NOTEKW.find(([k])=>n.includes(k)); if(kw&&(names.has(kw[1])||l.t.P.s.slice(l.j).map(nm).includes(kw[1])&&n.startsWith('iki')&&false)) out.push(n);});
  if(l.t.v&&l.i===0&&nm(l.t.P.s[0])==='Autobusų stotis') out.push('išvyksta iš Vytauto g. stotelės');
  return out;}
// oficiali kryptis (galinė stotelė) kiekvienoje stotelėje – iš reisų, kurie iš jos išvyksta
const DIRAT={}; D.trips.forEach(t=>t.P.s.forEach((id,i)=>{if(i>=t.P.s.length-1)return; const to=legTo({t,i}).replace(/ \(.*\)$/,'').replace(/ ir atgal į AS$/,''), a=DIRAT[id]||(DIRAT[id]={}), e=a[to]||(a[to]={n:0}); e.n++; e[t.r]=(e[t.r]||0)+1;}));
const dirList=(id,r)=>{const c=e=>r?e[r]||0:e.n, a=DIRAT[id]||{}, tot=Object.values(a).reduce((s,e)=>s+c(e),0); return Object.entries(a).filter(([,e])=>c(e)&&c(e)>=tot*.2).sort((x,y)=>c(y[1])-c(x[1])).slice(0,3).map(([to])=>to);};
// kryptys su maršrutų numeriais: kurie maršrutai kur važiuoja iš šios stotelės, kuriems ji galinė
const ENDS={}; D.trips.forEach(t=>{const e=t.P.s.at(-1); (ENDS[e]||(ENDS[e]={}))[t.r]=(ENDS[e][t.r]||0)+1;});
function dirParts(id){ const a=DIRAT[id]||{}, rs=STOP[id].routes, dep=r=>Object.values(a).reduce((s,e)=>s+(e[r]||0),0);
  const ends=rs.filter(r=>(ENDS[id]||{})[r]&&(ENDS[id][r]>=dep(r)));
  const go={}; rs.filter(r=>dep(r)).forEach(r=>dirList(id,r).forEach(to=>(go[to]||(go[to]=[])).push(r)));
  return {ends, go:Object.entries(go).map(([to,rs])=>({to,rs})).sort((x,y)=>x.rs[0].localeCompare(y.rs[0],undefined,{numeric:true}))}; }
const sb=r=>`<span class="b sb" style="background:${C(r)}" aria-label="${r} maršrutas">${r}</span>`;
function dirHtml(id){ const {ends,go}=dirParts(id);
  return `<span class="dh">${ends.length?`<span class="dhl"><b>Galinė stotelė</b> ${ends.map(sb).join('')}</span>`:''}${go.map(g=>`<span class="dhl">${g.rs.map(sb).join('')} <span aria-hidden="true">→</span><span class="vh">kryptis</span> ${esc(g.to)}</span>`).join('')}</span>`; }
const dirTxt=(id,r)=>{const l=r&&dirList(id,r).length?dirList(id,r):dirList(id); return l.length?'kryptis '+l.join(', '):(STOP[id].routes.length?'galinė stotelė':'');};
const noteTxt=t=>[...t.n,...(t.v?['išvyksta iš Vytauto g. stotelės']:[])];
let state={route:null,day:today,trip:null,stop:null,dir:null};
const FEEDBACK_URL='https://docs.google.com/forms/d/e/1FAIpQLSefqI5RnqKLAv2Im7MOOdJfc2lZa6WOSzsKa1mEMKBBlVPFwQ/viewform';   // ← čia įrašyti Google formos nuorodą
let viewDay=today;
const SHOWDAY=()=>(!state.route&&!state.stop&&plan.res.length&&!onRoutesPg())?plan.day:viewDay;   // map follows the planner while its result is shown
const MODE=()=>SHOWDAY()==='W'?'D':'O';
const VSEL=()=>state.route&&state.variant?((D.variants[state.route]||{})[MODE()]||[]).find(v=>v.label===state.variant):null;
const layerOn=x=>x.m===MODE()&&runsOn(x.r)&&(x.main||(VSEL()&&x.r===state.route&&VSEL().vars.includes(x.v)));
const runsOn=r=>D.trips.some(t=>t.r===r&&inDay(t,SHOWDAY()));
const DIRS=r=>(D.dirs[r]||{})[MODE()]&&Object.keys(D.dirs[r][MODE()]).length?D.dirs[r][MODE()]:((D.dirs[r]||{}).D||{});
// telefone du „puslapiai“: 'plan' – greitas kelionės patikrinimas, 'routes' – maršrutai, stotelės ir tvarkaraščiai (adrese #marsrutai)
let page='plan';
const onRoutesPg=()=>isPhone()&&page==='routes';
const onMapPg=()=>isPhone()&&page==='map';   // telefono žemėlapio puslapis (#zemelapis)
const PGHASH={routes:'marsrutai',map:'zemelapis'}, hashPg=()=>location.hash==='#marsrutai'||location.hash==='#stoteles'?'routes':'plan';   // telefone liko tik planuoklis (maršrutų, stotelių ir žemėlapio puslapiai išjungti; senos #stoteles, #marsrutai, #zemelapis nuorodos atidaro planuoklį)
function setPage(p,how){   // how: 'push' – naujas žingsnis naršyklės istorijoje (veikia telefono „Atgal“), kitaip – tik pakeičiamas adresas
  const was=page; page=p; document.body.classList.toggle('pg-routes',p==='routes'); document.body.classList.toggle('pg-map',p==='map');
  try{const u=new URL(location.href); u.hash=PGHASH[p]||''; const url=u.href.replace(/#$/,'');
    if(how==='push'&&was!==p) history.pushState({pg:p},'',url); else history.replaceState(history.state,'',url);}catch(e){}
  if(was!==p){ scrollTo(0,0); map.invalidateSize(); } }
let plan={from:'',to:'',day:today,time:nowMin,opt:0,res:[],userTime:false,mode:'dep'};   // mode: 'dep' – išvykti nuo, 'arr' – atvykti iki   // userTime: laiką pasirinko pats žmogus (tada jo neatnaujiname)

const WALK=(()=>{const W=new Map(),k=Math.cos(55.25*Math.PI/180);
  D.stops.forEach(a_=>D.stops.forEach(b_=>{ if(a_===b_||a_.name===b_.name) return;
    const m=Math.hypot((a_.lat-b_.lat)*111320,(a_.lon-b_.lon)*111320*k); if(m>400) return;
    const min=Math.ceil(m*1.3/75)+1;   // street detour ×1.3, ~4.5 km/h, +1 min reserve
    if(!W.has(a_.id))W.set(a_.id,[]); W.get(a_.id).push({id:b_.id,m:Math.round(m*1.3/10)*10,min});}));
  return W;})();
function nearStops(id,maxM){const K=Math.cos(55.25*Math.PI/180),a_=STOP[id],out=[]; if(!a_) return out;
  D.stops.forEach(b_=>{ if(b_.name===a_.name) return; const m=Math.hypot((a_.lat-b_.lat)*111320,(a_.lon-b_.lon)*111320*K);
    if(m<=maxM) out.push({id:b_.id,m:Math.round(m*1.3/10)*10,min:Math.ceil(m*1.3/75)+1});}); return out;}
function computePlan(A,B,day,T,opt={}){ const RAD=opt.walkMax||400;
  const ts=D.trips.filter(t=>inDay(t,day));
  const K=Math.cos(55.25*Math.PI/180), dm=(x,y)=>{const p=STOP[x],q=STOP[y];return p&&q?Math.hypot((p.lat-q.lat)*111320,(p.lon-q.lon)*111320*K):1e9;};
  // where you can board: the chosen stop, or any stop within walking distance of it (≤120 m counts as the same place)
  const ORIG=new Map();
  D.stops.filter(s=>s.name===A).forEach(sa=>{ ORIG.set(sa.id,null);
    nearStops(sa.id,RAD).forEach(w=>{ if(nm(w.id)===B) return; const cur=ORIG.get(w.id);
      if(cur===undefined||(cur&&w.min<cur.min)) ORIG.set(w.id,{from:sa.id,to:w.id,m:w.m,min:dm(sa.id,w.id)<=120?0:w.min,near:dm(sa.id,w.id)<=120}); });});
  const END=new Map();   // alight stop id -> walk to the destination
  D.stops.filter(s=>s.name===B).forEach(bs=>nearStops(bs.id,RAD).forEach(w=>{ if(nm(w.id)===A) return;
    const e={to:bs.id,m:w.m,min:w.min}; const cur=END.get(w.id); if(!cur||e.min<cur.min) END.set(w.id,e);}));
  const endAt=(u,from)=>{let best=null; for(let z=from+1;z<u.P.s.length;z++){const id=u.P.s[z];
      if(nm(id)===B){ if(!best||u.t[z]<=best.arr) best={z,arr:u.t[z]}; break;}
      const e=END.get(id); if(e&&(!best||u.t[z]+e.min<best.arr)) best={z,arr:u.t[z]+e.min,walkEnd:e};}
    return best;};
  const byName=new Map();
  ts.forEach(t=>t.P.s.forEach((id,i)=>{const n=nm(id);if(!byName.has(n))byName.set(n,[]);byName.get(n).push([t,i]);}));
  const out=[], W=w=>w&&!w.near?1:0;
  ts.forEach(t=>{const s=t.P.s;
    for(let i=0;i<s.length-1;i++){ if(!ORIG.has(s[i])) continue; const ws=ORIG.get(s[i]);
      const lead=ws?ws.min:0; if(t.t[i]<T+lead||t.t[i]>T+(opt.window||420)) continue;
      const base={dep:t.t[i]-lead,walkStart:ws||undefined}, w0=W(ws);
      const j=s.findIndex((id,k)=>k>i&&nm(id)===B);
      if(j>0) out.push({...base,legs:[{t,i,j}],arr:t.t[j],walk:w0});
      const eb=endAt(t,i); if(eb&&eb.walkEnd&&(j<0||eb.z<j)) out.push({...base,legs:[{t,i,j:eb.z}],arr:eb.arr,walkEnd:eb.walkEnd,walk:w0+1});
      const kEnd=j>0?j:s.length;
      for(let k=i+1;k<kEnd;k++){const X=nm(s[k]),a1=t.t[k];
        (byName.get(X)||[]).forEach(([u,k2])=>{ if(u===t) return; const same=u.P.s[k2]===s[k];
          const cont=t.b&&u.b===t.b&&k===s.length-1&&k2===0;   // the same bus carries on (possibly with another number)
          if(u.r===t.r&&!(same&&k===s.length-1)&&!cont) return;
          const w=(u.r===t.r||cont)?0:same?1:2; if(u.t[k2]<a1+w||u.t[k2]>a1+60) return;
          const eb=endAt(u,k2); if(!eb) return; const nw=w0+(eb.walkEnd?1:0); if(nw>2) return;
          out.push({...base,legs:[{t,i,j:k},{t:u,i:k2,j:eb.z,cont}],arr:eb.arr,walkEnd:eb.walkEnd,walk:nw});});
        // transfer on foot to a nearby stop with another name
        if(w0) continue;   // at most two walks per trip
        (WALK.get(s[k])||[]).forEach(wk=>{ if(nm(wk.id)===B||nm(wk.id)===A) return;
          (byName.get(nm(wk.id))||[]).forEach(([u,k2])=>{ if(u===t||u.P.s[k2]!==wk.id) return;
            if(u.t[k2]<a1+wk.min||u.t[k2]>a1+60) return;
            const m=u.P.s.findIndex((id,z)=>z>k2&&nm(id)===B); if(m<0) return;
            out.push({...base,legs:[{t,i,j:k},{t:u,i:k2,j:m,walk:wk}],arr:u.t[m],walk:1});});});}
      }
  });
  // straight-line distance A–B and the length of the bus route actually travelled
  let dAB=1e9; D.stops.filter(s=>s.name===A).forEach(a=>D.stops.filter(s=>s.name===B).forEach(b=>{dAB=Math.min(dAB,dm(a.id,b.id));}));
  const rideLen=o=>o.legs.reduce((S,l)=>{let x=0;for(let z=l.i;z<l.j;z++)x+=dm(l.t.P.s[z],l.t.P.s[z+1]);return S+x;},0);
  let walkAB=null;
  D.stops.filter(s=>s.name===A).forEach(sa=>(WALK.get(sa.id)||[]).forEach(w=>{ if(nm(w.id)===B&&(!walkAB||w.m<walkAB.m)) walkAB={m:w.m,min:w.min}; }));
  // drop nonsense: 0-minute rides or rides between neighbouring stops; walks not shorter than walking the whole way
  const sane=o=>o.legs.every(l=>l.t.t[l.j]-l.t.t[l.i]>=1&&dm(l.t.P.s[l.i],l.t.P.s[l.j])>150)
    && !(walkAB&&((o.walkEnd&&o.walkEnd.m>=0.8*walkAB.m)||o.legs.some(l=>l.walk&&l.walk.m>=0.8*walkAB.m)||(o.walkStart&&!o.walkStart.near&&o.walkStart.m>=0.8*walkAB.m)))
    && !(walkAB&&o.arr-o.dep>walkAB.min+5);
  let cand=out.filter(sane);
  if(opt.arriveBy!=null) cand=cand.filter(o=>o.arr<=opt.arriveBy);   // „atvykti iki“
  // geography: a ride several times longer than the straight distance is only kept if nothing sensible exists
  // geography: compare the distance actually ridden with the shortest ride among the options
  const minRide=Math.min(...cand.map(rideLen));
  cand=cand.filter(o=>rideLen(o)<=1.6*minRide+1000);
  // trips that take much longer than the quickest one -> drop (later departures of a good trip stay)
  const bestDur=Math.min(...cand.map(o=>o.arr-o.dep));
  cand=cand.filter(o=>o.arr-o.dep<=bestDur*1.5+10);
  // keep non-dominated options
  const better=(p,o)=>p.dep>=o.dep&&p.arr<=o.arr&&p.legs.length<=o.legs.length&&(p.walk||0)<=(o.walk||0)&&(p.dep>o.dep||p.arr<o.arr||p.legs.length<o.legs.length||(p.walk||0)<(o.walk||0));
  // time spent riding and distance ridden: used to prefer the shorter, more direct way when arrival is equal
  cand.forEach(o=>{o.ride=o.legs.reduce((S,l)=>S+l.t.t[l.j]-l.t.t[l.i],0); o.len=rideLen(o);});
  const better2=(p,o)=>better(p,o)||(p.dep===o.dep&&p.arr===o.arr&&p.legs.length===o.legs.length&&(p.walk||0)===(o.walk||0)&&(p.len<o.len-300||(Math.abs(p.len-o.len)<=300&&p.ride<o.ride)));
  const keep=cand.filter(o=>!cand.some(p=>p!==o&&better2(p,o)));
  const seen=new Set();
  const res=keep.sort(opt.arriveBy!=null?(a,b)=>b.dep-a.dep||(a.legs.length-b.legs.length)||((a.walk||0)-(b.walk||0))||(a.len-b.len)||b.arr-a.arr   // atvykimui – vėliausiai išvykstantis pirmas
    :(a,b)=>a.arr-b.arr||(a.legs.length-b.legs.length)||((a.walk||0)-(b.walk||0))||(a.len-b.len)||b.dep-a.dep)
    .filter(o=>{const k=o.dep+'|'+o.arr+'|'+o.legs.map(l=>l.t.r).join();if(seen.has(k))return false;seen.add(k);return true;}).slice(0,5);
  if(res.length) res[0].best=1;   // the earliest arrival is listed first and marked as recommended
  // stops up to ~1.2 km apart: if the bus takes much longer than walking, say so (e.g. against a one-way loop)
  if(opt.arriveBy==null&&!walkAB&&dAB<=2000&&dAB>1200){ const wm=Math.ceil(dAB*1.3/75)+1, m=Math.round(dAB*1.3/10)*10;
    if(!res.length||res[0].arr-T>2*wm){ walkAB={m,min:wm}; res.walkBetter=1; } }   // a long walk is only suggested next to the bus options
  if(!walkAB&&dAB<=1200){ const wm=Math.ceil(dAB*1.3/75)+1, m=Math.round(dAB*1.3/10)*10;
    if(!res.length||res[0].arr-T>wm+5){ walkAB={m,min:wm}; res.walkBetter=1;
      for(let z=res.length-1;z>=0;z--) if(res[z].arr-res[z].dep>2*wm+10||res[z].len>3.5*dAB+3000) res.splice(z,1);   // drop long bus loops
      if(res.length) res[0].best=1; } }
  res.walkAB=walkAB; return res;
}

const map=L.map('map',{zoomControl:true});
['fitBounds','flyToBounds','setView','flyTo','panTo','panInside'].forEach(f=>{const g=map[f].bind(map); map[f]=(...a)=>map.getSize().x?g(...a):map;});   // paslėptas žemėlapis (maršrutų puslapyje) nejudinamas
map.on('layeradd',e=>{const el=e.layer&&(e.layer._path||e.layer._icon); if(el){el.setAttribute('tabindex','-1');el.setAttribute('aria-hidden','true');el.setAttribute('focusable','false');}});
const SMOOTH=matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
function announce(msg){const s=document.getElementById('srstatus'); if(!s) return; s.textContent=''; setTimeout(()=>{s.textContent=msg;},60);}
map.attributionControl.remove();   // map credits are shown at the bottom of the side panel
// built-in street basemap (from OSM data) – shows even where external map tiles are blocked
(function(){const pane=map.createPane('basemap');pane.style.zIndex=150;pane.style.pointerEvents='none';
  const rnd=L.canvas({pane:'basemap'});
  const ST={R:['#FFFFFF',2.2],T:['#FFFFFF',3.4],P:['#FFF6D8',4.4],M:['#FCE7B2',5.4],r:['#B8BCC6',1.4]};
  const CAS={R:3.6,T:5,P:6.2,M:7.4};
  ['R','T','P','M'].forEach(k=>(BASEMAP[k]||[]).forEach(l=>L.polyline(l,{renderer:rnd,pane:'basemap',color:'#C9CED8',weight:CAS[k],interactive:false,lineCap:'round',lineJoin:'round'}).addTo(map)));
  ['R','T','P','M','r'].forEach(k=>(BASEMAP[k]||[]).forEach(l=>L.polyline(l,{renderer:rnd,pane:'basemap',color:ST[k][0],weight:ST[k][1],interactive:false,lineCap:'round',lineJoin:'round'}).addTo(map)));
})();
const BASES=[
  ['Esri gatvės',L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,maxNativeZoom:19,attribution:'Žemėlapis: Esri, OpenStreetMap bendraautoriai'})],
  ['OpenStreetMap',L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{subdomains:'abc',maxZoom:20,maxNativeZoom:19,attribution:'© OpenStreetMap bendraautoriai'})],
  ['Esri palydovas',L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,maxNativeZoom:19,attribution:'Esri World Imagery'})]];
// opened as a local file -> OSM refuses tiles (shows 'Access blocked' images), so start with Esri; otherwise OSM
let baseI=location.protocol==='file:'?0:1, baseErr=0, baseOk=0;
BASES[baseI][1].addTo(map);
BASES.forEach(([n,l],i)=>{l.on('tileload',()=>{if(i===baseI)baseOk++;});l.on('tileerror',()=>{if(i!==baseI)return;baseErr++;
  if(baseErr>=4&&baseOk===0&&!l._tried){l._tried=1;map.removeLayer(l);const nx=BASES.findIndex(b=>!b[1]._tried);if(nx>=0){baseI=nx;baseErr=0;BASES[nx][1].addTo(map);}}});});
L.control.layers(Object.fromEntries(BASES.map(([n,l])=>[n,l])),null,{position:'topleft'}).addTo(map);
map.on('baselayerchange',e=>{baseI=BASES.findIndex(b=>b[1]===e.layer);baseErr=0;baseOk=0;});

const W={};R.forEach((r,i)=>W[r]=7-i*0.55);
const RND=L.canvas({tolerance:10}), STOPRND=L.canvas({pane:'markerPane'});
const lineLayers=[...D.layers].sort((a,b)=>W[b.r]-W[a.r]).map(x=>({x,pl:L.polyline(D.segs[x.g],{renderer:RND,color:C(x.r),weight:x.main?W[x.r]:2.5,dashArray:x.main?null:'5 7',opacity:.9,lineCap:'round',lineJoin:'round'}).addTo(map)}));
function routesNear(latlng){
  const p=map.latLngToLayerPoint(latlng), hit=new Set();
  lineLayers.filter(l=>map.hasLayer(l.pl)).forEach(({x})=>{const pts=D.segs[x.g].map(c=>map.latLngToLayerPoint(c));
    for(let i=0;i<pts.length-1;i++){if(L.LineUtil.pointToSegmentDistance(p,pts[i],pts[i+1])<14){hit.add(x.r);break;}}});
  return [...hit].sort((a,b)=>a-b);
}
lineLayers.forEach(({pl})=>pl.on('click',e=>{
  L.DomEvent.stopPropagation(e);
  const rs=routesNear(e.latlng);
  if(rs.length<=1){selectRoute(rs[0]||pl.options.r);return;}
  const pop=L.popup({className:'rpick'}).setLatLng(e.latlng).setContent(`<div class="pop"><b>Kuris maršrutas?</b><div class="rs">${rs.map(r=>badge(r,1,1)).join('')}</div></div>`).openOn(map);
  pop.getElement().querySelectorAll('[data-sel]').forEach(b=>b.onclick=()=>{map.closePopup();selectRoute(b.dataset.sel);});
}));
const Legend=L.Control.extend({options:{position:'bottomleft'},onAdd(){const d=L.DomUtil.create('div','rleg');d.setAttribute('role','group');d.setAttribute('aria-label','Maršrutai');
  d.innerHTML=R.map(r=>`<button data-leg="${r}" style="--c:${C(r)}" aria-pressed="false" title="${esc(D.meta[r].legend)}">${r}</button>`).join('');
  L.DomEvent.disableClickPropagation(d);
  d.querySelectorAll('[data-leg]').forEach(b=>b.onclick=()=>{const r=b.dataset.leg; if(state.route===r&&!state.stop){state={route:null,day:today,trip:null,stop:null};render(true);} else selectRoute(r);});
  return d;}});
// route-number legend on the map removed (the route list is in the side panel)
const ModeInfo=L.Control.extend({options:{position:'topright'},onAdd(){const d=L.DomUtil.create('div','modeinfo');d.id='modeinfo';d.setAttribute('role','status');L.DomEvent.disableClickPropagation(d);return d;}});
// day-schema badge on the map removed (explained in the side panel and planner results)
function syncLegend(){document.querySelectorAll('[data-leg]').forEach(b=>{const on=b.dataset.leg===state.route;b.classList.toggle('on',on);b.classList.toggle('dim',!!state.route&&!on);b.setAttribute('aria-pressed',on);});}
const markers={};
function nextAt(id){
  const res=[];
  D.trips.forEach(t=>{if(!inDay(t,today))return;t.P.s.forEach((s,i)=>{if(s===id&&i<t.P.s.length-1&&t.t[i]>=nowMin)res.push({t,i});});});
  return res.sort((a,b)=>a.t.t[a.i]-b.t.t[b.i]).slice(0,6);
}
D.stops.forEach(s=>{
  const m=L.circleMarker([s.lat,s.lon],{radius:6,color:'#14213D',weight:3,fillColor:'#fff',fillOpacity:1,dashArray:s.approx?'3 3':null,...(isPhone()?{renderer:STOPRND,interactive:false}:{})}).addTo(map);   // telefone stotelė parenkama pagal artimiausią pirštui (žr. map.on('click'))
  m.bindTooltip(esc(sname(s.id)),{direction:'top',offset:[0,-8],className:'tip'});
  m.on('click',e=>{L.DomEvent.stopPropagation(e); if(simpleMap()||onMapPg()) stopPopup(s.id); else if(onRoutesPg()&&state.route&&!state.stop&&document.querySelector(`.rtab [data-selstop="${s.id}"]`)) pickStop(s.id); else openStop(s.id);});
  markers[s.id]=m;
});
const allBounds=L.latLngBounds(D.stops.map(s=>[s.lat,s.lon]));
// telefone pradinis vaizdas – miesto centras (Kęstučio a.) žemėlapio viduryje, matomos visos stotelės
const CENTER=(s=>s?[s.lat,s.lon]:null)(D.stops.find(s=>s.name==='Kęstučio a.'));
const homeBounds=()=>{ if(!CENTER||!isPhone()) return allBounds;
  const dl=Math.max(CENTER[0]-allBounds.getSouth(),allBounds.getNorth()-CENTER[0]), dn=Math.max(CENTER[1]-allBounds.getWest(),allBounds.getEast()-CENTER[1]);
  return L.latLngBounds([CENTER[0]-dl,CENTER[1]-dn],[CENTER[0]+dl,CENTER[1]+dn]); };
map.fitBounds(homeBounds(),{padding:[20,20]});
let hl=null;
let hov=null;
function hoverStop(id){if(hov){map.removeLayer(hov);hov=null;} const st=STOP[id]; if(!st)return;
  hov=L.layerGroup([L.circleMarker([st.lat,st.lon],{radius:16,color:'#F5B800',weight:4,fill:false,interactive:false}),
    L.circleMarker([st.lat,st.lon],{radius:9,color:'#14213D',weight:3,fillColor:'#F5B800',fillOpacity:1,interactive:false})
     .bindTooltip(esc(sname(id)),{permanent:true,direction:'top',offset:[0,-14],className:'tip'})]).addTo(map);
  hov.eachLayer(l=>l.openTooltip&&l.openTooltip());}
function unhoverStop(){if(hov){map.removeLayer(hov);hov=null;}}
const arrowG=L.layerGroup().addTo(map); let arrowSrc=[];
function setArrows(src){arrowSrc=src;drawArrows();}
function drawArrows(){
  arrowG.clearLayers(); const STEP=150;
  arrowSrc.forEach(({pts,color})=>{
    const P=pts.map(c=>map.latLngToLayerPoint(c)); let acc=STEP*0.5;
    for(let i=0;i<P.length-1;i++){
      const a=P[i],b=P[i+1],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy); if(!len)continue;
      let pos=acc;
      while(pos<=len){const t=pos/len,ll=map.layerPointToLatLng(L.point(a.x+dx*t,a.y+dy*t)),ang=Math.atan2(dy,dx)*180/Math.PI;
        L.marker(ll,{interactive:false,keyboard:false,icon:L.divIcon({className:'arw',iconSize:[24,24],iconAnchor:[12,12],
          html:`<svg width="24" height="24" viewBox="0 0 24 24" style="transform:rotate(${ang}deg)"><path d="M5 4 L21 12 L5 20 L9 12 Z" fill="${color}" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/></svg>`})}).addTo(arrowG);
        pos+=STEP;}
      acc=pos-len;
    }});
}
map.on('zoomend',drawArrows);
function clearHL(){if(hl){map.removeLayer(hl);hl=null;}setArrows([]);}
// telefono planuoklio žemėlapyje paspausta stotelė niekur neperjungia: langelis „Iš čia / Į čia“
function stopPopup(id,note){ const st=STOP[id], box=document.createElement('div'); box.className='stoppop'+(onMapPg()?' sp-map':'');
  box.innerHTML=`${note?`<span class="spnote">${note}</span>`:''}<span class="spn"><b>${esc(st.name)}</b>${(onMapPg()?mapDirOf(id):dirTxt(id))?` <small>${esc(onMapPg()?mapDirOf(id):dirTxt(id))}</small>`:''}</span>
    ${onMapPg()?`<button type="button" class="sptt" data-tt aria-label="Stotelės ${esc(st.name)} tvarkaraštis">Tvarkaraštis ›</button>`:''}<span class="spb"><button type="button" data-w="from" aria-label="Važiuosiu iš stotelės ${esc(st.name)}"><span class="spi spg" aria-hidden="true"></span>Iš čia</button><button type="button" data-w="to" aria-label="Važiuosiu į stotelę ${esc(st.name)}"><span class="spi spr" aria-hidden="true"></span>Į čia</button>${onMapPg()?'':`<button type="button" data-tt aria-label="Stotelės ${esc(st.name)} tvarkaraštis"><svg class="spc" aria-hidden="true" viewBox="0 0 16 16" width="15" height="15"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 4.3V8l2.6 1.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>Tvarkaraštis</button>`}</span>`;   // 3 mygtukai vienoje eilutėje: ikonėlė + žodis   // žemėlapio puslapyje pagrindinis – tvarkaraštis
  const pop=L.popup({closeButton:false,autoPanPadding:[6,6],maxWidth:300,className:'stoppopw'}).setLatLng([st.lat,st.lon]).setContent(box).openOn(map);
  box.querySelectorAll('[data-tt]').forEach(b=>b.onclick=()=>{ map.closePopup(pop); openStop(id); });
  box.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{ map.closePopup(pop); const w=b.dataset.w; if(onMapPg()||onRoutesPg()){ setPage('plan','push'); state={route:null,day:today,trip:null,stop:null,dir:null,variant:null}; render(true); }   // iš žemėlapio – į planuoklį
    if(w==='from') plan.from=st.name; else plan.to=st.name;
    if(plan.from===plan.to){ if(w==='from') plan.to=''; else plan.from=''; }
    renderBar();
    if(plan.from&&plan.to){ refreshTime(); updPlan(); }
    else announce(w==='from'?`Išvykimo stotelė: ${st.name}. Pasirinkite, kur važiuosite.`:`Atvykimo stotelė: ${st.name}. Pasirinkite, iš kur važiuosite.`); }); }
// pasirinktos stotelės planuoklio žemėlapyje: išvykimo – žalia, atvykimo – raudona (kol kelionė dar nenupiešta)
function markSel(){ if(!simpleMap()||onRoutesPg()||plan.res.length) return;
  D.stops.forEach(s=>{const m=markers[s.id], f=s.name===plan.from, t=s.name===plan.to;
    m.setStyle(f||t?{opacity:1,fillOpacity:1,radius:7,weight:2,color:'#fff',fillColor:f?'#0B7A3E':'#B42318'}:stopBase()); if(f||t) m.bringToFront();}); }
// telefono planuoklio žemėlapis paprastas: be maršrutų linijų; telefone stotelės visur maži geltoni taškai
const simpleMap=()=>isPhone()&&!onMapPg();
let wasSimple=null;
const stopBase=()=>isPhone()?{opacity:1,fillOpacity:1,radius:5.5,weight:2,color:'#14213D',fillColor:'#F5B800'}:{opacity:1,fillOpacity:1,radius:6,weight:3,color:'#14213D',fillColor:'#fff'};
function applyMode(){ if(wasSimple!==isPhone()){ wasSimple=isPhone(); D.stops.forEach(s=>markers[s.id].setStyle(stopBase())); }
  lineLayers.forEach(l=>{const on=layerOn(l.x)&&!simpleMap(); if(on&&!map.hasLayer(l.pl)) l.pl.addTo(map); else if(!on&&map.hasLayer(l.pl)) l.pl.remove();});
  const el=document.getElementById('modeinfo'); if(el) el.innerHTML=MODE()==='D'?'<b>Darbo dienų schema</b><span class="mi2"><br>į Užupį – apylanka per magistralę, visą dieną</span>':'<b>Poilsio dienų schema</b><span class="mi2"><br>be apylankos, tiltu abiem kryptimis</span>';}
function fade(on){lineLayers.forEach(({x,pl})=>pl.setStyle(on?{opacity:.12}:{opacity:.9}));
  D.stops.forEach(s=>markers[s.id].setStyle(on?{opacity:.25,fillOpacity:.25,radius:simpleMap()?3:4}:stopBase()));}
function drawLegs(legs,fit){
  clearHL(); fade(true); hl=L.layerGroup().addTo(map); const all=[];
  legs.forEach(l=>{const p=l.t.P,seg=p.line.slice(p.idx[l.i],p.idx[l.j]+1);all.push(...seg);
    L.polyline(seg,{color:C(l.t.r),weight:6,opacity:1,lineCap:'round'}).addTo(hl);
    for(let k=l.i;k<=l.j;k++){const s=STOP[p.s[k]];L.circleMarker([s.lat,s.lon],{radius:k===l.i||k===l.j?8:5,color:C(l.t.r),weight:3,fillColor:'#fff',fillOpacity:1}).on('click',e=>{L.DomEvent.stopPropagation(e); if(simpleMap()) stopPopup(s.id); else openStop(s.id);}).addTo(hl).bindTooltip(`${esc(s.name)} <b>${hm(l.t.t[k])}</b>`,{direction:'top',className:'tip'});}});
  setArrows(legs.map(l=>({pts:l.t.P.line.slice(l.t.P.idx[l.i],l.t.P.idx[l.j]+1),color:C(l.t.r)})));
  legs.forEach((l,k)=>{ if(!k||!l.walk) return; const p=STOP[legs[k-1].t.P.s[legs[k-1].j]], q=STOP[l.walk.id];
    if(p&&q){ L.polyline([[p.lat,p.lon],[q.lat,q.lon]],{color:'#3b4252',weight:4,dashArray:'2 8',lineCap:'round',interactive:false}).addTo(hl); all.push([p.lat,p.lon],[q.lat,q.lon]); }});
  const o0=plan.res[plan.opt]; if(o0&&o0.walkStart){const p=STOP[o0.walkStart.from],q=STOP[o0.walkStart.to];
    if(p&&q){ L.polyline([[p.lat,p.lon],[q.lat,q.lon]],{color:'#3b4252',weight:4,dashArray:'2 8',lineCap:'round',interactive:false}).addTo(hl); all.push([p.lat,p.lon],[q.lat,q.lon]); }}
  const oo=plan.res[plan.opt]; if(oo&&oo.walkEnd){const l=legs[legs.length-1],p=STOP[l.t.P.s[l.j]],q=STOP[oo.walkEnd.to];
    if(p&&q){ L.polyline([[p.lat,p.lon],[q.lat,q.lon]],{color:'#3b4252',weight:4,dashArray:'2 8',lineCap:'round',interactive:false}).addTo(hl); all.push([p.lat,p.lon],[q.lat,q.lon]); }}
  const pin=(id,cls,txt)=>{const s=STOP[id];L.marker([s.lat,s.lon],{zIndexOffset:1000,icon:L.divIcon({className:'',html:`<div class="pin ${cls}"></div>`,iconSize:[28,28],iconAnchor:[14,14]})}).on('click',e=>{L.DomEvent.stopPropagation(e); if(simpleMap()) stopPopup(id); else openStop(id);}).addTo(hl).bindTooltip(txt,{permanent:true,direction:'top',offset:[0,-14],className:'tip'});};
  const a=legs[0],z=legs.at(-1);
  pin(a.t.P.s[a.i],'start',`<b>${hm(a.t.t[a.i])}</b> ${badge(a.t.r)} ${esc(nm(a.t.P.s[a.i]))}`);
  if(legs.length>1&&legs[1].t.r!==legs[0].t.r&&!legs[1].cont){const b=legs[1];pin(b.t.P.s[b.i],'xfer',`🔁 <b>${hm(b.t.t[b.i])}</b> ${badge(b.t.r)} ${esc(nm(b.t.P.s[b.i]))}`);}
  pin(z.t.P.s[z.j],'end',`<b>${hm(z.t.t[z.j])}</b> ${esc(nm(z.t.P.s[z.j]))}`);
  if(fit) map.fitBounds(all,isPhone()&&!mapBig?{paddingTopLeft:[18,50],paddingBottomRight:[18,14],maxZoom:16}:{padding:[60,60],maxZoom:16});   // mažame žemėlapyje viršuje vieta mygtukui „Padidinti“
}
let stopShown=null;
function closeStop(){ if(history.state&&history.state.s) history.back(); else { state.stop=null; render(false); } }
function openStop(id){ const had=!!state.stop; state.stop=id;   // telefone laikai – lange virš bet kurio puslapio
  if(isPhone()&&tourI<0){ const hs={pg:page,r:state.route,s:id}; if(had&&history.state&&history.state.s) history.replaceState(hs,'',location.href); else history.pushState(hs,'',location.href); }   // telefono „Atgal“ uždaro tvarkaraštį
  render(false);announce(`Stotelės ${sname(id)} tvarkaraštis.`);}
const DCOL=[['W','Darbo dienomis'],['WE','Poilsio dienomis']];
function ttBlock(b,k,all,dlg){   // dlg – telefono lange: pirmame bloke stotelės pavadinimas ir ✕
  const cols={W:b.W,WE:[...b.Sat.map(x=>[...x,'s']),...b.WE].sort((x,y)=>x[0]-y[0]||x[1]-y[1])};
  const use=DCOL.filter(([d])=>cols[d].length), miss=DCOL.filter(([d])=>!cols[d].length);
  const hours=[...new Set(use.flatMap(([d])=>cols[d].map(x=>x[0])))].sort((a,c)=>a-c);
  const curH=Math.floor(nowMin/60);
  const cell=(d,h)=>cols[d].filter(x=>x[0]===h).map(x=>`<span class="${x[3]==='s'?'sat':''}">${String(x[1]).padStart(2,'0')}${x[2]?`<sup>${'*'.repeat(x[2])}</sup>`:''}${x[3]==='s'?'<sup>š</sup>':''}</span>`).join(' ');
  const notes=Object.entries(b.notes);
  const top=dlg&&!k, st=top&&STOP[state.stop];
  return `<section class="ttb"><div class="tth">${badge(b.r,1)}${top?`<span class="ttl"><b id="stopdlg-h">${esc(st.name)}</b>kryptis ${esc(b.dest)}</span><button type="button" class="clr" data-stopclose aria-label="Uždaryti tvarkaraštį">✕</button>`:`<span class="ttl">kryptis<b>${esc(b.dest)}</b></span>`}</div>
  ${use.length?`<table class="tt"><thead><tr><th>Val.</th>${use.map(([d,l])=>`<th class="${d===viewDay?'today':''}">${l}</th>`).join('')}</tr></thead>
  <tbody>${hours.map(h=>`<tr class="${h===curH?'now':''}"><th>${String(h%24).padStart(2,'0')}</th>${use.map(([d])=>`<td class="${d===viewDay?'today':''}">${cell(d,h)}</td>`).join('')}</tr>`).join('')}</tbody></table>`:''}
  ${b.Sat.length?`<p class="ttm"><sup>š</sup> – tik šeštadieniais</p>`:''}
  ${notes.length?`<ul class="ttn">${notes.map(([k,v])=>`<li><sup>${'*'.repeat(+k)}</sup> ${esc(v)}</li>`).join('')}</ul>`:''}
  ${miss.length?`<p class="ttm">Nevažiuoja: ${miss.map(([,l])=>l.toLowerCase()).join(', ')}</p>`:''}</section>`;
}
function routeStops(r){
  const cnt=new Map(); D.stops.forEach(st=>{const c=(TTS[st.id]||[]).filter(b=>b.r===r).reduce((s,b)=>s+b.W.length+b.Sat.length+b.WE.length,0); if(c) cnt.set(st.id,c);});
  const vals=[...cnt.values()].sort((a,b)=>a-b), med=vals[Math.floor(vals.length/2)]||0;
  let best=null,bc=-1;
  D.pats.filter(p=>p.r===r).forEach(p=>{const c=new Set(p.s.filter(i=>cnt.has(i))).size; if(c>bc){bc=c;best=p;}});
  const order=[];(best?best.s:[]).forEach(i=>{if(cnt.has(i)&&!order.includes(i))order.push(i);});
  const rest=[...cnt.keys()].filter(i=>!order.includes(i)).sort((a,b)=>nm(a).localeCompare(nm(b),'lt'));
  const part=i=>cnt.get(i)<0.3*med;
  return {main:[...order.filter(i=>!part(i)),...rest.filter(i=>!part(i))],other:[...order,...rest].filter(part)};
}
function selectRoute(r){ rbDay=null; state.rv=null; if(isPhone()&&page!=='routes') setPage('routes',tourI<0?'push':''); setTimeout(()=>announce(`Atidarytas ${r} maršrutas: ${D.meta[r].legend}.`),0);state={route:r,day:D.trips.some(t=>t.r===r&&inDay(t,today))?today:(['W','WE'].find(d=>D.trips.some(t=>t.r===r&&inDay(t,d)))),trip:null,stop:null,dir:null,variant:null};
  if(!runsDay(r,viewDay)) viewDay=['W','WE'].find(d=>runsDay(r,d))||viewDay;   // iškart rodoma diena, kai maršrutas važiuoja
  if(onRoutesPg()&&tourI<0&&!(history.state&&history.state.r)) history.pushState({pg:'routes',r},'',location.href);   // telefono „Atgal“ uždaro skirtuką
  render(true); document.getElementById('panel').scrollTop=0;}
function routeView(fit){
  clearHL(); const r=state.route;
  const inDir=x=>x.r===r&&layerOn(x)&&(!state.dir||(x.ds||[x.d]).includes(state.dir));
  const vs=VSEL();
  lineLayers.forEach(({x,pl})=>{const isV=vs&&!x.main&&x.r===r&&vs.vars.includes(x.v);
    pl.setStyle({opacity:isV?.9:inDir(x)?(vs?.3:1):(x.r===r&&layerOn(x))?.18:0,weight:x.main?W[x.r]:2.5,dashArray:x.main?null:'8 7'}); if(inDir(x)||isV) pl.bringToFront();});
  if(vs&&vs.path&&vs.path.length){
    // whole trip of the selected variant: thick line, arrows, start/end with times
    hl=L.layerGroup().addTo(map);
    vs.path.forEach(g=>L.polyline(D.segs[g],{color:C(r),weight:W[r],opacity:1,lineCap:'round',lineJoin:'round',interactive:false}).addTo(hl));
    const pin=(id,cls,txt)=>{const s=STOP[id];if(!s)return;L.marker([s.lat,s.lon],{zIndexOffset:1000,interactive:false,icon:L.divIcon({className:'',html:`<div class="pin ${cls}"></div>`,iconSize:[28,28],iconAnchor:[14,14]})}).addTo(hl).bindTooltip(txt,{permanent:true,direction:'top',offset:[0,-14],className:'tip'});};
    pin(vs.a,'start',`<b>${hm(vs.ta)}</b> ${esc(nm(vs.a))}`); pin(vs.b,'end',`<b>${hm(vs.tb)}</b> ${esc(nm(vs.b))}`);
    setArrows(vs.path.map(g=>({pts:D.segs[g],color:C(r)})));
  } else setArrows(vs?lineLayers.filter(l=>!l.x.main&&l.x.r===r&&vs.vars.includes(l.x.v)).map(l=>({pts:D.segs[l.x.g],color:C(r)})):state.dir?lineLayers.filter(l=>inDir(l.x)&&l.x.main).map(l=>({pts:D.segs[l.x.g],color:C(r)})):[]);
  const dirStops=new Set(D.layers.filter(inDir).flatMap(x=>x.ab));
  const routeStopsOnMap=new Set(D.layers.filter(x=>x.r===r&&x.m===MODE()&&x.main).flatMap(x=>x.ab));
  const servesToday=id=>(TTS[id]||[]).some(b=>b.r===r&&(viewDay==='W'?b.W.length:(b.WE.length||b.Sat.length)));
  const ph=isPhone(), pts=[];
  D.stops.forEach(s=>{const on=(servesToday(s.id)||routeStopsOnMap.has(s.id))&&(!state.dir||dirStops.has(s.id)); if(on) pts.push([s.lat,s.lon]);
    markers[s.id].setStyle(on?(ph?{opacity:1,fillOpacity:1,radius:4.5,weight:2,color:C(r),fillColor:'#F5B800'}:{opacity:1,fillOpacity:1,radius:6,color:C(r),fillColor:'#fff'})
      :(ph?{opacity:.25,fillOpacity:.25,radius:3,weight:1.5,color:'#14213D',fillColor:'#F5B800'}:{opacity:.2,fillOpacity:.2,radius:4,color:'#14213D'}));});
  // telefone atidarius maršrutą žemėlapis priartinamas tik prie jo
  if(fit&&ph&&pts.length) map.fitBounds(pts,mapBig?{padding:[40,40],maxZoom:16,animate:false}:{paddingTopLeft:[18,50],paddingBottomRight:[18,14],maxZoom:16,animate:false});
}
const runsDay=(r,d)=>D.trips.some(t=>t.r===r&&inDay(t,d));
const dayTog=r=>`<div class="days vtog" role="group" aria-label="Diena maršrutams ir tvarkaraščiams">${['W','WE'].map(d=>{const off=r&&!runsDay(r,d);   // dieną, kai maršrutas nevažiuoja, mygtukas neaktyvus
  return `<button type="button" data-vday="${d}" class="${viewDay===d?'on':''}" aria-pressed="${viewDay===d}"${off?` disabled title="Šią dieną ${r} maršrutas nevažiuoja"`:''}>${DAYS[d]}</button>`;}).join('')}</div>`;
// telefone: kryptis → visos stotelės (retesnių reisų stotelės – punktyru) → paspaudus stotelę jos laikai
const mergeOrd=(a,b)=>{const out=[...a]; let pos=-1, buf=[];   // b įterpiama į a: naujos stotelės – prieš kitą bendrą stotelę (arba po paskutinės)
  b.forEach(i=>{let k=out.indexOf(i,pos+1); if(k<0) k=out.indexOf(i); if(k<0){buf.push(i);return;} if(buf.length){ if(k<=pos) k=pos+1; out.splice(k,0,...buf); k+=buf.length; buf=[]; } pos=k;});
  out.splice(pos+1,0,...buf); return out;};
const tripRuns=t=>{ if(t.runs) return t.runs; const md=t.d==='W'?'D':'O', runs=[];   // reisas suskaidytas į atkarpas pagal kryptį
  t.P.s.slice(0,-1).forEach((a,i)=>{const b=t.P.s[i+1], ab=x=>x.r===t.r&&x.ab[0]===a&&x.ab[1]===b, lys=D.layers.filter(x=>ab(x)&&x.m===md), ks=[...new Set((lys.length?lys:D.layers.filter(ab)).flatMap(x=>x.ds||[x.d]))], L=runs.at(-1);
    if(L&&(!ks.length||ks.includes(L.d))) L.s.push(b); else if(L&&L.d===null){L.d=ks[0];L.s.push(b);} else runs.push({d:ks[0]||null,s:[a,b],i0:i});});
  return t.runs=runs; };
const dname=x=>x.replace(/ ir atgal į AS$/,'');
let rbDay=null;   // telefono maršruto sąraše rodoma diena (tik kai poilsio dienų maršrutas kitoks)
const rbRuns=(r,md,d)=>D.trips.filter(t=>t.r===r&&(t.d==='W'?'D':'O')===md).flatMap(t=>tripRuns(t).filter(x=>x.d===d).map(x=>({t,s:x.s.filter(i=>STOP[i])})));
function rbOrder(runs){
  const pc=new Map(); runs.forEach(x=>{const k=x.s.join(); const e=pc.get(k)||{s:x.s,n:0}; e.n++; pc.set(k,e);});
  return [...pc.values()].sort((x,y)=>y.n*y.s.length-x.n*x.s.length).map(e=>e.s).reduce((o,sq)=>o?mergeOrd(o,sq):[...sq],null)||[];
}
const rbMode=r=>{const hasW=runsDay(r,'W'), hasE=runsDay(r,'WE'), dflt=hasW&&(today==='W'||!hasE)?'D':'O'; return rbDay&&(rbDay==='D'?hasW:hasE)?rbDay:dflt;};
// stotelės lange – tik pasirinktos krypties blokai: bloko išvykimai sutapatinami su reisais ir jų kryptimi
const legDirName=(t,i)=>{const x=tripRuns(t).find(x=>i>=x.i0&&i<x.i0+x.s.length-1), dd=x&&((D.dirs[t.r]||{})[t.d==='W'?'D':'O']||{})[x.d]; return dd?dname(dd.to):null;};
function blkInDir(b,id,r,want,md){ let y=0,n=0;   // tikrinami tik pasirinktos dienos išvykimai
  [['W',b.W],['WE',[...b.Sat,...b.WE]]].filter(([day])=>(day==='W')===(md==='D')).forEach(([day,arr])=>arr.forEach(([h,m])=>{const mm=(h*60+m)%1440;
    D.trips.forEach(t=>{ if(t.r!==r||!inDay(t,day)) return; t.P.s.forEach((s,i)=>{ if(s===id&&i<t.P.s.length-1&&t.t[i]%1440===mm){const k=legDirName(t,i); if(k===want) y++; else if(k) n++;} }); });}));
  return y>n; }
// ---- telefono „Maršrutai ir reisai“: maršruto unikalūs reisai (stotelių sekos) pasirinktą dieną; paspaudus – linija žemėlapyje ----
function rvList(r){ const md=rbMode(r), day=md==='D'?'W':'WE', by=new Map();
  D.trips.filter(t=>t.r===r&&inDay(t,day)).forEach(t=>{ if(!by.has(t.p)) by.set(t.p,[]); by.get(t.p).push(t); });
  const L=[...by.entries()].map(([p,ts])=>({p,ts:ts.sort((a,b)=>a.t[0]-b.t[0]),P:D.pats[p]})).sort((a,b)=>b.ts.length-a.ts.length||a.ts[0].t[0]-b.ts[0].t[0]);
  const td=dayInfo(isoDate(new Date())).day===day;
  L.forEach(v=>{ v.rep=(td&&v.ts.find(t=>t.t[0]>=nowMin))||v.ts[0]; const a=v.P.s[0], z=v.P.s.at(-1);
    const ref=L.find(w=>w!==v&&nm(w.P.s[0])===nm(a)&&nm(w.P.s.at(-1))===nm(z));   // tie patys galai – parodome, kuo skiriasi
    const ex=ref?v.P.s.filter(id=>!ref.P.s.some(x=>nm(x)===nm(id))).map(nm):[];
    v.via=ex.length?'per '+[...new Set(ex)].slice(0,2).join(', '):ref&&ref.P.s.length>v.P.s.length?'trumpesnis':'';
    v.dur=v.rep.t.at(-1)-v.rep.t[0]; });
  return {L,md,day}; }
const rvSel=r=>{ const {L}=rvList(r); return L.find(v=>v.p===state.rv)||null; };
function routeVars(r){ const {L,md}=rvList(r), hasW=runsDay(r,'W');
  const dayLine=`<div class="days vtog" role="group" aria-label="Diena">${[['D','W'],['O','WE']].map(([m,dy])=>{const off=!runsDay(r,dy);
    return `<button type="button" data-rbday="${m}" class="${md===m?'on':''}" aria-pressed="${md===m}"${off?` disabled title="Šią dieną ${r} maršrutas nevažiuoja"`:''}>${DAYS[dy]}</button>`;}).join('')}</div>${!hasW&&!D.trips.some(t=>t.r===r&&t.d==='WE')?'<p class="sub" style="margin-top:.5rem"><b>Važiuoja tik šeštadieniais.</b></p>':''}`;
  const card=v=>{ const on=v.p===state.rv, st=v.P.s.length;
    return `<li><button type="button" class="rvb${on?' on':''}" data-rv="${v.p}" aria-pressed="${on}" style="--rc:${C(r)}"><span class="rvh"><b>${esc(nm(v.P.s[0]))} → ${esc(nm(v.P.s.at(-1)))}</b>${v.via?`<small>${esc(v.via)}</small>`:''}</span>
      <span class="rvn">${v.ts.length} ${v.ts.length===1?'reisas':v.ts.length<10?'reisai':'reisų'}</span><span class="rvm">${st} ${stotW(st)} · ~${v.dur} min.</span>
      <span class="rvt">${v.ts.map(t=>hm(t.t[0])).join(' · ')}</span></button></li>`; };
  const main=L.filter(v=>v.ts.length>=3), rest=L.filter(v=>v.ts.length<3);
  return `${dayLine}<h3 class="ph sth">Reisai</h3><p class="sub" style="margin-top:.1rem">Paspauskite reisą – jo kelias bus parodytas žemėlapyje. Laikai – išvykimas iš pirmos stotelės.</p>
    ${L.length?`<ul class="rvlist">${(main.length?main:rest).map(card).join('')}</ul>${main.length&&rest.length?`<details class="rvmore"${rest.some(v=>v.p===state.rv)?' open':''}><summary>Kiti reisai (${rest.length}) – važiuoja 1–2 kartus per dieną</summary><ul class="rvlist">${rest.map(card).join('')}</ul></details>`:''}`
      :'<div class="empty">Šią dieną šis maršrutas nevažiuoja.</div>'}`;
}
function routeBodyPhone(r){
  const hasW=runsDay(r,'W'), md=rbMode(r), DD=(D.dirs[r]||{})[md]||{};
  if(!state.dir||!DD[state.dir]) state.dir=DD.A?'A':Object.keys(DD)[0]||null;
  const d=state.dir, runs=rbRuns(r,md,d), ord=rbOrder(runs);
  const cntOf=rs=>{const c={}; rs.forEach(x=>new Set(x.s).forEach(i=>{c[i]=(c[i]||0)+1;})); return c;};
  const wk=cntOf(runs),nW=runs.length;
  const rare=i=>(wk[i]||0)<nW*.5, note=i=>rare(i)?'tik dalis reisų':'';
  const dayLine=`<div class="days vtog" role="group" aria-label="Diena">${[['D','W'],['O','WE']].map(([m,dy])=>{const off=!runsDay(r,dy);
    return `<button type="button" data-rbday="${m}" class="${md===m?'on':''}" aria-pressed="${md===m}"${off?` disabled title="Šią dieną ${r} maršrutas nevažiuoja"`:''}>${DAYS[dy]}</button>`;}).join('')}</div>${!hasW&&!D.trips.some(t=>t.r===r&&t.d==='WE')?'<p class="sub" style="margin-top:.5rem"><b>Važiuoja tik šeštadieniais.</b></p>':''}`;
  const dirBtns=Object.keys(DD).length>1?`<div class="days dirs" role="group" aria-label="Kryptis">${['A','B'].filter(k=>DD[k]).map(k=>`<button data-dir="${k}" class="${d===k?'on':''}" aria-pressed="${d===k}">→ ${esc(DD[k].to)}</button>`).join('')}</div>`
    :DD[d]?`<p class="sub" style="margin-top:.3rem">Kryptis: <b>${esc(DD[d].to)}</b></p>`:'';
  const item=(i,k)=>`<li class="${rare(i)?'var':''}"><button class="srow" data-openstop="${i}"><span class="dot"></span><span>${esc(nm(i))}${note(i)&&!(k&&rare(ord[k-1]))?`<small>${note(i)}</small>`:''}</span></button></li>`;   // užrašas – tik pirmoje punktyrinės dalies stotelėje
  return `${dayLine}${dirBtns}
  <h3 class="ph sth">Stotelės</h3><p class="sub" style="margin-top:.1rem">Paspauskite stotelę – pamatysite jos laikus.${ord.some(rare)?' Punktyru – stotelės, pro kurias važiuoja ne visi reisai.':''}</p>
  <ol class="strip" style="--rc:${C(r)}">${ord.map(item).join('')}</ol>`;
}
// maršruto turinys: diena, kryptis, stotelės, kiti reisai (kompiuteryje – atskiras vaizdas, telefone – skirtuke virš sąrašo)
function routeBody(r){
  if(onRoutesPg()) return routeVars(r);
  let rs=routeStops(r);
  const DR=DIRS(r);
  let VAR=new Set();
  if(state.dir&&DR[state.dir]){const vv=new Set(DR[state.dir].var||[]); rs={main:DR[state.dir].order.filter(i=>STOP[i]&&!vv.has(i)),other:[]};}
  else if(DR.A){const vv=new Set([...(DR.A.var||[]),...((DR.B||{}).var||[])]); rs={main:DR.A.order.filter(i=>STOP[i]&&!vv.has(i)),other:[]};}
  const VARS=((D.variants[r]||{})[MODE()]||[]).filter(v=>!state.dir||v.dir===state.dir);
  const varHtml=VARS.length?`<h3 class="ph vhead" style="margin-top:1rem;font-size:1rem">Kiti reisai</h3>
    <p class="sub" style="margin:.1rem 0 .4rem">Retesni reisai, kurie važiuoja kitur nei pagrindinis maršrutas. Paspauskite – parodysiu žemėlapyje.</p>
    <ul class="vlist">${VARS.map(v=>`<li><button data-var="${esc(v.label)}" class="${state.variant===v.label?'on':''}" aria-pressed="${state.variant===v.label}"><b>${esc(v.label)}</b><small>${v.from?`išvyksta iš stotelės „${esc(v.from)}“: `:'išvyksta: '}${v.times.map(hm).join(', ')}</small></button>
      ${state.variant===v.label&&v.seq&&v.seq.length?`<p class="sub" style="margin:.4rem 0 .2rem">Stotelės ir laikai ${v.times.length>1?`(${hm(v.seq[0][1])} reiso; kitų reisų laikai atitinkamai vėlesni)`:''}:</p>
      <ol class="strip vstrip" style="--rc:${C(r)}">${v.seq.filter(([i])=>STOP[i]).map(([i,t],k)=>`<li><button class="srow" data-openstop="${i}"><span class="dot"></span><span>${esc(nm(i))}</span><span class="tm">${hm(t)}</span></button></li>`).join('')}</ol>`:''}</li>`).join('')}</ul>`:'';
  const dirBtns=Object.keys(DR).length>=1?`<div class="days dirs" role="group" aria-label="Kryptis">
    ${['A','B'].filter(d=>DR[d]).map(d=>`<button data-dir="${d}" class="${state.dir===d?'on':''}" aria-pressed="${state.dir===d}">→ ${esc(DR[d].to)}</button>`).join('')}</div>`:'';
  const pick=false, sel=null;   // maršrutų puslapyje žemėlapio nėra – stotelė atsidaro iškart
  const item=i=>`<li class="${VAR.has(i)?'var':''}${i===sel?' sel':''}"><button class="srow${i===sel?' on':''}" ${pick?`data-selstop="${i}" aria-expanded="${i===sel}"`:''} data-openstop="${i}"><span class="dot"></span><span>${esc(nm(i))}${VAR.has(i)?'<small>tik dalis reisų</small>':''}</span><span class="xfer">${STOP[i].routes.filter(x=>x!==r).map(x=>badge(x)).join('')}</span></button>${i===sel?`<button type="button" class="srtt" data-ttstop="${i}">Žiūrėti tvarkaraštį ›</button>`:''}</li>`;
  return `${dayTog(r)}${viewDay!=='W'&&D.trips.some(t=>t.r===r&&t.d==='Sat')&&!D.trips.some(t=>t.r===r&&t.d==='WE')?'<p class="sub" style="margin-top:.5rem"><b>Važiuoja tik šeštadieniais.</b></p>':''}${runsOn(r)?dirBtns:`<div class="empty" style="margin-top:.8rem">Pasirinktą dieną (${DAYS[viewDay].toLowerCase()}) šis maršrutas nevažiuoja.</div>`}
  <p class="sub" style="margin-top:.6rem">${pick?'Paspauskite stotelę – ji bus parodyta žemėlapyje, o po ja – nuoroda į tvarkaraštį.':'Paspauskite stotelę – pamatysite jos tvarkaraštį.'}</p>
  <ol class="strip" style="--rc:${C(r)}">${rs.main.map(item).join('')}</ol>
  ${varHtml}
  <p class="note">Spalvoti ženkliukai rodo, kokie kiti maršrutai sustoja toje stotelėje.</p>`;
}
// telefono maršrutų puslapyje atidarytas maršrutas – skirtukas po antrašte „Maršrutai ir tvarkaraščiai“ (žemėlapis lieka)
let tabShown=null;
const routeTab=r=>{const nw=tabShown!==r; tabShown=r; return `<section class="rtab" aria-label="${r} maršrutas"><button type="button" class="rcard rcard-open" data-rclose aria-label="${r} maršrutas: ${esc(D.meta[r].legend)}. Uždaryti maršrutą">${badge(r,1)}<span>${esc(D.meta[r].legend)}</span><span class="chev" aria-hidden="true">✕</span></button><div${nw?' class="rtab-in"':''}>${routeBody(r)}</div></section>`;};   // atidaryta kortelė atrodo kaip sąraše, tik vietoj › – ✕
function closeRoute(){ if(history.state&&history.state.r) history.back(); else { state={route:null,day:today,trip:null,stop:null,dir:null,variant:null}; render(true); fitAll(); document.getElementById('panel').scrollTop=0; } }
const rdays=r=>{const w=D.trips.some(t=>t.r===r&&t.d==='W'),we=D.trips.some(t=>t.r===r&&t.d==='WE'),sa=D.trips.some(t=>t.r===r&&t.d==='Sat');return [w?'darbo dienomis':'',we?'poilsio dienomis':(sa?'tik šeštadieniais':'')].filter(Boolean).join(', ');};
// telefono „Stotelių tvarkaraščiai“: visos stotelės abėcėlės tvarka, abi gatvės pusės atskirai su kryptimi; paspaudus – laikų langas
function stopList(){ const L=[...D.stops].filter(s=>TTS[s.id]).sort((a,b)=>a.name.localeCompare(b.name,'lt')||dirTxt(a.id).localeCompare(dirTxt(b.id),'lt'));
  return `<p class="sub" style="margin:.1rem 0 .6rem">Paspauskite stotelę – pamatysite jos laikus.</p><ul class="slist">${L.map(st=>`<li><button type="button" class="slrow" data-openstop="${st.id}"><span class="sln"><b>${esc(st.name)}</b>${dirTxt(st.id)?`<small>${esc(dirTxt(st.id))}</small>`:''}</span><span class="xfer">${st.routes.map(x=>badge(x)).join('')}</span><span class="chev" aria-hidden="true">›</span></button></li>`).join('')}</ul>`; }
const rcard=r=>`<button class="rcard" data-sel="${r}">${badge(r,1)}<span>${esc(D.meta[r].legend)}${isPhone()?'':`<small>${rdays(r)}</small>`}</span><span class="chev" aria-hidden="true">›</span></button>`;
// telefono maršrutų puslapyje poraštė – sąrašo gale (ne visada matoma)
function addFoot(el){ if(onRoutesPg()) el.insertAdjacentHTML('beforeend',`<div class="pfoot">${document.getElementById('appfoot').innerHTML}</div>`); }
// telefono maršruto skirtuke paspausta stotelė pažymima sąraše ir žemėlapyje; tvarkaraštis – atskiru mygtuku
let selStop=null;
function pickStop(id){ selStop=selStop&&selStop.id===id&&selStop.r===state.route?null:{r:state.route,id}; render(false);
  if(!selStop) return; const st=STOP[id]; if(!map.getBounds().pad(-.1).contains([st.lat,st.lon])) map.panTo([st.lat,st.lon],{animate:false});
  const row=document.querySelector('.rtab li.sel'), pn=document.getElementById('panel');
  if(row){ const r=row.getBoundingClientRect(), p=pn.getBoundingClientRect(), top=p.top+(document.querySelector('.rthead,.rcard-open')||{offsetHeight:0}).offsetHeight+8;
    if(r.top<top||r.bottom>p.bottom) pn.scrollTop+=r.top-top-40; } }
// telefono maršrutų puslapyje stotelės laikai – langas virš sąrašo (kaip instrukcija); sąrašas lieka po juo
// to paties maršruto blokai sujungiami į vieną lentelę: pagrindinė kryptis – daugiausia reisų, kitų reisų kryptis – žvaigždute
function mergeBlocks(bl){ const by=new Map(); bl.forEach(b=>{ if(!by.has(b.r)) by.set(b.r,[]); by.get(b.r).push(b); });
  return [...by.values()].map(g=>{ if(g.length===1) return g[0];
    const n=b=>b.W.length+b.Sat.length+b.WE.length, [m,...rest]=[...g].sort((a,b)=>n(b)-n(a)), notes={...m.notes}, idx={};
    Object.entries(m.notes).forEach(([k,v])=>idx[v]=+k); let k=Math.max(0,...Object.keys(m.notes).map(Number));
    const tag=(b,x)=>{ const t='kryptis '+b.dest+(x[2]&&b.notes[x[2]]?' – '+b.notes[x[2]]:''); if(!idx[t]){ idx[t]=++k; notes[k]=t; } return [x[0],x[1],idx[t]]; };
    const col=c=>[...m[c],...rest.flatMap(b=>b[c].map(x=>tag(b,x)))].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    return {...m,W:col('W'),Sat:col('Sat'),WE:col('WE'),notes}; }); }
// stotelės langas: viršuje maršrutų skirtukai, apačioje pasirinkto maršruto laikai kaip plakate (darbo dienos ir savaitgalis greta)
let dlgRoute=null;
function routeTTHtml(st,bl){
  if(!bl.length) return '<div class="empty">Šios stotelės tvarkaraščio plakate nėra.</div>';
  const b=bl.find(x=>x.r===dlgRoute)||bl[0], td=dayInfo(isoDate(new Date())).day, NL=k=>String.fromCharCode(96+(+k));
  const cols={W:b.W,WE:[...b.Sat.map(x=>[...x,'s']),...b.WE].sort((x,y)=>x[0]-y[0]||x[1]-y[1])}, use=['W','WE'].filter(d=>cols[d].length);
  const hs=use.flatMap(d=>cols[d].map(x=>x[0])), h0=Math.min(...hs), h1=Math.max(...hs), curH=Math.floor(nowMin/60);
  const cell=(d,h)=>cols[d].filter(x=>x[0]===h).map(x=>`<span>${String(x[1]).padStart(2,'0')}${x[2]||x[3]==='s'?`<sup>${[x[2]?NL(x[2]):'',x[3]==='s'?'š':''].filter(Boolean).join(',')}</sup>`:''}</span>`).join(' ');
  const rows=[]; for(let h=h0;h<=h1;h++) rows.push(`<tr class="${h===curH?'now':''}"><th scope="row">${String(h%24).padStart(2,'0')}</th>${use.map(d=>`<td class="${d==='WE'?'twe':''}">${cell(d,h)}</td>`).join('')}</tr>`);
  const tabs=`<div class="rtabs" role="tablist" aria-label="Maršrutai">${bl.map(x=>`<button type="button" role="tab" id="rt-${x.r}" aria-controls="rtp" aria-selected="${x===b}" tabindex="${x===b?0:-1}" class="rtb${x===b?' on':''}" style="--rc:${C(x.r)}" data-rt="${x.r}"><span class="vh">Maršrutas </span>${x.r}</button>`).join('')}</div>`;
  const notes=Object.entries(b.notes).filter(([k])=>[...cols.W,...cols.WE].some(x=>x[2]==+k));
  return `${tabs}<div id="rtp" role="tabpanel" aria-labelledby="rt-${b.r}" class="rtp" style="--rc:${C(b.r)}">
    <p class="rtdir"><span class="b" style="background:${C(b.r)}">${b.r}</span> kryptis <b>${esc(b.dest)}</b></p>
    <table class="pt pt1"><thead><tr><th scope="col" class="pt-hc">Val.</th>${use.map(d=>`<th scope="col" class="${d==='WE'?'twe':''}">${d==='W'?'Darbo dienomis':'Savaitgaliais ir švenčių dienomis'}${d===td?' <small>(šiandien)</small>':''}</th>`).join('')}</tr></thead>
    <tbody>${rows.join('')}</tbody></table>
    ${cols.WE.some(x=>x[3]==='s')?'<p class="ttm"><sup>š</sup> – tik šeštadieniais</p>':''}
    ${notes.length?`<ul class="ttn ptn">${notes.map(([k,v])=>`<li><b>${NL(k)}</b> – ${esc(v)}</li>`).join('')}</ul>`:''}
    ${use.length<2?`<p class="ttm">Nevažiuoja ${use[0]==='W'?'savaitgaliais ir švenčių dienomis':'darbo dienomis'}.</p>`:''}</div>`;
}
// stotelės laikai kaip autobusų parko plakate: visi maršrutai greta, eilutės – valandos, langeliuose minutės; telefone – viena diena (savaitgalis geltonas)
let dlgDay=null;
function posterHtml(st,bl){
  const td=dayInfo(isoDate(new Date())).day, colsOf=(b,d)=>d==='W'?b.W:[...b.Sat.map(x=>[...x,'s']),...b.WE].sort((x,y)=>x[0]-y[0]||x[1]-y[1]);
  const has=d=>bl.some(b=>colsOf(b,d).length); let day=dlgDay||td; if(!has(day)&&has(day==='W'?'WE':'W')) day=day==='W'?'WE':'W';
  const use=bl.filter(b=>colsOf(b,day).length), miss=bl.filter(b=>!colsOf(b,day).length);
  const dayBtns=`<div class="days pdays" role="group" aria-label="Diena">${[['W','Darbo dienos'],['WE','Savaitgaliai ir šventės']].map(([d,l])=>`<button type="button" data-pday="${d}" class="${d===day?'on':''}${d==='WE'?' pwe':''}" aria-pressed="${d===day}"${has(d)?'':' disabled'}>${l}</button>`).join('')}</div>`;
  if(!use.length) return dayBtns+'<div class="empty">Šios stotelės tvarkaraščio plakate nėra.</div>';
  const hs=use.flatMap(b=>colsOf(b,day).map(x=>x[0])), h0=Math.min(...hs), h1=Math.max(...hs), curH=day===td?Math.floor(nowMin/60):-1;
  const NL=k=>String.fromCharCode(96+(+k));   // pastabos – raidėmis a, b, c… (žvaigždučių daug būtų nesuskaičiuoti)
  const cell=(b,h)=>colsOf(b,day).filter(x=>x[0]===h).map(x=>`<span>${String(x[1]).padStart(2,'0')}${x[2]||x[3]==='s'?`<sup>${[x[2]?NL(x[2]):'',x[3]==='s'?'š':''].filter(Boolean).join(',')}</sup>`:''}</span>`).join(' ');
  const rows=[]; for(let h=h0;h<=h1;h++) rows.push(`<tr class="${h===curH?'now':''}"><th scope="row">${String(h%24).padStart(2,'0')}</th>${use.map(b=>`<td>${cell(b,h)}</td>`).join('')}</tr>`);
  const notes=use.flatMap(b=>Object.entries(b.notes).filter(([k])=>colsOf(b,day).some(x=>x[2]==+k)).map(([k,v])=>`<li>${badge(b.r)} <b>${NL(k)}</b> – ${esc(v)}</li>`));
  return `${dayBtns}<div class="ptw"><table class="pt${day==='WE'?' pt-we':''}"><caption class="vh">${esc(st.name)}, ${day==='W'?'darbo dienomis':'savaitgaliais ir švenčių dienomis'}</caption>
    <thead><tr><th scope="col" class="pt-hc">Val.</th>${use.map(b=>`<th scope="col" class="pt-r" style="--rc:${C(b.r)}"><span class="pt-n">${b.r}<span class="vh"> maršrutas,</span></span><span class="pt-d"><span class="vh">kryptis ${esc(b.dest)}</span><span aria-hidden="true">${esc(b.dest.replace(/ \(.*\)$/,'').replace('Autobusų stotis','Aut. stotis').replace('Žaliasis vienkiemis','Žaliasis vnk.'))}</span></span></th>`).join('')}</tr></thead>
    <tbody>${rows.join('')}</tbody></table></div>
    ${use.some(b=>colsOf(b,day).some(x=>x[3]==='s'))?'<p class="ttm"><sup>š</sup> – tik šeštadieniais</p>':''}
    ${notes.length?`<ul class="ttn ptn">${notes.join('')}</ul>`:''}
    ${miss.length?`<p class="ttm">${day==='W'?'Darbo dienomis':'Savaitgaliais'} nevažiuoja: ${miss.map(b=>badge(b.r)).join(' ')}</p>`:''}`;
}
function syncStopDlg(){
  const dlg=document.getElementById('stopdlg'), c=document.getElementById('stopdlg-c');
  if(!(isPhone()&&state.stop)){ const was=dlg.dataset.id; if(dlg.open){ dlg.close(); setTimeout(()=>{const b=document.querySelector(`#panel [data-openstop="${was}"]`); if(b) b.focus({preventScroll:true});},0); } dlg.dataset.id=''; return; }   // fokusas grįžta į paspaustą stotelę
  const id=state.stop, st=STOP[id], r=state.route, bl0=[...(TTS[id]||[])], bl1=r&&bl0.some(b=>b.r===r)?bl0.filter(b=>b.r===r):bl0, dw=r&&state.dir&&((D.dirs[r]||{})[rbMode(r)]||{})[state.dir], bl2=dw?bl1.filter(b=>b.r!==r||blkInDir(b,id,r,dname(dw.to),rbMode(r))):bl1, bl=mergeBlocks(bl2.length?bl2:bl1).sort((a,b)=>a.r.localeCompare(b.r,undefined,{numeric:true})), dt=dirTxt(id,r), endHere=dw&&!bl2.length&&bl1.length;
  if(!dlg.open||dlg.dataset.id!==id){ dlgDay=null; dlgRoute=null; }
  c.innerHTML=`<div class="pt-top"><span><b id="stopdlg-h">${esc(st.name)}</b></span><button type="button" class="clr" data-stopclose aria-label="Uždaryti tvarkaraštį">✕</button></div>
    ${endHere?`<p class="sub">Kryptimi „${esc(dw.to)}“ autobusas čia baigia reisą. Lentelėje – išvykimai iš šios stotelės.</p>`:''}${routeTTHtml(st,bl)}
    ${D.stops.filter(o=>o.name===st.name&&o.id!==id).map(o=>`<button class="back" data-openstop="${o.id}" style="margin-top:1rem">Kita gatvės pusė${dirTxt(o.id,r)?`: ${esc(dirTxt(o.id,r))}`:''} ›</button>`).join('')}
    <p class="note">Jei laikas nesutampa su plakatu stotelėje, teisingas plakatas.</p>`;
  c.querySelectorAll('[data-openstop]').forEach(x=>x.onclick=()=>openStop(x.dataset.openstop));
  c.querySelectorAll('[data-stopclose]').forEach(x=>x.onclick=closeStop);
  c.querySelectorAll('[data-rt]').forEach(x=>{ x.onclick=()=>{dlgRoute=x.dataset.rt; syncStopDlg(); c.querySelector(`[data-rt="${dlgRoute}"]`).focus();};
    x.onkeydown=e=>{ const t=[...c.querySelectorAll('[data-rt]')], i=t.indexOf(x), j=e.key==='ArrowRight'?i+1:e.key==='ArrowLeft'?i-1:-9; if(j===-9) return; e.preventDefault(); t[(j+t.length)%t.length].click(); }; });   // rodyklės – kitas maršrutas
  c.querySelectorAll('[data-pday]').forEach(x=>x.onclick=()=>{dlgDay=x.dataset.pday; syncStopDlg(); const f=c.querySelector(`[data-pday="${dlgDay}"]`); if(f) f.focus();});
  const nw=dlg.dataset.id!==id; if(nw){ dlg.scrollTop=0; dlg.dataset.id=id; }
  if(!dlg.open) dlg.showModal(); if(nw) c.querySelector('[data-stopclose]').focus();
}
// ---- telefono žemėlapio puslapis: stotelės, viršuje maršrutų mygtukai; pasirinkus – maršruto linija (kryptis – rodyklės) ----
let mapDirOf=id=>dirTxt(id);   // stotelės langeliui žemėlapio puslapyje – pasirinkta kryptis
function mapPageView(fit){
  clearHL(); unhoverStop(); const r=state.route, md=r?rbMode(r):null, DD=r?((D.dirs[r]||{})[md]||{}):{};
  if(r&&state.dir&&!DD[state.dir]) state.dir=null;
  const d=state.dir, on=x=>x.r===r&&x.m===md&&(!d||(x.ds||[x.d]).includes(d)), pts=[];
  lineLayers.forEach(({x,pl})=>{ if(r&&on(x)){ pl.setStyle({opacity:x.main?.95:.85,weight:x.main?W[r]:3,dashArray:x.main?null:'8 7'}); if(!map.hasLayer(pl)) pl.addTo(map); pl.bringToFront(); pts.push(...D.segs[x.g]); } else if(map.hasLayer(pl)) pl.remove(); });
  setArrows(d?lineLayers.filter(l=>on(l.x)&&l.x.main).map(l=>({pts:D.segs[l.x.g],color:C(r)})):[]);
  const rs=new Set(D.layers.filter(on).flatMap(x=>x.ab)); mapDirOf=id=>d&&rs.has(id)&&DD[d]?'kryptis '+DD[d].to:dirTxt(id,r);
  D.stops.forEach(st=>{const m=markers[st.id]; if(!r) m.setStyle(stopBase()); else if(rs.has(st.id)){ m.setStyle({opacity:1,fillOpacity:1,radius:5.5,weight:2,color:'#14213D',fillColor:'#F5B800'}); m.bringToFront(); } else m.setStyle({opacity:.35,fillOpacity:.35,radius:3,weight:1,color:'#14213D',fillColor:'#F5B800'});});
  const bar=document.getElementById('mapbar');
  bar.innerHTML=`<p class="mbattr">${document.querySelector('#appfoot>span').innerHTML}</p><div class="mbr" role="group" aria-label="Maršrutas žemėlapyje">${R.map(x=>`<button type="button" class="b mbb${x===r?' on':''}" style="background:${C(x)}" data-mr="${x}" aria-pressed="${x===r}" aria-label="${x} maršrutas: ${esc(D.meta[x].legend)}">${x}</button>`).join('')}</div>
    ${r?`<div class="days mbd" role="group" aria-label="Kryptis">${Object.keys(DD).length>1?['A','B'].filter(k=>DD[k]).map(k=>`<button type="button" data-md="${k}" class="${d===k?'on':''}" aria-pressed="${d===k}">→ ${esc(DD[k].to)}</button>`).join(''):''}</div>
${(md==='D')!==(today==='W')?`<p class="mbn">${md==='D'?'Darbo dienų':'Poilsio dienų'} maršrutas</p>`:''}`:''}
    <a class="mbsr" href="#marsrutai" data-tolist>Tą pačią informaciją tekstu rasite skiltyje „Maršrutai ir tvarkaraščiai“</a>`;
  bar.querySelectorAll('[data-mr]').forEach(b=>b.onclick=()=>{ const x=b.dataset.mr; if(state.route===x){state.route=null;state.dir=null;} else { if(state.route!==x) rbDay=null; state.route=x; state.dir=null; } map.closePopup(); render(false); });   // vaizdas nekeičiamas
  bar.querySelectorAll('[data-md]').forEach(b=>b.onclick=()=>{ state.dir=state.dir===b.dataset.md?null:b.dataset.md; render(false); });
  bar.querySelectorAll('[data-tolist]').forEach(a=>a.onclick=e=>{ e.preventDefault(); setPage('routes','push'); render(true); });
  document.getElementById('left').style.setProperty('--mbh',bar.offsetHeight+'px');   // žemėlapio mygtukai – po maršrutų juosta
  if(fit) map.fitBounds(homeBounds(),{padding:[10,10],animate:false});   // visada bendras vaizdas, centras – Kęstučio a.; priartina pats žmogus
}
function render(fit){
  if(onMapPg()){ mapPageView(fit); syncStopDlg(); return; }
  if(!state.route&&!state.stop) viewDay=dayInfo(isoDate(new Date())).day;
  applyMode();
  // telefono maršrutų puslapis: atidarius maršrutą – mažesnis žemėlapis ir viena antraštė (daugiau vietos sąrašui)
  const rto=onRoutesPg()&&!!(state.route||state.stop); if(!state.route) tabShown=null; if(!state.stop) stopShown=null; if(document.body.classList.contains('rtopen')!==rto){ document.body.classList.toggle('rtopen',rto); map.invalidateSize(); }
  const el=document.getElementById('panel'); const sc=el.scrollTop||0;
  const dayBtns=(cur,attr,avail)=>`<div class="days" role="group" aria-label="Diena">${['W','WE'].map(d=>`<button ${attr}="${d}" class="${d===cur?'on':''}"${avail&&!avail(d)?' disabled':''} aria-pressed="${d===cur}">${DAYS[d]}</button>`).join('')}</div>`;
  syncStopDlg();
  if(state.stop&&!isPhone()){
    const id=state.stop, st=STOP[id], bl0=[...(TTS[id]||[])], bl=(onRoutesPg()&&state.route&&bl0.some(b=>b.r===state.route)?bl0.filter(b=>b.r===state.route):bl0).sort((x,y)=>(x.r===state.route?-1:0)-(y.r===state.route?-1:0));
    clearHL(); fade(true);
    markers[id].setStyle({opacity:1,fillOpacity:1,radius:9,fillColor:'#F5B800',color:'#14213D'}).bringToFront();
    if(state.route){lineLayers.forEach(({x,pl})=>{if(x.r===state.route)pl.setStyle({opacity:.8});});setArrows(state.dir?lineLayers.filter(l=>l.x.r===state.route&&layerOn(l.x)&&(l.x.ds||[l.x.d]).includes(state.dir)).map(l=>({pts:D.segs[l.x.g],color:C(state.route)})):[]);}
    const tab=onRoutesPg(), nw=tab&&stopShown!==id; stopShown=tab?id:null;   // telefone tvarkaraštis – skirtuke virš maršruto
    if(tab&&!map.getBounds().pad(-.1).contains([st.lat,st.lon])) map.panTo([st.lat,st.lon],{animate:false});
    el.innerHTML=(tab?`<h2 class="ph rtpg">Maršrutai ir tvarkaraščiai</h2><section class="rtab${nw?' rtab-in':''}" aria-label="Stotelės ${esc(st.name)} tvarkaraštis"><div class="rthead" style="--rc:${state.route?C(state.route):'var(--ink)'}">${state.route?badge(state.route,1):''}<h2>${esc(st.name)}${dirTxt(id,state.route)?` <small>${esc(dirTxt(id,state.route))}</small>`:''}</h2><button type="button" class="clr" data-stopclose aria-label="Uždaryti tvarkaraštį">✕</button></div>`   // be dienos mygtukų – lentelėje matomos abi dienos
      :`<button class="back" data-stopback>‹ ${state.route?`${state.route} maršrutas`:'Atgal'}</button>
    <h1 class="sh">${esc(st.name)}</h1>${dirTxt(id)?`<p class="shint">${esc(dirTxt(id))}</p>`:''}${dayTog()}`)+`
    ${bl.length?bl.map(ttBlock).join(''):'<div class="empty">Šios stotelės tvarkaraščio plakate nėra.</div>'}
    ${D.stops.filter(o=>o.name===st.name&&o.id!==id).map(o=>`<button class="back" data-openstop="${o.id}" style="margin-top:1rem">Kita gatvės pusė${dirTxt(o.id,state.route)?`: ${esc(dirTxt(o.id,state.route))}`:''} ›</button>`).join('')}
    <p class="note">Jei laikas nesutampa su plakatu stotelėje, teisingas plakatas.</p>${tab?'</section>':''}`;
    el.querySelectorAll('[data-openstop]').forEach(x=>x.onclick=()=>openStop(x.dataset.openstop));
    el.querySelectorAll('[data-stopback]').forEach(x=>x.onclick=()=>{state.stop=null;render(true);});
    el.querySelectorAll('[data-stopclose]').forEach(x=>x.onclick=closeStop);
    el.scrollTop=0; addFoot(el); syncLegend(); return;
  }
  if(!state.route||onRoutesPg()){   // telefono maršrutų puslapyje maršrutas atsiveria po savo kortele
    if(onRoutesPg()){ const v=state.route&&rvSel(state.route); if(v) drawLegs([{t:v.rep,i:0,j:v.rep.P.s.length-1}],fit); else { clearHL(); fade(false); D.stops.forEach(s=>markers[s.id].setStyle(stopBase())); } }   // maršrutų puslapyje – tik pasirinkto reiso linija
    else if(state.route) routeView(fit);
    else if(plan.res.length&&!onRoutesPg()) drawLegs(plan.res[plan.opt].legs,fit); else {clearHL();fade(false);lineLayers.forEach(({x,pl})=>pl.setStyle({opacity:.9}));D.stops.forEach(s=>markers[s.id].setStyle({color:'#14213D'}));}
    const opts=sel=>'<option value="">— pasirinkite stotelę —</option>'+NAMES.map(n=>`<option${n===sel?' selected':''}>${esc(n)}</option>`).join('');
    let res='';
    if(plan.from&&plan.to){
      if(plan.from===plan.to) res='<div class="empty">Pasirinkote tą pačią stotelę.</div>';
      else if(!plan.res.length&&plan.res.walkAB) res=`<div class="empty">Greičiausia nueiti pėsčiomis – autobusu tektų važiuoti gerokai ilgiau.</div>`;
      else if(!plan.res.length&&plan.mode==='arr') res=`<div class="empty">Reisų, kuriais atvyktumėte iki ${hm(plan.time)}, nerasta. Pabandykite vėlesnį laiką.</div>`;
      else if(!plan.res.length&&plan.res.noMore&&plan.mode==='dep'&&(plan.res.all||(plan.res.all=allDay(plan.from,plan.to,plan.date))).length) res=`<p class="walkhint">Po ${hm(plan.time)} šią dieną reisų nebėra. Štai visi tos dienos reisai:</p>${allRows(plan.res.all,plan.time,'data-inpick')}`;
      else if(!plan.res.length) res=`<div class="empty">Reisų tarp šių stotelių artimiausiomis dienomis nerasta (tiesiogiai, su vienu persėdimu ar trumpu ėjimu).</div>`;
      else res=`<ul class="opts">${plan.res.map((o,n)=>{ const ex=plan.exp===n, wm=walkM(o), xf=o.legs.filter((l,k)=>k&&(l.walk||!l.cont)).length;
        return `<li class="ocard${n===plan.opt?' chosen':''}"><button class="opt" data-opt="${n}" aria-expanded="${ex}" aria-controls="ost-${n}">
        ${o.best?'<span class="obest">⭐ Rekomenduojama</span>':''}
        <span class="oh"><span class="otime">${hm(o.dep)} – ${hm(o.arr)}</span><span class="omin">${o.arr-o.dep} min.</span></span>
        ${plan.mode==='arr'?`<span class="oarr">atvyksite ${plan.time-o.arr?`${plan.time-o.arr} min. anksčiau`:'laiku'}</span>`:''}
        <span class="osum">${o.legs.map((l,k)=>`${k?(l.cont?'<span class="ocont" aria-hidden="true">→</span>':'<span class="oxf" aria-hidden="true">›</span>'):''}${badge(l.t.r)}`).join('')}<span class="ometa">${xf?xf===1?'1 persėdimas':xf+' persėdimai':'be persėdimų'}${wm?` · 🚶 ~${wm} m`:''}</span></span>
        <span class="oexp" aria-hidden="true">${ex?'Slėpti ▴':'Kaip važiuoti ▾'}</span></button>
        <ol class="steps" id="ost-${n}"${ex?'':' hidden'}>${tripSteps(o)}</ol></li>`; }).join('')}</ul>`;
    }
    el.innerHTML=`
    ${plan.from&&plan.to&&!onRoutesPg()?`<section class="planner"><div class="phead"><h2 class="ph"><span class="plbl">Pasiūlymai kelionei </span><span class="pnames">${esc(plan.from)} → ${esc(plan.to)}</span></h2><span class="pbtns">${canShare()?'<button class="clr" data-share aria-label="Dalintis šios kelionės nuoroda" title="Dalintis nuoroda">🔗</button>':''}<button class="clr" data-clear aria-label="Išvalyti paiešką">✕</button></span></div>
      ${plan.res.nextDate?`<p class="walkhint">Šiandien po ${hm(plan.time)} reisų nebėra. Artimiausi – ${plan.res.nextDate} (${dayInfo(plan.res.nextDate).label}).</p>`:''}${plan.res.wide?`<p class="walkhint">🚶 Tiesioginių reisų šiuo metu nėra – siūlome variantus su ilgesniu ėjimu pėsčiomis. Visus dienos reisus rasite apačioje: „Visi šios dienos reisai“.</p>`:''}${plan.res.walkAB?`<p class="walkhint">🚶 ${plan.res.walkBetter?'Pėsčiomis bus greičiau':'Šios stotelės arti viena kitos'} – ~${plan.res.walkAB.m} m (≈${plan.res.walkAB.min} min).</p>`:''}<p class="sub">${plan.date} (${dayInfo(plan.date).label}), ${plan.mode==='arr'?'atvykti iki':'nuo'} ${hm(plan.time)}</p>${res}${plan.from!==plan.to?`<button type="button" class="srtt allbtn" data-allday>Visi šios dienos reisai ›</button>`:''}</section>`:''}
    <div class="routesbox" ${plan.from&&plan.to&&!onRoutesPg()?"hidden":""}>
    ${isPhone()&&!onRoutesPg()?'':`<h2 class="ph" style="margin-top:${onRoutesPg()?'.2rem':'1.4rem'}">${onRoutesPg()?'Maršrutai ir reisai':'Maršrutai ir tvarkaraščiai'}</h2>`}

    ${isPhone()&&!onRoutesPg()?'':onRoutesPg()&&state.route?routeTab(state.route):R.map(rcard).join('')}
    <details class="missing"${isPhone()?'':' open'}><summary><b>Tilto remonto laikotarpis.</b><span class="sumph"> Darbo dienomis į Užupį – apylanka.</span></summary> Darbo dienomis (visą dieną, ir po 18 val.) autobusai į Užupį važiuoja apylanka per magistralę, o atgal – tiesiai per tiltą.<br>Savaitgaliais ir švenčių dienomis apylankos nėra – važiuojama per tiltą abiem kryptimis.</details>
    </div>

`;
  } else {
    const r=state.route; routeView(fit);
    el.innerHTML=`<button class="back" data-home>‹ Visi maršrutai</button>
    <div class="rhead">${badge(r,1)}<h2>${esc(D.meta[r].legend)}</h2></div>
    ${routeBody(r)}`;
  }
  addFoot(el); syncLegend(); markSel();
  if(state.route) el.scrollTop=sc;
  el.querySelectorAll('[data-sel]').forEach(b=>b.onclick=()=>selectRoute(b.dataset.sel));
  el.querySelectorAll('[data-rclose]').forEach(b=>b.onclick=closeRoute);
  el.querySelectorAll('[data-rv]').forEach(b=>b.onclick=()=>{ const p=+b.dataset.rv; state.rv=state.rv===p?null:p; render(true); const f=document.querySelector(`[data-rv="${p}"]`); if(f){ f.focus({preventScroll:true}); f.scrollIntoView({block:'nearest'}); } });
  el.querySelectorAll('[data-rbday]').forEach(b=>b.onclick=()=>{ state.rv=null;const r=state.route, cur=((D.dirs[r]||{})[rbDay||(runsDay(r,'W')&&(today==='W'||!runsDay(r,'WE'))?'D':'O')]||{})[state.dir]; rbDay=b.dataset.rbday; viewDay=rbDay==='D'?'W':'WE'; const nx=(D.dirs[r]||{})[rbDay]||{}; state.dir=cur&&Object.keys(nx).find(k=>dname(nx[k].to)===dname(cur.to))||null; render(false);});   // kryptis išlieka
  el.querySelectorAll('[data-vday]').forEach(b=>b.onclick=()=>{viewDay=b.dataset.vday;state.day=viewDay;render(false);});
  el.querySelectorAll('[data-dir]').forEach(b=>b.onclick=()=>{state.dir=state.dir===b.dataset.dir?null:b.dataset.dir;state.variant=null;render(false);});
  el.querySelectorAll('[data-var]').forEach(b=>b.onclick=()=>{state.variant=state.variant===b.dataset.var?null:b.dataset.var;render(false);});
  el.querySelectorAll('[data-clear]').forEach(b=>b.onclick=()=>{plan.from='';plan.to='';plan.res=[];setUrl();renderBar();render(true);fitAll();});   // žemėlapis grįžta į pradinį vaizdą   // (paskutinės paieškos lieka)
  el.querySelectorAll('[data-share]').forEach(b=>b.onclick=shareTrip);
  el.querySelectorAll('[data-rday]').forEach(b=>b.onclick=()=>{state.day=b.dataset.rday;state.trip=null;render(false);});
  el.querySelectorAll('[data-allday]').forEach(b=>b.onclick=openAllDay);
  el.querySelectorAll('[data-inpick]').forEach(b=>b.onclick=()=>{ plan.time=+b.dataset.inpick; plan.userTime=true; plan.autoArr=0; renderBar(); updPlan(); showMapOnPhone(); });
  el.querySelectorAll('[data-opt]').forEach(b=>b.onclick=()=>{const n=+b.dataset.opt; if(plan.opt===n&&plan.exp===n) plan.exp=null; else {plan.opt=n; plan.exp=n;} render(true); const f=document.querySelector(`[data-opt="${n}"]`); if(f) f.focus({preventScroll:true}); showMapOnPhone();});   // paspaudus – rodoma žemėlapyje ir išskleidžiama
  el.querySelectorAll('[data-openstop]').forEach(b=>{b.onclick=()=>{ if(b.dataset.selstop){ pickStop(b.dataset.selstop); return; } unhoverStop();openStop(b.dataset.openstop);};
    if(!b.dataset.selstop){ b.onmouseenter=b.onfocus=()=>hoverStop(b.dataset.openstop); b.onmouseleave=b.onblur=unhoverStop; }});
  el.querySelectorAll('[data-ttstop]').forEach(b=>b.onclick=()=>{unhoverStop();openStop(b.dataset.ttstop);});
  unhoverStop(); if(onRoutesPg()&&state.route&&!state.stop&&selStop&&selStop.r===state.route) hoverStop(selStop.id);   // pažymėta stotelė žemėlapyje
    el.querySelectorAll('[data-home]').forEach(b=>b.onclick=()=>{state={route:null,day:today,trip:null,stop:null};render(true);fitAll();el.scrollTop=0;});
}
function findTrips(A,B,date,T){
  if(plan.mode==='arr'){ const day=dayInfo(date).day, o={window:180,arriveBy:T}; let r=computePlan(A,B,day,T-180,o); if(r.length||r.walkAB) return r;   // atvykti iki T: išvykimai per 3 val. iki jo
    const w=computePlan(A,B,day,T-180,{...o,walkMax:800}); if(w.length){w.wide=1; return w;} return r; }
  let r=computePlan(A,B,dayInfo(date).day,T); if(r.length||r.walkAB) return r;
  // nothing nearby: allow a longer walk to a better served stop
  let w=computePlan(A,B,dayInfo(date).day,T,{walkMax:800}); if(w.length){w.wide=1; return w;}
  // šią dieną reisų nebeliko: kitų dienų nesiūlome – rodomi visi tos dienos reisai (matosi, kas jau praėjo)
  r.noMore=1; return r;}
// ---- „Visi šios dienos reisai“: visi variantai iš A į B nuo ryto iki vakaro (langas virš planuoklio) ----
function allDay(A,B,date){ const day=dayInfo(date).day, out=[], seen=new Set();
  for(const o0 of [{},{walkMax:800}]) for(let T=0;T<1500;T+=30) computePlan(A,B,day,T,{window:60,...o0}).forEach(o=>{   // diena tikrinama valandos langais; ir variantai su ilgesniu ėjimu
    const k=o.dep+'|'+o.arr+'|'+o.legs.map(l=>l.walk?'w':l.t.r).join(); if(!seen.has(k)){seen.add(k); out.push(o);} });
  // paliekami tik prasmingi: vėliau išvykstantis ir ne vėliau atvykstantis išstumia ankstesnį
  return out.filter(o=>!out.some(p=>p!==o&&p.dep>=o.dep&&p.arr<=o.arr&&(p.dep>o.dep||p.arr<o.arr))).sort((a,b)=>a.dep-b.dep||a.arr-b.arr)
    .filter((o,i,a)=>!i||o.dep!==a[i-1].dep||o.arr!==a[i-1].arr); }
const walkM=o=>(o.walkEnd?o.walkEnd.m:0)+o.legs.reduce((S,l)=>S+(l.walk?l.walk.m:0),0)+(o.walkStart&&!o.walkStart.near?o.walkStart.m:0);
let adDate=null;
const allRows=(L,refT,attr)=>`<ul class="alist">${L.map(o=>{ const past=o.dep<refT, wm=walkM(o); return `<li><button type="button" class="arow${past?' past':''}" ${attr}="${o.dep}">
      <span class="at"><b>${hm(o.dep)}</b> – ${hm(o.arr)}</span><span class="ab">${o.legs.filter(l=>!l.walk).map(l=>badge(l.t.r)).filter((x,i,a)=>a.indexOf(x)===i).join('')}</span>
      <span class="am">${o.arr-o.dep} min.${o.legs.length>1&&o.legs.some((l,k)=>k&&!l.cont)?' · persėdimas':''}${wm?` · 🚶 ~${wm} m pėsčiomis`:''}${past?' · jau išvyko':''}</span></button></li>`;}).join('')}</ul>`;
function openAllDay(dd){ const dlg=document.getElementById('alldlg'), c=document.getElementById('alldlg-c'); adDate=typeof dd==='string'?dd:plan.date; const L=allDay(plan.from,plan.to,adDate), di=dayInfo(adDate), isToday=adDate===isoDate(new Date());
  const shift=k=>{const d=new Date(adDate+'T12:00'); d.setDate(d.getDate()+k); return isoDate(d);};
  c.innerHTML=`<div class="pt-top"><span><b id="alldlg-h">${esc(plan.from)} → ${esc(plan.to)}</b><small>visi dienos reisai</small></span><button type="button" class="clr" data-allclose aria-label="Uždaryti">✕</button></div>
    <div class="adays"><button type="button" class="clr" data-addate="${shift(-1)}" aria-label="Ankstesnė diena">‹</button><span role="status"><b>${isToday?'Šiandien':adDate}</b> · ${di.label}</span><button type="button" class="clr" data-addate="${shift(1)}" aria-label="Kita diena">›</button></div>
    ${L.length?allRows(L,isToday?nowMin:-1,'data-allpick')
      :'<div class="empty">Šią dieną reisų nerasta.</div>'}
    <p class="note">Paspauskite reisą – jis bus parodytas planuoklyje ir žemėlapyje.</p>`;
  c.querySelector('[data-allclose]').onclick=()=>closeAllDay();
  c.querySelectorAll('[data-addate]').forEach(b=>b.onclick=()=>{ const lb=b.getAttribute('aria-label'); openAllDay(b.dataset.addate); c.querySelector(`[aria-label="${lb}"]`).focus(); });   // fokusas lieka ant to paties mygtuko
  c.querySelectorAll('[data-allpick]').forEach(b=>b.onclick=()=>{ const t=+b.dataset.allpick; closeAllDay(); plan.mode='dep'; plan.date=adDate; plan.day=dayInfo(adDate).day; plan.time=t; plan.userTime=true; plan.autoArr=0; renderBar(); updPlan(); showMapOnPhone(); });
  if(!dlg.open){ dlg.showModal(); if(tourI<0) history.pushState({all:1},'',location.href); }
  dlg.scrollTop=0; const nx=c.querySelector('.arow:not(.past)'); if(typeof dd!=='string'){ (nx||c.querySelector('[data-allclose]')).focus(); if(nx&&isToday) nx.scrollIntoView({block:'center'}); }
}
function closeAllDay(){ const dlg=document.getElementById('alldlg'); if(!dlg.open) return; dlg.close(); if(history.state&&history.state.all) history.back(); }
// ---- kelionė žingsnis po žingsnio (išskleidus variantą) ----
const stotW=n=>n%10===1&&n%100!==11?'stotelė':n%10>=2&&(n%100<10||n%100>20)?'stotelės':'stotelių';
const nb=r=>`<span class="b" style="background:${C(r)}" aria-hidden="true">${r}</span><span class="vh">Nr. ${r}</span>`;   // numeris žingsniuose: matomas ženkliukas, skaitytuvui „Nr. 2“
function tripSteps(o){ const S=[], st=(ic,h,t,sm)=>S.push(`<li><span class="si" aria-hidden="true">${ic}</span><span class="sx">${h?`<b class="sh">${h}</b> `:''}${t}${sm?`<small>${sm}</small>`:''}</span></li>`);
  if(o.walkStart) o.walkStart.near?st('🚏','',`Autobusas išvyksta iš stotelės <b>„${esc(nm(o.walkStart.to))}“</b> (~${o.walkStart.m} m nuo „${esc(nm(o.walkStart.from))}“)`)
    :st('🚶','',`Nueikite ~${o.walkStart.m} m (≈${o.walkStart.min} min.) iki stotelės <b>„${esc(nm(o.walkStart.to))}“</b>`);
  o.legs.forEach((l,k)=>{ const prev=o.legs[k-1], nx=o.legs[k+1], a=l.t.P.s[l.i], z=l.t.P.s[l.j];
    if(k){ const wait=l.t.t[l.i]-prev.t.t[prev.j]-(l.walk?l.walk.min:0);
      if(l.walk) st('🚶','',`Nueikite ~${l.walk.m} m (≈${l.walk.min} min.) iki stotelės <b>„${esc(nm(l.walk.id))}“</b>${wait>0?`, laukite ${wait} min.`:''}`);
      else if(l.cont) st('🔄','',l.t.r===prev.t.r?`Likite autobuse – stotelėje „${esc(nm(a))}“ jis tęsia kitą ratą`:`Likite autobuse – stotelėje „${esc(nm(a))}“ jis tęsia kaip ${nb(l.t.r)}`);
      else { const pid=prev.t.P.s[prev.j]; st('🔁','',pid===a?`Persėskite toje pačioje stotelėje${wait>0?`, laukite ${wait} min.`:''}`:`Pereikite į stotelę <b>„${esc(nm(a))}“</b>${nm(pid)===nm(a)?' kitoje gatvės pusėje':''}${wait>0?`, laukite ${wait} min.`:''}`); } }
    if(!k||l.walk||!l.cont){ const x=[satOnly(l.t)?'<b>tik šeštadieniais</b>':'',...legNotes(l).map(esc)].filter(Boolean);
      st('🚏',hm(l.t.t[l.i]),`Įlipkite į ${nb(l.t.r)} autobusą stotelėje <b>„${esc(nm(a))}“</b>`,`kryptis ${esc(legTo(l))}${x.length?' · '+x.join(' · '):''}`); }
    const ns=l.j-l.i; st('🚌','',`Važiuokite ${l.t.t[l.j]-l.t.t[l.i]} min. (${ns} ${stotW(ns)})`);
    if(!(nx&&!nx.walk&&nx.cont)) st('🛑',hm(l.t.t[l.j]),`Išlipkite stotelėje <b>„${esc(nm(z))}“</b>`); });
  if(o.walkEnd) st('🚶','',`Nueikite ~${o.walkEnd.m} m (≈${o.walkEnd.min} min.) iki stotelės <b>„${esc(nm(o.walkEnd.to))}“</b> – būsite ~${hm(o.arr)}`);
  return S.join(''); }
function updPlan(){ setTimeout(()=>{ if(!(plan.from&&plan.to)) return; const r=plan.res;
    announce(r.length?`Rasta kelionės variantų: ${r.length}. Greičiausias: ${hm(r[0].dep)}–${hm(r[0].arr)}${r[0].legs.length>1?', su persėdimu':''}.`:`Kelionių iš ${plan.from} į ${plan.to} nerasta.`);},0);plan.res=(plan.from&&plan.to&&plan.from!==plan.to)?findTrips(plan.from,plan.to,plan.date,plan.time):[];plan.opt=0;plan.exp=null;
  if(plan.from&&plan.to){state={route:null,day:today,trip:null,stop:null}; if(plan.from!==plan.to&&tourI<0) remember(); else renderBar();}
  render(true);}
// ---- Lithuanian public holidays (count as rest days) ----
function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;return new Date(y,mo-1,da);}
function isHoliday(dt){const y=dt.getFullYear(),md=`${dt.getMonth()+1}-${dt.getDate()}`;
  if(['1-1','2-16','3-11','5-1','6-24','7-6','8-15','11-1','11-2','12-24','12-25','12-26'].includes(md))return true;
  const e=easter(y),e2=new Date(e);e2.setDate(e.getDate()+1);
  return [e,e2].some(x=>x.getMonth()===dt.getMonth()&&x.getDate()===dt.getDate());}
const isoDate=dt=>`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
function dayInfo(iso){const [y,m,d]=iso.split('-').map(Number),dt=new Date(y,m-1,d),wd=dt.getDay(),hol=isHoliday(dt);
  return {day:(wd===0||wd===6||hol)?'WE':'W',label:hol?'šventinė diena':(wd===0||wd===6)?'poilsio diena':'darbo diena'};}
plan.date=isoDate(now); plan.day=dayInfo(plan.date).day;
// phone: after a search / choosing a trip, show the map first (results are below it)
function showMapOnPhone(){ if(isPhone()&&mapBig) document.getElementById('planbar').scrollIntoView({behavior:SMOOTH,block:'start'}); }   // planner on top, map right under it
// narrow phones: the long hint does not fit into half of the screen
const PH=()=>innerWidth<1200?'Pasirinkite…':'Pasirinkite stotelę';
// ---- atsimenamos paieškos (šiame telefone ir naršyklėje) ir nuoroda su stotelėmis: ?is=Kauno&i=Pašilė ----
const store={get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let recent=(store.get('ap-recent')||[]).filter(x=>Array.isArray(x)&&NAMES.includes(x[0])&&NAMES.includes(x[1])&&x[0]!==x[1]).slice(0,3);
function setUrl(){ try{const u=new URL(location.href); u.searchParams.delete('is'); u.searchParams.delete('i');
  if(plan.from&&plan.to&&plan.from!==plan.to){u.searchParams.set('is',plan.from); u.searchParams.set('i',plan.to);} history.replaceState(null,'',u);}catch(e){} }
function remember(){ recent=[[plan.from,plan.to],...recent.filter(x=>!(x[0]===plan.from&&x[1]===plan.to))].slice(0,3); store.set('ap-recent',recent); setUrl(); renderBar(); }
const canShare=()=>!!(navigator.share||navigator.clipboard)&&location.protocol!=='file:';
function shareTrip(){ const url=location.href, title=`Autobusu: ${plan.from} → ${plan.to}`;
  if(navigator.share) navigator.share({title,url}).catch(()=>{});
  else navigator.clipboard.writeText(url).then(()=>announce('Nuoroda nukopijuota.'),()=>{}); }
// laikas „dabar“, jei žmogus jo nekeitė (svarbu, kai puslapis lieka atidarytas telefone)
function refreshTime(){ if(plan.userTime) return false; const d=new Date(), t=d.getHours()*60+d.getMinutes(), iso=isoDate(d);
  if(t===plan.time&&iso===plan.date) return false; plan.time=t; plan.date=iso; plan.day=dayInfo(iso).day; return true; }
function renderBar(){
  const bar=document.getElementById('planbar');
  const opts=(sel,ph)=>`<option value="">${ph}</option>`+NAMES.map(n=>`<option${n===sel?' selected':''}>${esc(n)}</option>`).join('');
  bar.innerHTML=`<h2 class="ptitle">Planuoklis</h2><div class="pfld"><label for="pf">Važiuosiu iš</label><select id="pf" class="pbs">${opts(plan.from,PH())}</select></div>
  <button id="pswap" class="pbsw" type="button" title="Sukeisti" aria-label="Sukeisti kryptį">⇄</button>
  <div class="pfld"><label for="pt">Važiuosiu į</label><select id="pt" class="pbs">${opts(plan.to,PH())}</select></div>
  <div class="pfld pdt"><div class="pmode" role="group" aria-label="Laikas reiškia">${[['dep','Išvykti nuo'],['arr','Atvykti iki']].map(([m,l])=>`<button type="button" data-pm="${m}" class="${plan.mode===m?'on':''}" aria-pressed="${plan.mode===m}">${l}</button>`).join('')}</div><div class="dtbox"><input type="date" id="pdate" value="${plan.date}" aria-label="${plan.mode==='arr'?'Atvykimo':'Išvykimo'} data"><input type="time" id="ptime" value="${hm(plan.time)}" aria-label="${plan.mode==='arr'?'Atvykimo':'Išvykimo'} laikas"></div></div>
  <button id="pgo" class="pgo" type="button">Ieškoti<span class="pgo-x"> kelionės</span></button>
  ${(()=>{const rs=recent.map((x,k)=>[x,k]).filter(([[f,t]])=>!(f===plan.from&&t===plan.to&&plan.res.length));   // dabar rodomos paieškos nekartojame
    return rs.length?`<div class="recent" role="group" aria-label="Paskutinės paieškos">${rs.map(([[f,t],k])=>`<button type="button" data-recent="${k}">${esc(f)} → ${esc(t)}</button>`).join('')}</div>`:'';})()}`;
  bar.querySelector('#pf').onchange=e=>{plan.from=e.target.value;markSel();};
  bar.querySelector('#pt').onchange=e=>{plan.to=e.target.value;markSel();};
  bar.querySelector('#pdate').onchange=e=>{if(e.target.value){plan.date=e.target.value;plan.day=dayInfo(plan.date).day;plan.userTime=true;}};
  bar.querySelector('#ptime').onchange=e=>{const [h,m]=e.target.value.split(':').map(Number);if(!isNaN(h)){plan.time=h*60+m;plan.userTime=true;plan.autoArr=0;}};
  markSel();
  bar.querySelectorAll('[data-recent]').forEach(b=>b.onclick=()=>{const [f,t]=recent[+b.dataset.recent]; plan.from=f; plan.to=t; refreshTime(); renderBar(); updPlan();});
  bar.querySelectorAll('[data-pm]').forEach(b=>b.onclick=()=>{ const m=b.dataset.pm; if(m===plan.mode) return; plan.mode=m;
    if(m==='arr'&&!plan.userTime){ plan.time=Math.min(1439,Math.ceil((nowMin+60)/5)*5); plan.autoArr=1; plan.userTime=true; }   // „atvykti iki“ – pasiūloma po valandos
    else if(m==='dep'&&plan.autoArr){ plan.userTime=false; plan.autoArr=0; refreshTime(); }
    renderBar(); if(plan.from&&plan.to&&plan.from!==plan.to) updPlan(); else announce(m==='arr'?'Pasirinkite, iki kada norite atvykti.':'Pasirinkite išvykimo laiką.');
    const f=document.querySelector(`[data-pm="${m}"]`); if(f) f.focus(); });
  bar.querySelector('#pswap').onclick=()=>{[plan.from,plan.to]=[plan.to,plan.from];renderBar();};
  bar.querySelector('#pgo').onclick=()=>{
    if(!plan.from||!plan.to){(plan.from?bar.querySelector('#pt'):bar.querySelector('#pf')).focus();return;}
    updPlan(); if(isPhone()&&mapBig) document.getElementById('map').scrollIntoView({behavior:SMOOTH,block:'start'});};
}
renderBar();
// ---- telefone: mažas žemėlapis (peržiūra) ir mygtukas jam padidinti ----
let mapBig=false;
const MapBtn=L.Control.extend({options:{position:'topright'},onAdd(){
  const b=L.DomUtil.create('button','mapexp'); b.type='button'; b.setAttribute('aria-controls','map');
  L.DomEvent.disableClickPropagation(b); b.onclick=()=>{ setMapBig(!mapBig); if(mapBig) document.getElementById('map').scrollIntoView({behavior:SMOOTH,block:'start'}); };
  return b; }});
const mapExp=new MapBtn().addTo(map).getContainer();
// ---- telefone: „📍 Mano vieta“ – vieta lieka tik telefone (niekur nesiunčiama), pasiūloma artimiausia stotelė ----
let meLayer=null;
const GeoBtn=L.Control.extend({options:{position:'topleft'},onAdd(){
  const b=L.DomUtil.create('button','mapgeo'); b.type='button'; b.setAttribute('aria-label','Rodyti mano vietą ir artimiausią stotelę'); b.title='Mano vieta';
  b.innerHTML='<span aria-hidden="true">📍</span>'; L.DomEvent.disableClickPropagation(b); b.onclick=locateMe; return b; }});
const geoBtn=new GeoBtn().addTo(map).getContainer();
function geoMsg(t){ L.popup({closeButton:false,className:'stoppopw'}).setLatLng(map.getCenter()).setContent(`<div class="stoppop"><span>${t}</span></div>`).openOn(map); announce(t); }
function locateMe(){
  if(!navigator.geolocation){ geoMsg('Ši naršyklė vietos nustatyti negali.'); return; }
  geoBtn.classList.add('busy');
  navigator.geolocation.getCurrentPosition(pos=>{ geoBtn.classList.remove('busy');
    const me=[pos.coords.latitude,pos.coords.longitude], acc=pos.coords.accuracy||0;
    if(meLayer) map.removeLayer(meLayer);
    meLayer=L.layerGroup([...(acc&&acc<400?[L.circle(me,{radius:acc,color:'#1A73E8',weight:1,fillColor:'#1A73E8',fillOpacity:.12,interactive:false})]:[]),
      L.circleMarker(me,{radius:8,color:'#fff',weight:3,fillColor:'#1A73E8',fillOpacity:1,interactive:false})]).addTo(map);
    const K=Math.cos(me[0]*Math.PI/180); let best=null,bd=1e9;
    D.stops.forEach(s=>{const d=Math.hypot((s.lat-me[0])*111320,(s.lon-me[1])*111320*K); if(d<bd){bd=d;best=s;}});
    if(!best||bd>5000){ map.setView(me,13); geoMsg('Jūs esate toli nuo Ukmergės miesto autobusų stotelių.'); return; }
    // žemėlapis juda tik tada, kai jūsų ar stotelės nesimato, ir priartina saikingai (matosi aplinka ir langelis)
    const both=L.latLngBounds([me,[best.lat,best.lon]]), inner=map.getBounds().pad(-.12);
    if(!(inner.contains(me)&&inner.contains([best.lat,best.lon])))
      map.fitBounds(both,{paddingTopLeft:[40,90],paddingBottomRight:[40,20],maxZoom:Math.max(14,Math.min(map.getZoom(),15)),animate:false});
    stopPopup(best.id,`📍 Arčiausia stotelė – ~${Math.round(bd/10)*10} m`);
  },err=>{ geoBtn.classList.remove('busy');
    geoMsg(err.code===1?'Vietos naudoti neleista. Leiskite naršyklei naudoti vietą (telefono nustatymuose) ir bandykite dar kartą.':'Nepavyko nustatyti vietos. Patikrinkite, ar telefone įjungta vietos funkcija.');
  },{enableHighAccuracy:true,timeout:12000,maximumAge:60000}); }
function setMapBig(o){ mapBig=o; document.body.classList.toggle('mapbig',o); mapExp.setAttribute('aria-expanded',String(o));
  mapExp.innerHTML=o?'<span aria-hidden="true">⤡</span> Sumažinti':'<span aria-hidden="true">⤢</span> Padidinti';
  map.options.zoomSnap=isPhone()&&!o?0.25:1;   // mažame žemėlapyje tikslesnis priartinimas
  map.invalidateSize();
  if(state.stop){const st=STOP[state.stop]; map.setView([st.lat,st.lon],o?16:15);} else if(state.route||plan.res.length) render(true); else map.fitBounds(homeBounds(),{padding:isPhone()&&!o?[4,4]:[20,20],animate:false}); }   // be animacijos – kitaip ji vėliau perrašo kelionės priartinimą
setMapBig(false);
map.on('popupopen',()=>document.body.classList.add('popopen')); map.on('popupclose',()=>document.body.classList.remove('popopen'));   // langelio neuždengia „Padidinti“
let wasPhone=isPhone();
addEventListener('resize',()=>{ if(isPhone()!==wasPhone){ wasPhone=isPhone(); setMapBig(false); render(false); } });
// telefone: paspaudus žemėlapį atidaroma arčiausiai piršto esanti stotelė (iki 26 px) – taškai maži, o stotelės arti viena kitos
map.on('click',e=>{ if(!isPhone()) return; let best=null,bd=26;
  D.stops.forEach(st=>{const q=map.latLngToContainerPoint([st.lat,st.lon]), d=Math.hypot(q.x-e.containerPoint.x,q.y-e.containerPoint.y); if(d<bd){bd=d;best=st;}});
  if(best) setTimeout(()=>stopPopup(best.id),0); });
map.on('click',()=>{ if(onMapPg()||isPhone()) return;
  if(state.stop){state.stop=null;render(false);}
  else if(state.route){state={route:null,day:today,trip:null,stop:null};render(false);}
});
render(true);

// ---- interaktyvi instrukcija: žingsniai su pavyzdžiais; kompiuteryje užtamsinimas, telefone kortelė apačioje ----
const TOUR=[
 {sel:null,t:'Sveiki!',x:'Tai Ukmergės miesto viešojo transporto žemėlapis: visi miesto autobusų maršrutai, stotelės, tvarkaraščiai ir kelionės planuoklis vienoje vietoje.<br>Per minutę parodysime, kaip juo naudotis.',
  demo:()=>tourHome()},
 {sel:'#map',t:'Žemėlapis',x:'Balti taškai yra stotelės, spalvotos linijos – autobusų maršrutai (kiekvienas savo spalvos).<br>Paspauskite stotelę – pamatysite jos tvarkaraštį. Paspauskite liniją – bus parodytas tas maršrutas. Paspaudus tuščią vietą, pasirinkimas nuimamas.',
  demo:()=>{tourHome(); if(isPhone()&&!mapBig) setMapBig(true); const s=D.stops.find(x=>x.name==='Autobusų stotis'); if(s) hoverStop(s.id);}, pad:-40},
 {sel:'.routesbox',t:'Maršrutai ir tvarkaraščiai',x:'Čia – visų maršrutų sąrašas. Paspaudę maršrutą pamatysite jo stoteles eilės tvarka, o paspaudę stotelę – jos tvarkaraštį.',
  xm:'Visų maršrutų sąrašas atsidaro per meniu (☰) – „Maršrutai ir tvarkaraščiai“. Paspaudę maršrutą pamatysite jo stoteles eilės tvarka, o paspaudę stotelę – jos tvarkaraštį. Grįžti – meniu „Maršruto planuoklis“ arba telefono „Atgal“.',
  demo:()=>{tourHome(); if(isPhone()){setPage('routes',''); render(true);}}},
 {sel:'.rhead',selm:'.rcard-open',also:'.dirs',t:'Kryptis ir diena',x:'Pavyzdžiui, atidarytas 4 maršrutas. Pasirinkite kryptį – žemėlapyje atsiras rodyklės, o sąraše liks tos krypties stotelės. Darbo ir poilsio dienomis maršrutai gali skirtis, todėl pasirinkite dieną.',
  demo:()=>{tourHome(); viewDay='W'; selectRoute('4'); state.dir='A'; render(false);}},
 {sel:'.vhead',also:'.vlist',t:'Kiti reisai',x:'Čia – retesni, netipiniai reisai, pavyzdžiui, iki Varinės ar per Dukstyną. Paspaudus parodomas visas reiso kelias žemėlapyje, stotelės ir laikai.',
  demo:()=>{tourHome(); viewDay='W'; selectRoute('4'); const vs=((D.variants['4']||{}).D||[]); const v=vs.find(x=>/Dukstyn/.test(x.label))||vs.find(x=>/Varin/.test(x.label))||vs[0]; if(v){state.variant=v.label;} render(false);}},
 {sel:'#planbar',t:'Kelionės planuoklis',x:'Pasirinkite, iš kur ir į kur važiuojate, datą ir laiką, ir spauskite „Ieškoti kelionės“. Data ir laikas nustatomi automatiškai – šiandiena ir dabartinis laikas.',
  demo:()=>{tourHome(); plan.from='Kauno'; plan.to='Pašilė'; renderBar();}},
 {sel:'.planner',t:'Kelionės pasiūlymai',x:'Planuoklis parodo geriausius pasiūlymus: kada išvykti, kur persėsti ar kiek eiti pėsčiomis. Pasirinkta kelionė nupiešiama ir žemėlapyje.',
  demo:()=>{tourHome(); plan.from='Kauno'; plan.to='Pašilė'; plan.date=isoDate(new Date()); plan.day=dayInfo(plan.date).day; plan.time=8*60; if(plan.day!=='W'){const d=new Date(); while(dayInfo(isoDate(d)).day!=='W') d.setDate(d.getDate()+1); plan.date=isoDate(d); plan.day='W';} renderBar(); updPlan();}},
 {sel:'#fbbtn',selm:'#menubtn',t:'Pastebėjote klaidą?',x:'Jei radote netikslumą ar turite pasiūlymą, paspauskite šauktuko (!) mygtuką viršuje ir užpildykite trumpą formą – tai padės puslapį patobulinti.',
  xm:'Meniu (☰) viršuje rasite „Pranešti apie klaidą“ – trumpa forma padės puslapį patobulinti. Ten pat galite įsidėti puslapį į telefono ekraną.',
  demo:()=>tourHome()},
 {sel:'#tourbtn',selm:'#menubtn',t:'Viskas!',x:'Šią instrukciją galėsite peržiūrėti dar kartą paspaudę klaustuko (?) mygtuką viršuje. Gero kelio!',
  xm:'Šią instrukciją galėsite peržiūrėti dar kartą meniu (☰) – „Kaip naudotis“. Gero kelio!',
  demo:()=>tourHome()}
];
let tourI=-1, tourEl=null, tourSnap=null, tourPrevFocus=null;
const tourMobile=()=>innerWidth<=820;
function tourHome(){ unhoverStop(); state={route:null,day:today,trip:null,stop:null,dir:null,variant:null}; if(page!=='plan') setPage('plan','');
  if(tourSnap){plan.from=tourSnap.plan.from;plan.to=tourSnap.plan.to;plan.date=tourSnap.plan.date;plan.day=tourSnap.plan.day;plan.time=tourSnap.plan.time;plan.res=tourSnap.plan.res;plan.opt=tourSnap.plan.opt;viewDay=tourSnap.viewDay;}
  renderBar(); render(false); }
function tourShow(i){
  tourI=i; const st=TOUR[i];
  if(!tourEl){tourEl=document.createElement('div');tourEl.className='tour';tourEl.setAttribute('role','dialog');tourEl.setAttribute('aria-modal','true');tourEl.setAttribute('aria-labelledby','tour-h');
    tourEl.innerHTML='<div class="tour-hole"></div><div class="tour-card" tabindex="-1"></div>';document.body.appendChild(tourEl);
    tourEl.addEventListener('click',e=>{if(e.target===tourEl)tourEnd();});
    const card=tourEl.querySelector('.tour-card'); let x0=null;
    card.addEventListener('touchstart',e=>{x0=e.touches[0].clientX;},{passive:true});
    card.addEventListener('touchend',e=>{ if(x0===null)return; const dx=e.changedTouches[0].clientX-x0; x0=null;
      if(dx<-50) (tourI+1<TOUR.length?tourShow(tourI+1):tourEnd()); else if(dx>50&&tourI>0) tourShow(tourI-1);});}
  tourEl.classList.toggle('mobile',tourMobile());
  if(st.demo) st.demo();
  const hole=tourEl.querySelector('.tour-hole'), card=tourEl.querySelector('.tour-card');
  const last=i+1===TOUR.length, first=i===0;
  card.innerHTML=`${first?'':`<div class="tour-step">${i} / ${TOUR.length-1}</div>`}<h3 id="tour-h">${st.t}</h3><p>${tourMobile()&&st.xm?st.xm:st.x}</p>
    <div class="tour-btns"><button data-t="skip" class="tour-link">${last?'Uždaryti':'Praleisti'}</button><span></span>
    ${i>0?'<button data-t="prev">Atgal</button>':''}<button data-t="next" class="pri">${first?'Pradėti →':last?'Baigti':'Toliau'}</button></div>`;
  card.querySelector('[data-t="next"]').onclick=()=>last?tourEnd():tourShow(i+1);
  const pv=card.querySelector('[data-t="prev"]'); if(pv) pv.onclick=()=>tourShow(i-1);
  card.querySelector('[data-t="skip"]').onclick=tourEnd;
  const vw=innerWidth,vh=innerHeight;
  const sel=tourMobile()&&st.selm?st.selm:st.sel; let el=sel?document.querySelector(sel):null; if(el&&!el.getClientRects().length) el=null;
  if(tourMobile()){
    // phone: card docked at the bottom, highlighted part scrolled into view above it, no dimming
    Object.assign(card.style,{left:'8px',right:'8px',width:'auto',top:'auto',bottom:'8px'});
    if(el){ el.scrollIntoView({block:'start',behavior:'auto'}); scrollBy(0,-10); }
    requestAnimationFrame(()=>{ if(!el){hole.style.display='none';return;} hole.style.display='';
      let r=el.getBoundingClientRect(); const lim=vh-card.offsetHeight-16;
      if(st.also){const e2=document.querySelector(st.also); if(e2&&e2.getClientRects().length){const r2=e2.getBoundingClientRect(); r={left:Math.min(r.left,r2.left),top:Math.min(r.top,r2.top),width:Math.max(r.right,r2.right)-Math.min(r.left,r2.left),height:Math.max(r.bottom,r2.bottom)-Math.min(r.top,r2.top)};}}
      Object.assign(hole.style,{left:(r.left-4)+'px',top:(r.top-4)+'px',width:(r.width+8)+'px',height:Math.max(0,Math.min(r.height,lim-r.top)+8)+'px'});});
  } else {
    card.style.right='auto'; card.style.bottom='auto';
    if(!el){ Object.assign(hole.style,{left:'50%',top:'50%',width:'0px',height:'0px'}); hole.classList.add('tour-nohole');
      const cw=Math.min(400,vw-24); card.style.width=cw+'px';
      Object.assign(card.style,{left:((vw-cw)/2)+'px',top:Math.max(12,(vh-(card.offsetHeight||180))/2)+'px'});
    } else {
      hole.classList.remove('tour-nohole'); el.scrollIntoView({block:st.also?'start':'nearest'});
      let r=el.getBoundingClientRect();
      if(st.also){const e2=document.querySelector(st.also); if(e2&&e2.getClientRects().length){const r2=e2.getBoundingClientRect(); r={left:Math.min(r.left,r2.left),top:Math.min(r.top,r2.top),right:Math.max(r.right,r2.right),bottom:Math.max(r.bottom,r2.bottom)};}}
      const pad=st.pad||6, L_=r.left-pad,T_=Math.max(4,r.top-pad),W_=(r.right-r.left)+2*pad,H_=Math.min(vh-4,r.bottom+pad)-T_;   // clipped to the screen
      Object.assign(hole.style,{left:L_+'px',top:T_+'px',width:W_+'px',height:H_+'px'});
      const cw=Math.min(360,vw-24); card.style.width=cw+'px'; const ch=card.offsetHeight||180;
      let cx,cy;
      if(L_+W_+cw+24<vw){cx=L_+W_+12;cy=Math.min(Math.max(12,T_),vh-ch-12);}          // right of the highlight
      else if(L_-cw-12>0){cx=L_-cw-12;cy=Math.min(Math.max(12,T_),vh-ch-12);}          // left of it
      else {cx=Math.min(Math.max(12,L_),vw-cw-12); cy=T_+H_+12; if(cy+ch>vh-12) cy=Math.max(12,T_-ch-12);}
      if(st.sel==='#map'){cx=L_+24; cy=Math.max(T_+24,T_+H_-ch-24);}                  // big map: card in its lower-left corner (example stop stays visible)
      Object.assign(card.style,{left:cx+'px',top:cy+'px'});
    }
  }
  card.querySelector('[data-t="next"]').focus({preventScroll:true});
}
function tourStart(){ tourPrevFocus=document.activeElement;
  tourSnap={state:JSON.parse(JSON.stringify({...state})),viewDay,mapBig,page,plan:{from:plan.from,to:plan.to,date:plan.date,day:plan.day,time:plan.time,res:plan.res,opt:plan.opt}};
  setTimeout(()=>tourShow(0),50); }
function tourEnd(){ if(tourEl){tourEl.remove();tourEl=null;} const was=tourI; tourI=-1;
  if(tourSnap){ tourHome(); if(tourSnap.page!=='plan'){setPage(tourSnap.page,''); render(true);} if(mapBig!==tourSnap.mapBig) setMapBig(tourSnap.mapBig); tourSnap=null; }
  try{localStorage.setItem('ap-tour','1')}catch(e){}
  if(tourPrevFocus&&tourPrevFocus.focus) try{tourPrevFocus.focus({preventScroll:true})}catch(e){}
  if(was>=0&&tourMobile()) scrollTo(0,0); }
document.addEventListener('keydown',e=>{ if(tourI<0)return;
  if(e.key==='Tab'&&tourEl){const f=[...tourEl.querySelectorAll('button')]; if(f.length){const i=f.indexOf(document.activeElement); e.preventDefault(); f[(i+(e.shiftKey?-1:1)+f.length)%f.length].focus();}}
  if(e.key==='Escape')tourEnd(); if(e.key==='ArrowRight')(tourI+1<TOUR.length?tourShow(tourI+1):tourEnd()); if(e.key==='ArrowLeft'&&tourI>0)tourShow(tourI-1);});
addEventListener('resize',()=>{if(tourI>=0)tourShow(tourI); const pf=document.getElementById('pf'); if(pf&&pf.options[0].text!==PH()) renderBar();});
document.getElementById('tourbtn').onclick=tourStart;
(()=>{const b=document.getElementById('fbbtn');
  b.title=FEEDBACK_URL?'Pranešk apie netikslumus / pasiūlyk patobulinimą':'Atsiliepimų forma bus netrukus';
  if(FEEDBACK_URL) b.setAttribute('aria-label','Pranešk apie netikslumus arba pasiūlyk patobulinimą (atsidarys naujame lange)'); else b.setAttribute('aria-disabled','true');
  b.onclick=openFeedback;})();
function openFeedback(){ if(FEEDBACK_URL) window.open(FEEDBACK_URL,'_blank','noopener'); }
document.querySelectorAll('[data-a11y]').forEach(b=>b.onclick=()=>{const d=document.getElementById('a11ydlg'); if(d&&d.showModal) d.showModal();});
(()=>{let seen=false;try{seen=localStorage.getItem('ap-tour')==='1'}catch(e){} if(!seen&&!isPhone()) setTimeout(tourStart,700);})();

// ---- telefone: šoninis meniu (☰) – maršrutai, žemėlapis, instrukcija, įsidiegimas, klaidų pranešimas ----
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
let instEv=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault(); instEv=e;});
addEventListener('appinstalled',()=>{instEv=null; store.set('ap-inst',1);});
function doInstall(){
  if(instEv){ instEv.prompt(); instEv.userChoice.then(c=>{ if(c.outcome==='accepted') store.set('ap-inst',1); instEv=null; }).catch(()=>{}); return; }
  const d=document.getElementById('instdlg');
  d.querySelector('.inst-ios').hidden=!isIOS; d.querySelector('.inst-and').hidden=isIOS; if(d.showModal) d.showModal(); }
{ const ad=document.getElementById('alldlg'); ad.addEventListener('cancel',e=>{e.preventDefault();closeAllDay();}); ad.addEventListener('click',e=>{if(e.target===ad) closeAllDay();}); }
{ const dlg=document.getElementById('stopdlg');   // Esc ir paspaudimas šalia lango – uždaro
  dlg.addEventListener('cancel',e=>{e.preventDefault();closeStop();});
  dlg.addEventListener('click',e=>{if(e.target===dlg) closeStop();}); }
document.querySelector('.instclose').onclick=()=>document.getElementById('instdlg').close();
const menu=document.getElementById('menudlg'), menuBtn=document.getElementById('menubtn');
if(!store.get('ap-menu')) menuBtn.classList.add('new');   // geltonas taškelis, kol meniu dar neatidarytas
menuBtn.onclick=()=>{ menu.querySelector('[data-m="inst"]').hidden=standalone()||!!store.get('ap-inst');
  store.set('ap-menu',1); menuBtn.classList.remove('new'); menuBtn.setAttribute('aria-expanded','true'); menu.showModal(); };
menu.addEventListener('close',()=>menuBtn.setAttribute('aria-expanded','false'));
menu.addEventListener('click',e=>{ if(e.target===menu) menu.close(); });
menu.querySelector('.mclose').onclick=()=>menu.close();
const MENU={
  routes:()=>{ state={route:null,day:today,trip:null,stop:null,dir:null,variant:null};
    if(isPhone()) setPage('routes','push'); render(true); fitAll();
    if(!isPhone()){const pn=document.getElementById('panel'); if(pn) pn.scrollTop=0;} },
  plan:()=>{ if(page!=='plan') toPlan(); else goHome(); },
  map:()=>{ state={route:null,day:today,trip:null,stop:null,dir:null,variant:null}; setPage('map','push'); render(true); },
  tour:tourStart, inst:doInstall, fb:openFeedback,
  a11y:()=>{const d=document.getElementById('a11ydlg'); if(d&&d.showModal) d.showModal();}};
menu.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{ menu.close(); setTimeout(MENU[b.dataset.m],50); });
if(!FEEDBACK_URL) menu.querySelector('[data-m="fb"]').hidden=true;

// ---- pavadinimas = mygtukas į pradžią: be atidaryto maršruto ar stotelės, žemėlapis sumažintas, puslapio viršus ----
function toPlan(){ setPage('plan','push'); goHome(); }
function goHome(){ state={route:null,day:today,trip:null,stop:null,dir:null,variant:null};
  if(mapBig) setMapBig(false); render(true); if(!plan.res.length) fitAll();
  scrollTo({top:0,behavior:SMOOTH}); const pn=document.getElementById('panel'); if(pn) pn.scrollTop=0; }
document.getElementById('homelink').onclick=e=>{ e.preventDefault(); if(tourI>=0) return; if(page!=='plan') toPlan(); else goHome(); };
// naršyklės / telefono „Atgal“ tarp planuoklio ir maršrutų
addEventListener('popstate',()=>{ if(tourI>=0) return; { const ad=document.getElementById('alldlg'); if(ad.open&&!(history.state&&history.state.all)){ ad.close(); return; } } const p=hashPg(), hs=history.state||{};
  if(p===page&&state.stop&&!hs.s){ state.stop=null; render(false); return; }   // uždaromas stotelės langas
  if(p===page&&p==='routes'&&state.route&&!hs.r){ state={route:null,day:today,trip:null,stop:null,dir:null,variant:null}; render(true); fitAll(); document.getElementById('panel').scrollTop=0; return; }
  if(p===page) return;
  page=p; document.body.classList.toggle('pg-routes',p==='routes'); document.body.classList.toggle('pg-map',p==='map'); scrollTo(0,0); map.invalidateSize();
  if(p==='plan') goHome(); else { const keep=hs.r&&p==='routes'?hs.r:(p==='map'?state.route:null);   // grįžus į atidarytą maršrutą – jis lieka
    state={route:keep,day:today,trip:null,stop:null,dir:keep?state.dir:null,variant:null}; render(true); if(!keep) fitAll(); } });
if(hashPg()==='routes'&&isPhone()){ setPage('routes',''); render(true); fitAll(); } else if(location.hash&&isPhone()) setPage('plan','');   // senas #zemelapis ir pan. – planuoklis
function fitAll(){ map.fitBounds(homeBounds(),{padding:isPhone()&&!mapBig?[4,4]:[20,20],animate:false}); }

// ---- paleidimas: stotelės iš nuorodos arba paskutinė paieška ----
(()=>{ let f='',t=''; try{const q=new URLSearchParams(location.search); f=q.get('is')||''; t=q.get('i')||'';}catch(e){}
  const fromUrl=NAMES.includes(f)&&NAMES.includes(t)&&f!==t;
  if(!fromUrl&&recent.length){[f,t]=recent[0];}
  if(!(NAMES.includes(f)&&NAMES.includes(t)&&f!==t)) return;
  plan.from=f; plan.to=t; renderBar();
  if(fromUrl||isPhone()) updPlan();   // telefone iškart rodomi artimiausi reisai; kompiuteryje tik užpildoma
})();
// grįžus į puslapį (telefone jis dažnai lieka atidarytas): po ilgesnės pertraukos perkrauti, kitaip atnaujinti laiką
let hiddenAt=0;
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){hiddenAt=Date.now(); return;}
  if(hiddenAt&&Date.now()-hiddenAt>15*60*1000&&tourI<0){ location.reload(); return; }
  if(refreshTime()){ renderBar(); if(plan.res.length&&tourI<0) updPlan(); } });
// PWA: veikia ir be interneto, galima įsidėti į telefono ekraną
if('serviceWorker' in navigator&&location.protocol!=='file:') addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));

// close the accessibility statement: ✕ button, or a click on the dimmed background
document.querySelector('.a11yclose').onclick=()=>document.getElementById('a11ydlg').close();
(()=>{const d=document.getElementById('a11ydlg'); if(!d) return;
  d.addEventListener('click',e=>{ if(e.target!==d) return; const r=d.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) d.close(); });})();
