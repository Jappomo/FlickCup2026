// Flick Cup 2026 · js/album.js
// The Album: card collections (data/cards.json, edited in Distal > Balancing > Cards), packs after a match, duplicates
// to Hobby, and the items the cards unlock. The cards are one mesh in models/card.glb; each card's art is a glTF material
// variant of its front (KHR_materials_variants). A card without art shows a placeholder drawn here.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= data: data/cards.json ================= */
// What a card can unlock. The first five are game items the Album locks and unlocks today; the others are listed so
// cards can already point at them, and start locking when that part of the game exists.
const UNLOCK_TYPES={ball:'Ball',field:'Field',table:'Table',trinket:'Corner trinket',banner:'Border banner',
  music:'Music track',formation:'Formation',crest:'Crest part',moment:'Moment',pattern:'Kit pattern',celebration:'Goal celebration',challenge:'Pattern challenge'};
const CARD_PARTS=['ball','field','table','trinket','banner'];
// items without a price that a card locks until you find it: crest parts (js/crest.js) and kit patterns (js/kitpattern.js)
const CARD_FREE=['crest','pattern'];
const RARITY_KEYS=['common','uncommon','rare'];
const UNLOCK_RULES={free:'The card gives its item',shop:'The card lets you buy its item',off:'Cards do not lock items yet'};
// [id, name, description, colour, what its cards unlock, Hobby for a full page, trophy cabinet]
const COL_DEF=[
  ['moments','Football Moments','Famous moments from football history, drawn by hand.','#ff6a3d',['banner','music'],150],
  ['balls','Famous Balls','Match balls through the years.','#f6c443',['ball'],150],
  ['kits','Historic Kits','Legendary kits, redrawn as designs of their era.','#9a5cff',['pattern'],150],
  ['comebacks','Greatest Comebacks','Matches turned around against the odds.','#ff4fd8',['banner','music'],150],
  ['stadiums','Historic Stadiums','Famous grounds and the tables they inspired.','#2ef2ff',['table','field'],200],
  ['trophies','Trophies','Famous cups. Each one takes its place in your trophy cabinet.','#e2b94e',['trinket'],200,true],
  ['celebrations','Goal Celebrations','The best ways to celebrate a goal.','#4fd1a5',['celebration'],150],
  ['tricks','Iconic Tricks','Famous pieces of skill.','#7cc8ff',['moment'],150],
  ['formations','Famous Formations','Tactical set-ups that changed the game.','#b8c0d4',['formation'],150],
  ['patterns','Patterns of Play','Team moves to replay on the table.','#ffb02e',['challenge'],250],
];
// placeholder cards: [title, rarity, unlock type, unlock id]
const CARD_SEED={
  moments:[['Barefoot final, 1950s','common','banner','002'],['The long-range lob','common','banner','003'],['Last-minute header','uncommon','banner','004'],['Penalty under the snow','common','banner','005'],['The ghost goal','uncommon','music',''],['A captain lifts the cup','rare','banner','006']],
  balls:[['Leather lace-up, 1930s','common','ball','004'],['Brown panel ball, 1950s','common','ball','003'],['Black and white panels, 1970','uncommon','ball','002'],['The white ball of the 80s','common','ball','007'],['Thermal-bonded, 2000s','uncommon','ball','006'],['Golden final ball','rare','ball','005']],
  kits:[['Classic stripes','common','pattern','001'],['Hoops of the north','common','pattern','002'],['Halves and quarters','uncommon','pattern','003'],['The sash','common','pattern','004'],['Pinstripe away kit','uncommon','pattern','005'],['The golden era shirt','rare','pattern','007']],
  comebacks:[['Three down at half-time','rare','banner','007'],['Two goals in injury time','uncommon','banner','008'],['From the brink, away leg','common','banner','009'],['Ten men hold on','common','banner','010'],['The second-leg miracle','uncommon','banner','011'],['Extra-time turnaround','common','banner','012']],
  stadiums:[['The old wooden stand','common','table','002'],['Floodlights on the hill','uncommon','table','003'],['The great bowl','rare','table','004'],['Midnight pitch','common','field','002'],['The retro baize','common','field','003'],['Sunset at the coast','uncommon','field','004']],
  trophies:[['The big-eared cup','rare','trinket','003'],['The silver league plate','uncommon','trinket','002'],['The founders cup','common','trinket',''],['The continental shield','uncommon','trinket',''],['The winter cup','common','trinket',''],['The youth trophy','common','trinket','']],
  celebrations:[['The knee slide','common','celebration',''],['The corner-flag dance','common','celebration',''],['The cradle rock','uncommon','celebration',''],['The somersault','uncommon','celebration',''],['Shirt over the head','common','celebration',''],['The team pile-on','rare','celebration','']],
  tricks:[['Overhead kick, Turin, 2018','rare','moment','bicycle'],['The solo run past five','rare','moment','maradona'],['Curled into the top corner','uncommon','moment','finesse'],['The pass through the eye','uncommon','moment','thread'],['Cleared to the moon','common','moment','moon'],['The step-over','common','moment','']],
  formations:[['The pyramid','common','formation',''],['Two banks of four','common','formation','4-4-2'],['The diamond','uncommon','formation',''],['Three at the back','uncommon','formation','3-5-2'],['The total-football shape','rare','formation','4-3-3'],['The parked bus','common','formation','5-3-2']],
  patterns:[['The one-two','common','challenge',''],['The wall pass','common','challenge',''],['Overlap down the wing','uncommon','challenge',''],['Long switch, then cross','uncommon','challenge',''],['Counter in three flicks','rare','challenge',''],['The corner routine','common','challenge','']],
};
const TIPS={common:'Drops from any pack.',uncommon:'Drops from any pack, about one in four cards.',rare:'Rare: about one in twenty cards. Win to open bigger packs.'};
const CARDS_DEF={version:1,unlockRule:'free',
  rarities:{common:{name:'Common',weight:70,dupe:10,color:'#b8c0d4'},uncommon:{name:'Uncommon',weight:25,dupe:25,color:'#4fd1a5'},rare:{name:'Rare',weight:5,dupe:60,color:'#f6c443'}},
  packs:{win:3,draw:2,lose:1,welcome:1},
  collections:COL_DEF.map(([id,name,desc,color,unlocks,reward,cabinet])=>({id,name,desc,color,unlocks,reward,cabinet:!!cabinet})),
  cards:[]};
