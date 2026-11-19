// Flick Cup 2026 · js/touch.js
// Touch mode ("tablet mode", 18 Nov 2026). Settings > Controls > Touch only: the game takes touch input only and
// behaves like a tablet. Always on for touch-only devices (iPad, phones); a switch on the Steam Deck build and any
// device with a touchscreen.
// While it is on:
//  - controllers are ignored (padsNow() returns none), the prompts and the title speak touch, no mouse lock;
//  - a figure is picked by the nearest own figure to the finger (fat-finger radius), not only by an exact hit;
//  - the pull shows a slingshot under the finger: anchor ring (full power at its edge), band to the finger, power
//    arc, a cancel ring when you come back to the anchor (lift there: no flick), and a flash on a snap;
//  - two fingers move the camera (drag to orbit, pinch to zoom) when no flick is being pulled; a second finger
//    during a real pull still cancels it; a double tap on empty cloth resets the camera;
//  - mouse-only and controller-only settings are hidden; Interface size goes up to 140% the first time.
// The flick itself (pull, aim, snap or soft release) is the same code as the mouse (js/input.js), so feel and
// online play stay identical. Loaded by index.html after uiscale.js, as a classic script (shared scope).
'use strict';
const TOUCH={on:false,pts:new Map(),gest:null,tap:null,pullT:0,flash:null,ov:null,g:null,raf:0};
const TOUCH_DEVICE=('ontouchstart' in window)||(navigator.maxTouchPoints||0)>0;
const TOUCH_SHOW=TOUCH_DEVICE||!!(window.FLICK_BUILD&&window.FLICK_BUILD.platform==='steamdeck')||/[?&]distal=/.test(location.search);
function touchMode(){return !!SET.touchOnly||UI_TOUCH;}
// ---------------- hooks ----------------
{const base=setInput;setInput=function(k){return base(TOUCH.on?'touch':k);};}
{const base=padsNow;padsNow=function(){return TOUCH.on?[]:base();};}
// fat finger: an exact hit on your own figure or a keeper wins; otherwise the nearest own figure within reach
{const base=pick;pick=function(cx,cy){const h=base(cx,cy);if(!TOUCH.on)return h;
  if(h&&h.keeper!==undefined)return h;if(h&&h.fig!==undefined&&bodies[h.fig].team===S.active)return h;
  const R=Math.max(34,Math.min(innerWidth,innerHeight)*0.08);let best=null,bd=R;
  for(let i=0;i<20;i++){const b=bodies[i];if(!b||b.off||b.team!==S.active)continue;const p=toScreen(b.x,1.2,b.z),d=Math.hypot(p.x-cx,p.y-cy);if(d<bd){bd=d;best={fig:i};}}
  return best||h;};}
// ---------------- the switch ----------------
function applyTouch(){
  const was=TOUCH.on;TOUCH.on=touchMode();document.documentElement.classList.toggle('touchmode',TOUCH.on);
  if(TOUCH.on){if(!SET.touchUi){SET.touchUi=1;if((SET.ui||100)<140){SET.ui=140;try{const r=$('#gfx-ui');if(r){r.value=140;r.dispatchEvent(new Event('input'));}}catch(e){}}saveSet();applyUiScale();}
    lastInput='';setInput('touch');if(ptr.on&&ptr.mode==='pull'&&ptr.lockReq)cancelPull();}
  else if(was)setInput('pointer');
  ['ctl-lock','ctl-wasd','ctl-dz','ctl-rspeed','ctl-rumble'].forEach(id=>{const r=$('#'+id);const row=r&&r.closest('.srow');if(row)row.hidden=TOUCH.on;});
  const ms=document.querySelector('label[for="ctl-msens"]');if(ms)ms.textContent=TOUCH.on?'Pull sensitivity':'Mouse pull sensitivity';
  const t=$('#ctl-touch');if(t){t.checked=TOUCH.on;t.disabled=UI_TOUCH;}
  if(typeof updateHud==='function')try{updateHud();}catch(e){}}
// tablet look: no keyboard/controller prompt bar, focus ring or button map
(function(){const st=document.createElement('style');st.id='touch-css';
  st.textContent='html.touchmode #ui-bar,html.touchmode #ui-ring,html.touchmode #set-sub [data-sub="map"],html.touchmode #set-sub .glyph,html.touchmode .glyph{display:none!important}';
  document.head.appendChild(st);})();
