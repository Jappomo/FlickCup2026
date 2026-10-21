// Flick Cup 2026 · js/crest.js
// Your club's crest (My Club > Crest): a shield with its border, a pattern inside it and a charge (the symbol) on top.
// The shapes are white masks in models/crest.glb; the game paints them with the colours of data/crest.json
// (16 colours and 6 gradients, edited in Distal > Balancing > Crest). The AI clubs keep their hand-painted emblems.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= palette: data/crest.json ================= */
const CREST_DEF={version:1,
  colors:[['White','#f4f2ec'],['Black','#17161a'],['Red','#c8322a'],['Claret','#7b1e3a'],['Orange','#ec7a1c'],['Gold','#e2b23f'],['Yellow','#f2d33a'],['Lime','#8fd13b'],
    ['Green','#1f8a3e'],['Teal','#138a8a'],['Sky','#6fb7ea'],['Blue','#2459c4'],['Navy','#18264f'],['Purple','#5b2a9e'],['Pink','#e85a9c'],['Silver','#a9b0bb']].map(([name,hex])=>({name,hex})),
  gradients:[['Sunset','#ffb02e','#c8322a',90],['Ocean','#5cf2ea','#2459c4',90],['Gold','#fff1b0','#a87a22',135],['Fire','#f2d33a','#c8322a',180],['Forest','#8fd13b','#174f2a',90],['Night','#9a5cff','#12073f',135]].map(([name,a,b,angle])=>({name,a,b,angle})),
  start:{s:1,p:1,c:1,f:11,pc:0,b:5,cc:0}};
const CREST_SLOTS=[['f','Shield'],['pc','Pattern'],['b','Border'],['cc','Charge']];
let CREST=null;
function cleanCrest(o){o=o&&typeof o==='object'?o:{};const D=CREST_DEF;
  const hex=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)?v.toLowerCase():null,str=(v,n,d)=>typeof v==='string'&&v.trim()?v.replace(/[<>]/g,'').trim().slice(0,n):d;
  const colors=D.colors.map((d,i)=>{const x=(o.colors||[])[i]||{};return{name:str(x.name,16,d.name),hex:hex(x.hex)||d.hex};});
  const gradients=D.gradients.map((d,i)=>{const x=(o.gradients||[])[i]||{},a=Number(x.angle);return{name:str(x.name,16,d.name),a:hex(x.a)||d.a,b:hex(x.b)||d.b,angle:isFinite(a)?((Math.round(a)%360)+360)%360:d.angle};});
  return{version:1,colors,gradients,start:crestClean(o.start||D.start)};}
const CREST_N=()=>CREST_DEF.colors.length+CREST_DEF.gradients.length;
// a crest: shield s (1..), pattern p and charge c (0 = none), colour codes f / pc / b / cc (0-15 colours, 16-21 gradients)
function crestClean(c){c=c&&typeof c==='object'?c:{};const n=v=>Number.isInteger(+v)?+v:null,col=(v,d)=>{v=n(v);return v!=null&&v>=0&&v<CREST_N()?v:d;},D=CREST_DEF.start||{s:1,p:1,c:1,f:11,pc:0,b:5,cc:0};
  return{s:Math.max(1,Math.min(99,n(c.s)||D.s)),p:Math.max(0,Math.min(99,n(c.p)!=null?n(c.p):D.p)),c:Math.max(0,Math.min(99,n(c.c)!=null?n(c.c):D.c)),f:col(c.f,D.f),pc:col(c.pc,D.pc),b:col(c.b,D.b),cc:col(c.cc,D.cc)};}
const crestStr=c=>c?[c.s,c.p,c.c,c.f,c.pc,c.b,c.cc].join(','):'';
function crestParse(s){if(typeof s!=='string'||!s)return null;const a=s.split(',').map(Number);if(a.length!==7||!a.every(Number.isInteger))return null;return crestClean({s:a[0],p:a[1],c:a[2],f:a[3],pc:a[4],b:a[5],cc:a[6]});}
CREST=cleanCrest(null);

/* ================= the shapes: models/crest.glb ================= */
// Groups Shield, Pattern and Charge with one flat plane each: SM_Shield_###_Name (texture: R = inside, G = border,
// alpha = both), SM_Pattern_###_Name and SM_Charge_###_Name (white shape on transparent). All drawn on the same square.
const CREST_PARTS={Shield:[],Pattern:[],Charge:[],ready:false,gen:0};
function crestMask(img,ch){ // one channel (0 R, 1 G, 3 alpha) of an image as an alpha mask
  const w=img.width||img.naturalWidth,h=img.height||img.naturalHeight,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(img,0,0,w,h);
  if(ch===3)return c;const d=x.getImageData(0,0,w,h),p=d.data;for(let i=0;i<p.length;i+=4){const v=p[i+ch];p[i]=p[i+1]=p[i+2]=255;p[i+3]=v;}x.putImageData(d,0,0);return c;}
