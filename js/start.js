// Flick Cup 2026 · js/start.js
// Title screen, then the game starts (render loop, online room).
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= title screen ================= */
// First screen: the live table with a slow orbit, "press any button". The press unlocks audio (browsers need a gesture),
// tells us controller or keyboard/mouse, then the hub fades in. Skipped when Distal opens the game.
var TITLE={on:false,leaving:false,t0:0,a0:0};
const RM=matchMedia('(prefers-reduced-motion: reduce)');
function titleMsg(){const pad=lastInput==='pad',touch=lastInput==='touch'||(lastInput==='pointer'&&matchMedia('(pointer: coarse)').matches);
  $('#t-glyph').hidden=!pad;$('#t-msg').textContent=pad?'Press any button':touch?'Tap to start':'Click or press any key';
  let pads=[];try{pads=navigator.getGamepads?Array.from(navigator.getGamepads()).filter(p=>p&&p.connected):[];}catch(e){}
  $('#t-pad').hidden=!pads.length;}
function titleCam(now){
  const t=(now-TITLE.t0)/1000,a=TITLE.a0+(RM.matches?0:t*0.045),R=HX*1.55*clamp(1.3/Math.max(0.3,camera.aspect),1,2.4),H=HX*0.62+(RM.matches?0:Math.sin(t*0.21)*HX*0.05);
  const p=new THREE.Vector3(Math.cos(a)*R,H,Math.sin(a)*R*0.82),l=new THREE.Vector3(0,0,0);
  if(TITLE.leaving){const k=clamp((now-TITLE.leaving)/(TITLE.dur||650),0,1),e=k*k*(3-2*k);p.lerp(cam.pos,e);l.lerp(cam.look,e);if(k>=1){TITLE.leaving=false;TITLE.dur=0;}}
  camera.position.copy(p);camera.lookAt(l);camera.updateMatrixWorld();}
function titleShow(){TITLE.on=true;TITLE.t0=performance.now();TITLE.a0=Math.PI*0.62;
  $('#hub').hidden=true;$('#title').hidden=false;document.documentElement.classList.add('titleon');titleMsg();
  try{$('#title').focus({preventScroll:true});}catch(e){}}
function titleGo(){if(!TITLE.on)return;TITLE.on=false;TITLE.leaving=performance.now();
  const el=$('#title');el.classList.add('go');document.documentElement.classList.remove('titleon');
  openMenu();ensureAudio();tone(520,1040,0.18,0.12,'triangle');setTimeout(()=>tone(780,1560,0.22,0.1,'triangle'),90);
  const hub=$('#hub');hub.classList.remove('hub-in');void hub.offsetWidth;hub.classList.add('hub-in');
  setTimeout(()=>{el.hidden=true;el.classList.remove('go');hub.classList.remove('hub-in');},RM.matches?0:720);}
$('#title').addEventListener('pointerdown',e=>{setInput(e.pointerType==='touch'?'touch':'pointer');});
$('#title').addEventListener('click',()=>titleGo());
window.addEventListener('gamepadconnected',()=>{if(TITLE.on)titleMsg();});
window.addEventListener('gamepaddisconnected',()=>{if(TITLE.on)titleMsg();});
if(!/[?&]distal=/.test(location.search))titleShow();
requestAnimationFrame(frame);
initRoom();
window.addEventListener('gamepadconnected',()=>setInput('pad'));
