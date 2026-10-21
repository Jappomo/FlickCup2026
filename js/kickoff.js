// Flick Cup 2026 · js/kickoff.js
// The Kick-off screen: your club, VS, the opponent carousel and the ball / field / table strip.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= Kick-off screen ================= */
// Before a Solo or Versus match: your club on the left, VS and the half length in the middle, the opponent on the
// right (the 15 AI clubs; in Versus also your own away squad as the Guest club). LB/RB, Q/E or the arrows browse.
// The bottom strip picks the ball, field and table (from what you own). Kick off flies the camera down to the table.
const KO={mode:'cpu',idx:{cpu:0,local:0}};
function koList(){const L=TEAMS.clubs.map(c=>({club:c}));return KO.mode==='local'?[{guest:true},...L]:L;}
function koEntry(){const L=koList();const i=((KO.idx[KO.mode]||0)%L.length+L.length)%L.length;KO.idx[KO.mode]=i;return L[i];}
function koOpen(){KO.mode=menuMode==='local'?'local':'cpu';setTab('kickoff');sfx('tock',12);const b=$('#ko-go');if(b&&lastInput==='pad')padPick(b);}
function koBack(){setTab('play');sfx('tock',8);const b=$('#btn-start');if(b&&lastInput==='pad')padPick(b);}
function koStep(d){const L=koList();KO.idx[KO.mode]=(((KO.idx[KO.mode]||0)+d)%L.length+L.length)%L.length;sfx('tock',8);koRender();
  const o=$('#ko-opp');if(o){o.classList.remove('ko-swap');void o.offsetWidth;o.classList.add('ko-swap');}}
// the kit a side of yours wears (preset or your own kit look), in kitOf()'s shape
const myKit=t=>kitFrom(KITS[kitSel[t]]||KITS[t]||KITS[0],mySquads[t]);
function koShirt(k,cls){const c=v=>typeof v==='number'?hexStr(v):v;
  return `<svg class="${cls||'ko-shirt'}" viewBox="0 0 64 82" aria-hidden="true"><path d="M21 4 L8 10 L2 25 L12 29 L14 23 L14 47 L50 47 L50 23 L52 29 L62 25 L56 10 L43 4 Q32 13 21 4Z" fill="${c(k.shirt)}" stroke="rgba(0,0,0,.4)" stroke-width="1.5" stroke-linejoin="round"/>`+
    `<path d="M14 47 H50 L52 63 H35 L32 57 L29 63 H12 Z" fill="${c(k.shorts)}" stroke="rgba(0,0,0,.4)" stroke-width="1.5" stroke-linejoin="round"/><rect x="16" y="66" width="10" height="14" rx="2" fill="${c(k.socks)}" stroke="rgba(0,0,0,.4)"/><rect x="38" y="66" width="10" height="14" rx="2" fill="${c(k.socks)}" stroke="rgba(0,0,0,.4)"/></svg>`;}
// the formation from above, attacking upwards
function koForm(form,k,q){const F=formOf(q||{form});const sh=hexStr(k.shirt),ed=hexStr(kitLum(k.shirt)>0.8?k.shorts:0xffffff);
  return `<svg class="ko-form" viewBox="0 0 80 112" aria-hidden="true"><rect x="2" y="2" width="76" height="108" rx="3" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.28)"/><path d="M2 2 H78 M24 110 V94 H56 V110 M28 2 a12 12 0 0 0 24 0" fill="none" stroke="rgba(255,255,255,.28)"/>`+
    F.pos.map(([x,z])=>`<circle cx="${(40+z/37*33).toFixed(1)}" cy="${(8+(30-x)/90*92).toFixed(1)}" r="4.2" fill="${sh}" stroke="${ed}" stroke-width="1.4"/>`).join('')+`<circle cx="40" cy="104" r="4.2" fill="${hexStr(k.gk)}" stroke="#fff" stroke-width="1.4"/></svg>`;}
