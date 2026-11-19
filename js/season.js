'use strict';
// Season: Road to the Cup (19 Nov 2026). Free for every player, no paid track. A tour of European football cities in
// three tiers (pages); every city (stop) has one reward. XP from matches and challenges moves you along the road; a
// stop you reach is claimed by hand (A). The season page shows the three tiers as cards with a small map; a tier
// opens on a line-art map of its region with the stops, the road and the picked stop on the right.
// Data: data/season.json (Distal > Data > Season). Save: baize.season. Rewards work like challenge rewards
// (Hobby, a card pack, an Album card or a game item); an item a stop gives stays locked until it is claimed.
// Map: js/seasonmap.js (SE_EUROPE, Natural Earth outlines). Script order: after challenges.js, myclub.js, tablepage.js.

/* ================= data ================= */
const SE_C=(id,city,lon,lat,xp,reward,big,dx,dy,label)=>({id,city,lon,lat,xp,reward,big:!!big,dx,dy,label:label||'auto'});
const seH=n=>({type:'hobby',n}),sePK=n=>({type:'pack',n}),seIT=(type,id)=>({type,id:id||''});
const SEASON_DEF={version:1,on:true,name:'Season 1',title:'Road to the Cup',ends:'2027-01-31',
  xp:{win:120,draw:70,loss:40,goal:10,clean:30,challenge:150},
  tiers:[
    {id:'west',name:'The West',stops:[
      SE_C('porto','Porto',-8.61,41.15,200,seH(150),0,-62,-30,'r'),SE_C('lisbon','Lisbon',-9.14,38.72,500,sePK(3),0,-66,10,'b'),
      SE_C('seville','Seville',-5.98,37.39,500,seH(200),0,0,-62),SE_C('madrid','Madrid',-3.70,40.42,600,seIT('ball'),1,0,-66),
      SE_C('barcelona','Barcelona',2.17,41.39,600,seH(200),0,30,-62),SE_C('marseille','Marseille',5.37,43.30,600,seIT('trinket'),0,10,-66),
      SE_C('lyon','Lyon',4.83,45.76,700,sePK(3),0,-60,-40),SE_C('paris','Paris',2.35,48.86,800,seIT('field'),1,0,-66)]},
    {id:'north',name:'The North',stops:[
      SE_C('glasgow','Glasgow',-4.25,55.86,700,seIT('banner'),0,70,10,'l'),SE_C('liverpool','Liverpool',-2.98,53.41,700,seH(250),0,-70,-20,'b'),
      SE_C('manchester','Manchester',-2.24,53.48,700,sePK(3),0,20,-64,'r'),SE_C('london','London',-0.13,51.51,800,seH(250),0,-20,62),
      SE_C('brussels','Brussels',4.35,50.85,800,sePK(4),0,-66,40),SE_C('amsterdam','Amsterdam',4.90,52.37,900,seIT('ball'),1,0,-64),
      SE_C('dortmund','Dortmund',7.47,51.51,900,seH(300),0,30,60),SE_C('hamburg','Hamburg',9.99,53.55,1000,seIT('table'),1,0,-64)]},
    {id:'final',name:'The Final',stops:[
      SE_C('munich','Munich',11.58,48.14,900,sePK(4),0,0,-64),SE_C('vienna','Vienna',16.37,48.21,900,seH(300),0,0,-64),
      SE_C('milan','Milan',9.19,45.46,1000,seIT('crest'),0,64,34,'t'),SE_C('turin','Turin',7.69,45.07,1000,seH(300),0,-80,-50,'b'),
      SE_C('rome','Rome',12.50,41.90,1100,seIT('ball'),1,-40,-58),SE_C('naples','Naples',14.27,40.85,1100,sePK(5),0,56,-30,'b'),
      SE_C('athens','Athens',23.73,37.98,1200,seIT('field'),1,0,-64),SE_C('istanbul','Istanbul',28.98,41.01,1500,sePK(10),1,0,-78)]}]};