function applyCrestModel(sc,label){
  const out={Shield:[],Pattern:[],Charge:[]};
  sc.traverse(o=>{const m=/^SM_(Shield|Pattern|Charge)_(\d+)(?:_(.+))?$/i.exec(o.name||'');if(!m)return;let img=null;
    o.traverse(x=>{if(!img&&x.isMesh){const mt=Array.isArray(x.material)?x.material[0]:x.material;if(mt&&mt.map&&mt.map.image)img=mt.map.image;}});if(!img)return;
    const g=m[1][0].toUpperCase()+m[1].slice(1).toLowerCase(),e={n:+m[2],id:m[2],name:(m[3]||g+' '+m[2]).replace(/_/g,' ').trim(),img};
    if(g==='Shield'){e.fill=crestMask(img,0);e.border=crestMask(img,1);}else e.mask=crestMask(img,3);out[g].push(e);});
  ['Shield','Pattern','Charge'].forEach(g=>{out[g].sort((a,b)=>a.n-b.n);CREST_PARTS[g]=out[g];});
  if(!out.Shield.length)throw new Error('crest: no SM_Shield_###_Name found');
  CREST_PARTS.ready=true;CREST_PARTS.gen++;crestCache.clear();
  MODEL_INFO.crest={src:label,note:`${out.Shield.length} shields · ${out.Pattern.length} patterns · ${out.Charge.length} charges`};
  crestRefresh();}
APPLY.crest=applyCrestModel;MODEL_INFO.crest={src:'Built-in'};
loadModel('crest','models/crest.glb','crest.glb');
const crestPart=(g,n)=>CREST_PARTS[g].find(e=>e.n===n)||null;

/* ================= drawing ================= */
function crestPaint(x,code,size){const C=CREST||CREST_DEF,nc=C.colors.length;
  if(code<nc)return (C.colors[code]||C.colors[0]).hex;
  const g=C.gradients[code-nc]||C.gradients[0],a=(g.angle-90)*Math.PI/180,r=size/2,dx=Math.cos(a)*r,dy=Math.sin(a)*r;
  const lg=x.createLinearGradient(r-dx,r-dy,r+dx,r+dy);lg.addColorStop(0,g.a);lg.addColorStop(1,g.b);return lg;}
function crestTint(mask,code,size){const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');
  x.drawImage(mask,0,0,size,size);x.globalCompositeOperation='source-in';x.fillStyle=crestPaint(x,code,size);x.fillRect(0,0,size,size);return c;}
// the finished crest on a canvas (null until crest.glb has loaded)
function crestCanvas(c,size){if(!CREST_PARTS.ready)return null;c=crestClean(c);size=size||256;
  const S=crestPart('Shield',c.s)||CREST_PARTS.Shield[0],P=c.p?crestPart('Pattern',c.p):null,H=c.c?crestPart('Charge',c.c):null;
  const cv=document.createElement('canvas');cv.width=cv.height=size;const x=cv.getContext('2d');
  x.drawImage(crestTint(S.fill,c.f,size),0,0);
  if(P){const pl=crestTint(P.mask,c.pc,size),px=pl.getContext('2d');px.globalCompositeOperation='destination-in';px.drawImage(S.fill,0,0,size,size);x.drawImage(pl,0,0);}
  x.drawImage(crestTint(S.border,c.b,size),0,0);
  if(H)x.drawImage(crestTint(H.mask,c.cc,size),0,0);
  return cv;}
const crestCache=new Map();
function crestUrl(c,size){if(!CREST_PARTS.ready||!c)return '';size=size||256;const k=crestStr(c)+'@'+size+'#'+CREST_PARTS.gen;
  if(!crestCache.has(k)){const cv=crestCanvas(c,size);crestCache.set(k,cv?cv.toDataURL('image/png'):'');while(crestCache.size>160)crestCache.delete(crestCache.keys().next().value);}
  return crestCache.get(k);}
