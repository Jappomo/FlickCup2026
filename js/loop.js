// Flick Cup 2026 · js/loop.js
// The one render loop (frame).
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= frame loop ================= */
// The one requestAnimationFrame loop of the game. Every frame the match logic runs (online play, clock, pads), then
// only what is on screen is drawn: the table unless the menu covers it, and the one menu preview that is open.
// In the Distal editor (?distal=edit) the table always draws: the editor shows its scenes through that render.
const LOOP={n:0,hub:null,edit:/[?&]distal=edit/.test(location.search)};
function mainOnScreen(){const h=LOOP.hub||(LOOP.hub=$('#hub'));return LOOP.edit||h.hidden||h.classList.contains('hub-in');}
function previewFrame(){const h=LOOP.hub||(LOOP.hub=$('#hub'));if(h.hidden)return;
  try{if(hubTab==='custom'){if(custSec==='ball')custTick();else if(custSec==='table')tableTick();}
    else if(hubTab==='squad'&&clubSec==='kit')kitTick();else if(hubTab==='album')albumTick();}catch(e){console.error('[preview]',e);}}
let last=performance.now(),remoteT=null,hudTick=0;
const prevBall={x:0,z:0},rollAxis=new THREE.Vector3();
function remoteView(){
  if(S.mode!=='online'||!net.named||sim.running||!S.running)return;
  if(controls(S.active)&&net.myTeam!=null)return;
  const ap=activePeer();if(!ap)return;
  const pr=ap.presence||{};
  if(pr.sim&&pr.sim.s===S.seq&&Array.isArray(pr.sim.p)&&pr.sim.p.length===POSLEN){remoteT=remoteT||new Array(POSLEN);unpackPos(pr.sim.p,remoteT);}
  if(pr.aim&&pr.aim.s===S.seq&&!pr.sim){const f=Math.round(+pr.aim.f);if(f>=0&&f<20)aimShow={fig:f,dx:+pr.aim.x||0,dz:+pr.aim.z||0,p:clamp(+pr.aim.p||0,0,1.4)};}
  else if(!localTurn())aimShow=null;
  if(pr.kz&&pr.kz.s===S.seq&&S.phase==='defend'){const z=+pr.kz.z;if(isFinite(z))keepers[S.active].z=clamp(z,-K_RANGE,K_RANGE);}
}
function tickClock(dt){
  if(S.mode==='practice'||S.mode==='tutorial')return;
  if(!S.running||S.paused||!(S.phase==='attack'||S.phase==='defend'))return;
  if(S.mode==='online'&&!oppPeer()&&net.myTeam!=null)return;
  if(!S.golden)S.clock=Math.max(0,S.clock-dt);
  const txt=fmtClock(S.clock);if(txt!==lastClockTxt){lastClockTxt=txt;$('#clock').textContent=txt;}
  if(S.clock<=0&&!S.golden&&!S.timeUp&&isAuthority()){S.timeUp=true;commit();flashSub("Time's up: finish this turn");}
}
function frame(now){
  requestAnimationFrame(frame);LOOP.n++; // next frame first, so one bad frame cannot stop the game
  showSpots();
  const dt=Math.min(0.05,(now-last)/1000);last=now;
  pollPads(dt);
  if(localTurn()&&!ptr.on&&S.phase==='defend'&&(keys.KeyQ||keys.KeyE)){const k=keepers[S.active],B=camBasis(),s=Math.sign(B.rz||1);k.z=k.target=clamp(k.z+((keys.KeyE?1:0)-(keys.KeyQ?1:0))*s*14*dt,-K_RANGE,K_RANGE);sendKeeper();}
  if(sim.running&&!S.paused)runSim(dt);else remoteView();
  if(remoteT&&!sim.running){const k=1-Math.exp(-dt*16);
    for(let i=0;i<20;i++){const b=bodies[i];b.x=lerp(b.x,remoteT[i*3],k);b.z=lerp(b.z,remoteT[i*3+1],k);b.yaw=remoteT[i*3+2];}
    ball.x=lerp(ball.x,remoteT[60],k);ball.z=lerp(ball.z,remoteT[61],k);keepers[0].z=lerp(keepers[0].z,remoteT[62],k);keepers[1].z=lerp(keepers[1].z,remoteT[63],k);ball.hy=lerp(ball.hy,remoteT[64],k);
    for(let t=0;t<2;t++){const b=GKB(t),j=65+t*3;if(isFinite(remoteT[j])){b.x=lerp(b.x,remoteT[j],k);b.z=lerp(b.z,remoteT[j+1],k);b.yaw=remoteT[j+2];}}}
  tickClock(dt);cpuTick(dt);tutFrame();
  hudTick+=dt;if(hudTick>0.3){hudTick=0;if(S.running)updateHud();}
  for(let i=0;i<20;i++){const g=figGroups[i],b=bodies[i];g.visible=!b.off;g.position.set(b.x,0,b.z);g.rotation.y=b.yaw;}
  syncGK();for(let t=0;t<2;t++){keeperGroups[t].position.set(keepers[t].x,0,keepers[t].z);keeperGroups[t].visible=!S.kOut[t];const b=GKB(t),f=kFig[t];f.visible=!!S.kOut[t];if(f.visible){f.position.set(b.x,0,b.z);f.rotation.y=b.yaw;}}
  const mdx=ball.x-prevBall.x,mdz=ball.z-prevBall.z,md=Math.hypot(mdx,mdz);
  if(md>1e-4&&md<20){rollAxis.set(mdz/md,0,-mdx/md);ballMesh.rotateOnWorldAxis(rollAxis,md/RB);}
  prevBall.x=ball.x;prevBall.z=ball.z;const hy=ball.hy||RB;ballMesh.position.set(ball.x,hy,ball.z);
  ballShadow.visible=hy>RB+0.3;if(ballShadow.visible)ballShadow.position.set(ball.x,0.03,ball.z);
  const showSel=S.running&&(S.phase==='attack'||S.phase==='defend'||S.phase==='take')&&sel>=0&&!sim.running;
  selRing.visible=showSel;if(showSel){const b=bodies[sel];selRing.position.set(b.x,0.05,b.z);selRing.scale.setScalar((RF/1.6)*(1+0.06*Math.sin(now/180)));}
  const banned=S.phase==='defend'&&S.ban&&S.ban.n===S.defN?S.ban.id:-1;
  const lockId=banned>=0?banned:S.phase==='attack'&&S.lastFigCount>=3&&S.lastFig>=0?S.lastFig:-1;
  lockRing.visible=S.running&&lockId>=0&&!sim.running;
  if(lockRing.visible){const b=bodies[lockId];lockRing.position.set(b.x,0.04,b.z);}
  drawAim(sim.running?null:aimShow);
  updateCamera(dt,false);
  if(TITLE.on||TITLE.leaving)titleCam(now);
  if(mainOnScreen())renderer.render(scene,camera);
  previewFrame();
  gpuSweep();
}

