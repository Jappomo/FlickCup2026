// Flick Cup 2026 · js/club.js
// My Club > History: your record (played, won, drawn, lost, goals), form, top scorers, favourite field and table,
// the trophy cabinet (Album cards of a cabinet collection, like Trophies) and the last matches.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= save: baize.history ================= */
// {v, p, w, d, l, gf, ga, cs, goals:{name:n}, fields:{id:n}, tables:{id:n}, opps:{key:{n,name,emblem,w,d,l}}, best:{gf,ga,opp,t}, recent:[...20]}
function freshHistory(){return{v:1,p:0,w:0,d:0,l:0,gf:0,ga:0,cs:0,goals:{},fields:{},tables:{},opps:{},best:null,recent:[]};}
let HIST=(()=>{let h=null;try{h=JSON.parse(store.get('baize.history')||'null');}catch(e){}if(!h||typeof h!=='object'||h.v!==1)return freshHistory();
  const f=freshHistory();Object.keys(f).forEach(k=>{if(typeof h[k]!==typeof f[k]&&!(k==='best'))h[k]=f[k];});if(!Array.isArray(h.recent))h.recent=[];return h;})();
function saveHistory(){store.set('baize.history',JSON.stringify(HIST));}
function clearHistory(){HIST=freshHistory();saveHistory();if(hubTab==='squad'&&clubSec==='history')renderHistory();}

/* ---------- what happens in a match ---------- */
// goals: the figure that flicked the ball in (own goals are not counted for anyone)
let HM={goals:[],done:false},HCTX=null;
{const bA=resolveAttack,bD=resolveDefend,bG=scoreGoal,bN=newMatch;
  resolveAttack=function(ctx){HCTX=ctx;try{return bA(ctx);}finally{HCTX=null;}};
  resolveDefend=function(ctx){HCTX=ctx;try{return bD(ctx);}finally{HCTX=null;}};
  scoreGoal=function(team,own){try{const b=HCTX&&bodies[HCTX.fig];if(!own&&b&&b.team===team&&b.idx<10)HM.goals.push({team,idx:b.idx});}catch(e){}return bG(team,own);};
  newMatch=function(o){HM={goals:[],done:false};return bN(o);};}
// which side is you in this match (null: not your match, like practice, the tutorial or watching)
function histSide(){
  if(S.mode==='cpu')return 1-cpuTeam;
  if(S.mode==='local')return 0;
  if(S.mode==='online')return net.myTeam===0||net.myTeam===1?net.myTeam:null;
  return null;}
function recordMatch(){
  if(HM.done)return;const me=histSide();if(me==null||!S.score)return;HM.done=true;
  const gf=S.score[me],ga=S.score[1-me],res=gf>ga?'w':gf<ga?'l':'d',opp=matchSquads&&matchSquads[1-me]||{};
  HIST.p++;HIST[res]++;HIST.gf+=gf;HIST.ga+=ga;if(!ga)HIST.cs++;
  HM.goals.filter(g=>g.team===me).forEach(g=>{const n=myNames[0][g.idx]||('Player '+(g.idx+1));HIST.goals[n]=(HIST.goals[n]||0)+1;});
  if(S.mode!=='online'){const f=lookPick('field',LOOKSEL.field),t=lookPick('table',LOOKSEL.table);if(f)HIST.fields[f.id]=(HIST.fields[f.id]||0)+1;if(t)HIST.tables[t.id]=(HIST.tables[t.id]||0)+1;}
  const name=(opp.name||N(1-me)||'Opponent').slice(0,24),key=opp.club||('n:'+name);
  const o=HIST.opps[key]||(HIST.opps[key]={n:0,name,emblem:opp.emblem||'',w:0,d:0,l:0});o.n++;o[res]++;o.name=name;if(opp.emblem)o.emblem=opp.emblem;
  if(res==='w'&&(!HIST.best||gf-ga>HIST.best.gf-HIST.best.ga||(gf-ga===HIST.best.gf-HIST.best.ga&&gf>HIST.best.gf)))HIST.best={gf,ga,opp:name,t:Date.now()};
  HIST.recent.unshift({t:Date.now(),mode:S.tour?'cup':S.mode,opp:name,emblem:opp.emblem||'',gf,ga,res,conceded:!!S.conceded});HIST.recent=HIST.recent.slice(0,20);
  saveHistory();}
{const baseFT=showFT;showFT=function(){baseFT();try{recordMatch();}catch(e){console.error('[history]',e);}};}