COL_DEF.forEach(([cid])=>(CARD_SEED[cid]||[]).forEach(([title,rarity,type,uid],i)=>CARDS_DEF.cards.push({id:cid+'-'+String(i+1).padStart(2,'0'),collection:cid,no:i+1,title,rarity,
  desc:'Placeholder card: the hand-drawn art comes later.',tip:TIPS[rarity],unlock:{type,id:uid},art:'',drop:true})));
let CARDS=null;
// the game's own clean-up of data/cards.json (Distal uses the same through the link)
function cleanCards(o){
  o=o&&typeof o==='object'?o:{};const D=CARDS_DEF;
  const str=(v,n,d)=>typeof v==='string'?v.replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,n):d;
  const num=(v,lo,hi,d)=>{v=Number(v);return isFinite(v)?Math.max(lo,Math.min(hi,v)):d;};
  const col=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)?v.toLowerCase():null;
  const out={version:1,unlockRule:UNLOCK_RULES[o.unlockRule]?o.unlockRule:D.unlockRule,rarities:{},packs:{},collections:[],cards:[]};
  RARITY_KEYS.forEach(k=>{const x=(o.rarities||{})[k]||{},d=D.rarities[k];out.rarities[k]={name:str(x.name,16,d.name)||d.name,weight:num(x.weight,0,1000,d.weight),dupe:Math.round(num(x.dupe,0,100000,d.dupe)),color:col(x.color)||d.color};});
  if(!RARITY_KEYS.some(k=>out.rarities[k].weight>0))out.rarities.common.weight=1;
  Object.keys(D.packs).forEach(k=>out.packs[k]=Math.round(num((o.packs||{})[k],0,10,D.packs[k])));
  const cols=Array.isArray(o.collections)?o.collections:D.collections,seen=new Set();
  cols.forEach((c,i)=>{if(!c||typeof c!=='object')return;let id=str(c.id,24,'').toLowerCase().replace(/[^a-z0-9_-]/g,'');if(!id||seen.has(id))id='col'+(i+1);if(seen.has(id))return;seen.add(id);
    const un=(Array.isArray(c.unlocks)?c.unlocks:[]).filter(t=>UNLOCK_TYPES[t]);
    out.collections.push({id,name:str(c.name,32,'')||id,desc:str(c.desc,160,''),color:col(c.color)||'#9a5cff',unlocks:[...new Set(un)],reward:Math.round(num(c.reward,0,100000,0)),cabinet:!!c.cabinet});});
  if(!out.collections.length)out.collections=JSON.parse(JSON.stringify(D.collections));
  const cards=Array.isArray(o.cards)?o.cards:(Array.isArray(o.collections)?[]:D.cards),ids=new Set();
  cards.forEach((c,i)=>{if(!c||typeof c!=='object')return;let id=str(c.id,32,'').replace(/[^A-Za-z0-9_-]/g,'');if(!id||ids.has(id))id='card'+(i+1);if(ids.has(id))return;
    const cl=out.collections.find(x=>x.id===c.collection)||out.collections[0];ids.add(id);
    const u=c.unlock&&typeof c.unlock==='object'&&UNLOCK_TYPES[c.unlock.type]?{type:c.unlock.type,id:str(String(c.unlock.id==null?'':c.unlock.id),40,'')}:null;
    out.cards.push({id,collection:cl.id,no:Math.round(num(c.no,1,999,1)),title:str(c.title,48,'')||'Untitled card',rarity:RARITY_KEYS.includes(c.rarity)?c.rarity:'common',
      desc:str(c.desc,240,''),tip:str(c.tip,160,''),unlock:u&&(u.id||u.type)?u:null,art:str(c.art,64,'').replace(/[^A-Za-z0-9_]/g,''),drop:c.drop!==false});});
  out.cards.sort((a,b)=>out.collections.findIndex(x=>x.id===a.collection)-out.collections.findIndex(x=>x.id===b.collection)||a.no-b.no);
  return out;
}
CARDS=cleanCards(CARDS_DEF);
const colOf=id=>CARDS.collections.find(c=>c.id===id)||CARDS.collections[0];
const cardById=id=>CARDS.cards.find(c=>c.id===id)||null;
const colCards=cid=>CARDS.cards.filter(c=>c.collection===cid);

/* ================= save: what you own ================= */
// baize.album: {v, cards:{id:count}, fresh:{id:1} (not looked at yet), packs:[sizes] (to open), done:{collection:1} (page reward paid), welcome}
const ALBUM=(()=>{let a=null;try{a=JSON.parse(store.get('baize.album')||'null');}catch(e){}
  if(!a||typeof a!=='object'||a.v!==1)a={v:1,cards:{},fresh:{},packs:[],done:{},welcome:false};
  ['cards','fresh','done'].forEach(k=>{if(!a[k]||typeof a[k]!=='object')a[k]={};});if(!Array.isArray(a.packs))a.packs=[];a.packs=a.packs.map(n=>Math.max(1,Math.min(10,n|0))).slice(0,50);return a;})();