function cleanSeason(o){
  o=o&&typeof o==='object'?o:{};
  const str=(v,n,d)=>typeof v==='string'?v.replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,n):d;
  const num=(v,lo,hi,d)=>{v=Number(v);return isFinite(v)?Math.max(lo,Math.min(hi,v)):d;};
  const int=(v,lo,hi,d)=>Math.round(num(v,lo,hi,d));
  const RT=chRewardTypes(),X=o.xp&&typeof o.xp==='object'?o.xp:{},XD=SEASON_DEF.xp;
  const out={version:1,on:o.on!==false,name:str(o.name,40,'')||SEASON_DEF.name,title:str(o.title,40,'')||SEASON_DEF.title,
    ends:/^\d{4}-\d{2}-\d{2}$/.test(o.ends||'')?o.ends:'',xp:{},tiers:[]};
  Object.keys(XD).forEach(k=>out.xp[k]=int(X[k],0,100000,XD[k]));
  const ids=new Set();
  (Array.isArray(o.tiers)?o.tiers:SEASON_DEF.tiers).slice(0,6).forEach((t,ti)=>{if(!t||typeof t!=='object')return;
    let tid=str(t.id,24,'').replace(/[^A-Za-z0-9_-]/g,'')||'tier'+(ti+1);while(ids.has(tid))tid+='_';ids.add(tid);
    const T={id:tid,name:str(t.name,32,'')||'Tier '+(ti+1),stops:[]};
    (Array.isArray(t.stops)?t.stops:[]).slice(0,16).forEach((s,si)=>{if(!s||typeof s!=='object')return;
      let id=str(s.id,24,'').replace(/[^A-Za-z0-9_-]/g,'')||(tid+'_'+(si+1));while(ids.has(id))id+='_';ids.add(id);
      let reward=null;const r=s.reward;
      if(r&&typeof r==='object'&&RT[r.type])reward=r.type==='hobby'?{type:'hobby',n:int(r.n,1,100000,100)}:r.type==='pack'?{type:'pack',n:int(r.n,1,10,3)}:{type:r.type,id:str(String(r.id==null?'':r.id),40,'')};
      T.stops.push({id,city:str(s.city,32,'')||'City',lon:num(s.lon,-30,50,0),lat:num(s.lat,30,72,45),xp:int(s.xp,0,100000,500),reward,big:!!s.big,
        dx:int(s.dx,-200,200,0),dy:int(s.dy,-200,200,-64),label:['auto','b','t','l','r'].includes(s.label)?s.label:'auto'});});
    out.tiers.push(T);});
  return out;}
let SEASON=cleanSeason(SEASON_DEF);

/* ================= save ================= */
const SE_KEY='baize.season';
let SE=(()=>{try{const s=JSON.parse(store.get(SE_KEY)||'null');if(s&&s.v===1)return s;}catch(e){}return null;})()||{v:1,id:'',xp:0,claimed:{},seen:{},chSeen:null};
function saveSe(){store.set(SE_KEY,JSON.stringify(SE));}
// a new season (another name) starts the road again
function seSync(){if(SE.id!==SEASON.name){SE.id=SEASON.name;SE.xp=0;SE.claimed={};SE.seen={};saveSe();}
  if(SE.chSeen==null&&typeof CH!=='undefined'){SE.chSeen=Object.keys(CH.done||{}).length;saveSe();}}

/* ================= the road ================= */
// every stop in order, with the XP total that reaches it
function seRoad(){const out=[];let need=0;SEASON.tiers.forEach((t,ti)=>t.stops.forEach((s,si)=>{need+=s.xp;out.push({s,ti,si,need});}));return out;}
const seReached=e=>SE.xp>=e.need;
function seState(ti,si){const R=seRoad(),k=R.findIndex(e=>e.ti===ti&&e.si===si),e=R[k];if(!e)return 'lock';
  if(SE.claimed[e.s.id])return 'got';if(seReached(e))return 'now';
  const first=R.findIndex(x=>!seReached(x));if(k===first&&seTierOpen(ti))return 'next';return 'lock';}
// a tier opens when the last stop of the tier before it is reached
function seTierOpen(ti){if(ti<=0)return true;const R=seRoad().filter(e=>e.ti===ti-1);return !R.length||seReached(R[R.length-1]);}
function seNext(){const R=seRoad(),k=R.findIndex(e=>!seReached(e));if(k<0)return null;const e=R[k],prev=k?R[k-1].need:0;return{e,have:SE.xp-prev,of:e.s.xp};}
function seCanClaim(){return seRoad().filter(e=>seReached(e)&&!SE.claimed[e.s.id]).length;}
function seDays(){if(!SEASON.ends)return null;const d=Math.ceil((new Date(SEASON.ends+'T23:59:59')-Date.now())/864e5);return d;}

/* ================= XP ================= */
let seToastQ=[],seToastT=0;
function seToast(t){if(typeof chToast==='function'){chToast(t);return;}hobbyToast(t,true);}
function seGain(n,why){if(!SEASON.on||!(n>0))return;const before=seRoad().filter(seReached).length;SE.xp+=n;saveSe();
  const R=seRoad(),now=R.filter(seReached);seToast(`+${n} XP · ${SEASON.title}`+(why?` (${why})`:''));
  if(now.length>before)now.slice(before).forEach(e=>seToast(`New stop reached: ${e.s.city}`));
  seDot();if(hubTab==='season')seRender();}
function seMatch(){
  const me=histSide();if(me==null||!S.score||S.conceded)return;
  const gf=S.score[me],ga=S.score[1-me],X=SEASON.xp,res=gf>ga?'win':gf<ga?'loss':'draw';
  seGain(X[res]+gf*X.goal+(ga===0?X.clean:0),'match');}
{const bF=showFT;showFT=function(){const was=HM.done;bF();try{if(HM.done&&!was)seMatch();}catch(e){console.error('[season]',e);}};}
{const bC=chCheck;chCheck=function(quiet){const r=bC(quiet);try{const n=Object.keys(CH.done).length;if(SE.chSeen==null)SE.chSeen=n;
  else if(n>SE.chSeen){const d=n-SE.chSeen;SE.chSeen=n;saveSe();setTimeout(()=>seGain(d*SEASON.xp.challenge,d>1?d+' challenges':'challenge'),900);}}catch(e){}return r;};}

