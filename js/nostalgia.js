// Flick Cup 2026 · js/nostalgia.js
// Control schemes and the Nostalgia touch flick (19 Nov 2026).
// Settings > Controls opens with four icons: Mouse and keyboard, Controller, Touch, Nostalgia. The player's pick is saved in
// SET.ctl; with none, the default comes from the build (Distal > Settings > Control mapping > Default control per build,
// saved in data/controls.json "schemes.defaults": web, touch (the web game on a touch-only device), windows, steamdeck).
//  - Mouse and keyboard / Controller: touch mode off; the prompts start on that input (any input still works).
//  - Touch: touch mode on (js/touch.js), the slingshot flick.
//  - Nostalgia (touch only): two steps.
//      1. Set up: pull back on a figure as in Touch to choose the direction and the MAX power, then lift. Nothing fires;
//         the arrow stays and a ring appears around the figure, with a gold start mark on the side behind it.
//      2. Flick: put a finger on the ring's edge at the start mark and slide to the centre (to the figure).
//         Accuracy: the angle of your slide against the line from the mark to the centre bends the flick the same way
//         (miss left, it goes left; 60 degrees off or more is not taken). A wobbly slide adds a little spread.
//         Speed: a slow slide is a soft touch, a fast one reaches the max power you set; a very fast slide goes over it
//         as a power flick (up to a third more, like the mouse snap, and a little harder to keep straight).
//      Touching the figure or the pitch away from the ring starts a new set-up. Two fingers still move the camera.
// Loaded by index.html after setmenu.js (it builds on input.js, controls.js, touch.js and setmenu.js), as a classic script.
'use strict';
const CTL_SCHEMES=[
  {id:'mouse',name:'Mouse and keyboard',tip:'Press on the pitch, pull back, release.'},
  {id:'pad',name:'Controller',tip:'Left stick: pull back, then flick it forward.'},
  {id:'touch',name:'Touch',tip:'Touch, pull back like a slingshot, let go.'},
  {id:'nostalgia',name:'Nostalgia',tip:'Set the direction and max power, then slide from the ring\'s edge to the centre. Straighter is more accurate, faster is stronger.'}];
const CTL_DEF_SCHEMES={web:'mouse',touch:'touch',windows:'mouse',steamdeck:'pad'};
let CTL_DEFAULTS=Object.assign({},CTL_DEF_SCHEMES);
const ctlTouchScheme=id=>id==='touch'||id==='nostalgia';
function ctlPlatform(){return (window.FLICK_BUILD&&FLICK_BUILD.platform)||'web';}
// the build's default: touch-only devices running the web game use the "touch" entry (unless the web default is a touch scheme)
function ctlDefault(){const p=ctlPlatform();let d=CTL_DEFAULTS[p]||CTL_DEF_SCHEMES[p]||'mouse';
  if(UI_TOUCH&&!ctlTouchScheme(d))d=CTL_DEFAULTS.touch||'touch';
  if(ctlTouchScheme(d)&&!TOUCH_SHOW)d=p==='steamdeck'?'pad':'mouse';
  return d;}
function ctlScheme(){let s=SET.ctl;if(!CTL_SCHEMES.some(c=>c.id===s))s=SET.touchOnly?'touch':ctlDefault();
  if(UI_TOUCH&&!ctlTouchScheme(s))s='touch';if(ctlTouchScheme(s)&&!TOUCH_SHOW)s='mouse';return s;}
function ctlAllowed(id){return ctlTouchScheme(id)?TOUCH_SHOW:!UI_TOUCH;}
// data/controls.json "schemes" (controls.js keeps only the button and key map, so read the rest here)
{const base=applyControls;applyControls=function(o){base(o);const D=o&&o.schemes&&o.schemes.defaults;CTL_DEFAULTS=Object.assign({},CTL_DEF_SCHEMES);
  if(D&&typeof D==='object')for(const k of Object.keys(CTL_DEF_SCHEMES))if(CTL_SCHEMES.some(c=>c.id===D[k]))CTL_DEFAULTS[k]=D[k];
  const N=o&&o.schemes&&o.schemes.nostalgia;NOS_K=Object.assign({},NOS_DEF);
  if(N&&typeof N==='object')for(const k of Object.keys(NOS_DEF)){const v=+N[k];if(Number.isFinite(v)&&v>=0)NOS_K[k]=v;}
  if(!CTL_SCHEMES.some(c=>c.id===SET.ctl))applyScheme(true);};}