function saveAlbum(){store.set('baize.album',JSON.stringify(ALBUM));albumDot();}
const hasCard=id=>(ALBUM.cards[id]||0)>0;
function albumDot(){const d=$('#album-dot');if(d)d.hidden=!(ALBUM.packs.length||Object.keys(ALBUM.fresh).some(id=>cardById(id)));}

/* ================= unlocks: cards lock and unlock game items ================= */
// a crest part or kit pattern still waiting for its card (null: free, or you have the card)
function partLock(type,id){if(CARDS.unlockRule==='off'||!ecoOn()||!id)return null;const c=cardFor(type,id);return c&&!hasCard(c.id)?c:null;}
function cardFor(type,id){if(id==null||id==='')return null;return CARDS.cards.find(c=>c.unlock&&c.unlock.type===type&&c.unlock.id===String(id))||null;}
// the card an item still needs (null when it does not need one, or you have it in the way the rule asks)
function cardLock(part,id){
  if(CARDS.unlockRule==='off'||!CARD_PARTS.includes(part)||!ecoOn()||!id||id===firstId(part))return null;
  const c=cardFor(part,id);if(!c||(OWNED[part]||[]).includes(id))return null;
  return hasCard(c.id)?null:c;}
{const baseOwns=owns,baseBuy=buy;
  owns=function(part,id){
    if(CARDS.unlockRule==='off'||!CARD_PARTS.includes(part)||!ecoOn()||!id||id===firstId(part))return baseOwns(part,id);
    const c=cardFor(part,id);if(!c)return baseOwns(part,id);
    if((OWNED[part]||[]).includes(id))return true;
    return CARDS.unlockRule==='free'?hasCard(c.id):false;};
  buy=function(part,id){const c=cardLock(part,id);
    if(c){const C=colOf(c.collection);hobbyToast(`Needs the Album card "${c.title}" (${C.name} #${c.no}).`);sfx('clack',10);return false;}
    return baseBuy(part,id);};}
// what the card unlocks, in words, and whether the game has it
function unlockInfo(c){const u=c&&c.unlock;if(!u)return null;const L=unlockItems(u.type),it=L.find(x=>x.id===u.id);
  return{type:u.type,id:u.id,label:UNLOCK_TYPES[u.type],name:it?it.name:(u.id?u.id:'to be decided'),exists:!!it,live:CARD_PARTS.includes(u.type)||CARD_FREE.includes(u.type)};}
// the game items of one unlock type (for the card detail and for Distal's picker)
function unlockItems(type){
  try{
    if(type==='ball')return BALL.variants.map(v=>({id:v.id,name:v.name}));
    if(LOOK_PARTS.includes(type))return (LOOK[type]||[]).map(v=>({id:v.id,name:v.name}));
    if(type==='music')return TRACKS.map(t=>({id:String(t.id),name:t.title+(t.alt?' ('+t.alt+')':'')+(t.artist?' - '+t.artist:'')}));
    if(type==='formation')return Object.keys(FORMATIONS).map(k=>({id:k,name:k}));
    if(type==='crest'&&typeof crestItems==='function')return crestItems();
    if(type==='pattern'&&typeof kitPatternItems==='function')return kitPatternItems();
    if(type==='moment')return Object.entries(SPECIALS).map(([k,v])=>({id:k,name:v.name}));
  }catch(e){}
  return [];}
// a card you just got: page reward and unlock message
function cardGained(c,first){
  if(!first)return;const u=unlockInfo(c);
  if(u&&u.live&&u.exists&&CARDS.unlockRule==='free'&&ecoOn())setTimeout(()=>hobbyToast(`Unlocked: ${u.name} (${u.label.toLowerCase()})`,true),400);
  const C=colOf(c.collection),all=colCards(C.id);
  if(all.length&&all.every(x=>hasCard(x.id))&&!ALBUM.done[C.id]){ALBUM.done[C.id]=1;saveAlbum();if(C.reward)setTimeout(()=>earn(C.reward,`${C.name} complete`),1200);}
}
function giveCard(id){const c=cardById(id);if(!c)return null;const first=!hasCard(id);ALBUM.cards[id]=(ALBUM.cards[id]||0)+1;if(first)ALBUM.fresh[id]=1;saveAlbum();cardGained(c,first);return{card:c,first};}
// duplicates: destroy one for Hobby (value by rarity)
function dupeValue(c){return (CARDS.rarities[c.rarity]||{}).dupe||0;}
function destroyDupe(id){const c=cardById(id);if(!c||(ALBUM.cards[id]||0)<2)return false;ALBUM.cards[id]--;saveAlbum();const v=dupeValue(c);if(v)earn(v,'Duplicate traded');else hobbyToast('Duplicate removed.');sfx('tock',20);return true;}

/* ================= packs ================= */
function drawCard(){
  const pool=CARDS.cards.filter(c=>c.drop);if(!pool.length)return null;
  const R=RARITY_KEYS.filter(k=>CARDS.rarities[k].weight>0&&pool.some(c=>c.rarity===k));if(!R.length)return pool[Math.floor(Math.random()*pool.length)];
  let t=Math.random()*R.reduce((a,k)=>a+CARDS.rarities[k].weight,0),r=R[R.length-1];for(const k of R){t-=CARDS.rarities[k].weight;if(t<0){r=k;break;}}
  const L=pool.filter(c=>c.rarity===r);return L[Math.floor(Math.random()*L.length)];}