/* ================= rewards ================= */
const SE_TYPE=t=>({hobby:'Hobby',pack:'Card pack',card:'Album card'})[t]||(typeof UNLOCK_TYPES!=='undefined'&&UNLOCK_TYPES[t])||t;
function seItem(r){if(!r||!r.id)return null;if(r.type==='card'){const c=typeof cardById==='function'&&cardById(r.id);return c?{id:c.id,name:c.title}:null;}
  return (typeof unlockItems==='function'?unlockItems(r.type):[]).find(x=>x.id===r.id)||null;}
function seRewardName(r){if(!r)return 'Nothing';if(r.type==='hobby')return r.n+' Hobby';if(r.type==='pack')return `Card pack · ${r.n} card${r.n>1?'s':''}`;
  const it=seItem(r);return it?it.name:SE_TYPE(r.type);}
function seReady(r){return !!r&&(r.type==='hobby'||r.type==='pack'||!!seItem(r));}
function sePay(s){const r=s.reward;if(!r)return true;
  if(r.type==='hobby'){earn(r.n,`${SEASON.title}: ${s.city}`);return true;}
  if(r.type==='pack'){addPack(r.n);return true;}
  if(!seItem(r))return false;
  if(r.type==='card'){giveCard(r.id);return true;}
  if(typeof CARD_PARTS!=='undefined'&&CARD_PARTS.includes(r.type)){OWNED[r.type]=OWNED[r.type]||[];if(!OWNED[r.type].includes(r.id)){OWNED[r.type].push(r.id);store.set('baize.owned',JSON.stringify(OWNED));}}
  SE.seen['item:'+r.type+':'+r.id]=1;return true;}
function seClaim(ti,si){const t=SEASON.tiers[ti],s=t&&t.stops[si];if(!s||seState(ti,si)!=='now')return false;
  if(!sePay(s)){hobbyToast('This reward is not in the game yet.');sfx('clack',10);return false;}
  SE.claimed[s.id]=Date.now();saveSe();try{sfx('coin',30);}catch(e){}hobbyToast(`Claimed: ${seRewardName(s.reward)}`,true);
  seDot();seRender();try{renderCustom();renderLook();}catch(e){}return true;}
// an item a stop gives stays locked until that stop is claimed (like challenge rewards; an Album card lock wins)
function seFor(type,id){if(id==null||id===''||!SEASON.on)return null;for(const t of SEASON.tiers)for(const s of t.stops)if(s.reward&&s.reward.type===type&&s.reward.id===String(id))return s;return null;}
function seLock(type,id){if(!ecoOn())return null;const s=seFor(type,id);if(!s||SE.claimed[s.id]||SE.seen['item:'+type+':'+id])return null;
  if(typeof CARD_PARTS!=='undefined'&&CARD_PARTS.includes(type)&&(id===firstId(type)||(OWNED[type]||[]).includes(id)))return null;
  return{chal:{name:s.city},title:`${SEASON.title}: ${s.city}`,collection:'',no:0,season:true};}
{const bL=cardLock,bP=partLock,bO=owns,bB=buy;
  cardLock=function(part,id){return bL(part,id)||seLock(part,id);};
  partLock=function(type,id){return bP(type,id)||seLock(type,id);};
  owns=function(part,id){if(typeof CARD_PARTS!=='undefined'&&CARD_PARTS.includes(part)&&seLock(part,id))return false;return bO(part,id);};
  buy=function(part,id){const l=seLock(part,id);if(l&&!bL(part,id)){hobbyToast(`A Season reward: reach ${l.chal.name} on the ${SEASON.title}.`);sfx('clack',10);return false;}return bB(part,id);};}

