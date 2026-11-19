'use strict';
/* Flick Cup 2026 · js/setmenu.js
   Settings like My Club and The Ground (19 Nov 2026): the tab opens on big cards (Audio, Graphics, Controls,
   Button map) with live pictures. A card opens its page: one framed box, the page name big on top. The left list is
   gone. On a page LT / RT (L2 / R2, Q / E) or the tabs at the left and right edges step to the previous / next
   page; the edges show their names. B / Esc goes back to the cards, onto the card you came from.
   Button map is left out in touch mode. Loaded after touch.js (after ui.js: it adds its own focus group). */
const SET_CARDS=[{id:'audio',t:'Audio'},{id:'gfx',t:'Graphics'},{id:'ctl',t:'Controls'},{id:'map',t:'Button map'}];
let setFrom='audio';
function setPages(){return SET_CARDS.filter(c=>c.id!=='map'||!(typeof TOUCH!=='undefined'&&TOUCH.on));}
function setArt(id){
  const C='#f1e4c6',Y='#f2b632',N='#0f1f38',S=`stroke="${C}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  const esc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const badge=(txt,y)=>`<g transform="translate(150 ${y||256})"><rect x="-${18+txt.length*8}" y="-20" width="${36+txt.length*16}" height="40" fill="${Y}" transform="skewX(-12)"/><text x="0" y="10" fill="${N}" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="900" font-style="italic" font-size="26" text-anchor="middle">${esc(txt)}</text></g>`;
  if(id==='audio'){const v=SET.mute?0:Math.round(SET.master==null?100:SET.master),k=v/100;
    const bars=[0,1,2,3,4].map(i=>{const h=26+i*20,on=k>=(i+0.5)/5;return `<rect x="${172+i*20}" y="${170-h}" width="13" height="${h}" fill="${on?Y:'rgba(241,228,198,.18)'}"/>`;}).join('');
    return `<g style="filter:drop-shadow(5px 6px 0 rgba(5,12,24,.45))"><path d="M52 104h34l42-36v128l-42-36H52z" fill="${C}" stroke="${N}" stroke-width="5" stroke-linejoin="round"/>`+
      (SET.mute?`<path d="M140 104l28 56M168 104l-28 56" ${S} stroke="${Y}" stroke-width="8"/>`:`<path d="M146 108q14 24 0 48M160 94q26 38 0 76" ${S}/>`)+`</g>`+bars+badge(SET.mute?'Muted':v+'%');}
  if(id==='gfx'){let n='High';try{n=GFX_PNAME[GFX.preset]||n;}catch(e){}
    return `<g style="filter:drop-shadow(5px 6px 0 rgba(5,12,24,.45))"><rect x="48" y="50" width="204" height="140" rx="6" fill="${N}" stroke="${C}" stroke-width="5"/>`+
      `<path d="M62 178L104 96H196L238 178Z" fill="#3f9a4a"/><path d="M150 96V178M83 140H217" stroke="${C}" stroke-width="2.5" opacity=".85"/><ellipse cx="150" cy="138" rx="18" ry="9" stroke="${C}" stroke-width="2.5" fill="none"/>`+
      `<path d="M128 202h44l8 14h-60z" fill="${C}"/></g><g fill="${Y}"><path d="M232 40l5 13 13 5-13 5-5 13-5-13-13-5 13-5z"/><path d="M70 30l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/></g>`+badge(n);}
  if(id==='ctl'){const touch=typeof TOUCH!=='undefined'&&TOUCH.on,pad=!touch&&lastInput==='pad';
    if(touch)return `<g style="filter:drop-shadow(5px 6px 0 rgba(5,12,24,.45))"><rect x="70" y="40" width="160" height="190" rx="18" fill="${N}" stroke="${C}" stroke-width="5"/><circle cx="150" cy="120" r="34" fill="none" stroke="${Y}" stroke-width="5" stroke-dasharray="8 7"/>`+
      `<path d="M150 120l-60 52" stroke="${Y}" stroke-width="7" stroke-linecap="round"/><circle cx="90" cy="172" r="14" fill="${Y}"/></g>`+badge('Touch');
    if(pad)return `<g style="filter:drop-shadow(5px 6px 0 rgba(5,12,24,.45))"><path d="M70 92h160c26 0 40 30 46 64 6 36-8 58-30 58-18 0-26-18-40-34H94c-14 16-22 34-40 34-22 0-36-22-30-58 6-34 20-64 46-64z" fill="${C}" stroke="${N}" stroke-width="5"/>`+
      `<path d="M88 126v34M71 143h34" stroke="${N}" stroke-width="9" stroke-linecap="round"/><g fill="${Y}" stroke="${N}" stroke-width="3"><circle cx="212" cy="126" r="9"/><circle cx="228" cy="143" r="9"/><circle cx="196" cy="143" r="9"/><circle cx="212" cy="160" r="9"/></g></g>`+badge('Controller');
    return `<g style="filter:drop-shadow(5px 6px 0 rgba(5,12,24,.45))"><rect x="58" y="128" width="130" height="62" rx="6" fill="${C}" stroke="${N}" stroke-width="5"/><g fill="${N}">${[0,1,2,3].map(r=>[0,1,2,3,4].map(c=>`<rect x="${68+c*23}" y="${136+r*13}" width="18" height="9"/>`).join('')).join('')}</g>`+
      `<rect x="204" y="70" width="58" height="96" rx="29" fill="${C}" stroke="${N}" stroke-width="5"/><path d="M233 70v36M204 106h58" stroke="${N}" stroke-width="4"/><rect x="229" y="82" width="8" height="16" rx="4" fill="${Y}"/></g>`+badge('Mouse and keys');}
  if(id==='map'){let f='xbox';try{f=padFamily();}catch(e){}
    const L={xbox:['Y','B','A','X'],ps:['△','○','✕','□'],switch:['X','A','B','Y'],deck:['Y','B','A','X']}[f]||['Y','B','A','X'];
    const P=[[150,64],[214,128],[150,192],[86,128]];
    return `<g style="filter:drop-shadow(5px 6px 0 rgba(5,12,24,.45))">`+P.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="34" fill="${i===2?Y:C}" stroke="${N}" stroke-width="5"/><text x="${x}" y="${y+12}" text-anchor="middle" fill="${N}" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="900" font-size="36">${L[i]}</text>`).join('')+`</g>`+
      badge({xbox:'Xbox',ps:'PlayStation',switch:'Switch 2',deck:'Steam Deck'}[f]||'Xbox');}
  return '';}
// the cards, the page title and the two edge tabs live in the settings panel
const SETM={panel:document.querySelector('[data-panel=settings]')};
(function(){const pn=SETM.panel;if(!pn)return;
  const home=document.createElement('div');home.className='club-home';home.id='set-home';home.hidden=true;pn.prepend(home);SETM.home=home;
  const ttl=document.createElement('div');ttl.id='set-title';ttl.innerHTML='<h2 class="mc-name"></h2><div class="set-dots" aria-hidden="true"></div>';pn.querySelector('.set-grid').before(ttl);SETM.title=ttl;
  const mk=(id,d)=>{const b=document.createElement('button');b.type='button';b.id=id;b.className='set-edge '+(d<0?'set-prev':'set-next');b.tabIndex=-1;
    b.innerHTML=`<span class="se-arrow" aria-hidden="true">${d<0?'‹':'›'}</span><span class="glyph" aria-hidden="true">${d<0?'LT':'RT'}</span><span class="se-name"></span>`;
    b.addEventListener('click',()=>{setStep(d);});pn.appendChild(b);return b;};
  SETM.prev=mk('set-prev',-1);SETM.next=mk('set-next',1);
  // the old left list stays (hidden) so the focus system still knows the page; a "home" entry for the cards
  const sub=$('#set-sub');if(sub&&!sub.querySelector('[data-sub="home"]')){const h=document.createElement('button');h.className='chip';h.dataset.sub='home';h.setAttribute('aria-pressed','false');h.textContent='Settings';h.hidden=true;sub.prepend(h);}
})();
function renderSetHome(){const el=SETM.home;if(!el)return;const list=setPages();
  if(el.dataset.n!==list.map(c=>c.id).join()){el.dataset.n=list.map(c=>c.id).join();
    el.innerHTML=list.map((c,i)=>`<button class="mc-card mc-big" type="button" data-go="${c.id}" style="--i:${i}"><span class="mc-t">${c.t}</span><span class="mc-art"><svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg></span></button>`).join('');
    el.style.setProperty('--n',list.length);
    el.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{setSettingsSub(b.dataset.go);sfx('tock',14);});}
  el.querySelectorAll('[data-go]').forEach(b=>{const svg=b.querySelector('svg'),a=setArt(b.dataset.go);if(svg.__a!==a){svg.__a=a;svg.innerHTML=a;}});
  el.querySelectorAll('.mc-t').forEach(t=>{t.style.fontSize='';const w=t.clientWidth-48,f=parseFloat(getComputedStyle(t).fontSize);if(w>0&&t.scrollWidth-48>w)t.style.fontSize=Math.floor(f*w/(t.scrollWidth-48))+'px';});}
function setChrome(){const list=setPages(),i=list.findIndex(c=>c.id===setSub),home=setSub==='home'||i<0;
  SETM.panel.classList.toggle('mc-home',home);SETM.panel.classList.toggle('set-page',!home);
  SETM.home.hidden=!home;SETM.title.hidden=home;SETM.prev.hidden=SETM.next.hidden=home||list.length<2;
  if(home){renderSetHome();return;}
  SETM.title.querySelector('h2').textContent=list[i].t;
  SETM.title.querySelector('.set-dots').innerHTML=list.map((c,k)=>`<i class="${k===i?'on':''}"></i>`).join('');
  const p=list[(i-1+list.length)%list.length],n=list[(i+1)%list.length];
  SETM.prev.querySelector('.se-name').textContent=p.t;SETM.next.querySelector('.se-name').textContent=n.t;}
function setStep(d){const list=setPages();if(setSub==='home'||list.length<2)return;let i=list.findIndex(c=>c.id===setSub);if(i<0)i=0;
  const to=list[(i+d+list.length)%list.length].id;setSettingsSub(to);sfx('tock',6);}
// hooks
{const base=setSettingsSub;setSettingsSub=function(k){if(k==='map'&&typeof TOUCH!=='undefined'&&TOUCH.on)k='ctl';if(k!=='home')setFrom=k;
  const r=base(k);setChrome();return r;};}
{const base=setTab;setTab=function(t){const r=base.apply(this,arguments);if(t==='settings')setSettingsSub('home');return r;};}
{const base=subStep;subStep=function(d){if(hubTab==='settings'&&setSub!=='home'){setStep(d);return;}return base(d);};}
{const base=hubBack;hubBack=function(){if(base())return true;if(hubTab!=='settings'||setSub==='home')return false;const from=setSub;setSettingsSub('home');
  const b=document.querySelector(`#set-home [data-go="${from}"]`);if(b&&typeof uiSet==='function'){try{UI.cur=null;uiSet(b,{src:'silent'});}catch(e){}}return true;};}
// the focus system: the cards are a map like My Club's; first focus on the cards
UI_GROUPS.unshift(['#set-home','map']);
UI_DEFAULT.settings=['#set-home .mc-card'].concat(UI_DEFAULT.settings||[]);
// keep the pictures fresh (volume, quality, input) while the cards show
setInterval(()=>{if(hubTab==='settings'&&setSub==='home'&&!$('#hub').hidden)renderSetHome();},800);
{const base=applyTouch;applyTouch=function(){const r=base.apply(this,arguments);if(setSub==='map'&&TOUCH.on)setSettingsSub('ctl');else if(SETM.home)setChrome();return r;};}
setSettingsSub(setSub==='audio'?'home':setSub);
