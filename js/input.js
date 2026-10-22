// Flick Cup 2026 · js/input.js
// Picking, pointer pull-and-flick, keyboard and gamepad.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= picking ================= */
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),ground=new THREE.Plane(new THREE.Vector3(0,1,0),0),tmpV=new THREE.Vector3();
function setRay(cx,cy){const r=canvas.getBoundingClientRect();ndc.set(((cx-r.left)/r.width)*2-1,-((cy-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);}
function groundAt(cx,cy){setRay(cx,cy);const p=ray.ray.intersectPlane(ground,tmpV);return p?{x:p.x,z:p.z}:null;}
function toScreen(x,y,z){const v=new THREE.Vector3(x,y,z).project(camera),r=canvas.getBoundingClientRect();return{x:r.left+(v.x+1)/2*r.width,y:r.top+(1-v.y)/2*r.height};}
function pick(cx,cy){
  setRay(cx,cy);const hits=ray.intersectObjects(figGroups.concat(keeperGroups.filter((g,t)=>!S.kOut[t]),kFig.filter((g,t)=>S.kOut[t])),true);
  for(const h of hits){let o=h.object;while(o&&o.userData.id===undefined&&o.userData.keeper===undefined)o=o.parent;if(o)return o.userData.id!==undefined?{fig:o.userData.id}:{keeper:o.userData.keeper};}
  const g=groundAt(cx,cy);if(!g)return null;
  let best=null,bd=3.2;for(let i=0;i<23;i++){if(i===20)continue;const b=bodies[i];if(b.off)continue;const d=Math.hypot(b.x-g.x,b.z-g.z);if(d<bd){bd=d;best={fig:i};}}
  return best;
}
function camBasis(){const fx=cam.look.x-cam.pos.x,fz=cam.look.z-cam.pos.z,L=Math.hypot(fx,fz)||1;return{fx:fx/L,fz:fz/L,rx:-fz/L,rz:fx/L};}
// screen direction (pixels, y down) -> ground direction at the figure, perspective-correct
function screenDirToWorld(ax,ay,id){
  const b=bodies[id],p=toScreen(b.x,0,b.z),g0=groundAt(p.x,p.y);
  if(g0){const g1=groundAt(p.x+ax*60,p.y+ay*60);if(g1){const dx=g1.x-g0.x,dz=g1.z-g0.z;if(Math.hypot(dx,dz)>1e-3)return{dx,dz};}
    const g2=groundAt(p.x-ax*60,p.y-ay*60);if(g2){const dx=g0.x-g2.x,dz=g0.z-g2.z;if(Math.hypot(dx,dz)>1e-3)return{dx,dz};}}
  const B=camBasis();return{dx:B.rx*ax-B.fx*ay,dz:B.rz*ax-B.fz*ay};
}

/* ================= pointer: pull and flick (360, signed pull) ================= */
const ptr={on:false,id:null,mode:null,sx:0,sy:0,ax:0,ay:0,s:0,peak:0,hist:[],dx:0,dz:0};
let lastInput='pointer';
function fullPx(){return Math.max(150,Math.min(innerWidth,innerHeight)*0.27)/clamp((SET.msens||100)/100,0.3,3);}
function localAim(fig,dx,dz,p){
  aimShow={fig,dx,dz,p};
  if(S.mode==='online'&&net.named){const now=performance.now();if(now-(net.lastAim||0)>60){net.lastAim=now;net.named.presence({aim:{s:S.seq,f:fig,x:+dx.toFixed(3),z:+dz.toFixed(3),p:+p.toFixed(3)}}).catch(()=>{});}}
  showMeter(p);
}
function clearAim(){aimShow=null;showMeter(-1);if(S.mode==='online'&&net.named)net.named.presence({aim:null}).catch(()=>{});}
function lockOn(){return document.pointerLockElement===canvas;}
function releaseLock(){$('#vcur').hidden=true;if(lockOn()){try{document.exitPointerLock();}catch(_){}}}
let lockAt=0;
document.addEventListener('pointerlockchange',()=>{
  if(lockOn()){lockAt=performance.now();return;}
  $('#vcur').hidden=true;
  // the browser dropped the lock (usually Esc): treat it as a cancel
  if(ptr.on&&ptr.mode==='pull')cancelPull();
});
document.addEventListener('pointerlockerror',()=>{$('#vcur').hidden=true;});
// a right-click pressed while the left button is held only arrives as a mousedown
document.addEventListener('mousedown',e=>{if(e.button===2&&ptr.on&&ptr.mode==='pull'){e.preventDefault();cancelPull();}},true);
function fire(power,soft){
  ptr.on=false;releaseLock();
  if(!localTurn()||sel<0||power<0.02){clearAim();return;}
  startFlick(sel,ptr.dx,ptr.dz,power,S.phase,soft);
}
// snap = the pull collapsing fast from its recent peak (last ~160 ms). Slow easing off never counts as a snap.
const SNAP_SPEED=3.2;
function recentPeak(){let m=0;for(const h of ptr.hist)if(h.s>m)m=h.s;return m;}
function snapSpeed(){const h=ptr.hist;if(h.length<2)return 0;let pi=0;for(let i=1;i<h.length;i++)if(h[i].s>=h[pi].s)pi=i;const l=h[h.length-1];return (h[pi].s-l.s)/(Math.max(16,l.t-h[pi].t)/1000);}
const snapPower=sp=>ptr.peak*SOFT*(1+clamp((sp-SNAP_SPEED)/6,0,1)/3);
function cancelPull(){
  if(!ptr.on)return;
  const wasPull=ptr.mode==='pull';ptr.on=false;ptr.mode=null;releaseLock();clearAim();
  if(wasPull){flashSub('Flick cancelled');sfx('clack',8);}
}
window.addEventListener('contextmenu',e=>{if(ptr.on||e.target===canvas){e.preventDefault();cancelPull();}});
canvas.addEventListener('pointerdown',e=>{
  ensureAudio();setInput(e.pointerType==='touch'?'touch':'pointer');
  if(e.button===1){e.preventDefault();if(ptr.on&&ptr.mode==='pull'){flashSub('Camera locked while you aim');return;}Object.assign(orb,{on:true,id:e.pointerId,x:e.clientX,y:e.clientY});try{canvas.setPointerCapture(e.pointerId);}catch(_){}return;}
  if(e.button===2){e.preventDefault();cancelPull();return;}
  if(orb.on)return;
  if(DR.placing&&S.mode==='practice'&&e.button===0){const g=groundAt(e.clientX,e.clientY);if(g)placeDrill(g);return;}
  if(ptr.on){if(e.pointerId!==ptr.id)cancelPull();return;}
  if(takeTurn()&&e.button===0){const g=groundAt(e.clientX,e.clientY),sp=takeSpots();let k=-1;if(g)sp.forEach((p,i)=>{if(Math.hypot(p.x-g.x,p.z-g.z)<2.4)k=i;});
    if(k>=0){placeAtSpot(k);return;}const hit=pick(e.clientX,e.clientY);if(hit&&hit.fig!==undefined&&bodies[hit.fig].team===S.active){sel=hit.fig;sfx('tock',8);updateHud();}return;}
  if(!localTurn())return;
  const hit=pick(e.clientX,e.clientY);
  if(hit&&hit.keeper!==undefined&&S.phase==='defend'&&hit.keeper===S.active){Object.assign(ptr,{on:true,mode:'keeper',id:e.pointerId});try{canvas.setPointerCapture(e.pointerId);}catch(_){}return;}
  if(hit&&hit.fig!==undefined){
    if(eligible(hit.fig))sel=hit.fig;
    else if(bodies[hit.fig].team===S.active&&S.phase==='attack')flashSub('That figure has had three flicks in a row. Pick another.');
  }
  if(sel<0)return;
  Object.assign(ptr,{on:true,mode:'pull',id:e.pointerId,sx:e.clientX,sy:e.clientY,px:e.clientX,py:e.clientY,ax:0,ay:0,s:0,peak:0,hist:[{s:0,t:e.timeStamp}],dx:0,dz:0});
  let locking=false;ptr.lockReq=0;
  if(e.pointerType==='mouse'&&SET.lock&&canvas.requestPointerLock){try{ptr.lockReq=performance.now();const r=canvas.requestPointerLock();locking=true;if(r&&r.catch)r.catch(()=>{try{canvas.setPointerCapture(e.pointerId);}catch(_){}});}catch(_){locking=false;}}
  if(!locking){try{canvas.setPointerCapture(e.pointerId);}catch(_){}}
  updateHud();
});
function onPtrMove(e){
  if(orb.on&&e.pointerId===orb.id){
    if(!(e.buttons&4)){orb.on=false;return;}
    if(!(ptr.on&&ptr.mode==='pull')){const cs=(SET.csens||100)/100;cam.yaw+=(e.clientX-orb.x)*0.006*cs;cam.pitch=clamp(cam.pitch+(e.clientY-orb.y)*0.004*cs*(SET.invY?-1:1),-0.75,0.55);}
    orb.x=e.clientX;orb.y=e.clientY;return;
  }
  if(!ptr.on||e.pointerId!==ptr.id)return;
  if(e.pointerType==='mouse'&&(e.buttons&2)){cancelPull();return;}
  if(!localTurn()){ptr.on=false;releaseLock();clearAim();return;}
  if(ptr.mode==='keeper'){const g=groundAt(e.clientX,e.clientY);if(g){const k=keepers[S.active];k.z=k.target=clamp(g.z,-K_RANGE,K_RANGE);sendKeeper();}return;}
  // with the mouse locked, add up raw movement so the pull is never stopped by the window edge
  // browsers can report a bogus jump right as the lock engages, so ignore the first instant and any absurd spike
  if(lockOn()){const mx=e.movementX||0,my=e.movementY||0;if(performance.now()-lockAt>50&&Math.abs(mx)<220&&Math.abs(my)<220){ptr.px+=mx;ptr.py+=my;}const vc=$('#vcur');vc.hidden=false;vc.style.left=clamp(ptr.px,6,innerWidth-6)+'px';vc.style.top=clamp(ptr.py,6,innerHeight-6)+'px';}
  else if(!(ptr.lockReq&&performance.now()-ptr.lockReq<300)){ptr.px=e.clientX;ptr.py=e.clientY;}
  const vx=ptr.sx-ptr.px,vy=ptr.sy-ptr.py,vl=Math.hypot(vx,vy),m=vl/fullPx(),t=e.timeStamp;
  // pull measured along the current aim line
  let s=(ptr.ax||ptr.ay)?(vx*ptr.ax+vy*ptr.ay)/fullPx():m;
  if(ptr.hist.length&&t<ptr.hist[ptr.hist.length-1].t)return;
  ptr.hist.push({s:Math.min(1,s),t});while(ptr.hist.length>2&&t-ptr.hist[0].t>160)ptr.hist.shift();
  const pk=recentPeak(),sp=snapSpeed(),snapping=pk-s>0.06&&sp>SNAP_SPEED;
  if(snapping&&pk>0.08&&s<pk*0.45){ptr.peak=pk;fire(snapPower(sp),false);return;}
  // otherwise the aim simply follows the pointer, all the way round
  if(!snapping&&vl>6){
    ptr.ax=vx/vl;ptr.ay=vy/vl;const w=screenDirToWorld(ptr.ax,ptr.ay,sel);ptr.dx=w.dx;ptr.dz=w.dz;
    s=m;ptr.hist[ptr.hist.length-1].s=Math.min(1,m);
  }
  ptr.s=clamp(s,-1,1);ptr.peak=recentPeak();
  if(ptr.s>0.02&&(ptr.dx||ptr.dz))localAim(sel,ptr.dx,ptr.dz,ptr.s*SOFT);else if(aimShow)clearAim();
}
function onPtrEnd(e,cancel){
  if(!ptr.on||e.pointerId!==ptr.id)return;
  releaseLock();
  if(ptr.mode==='keeper'){ptr.on=false;return;}
  ptr.on=false;
  if(cancel||!localTurn()||!(ptr.dx||ptr.dz)){clearAim();return;}
  const sp=snapSpeed(),pk=recentPeak();
  if(pk>0.08&&sp>SNAP_SPEED&&ptr.s<pk*0.85){ptr.peak=pk;fire(snapPower(sp),false);}
  else if(ptr.s>0.04)fire(ptr.s*SOFT,true);
  else clearAim();
}
window.addEventListener('pointermove',onPtrMove);
window.addEventListener('pointerup',e=>{if(orb.on&&e.pointerId===orb.id&&!(e.buttons&4)){orb.on=false;if(!ptr.on)return;}onPtrEnd(e,false);});
window.addEventListener('pointercancel',e=>onPtrEnd(e,true));
function sendKeeper(){if(S.mode==='online'&&net.named){const now=performance.now();if(now-(net.lastK||0)>60){net.lastK=now;net.named.presence({kz:{s:S.seq,z:+keepers[S.active].z.toFixed(2)}}).catch(()=>{});}}}

/* ================= keyboard ================= */
const keys={};
window.addEventListener('keydown',e=>{
  if(TITLE.on){if(!/^(F\d+|Alt|Control|Shift|Meta|Tab|CapsLock|OS)/.test(e.key)){e.preventDefault();titleGo();}return;}
  if(e.target&&e.target.tagName==='INPUT')return;
  ensureAudio();keys[e.code]=true;if(lastInput==='pad')setInput('pointer');
  if(takeTurn()){const sp=['spot1','spot2','spot3'].findIndex(a=>e.code===KEY(a));if(sp>=0){placeAtSpot(sp);return;}}
  if(takeTurn()&&e.code===KEY('nextFig')){e.preventDefault();cycleSel(e.shiftKey?-1:1);updateHud();return;}
  if(!$('#hub').hidden&&hubTab==='kickoff'){
    if(e.code==='Escape'){e.preventDefault();koBack();return;}
    if(e.code==='KeyQ'||e.code==='ArrowLeft'){e.preventDefault();koStep(-1);return;}
    if(e.code==='KeyE'||e.code==='ArrowRight'){e.preventDefault();koStep(1);return;}
    if(e.code==='Enter'&&(!document.activeElement||document.activeElement===document.body)){e.preventDefault();koGo();return;}}
  if(e.code==='Escape'&&ptr.on){e.preventDefault();cancelPull();return;}
  if(e.code===KEY('menu')){e.preventDefault();if(ptr.on){cancelPull();return;}if(!$('#cam-menu').hidden){closeCamMenu();return;}toggleMenu();return;}
  if(!$('#hub').hidden)return;
  if(e.code===KEY('camera')){cycleCam();return;}
  if(!localTurn())return;
  if(e.code===KEY('skip')){e.preventDefault();if(S.phase==='defend')skipDefend();}
  if(e.code===KEY('nextFig')){e.preventDefault();cycleSel(e.shiftKey?-1:1);}
  if(e.code===KEY('moment'))activateMoment(S.active);
  if(e.code===KEY('music')){ensureAudio();music.next();}
  if(e.code===KEY('keeper')&&localTurn())gkToggle(S.active);
  if(S.phase==='attack'&&S.armed==='finesse'&&S.armedTeam===S.active){if(e.code===KEY('curlL'))setCurl(-1);if(e.code===KEY('curlR'))setCurl(1);}
});
window.addEventListener('keyup',e=>{keys[e.code]=false;});
window.addEventListener('blur',()=>{keys.KeyF=false;});
function setCurl(s){curlSign=s;$('#curl-l').setAttribute('aria-pressed',String(s<0));$('#curl-r').setAttribute('aria-pressed',String(s>0));}

/* ================= gamepad: Skate-style right stick ================= */
const padSt=[];
// spatial focus for controllers: pick the nearest visible control in the pressed direction
// the layer the controller works in: the full-time screen when it is up, otherwise the menu (pack and keyboard have their own)
let PAD_ROOT='#hub';
function padCands(){return [...document.querySelectorAll(PAD_ROOT==='#hub'?'#hub .tabs .tab, #hub [data-panel]:not([hidden]) :is(button,input,select,[tabindex="0"])':PAD_ROOT+' :is(button,input,select,[tabindex="0"])')].filter(el=>{if(el.disabled)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&el.offsetParent!==null&&getComputedStyle(el).visibility!=='hidden';});}
function padFocusEl(){const a=document.activeElement;return a&&a!==document.body&&$(PAD_ROOT).contains(a)?a:null;}
function padZone(el){return !el?'':el.closest('.tabs')?'tabs':el.closest('.subnav')?'sub':'content';}
function padPick(el){if(!el)return;el.focus({preventScroll:true});el.scrollIntoView({block:'nearest',inline:'nearest'});}
function padSubBtns(){const pn=document.querySelector('#hub [data-panel]:not([hidden])'),nav=pn&&pn.querySelector('.subnav');return nav&&!nav.hidden&&nav.offsetParent?[...nav.querySelectorAll('button')].filter(b=>!b.disabled&&b.offsetParent):[];}
function padNav(dir){
  const z=padZone(padFocusEl());
  // tabs and sub-menus: left and right switch straight away, up and down move between the rows
  if(z==='tabs'||z==='sub'){
    if(ret.on)retShow(false);document.body.classList.add('padnav');
    const cur=padFocusEl();
    if(dir==='l'||dir==='r'){
      if(z==='tabs'){stepTab(dir==='r'?1:-1);padPick(document.querySelector('.tab[aria-selected="true"]'));return;}
      const bs=padSubBtns();let k=bs.indexOf(cur);k=(k<0?0:k+(dir==='r'?1:-1)+bs.length)%bs.length;bs[k].click();padPick(bs[k]);return;}
    if(dir==='u'){if(z==='sub')padPick(document.querySelector('.tab[aria-selected="true"]'));return;}
    if(z==='tabs'){const mem=PAD_MEM[hubTab];if(mem&&mem.isConnected&&mem.offsetParent&&!mem.disabled&&padZone(mem)==='content'){padPick(mem);return;}const bs=padSubBtns();if(bs.length){padPick(bs.find(b=>b.getAttribute('aria-pressed')==='true'||b.getAttribute('aria-current')==='true')||bs[0]);return;}}
    const list=padCands().filter(el=>padZone(el)==='content'&&el.getBoundingClientRect().top>(cur?cur.getBoundingClientRect().bottom-2:0));
    if(list.length){const c=cur.getBoundingClientRect(),cx=c.left+c.width/2;list.sort((a,b)=>{const ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect();return (ra.top-c.bottom)+Math.abs(ra.left+ra.width/2-cx)*0.5-((rb.top-c.bottom)+Math.abs(rb.left+rb.width/2-cx)*0.5);});padPick(list[0]);}
    return;}
  return padNavContent(dir);
}
function padNavContent(dir){
  if(ret.on)retShow(false);document.body.classList.add('padnav');
  const cur=padFocusEl();
  if(cur&&cur.type==='range'&&(dir==='l'||dir==='r')){const st=+cur.step||1;cur.value=+cur.value+(dir==='r'?st:-st)*Math.max(1,Math.round((+cur.max-+cur.min)/20/st));cur.dispatchEvent(new Event('input',{bubbles:true}));cur.dispatchEvent(new Event('change',{bubbles:true}));return;}
  const list=padCands().filter(el=>padZone(el)==='content');
  if(!cur||!list.length){const bs=padSubBtns();const t=bs.find(b=>b.getAttribute('aria-pressed')==='true'||b.getAttribute('aria-current')==='true')||bs[0];if(!list.length){padPick(t||document.querySelector('.tab[aria-selected="true"]'));return;}}
  if(!cur){const first=list.find(el=>el.closest('[data-panel]'))||list[0];first.focus({preventScroll:false});first.scrollIntoView({block:'nearest'});return;}
  if(cur.matches('input[type=text],input:not([type]),input[type=password]'))cur.blur();
  const c=cur.getBoundingClientRect(),cx=c.left+c.width/2,cy=c.top+c.height/2;let best=null,bs=1e9;
  for(const el of list){if(el===cur)continue;const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,dx=x-cx,dy=y-cy;
    const main=dir==='u'?c.top-r.bottom:dir==='d'?r.top-c.bottom:dir==='l'?c.left-r.right:r.left-c.right,side=dir==='u'||dir==='d'?Math.abs(dx):Math.abs(dy);
    if(main<-6)continue;const sc=main+side*2.2;if(sc<bs){bs=sc;best=el;}}
  if(best){best.focus({preventScroll:true});best.scrollIntoView({block:'nearest',inline:'nearest'});}
  else if(dir==='u'){const bs=padSubBtns();padPick(bs.find(b=>b.getAttribute('aria-pressed')==='true'||b.getAttribute('aria-current')==='true')||bs[0]||document.querySelector('.tab[aria-selected="true"]'));}
}
addEventListener('pointerdown',()=>document.body.classList.remove('padnav'),true);
// right stick drives an on-screen pointer in the menus; A clicks (and drags) where it points
const ret={on:false,x:innerWidth/2,y:innerHeight/2,down:null,hov:null};
function retShow(on){ret.on=on;$('#reticle').hidden=!on;if(!on&&ret.hov){ret.hov.classList.remove('rhov');ret.hov=null;}}
function retEv(el,type,x,y){const o={bubbles:true,cancelable:true,clientX:x,clientY:y,button:0,buttons:type==='pointerup'||type==='mouseup'?0:1,pointerId:77,pointerType:'mouse',isPrimary:true};
  el.dispatchEvent(type.startsWith('pointer')?new PointerEvent(type,o):new MouseEvent(type,o));}
function retPad(gp,st,dt,pressed){
  const rx=gp.axes[2]||0,ry=gp.axes[3]||0,m=Math.hypot(rx,ry);
  const RDZ=clamp((SET.dz||20)/100,0.05,0.5);
  if(m>RDZ){if(!ret.on){retShow(true);const f=padFocusEl();if(f)f.blur();document.body.classList.remove('padnav');}
    const sp=(m-RDZ)/(1-RDZ),v=(250+1300*sp*sp)*dt*clamp((SET.rspeed||100)/100,0.3,3);let nx=ret.x+rx/m*v*Math.min(1,m),ny=ret.y+ry/m*v*Math.min(1,m);
    // past the top or bottom edge: scroll whatever is under the pointer
    if((ny<8&&ry<0)||(ny>innerHeight-8&&ry>0)){const el=document.elementFromPoint(ret.x,ret.y);let sc=el;while(sc&&sc!==document.body&&!(sc.scrollHeight>sc.clientHeight+4&&/auto|scroll/.test(getComputedStyle(sc).overflowY)))sc=sc.parentElement;if(sc&&sc!==document.body)sc.scrollTop+=ry*900*dt;}
    ret.x=clamp(nx,4,innerWidth-4);ret.y=clamp(ny,4,innerHeight-4);
    const R=$('#reticle');R.style.left=ret.x+'px';R.style.top=ret.y+'px';
    if(ret.down)retEv(ret.down.el,'pointermove',ret.x,ret.y);
    const el=document.elementFromPoint(ret.x,ret.y),h=el&&el.closest('button,input,label,select,.tok,.sw,[tabindex]');if(h!==ret.hov){if(ret.hov)ret.hov.classList.remove('rhov');ret.hov=h;if(h)h.classList.add('rhov');}}
  if(!ret.on)return false;
  const a=pressed(0),was=!!st.btn[0];
  if(a&&!was){const el=document.elementFromPoint(ret.x,ret.y);if(el){ret.down={el,x:ret.x,y:ret.y};$('#reticle').classList.add('down');retEv(el,'pointerdown',ret.x,ret.y);retEv(el,'mousedown',ret.x,ret.y);}}
  if(!a&&was&&ret.down){const d=ret.down;ret.down=null;$('#reticle').classList.remove('down');retEv(d.el,'pointerup',ret.x,ret.y);retEv(d.el,'mouseup',ret.x,ret.y);
    if(Math.hypot(ret.x-d.x,ret.y-d.y)<8){const t=d.el.closest('button,input,label,select,a,.tok,.sw,[tabindex]')||d.el;if(t.matches('input[type=text],input:not([type]),input[type=password],input[type=number],textarea'))t.focus();t.click();}}
  return false;
}
addEventListener('mousemove',e=>{if(ret.on&&(Math.abs(e.movementX)+Math.abs(e.movementY))>2)retShow(false);});
function rumble(strong,ms){if(!SET.rumble||lastInput!=='pad')return;try{for(const gp of navigator.getGamepads()){if(gp&&gp.vibrationActuator&&gp.vibrationActuator.playEffect)gp.vibrationActuator.playEffect('dual-rumble',{duration:ms,strongMagnitude:strong,weakMagnitude:Math.min(1,strong+0.2)}).catch(()=>{});}}catch(e){}}
const PAD_MEM={};addEventListener('focusin',e=>{const t=e.target;if(t&&t.closest&&t.closest('#hub [data-panel]')&&typeof hubTab!=='undefined')PAD_MEM[hubTab]=t;});
function pollPads(dt){
  const pads=padsNow();
  if(lastInput!=='pad'&&pads.some(gp=>gp.axes.some(a=>Math.abs(a)>0.4)||gp.buttons.some(b=>b.pressed)))setInput('pad');
  pads.forEach((gp,i)=>{
    const st=padSt[i]||(padSt[i]={btn:[],rs:'idle',peak:0,dx:0,dz:0,peakT:0,nT:0,ls:true});
    const pressed=k=>gp.buttons[k]&&gp.buttons[k].pressed,edge=k=>pressed(k)&&!st.btn[k];
    if(TITLE.on){if(gp.buttons.some((b,k)=>b.pressed&&!st.btn[k]))titleGo();st.btn=gp.buttons.map(b=>b.pressed);return;}
    if(oskOpen()){oskPad(gp,st,dt);st.btn=gp.buttons.map(b=>b.pressed);return;}
    if(typeof PACK!=='undefined'&&PACK.open){st.btn=gp.buttons.map(b=>b.pressed);return;}   // the pack screen reads the pad itself
    const ftOpen=!$('#ft').hidden;PAD_ROOT=ftOpen?'#ft':'#hub';
    if(ftOpen){const lx=gp.axes[0]||0,ly=gp.axes[1]||0,now=performance.now();
      const dir=pressed(12)?'u':pressed(13)?'d':pressed(14)?'l':pressed(15)?'r':Math.abs(ly)>0.6&&Math.abs(ly)>=Math.abs(lx)?(ly<0?'u':'d'):Math.abs(lx)>0.6?(lx<0?'l':'r'):'';
      if(!dir)st.navD='';else if(dir!==st.navD){st.navD=dir;st.navT=now+380;padNavContent(dir);}else if(now>st.navT){st.navT=now+150;padNavContent(dir);}
      if(edge(0)){const f=padFocusEl();if(f)f.click();else padNavContent('d');}
      st.btn=gp.buttons.map(b=>b.pressed);return;}
    const hubOpen=!$('#hub').hidden;
    if(edge(11)&&tokMove<0){ensureAudio();music.next();}
    if(edge(9)){if(hubOpen&&S.running&&S.phase!=='end')closeMenu();else toggleMenu();}
    if(hubOpen){
      if(hubTab==='kickoff'){if(edge(4))koStep(-1);if(edge(5))koStep(1);}else{if(edge(4))stepTab(-1);if(edge(5))stepTab(1);if(edge(6))subStep(-1);if(edge(7))subStep(1);}
      if(tokMove<0&&retPad(gp,st,dt,pressed)){st.btn=gp.buttons.map(b=>b.pressed);return;}
      // D-pad or left stick moves a highlight around the menu, A presses it, B backs out
      const lx=gp.axes[0]||0,ly=gp.axes[1]||0,now=performance.now();
      if(tokMove>=0){
        if(hubTab!=='squad'){tokMove=-1;}
        else{const DZ=clamp((SET.dz||20)/100,0.05,0.5);let mx=Math.abs(lx)>DZ?lx:0,my=Math.abs(ly)>DZ?ly:0;
          const rx2=gp.axes[2]||0,ry2=gp.axes[3]||0;if(Math.abs(rx2)>DZ)mx=rx2;if(Math.abs(ry2)>DZ)my=ry2;
          if(pressed(14))mx=-1;if(pressed(15))mx=1;if(pressed(12))my=-1;if(pressed(13))my=1;
          if(mx||my)squadNudge(tokMove,mx*34*dt,my*34*dt);
          if(edge(2))squadMoveEnd();
          st.btn=gp.buttons.map(b=>b.pressed);return;}}
      // squad tab: the left stick scrolls the page, the D-pad moves the highlight
      const stickNav=hubTab!=='squad';
      if(!stickNav&&Math.abs(ly)>0.25){const hm=document.querySelector('#hub .hub-main');if(hm)hm.scrollTop+=Math.sign(ly)*(Math.abs(ly)-0.25)/0.75*1100*dt;}
      let dir=pressed(12)?'u':pressed(13)?'d':pressed(14)?'l':pressed(15)?'r':!stickNav?'':Math.abs(ly)>0.6&&Math.abs(ly)>=Math.abs(lx)?(ly<0?'u':'d'):Math.abs(lx)>0.6?(lx<0?'l':'r'):'';
      if(!dir)st.navD='';else if(dir!==st.navD){st.navD=dir;st.navT=now+380;padNav(dir);}else if(now>st.navT){st.navT=now+150;padNav(dir);}
      if(edge(0)&&!ret.on){const f=padFocusEl();if(f&&f.classList.contains('tok')){squadMoveStart([...$('#mini').querySelectorAll('.tok')].indexOf(f));}else if(f){if(isTextField(f)){oskShow(f);}else f.click();}else if(hubTab==='play')$('#btn-start').click();else if(hubTab==='kickoff')koGo();}
      if(edge(1)){const f=padFocusEl();if(f&&f.matches('input'))f.blur();else if(hubTab==='kickoff')koBack();else if(!$('#btn-resume').hidden)closeMenu();else if(hubTab==='play'&&menuMode){setMenuMode('');}}
      st.btn=gp.buttons.map(b=>b.pressed);return;}
    let team;if(S.mode==='local')team=pads.length>=2?i:S.active;else if(S.mode==='cpu')team=1-cpuTeam;else team=net.myTeam;
    if(edge(3))cycleCam();
    if(takeTurn()&&team===S.active){if(edge(4))cycleSel(-1);if(edge(5))cycleSel(1);if(edge(0))placeAtSpot(1);if(edge(2))placeAtSpot(0);if(edge(1))placeAtSpot(2);}
    if(localTurn()&&team===S.active&&edge(12))gkToggle(team);
    const mine=localTurn()&&team===S.active;
    const rx=gp.axes[2]||0,ry=gp.axes[3]||0,m=Math.hypot(rx,ry);
    if(mine){
      if(edge(0)&&S.phase==='defend')skipDefend();
      if(edge(2))activateMoment(team);
      if(edge(4))cycleSel(-1);if(edge(5))cycleSel(1);
      if(edge(1)){st.rs='cool';clearAim();}
      const B=camBasis();
      const lt=gp.buttons[6]?gp.buttons[6].value:0,rt=gp.buttons[7]?gp.buttons[7].value:0,tv=rt-lt;
      if(S.phase==='defend'&&Math.abs(tv)>0.1){const k=keepers[S.active],s=Math.sign(B.rz||1);k.z=k.target=clamp(k.z+tv*s*14*dt,-K_RANGE,K_RANGE);sendKeeper();}
      if(S.phase==='attack'&&S.armed==='finesse'&&S.armedTeam===team){if(lt>0.6)setCurl(-1);if(rt>0.6)setCurl(1);}
      const lx=gp.axes[0]||0,ly=gp.axes[1]||0,lm=Math.hypot(lx,ly);
      if(lm>0.6&&st.ls){st.ls=false;selectToward(B.rx*lx-B.fx*ly,B.rz*lx-B.fz*ly);}else if(lm<0.3)st.ls=true;
      const now=performance.now();
      const DZ=clamp((SET.dz||20)/100,0.05,0.5);
      if(st.rs==='cool'){if(m<DZ)st.rs='idle';}
      else if(st.rs==='idle'){if(m>DZ+0.05&&sel>=0){st.rs='load';st.peak=0;st.nT=0;st.dx=0;st.dz=0;}}
      else if(st.rs==='load'){
        if(m>=DZ+0.05){
          const w=screenDirToWorld(-rx/m,-ry/m,sel),sx=w.dx,sz=w.dz;
          if(st.peak>0.3&&(st.dx||st.dz)){const L1=Math.hypot(sx,sz)||1,L2=Math.hypot(st.dx,st.dz)||1;
            if((-sx*st.dx-sz*st.dz)/(L1*L2)>0.5&&m>0.3){const el=now-st.peakT,snap=clamp(1-(el-60)/320,0,1);st.rs='cool';
              if(sel>=0)startFlick(sel,st.dx,st.dz,clamp(st.peak,0,1)*SOFT*(1+snap/3),S.phase,snap<0.15);}
          }
          if(st.rs==='load'){
            if(m>st.peak)st.peak=Math.min(1,m);
            if(m>=st.peak*0.85&&(st.peak<0.3||sx*st.dx+sz*st.dz>0||!(st.dx||st.dz))){st.dx=sx;st.dz=sz;st.peakT=now;}
            if(sel>=0&&(st.dx||st.dz))localAim(sel,st.dx,st.dz,clamp(st.peak,0,1)*SOFT);
          }
          st.nT=0;
        }else{st.nT+=dt;if(st.nT>0.25){st.rs='idle';clearAim();}}
      }
    }else st.rs=m<0.2?'idle':'cool';
    st.btn=gp.buttons.map(b=>b.pressed);
  });
}
function selectToward(wx,wz){
  if(sel<0){autoSelect();return;}
  const s=bodies[sel];let best=-1,bs=-1e9;const L=Math.hypot(wx,wz)||1;
  for(let i=0;i<10;i++){const id=S.active*10+i;if(id===sel||!eligible(id))continue;const b=bodies[id],dx=b.x-s.x,dz=b.z-s.z,d=Math.hypot(dx,dz)||1,c=(dx*wx+dz*wz)/(d*L);if(c<0.45)continue;const sc=c*2-d/40;if(sc>bs){bs=sc;best=id;}}
  if(best>=0)sel=best;
}