/* ================= icons ================= */
const SE_SVG={
  hobby:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#f6c443" stroke="#9a6d12" stroke-width="1.6"/><circle cx="12" cy="12" r="6.6" fill="none" stroke="#9a6d12" stroke-width="1.2" opacity=".6"/><path d="M9.2 7.5v9M14.8 7.5v9M9.2 12h5.6" stroke="#6b4a08" stroke-width="2" stroke-linecap="round"/></svg>',
  pack:'<svg viewBox="0 0 40 40"><rect x="9" y="5" width="22" height="30" rx="2" fill="#2a5ce0" transform="rotate(-8 20 20)"/><rect x="11" y="6" width="22" height="30" rx="2" fill="#f1e4c6"/><path d="M16 14h12M16 19h12M16 24h8" stroke="#0f2240" stroke-width="2"/><circle cx="28" cy="29" r="4" fill="#f2b632"/></svg>',
  card:'<svg viewBox="0 0 40 40"><rect x="10" y="4" width="20" height="32" rx="2" fill="#f1e4c6" stroke="#f2b632" stroke-width="2"/><circle cx="20" cy="17" r="6" fill="#2f6aa3"/><path d="M14 28h12" stroke="#0f2240" stroke-width="2"/></svg>',
  ball:'<svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="12" fill="#f1e4c6"/><path d="M14 9l4.5 3.3-1.7 5.2h-5.6l-1.7-5.2z" fill="#0f2240"/></svg>',
  crest:'<svg viewBox="0 0 54 62"><path d="M27 2 L51 10 L48 40 Q44 54 27 60 Q10 54 6 40 L3 10 Z" fill="#2f6aa3" stroke="#f1e4c6" stroke-width="3"/><path d="M27 18l4 9h9l-7 6 3 9-9-6-9 6 3-9-7-6h9z" fill="#f2b632"/></svg>',
  pattern:'<svg viewBox="0 0 40 40"><path d="M12 6l-8 6 4 6 4-3v19h16V15l4 3 4-6-8-6h-4a4 4 0 0 1-8 0z" fill="#f1e4c6"/><path d="M16 6v28M24 6v28" stroke="#d94a3a" stroke-width="3"/></svg>',
  music:'<svg viewBox="0 0 40 40"><path d="M14 30V9l18-4v20" fill="none" stroke="#f1e4c6" stroke-width="3"/><ellipse cx="10" cy="30" rx="5" ry="4" fill="#f2b632"/><ellipse cx="28" cy="26" rx="5" ry="4" fill="#f2b632"/></svg>',
  star:'<svg viewBox="0 0 40 40"><path d="M20 4l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#f2b632"/></svg>',
  cup:'<svg viewBox="0 0 40 40"><path d="M12 6h16v8a8 8 0 0 1-16 0z" fill="#f2b632"/><path d="M12 8H6a6 6 0 0 0 6 8M28 8h6a6 6 0 0 1-6 8" fill="none" stroke="#f2b632" stroke-width="2.4"/><path d="M18 22h4v6h-4z" fill="#d99a1e"/><path d="M12 30h16v4H12z" fill="#f2b632"/></svg>',
  stad:'<svg viewBox="0 0 40 26"><path d="M2 12v5a18 8 0 0 0 36 0v-5" fill="#0a1729" stroke="currentColor" stroke-width="2"/><ellipse cx="20" cy="12" rx="18" ry="8" fill="#0a1729" stroke="currentColor" stroke-width="2"/><ellipse cx="20" cy="12" rx="11" ry="4.6" fill="#2f8f45" stroke="currentColor" stroke-width="1"/><path d="M20 7.4v9.2" stroke="currentColor" stroke-width=".8"/></svg>',
  check:'<svg viewBox="0 0 12 10"><path d="M1 5l3.5 3.5L11 1.5" fill="none" stroke="#fff" stroke-width="2.4"/></svg>',
  lock:'<svg viewBox="0 0 10 11"><rect x="1" y="5" width="8" height="6" rx="1" fill="#f2b632"/><path d="M3 5V3.5a2 2 0 0 1 4 0V5" fill="none" stroke="#f2b632" stroke-width="1.6"/></svg>'};
function seIcon(r){if(!r)return SE_SVG.star;const t=r.type;
  if(t==='hobby'||t==='pack'||t==='card')return SE_SVG[t];
  if(t==='ball'){const u=r.id&&typeof thumbs!=='undefined'&&thumbs[r.id];return u?`<img src="${u}" alt="">`:SE_SVG.ball;}
  if(typeof LOOK_PARTS!=='undefined'&&LOOK_PARTS.includes(t)){const u=r.id&&typeof tThumbs!=='undefined'&&tThumbs[t+r.id];if(u)return `<img src="${u}" alt="">`;
    return typeof TB_IC!=='undefined'&&TB_IC[t]?`<span class="se-ic-c">${TB_IC[t]}</span>`:SE_SVG.star;}
  return SE_SVG[t]||SE_SVG.star;}

/* ================= map ================= */
// equirectangular with the width scaled by the middle latitude, fitted so the stops fill the box
let SE_LINES=null;
function seLines(){if(SE_LINES)return SE_LINES;const P=s=>s.split(' ').map(p=>p.split(',').map(Number));
  const mk=a=>a.map(s=>{const p=P(s);let x0=180,x1=-180,y0=90,y1=-90;p.forEach(([x,y])=>{x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);});return{p,b:[x0,y0,x1,y1]};});
  SE_LINES={land:mk(SE_EUROPE.land),borders:mk(SE_EUROPE.borders)};return SE_LINES;}
function seProj(pts,box){
  const lat0=pts.reduce((a,p)=>a+p[1],0)/(pts.length||1),c=Math.cos(lat0*Math.PI/180);
  const xs=pts.map(p=>p[0]*c),ys=pts.map(p=>-p[1]);
  let x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);if(x1-x0<1){x0-=2;x1+=2;}if(y1-y0<1){y0-=2;y1+=2;}
  const [bx0,by0,bx1,by1]=box,k=Math.min((bx1-bx0)/(x1-x0),(by1-by0)/(y1-y0)),ox=(bx0+bx1)/2-(x0+x1)/2*k,oy=(by0+by1)/2-(y0+y1)/2*k;
  const f=(lon,lat)=>[lon*c*k+ox,-lat*k+oy];f.k=k;f.c=c;f.ox=ox;f.oy=oy;return f;}
