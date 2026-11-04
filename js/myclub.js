'use strict';
/* Flick Cup 2026 · js/myclub.js
   My Club landing (agreed and built 3 Nov 2026): the tab opens on five big cards, styled like the Play tab's
   briefing card (gold top rule, big title, a picture box). Crest · Tactics · Kit look · History · Challenges.
   Each picture is live: your crest, your formation, your kit colours, your wins, your challenge count.
   Pressing a card opens its page; the page's header has Back (B / Esc) and the section bar (LT / RT).
   Loaded after challenges.js and before ui.js (ui.js wraps setClubSec for the slide animation). */

// Crest, Tactics and Kit look are the big cards; History and Challenges sit stacked, half height, on the right
const CLUB_CARDS=[
  {id:'crest',t:'Crest',big:1},
  {id:'tactics',t:'Tactics',big:1},
  {id:'kit',t:'Kit look',big:1},
  {id:'history',t:'History'},
  {id:'chal',t:'Challenges'},
];
let clubFrom='crest';
clubSec='home';

// the pictures: cream chalk on the blue box (300 x 300), like the Play card
function clubArt(id){
  const C='#f1e4c6',Y='#f2b632',N='#0f1f38',S=`stroke="${C}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  const esc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const badge=(txt,y)=>`<g transform="translate(150 ${y||262})"><rect x="-${18+txt.length*8}" y="-20" width="${36+txt.length*16}" height="40" fill="${Y}" transform="skewX(-12)"/><text x="0" y="10" fill="${N}" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="900" font-style="italic" font-size="28" text-anchor="middle">${esc(txt)}</text></g>`;
  const q=mySquads[0];
  if(id==='crest'){let u='';try{u=crestUrl(myCrest(0),320);}catch(e){}
    return u?`<image href="${u}" x="40" y="22" width="220" height="220" style="filter:drop-shadow(5px 6px 0 rgba(5,12,24,.45))"/>`:`<path d="M150 40l90 26v70c0 60-40 96-90 114-50-18-90-54-90-114V66z" ${S}/>`;}
  if(id==='tactics'){let F=null;try{F=formOf(q);}catch(e){}
    const px=x=>34+(x+60)/120*232,pz=z=>58+(z+39)/78*150;
    const dots=F?F.pos.map(([x,z])=>`<circle cx="${px(x).toFixed(1)}" cy="${pz(z).toFixed(1)}" r="8" fill="${Y}" stroke="${N}" stroke-width="3"/>`).join(''):'';
    const opp=[[60,0],[44,-24],[44,24],[30,-10],[30,10]].map(([x,z])=>`<circle cx="${px(x)}" cy="${pz(z)}" r="7" fill="none" stroke="${C}" stroke-width="3"/>`).join('');
    const kp=F?F.pos[F.kop[0]]:null;
    return `<g ${S} stroke-width="3" opacity=".9"><rect x="34" y="58" width="232" height="150"/><path d="M150 58v150"/><circle cx="150" cy="133" r="24"/><rect x="34" y="98" width="30" height="70"/><rect x="236" y="98" width="30" height="70"/></g>`+
      `<circle cx="${px(-57)}" cy="133" r="8" fill="${C}" stroke="${N}" stroke-width="3"/>`+opp+dots+
      (kp?`<path d="M${px(kp[0])+10} ${pz(kp[1])} Q 200 70 252 128" stroke="${Y}" stroke-width="4" fill="none" stroke-dasharray="9 7" stroke-linecap="round"/><path d="M0 0L-14 -8L-14 8Z" fill="${Y}" transform="translate(256 131) rotate(40)"/>`:'')+
      badge(q.form==='custom'?'Custom':(q.form||'4-4-2'),258);}
  if(id==='kit'){let k={shirt:0xc62828,shorts:0xffffff,socks:0xc62828};try{k=myKit(0);}catch(e){}
    const h=v=>'#'+(+v).toString(16).padStart(6,'0');
    // shirt over shorts, drawn in your home kit colours
    return `<g stroke="${N}" stroke-width="5" stroke-linejoin="round" style="filter:drop-shadow(5px 6px 0 rgba(5,12,24,.45))">`+
      `<path d="M104 190H196L206 254H158L150 226L142 254H94Z" fill="${h(k.shorts)}"/>`+
      `<path d="M98 40l34-12q18 14 36 0l34 12 44 36-28 36-20-12v94H102v-94l-20 12-28-36z" fill="${h(k.shirt)}"/>`+
      `<path d="M132 28q18 20 36 0" fill="none" stroke="${C}" stroke-width="6"/></g>`;}
  if(id==='history'){const w=(typeof HIST==='object'&&HIST)?HIST.w|0:0;
    return `<g ${S}><path d="M108 52h84v40c0 30-18 50-42 50s-42-20-42-50z" fill="${C}" stroke="${C}"/><path d="M108 66H82c0 26 12 40 30 42M192 66h26c0 26-12 40-30 42"/><path d="M150 142v34M118 206h64v-30h-64z" fill="${C}"/></g>`+
      badge(w+(w===1?' win':' wins'),252);}
  if(id==='chal'){let d=0,n=0;try{const L=chList();n=L.length;d=L.filter(chDone).length;}catch(e){}
    const p=n?d/n:0,R=70,L=2*Math.PI*R;
    return `<g transform="translate(150 132)"><circle r="${R}" stroke="rgba(241,228,198,.18)" stroke-width="16" fill="none"/>`+
      `<circle r="${R}" stroke="${Y}" stroke-width="16" fill="none" stroke-dasharray="${(L*p).toFixed(1)} ${L.toFixed(1)}" transform="rotate(-90)"/>`+
      `<circle r="44" ${S}/><circle r="20" fill="${C}"/><path d="M26 -26L70 -70M56 -76l16 -4-4 16" ${S} stroke="${Y}"/></g>`+
      badge(`${d} / ${n}`,252);}
  return '';}

function renderClubHome(){
  const el=$('#club-home');if(!el)return;
  if(!el.firstChild){
    el.innerHTML=CLUB_CARDS.map((c,i)=>`<button class="mc-card ${c.big?'mc-big':'mc-small'}" type="button" data-go="${c.id}" style="--i:${i}"><span class="mc-t">${c.t}</span><span class="mc-art"><svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg></span></button>`).join('');
    el.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{setClubSec(b.dataset.go);sfx('tock',14);});}
  el.querySelectorAll('[data-go]').forEach(b=>{const svg=b.querySelector('svg'),a=clubArt(b.dataset.go);if(svg.__a!==a){svg.__a=a;svg.innerHTML=a;}});
  // titles too long for the card shrink to fit
  el.querySelectorAll('.mc-t').forEach(t=>{t.style.fontSize='';const w=t.clientWidth-48,f=parseFloat(getComputedStyle(t).fontSize);if(w>0&&t.scrollWidth-48>w)t.style.fontSize=Math.floor(f*w/(t.scrollWidth-48))+'px';});
  // the red dot for new challenges, like the section bar
  const ch=el.querySelector('[data-go="chal"]');let fresh=false;try{fresh=Object.keys(CH.fresh).some(id=>chById(id));}catch(e){}
  let dot=ch.querySelector('.tab-dot');if(fresh&&!dot){dot=document.createElement('i');dot.className='tab-dot';ch.appendChild(dot);}else if(!fresh&&dot)dot.remove();}

{const base=setClubSec;setClubSec=function(sec){
  const home=sec==='home';if(!home)clubFrom=sec;
  // one squad now (the away squad gave way to the AI clubs): every page edits the home squad
  sqTeam=0;crestTeam=0;kitTeam=0;
  const r=base(sec);
  $('#club-home').hidden=!home;$('#club-head').hidden=home;
  if(home){['#club-tactics','#club-kit','#club-history','#club-crest','#club-chal'].forEach(s=>{const e=$(s);if(e)e.hidden=true;});if(hubTab==='squad')renderClubHome();}
  $('[data-panel=squad]').classList.toggle('mc-home',home);
  return r;};}
// the tab always opens on the cards (pages opened from elsewhere, e.g. the Album's Equip, call setClubSec after)
// pressing My Club again on a page also goes back to the cards
{const base=setTab;setTab=function(t){if(t==='squad')clubSec='home';return base.apply(this,arguments);};}
// the club's name over Tactics, like Crest and Kit look
{const base=renderSquad;renderSquad=function(){sqTeam=0;const r=base.apply(this,arguments);const h=$('#tac-name');if(h){const q=mySquads[0];h.textContent=q.name||KITS[kitSel[0]].name;}return r;};}
// the crest picture once the shapes have loaded or the palette changed
{const base=crestRefresh;crestRefresh=function(){const r=base.apply(this,arguments);if(hubTab==='squad'&&clubSec==='home')renderClubHome();return r;};}
$('#club-back').addEventListener('click',()=>{clubBack();});
// B on a page: back to the cards, onto the card of that page
function clubBack(){if(hubTab!=='squad'||clubSec==='home')return false;const from=clubSec;setClubSec('home');
  const b=document.querySelector(`#club-home [data-go="${from}"]`);if(b&&typeof uiSet==='function'){try{UI.cur=null;uiSet(b,{src:'silent'});}catch(e){}}return true;}

/* ---------- The Ground landing (4 Nov 2026): Ball · Table · Music cards, like My Club ---------- */
const GROUND_CARDS=[{id:'ball',t:'Ball'},{id:'table',t:'Table'},{id:'music',t:'Music'}];
let groundFrom='ball';
function groundArt(id){
  const C='#f1e4c6',Y='#f2b632',N='#0f1f38',S=`stroke="${C}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  const esc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const badge=(txt,y)=>`<g transform="translate(150 ${y||262})"><rect x="-${18+txt.length*8}" y="-20" width="${36+txt.length*16}" height="40" fill="${Y}" transform="skewX(-12)"/><text x="0" y="10" fill="${N}" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="900" font-style="italic" font-size="26" text-anchor="middle">${esc(txt)}</text></g>`;
  if(id==='ball'){let u='',name='';try{const v=ballVariant(BALL.mine)||BALL.variants[0];if(v){u=thumbs[v.id]||'';name=v.name;}}catch(e){}
    return (u?`<image href="${u}" x="55" y="30" width="190" height="190" style="filter:drop-shadow(5px 6px 0 rgba(5,12,24,.45))"/>`:
      `<g transform="translate(150 125)"><circle r="80" fill="${C}" stroke="${N}" stroke-width="5"/><path d="M0 -26l25 18-10 30h-30l-10-30z" fill="${N}"/><path d="M0 -26V-80M25 -8l52-16M15 22l32 44M-15 22l-32 44M-25 -8l-52-16" stroke="${N}" stroke-width="4"/></g>`)+(name?badge(name,256):'');}
  if(id==='table'){let name='';try{const t=lookPick('table',LOOKSEL.table);name=t?t.name:'';}catch(e){}
    return `<g stroke="${N}" stroke-width="4" stroke-linejoin="round"><path d="M40 175L95 85H205L260 175Z" fill="#7a5233"/><path d="M58 166L103 94H197L242 166Z" fill="#3f9a4a"/>`+
      `<path d="M40 175V192H260V175" fill="#5a3a22"/></g><g stroke="${C}" stroke-width="2.5" fill="none" opacity=".9"><path d="M150 94V166M78 134H222"/><ellipse cx="150" cy="130" rx="20" ry="11"/></g>`+
      `<g fill="${Y}" stroke="${N}" stroke-width="2"><circle cx="120" cy="120" r="5"/><circle cx="135" cy="148" r="5"/><circle cx="175" cy="112" r="5"/></g>`+(name?badge(name,252):'');}
  if(id==='music'){let n=0;try{n=TRACKS.filter(t=>!SET.off.includes(t.id)).length;}catch(e){}
    return `<g transform="translate(150 120)"><path d="M-40 40V-50L50 -66V24" ${S} stroke-width="8"/><ellipse cx="-56" cy="40" rx="22" ry="16" fill="${C}"/><ellipse cx="34" cy="24" rx="22" ry="16" fill="${C}"/><path d="M-40 -28L50 -44" ${S} stroke-width="8"/></g>`+badge(n+(n===1?' track':' tracks'),252);}
  return '';}
function renderGroundHome(){
  const el=$('#ground-home');if(!el)return;
  if(!el.firstChild){el.innerHTML=GROUND_CARDS.map((c,i)=>`<button class="mc-card mc-big" type="button" data-go="${c.id}" style="--i:${i}"><span class="mc-t">${c.t}</span><span class="mc-art"><svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg></span></button>`).join('');
    el.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{setCustSec(b.dataset.go);sfx('tock',14);});}
  el.querySelectorAll('[data-go]').forEach(b=>{const svg=b.querySelector('svg'),a=groundArt(b.dataset.go);if(svg.__a!==a){svg.__a=a;svg.innerHTML=a;}});}
{const base=setCustSec;setCustSec=function(sec){
  const home=sec==='home';
  if(home){custSec='home';document.querySelectorAll('.cnav[data-sec]').forEach(b=>b.setAttribute('aria-current','false'));['#cust-ball','#cust-table','#cust-music'].forEach(s=>{const e=$(s);if(e)e.hidden=true;});}
  else{groundFrom=sec;base(sec);}
  $('#ground-home').hidden=!home;$('[data-panel=custom]').classList.toggle('mc-home',home);
  if(home&&hubTab==='custom')renderGroundHome();};}
{const base=setTab;setTab=function(t){if(t==='custom')custSec='home';return base.apply(this,arguments);};}
function groundBack(){if(hubTab!=='custom'||custSec==='home')return false;const from=custSec;setCustSec('home');
  const b=document.querySelector(`#ground-home [data-go="${from}"]`);if(b&&typeof uiSet==='function'){try{UI.cur=null;uiSet(b,{src:'silent'});}catch(e){}}return true;}
// B / Esc on a page of My Club or The Ground: back to its cards (ui.js uiBack)
function hubBack(){return (hubTab==='squad'&&clubBack())||(hubTab==='custom'&&groundBack());}
