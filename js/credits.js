'use strict';
/* Flick Cup 2026 · js/credits.js (19 Nov 2026)
   1. Splash screens before the title in a build (data/splash.json, made in Distal > Interface > Splash). Add ?splash
      to the address to see them in the browser.
   2. Settings > Credits (data/credits.json, made in Distal > Interface > Credits): the game, its sections and rows,
      the music section filled from the playlist. The page rolls slowly on its own; wheel, drag or stick take over.
   A build can leave either out (Distal > Build: FLICK_BUILD.splash / FLICK_BUILD.credits false).
   Loaded after setmenu.js and before start.js (start.js calls splashWanted / splashRun / splashSkip). */
// data/credits.json: {version, game, subtitle, developer, engine, roll (px per second), sections:[{title, music, rows:[[left, right]]}]}
const CREDITS_DEF={game:'Flick Cup 2026',subtitle:'Table football',developer:'Lost Tail Games',engine:'Distal',roll:28,end:'',
  sections:[{title:'Made by',rows:[['Developer','Lost Tail Games'],['Game design, art and code','Giacomo Liberio']]},
    {title:'Engine',rows:[['Editor and tools','Distal'],['3D','three.js']]},
    {title:'Music',music:true,rows:[]},
    {title:'Libraries',rows:[['three.js r128 (3D, glTF loader, post-processing)','MIT licence'],['PeerJS (online play)','MIT licence'],['Electron (Steam Deck build)','MIT licence']]},
    {title:'Fonts',rows:[['Barlow and Barlow Condensed, by Jeremy Tribby','SIL Open Font Licence']]},
    {title:'Thanks',rows:[['Everyone who played the early builds','Thank you']]}]};
const CREDITS={data:null};
function creditsData(){const D=Object.assign({},CREDITS_DEF,CREDITS.data||{});if(!Array.isArray(D.sections))D.sections=CREDITS_DEF.sections;return D;}
function creditsInfo(){const D=creditsData();return {engine:D.engine||CREDITS_DEF.engine,developer:D.developer||CREDITS_DEF.developer,game:D.game||CREDITS_DEF.game};}
function creditsOn(){const B=window.FLICK_BUILD;return !(B&&B.credits===false);}
const crEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));