const koStars=n=>`<span class="ko-stars" aria-label="${n} of 3 stars">${[1,2,3].map(i=>`<i class="${i<=n?'on':''}">★</i>`).join('')}</span>`;
function koCrest(q,k){const cu=typeof crestOf==='function'&&crestOf(q)?crestUrl(crestOf(q),200):'';if(cu)return `<div class="ko-crest mine"><img src="${cu}" alt="" style="width:100%;height:100%;object-fit:contain"></div>`;const ini=(AB0(q)||'YOU').slice(0,3);
  return `<div class="ko-crest mine">${shieldSVG(hexStr(k.shirt),hexStr(kitLum(k.shirt)>0.8?k.shorts:0xffffff))}<b style="color:${kitLum(k.shirt)>0.62?'#15151a':'#fff'}">${koEsc(ini)}</b></div>`;}
// short name of one of your squads (the same rule as the scoreboard)
function AB0(q){const w=(q.name||'').replace(/[^A-Za-z0-9 ]/g,'').trim().split(' ').filter(Boolean);if(!w.length)return '';return (w.length>1&&w[0].length<=3?w.map(x=>x[0]).join(''):w[0]).slice(0,3).toUpperCase();}
const koEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function koKitRow(t){const row=document.createElement('div');row.className='kitrow';const q=mySquads[t];
  if(q.look){const b=document.createElement('button');b.className='sw my';b.type='button';b.title='My kit (My Club > Kit look)';const L=q.look;
    kitSwatch(b,{shirt:KIT_COLORS[L.s][1],shorts:KIT_COLORS[L.p][1],socks:KIT_COLORS[L.o][1]});b.setAttribute('aria-pressed',String(!!q.useLook));b.setAttribute('aria-label',(t?'Away':'Home')+' kit: my kit');
    b.onclick=()=>{q.useLook=true;saveSquads();if(!S.running)applyKits();renderKits();koRender();};row.appendChild(b);}
  KITS.forEach((k,i)=>{const b=document.createElement('button');b.className='sw';b.type='button';b.title=k.name;kitSwatch(b,k);
    b.setAttribute('aria-pressed',String(!q.useLook&&kitSel[t]===i));b.setAttribute('aria-label',(t?'Away':'Home')+' kit '+k.name);
    b.disabled=KO.mode==='local'&&koEntry().guest&&!mySquads[1-t].useLook&&kitSel[1-t]===i;
    b.onclick=()=>{kitSel[t]=i;q.kit=i;q.useLook=false;saveSquads();renderKits();if(!S.running){S.kits=kitSel.slice();applyKits();}koRender();};row.appendChild(b);});
  return row;}
function koSide(label,crest,name,lines,form,k,kitNote,extra){
  return `<p class="ko-lab">${label}</p><div class="ko-id">${crest}<div class="ko-nm"><h3 class="${name.length>18?'xl':name.length>13?'l':''}">${koEsc(name)}</h3>${lines}</div></div>`+
    `<div class="ko-look">${koForm(form,k,extra&&extra.q)}<div class="ko-kit">${koShirt(k)}<small>${kitNote}</small></div><div class="ko-facts">${extra&&extra.facts||''}</div></div>`;}