function seMapPaths(f,W,H){const L=seLines(),inv=(x,y)=>[(x-f.ox)/(f.k*f.c),-(y-f.oy)/f.k];
  const [la,ta]=inv(-40,-40),[lb,tb]=inv(W+40,H+40),bx=[Math.min(la,lb),Math.min(ta,tb),Math.max(la,lb),Math.max(ta,tb)];
  const one=l=>{if(l.b[2]<bx[0]||l.b[0]>bx[2]||l.b[3]<bx[1]||l.b[1]>bx[3])return '';return 'M'+l.p.map(([x,y])=>{const q=f(x,y);return q[0].toFixed(0)+' '+q[1].toFixed(0);}).join('L');};
  return{land:L.land.map(one).join(''),borders:L.borders.map(one).join('')};}
function seCurve(a,b,bend=.18){const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,dx=b[0]-a[0],dy=b[1]-a[1];return `M${a[0].toFixed(0)} ${a[1].toFixed(0)}Q${(mx-dy*bend).toFixed(0)} ${(my+dx*bend).toFixed(0)} ${b[0].toFixed(0)} ${b[1].toFixed(0)}`;}
const SE_RING={got:'#2f8f45',now:'#f2b632',next:'rgba(241,228,198,.6)',lock:'rgba(241,228,198,.28)'};
const seEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
// the map of one tier: line art, the road, stadiums, names and reward medallions. o: {W,H,box,scale,sel,mini}
function seTierMap(ti,o){
  const t=SEASON.tiers[ti];if(!t)return '';const W=o.W,H=o.H,sc=o.scale||1,mini=!!o.mini;
  const pts=t.stops.map(s=>[s.lon,s.lat]),f=seProj(pts.length?pts:[[0,45]],o.box||[W*.1,H*.15,W*.9,H*.9]),P=seMapPaths(f,W,H);
  const st=t.stops.map((s,si)=>seState(ti,si)),xy=t.stops.map(s=>f(s.lon,s.lat));
  let road='';for(let i=0;i+1<xy.length;i++){const done=st[i+1]==='got'||st[i+1]==='now';
    road+=`<path d="${seCurve(xy[i],xy[i+1])}" fill="none" stroke="${done?'#f2b632':'rgba(241,228,198,.55)'}" stroke-width="${(mini?4:8)*sc}" stroke-linecap="round"${done?'':` stroke-dasharray="${3*sc} ${(mini?9:12)*sc}"`}/>`;}
  let svg=`<svg class="se-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><path d="${P.land}" fill="rgba(241,228,198,.03)" stroke="rgba(241,228,198,.62)" stroke-width="${mini?1:1.5}" stroke-linejoin="round"/><path d="${P.borders}" fill="none" stroke="rgba(241,228,198,.26)" stroke-width=".8" stroke-dasharray="3 3"/>${road}`;
  if(mini){svg+=xy.map((p,i)=>`<circle cx="${p[0].toFixed(0)}" cy="${p[1].toFixed(0)}" r="${i===xy.length-1&&ti===SEASON.tiers.length-1?9:6}" fill="${st[i]==='lock'||st[i]==='next'?'#0a1729':SE_RING[st[i]]}" stroke="#f1e4c6" stroke-width="2"/>`).join('');return svg+'</svg>';}
  const ms=64*sc,last=ti===SEASON.tiers.length-1;let lines='',html='';
  t.stops.forEach((s,i)=>{const [x,y]=xy[i],S=st[i],big=last&&i===t.stops.length-1,size=big?ms*1.3:ms,mx=x+s.dx*sc,my=y+s.dy*sc;
    lines+=`<path d="M${x.toFixed(0)} ${y.toFixed(0)}L${mx.toFixed(0)} ${my.toFixed(0)}" stroke="${S==='lock'?'rgba(241,228,198,.3)':SE_RING[S]}" stroke-width="2"/>`;
    let side=s.label;if(side==='auto')side=s.dy<0?'b':'t';
    const lw=150*sc,ly={b:y+14*sc,t:y-36*sc,r:y-12*sc,l:y-12*sc}[side],lx={b:x-lw/2,t:x-lw/2,r:x+20*sc,l:x-20*sc-lw}[side],al={b:'center',t:'center',r:'left',l:'right'}[side];
    html+=`<span class="se-stad se-${S}" style="left:${(x-17*sc).toFixed(0)}px;top:${(y-11*sc).toFixed(0)}px;width:${34*sc}px">${SE_SVG.stad}</span>`+
      `<span class="se-city se-${S}" style="left:${lx.toFixed(0)}px;top:${ly.toFixed(0)}px;width:${lw.toFixed(0)}px;text-align:${al};font-size:${17*sc}px">${seEsc(s.city)}</span>`+
      `<button type="button" class="se-m se-${S}${s.big?' se-epic':''}${big?' cup':''}${o.sel===i?' sel':''}" data-si="${i}" style="left:${(mx-size/2).toFixed(0)}px;top:${(my-size/2).toFixed(0)}px;width:${size.toFixed(0)}px;height:${size.toFixed(0)}px" aria-label="${seEsc(s.city)}: ${seEsc(seRewardName(s.reward))}">`+
      `<span class="se-mi">${seIcon(s.reward)}</span>${S==='got'?`<i class="se-mk ok">${SE_SVG.check}</i>`:S==='lock'?`<i class="se-mk">${SE_SVG.lock}</i>`:''}${big?`<i class="se-cupb">${SE_SVG.cup}</i>`:''}</button>`;});
  return svg+`<g>${lines}</g></svg>`+html;}