(function(){const box=document.querySelector('.cardbox[data-sub="ctl"]');if(!box||!TOUCH_SHOW)return;
  const row=document.createElement('div');row.className='srow';
  row.title=UI_TOUCH?'This device has only a touchscreen, so touch mode is always on.':'The game takes touch input only and plays like a tablet: controllers are ignored, figures are easier to pick, two fingers move the camera. On the Steam Deck, set the touchscreen to native touch in Steam (controller settings) if taps act like a mouse.';
  row.innerHTML='<label for="ctl-touch">Touch only (tablet mode)</label><span class="tog"><input type="checkbox" id="ctl-touch"><i></i></span>';
  const h=box.querySelector('.h');h.after(row);
  $('#ctl-touch').addEventListener('change',e=>{SET.touchOnly=e.target.checked;saveSet();applyTouch();flashSub(TOUCH.on?'Touch mode on: controllers are ignored':'Touch mode off');});})();
// ---------------- two-finger camera, double tap ----------------
function touchPair(){const a=[...TOUCH.pts.values()];return a.length<2?null:{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2,d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1};}
addEventListener('pointerdown',e=>{
  if(!TOUCH.on||e.pointerType!=='touch'||e.target!==canvas)return;
  TOUCH.pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(TOUCH.gest){e.stopImmediatePropagation();return;}                    // a third finger does nothing
  if(TOUCH.pts.size===2){
    if(ptr.on&&ptr.mode==='keeper')return;
    if(ptr.on&&ptr.mode==='pull'){
      // a pull that has barely moved becomes a camera move; a real pull is cancelled by js/input.js
      if(Math.abs(ptr.s||0)<0.06&&(ptr.peak||0)<0.08){ptr.on=false;ptr.mode=null;releaseLock();clearAim();}else return;}
    const p=touchPair();TOUCH.gest={x:p.x,y:p.y,d:p.d,z:cam.zoom};TOUCH.tap=null;e.stopImmediatePropagation();return;}
  TOUCH.pullT=performance.now();
  // double tap on empty cloth (not on your own figure): reset the camera
  const now=performance.now(),T=TOUCH.tap;
  if(T&&now-T.t<320&&Math.hypot(e.clientX-T.x,e.clientY-T.y)<40){const h=pick(e.clientX,e.clientY);
    if(!(h&&(h.keeper!==undefined||(h.fig!==undefined&&bodies[h.fig].team===S.active)))){TOUCH.tap=null;if(typeof resetCam==='function')resetCam();e.stopImmediatePropagation();return;}}
  TOUCH.tap={t:now,x:e.clientX,y:e.clientY};
},true);
addEventListener('pointermove',e=>{
  if(!TOUCH.on||e.pointerType!=='touch'||!TOUCH.pts.has(e.pointerId))return;
  const q=TOUCH.pts.get(e.pointerId);q.x=e.clientX;q.y=e.clientY;
  if(TOUCH.tap&&Math.hypot(e.clientX-TOUCH.tap.x,e.clientY-TOUCH.tap.y)>24)TOUCH.tap=null;
  if(!TOUCH.gest)return;e.stopImmediatePropagation();
  const p=touchPair();if(!p)return;const G=TOUCH.gest,cs=(SET.csens||100)/100;
  cam.yaw+=(p.x-G.x)*0.006*cs;cam.pitch=clamp(cam.pitch+(p.y-G.y)*0.004*cs*(SET.invY?-1:1),-0.75,0.55);
  cam.zoom=clamp(G.z*G.d/p.d,0.5,1.7);G.x=p.x;G.y=p.y;
},true);
function touchUp(e){if(!TOUCH.pts.has(e.pointerId))return;TOUCH.pts.delete(e.pointerId);
  if(TOUCH.gest){e.stopImmediatePropagation();if(TOUCH.pts.size<2){TOUCH.gest=null;TOUCH.pts.clear();}}}