// touch mode now follows the scheme
touchMode=function(){return ctlTouchScheme(ctlScheme())||UI_TOUCH;};
function applyScheme(quiet){const s=ctlScheme();applyTouch();
  if(!TOUCH.on)setInput(s==='pad'?'pad':'pointer');
  if(!nosOn())nosDisarm();
  ctlSchemesRender();if(typeof renderSetHome==='function'&&SETM.home&&!SETM.home.hidden)renderSetHome();}

/* ---------------- Settings > Controls: the four icons ---------------- */
function ctlIcon(id,on){const C='#f1e4c6',Y='#f2b632',N='#0f1f38',k=on?Y:C;
  if(id==='mouse')return `<rect x="8" y="40" width="54" height="30" rx="4" fill="${C}" stroke="${N}" stroke-width="3"/><g fill="${N}">${[0,1,2].map(r=>[0,1,2,3].map(c=>`<rect x="${14+c*12}" y="${45+r*8}" width="9" height="5"/>`).join('')).join('')}</g><rect x="68" y="22" width="26" height="44" rx="13" fill="${C}" stroke="${N}" stroke-width="3"/><path d="M81 22v17M68 39h26" stroke="${N}" stroke-width="2.5"/><rect x="79" y="27" width="4" height="8" rx="2" fill="${k}"/>`;
  if(id==='pad')return `<path d="M24 34h52c12 0 18 14 21 30 3 17-4 27-14 27-8 0-12-8-18-16H35c-6 8-10 16-18 16-10 0-17-10-14-27 3-16 9-30 21-30z" fill="${C}" stroke="${N}" stroke-width="3"/><path d="M30 50v16M22 58h16" stroke="${N}" stroke-width="5" stroke-linecap="round"/><g fill="${k}" stroke="${N}" stroke-width="2"><circle cx="72" cy="50" r="4.5"/><circle cx="80" cy="58" r="4.5"/><circle cx="64" cy="58" r="4.5"/><circle cx="72" cy="66" r="4.5"/></g>`;
  if(id==='touch')return `<rect x="22" y="10" width="56" height="80" rx="9" fill="${N}" stroke="${C}" stroke-width="3"/><circle cx="50" cy="44" r="15" fill="none" stroke="${k}" stroke-width="3" stroke-dasharray="5 4"/><path d="M50 44L32 68" stroke="${k}" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="68" r="6" fill="${k}"/>`;
  // nostalgia: a ring with the start mark behind the figure and a slide arrow to the centre
  return `<circle cx="50" cy="50" r="34" fill="none" stroke="${C}" stroke-width="3"/><path d="M26 74A34 34 0 0 1 16 50" stroke="${k}" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="50" cy="50" r="8" fill="${k}" stroke="${N}" stroke-width="2"/><path d="M24 70L42 55" stroke="${C}" stroke-width="4" stroke-linecap="round" stroke-dasharray="5 5"/><path d="M36 54l7 0 0 7" stroke="${C}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 42l20-20M70 22h8v8" stroke="${k}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;}
(function(){const st=document.createElement('style');st.id='ctl-schemes-css';
  st.textContent='.ctl-schemes{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:2px 0 14px}'+
  '.ctl-sch{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 8px 10px;background:var(--grain),linear-gradient(180deg,#132c4f,#0f2442);border:2px solid rgba(241,228,198,.16);box-shadow:6px 7px 0 rgba(5,12,24,.4);color:var(--cream);cursor:pointer;font:inherit;transition:transform .12s,border-color .12s}'+
  '.ctl-sch svg{width:74px;height:74px}.ctl-sch b{font-family:var(--f-display);font-weight:900;font-style:italic;font-size:17px;letter-spacing:.03em;text-transform:uppercase;line-height:1.05;text-align:center}'+
  '.ctl-sch small{font-size:11.5px;line-height:1.25;opacity:.75;text-align:center;min-height:2.5em}'+
  '.ctl-sch:is(:hover,.ui-on,.rhov){transform:translateY(-4px);border-color:var(--mus)}'+
  '.ctl-sch[aria-pressed="true"]{border-color:var(--mus);box-shadow:6px 7px 0 rgba(5,12,24,.4),0 0 0 3px var(--mus),0 0 26px rgba(242,182,50,.3)}'+
  '.ctl-sch[aria-pressed="true"]::after{content:"In use";position:absolute;top:-11px;right:8px;padding:2px 8px;background:var(--mus);color:#0f1f38;font:900 italic 12px var(--f-display);text-transform:uppercase;letter-spacing:.06em}'+
  '.ctl-sch:disabled{opacity:.38;cursor:default;transform:none}'+
  '.ctl-sch .def{position:absolute;top:6px;left:8px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;opacity:.6}';
  document.head.appendChild(st);})();
(function(){const box=document.querySelector('.cardbox[data-sub="ctl"]');if(!box)return;
  // the old "Touch only (tablet mode)" switch is now the Touch / Nostalgia icons
  const old=$('#ctl-touch');if(old){const r=old.closest('.srow');if(r)r.remove();}
  const el=document.createElement('div');el.className='ctl-schemes';el.setAttribute('role','radiogroup');el.setAttribute('aria-label','How you play');
  el.innerHTML=CTL_SCHEMES.map(c=>`<button type="button" class="ctl-sch" data-ctl="${c.id}" aria-pressed="false" title="${c.tip.replace(/"/g,'&quot;')}"><span class="def"></span><svg viewBox="0 0 100 100" aria-hidden="true"></svg><b>${c.name}</b><small>${c.tip}</small></button>`).join('');
  box.querySelector('.h').after(el);
  el.querySelectorAll('[data-ctl]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.ctl;if(!ctlAllowed(id))return;
    SET.ctl=id;delete SET.touchOnly;saveSet();applyScheme();sfx('tock',10);
    flashSub(id==='nostalgia'?'Nostalgia: set the direction and max power, then slide from the ring\'s edge to the centre':(CTL_SCHEMES.find(c=>c.id===id).name+' controls'));}));
  if(typeof UI_GROUPS!=='undefined')UI_GROUPS.unshift(['.ctl-schemes','row']);})();