/* ---------------- splash ---------------- */
// data/splash.json, made in Distal > Interface > Splash (19 Nov 2026):
//   {version, on, screens:[{name, logo, text, bg, size, delay, fadeIn, hold, fadeOut, zoom, skippable}]}
//   logo: a picture in the game folder (img/ui/...), size: its height in % of the screen; text: shown when there is
//   no logo; times in ms; zoom: % the logo grows over its screen; skippable: a press jumps to its fade out.
// No file (or no screens): two text screens with the engine and the developer names.
const SPLASH_SCREEN_DEF={name:'',logo:'',text:'',bg:'#0b1830',size:34,delay:150,fadeIn:700,hold:1600,fadeOut:700,zoom:4,skippable:true};
const SPLASH={el:null,i:-1,done:null,data:null,loaded:false,raf:0};
onDataFile('splash',o=>{SPLASH.data=o;SPLASH.loaded=true;});
function splashScreens(){const C=creditsInfo(),D=SPLASH.data,n=(v,d,lo,hi)=>{v=+v;return isFinite(v)?Math.min(hi,Math.max(lo,v)):d;};
  const list=D&&Array.isArray(D.screens)&&D.screens.length?D.screens:[{name:'Engine',text:C.engine,sub:'Made with'},{name:'Developer',text:C.developer,sub:'A game by'}];
  return list.map(x=>{const o=Object.assign({},SPLASH_SCREEN_DEF,x||{});return {name:String(o.name||''),logo:String(o.logo||''),text:String(o.text||o.name||''),sub:String(o.sub||''),
    bg:/^#[0-9a-f]{3,8}$/i.test(o.bg)?o.bg:SPLASH_SCREEN_DEF.bg,size:n(o.size,34,2,100),delay:n(o.delay,150,0,10000),fadeIn:n(o.fadeIn,700,0,10000),hold:n(o.hold,1600,0,30000),fadeOut:n(o.fadeOut,700,0,10000),zoom:n(o.zoom,4,-50,100),skippable:o.skippable!==false};});}
function splashWanted(){const w=splashWanted0();if(!w)document.documentElement.classList.remove('presplash');return w;}
function splashWanted0(){const B=window.FLICK_BUILD;if(SPLASH.data&&SPLASH.data.on===false&&!/[?&]splash\b/.test(location.search))return false;return (!!B&&B.splash!==false)||/[?&]splash\b/.test(location.search);}
function splashRun(done){SPLASH.done=done;
  // the title screen's input gate: while TITLE.on the menus ignore presses, and a press calls titleGo (which skips here)
  TITLE.on=true;TITLE.splash=true;$('#hub').hidden=true;document.documentElement.classList.add('titleon');
  const el=document.createElement('div');el.id='splash';el.setAttribute('role','presentation');el.addEventListener('click',()=>splashSkip());
  document.body.appendChild(el);SPLASH.el=el;
  // Wait for data/splash.json and for every logo to be loaded and decoded, on the blank background, then start
  // (19 Nov 2026: on the Steam Deck the page is busy loading models at start, so the file came in after the old
  // 0.9 s wait and the text screens showed instead of the logos). Gives up after 8 s and shows what it has.
  // its own request for the file: waits as long as the file takes, falls back to the text screens only when it is missing
  const t0=performance.now(),late=()=>performance.now()-t0>20000||SPLASH.miss;
  if(!SPLASH.loaded)fetch('data/splash.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(o=>{if(!SPLASH.loaded){SPLASH.data=o&&typeof o==='object'?o:null;SPLASH.loaded=true;}}).catch(()=>{SPLASH.miss=true;});
  const start=()=>{if(!SPLASH.el)return;SPLASH.i=-1;splashNext();SPLASH.raf=requestAnimationFrame(splashFrame);};
  const go=()=>{if(!SPLASH.el)return;if(!SPLASH.loaded&&!late()){setTimeout(go,50);return;}
    if(SPLASH.data&&SPLASH.data.on===false&&!/[?&]splash\b/.test(location.search)){splashEnd();return;}
    SPLASH.list=splashScreens();
    const imgs=SPLASH.list.filter(S=>S.logo).map(S=>{const im=new Image();im.src=S.logo;S.img=im;return im.decode?im.decode().catch(()=>{}):new Promise(r=>{im.onload=im.onerror=r;});});
    let done=false;const once=()=>{if(done)return;done=true;start();};
    Promise.all(imgs).then(once);setTimeout(once,8000);};
  go();}
function splashNext(){const el=SPLASH.el;if(!el)return;SPLASH.i++;const S=SPLASH.list[SPLASH.i];
  if(!S){splashEnd();return;}
  el.style.background=S.bg;
  el.innerHTML=`<div class="sp-beat">`+(S.logo?`<img class="sp-logo" alt="" src="${crEsc(S.logo)}" style="height:${S.size}vh">`:
    (S.sub?`<span class="sp-k">${crEsc(S.sub)}</span>`:'')+`<span class="sp-n">${crEsc(S.text)}</span>`)+`</div>`;
  if(S.img&&S.img.complete&&S.img.naturalWidth){const im=el.querySelector('.sp-logo');if(im){S.img.className=im.className;S.img.style.cssText=im.style.cssText;S.img.alt='';im.replaceWith(S.img);}}
  // the screen's own clock: a frame adds at most 50 ms, so a hitch while the game loads pauses the fade instead of skipping it
  SPLASH.tc=0;SPLASH.last=performance.now();SPLASH.skip=0;SPLASH.beat=el.firstChild;splashFrame(SPLASH.last,true);}
// opacity and scale of a screen at time t (ms since it started); also used by Distal's preview (same maths)
function splashAt(S,t,skipAt,skipFrom){const e=x=>x<=0?0:x>=1?1:x*x*(3-2*x),inEnd=S.delay+S.fadeIn,outAt=inEnd+S.hold,end=outAt+S.fadeOut;
  let a;if(skipAt!=null){const d=Math.max(1,Math.min(S.fadeOut||1,350)*skipFrom);a=skipFrom*(1-e((t-skipAt)/d));return {a,k:Math.min(1,t/end),done:t-skipAt>=d};}
  a=t<S.delay?0:t<inEnd?e((t-S.delay)/(S.fadeIn||1)):t<outAt?1:1-e((t-outAt)/(S.fadeOut||1));return {a,k:Math.min(1,t/(end||1)),done:t>=end};}
function splashFrame(now,once){const S=SPLASH.list&&SPLASH.list[SPLASH.i];if(!SPLASH.el||!S)return;
  if(!once){SPLASH.tc+=Math.min(50,Math.max(0,now-SPLASH.last));}SPLASH.last=now;
  const t=SPLASH.tc,r=splashAt(S,t,SPLASH.skip?SPLASH.skipAt:null,SPLASH.skipFrom),z=RM&&RM.matches?1:1+S.zoom/100*r.k;
  if(SPLASH.beat){SPLASH.beat.style.opacity=r.a.toFixed(3);SPLASH.beat.style.transform=`scale(${z.toFixed(4)})`;}
  if(r.done){splashNext();}
  if(!once&&SPLASH.el)SPLASH.raf=requestAnimationFrame(splashFrame);}
// a press (key, button, click): the screen fades out now, if it may be skipped
function splashSkip(){const S=SPLASH.el&&SPLASH.list&&SPLASH.list[SPLASH.i];if(!S||!S.skippable||SPLASH.skip)return;
  const t=SPLASH.tc,r=splashAt(S,t);SPLASH.skip=1;SPLASH.skipAt=t;SPLASH.skipFrom=Math.max(0.001,r.a);}
function splashEnd(){const el=SPLASH.el;SPLASH.el=null;document.documentElement.classList.remove('presplash');cancelAnimationFrame(SPLASH.raf);TITLE.splash=false;TITLE.on=false;
  if(el){el.classList.add('out');setTimeout(()=>el.remove(),600);}
  const d=SPLASH.done;SPLASH.done=null;if(d)d();}

/* ---------------- Settings > Credits ---------------- */
function creditsHTML(){const D=creditsData();
  let music=[];try{const seen=new Set();music=(TRACKS||[]).filter(t=>{const k=(t.title||'')+'|'+(t.artist||'');if(seen.has(k))return false;seen.add(k);return true;});}catch(e){}
  const row=(a,b)=>`<div class="cr-row"><span>${crEsc(a)}</span><b>${crEsc(b)}</b></div>`;
  return `<div class="cr-roll"><div class="cr-top"><div class="cr-game">${crEsc(D.game)}</div>${D.subtitle?`<div class="cr-sub">${crEsc(D.subtitle)}</div>`:''}</div>`+
    D.sections.map(x=>{if(!x)return '';const rows=(x.rows||[]).filter(r=>r&&(r[0]||r[1])).map(r=>row(r[0]||'',r[1]||''));
      if(x.music)rows.push(...(music.length?music.map(t=>row(t.title,t.artist||'Unknown artist')):[]));
      return rows.length?`<section class="cr-sec">${x.title?`<h3>${crEsc(x.title)}</h3>`:''}${rows.join('')}</section>`:'';}).join('')+
    `<div class="cr-end">${crEsc(D.game)}<br><small>${crEsc(D.end||('© '+new Date().getFullYear()+' '+D.developer))}</small></div></div>`;}
const CR={box:null,y:0,hold:0,last:0,n:-1};
onDataFile('credits',o=>{CREDITS.data=o&&typeof o==='object'?o:null;CR.n=-1;if(CR.box&&typeof setSub!=='undefined'&&setSub==='credits'){const y=CR.box.scrollTop;CR.box.innerHTML=creditsHTML();CR.n=typeof TRACKS!=='undefined'?TRACKS.length:0;CR.box.scrollTop=y;}});
(function(){
  if(typeof SET_CARDS==='undefined'||!creditsOn())return;
  SET_CARDS.push({id:'credits',t:'Credits'});
  const sub=$('#set-sub');if(sub&&!sub.querySelector('[data-sub="credits"]')){const b=document.createElement('button');b.className='chip';b.dataset.sub='credits';b.setAttribute('aria-pressed','false');b.textContent='Credits';b.hidden=true;sub.appendChild(b);}
  const grid=document.querySelector('[data-panel=settings] .set-grid');if(!grid)return;
  const box=document.createElement('div');box.className='cardbox cr-box';box.dataset.sub='credits';box.tabIndex=-1;const a=grid.querySelector('.cardbox[data-sub="audio"]');(a?a.parentNode:grid).appendChild(box);CR.box=box;
  const hold=()=>{CR.hold=performance.now();};['wheel','pointerdown','touchstart','keydown'].forEach(ev=>box.addEventListener(ev,hold,{passive:true}));
  box.addEventListener('scroll',()=>{if(Math.abs(box.scrollTop-CR.y)>2)hold();CR.y=box.scrollTop;},{passive:true});
})();
{const base=setArt;setArt=function(id){if(id!=='credits')return base(id);const C='#f1e4c6',Y='#f2b632',N='#0f1f38';
  return `<g style="filter:drop-shadow(5px 6px 0 rgba(5,12,24,.45))"><rect x="78" y="34" width="144" height="196" rx="8" fill="${C}" stroke="${N}" stroke-width="5"/>`+
    `<path d="M150 58l9 19 21 3-15 15 4 21-19-10-19 10 4-21-15-15 21-3z" fill="${Y}" stroke="${N}" stroke-width="4" stroke-linejoin="round"/>`+
    [140,160,180,200].map((y,i)=>`<rect x="${100+(i%2)*10}" y="${y}" width="${100-(i%2)*20}" height="8" rx="4" fill="${N}" opacity="${i?.45:.8}"/>`).join('')+`</g>`+
    `<g transform="translate(150 256)"><rect x="-58" y="-20" width="116" height="40" fill="${Y}" transform="skewX(-12)"/><text x="0" y="10" fill="${N}" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="900" font-style="italic" font-size="26" text-anchor="middle">${crEsc(creditsInfo().developer)}</text></g>`;};}
// fill the page when it opens (the playlist may have loaded since), then roll it slowly
{const base=setSettingsSub;setSettingsSub=function(k){const r=base.apply(this,arguments);if(k==='credits'&&CR.box){const n=(typeof TRACKS!=='undefined'?TRACKS.length:0);
  if(CR.n!==n){CR.n=n;CR.box.innerHTML=creditsHTML();}CR.box.scrollTop=0;CR.y=0;CR.hold=performance.now()+600;}return r;};}
function creditsTick(now){const b=CR.box;if(!b||setSub!=='credits'||$('#hub').hidden||hubTab!=='settings'){CR.last=now;return;}
  const dt=Math.min(0.05,(now-(CR.last||now))/1000);CR.last=now;
  // the right stick (or left stick) scrolls the page by hand
  let sy=0;try{const p=Array.from(navigator.getGamepads?navigator.getGamepads():[]).find(g=>g&&g.connected);if(p){const a=Math.abs(p.axes[3]||0)>0.2?p.axes[3]:Math.abs(p.axes[1]||0)>0.5?p.axes[1]:0;sy=a;}}catch(e){}
  if(sy){b.scrollTop+=sy*dt*520;CR.y=b.scrollTop;CR.hold=now;return;}
  if(now-CR.hold<2500||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(b.scrollTop+b.clientHeight>=b.scrollHeight-1){if(now-CR.hold>6000){b.scrollTop=0;CR.y=0;CR.hold=now;}return;}
  CR.acc=(CR.acc||0)+dt*(+creditsData().roll||28);const s=Math.floor(CR.acc);if(s>0){CR.acc-=s;b.scrollTop+=s;CR.y=b.scrollTop;}}
(function crLoop(now){creditsTick(now||performance.now());requestAnimationFrame(crLoop);})();

/* ---------------- styles ---------------- */
(function(){const st=document.createElement('style');st.id='credits-css';st.textContent=`
#splash{position:fixed;inset:0;z-index:10000;background:#000;display:grid;place-items:center;cursor:pointer;transition:opacity .5s ease,background-color .5s ease}
#splash.out{opacity:0;pointer-events:none}
#splash .sp-beat{grid-area:1/1;display:flex;flex-direction:column;align-items:center;gap:6px;opacity:0;will-change:opacity,transform}
#splash .sp-logo{display:block;max-width:80vw;object-fit:contain}
#splash .sp-k{font:700 italic clamp(16px,2.2vw,26px)/1 'Barlow Condensed',sans-serif;letter-spacing:.32em;text-transform:uppercase;color:#f2b632}
#splash .sp-n{font:900 italic clamp(64px,11vw,150px)/1 'Barlow Condensed',sans-serif;letter-spacing:.02em;text-transform:uppercase;color:#f1e4c6;text-shadow:6px 7px 0 rgba(5,12,24,.55)}
.cr-box{overflow-y:auto;overflow-x:hidden;scrollbar-width:thin}
.cr-roll{width:100%;box-sizing:border-box;flex:0 0 auto;max-width:760px;margin:0 auto;padding:18px 8px 60px;text-align:center}
.cr-top{margin:6px 0 26px}
.cr-game{font:900 italic clamp(34px,4vw,54px)/1 'Barlow Condensed',sans-serif;text-transform:uppercase;color:var(--cream,#f1e4c6)}
.cr-sub{font:700 italic 15px/1 'Barlow Condensed',sans-serif;letter-spacing:.3em;text-transform:uppercase;color:#f2b632;margin-top:8px}
.cr-sec{margin:0 0 26px}
.cr-sec h3{font:800 italic 15px/1 'Barlow Condensed',sans-serif;letter-spacing:.28em;text-transform:uppercase;color:#f2b632;margin:0 0 10px}
.cr-box .cr-row{display:flex!important;width:100%;gap:18px;padding:4px 0;font:500 16px/1.3 'Barlow',sans-serif;color:rgba(241,228,198,.75)}
.cr-box .cr-row>span,.cr-box .cr-row>b{flex:1 1 0!important;min-width:0;width:auto!important}.cr-box .cr-row>span{text-align:right}.cr-box .cr-row>b{text-align:left;font-weight:700;color:var(--cream,#f1e4c6)}
.cr-end{margin-top:40px;font:900 italic 28px/1.2 'Barlow Condensed',sans-serif;text-transform:uppercase;color:var(--cream,#f1e4c6)}
.cr-end small{font:600 13px/1 'Barlow',sans-serif;letter-spacing:.2em;color:rgba(241,228,198,.5)}`;document.head.appendChild(st);})();