addEventListener('pointerup',touchUp,true);addEventListener('pointercancel',touchUp,true);
// ---------------- slingshot overlay ----------------
function touchOverlay(){if(TOUCH.ov)return;const c=document.createElement('canvas');c.id='touch-ov';
  c.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none';canvas.after(c);TOUCH.ov=c;TOUCH.g=c.getContext('2d');}
// the flick fired: flash where the pull started (looked up from the last frame drawn)
{const base=fire;fire=function(power,soft){if(TOUCH.on&&TOUCH.last)TOUCH.flash={x:TOUCH.last.x,y:TOUCH.last.y,t:performance.now(),soft,p:power};return base(power,soft);};}
function touchDraw(){
  requestAnimationFrame(touchDraw);
  const pulling=TOUCH.on&&ptr.on&&ptr.mode==='pull'&&lastInput==='touch',F=TOUCH.flash,now=performance.now();
  if(!pulling&&!F&&!TOUCH.drawn)return;touchOverlay();
  const c=TOUCH.ov,g=TOUCH.g,dpr=Math.min(devicePixelRatio||1,2),W=innerWidth,H=innerHeight;
  if(c.width!==Math.round(W*dpr)||c.height!==Math.round(H*dpr)){c.width=Math.round(W*dpr);c.height=Math.round(H*dpr);}
  g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);TOUCH.drawn=false;
  if(pulling){TOUCH.drawn=true;TOUCH.last={x:ptr.sx,y:ptr.sy};
    const ax=ptr.sx,ay=ptr.sy,fx=ptr.px,fy=ptr.py,R=fullPx(),s=clamp(ptr.s,0,1),pk=ptr.peak||0;
    const cancel=pk>0.1&&s<0.04,col=cancel?'255,90,80':s>0.85?'255,120,60':s>0.5?'255,205,70':'150,235,140';
    g.lineCap='round';
    // full-power ring and the power arc
    g.lineWidth=2;g.strokeStyle='rgba(255,255,255,.22)';g.setLineDash([4,7]);g.beginPath();g.arc(ax,ay,R,0,Math.PI*2);g.stroke();g.setLineDash([]);
    const a0=Math.atan2(fy-ay,fx-ax);g.lineWidth=6;g.strokeStyle=`rgba(${col},.85)`;g.beginPath();g.arc(ax,ay,R,a0-s*Math.PI,a0+s*Math.PI);g.stroke();
    // the band from the anchor to the finger
    const d=Math.hypot(fx-ax,fy-ay);
    if(d>4){g.lineWidth=3+5*s;g.strokeStyle=`rgba(${col},.55)`;g.beginPath();g.moveTo(ax,ay);g.lineTo(fx,fy);g.stroke();
      // chevrons pointing the way the flick goes (back toward and past the anchor)
      const ux=(ax-fx)/d,uy=(ay-fy)/d,ph=(now/420)%1;g.lineWidth=3;g.strokeStyle=`rgba(255,255,255,${0.25+0.5*s})`;
      for(let k=0;k<3;k++){const t=((k/3+ph)%1)*Math.min(d,R),cx=fx+ux*t,cy=fy+uy*t,w=7+4*s;g.beginPath();g.moveTo(cx-ux*w-uy*w,cy-uy*w+ux*w);g.lineTo(cx,cy);g.lineTo(cx-ux*w+uy*w,cy-uy*w-ux*w);g.stroke();}}
    // anchor: a cancel ring when you come back to it after pulling
    g.lineWidth=2.5;g.strokeStyle=cancel?'rgba(255,90,80,.95)':'rgba(255,255,255,.7)';g.beginPath();g.arc(ax,ay,cancel?20:11,0,Math.PI*2);g.stroke();
    if(cancel){g.beginPath();g.moveTo(ax-7,ay-7);g.lineTo(ax+7,ay+7);g.moveTo(ax+7,ay-7);g.lineTo(ax-7,ay+7);g.stroke();
      g.font='600 13px system-ui,sans-serif';g.fillStyle='rgba(255,255,255,.9)';g.textAlign='center';g.fillText('Lift here to cancel',ax,ay-28);}
    // the finger
    g.fillStyle=`rgba(${col},.35)`;g.beginPath();g.arc(fx,fy,18+10*s,0,Math.PI*2);g.fill();}
  if(F){const t=(now-F.t)/380;if(t>=1)TOUCH.flash=null;else{TOUCH.drawn=true;const r=14+70*t;g.lineWidth=5*(1-t);g.strokeStyle=F.soft?`rgba(150,235,140,${1-t})`:`rgba(255,215,90,${1-t})`;g.beginPath();g.arc(F.x,F.y,r,0,Math.PI*2);g.stroke();}}
}
requestAnimationFrame(touchDraw);
applyTouch();