function ctlSchemesRender(){const el=document.querySelector('.ctl-schemes');if(!el)return;const s=ctlScheme(),d=ctlDefault();
  el.querySelectorAll('[data-ctl]').forEach(b=>{const id=b.dataset.ctl,on=id===s,ok=ctlAllowed(id);
    b.setAttribute('aria-pressed',String(on));b.disabled=!ok;
    b.title=ok?CTL_SCHEMES.find(c=>c.id===id).tip:ctlTouchScheme(id)?'Needs a touchscreen.':'This device has only a touchscreen.';
    b.querySelector('.def').textContent=id===d?'Default':'';
    const svg=b.querySelector('svg'),a=ctlIcon(id,on);if(svg.__a!==a){svg.__a=a;svg.innerHTML=a;}});}
// the Controls card on the Settings landing shows the scheme in use
{const base=setArt;setArt=function(id){if(id!=='ctl')return base(id);const s=ctlScheme();
  if(s==='nostalgia'){const C='#f1e4c6',Y='#f2b632',N='#0f1f38';
    return `<g style="filter:drop-shadow(5px 6px 0 rgba(5,12,24,.45))"><rect x="70" y="40" width="160" height="190" rx="18" fill="${N}" stroke="${C}" stroke-width="5"/><circle cx="150" cy="128" r="54" fill="none" stroke="${C}" stroke-width="4"/>`+
      `<path d="M112 166A54 54 0 0 1 96 128" stroke="${Y}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M110 162L138 138" stroke="${C}" stroke-width="5" stroke-dasharray="8 7" stroke-linecap="round"/><circle cx="150" cy="128" r="12" fill="${Y}" stroke="${N}" stroke-width="3"/></g>`+
      `<g transform="translate(150 256)"><rect x="-90" y="-20" width="180" height="40" fill="${Y}" transform="skewX(-12)"/><text x="0" y="10" fill="${N}" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="900" font-style="italic" font-size="26" text-anchor="middle">Nostalgia</text></g>`;}
  return base(id);};}