// for Distal: the tier map as one block of HTML (inline sizes; the game's season.css styles it in the game)
function seasonPreview(ti,W,H,sel){const sc=Math.min(W/1600,H/758);return `<div class="se-map" style="position:relative;width:${W}px;height:${H}px;overflow:hidden">${seTierMap(ti,{W,H,scale:sc,sel,box:seBox(ti,W,H,sc)})}</div>`;}
// the tier's title goes top left or bottom left, where fewer stops are; the stops keep clear of it
function seSide(ti){const t=SEASON.tiers[ti];if(!t||!t.stops.length)return 'top';const f=seProj(t.stops.map(s=>[s.lon,s.lat]),[160,120,1040,668]),xy=t.stops.map(s=>f(s.lon,s.lat));
  const top=xy.filter(p=>p[0]<700&&p[1]<300).length,bot=xy.filter(p=>p[0]<700&&p[1]>480).length;return top<=bot?'top':'bottom';}
function seBox(ti,W,H,sc){return seSide(ti)==='top'?[160*sc,250*sc,1040*sc,H-80*sc]:[160*sc,110*sc,1040*sc,H-230*sc];}

/* ================= pages ================= */
const SEV={view:'home',tier:0,sel:0};
function seBuild(){
  if($('#season-panel'))return;
  const tab=document.createElement('button');tab.className='tab';tab.setAttribute('role','tab');tab.dataset.tab='season';tab.setAttribute('aria-selected','false');
  tab.innerHTML='Season<i class="tab-dot" id="season-dot" hidden></i>';
  const play=document.querySelector('.tab[data-tab="play"]');play.after(tab);tab.addEventListener('click',()=>setTab('season'));
  const p=document.createElement('div');p.className='panel';p.dataset.panel='season';p.id='season-panel';p.hidden=true;p.innerHTML='<div class="se-wrap" id="se-wrap"></div>';
  const ref=document.querySelector('[data-panel="squad"]')||document.querySelector('[data-panel="custom"]');ref.before(p);
  if(!TABS.includes('season'))TABS.splice(1,0,'season');if(!PAUSE_HIDE.includes('season'))PAUSE_HIDE.push('season');
  const G=[['#se-cards','row'],['#se-stops','map'],['#se-act','row']],L=[['#se-stops',{r:'#se-act'}],['#se-act',{l:'#se-stops'}]];
  [UI_GROUPS,UI_NAV_BASE.groups].forEach(a=>a.unshift(...G));[UI_LINKS,UI_NAV_BASE.links].forEach(a=>a.unshift(...L));
  [UI_DEFAULT,UI_NAV_BASE.def].forEach(d=>{d.season=['#se-stops .se-m.sel','#se-cards .se-card.cur','#se-cards .se-card'];});}
function seHead(){const d=seDays(),n=seNext(),R=seRoad(),k=n?R.findIndex(e=>e.s.id===n.e.s.id)+1:R.length;
  return `<section class="se-head"><p class="se-lab">${seEsc(SEASON.name)}${d==null?'':d<0?' · Season over':` · ${d} day${d===1?'':'s'} left`}</p><h2 class="se-t">${seEsc(SEASON.title)}</h2>
    <div class="se-bar"><b>${n?'Stop '+k:'All stops reached'}</b>${n?`<span class="se-xp"><i style="width:${Math.min(100,n.have/Math.max(1,n.of)*100).toFixed(1)}%"></i></span><small>${n.have.toLocaleString()} / ${n.of.toLocaleString()} XP</small>`:''}</div></section>`;}