function addPack(n){n=Math.max(1,Math.min(10,n|0));ALBUM.packs.push(n);if(ALBUM.packs.length>50)ALBUM.packs.shift();saveAlbum();if(hubTab==='album')renderAlbum();}
if(!ALBUM.welcome){ALBUM.welcome=true;if(CARDS_DEF.packs.welcome)ALBUM.packs.push(CARDS_DEF.packs.welcome);saveAlbum();}
// the pack screen: the cards face down, turn them one by one (or all), then they are in the Album
const PACK={open:false,cards:[],shown:0};
function openPack(){
  if(PACK.open||!ALBUM.packs.length)return false;
  const n=ALBUM.packs.shift();PACK.cards=[];for(let i=0;i<n;i++){const c=drawCard();if(!c)break;const g=giveCard(c.id);PACK.cards.push(g);}
  saveAlbum();if(!PACK.cards.length){hobbyToast('There are no cards in the Album yet.');return false;}
  PACK.open=true;PACK.shown=0;ensureAudio();sfx('tock',30);try{PACK.pad=[...navigator.getGamepads()].filter(Boolean).map(g=>g.buttons.map(x=>x.pressed))[0]||null;}catch(e){}requestAnimationFrame(packPad);
  const row=$('#pack-row');row.innerHTML='';
  PACK.cards.forEach((g,i)=>{const c=g.card,R=CARDS.rarities[c.rarity],b=document.createElement('button');b.type='button';b.className='pk r-'+c.rarity;b.style.setProperty('--rc',R.color);b.style.setProperty('--cc',colOf(c.collection).color);
    b.innerHTML=`<span class="pk-in"><span class="pk-back"></span><span class="pk-front"><img alt="" src="${cardArtUrl(c)}"><b>${albEsc(c.title)}</b><small>${albEsc(R.name)} · ${g.first?'<em>New</em>':'Duplicate'}</small></span></span>`;
    b.onclick=()=>packTurn(i);row.appendChild(b);});
  $('#pack-title').textContent=PACK.cards.length===1?'One card':PACK.cards.length+' cards';$('#pack-note').textContent='Tap a card to turn it over.';
  $('#pack').hidden=false;$('#pack-all').hidden=false;setTimeout(()=>{const f=$('#pack-row .pk');if(f)f.focus();},50);
  if(hubTab==='album')renderAlbum();albumDot();return true;}
function packTurn(i){const b=$('#pack-row').children[i];if(!b||b.classList.contains('on'))return;b.classList.add('on');PACK.shown++;
  const g=PACK.cards[i];sfx(g.card.rarity==='rare'?'moment':'tock',22);if(g.card.rarity==='rare')rumble(0.5,200);
  if(PACK.shown>=PACK.cards.length){$('#pack-all').hidden=true;const nw=PACK.cards.filter(x=>x.first).length;$('#pack-note').textContent=nw?`${nw} new for your Album.`:'All duplicates: trade them for Hobby in the Album.';const d=$('#pack-done');if(d)d.focus();}}
function packAll(){PACK.cards.forEach((_,i)=>setTimeout(()=>packTurn(i),i*160));}
function packDone(){if(!PACK.open)return;for(let i=0;i<PACK.cards.length;i++)packTurn(i);PACK.open=false;$('#pack').hidden=true;const ft=$('#btn-ft-pack');if(ft)ftPackBtn();if(hubTab==='album')renderAlbum();}
$('#pack-all').addEventListener('click',packAll);
// controller on the pack screen: A turns the next card (then Done), X turns all, B is Done
function packPad(){if(!PACK.open)return;let gp=null;try{gp=[...navigator.getGamepads()].find(g=>g&&g.connected);}catch(e){}
  if(gp){const p=gp.buttons.map(x=>x.pressed),o=PACK.pad||p;const ed=i=>p[i]&&!o[i];PACK.pad=p;
    if(ed(0)){const i=[...$('#pack-row').children].findIndex(b=>!b.classList.contains('on'));if(i>=0)packTurn(i);else packDone();}
    else if(ed(2))packAll();else if(ed(1))packDone();}
  requestAnimationFrame(packPad);}
$('#pack-done').addEventListener('click',packDone);
addEventListener('keydown',e=>{if(!PACK.open)return;if(e.key==='Escape'){packDone();e.preventDefault();e.stopPropagation();}
  else if(e.key==='Enter'||e.key===' '){const i=[...$('#pack-row').children].findIndex(b=>!b.classList.contains('on'));if(i>=0){packTurn(i);e.preventDefault();e.stopPropagation();}else if(document.activeElement===document.body){packDone();e.preventDefault();}}},true);
// a pack after a Solo match: bigger for a better result (nothing for a conceded match, the tutorial or practice)
function ftPackBtn(){const b=$('#btn-ft-pack');b.hidden=!ALBUM.packs.length;b.textContent=ALBUM.packs.length>1?`Open pack (${ALBUM.packs.length})`:'Open pack';}
$('#btn-ft-pack').addEventListener('click',openPack);
{const baseFT=showFT;showFT=function(){baseFT();
  try{const a=S.score[0],b=S.score[1];
    if(S.mode==='cpu'&&!S.tour&&!S.packPaid&&!S.conceded){S.packPaid=true;const me=1-cpuTeam,res=a===b?'draw':S.score[me]>S.score[1-me]?'win':'lose',n=CARDS.packs[res];
      if(n>0){addPack(n);const el=$('#ft-note');el.textContent=(el.textContent?el.textContent+' · ':'')+`+1 card pack (${n} card${n>1?'s':''})`;}}
    ftPackBtn();}catch(e){console.error('[album]',e);}};
  const baseNM=newMatch;newMatch=function(o){S.packPaid=false;return baseNM(o);};}