// a CSS swatch for a colour code
function crestSwatch(code){const C=CREST,nc=C.colors.length;if(code<nc)return C.colors[code].hex;const g=C.gradients[code-nc];return `linear-gradient(${g.angle}deg,${g.a},${g.b})`;}
const crestCodeName=code=>{const C=CREST,nc=C.colors.length;return code<nc?C.colors[code].name:C.gradients[code-nc].name+' (gradient)';};

/* ================= locks: Album cards can unlock crest parts (unlock type 'crest', ids like shield-003) ================= */
const crestPartId=(g,n)=>g.toLowerCase()+'-'+String(n).padStart(3,'0');
function crestLocked(g,n){return n&&typeof partLock==='function'?partLock('crest',crestPartId(g,n)):null;}
function crestItems(){return ['Shield','Pattern','Charge'].flatMap(g=>CREST_PARTS[g].map(e=>({id:crestPartId(g,e.n),name:g+': '+e.name})));}

/* ================= My Club > Crest ================= */
let crestTeam=0,crestSlot='f';
// a squad's crest (squads saved by core.js keep it as text until this file has loaded)
function crestOf(q){if(!q)return null;if(!q.crest&&q.crestRaw)q.crest=crestParse(q.crestRaw);return q.crest||null;}
const myCrest=t=>crestOf(mySquads[t])||(mySquads[t].crest=crestClean(CREST.start));
function crestSet(k,v){const q=mySquads[crestTeam];q.crest=crestClean(Object.assign({},myCrest(crestTeam),{[k]:v}));saveSquads();renderCrest();syncCrestBtn();sfx('tock',14);}
function renderCrest(){
  const el=$('#club-crest');if(!el||hubTab!=='squad'||clubSec!=='crest')return;const c=myCrest(crestTeam),q=mySquads[crestTeam];
  if(!CREST_PARTS.ready){el.innerHTML='<p class="note">Loading the crest shapes…</p>';return;}
  const esc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const lockTag=card=>card?`<span class="cr-lock" title="${esc(card.title)}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="2.5" width="14" height="19" rx="2.2" fill="#f6c443" stroke="#6b4a08" stroke-width="1.5"/></svg></span>`:'';
  const tile=(g,k,n,label)=>{const card=crestLocked(g,n),url=crestUrl(Object.assign({},c,{[k]:n}),112);
    return `<button class="cr-t${c[k]===n?' on':''}${card?' locked':''}" type="button" data-k="${k}" data-v="${n}" data-g="${g}" title="${esc(label)}${card?' · needs an Album card':''}" aria-pressed="${c[k]===n}"><img src="${url}" alt=""><small>${esc(label)}</small>${lockTag(card)}</button>`;};
  const row=(g,k,none)=>(none?tile(g,k,0,'None'):'')+CREST_PARTS[g].map(e=>tile(g,k,e.n,e.name)).join('');
  const nc=CREST.colors.length,codes=[...Array(CREST_N()).keys()];
  el.innerHTML=`<div class="cr-wrap">
    <div class="cr-left"><div class="cr-big"><img src="${crestUrl(c,320)}" alt="Your crest"></div>
      <h3>${esc(q.name||KITS[kitSel[crestTeam]].name)}</h3>
      <div class="seg" id="cr-team"><button class="chip" type="button" data-team="0" aria-pressed="${crestTeam===0}">Home squad</button><button class="chip" type="button" data-team="1" aria-pressed="${crestTeam===1}">Away squad</button></div>
      <div class="seg"><button class="chip" type="button" id="cr-rand">Surprise me</button><button class="chip" type="button" id="cr-kit">Kit colours</button></div>
      <p class="note">Your crest shows on the Kick-off screen and in your club history, and online your opponent sees it too.</p></div>
    <div class="cr-right">
      <div class="cardbox"><p class="h">Shield</p><div class="cr-row">${row('Shield','s',false)}</div></div>
      <div class="cardbox"><p class="h">Pattern</p><div class="cr-row">${row('Pattern','p',true)}</div></div>
      <div class="cardbox"><p class="h">Charge</p><div class="cr-row">${row('Charge','c',true)}</div></div>
      <div class="cardbox"><div class="cr-slots seg">${CREST_SLOTS.map(([k,l])=>`<button class="chip" type="button" data-slot="${k}" aria-pressed="${crestSlot===k}"><i style="background:${crestSwatch(c[k])}"></i>${l}</button>`).join('')}</div>
        <div class="cr-pal">${codes.map(i=>`<button class="cr-sw${c[crestSlot]===i?' on':''}${i>=nc?' grad':''}" type="button" data-col="${i}" title="${esc(crestCodeName(i))}" aria-label="${esc(crestCodeName(i))}" aria-pressed="${c[crestSlot]===i}" style="background:${crestSwatch(i)}"></button>`).join('')}</div></div>
    </div></div>`;
  el.querySelectorAll('.cr-t').forEach(b=>b.onclick=()=>{const card=crestLocked(b.dataset.g,+b.dataset.v);
    if(card){const C=colOf(card.collection);hobbyToast(`Needs the Album card "${card.title}" (${C.name} #${card.no}).`);sfx('clack',10);return;}crestSet(b.dataset.k,+b.dataset.v);});
  el.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{crestSlot=b.dataset.slot;renderCrest();});
  el.querySelectorAll('[data-col]').forEach(b=>b.onclick=()=>crestSet(crestSlot,+b.dataset.col));
  el.querySelectorAll('#cr-team [data-team]').forEach(b=>b.onclick=()=>{crestTeam=+b.dataset.team;renderCrest();});
  $('#cr-rand').onclick=()=>{const pick=(g,none)=>{const L=CREST_PARTS[g].filter(e=>!crestLocked(g,e.n)).map(e=>e.n);if(none)L.push(0);return L[Math.floor(Math.random()*L.length)]||0;};
    const cols=[...Array(CREST.colors.length).keys()],r=()=>cols[Math.floor(Math.random()*cols.length)];let f=r(),pc=r(),b=r(),cc=r();while(pc===f)pc=r();while(cc===f)cc=r();
    mySquads[crestTeam].crest=crestClean({s:pick('Shield')||1,p:pick('Pattern',true),c:pick('Charge',true),f,pc,b,cc});saveSquads();renderCrest();syncCrestBtn();sfx('tock',20);};
  $('#cr-kit').onclick=()=>{const k=myKit(crestTeam),near=hex=>{let bi=0,bd=1e9;CREST.colors.forEach((x,i)=>{const n=parseInt(x.hex.slice(1),16),d=Math.abs((n>>16)-(hex>>16))+Math.abs(((n>>8)&255)-((hex>>8)&255))+Math.abs((n&255)-(hex&255));if(d<bd){bd=d;bi=i;}});return bi;};
    const sh=near(k.shirt),so=near(k.shorts);mySquads[crestTeam].crest=crestClean(Object.assign({},c,{f:sh,pc:so===sh?near(k.socks):so,cc:so===sh?near(k.socks):so,b:5}));saveSquads();renderCrest();syncCrestBtn();sfx('tock',20);};
}
// the crest button in Tactics (squad name row) opens the editor
function syncCrestBtn(){const b=$('#sq-crest');if(!b)return;const u=crestUrl(myCrest(typeof sqTeam!=='undefined'?sqTeam:0),96);b.innerHTML=u?`<img src="${u}" alt="">`:'';}
$('#sq-crest').addEventListener('click',()=>{crestTeam=typeof sqTeam!=='undefined'?sqTeam:0;setClubSec('crest');sfx('tock',10);});
{const baseRS=renderSquad;renderSquad=function(){const r=baseRS.apply(this,arguments);try{syncCrestBtn();}catch(e){}return r;};}
// everything that shows a crest, once the shapes or the palette change
function crestRefresh(){crestCache.clear();try{syncCrestBtn();renderCrest();if(typeof koRender==='function'&&hubTab==='kickoff')koRender();if(typeof renderHistory==='function')renderHistory();if(hubTab==='album')renderAlbum();}catch(e){console.error('[crest]',e);}}
function applyCrestData(o){CREST=cleanCrest(o);crestRefresh();}
onDataFile('crest',applyCrestData);
// what Distal's Crest editor needs (link.js D.crestMeta)
function crestMeta(){const C=o=>JSON.parse(JSON.stringify(o));
  return{defaults:C(cleanCrest(null)),current:C(CREST),slots:C(CREST_SLOTS),ready:CREST_PARTS.ready,model:C(MODEL_INFO.crest||{}),
    parts:Object.fromEntries(['Shield','Pattern','Charge'].map(g=>[g,CREST_PARTS[g].map(e=>({n:e.n,name:e.name}))]))};}
// a crest drawn with a palette that is not applied yet (Distal previews)
function crestPreview(c,size,palette){const keep=CREST;try{if(palette)CREST=cleanCrest(palette);const cv=crestCanvas(c,size||128);return cv?cv.toDataURL('image/png'):'';}finally{CREST=keep;}}