/* ---------- the History page ---------- */
const hEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MODE_NAME={cpu:'Solo',local:'Versus',online:'Online',cup:'Tournament'};
function topOf(o){let k=null,n=0;Object.entries(o||{}).forEach(([a,b])=>{if(b>n){k=a;n=b;}});return k?{k,n}:null;}
function renderHistory(){
  const el=$('#club-history');if(!el||hubTab!=='squad'||clubSec!=='history')return;const H=HIST,q=mySquads[0];
  const pct=H.p?Math.round(H.w/H.p*100):0;
  const tile=(n,l,cls)=>`<div class="hs-tile ${cls||''}"><b>${n}</b><span>${l}</span></div>`;
  const form=H.recent.slice(0,5).map(r=>`<i class="hs-f ${r.res}" title="${hEsc(r.opp)} ${r.gf}-${r.ga}">${r.res.toUpperCase()}</i>`).join('')||'<span class="note">No matches yet.</span>';
  const scorers=Object.entries(H.goals).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const sc=scorers.length?`<ol class="hs-list">${scorers.map(([n,g],i)=>`<li><span>${i+1}</span><b>${hEsc(n)}</b><em>${g} goal${g>1?'s':''}</em></li>`).join('')}</ol>`:'<p class="note">Goals from your figures show here.</p>';
  const fav=(part,o)=>{const t=topOf(o);if(!t)return '<span class="note">None yet</span>';const v=(part==='ball'?BALL.variants:LOOK[part]||[]).find(x=>x.id===t.k);return `<b>${hEsc(v?v.name:part+' '+t.k)}</b><small>${t.n} match${t.n>1?'es':''}</small>`;};
  const opps=Object.values(H.opps).sort((a,b)=>b.n-a.n).slice(0,4);
  const em=e=>{const u=e&&typeof emblemUrl==='function'?emblemUrl(e):'';return u?`<img src="${u}" alt="">`:'<i class="hs-noem"></i>';};
  // trophy cabinet: the cards of the cabinet collections (Trophies); the ones you have stand on the shelf
  const cab=(typeof CARDS!=='undefined'?CARDS.collections.filter(c=>c.cabinet):[]).flatMap(c=>colCards(c.id));
  const shelf=cab.length?cab.map(c=>hasCard(c.id)?`<button class="hs-trophy" type="button" data-card="${c.id}" title="${hEsc(c.title)}"><img src="${cardArtUrl(c)}" alt=""><span>${hEsc(c.title)}</span></button>`:`<div class="hs-trophy empty" title="Find this card in the Album"><i>?</i><span>${hEsc(c.title)}</span></div>`).join(''):'<p class="note">No trophy collection in the Album.</p>';
  const rec=H.recent.slice(0,10).map(r=>`<tr><td>${new Date(r.t).toLocaleDateString(undefined,{day:'numeric',month:'short'})}</td><td class="hs-op">${em(r.emblem)}${hEsc(r.opp)}</td><td><b class="hs-sc ${r.res}">${r.gf} - ${r.ga}</b></td><td>${MODE_NAME[r.mode]||hEsc(r.mode)}${r.conceded?' · conceded':''}</td></tr>`).join('');
  const own=typeof CARDS!=='undefined'?CARDS.cards.filter(c=>hasCard(c.id)).length:0,tot=typeof CARDS!=='undefined'?CARDS.cards.length:0;
  const cu=typeof crestOf==='function'&&crestOf(q)?crestUrl(crestOf(q),128):'';
  el.innerHTML=`<div class="hs-head">${cu?`<img class="hs-crest" src="${cu}" alt="">`:''}<h2>${hEsc(q.name||'Your club')}</h2><p class="note">Every Solo, Versus and Online match you play is written here.</p></div>
    <div class="hs-tiles">${tile(H.p,'Played')}${tile(H.w,'Won','w')}${tile(H.d,'Drawn','d')}${tile(H.l,'Lost','l')}${tile(H.gf,'Goals for')}${tile(H.ga,'Goals against')}${tile(H.cs,'Clean sheets')}${tile(pct+'%','Win rate')}</div>
    <div class="hs-grid">
      <div class="cardbox"><p class="h">Form</p><div class="hs-form">${form}</div>${H.best?`<p class="note" style="margin-top:10px">Biggest win: <b>${H.best.gf} - ${H.best.ga}</b> against ${hEsc(H.best.opp)}</p>`:''}</div>
      <div class="cardbox"><p class="h">Top scorers</p>${sc}</div>
      <div class="cardbox"><p class="h">Favourites</p><div class="hs-fav"><div><span class="h">Field</span>${fav('field',H.fields)}</div><div><span class="h">Table</span>${fav('table',H.tables)}</div><div><span class="h">Most played</span>${opps[0]?`<b>${hEsc(opps[0].name)}</b><small>${opps[0].w}W ${opps[0].d}D ${opps[0].l}L</small>`:'<span class="note">None yet</span>'}</div><div><span class="h">Album</span><b>${own} / ${tot}</b><small>cards</small></div></div></div>
      <div class="cardbox hs-cab"><p class="h">Trophy cabinet</p><div class="hs-shelf">${shelf}</div></div>
      <div class="cardbox hs-wide"><p class="h">Last matches</p>${rec?`<table class="hs-tab"><tbody>${rec}</tbody></table>`:'<p class="note">Play a match: it shows here.</p>'}</div>
    </div>`;
  el.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>{const c=cardById(b.dataset.card);if(!c)return;AL.col=c.collection;AL.sel=c.id;setTab('album');});
}