/* ================= card art: models/card.glb ================= */
// SM_Card_###: the card mesh (the lowest number is used). M_Card_Front shows the art; every KHR_materials_variants
// variant (or a material named M_Card_###...) is one card's art, by name. No file: a plain box stands in.
const CARD3D={node:null,front:null,art:{},list:[]};
function applyCardModel(scene3,label,g){
  const vs=[];scene3.traverse(o=>{const m=/^SM_Card_(\d+)(?:_(.+))?$/i.exec(o.name||'');if(m)vs.push({id:m[1],node:o});});
  if(!vs.length)throw new Error('card: no SM_Card_###_Name found');
  vs.sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));
  CARD3D.node=vs[0].node;CARD3D.front=null;CARD3D.node.traverse(o=>{if(o.isMesh)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(/Card_Front/i.test(m.name||''))CARD3D.front=m;});});
  CARD3D.art={};CARD3D.list=[];
  const J=g&&g.parser&&g.parser.json||{},P=g&&g.parser,found=new Map();
  const vx=J.extensions&&J.extensions.KHR_materials_variants,names=vx&&Array.isArray(vx.variants)?vx.variants.map(v=>v.name):[];
  const fi=(J.materials||[]).findIndex(m=>/Card_Front/i.test(m.name||''));
  (J.meshes||[]).forEach(me=>(me.primitives||[]).forEach(pr=>{if(fi>=0&&pr.material!==fi)return;const L=pr.extensions&&pr.extensions.KHR_materials_variants;(L&&L.mappings||[]).forEach(m=>(m.variants||[]).forEach(vi=>{if(names[vi]&&!found.has(names[vi]))found.set(names[vi],m.material);}));}));
  (J.materials||[]).forEach((m,i)=>{const k=/^M_(Card_\d+.*)$/.exec(m.name||'');if(k&&!found.has(k[1]))found.set(k[1],i);});
  const jobs=[...found].map(([name,mi])=>P.getDependency('material',mi).then(m=>{const img=m&&m.map&&m.map.image;CARD3D.art[name]={mat:m,url:img?artPic(img):''};}).catch(()=>{}));
  MODEL_INFO.card={src:label,note:`card mesh ${vs[0].node.name} · ${found.size} card art${found.size===1?'':'s'}`};
  Promise.all(jobs).then(()=>{CARD3D.list=[...found.keys()].filter(n=>CARD3D.art[n]);artCache.clear();if(hubTab==='album')renderAlbum();});
}
APPLY.card=applyCardModel;MODEL_INFO.card={src:'Built-in'};
{const baseReset=resetModel;resetModel=function(kind){if(kind==='card'){CARD3D.node=null;CARD3D.front=null;CARD3D.art={};CARD3D.list=[];artCache.clear();if(hubTab==='album')renderAlbum();}return baseReset(kind);};}
loadModel('card','models/card.glb','card.glb');
// art picture for menus (the variant's texture, or a placeholder) as a data URL
function artPic(img){try{const w0=img.width||img.naturalWidth,h0=img.height||img.naturalHeight;if(!w0||!h0)return '';const s=Math.min(1,360/w0),c=document.createElement('canvas');c.width=Math.round(w0*s);c.height=Math.round(h0*s);c.getContext('2d').drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/jpeg',0.88);}catch(e){return '';}}
const artCache=new Map();
function cardArtUrl(c){const a=c.art&&CARD3D.art[c.art];if(a&&a.url)return a.url;
  const k=c.id+'|'+c.title+'|'+c.rarity+'|'+c.collection+'|'+c.no;if(!artCache.has(k))artCache.set(k,cardPlaceholder(c).toDataURL('image/png'));return artCache.get(k);}
// placeholder art: the collection's colour, number, title and what the card is
function cardPlaceholder(c,w){w=w||360;const h=Math.round(w*88/63),cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d'),C=colOf(c.collection),R=CARDS.rarities[c.rarity],u=w/360;
  const gr=x.createLinearGradient(0,0,w,h);gr.addColorStop(0,C.color);gr.addColorStop(1,'#1a0b52');x.fillStyle=gr;x.fillRect(0,0,w,h);
  x.globalAlpha=0.12;x.strokeStyle='#fff';x.lineWidth=10*u;for(let k=-h;k<w;k+=34*u){x.beginPath();x.moveTo(k,0);x.lineTo(k+h,h);x.stroke();}x.globalAlpha=1;
  x.strokeStyle=R.color;x.lineWidth=10*u;x.strokeRect(9*u,9*u,w-18*u,h-18*u);
  x.fillStyle='rgba(10,4,38,.55)';x.fillRect(24*u,70*u,w-48*u,h-170*u);
  x.textAlign='left';x.textBaseline='alphabetic';x.fillStyle='#fff';x.font=`900 ${44*u}px system-ui,Arial,sans-serif`;x.fillText('#'+String(c.no).padStart(2,'0'),26*u,56*u);
  x.textAlign='right';x.font=`700 ${15*u}px system-ui,Arial,sans-serif`;x.fillStyle=R.color;x.fillText(R.name.toUpperCase(),w-26*u,50*u);
  x.textAlign='center';x.fillStyle='rgba(255,255,255,.9)';x.font=`800 ${15*u}px system-ui,Arial,sans-serif`;x.fillText(C.name.toUpperCase(),w/2,104*u);
  x.font=`900 ${110*u}px system-ui,Arial,sans-serif`;x.fillStyle='rgba(255,255,255,.14)';x.fillText(C.name[0]||'?',w/2,250*u);
  x.fillStyle='#fff';x.font=`800 ${26*u}px system-ui,Arial,sans-serif`;
  const words=c.title.split(/\s+/),lines=[];let ln='';words.forEach(wd=>{const t=ln?ln+' '+wd:wd;if(x.measureText(t).width>w-70*u&&ln){lines.push(ln);ln=wd;}else ln=t;});if(ln)lines.push(ln);
  lines.slice(0,4).forEach((l,i)=>x.fillText(l,w/2,(300+i*32)*u));
  const ui=unlockInfo(c);x.font=`600 ${14*u}px system-ui,Arial,sans-serif`;x.fillStyle='rgba(255,255,255,.75)';if(ui)x.fillText('Unlocks: '+ui.label.toLowerCase()+(ui.exists?' · '+ui.name:''),w/2,(h-118*u));
  x.fillStyle='rgba(0,0,0,.45)';x.fillRect(0,h-78*u,w,44*u);x.fillStyle='#fff';x.font=`800 ${15*u}px system-ui,Arial,sans-serif`;x.fillText('PLACEHOLDER ART',w/2,h-50*u);
  return cv;}

/* ================= Album page ================= */
const albEsc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const AL={col:'',sel:''};
function renderAlbum(){
  if(hubTab!=='album')return;
  if(!CARDS.collections.some(c=>c.id===AL.col))AL.col=CARDS.collections[0].id;
  const C=colOf(AL.col),cards=colCards(C.id);
  if(!cards.some(c=>c.id===AL.sel))AL.sel=(cards[0]||{}).id||'';
  $('#al-sub').innerHTML='<span class="glyph sg" aria-hidden="true">LT</span>'+CARDS.collections.map(k=>{const L=colCards(k.id),n=L.filter(c=>hasCard(c.id)).length,nw=L.some(c=>ALBUM.fresh[c.id]);
    return `<button class="chip" data-col="${k.id}" aria-pressed="${k.id===C.id}" style="--cc:${k.color}"><i class="al-cdot"></i>${albEsc(k.name)} <small>${n}/${L.length}</small>${nw?'<i class="al-new"></i>':''}</button>`;}).join('')+'<span class="glyph sg" aria-hidden="true">RT</span>';
  $('#al-sub').querySelectorAll('[data-col]').forEach(b=>b.onclick=()=>{AL.col=b.dataset.col;AL.sel='';renderAlbum();sfx('tock',8);});
  $('#al-cname').textContent=C.name;$('#al-cdesc').textContent=C.desc+(C.reward?` Fill the page: +${C.reward} Hobby${ALBUM.done[C.id]?' (done)':''}.`:'');
  const have=cards.filter(c=>hasCard(c.id)).length;$('#al-prog').innerHTML=`<b>${have}</b> / ${cards.length}<i style="--p:${cards.length?have/cards.length*100:0}%;--cc:${C.color}"></i>`;
  const page=$('#al-page');page.style.setProperty('--cc',C.color);page.innerHTML='';
  cards.forEach(c=>{const n=ALBUM.cards[c.id]||0,R=CARDS.rarities[c.rarity],b=document.createElement('button');b.type='button';b.className='acard r-'+c.rarity+(n?'':' miss');b.style.setProperty('--rc',R.color);b.setAttribute('aria-pressed',String(c.id===AL.sel));
    b.innerHTML=n?`<img alt="" src="${cardArtUrl(c)}">${c.art&&CARD3D.art[c.art]?`<span class="ac-no">#${String(c.no).padStart(2,'0')}</span>`:''}<b>${albEsc(c.title)}</b>${n>1?`<span class="ac-dup">×${n}</span>`:''}${ALBUM.fresh[c.id]?'<span class="ac-new">New</span>':''}`
      :`<span class="ac-slot">#${String(c.no).padStart(2,'0')}</span><b>${albEsc(c.title)}</b><small>${albEsc(c.tip||R.name)}</small>`;
    b.title=c.title+(n?'':' · not found yet');b.onclick=()=>{AL.sel=c.id;renderAlbum();sfx('tock',6);};page.appendChild(b);});
  if(!cards.length)page.innerHTML='<p class="note">No cards in this collection yet.</p>';
  const tot=CARDS.cards.length,own=CARDS.cards.filter(c=>hasCard(c.id)).length;
  $('#al-total').textContent=`${own} of ${tot} cards`+(ALBUM.packs.length?` · ${ALBUM.packs.length} pack${ALBUM.packs.length>1?'s':''} to open`:' · win matches for more packs');
  const ob=$('#al-open');ob.disabled=!ALBUM.packs.length;$('#al-open-lbl').textContent=ALBUM.packs.length?`Open pack (${ALBUM.packs[0]} card${ALBUM.packs[0]>1?'s':''})`:'No packs to open';
  renderCardInfo();albumDot();
}
function renderCardInfo(){
  const c=cardById(AL.sel),box=$('#al-info');if(!c){box.innerHTML='';albumPreviewBuild();return;}
  const n=ALBUM.cards[c.id]||0,R=CARDS.rarities[c.rarity],C=colOf(c.collection),u=unlockInfo(c);
  if(ALBUM.fresh[c.id]){delete ALBUM.fresh[c.id];saveAlbum();}
  let un='';if(u){const free=CARD_FREE.includes(u.type),live=u.live&&u.exists,own=live&&(free?!partLock(u.type,u.id):owns(u.type,u.id)),lock=live&&(free?partLock(u.type,u.id):cardLock(u.type,u.id));
    un=`<div class="al-un"><span class="h">Unlocks</span><b>${albEsc(u.label)}: ${albEsc(u.name)}</b><small>${!u.live?'Coming to the game later.':!u.exists?'Not in the game files yet.':own?(u.type==='crest'?'Yours: use it in My Club > Crest.':u.type==='pattern'?'Yours: use it in My Club > Kit look.':'Yours: equip it in The Ground.'):CARDS.unlockRule==='shop'&&n?'Now in the shop: buy it in The Ground.':CARDS.unlockRule==='off'?'Cards do not lock items yet.':lock?'Get this card to unlock it.':''}</small>${live&&(own||(CARDS.unlockRule==='shop'&&n&&!free))?`<button class="chip" type="button" id="al-equip">${own?(free?'Use it':'Equip'):'Go to the shop'}</button>`:''}</div>`;}
  box.innerHTML=`<p class="al-rar" style="--rc:${R.color}">${albEsc(R.name)}</p><h3>${albEsc(c.title)}</h3><p class="note">${albEsc(C.name)} · #${c.no}${n>1?` · you have ${n}`:''}</p>`+
    (n?`<p class="al-desc">${albEsc(c.desc||'')}</p>`:`<p class="al-desc">Not in your Album yet.</p>`)+
    `<div class="al-tip"><span class="h">How to get it</span><p>${albEsc(c.tip||'Drops from packs.')}${c.drop?'':' Not in packs.'}</p></div>`+un+
    (n>1?`<button class="chip al-dupe" type="button" id="al-dupe">Trade a duplicate · ${coinTag(dupeValue(c))}</button>`:'');
  const eq=$('#al-equip');if(eq)eq.onclick=()=>albumEquip(c);
  const du=$('#al-dupe');if(du)du.onclick=()=>{if(destroyDupe(c.id))renderAlbum();};
  albumPreviewBuild();
}
// tapping the item a card unlocks jumps to it in The Ground and equips it when it is yours
function albumEquip(c){const u=c.unlock;if(!u)return;
  if(u.type==='crest'){const [g,n]=u.id.split('-'),k={shield:'s',pattern:'p',charge:'c'}[g];setTab('squad');crestTeam=0;if(k&&!partLock('crest',u.id)){mySquads[0].crest=crestClean(Object.assign({},myCrest(0),{[k]:+n}));saveSquads();}setClubSec('crest');return;}
  if(u.type==='pattern'){setTab('squad');kitTeam=0;if(!partLock('pattern',u.id)){const q=mySquads[0];q.look=Object.assign({},kitLookFull(q,0),{pt:u.id});q.useLook=true;saveSquads();if(!S.running)applyKits();renderKits();}setClubSec('kit');return;}
  if(!CARD_PARTS.includes(u.type))return;
  setTab('custom');
  if(u.type==='ball'){setCustSec('ball');custSel=u.id;if(owns('ball',u.id)){BALL.mine=u.id;store.set('baize.ball',u.id);showBall();sfx('tock',30);}renderCustom();}
  else{setCustSec('table');if(owns(u.type,u.id)){LOOKSEL[u.type]=u.id;saveLook();showLook();sfx('tock',30);}else lookPend={part:u.type,id:u.id};renderLook();}}
$('#al-open').addEventListener('click',openPack);

/* ---------- the 3D card in the Album ---------- */
let aScene=null,aCam=null,aObj=null,aR=null;const aSpin={a:0.35,v:0,drag:false,x:0};
const aTex=new Map();
PREVIEW_CAMS.album={pos:[0,0.05,4.4],look:[0,0,0],fov:30};PREVIEW_CAMS_DEF.album=JSON.parse(JSON.stringify(PREVIEW_CAMS.album));
// data/scene.json scenes.album.objects (lights and the card, set in Distal's Card scene); the camera is applied by data.js
{const baseScene=applySceneData;applySceneData=function(prev){baseScene(prev);
  try{if(!aScene)return;const O=(((SCENE_DATA||{}).scenes||{}).album||{}).objects||{},PO=(((prev||{}).scenes||{}).album||{}).objects||{};
    new Set([...Object.keys(O),...Object.keys(PO)]).forEach(k=>{const o=sceneFind(k,aScene);if(o)applySceneObject(o,O[k]);});}catch(e){console.error('[album scene]',e);}};}
function initAlbumPreview(){if(aScene)return true;try{const cv=$('#al-prev');aR=previewRenderer();
  aScene=new THREE.Scene();const sky=new THREE.HemisphereLight(0xeef2ff,0x221a50,0.95);sky.name='Sky';aScene.add(sky);
  const k=new THREE.DirectionalLight(0xffffff,1.25);k.name='Key';k.position.set(2,3,5);aScene.add(k);const r=new THREE.DirectionalLight(0x9a7cff,0.7);r.name='Rim';r.position.set(-3,1,-4);aScene.add(r);
  aCam=new THREE.PerspectiveCamera(30,1,0.05,100);
  cv.addEventListener('pointerdown',e=>{aSpin.drag=true;aSpin.x=e.clientX;try{cv.setPointerCapture(e.pointerId);}catch(_){}});
  cv.addEventListener('pointermove',e=>{if(!aSpin.drag)return;const dx=e.clientX-aSpin.x;aSpin.x=e.clientX;aSpin.a+=dx*0.012;aSpin.v=dx*0.5;});
  const up=()=>{aSpin.drag=false;};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);return true;}catch(e){aScene=null;return false;}}
function cardFrontMat(c,owned){
  const a=c.art&&CARD3D.art[c.art];
  if(a&&a.mat&&owned)return a.mat;
  const key=c.id+'|'+c.title+'|'+c.rarity+'|'+c.no+'|'+(owned?1:0);let t=aTex.get(key);
  if(!t){const cv=cardPlaceholder(c,512);if(!owned){const x=cv.getContext('2d');x.fillStyle='rgba(8,4,30,.72)';x.fillRect(0,0,cv.width,cv.height);x.fillStyle='#fff';x.textAlign='center';x.font='800 34px system-ui,Arial,sans-serif';x.fillText('NOT FOUND YET',cv.width/2,cv.height/2);}
    t=new THREE.CanvasTexture(cv);t.flipY=false;t.encoding=THREE.sRGBEncoding;t.anisotropy=4;aTex.set(key,t);while(aTex.size>24){const k0=aTex.keys().next().value;aTex.get(k0).dispose();aTex.delete(k0);}}
  const base=CARD3D.front||new THREE.MeshStandardMaterial({roughness:0.45});const m=base.clone();m.name='M_Card_Front';m.map=t;m.color.setRGB(1,1,1);return m;}
function cardObject(c,owned){let o;
  if(CARD3D.node){o=CARD3D.node.clone(true);o.traverse(x=>{if(!x.isMesh)return;if(Array.isArray(x.material))x.material=x.material.map(m=>/Card_Front/i.test(m.name||'')?cardFrontMat(c,owned):m);else if(/Card_Front/i.test(x.material.name||''))x.material=cardFrontMat(c,owned);});}
  else{const back=new THREE.MeshStandardMaterial({color:0x2a1890,roughness:0.5}),edge=new THREE.MeshStandardMaterial({color:0xeae4d2,roughness:0.6});
    o=new THREE.Mesh(new THREE.BoxGeometry(0.063,0.088,0.0012),[edge,edge,edge,edge,cardFrontMat(c,owned),back]);o.name='SM_Card_000_Box';}
  return o;}
// (re)build the card shown in the Album preview (Distal calls this for its Card scene too)
function albumPreviewBuild(){if(!initAlbumPreview())return;
  const c=cardById(AL.sel)||CARDS.cards[0];if(aObj){aScene.remove(aObj);gpuRetire(aObj);aObj=null;}if(!c)return;
  const o=cardObject(c,hasCard(c.id)||/[?&]distal=/.test(location.search));aObj=fitGroup(o);aObj.name='Card';aScene.add(aObj);try{applySceneData();}catch(e){}}
function albumTick(){if(!aScene||!aObj)return;
  if(!aSpin.drag){aSpin.v*=0.94;aSpin.a+=Math.sin(performance.now()/2600)*0.0016+aSpin.v*0.002;}aObj.rotation.y=aSpin.a;
  previewCam('album',aCam);previewDraw(aR,$('#al-prev'),aScene,aCam,1.05);}

/* ================= data file, Distal and the Balancing screen ================= */
function applyCardsData(o){CARDS=cleanCards(o);artCache.clear();aTex.forEach(t=>t.dispose());aTex.clear();if(hubTab==='album')renderAlbum();try{renderCustom();renderLook();}catch(e){}albumDot();}
onDataFile('cards',applyCardsData);
// what Distal's Cards editor needs from the game (link.js D.cardsMeta)
function cardsMeta(){const C=o=>JSON.parse(JSON.stringify(o));
  const items={};Object.keys(UNLOCK_TYPES).forEach(t=>items[t]=unlockItems(t));
  return{defaults:C(cleanCards(CARDS_DEF)),current:C(CARDS),types:C(UNLOCK_TYPES),live:[...CARD_PARTS,...CARD_FREE],rules:C(UNLOCK_RULES),rarityKeys:RARITY_KEYS.slice(),items,
    art:CARD3D.list.map(n=>({name:n,url:CARD3D.art[n].url})),model:C(MODEL_INFO.card||{}),front:!!CARD3D.front,
    owned:C(ALBUM.cards),placeholder:CARDS.cards.map(c=>[c.id,cardArtUrl(c)])};}
function cardPreview(c){const x=cleanCards({collections:CARDS.collections,cards:[c],rarities:CARDS.rarities}).cards[0];return x?cardArtUrl(x):'';}
// admin tools (in-game Balancing and Distal): give packs, fill or reset the Album, reset the history
function albumAdmin(cmd){
  if(cmd==='pack')addPack(CARDS.packs.win||3);
  else if(cmd==='fill'){CARDS.cards.forEach(c=>{if(!hasCard(c.id)){ALBUM.cards[c.id]=1;ALBUM.fresh[c.id]=1;}});saveAlbum();}
  else if(cmd==='reset'){ALBUM.cards={};ALBUM.fresh={};ALBUM.packs=[];ALBUM.done={};saveAlbum();}
  if(hubTab==='album')renderAlbum();try{renderCustom();renderLook();}catch(e){}albumDot();}
{const box=document.createElement('div');box.className='cardbox';box.style.marginTop='12px';
  box.innerHTML='<p class="h">Album (this browser)</p><div class="seg"><button class="chip" type="button" data-al="pack">Give a pack</button><button class="chip" type="button" data-al="fill">Fill the Album</button><button class="chip" type="button" data-al="reset">Empty the Album</button><button class="chip" type="button" data-al="history">Clear club history</button></div><p class="note" style="margin-top:8px">For testing. Cards and items they unlock follow data/cards.json (Distal &gt; Balancing &gt; Cards).</p>';
  box.querySelectorAll('[data-al]').forEach(b=>b.onclick=()=>{const k=b.dataset.al;if(k==='history'){if(typeof clearHistory==='function')clearHistory();hobbyToast('Club history cleared.',true);}else{albumAdmin(k);hobbyToast(k==='pack'?'Pack added: open it in the Album.':k==='fill'?'Every card added.':'Album emptied.',true);}});
  const ed=$('#bal-edit');if(ed)ed.appendChild(box);}
albumDot();