function seRenderHome(w){
  const cards=SEASON.tiers.map((t,ti)=>{const st=t.stops.map((s,si)=>seState(ti,si)),got=st.filter(x=>x==='got').length,open=seTierOpen(ti),cur=open&&(ti===SEASON.tiers.length-1||!seTierOpen(ti+1));
    return `<button type="button" class="se-card${cur?' cur':''}${open?'':' se-shut'}" data-ti="${ti}"><span class="se-ch"><span><small>Tier ${ti+1}</small><b>${seEsc(t.name)}</b></span><em>${got} / ${t.stops.length}</em></span>
      <span class="se-mini">${seTierMap(ti,{W:440,H:250,mini:true,box:[40,30,400,220]})}</span>
      <span class="se-row">${t.stops.map((s,si)=>`<i class="se-dot se-${st[si]}${s.big?' se-epic':''}">${seIcon(s.reward)}</i>`).join('')}</span>
      <span class="se-cf"><small>${t.stops.length?seEsc(t.stops[0].city)+' → '+seEsc(t.stops[t.stops.length-1].city):''}</small><b>${!open?'Locked':st.some(x=>x==='now')?'Claim now':got===t.stops.length?'Done':'On the road'}</b></span></button>`;}).join('');
  w.innerHTML=`<div class="se-home">${seHead()}<div class="se-cards" id="se-cards">${cards}</div></div>`;
  w.querySelectorAll('.se-card').forEach(b=>b.onclick=()=>seOpen(+b.dataset.ti));}
function seRenderTier(w){
  const ti=SEV.tier,t=SEASON.tiers[ti];if(!t){SEV.view='home';return seRenderHome(w);}
  SEV.sel=Math.max(0,Math.min(t.stops.length-1,SEV.sel));
  const W=1600,H=758,st=t.stops.map((s,si)=>seState(ti,si)),got=st.filter(x=>x==='got').length;
  const f=seProj(t.stops.map(s=>[s.lon,s.lat]),seBox(ti,W,H,1)),xy=t.stops.map(s=>f(s.lon,s.lat));
  const headTop=seSide(ti)==='top';
  w.innerHTML=`<div class="se-tier"><div class="se-map" id="se-stops">${seTierMap(ti,{W,H,sel:SEV.sel,box:seBox(ti,W,H,1)})}</div><div class="se-fade"></div>
    <section class="se-th ${headTop?'top':'bottom'}"><p class="se-lab">${seEsc(SEASON.name)} · Tier ${ti+1} · ${got} / ${t.stops.length}</p><h2 class="se-t">${seEsc(t.name)}</h2>${seTierOpen(ti)&&seNext()?`<div class="se-bar"><b>Next stop</b><span class="se-xp"><i style="width:${Math.min(100,seNext().have/Math.max(1,seNext().of)*100).toFixed(1)}%"></i></span><small>${seNext().have.toLocaleString()} / ${seNext().of.toLocaleString()} XP</small></div>`:''}</section>
    <section class="se-det" id="se-det"></section></div>`;
  w.querySelectorAll('.se-m').forEach(b=>{b.onclick=()=>{const i=+b.dataset.si;if(SEV.sel===i&&seState(ti,i)==='now'){seClaim(ti,i);return;}seSel(i);};b.addEventListener('focus',()=>seSel(+b.dataset.si));});
  seDetail();}
function seSel(i){if(SEV.sel===i)return;SEV.sel=i;document.querySelectorAll('#se-stops .se-m').forEach(b=>b.classList.toggle('sel',+b.dataset.si===i));seDetail();}
function seDetail(){const el=$('#se-det');if(!el)return;const ti=SEV.tier,t=SEASON.tiers[ti],s=t&&t.stops[SEV.sel];if(!s){el.innerHTML='';return;}
  const S=seState(ti,SEV.sel),R=seRoad(),e=R.find(x=>x.s===s),last=ti===SEASON.tiers.length-1&&SEV.sel===t.stops.length-1;
  const need=S==='next'||S==='lock'?Math.max(0,e.need-SE.xp):0,r=s.reward;
  const act=S==='now'?`<button type="button" class="big go se-claim"><span class="glyph a">A</span>Claim</button>`:S==='got'?'<b class="se-ok">Claimed</b>':
    !seTierOpen(ti)?`<b class="se-need">Finish ${seEsc(SEASON.tiers[ti-1].name)}</b>`:`<b class="se-need">${need.toLocaleString()} XP to go</b>`;
  el.className='se-det'+(s.big?' se-epic':'');
  el.innerHTML=`<p class="se-lab">${seEsc(t.name)} · Stop ${SEV.sel+1} / ${t.stops.length}<i class="se-stadi">${SE_SVG.stad}</i></p><h3>${seEsc(s.city)}</h3>
    <div class="se-big">${seIcon(r)}${last?`<i class="se-cupb">${SE_SVG.cup}</i>`:''}</div>
    <div class="se-rw"><b>${seEsc(seRewardName(r))}</b><span class="se-tag${s.big?' se-epic':''}">${seEsc(r?SE_TYPE(r.type):'')}</span></div>
    <div class="se-act" id="se-act">${act}</div>`;
  const b=el.querySelector('.se-claim');if(b)b.onclick=()=>seClaim(ti,SEV.sel);}