function koRender(){
  const pn=document.querySelector('[data-panel="kickoff"]');if(!pn||hubTab!=='kickoff')return;
  const e=koEntry(),L=koList(),me=mySquads[0],mk=myKit(0);
  $('#ko-mode').textContent=KO.mode==='local'?'Versus':'Kick-off';
  $('#ko-sub').textContent=KO.mode==='local'?'Pick the club Player 2 plays as':'Pick your opponent';
  // left: your club
  const F0=formOf(me),pathTag=q=>`<span class="ko-tag" style="--c:${PATHS[q.path]?PATHS[q.path].col:'#fff'}">${PATHS[q.path]?PATHS[q.path].name:''}</span>`;
  const momTag=q=>SPECIALS[q.special]?`<span class="ko-tag mom">${SPECIALS[q.special].name}</span>`:'';
  const meEl=$('#ko-me');
  meEl.innerHTML=koSide('Your club',koCrest(me,mk),me.name||'Your club',`<div class="ko-tags">${pathTag(me)}${momTag(me)}</div>`,me.form,mk,'Your kit',
    {q:me,facts:`<p><b>${me.form==='custom'?'Custom':koEsc(me.form)}</b><span>Formation</span></p><p><b>${Math.round(me.cards.reduce((a,c)=>a+cardOvr(c.st),0)/10)}</b><span>Rating</span></p>`});
  const kr=document.createElement('div');kr.className='ko-kits';kr.innerHTML='<p class="h">Kit</p>';kr.appendChild(koKitRow(0));meEl.appendChild(kr);
  // right: the opponent (or Player 2)
  const op=$('#ko-opp');let html='';
  if(e.guest){const g=mySquads[1],gk=myKit(1);
    html=koSide('Player 2',koCrest(g,gk),g.name||'Guest club',`<div class="ko-tags">${pathTag(g)}${momTag(g)}</div><p class="ko-desc">Your away squad, set up in My Club.</p>`,g.form,gk,'Guest kit',
      {q:g,facts:`<p><b>${g.form==='custom'?'Custom':koEsc(g.form)}</b><span>Formation</span></p><p><b>${Math.round(g.cards.reduce((a,c)=>a+cardOvr(c.st),0)/10)}</b><span>Rating</span></p>`});}
  else{const c=e.club,away=clubWearsAway(c,mk),ck=clubKit(c,away),P=TEAMS.playstyles[c.playstyle]||{name:c.playstyle,desc:''},T=TEAMS.tiers[c.stars]||{name:''},url=emblemUrl(c.emblem);
    const crest=`<div class="ko-crest">${url?`<img src="${url}" alt="">`:`<b>${koEsc(c.short)}</b>`}${c.locked?'<span class="ko-lock">Locked</span>':''}</div>`;
    const ovr=Math.round(c.players.reduce((a,p)=>a+cardOvr(p.st),0)/10);
    html=koSide(KO.mode==='local'?'Player 2':'Opponent',crest,c.name,`<div class="ko-tier">${koStars(c.stars)}<span>${koEsc(T.name)}</span></div><div class="ko-tags"><span class="ko-tag style">${koEsc(P.name)}</span>${pathTag({path:c.path})}${SPECIALS[c.moment]?`<span class="ko-tag mom">${SPECIALS[c.moment].name}</span>`:''}</div><p class="ko-desc">${koEsc(P.desc)}</p>`,
      c.formation,ck,away?'Away kit · colour clash':'Home kit',{q:{form:c.formation,kop:c.kickoff},facts:`<p><b>${koEsc(c.formation)}</b><span>Formation</span></p><p><b>${ovr}</b><span>Rating</span></p>`});}
  op.innerHTML=`<div class="ko-car"><button class="ko-arr" data-ko="-1" aria-label="Previous club"><span class="glyph pg">LB</span><span class="kg">‹</span></button><div class="ko-card">${html}</div><button class="ko-arr" data-ko="1" aria-label="Next club"><span class="kg">›</span><span class="glyph pg">RB</span></button></div>`+
    `<div class="ko-dots">${L.map((x,i)=>{const on=x===e;if(x.guest)return `<button class="ko-dot g${on?' on':''}" data-ki="${i}" title="Guest club" aria-label="Guest club"><b>P2</b></button>`;const u=emblemUrl(x.club.emblem);return `<button class="ko-dot${on?' on':''}${x.club.locked?' lock':''}" data-ki="${i}" title="${koEsc(x.club.name)}" aria-label="${koEsc(x.club.name)}">${u?`<img src="${u}" alt="">`:`<b>${koEsc(x.club.short)}</b>`}</button>`;}).join('')}</div>`;
  if(e.guest){const kr2=document.createElement('div');kr2.className='ko-kits';kr2.innerHTML='<p class="h">Guest kit</p>';kr2.appendChild(koKitRow(1));op.querySelector('.ko-card').appendChild(kr2);}
  op.querySelectorAll('[data-ko]').forEach(b=>b.onclick=()=>koStep(+b.dataset.ko));
  op.querySelectorAll('[data-ki]').forEach(b=>b.onclick=()=>{KO.idx[KO.mode]=+b.dataset.ki;sfx('tock',8);koRender();});
  // middle: half length
  $('#ko-half').innerHTML=[3,5,8].map(m=>`<button class="chip" data-min="${m}" aria-pressed="${m===halfMin}">${m} min</button>`).join('');
  $('#ko-half').querySelectorAll('[data-min]').forEach(b=>b.onclick=()=>{halfMin=+b.dataset.min;document.querySelectorAll('#halflen .chip').forEach(x=>x.setAttribute('aria-pressed',String(+x.dataset.min===halfMin)));koRender();});
  // bottom strip: ball, field, table (owned only)
  const picks=[['ball','Ball',BALL.variants,BALL.mine,v=>thumbs[v.id]],['field','Field',LOOK.field,LOOKSEL.field,v=>tThumbs['field'+v.id]],['table','Table',LOOK.table,LOOKSEL.table,v=>tThumbs['table'+v.id]]];
  $('#ko-picks').innerHTML=picks.map(([p,lab,all,cur,th])=>{const own=(all||[]).filter(v=>owns(p,v.id));if(!own.length)return '';const v=own.find(x=>x.id===cur)||own[0],t=th(v);
    return `<div class="ko-pick" data-part="${p}"><span class="h">${lab}</span><div class="ko-pv">${own.length>1?`<button class="ko-pa" data-pp="${p}" data-d="-1" aria-label="Previous ${lab.toLowerCase()}">‹</button>`:''}${t?`<img src="${t}" alt="">`:''}<b>${koEsc(v.name)}</b>${own.length>1?`<button class="ko-pa" data-pp="${p}" data-d="1" aria-label="Next ${lab.toLowerCase()}">›</button>`:''}</div></div>`;}).join('');
  $('#ko-picks').querySelectorAll('[data-pp]').forEach(b=>b.onclick=()=>koPickItem(b.dataset.pp,+b.dataset.d));
  const go=$('#ko-go');go.disabled=!!(e.club&&e.club.locked);$('#ko-go-lbl').textContent=e.club&&e.club.locked?'Locked':'Kick off';
}
// ball / field / table: steps through what you own and equips it (as in The Ground)
function koPickItem(part,d){
  const all=part==='ball'?BALL.variants:LOOK[part],own=(all||[]).filter(v=>owns(part,v.id));if(own.length<2)return;
  const cur=part==='ball'?BALL.mine:LOOKSEL[part];let i=own.findIndex(v=>v.id===cur);i=((i<0?0:i)+d+own.length)%own.length;const id=own[i].id;
  if(part==='ball'){BALL.mine=id;store.set('baize.ball',id);showBall();}else{LOOKSEL[part]=id;saveLook();showLook();}
  sfx('tock',10);koRender();const f=document.querySelector(`#ko-picks [data-pp="${part}"][data-d="${d}"]`);if(f&&lastInput==='pad')padPick(f);
}
function koGo(){
  const e=koEntry();if(e.club&&e.club.locked)return;
  ensureAudio();if(S.mode==='online'&&net.named)leaveRoom(true);
  S.mode=KO.mode;S.kits=kitSel.slice();
  const opp=e.guest?mySquads[1]:clubSquad(e.club,clubWearsAway(e.club,myKit(0)));
  matchSquads=[mySquads[0],opp];
  S.tour=null;S.tg=false;S.noMoments=false;
  applyKits();S.halfLen=halfMin*60;
  setTab('play');cam.mode=-1;closeMenu();newMatch();koFly();
}
// the camera comes down from a wide orbit onto the match view (the title screen's move, a little slower)
function koFly(){if(RM.matches)return;const now=performance.now();TITLE.t0=now;TITLE.a0=Math.PI*0.62;TITLE.leaving=now;TITLE.dur=1300;}
$('#ko-back').addEventListener('click',koBack);
$('#ko-go').addEventListener('click',koGo);