/* ---------------- Nostalgia flick ---------------- */
const NOS={armed:false,fig:-1,dx:0,dz:0,max:0,slide:null,ov:null,g:null,flash:null,aimT:0,drawn:false};
// slide speed in ring radii per second (a ring is 70-150 px): slow = the weakest, below soft = a soft touch, full = the max
// power you set, full + over = a power flick at its strongest. Tunable in data/controls.json "schemes.nostalgia".
const NOS_DEF={slow:1,soft:3,full:8,over:8,aim:0.6,wobble:0.35};
let NOS_K=Object.assign({},NOS_DEF);
function nosOn(){return TOUCH.on&&ctlScheme()==='nostalgia';}
function nosR(){return clamp(Math.min(innerWidth,innerHeight)*0.15,70,150);}
function nosDisarm(){if(!NOS.armed&&!NOS.slide)return;NOS.armed=false;NOS.slide=null;}
// the ring sits on the figure; u = the flick's direction on screen (from the start mark to the centre)
function nosGeo(){const b=bodies[NOS.fig];if(!b)return null;const c=toScreen(b.x,1.2,b.z),p0=toScreen(b.x,0,b.z),L=Math.hypot(NOS.dx,NOS.dz)||1,
  p1=toScreen(b.x+NOS.dx/L*4,0,b.z+NOS.dz/L*4);let ux=p1.x-p0.x,uy=p1.y-p0.y;const ul=Math.hypot(ux,uy);
  if(ul<1e-3){const B=camBasis();ux=NOS.dx*B.rx+NOS.dz*B.rz;uy=-(NOS.dx*B.fx+NOS.dz*B.fz);}const l=Math.hypot(ux,uy)||1;
  const R=nosR();return{cx:c.x,cy:c.y,ux:ux/l,uy:uy/l,R,mx:c.x-ux/l*R,my:c.y-uy/l*R};}
// step 1: the touch pull ends in "fire"; in Nostalgia it sets the flick up instead of firing
{const base=fire;fire=function(power,soft){
  if(!nosOn())return base(power,soft);
  ptr.on=false;releaseLock();
  if(!localTurn()||sel<0||power<0.02||!(ptr.dx||ptr.dz)){clearAim();nosDisarm();return;}
  const max=clamp(soft?power:(ptr.peak||0)*SOFT,0.05,SOFT);
  Object.assign(NOS,{armed:true,fig:sel,dx:ptr.dx,dz:ptr.dz,max,slide:null,aimT:0});
  localAim(sel,NOS.dx,NOS.dz,max);sfx('tock',10);flashSub('Max power '+Math.round(max/SOFT*100)+'%: slide from the gold mark to the centre');};}
function nosAcc(err){return Math.max(0,Math.round(100-Math.abs(err)*180/Math.PI/60*100));}
// step 2: slide from the ring's edge to the centre
function nosRelease(){const s=NOS.slide,G=nosGeo();NOS.slide=null;if(!G||!s)return;
  const P=s.pts,a=P[0],z=P[P.length-1],gx=z.x-a.x,gy=z.y-a.y,gl=Math.hypot(gx,gy);
  if(gl<G.R*0.3){flashSub('Slide all the way to the centre');return;}
  const err=Math.atan2(G.ux*gy-G.uy*gx,G.ux*gx+G.uy*gy);
  if(Math.abs(err)>Math.PI/3){flashSub('Slide from the gold mark toward the centre');sfx('clack',6);return;}
  // wobble: the furthest the finger strayed from its own straight line, against the slide's length
  let wob=0;for(const p of P){const d=Math.abs((p.x-a.x)*gy-(p.y-a.y)*gx)/gl;if(d>wob)wob=d;}wob=Math.min(1,wob/gl);
  const t=Math.max(0.03,(z.t-a.t)/1000),v=(gl/G.R)/t;
  const K=NOS_K;let power=NOS.max*clamp((v-K.slow)/Math.max(0.1,K.full-K.slow),0.1,1),over=0;
  if(v>K.full){over=clamp((v-K.full)/Math.max(0.1,K.over),0,1);power*=1+over/3;}
  power=Math.min(power,1);const soft=v<K.soft;
  let off=err*K.aim+(Math.random()*2-1)*wob*K.wobble;off*=1+over*0.5;off=clamp(off,-0.5,0.5);
  const c=Math.cos(off),sn=Math.sin(off),fx=G.ux*c-G.uy*sn,fy=G.ux*sn+G.uy*c;
  const fig=NOS.fig;NOS.armed=false;
  if(!localTurn()||sel!==fig){clearAim();return;}
  const w=screenDirToWorld(fx,fy,fig);ptr.dx=w.dx;ptr.dz=w.dz;
  NOS.flash={x:G.cx,y:G.cy,R:G.R,t:performance.now(),soft,over};
  startFlick(fig,w.dx,w.dz,power,S.phase,soft);
  flashSub(nosAcc(err)+'% accurate'+(over>0.05?' · Power flick!':soft?' · Soft touch':''));}