function seOpen(ti){SEV.view='tier';SEV.tier=ti;const t=SEASON.tiers[ti];
  // pick the first stop to claim, else the next one, else the first
  const st=t.stops.map((s,si)=>seState(ti,si));let i=st.indexOf('now');if(i<0)i=st.indexOf('next');SEV.sel=Math.max(0,i);
  seRender();sfx('tock',14);seFocus('#se-stops .se-m.sel');}
function seHome(){const ti=SEV.tier;SEV.view='home';seRender();seFocus(`#se-cards .se-card[data-ti="${ti}"]`);}
function seFocus(sel){requestAnimationFrame(()=>{const b=$(sel);if(b&&typeof uiSet==='function'&&typeof UI!=='undefined'&&UI.layer){try{uiSet(b,{src:'silent'});}catch(e){}}});}
function seRender(){const w=$('#se-wrap');if(!w||hubTab!=='season')return;if(SEV.view==='tier')seRenderTier(w);else seRenderHome(w);}
function seDot(){const d=$('#season-dot');if(d)d.hidden=!(SEASON.on&&seCanClaim());}
function seShowTab(){const b=document.querySelector('.tab[data-tab="season"]');if(b)b.hidden=!SEASON.on;
  const i=TABS.indexOf('season');if(!SEASON.on&&i>=0)TABS.splice(i,1);else if(SEASON.on&&i<0)TABS.splice(1,0,'season');
  if(!SEASON.on&&hubTab==='season')setTab('play');seDot();}
seBuild();
{const base=setTab;setTab=function(t){const r=base.apply(this,arguments);if(t==='season'){SEV.view='home';seRender();}return r;};}
{const base=hubBack;hubBack=function(){if(hubTab==='season'&&SEV.view==='tier'){seHome();return true;}return base.apply(this,arguments);};}
{const base=uiConfirm;uiConfirm=function(){const c=typeof UI!=='undefined'&&UI.cur;if(c&&c.classList&&c.classList.contains('se-m')){c.click();return;}return base.apply(this,arguments);};}

/* ================= data file, Distal, tests ================= */
function applySeasonData(o){SEASON=cleanSeason(o);seSync();seShowTab();if(hubTab==='season')seRender();}
onDataFile('season',applySeasonData);
seSync();seShowTab();
// what Distal's Season editor needs (link.js D.seasonMeta)
function seasonMeta(){const C=o=>JSON.parse(JSON.stringify(o)),RT=chRewardTypes(),items={};
  Object.keys(RT).forEach(t=>{if(t==='card')items[t]=typeof CARDS!=='undefined'?CARDS.cards.map(c=>({id:c.id,name:c.title})):[];else if(t!=='hobby'&&t!=='pack')items[t]=typeof unlockItems==='function'?unlockItems(t):[];});
  return{defaults:C(cleanSeason(SEASON_DEF)),current:C(SEASON),rewards:RT,items,
    live:['hobby','pack','card',...(typeof CARD_PARTS!=='undefined'?CARD_PARTS:[]),...(typeof CARD_FREE!=='undefined'?CARD_FREE:[])],
    progress:{xp:SE.xp,claimed:Object.keys(SE.claimed),reached:seRoad().filter(seReached).map(e=>e.s.id)},
    cardItems:typeof CARDS!=='undefined'?CARDS.cards.filter(c=>c.unlock&&c.unlock.id).map(c=>({type:c.unlock.type,id:c.unlock.id,card:c.title})):[],
    chalItems:typeof CHAL!=='undefined'?CHAL.challenges.filter(c=>c.reward&&c.reward.id).map(c=>({type:c.reward.type,id:c.reward.id,name:c.name})):[]};}
function seasonAdmin(cmd,a,b){
  if(cmd==='xp')seGain(+a||0,'test');
  else if(cmd==='reset'){SE.xp=0;SE.claimed={};SE.seen={};saveSe();}
  else if(cmd==='claimall'){seRoad().forEach(e=>{if(seReached(e)&&!SE.claimed[e.s.id]&&sePay(e.s))SE.claimed[e.s.id]=Date.now();});saveSe();}
  else if(cmd==='show'){if($('#hub').hidden&&typeof openMenu==='function')openMenu();setTab('season');if(a!=null&&SEASON.tiers[a]){SEV.view='tier';SEV.tier=+a;SEV.sel=+b||0;}seRender();return true;}
  seDot();if(hubTab==='season')seRender();try{renderCustom();renderLook();}catch(e){}return true;}
{const box=document.createElement('div');box.className='cardbox';box.style.marginTop='12px';
  box.innerHTML='<p class="h">Season (this browser)</p><div class="seg"><button class="chip" type="button" data-se="xp">+1000 XP</button><button class="chip" type="button" data-se="claimall">Claim all reached</button><button class="chip" type="button" data-se="reset">Reset the season</button></div><p class="note" style="margin-top:8px">For testing. The road follows data/season.json (Distal &gt; Data &gt; Season).</p>';
  box.querySelectorAll('[data-se]').forEach(b=>b.onclick=()=>seasonAdmin(b.dataset.se,1000));
  const ed=$('#bal-edit');if(ed)ed.appendChild(box);}