addEventListener('pointerdown',e=>{
  if(!nosOn()||!NOS.armed||e.pointerType!=='touch'||e.target!==canvas||TOUCH.gest||TOUCH.pts.size>1||NOS.slide)return;
  const G=nosGeo();if(!G)return;const d=Math.hypot(e.clientX-G.cx,e.clientY-G.cy);
  if(d<G.R*0.55||d>G.R*1.6)return;                      // on the figure or away from the ring: js/input.js starts a new set-up
  e.stopImmediatePropagation();e.preventDefault();TOUCH.tap=null;
  NOS.slide={id:e.pointerId,pts:[{x:e.clientX,y:e.clientY,t:e.timeStamp}]};try{canvas.setPointerCapture(e.pointerId);}catch(_){}
},true);
addEventListener('pointermove',e=>{const s=NOS.slide;if(!s||e.pointerId!==s.id)return;e.stopImmediatePropagation();
  if(TOUCH.gest){NOS.slide=null;return;}
  s.pts.push({x:e.clientX,y:e.clientY,t:e.timeStamp});
  const G=nosGeo();if(!G)return;const a=s.pts[0],L0=(G.cx-a.x)*G.ux+(G.cy-a.y)*G.uy,along=(e.clientX-a.x)*G.ux+(e.clientY-a.y)*G.uy;
  if(L0>0&&along>=L0*0.85)nosRelease();                // reached the centre: the flick goes
},true);
addEventListener('pointerup',e=>{const s=NOS.slide;if(!s||e.pointerId!==s.id)return;e.stopImmediatePropagation();
  const G=nosGeo(),a=s.pts[0],z=s.pts[s.pts.length-1];
  const L0=G?(G.cx-a.x)*G.ux+(G.cy-a.y)*G.uy:0,along=G?(z.x-a.x)*G.ux+(z.y-a.y)*G.uy:0;
  if(G&&L0>0&&along>=L0*0.4)nosRelease();else{NOS.slide=null;flashSub('Slide all the way to the centre');}},true);
addEventListener('pointercancel',e=>{if(NOS.slide&&e.pointerId===NOS.slide.id)NOS.slide=null;},true);

/* ---------------- Nostalgia overlay ---------------- */
function nosOverlay(){if(NOS.ov)return;const c=document.createElement('canvas');c.id='nos-ov';
  c.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none';canvas.after(c);NOS.ov=c;NOS.g=c.getContext('2d');}
function nosDraw(){requestAnimationFrame(nosDraw);
  // keep the set-up only while it still makes sense
  if(NOS.armed&&(!nosOn()||!localTurn()||sel!==NOS.fig||(ptr.on&&ptr.mode==='pull'))){const pulling=ptr.on&&ptr.mode==='pull';NOS.armed=false;NOS.slide=null;if(!pulling)clearAim();}
  const now=performance.now(),F=NOS.flash;
  if(NOS.armed&&!NOS.slide&&now-NOS.aimT>250){NOS.aimT=now;localAim(NOS.fig,NOS.dx,NOS.dz,NOS.max);}
  if(!NOS.armed&&!F&&!NOS.drawn)return;nosOverlay();
  const c=NOS.ov,g=NOS.g,dpr=Math.min(devicePixelRatio||1,2),W=innerWidth,H=innerHeight;
  if(c.width!==Math.round(W*dpr)||c.height!==Math.round(H*dpr)){c.width=Math.round(W*dpr);c.height=Math.round(H*dpr);}
  g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);NOS.drawn=false;g.lineCap='round';g.lineJoin='round';
  const G=NOS.armed&&nosGeo();
  if(G){NOS.drawn=true;const{cx,cy,ux,uy,R,mx,my}=G,ang=Math.atan2(-uy,-ux),pw=NOS.max/SOFT;
    // the ring, its start mark (gold, behind the figure) and the max power as an arc inside
    g.lineWidth=3;g.strokeStyle='rgba(241,228,198,.55)';g.beginPath();g.arc(cx,cy,R,0,Math.PI*2);g.stroke();
    g.lineWidth=10;g.strokeStyle='rgba(242,182,50,.9)';g.beginPath();g.arc(cx,cy,R,ang-0.42,ang+0.42);g.stroke();
    g.lineWidth=5;g.strokeStyle='rgba(255,255,255,.18)';g.beginPath();g.arc(cx,cy,R*0.3,0,Math.PI*2);g.stroke();
    g.strokeStyle=pw>0.85?'rgba(255,120,60,.9)':pw>0.5?'rgba(255,205,70,.9)':'rgba(150,235,140,.9)';g.beginPath();g.arc(cx,cy,R*0.3,-Math.PI/2,-Math.PI/2+pw*Math.PI*2);g.stroke();
    g.font='800 12px system-ui,sans-serif';g.fillStyle='rgba(255,255,255,.85)';g.textAlign='center';g.fillText('MAX '+Math.round(pw*100)+'%',cx,cy-R*0.3-8);
    if(!NOS.slide){
      // the path to slide: chevrons from the mark to the centre
      g.setLineDash([6,8]);g.lineWidth=2.5;g.strokeStyle='rgba(255,255,255,.45)';g.beginPath();g.moveTo(mx,my);g.lineTo(cx-ux*R*0.3,cy-uy*R*0.3);g.stroke();g.setLineDash([]);
      const ph=(now/700)%1;g.lineWidth=3;
      for(let k=0;k<3;k++){const f=(k/3+ph)%1,px=mx+ux*R*0.7*f,py=my+uy*R*0.7*f,w=8;g.strokeStyle=`rgba(255,255,255,${0.2+0.6*Math.sin(f*Math.PI)})`;
        g.beginPath();g.moveTo(px-ux*w-uy*w,py-uy*w+ux*w);g.lineTo(px,py);g.lineTo(px-ux*w+uy*w,py-uy*w-ux*w);g.stroke();}
      const pulse=1+0.15*Math.sin(now/180);g.fillStyle='rgba(242,182,50,.35)';g.beginPath();g.arc(mx,my,16*pulse,0,Math.PI*2);g.fill();}
    else{const P=NOS.slide.pts,a=P[0],z=P[P.length-1],gx=z.x-a.x,gy=z.y-a.y,gl=Math.hypot(gx,gy);
      const err=gl>8?Math.atan2(ux*gy-uy*gx,ux*gx+uy*gy):0,acc=nosAcc(err)/100,col=acc>0.85?'150,235,140':acc>0.6?'255,205,70':'255,110,80';
      // where a perfect slide goes, and the finger's trail coloured by how straight it is
      g.setLineDash([4,6]);g.lineWidth=2;g.strokeStyle='rgba(255,255,255,.3)';g.beginPath();g.moveTo(a.x,a.y);g.lineTo(cx,cy);g.stroke();g.setLineDash([]);
      g.lineWidth=7;g.strokeStyle=`rgba(${col},.85)`;g.beginPath();P.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.stroke();
      g.fillStyle=`rgba(${col},.35)`;g.beginPath();g.arc(z.x,z.y,20,0,Math.PI*2);g.fill();
      g.fillStyle='rgba(255,255,255,.9)';g.beginPath();g.arc(cx,cy,6,0,Math.PI*2);g.fill();}}
  if(F){const t=(now-F.t)/420;if(t>=1)NOS.flash=null;else{NOS.drawn=true;const r=F.R*(1-0.8*t);g.lineWidth=6*(1-t);
    g.strokeStyle=F.over>0.05?`rgba(255,120,60,${1-t})`:F.soft?`rgba(150,235,140,${1-t})`:`rgba(255,215,90,${1-t})`;g.beginPath();g.arc(F.x,F.y,r,0,Math.PI*2);g.stroke();}}}
requestAnimationFrame(nosDraw);
applyScheme(true);
