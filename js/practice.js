// Flick Cup 2026 · js/practice.js
// Practice drills and the tutorial.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= practice + tutorial ================= */
// Both modes are single-player: you are always Reds (team 0, attacking to the right); the CPU plays Blues.
const DR={kind:'3v3',busy:false,placing:false,spot:null,noBlocks:false,stats:{},special:'',timer:0,step:0,layout:'',sel0:-1,k0:0,lockedKind:''};
const RED=[0,1,2,3,4,5,6,7,8,9],BLUE=[10,11,12,13,14,15,16,17,18,19];
const rnd=(a,b)=>a+Math.random()*(b-a);
function bench(active){for(let i=0;i<20;i++){const b=bodies[i];b.off=!active.includes(i);if(b.off){b.x=400+i*8;b.z=400;}b.vx=b.vz=0;}}
function put(id,x,z){const b=bodies[id];b.off=false;b.x=clamp(x,-WALLX+2,WALLX-2);b.z=clamp(z,-WALLZ+2,WALLZ-2);b.yaw=b.team===0?0:Math.PI;b.vx=b.vz=0;}
function leaveDrills(){
  clearTimeout(DR.timer);DR.placing=false;DR.noBlocks=false;
  for(const b of bodies)b.off=false;S.kOut=[0,0];syncGK();
  $('#prac').hidden=true;$('#coach').hidden=true;
}
function drillMode(){return S.mode==='practice'||S.mode==='tutorial';}
function freshState(){
  S.running=true;S.paused=false;S.half=1;S.clock=S.halfLen;S.armed='';S.armedTeam=-1;S.setupLeft=0;S.setupKind='';
  stopAll();keepers[0].z=keepers[1].z=0;keepers[0].target=keepers[1].target=0;
}
// finish a scripted set-up: possession to `team`, select a figure, show a message
function setupDone(team,selId,msg){
  separate();resetPossession(team);S.phase='attack';S.active=team;
  if(selId>=0)selPrefer=selId;S.msg=msg||null;DR.busy=false;commit();
}

/* ---------- hooks into the match rules ---------- */
const BASE={scoreGoal,turnover,setPiece,resolveAttack,resolveDefend,skipDefend,kickoff};
scoreGoal=function(team,own){if(drillMode()&&!DR.busy&&drillEvent('goal',{team,own}))return;BASE.scoreGoal(team,own);};
turnover=function(team,t,sub){if(drillMode()&&!DR.busy&&drillEvent('turnover',{team,title:t,sub}))return;BASE.turnover(team,t,sub);};
setPiece=function(team,kind,px,pz,t,sub){if(drillMode()&&!DR.busy&&drillEvent('setpiece',{team,kind,title:t,sub}))return;BASE.setPiece(team,kind,px,pz,t,sub);};
kickoff=function(team){if(drillMode()&&!DR.busy&&drillEvent('kickoff',{team}))return;BASE.kickoff(team);};
resolveAttack=function(ctx){
  const before={flicks:S.flicks,lastFig:S.lastFig,seq:S.seq};
  BASE.resolveAttack(ctx);
  if(!drillMode())return;
  if(S.phase==='defend'&&S.poss===ctx.team&&S.flicks>before.flicks)drillEvent('kept',{team:ctx.team,fig:ctx.fig,soft:ctx.soft,prevFig:before.lastFig});
};
resolveDefend=function(ctx){const foul=!!ctx.defTouch&&!ctx.moonHit;BASE.resolveDefend(ctx);if(drillMode())drillEvent('defended',{team:ctx.team,foul});};
skipDefend=function(){const was=S.phase==='defend'&&!sim.running;BASE.skipDefend();if(was&&drillMode())drillEvent('skip',{});};
function drillEvent(kind,info){return S.mode==='tutorial'?tutEvent(kind,info):pracEvent(kind,info);}
function later(fn,ms){clearTimeout(DR.timer);const q=S.seq;DR.timer=setTimeout(()=>{if(drillMode()&&S.seq===q)fn();},ms);}

/* ---------- practice ---------- */
const DRILLS={
  '3v3':{name:'3v3 match',place:null},
  kickoff:{name:'Kick-off',place:null},
  free:{name:'Foul kick',place:'Click the pitch where the foul happened.'},
  corner:{name:'Corner',place:'Click near the corner flag you want to take it from.'},
  throw:{name:'Throw-in',place:'Click near a touchline to take the throw from there.'},
  rondo:{name:'Rondo',place:'Click where the ball starts. The 5 v 2 circle forms around it.'},
  shoot:{name:'Shooting',place:'Click anywhere to place the ball. You get one shot.'}
};
function pracSquads(){MBAL=BAL;const sp=DR.special||mySquads[0].special;matchSquads=[Object.assign({},mySquads[0],{special:sp}),defaultSquad(1)];applySquadStats();}
function startPractice(){
  leaveDrills();S.mode='practice';pracSquads();
  S.ballV=BALL.mine||((BALL.variants[0]||{}).id||'');showBall();S.lookV=lookStr(LOOKSEL);showLook();
  S.score=[0,0];S.bar=[0,0];freshState();$('#ft').hidden=true;$('#prac').hidden=false;
  renderPrac();runDrill(DR.kind||'3v3',true);ambience.update();
}
function runDrill(kind,fresh){
  clearTimeout(DR.timer);
  if(DR.kind!==kind||fresh){DR.stats={tries:0,goals:0,passes:0,best:DR.stats&&DR.kind===kind?DR.stats.best||0:0,kept:0};}
  DR.kind=kind;S.score=[0,0];
  const D=DRILLS[kind];
  if(D.place&&!DR.spot){DR.placing=true;DR.busy=false;sim.running=false;stopAll();S.phase='place';S.active=0;sel=-1;clearAim();commit();renderPrac();return;}
  DR.placing=false;DR.noBlocks=false;DR.busy=true;freshState();
  ({'3v3':setup3v3,kickoff:setupKickoff,free:setupFree,corner:setupCorner,throw:setupThrow,rondo:setupRondo,shoot:setupShoot})[kind]();
  if(kind!=='3v3'&&kind!=='kickoff')DR.stats.tries++;
  renderPrac();
}
function placeDrill(g){
  if(Math.abs(g.x)>WALLX||Math.abs(g.z)>WALLZ)return;
  DR.spot={x:g.x,z:g.z};runDrill(DR.kind);
}
function setup3v3Pos(team){
  bench([1,5,8,11,15,18]);
  const d=dirOf(team);
  [[1,-22,-10],[5,-22,10],[8,-12,0]].forEach(([i,x,z])=>{put(i,x,z);put(i+10,-x,-z);});
  // the kicking side's forward stands at the ball
  const k=team===0?8:18;put(k,-d*3,0.35*d);ball.x=0;ball.z=0;
}
function setup3v3(){setup3v3Pos(0);setupDone(0,8,{t:'3v3',s:'First to score. Normal rules, CPU blocks and attacks.',c:0,w:1});}
function setupKickoff(){bench(RED.concat(BLUE));formation(0);setupDone(0,formOf(matchSquads[0]).kop[0],{t:'Kick-off',s:'Keep the ball as long as you can.',c:0,w:1});}
function goalDir(x,z){let ux=HX-x,uz=-z;const L=Math.hypot(ux,uz)||1;return[ux/L,uz/L];}
function setupFree(){
  const sx=clamp(DR.spot.x,-HX+4,HX-6),sz=clamp(DR.spot.z,-HZ+3,HZ-3);
  bench([4,5,8,9,10,11,12,15,16]);ball.x=sx;ball.z=sz;
  const [ux,uz]=goalDir(sx,sz),px=-uz,pz=ux;
  put(4,sx-ux*(RF+RB+1.6),sz-uz*(RF+RB+1.6));
  // a slightly random wall, about 9 cm out
  const sh=rnd(-1.5,1.5),wd=rnd(8.5,10);
  [-1,0,1].forEach((k,j)=>put(10+j,sx+ux*wd+px*(k*RF*2.15+sh)+rnd(-.5,.5),sz+uz*wd+pz*(k*RF*2.15+sh)+rnd(-.5,.5)));
  put(15,rnd(HX-15,HX-5),rnd(-12,12));put(16,rnd(HX-15,HX-5),rnd(-12,12));
  [5,8,9].forEach((i,j)=>{const a=rnd(14,24),l=(j-1)*rnd(9,14);put(i,sx+ux*a+px*l,sz+uz*a+pz*l);});
  bodies.forEach(b=>{if(!b.ball&&!b.off&&b.team===0&&b.id!==4)b.x=Math.min(b.x,HX-3);});
  setupDone(0,4,null);S.setupLeft=SETUP.free;S.setupKind='free';S.taker=4;
  S.msg={t:'Foul kick',s:'One optional positional flick, then take it with the ringed taker. Blues block.',c:0,w:1};commit();
}
function setupCorner(){
  bench(RED.concat(BLUE));
  const sz=DR.spot.z>=0?1:-1,px=HX-1.2,pz=sz*(HZ-1.2);ball.x=px;ball.z=pz;
  cornerLayout(0,px,pz);
  // defenders start in a fresh random spread every time
  for(let i=10;i<20;i++){const b=bodies[i];b.x=clamp(b.x+rnd(-3.5,3.5),SHOOT-6,HX-2.5);b.z=clamp(b.z+rnd(-3.5,3.5),-HZ+2,HZ-2);}
  const t=bodies[4];t.x=px+2.2;t.z=pz+sz*2.2;faceTo(t,ball.x,ball.z);
  setupDone(0,4,null);S.setupLeft=SETUP.corner;S.setupKind='corner';S.taker=4;
  S.msg={t:'Corner',s:'Up to three positional flicks, then take it. Reset or score to go again.',c:0,w:1};commit();
}
function setupThrow(){
  const sz=DR.spot.z>=0?1:-1,px=clamp(DR.spot.x,-HX+4,HX-4),pz=sz*(HZ-1.3);
  bench([4,5,8,9,13,15,16]);ball.x=px;ball.z=pz;
  put(4,px-1.4,pz+sz*2.6);
  [5,8,9].forEach(i=>put(i,px+rnd(-14,16),pz-sz*rnd(7,18)));
  [13,15,16].forEach(i=>put(i,px+rnd(-10,14),pz-sz*rnd(6,16)));
  setupDone(0,4,{t:'Throw-in',s:'One optional positional flick, then throw it in.',c:0,w:1});S.setupLeft=SETUP.throw;S.setupKind='throw';S.taker=4;
}
function setupRondo(){
  bench([2,4,5,8,9,15,16]);
  // the ball goes where you clicked; the circle (radius 15) forms around it, opening towards the middle of the pitch
  const R=15,bx=clamp(DR.spot.x,-HX+4,HX-4),bz=clamp(DR.spot.z,-HZ+4,HZ-4);
  let ox=-bx,oz=-bz;const ol=Math.hypot(ox,oz);if(ol<1){const a=rnd(0,Math.PI*2);ox=Math.cos(a);oz=Math.sin(a);}else{ox/=ol;oz/=ol;}
  const cx=clamp(bx+ox*R*0.82,-HX+R+2,HX-R-2),cz=clamp(bz+oz*R*0.82,-HZ+R+2,HZ-R-2);
  ball.x=bx;ball.z=bz;
  const a0=Math.atan2(bz-cz,bx-cx);
  [2,4,5,8,9].forEach((i,k)=>{const a=a0+k*Math.PI*2/5;put(i,cx+Math.cos(a)*R,cz+Math.sin(a)*R);});
  // the first figure sits just outside the ball so it can play the first pass
  const L=Math.hypot(bx-cx,bz-cz)||1;put(2,bx+(bx-cx)/L*(RF+RB+1.2),bz+(bz-cz)/L*(RF+RB+1.2));
  put(15,cx+rnd(-4,4),cz+rnd(-4,4));put(16,cx+rnd(-5,5),cz+rnd(-5,5));
  setupDone(0,2,{t:'Rondo',s:'5 v 2 in midfield. Every pass with a new figure counts.',c:0,w:1});
}
function setupShoot(){
  const sx=clamp(DR.spot.x,-HX+6,HX-3),sz=clamp(DR.spot.z,-HZ+3,HZ-3);
  bench([8,15]);ball.x=sx;ball.z=sz;
  const [ux,uz]=goalDir(sx,sz);put(8,sx-ux*(RF+RB+1.4),sz-uz*(RF+RB+1.4));
  put(15,rnd(HX-14,HX-5),rnd(-11,11));
  keepers[1].z=keepers[1].target=rnd(-3,3);
  setupDone(0,8,{t:'Shooting',s:'One shot. Score, or it resets.',c:0,w:1});
}
function pracEvent(kind,info){
  const k=DR.kind,st=DR.stats;
  if(k==='3v3'){
    if(kind==='kickoff'){DR.busy=true;setup3v3Pos(info.team);setupDone(info.team,info.team===0?8:18,{t:'Kick-off',s:`${N(info.team)} restart.`,c:info.team,w:1});return true;}
    return false;
  }
  const again=(title,sub,ms,good)=>{S.phase='goal';S.msg={t:title,s:sub,g:good?1:0,c:good?0:1};commit();later(()=>runDrill(k),ms);return true;};
  if(kind==='kickoff')return true;
  if(kind==='goal'){
    if(info.team===0&&!info.own){st.goals++;return again('Goal!',statLine(),2200,true);}
    return again(info.team===0?'Own goal':'They scored','Resetting the drill.',1600,false);
  }
  if(kind==='turnover'||kind==='setpiece'){
    if(k==='rondo'){st.best=Math.max(st.best,st.passes);const n=st.passes;st.passes=0;return again(info.title||'Lost it',`${n} pass${n===1?'':'es'}. Best ${st.best}.`,1500,false);}
    if(k==='shoot')return again(info.title==='Saved'?'Saved':'No goal','Try again from the same spot.',1300,false);
    if(info.team===0&&kind==='setpiece')return again(info.title||'Out','Resetting the drill.',1300,false);
    return again(info.title||'Lost it','Resetting the drill.',1300,false);
  }
  if(kind==='kept'){
    st.kept++;
    if(k==='rondo'&&info.fig!==info.prevFig&&info.prevFig>=0){st.passes++;st.best=Math.max(st.best,st.passes);renderPrac();}
    if(k==='shoot')return again('No goal','Try again from the same spot.',1100,false);
    renderPrac();
  }
  return false;
}
function statLine(){
  const k=DR.kind,st=DR.stats;
  if(k==='rondo')return `Passes ${st.passes} · Best ${st.best}`;
  if(k==='3v3')return `Score ${S.score[0]} - ${S.score[1]}`;
  if(k==='kickoff')return `Flicks kept ${st.kept}`;
  return `Goals ${st.goals} / ${st.tries} tries`;
}
function renderPrac(){
  const D=DRILLS[DR.kind];$('#prac-name').textContent=D.name;
  document.querySelectorAll('#drills .dbtn').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.drill===DR.kind)));
  $('#prac-stat').textContent=DR.placing?'Pick a spot':statLine();
  $('#prac-spot').hidden=!D.place;
  const sel=$('#prac-special');if(!sel.options.length)Object.keys(SPECIALS).forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=SPECIALS[k].name;sel.appendChild(o);});
  sel.value=DR.special||mySquads[0].special;
  updateHud();
}
document.querySelectorAll('#drills .dbtn').forEach(b=>b.addEventListener('click',()=>{ensureAudio();const k=b.dataset.drill;if(k!==DR.kind)DR.spot=null;runDrill(k,true);}));
$('#prac-reset').addEventListener('click',()=>{if(sim.running)return;runDrill(DR.kind);});
$('#prac-spot').addEventListener('click',()=>{if(sim.running)return;DR.spot=null;runDrill(DR.kind);});
$('#prac-special').addEventListener('change',e=>{DR.special=e.target.value;if(S.armed&&S.armedTeam===0)S.armed='';pracSquads();updateHud();});
$('#prac-fill').addEventListener('click',()=>{S.bar[0]=BAR_MAX;updateHud();flashSub('Moment ready');});
$('#prac-min').addEventListener('click',()=>{const p=$('#prac'),m=p.classList.toggle('min');$('#prac-min').setAttribute('aria-expanded',String(!m));$('#prac-min').setAttribute('aria-label',m?'Show drills':'Hide drills');});
// a ring that follows the mouse while you pick a spot
const placeRing=new THREE.Mesh(new THREE.RingGeometry(1.6,2.2,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xf2cf6b,transparent:true,opacity:0.9,depthWrite:false}));placeRing.visible=false;placeRing.renderOrder=6;scene.add(placeRing);
canvas.addEventListener('pointermove',e=>{if(!DR.placing){placeRing.visible=false;return;}const g=groundAt(e.clientX,e.clientY);if(!g){placeRing.visible=false;return;}placeRing.visible=true;placeRing.position.set(g.x,0.08,g.z);});

/* ---------- tutorial ---------- */
const TUT=[
  {t:'Welcome to the baize',x:'This is a 3v3 lesson. You are <b>Reds</b>, attacking to the right. First you learn to attack, then to defend.',wait:'next',lay:'off'},
  {t:'Pick a figure',x:'The glowing ring shows your selected figure. Click a different red figure to select it. <kbd>Tab</kbd> or the bumpers also switch.',wait:'select',lay:'off'},
  {t:'The soft flick',x:'Press and drag <b>away from where you want to go</b>. The arrow shows how far your figure travels; the dots show where the ball goes. Let go gently and the figure travels the arrow. Hit the ball.',wait:'soft',lay:'off',hint:'Touch the ball with a soft flick'},
  {t:'The snap',x:'Now pull back and flick forward fast, back through where you started. A snap hits harder than the arrow. Hit the ball again.',wait:'snap',lay:'keep',hint:'Snap a figure into the ball'},
  {t:'Pass it',x:'One figure can flick at most <b>three times in a row</b>, so the ball has to move between teammates. Play the ball with a different red figure.',wait:'pass',lay:'keep',hint:'Hit the ball with a new figure'},
  {t:'Keep it clean',x:'You keep the ball while your figure hits it <b>first</b> and it doesn\'t end up off a blue figure. Hit a blue figure before the ball and it\'s a <b>foul</b>: a free kick to them. Miss the ball and they take over.',wait:'next',lay:'keep'},
  {t:'Shoot',x:'Goals only count from <b>inside the shooting area</b>, past the dashed line. The keeper reacts to shots on his own. Score!',wait:'goal',lay:'shoot',hint:'Score from the shooting area'},
  {t:'Now defend',x:'Blues have the ball. After each of their flicks you get one <b>block flick</b>: move a figure into their way, but <b>never touch the ball</b>, or it\'s a free kick to them.',wait:'next',lay:'def'},
  {t:'Block',x:'Wait for their flick, then flick one red figure into their path. You can also skip the block with <kbd>Space</kbd>.',wait:'block',lay:'keep',hint:'Make a clean block or skip'},
  {t:'Your keeper',x:'During a block you can slide your keeper along the goal: drag him, use <kbd>Q</kbd>/<kbd>E</kbd>, or the triggers on a pad. Move him now.',wait:'keeper',lay:'keep',hint:'Slide your keeper when you are blocking'},
  {t:'Win it back',x:'Keep blocking. When their flick misses the ball, or the ball stops against one of your figures, it\'s yours.',wait:'win',lay:'keep',hint:'Get the ball back'},
  {t:'You\'re ready',x:'That\'s the game: soft flicks and snaps, passing between figures, shooting from the shooting area, and blocking without touching the ball. Corners and free kicks give you set-up moves first. Try the drills in Practice, or play a full match.',wait:'end',lay:'keep'}
];
function startTutorial(){
  leaveDrills();MBAL=BAL;S.mode='tutorial';matchSquads=[mySquads[0],defaultSquad(1)];applySquadStats();
  S.ballV=BALL.mine||((BALL.variants[0]||{}).id||'');showBall();S.lookV=lookStr(LOOKSEL);showLook();
  S.score=[0,0];S.bar=[0,0];freshState();$('#ft').hidden=true;$('#coach').hidden=false;
  DR.step=0;DR.layout='';tutStep(0);ambience.update();
}
function tutLayout(lay,msg){
  DR.busy=true;freshState();DR.layout=lay;
  if(lay==='off'||lay==='shoot'){
    DR.noBlocks=true;bench([0,1,2,10,11,12]);
    if(lay==='off'){ball.x=-2;ball.z=0;put(0,-5.4,0);put(1,-12,12);put(2,-14,-12);put(10,16,-8);put(11,16,8);put(12,28,0);}
    else{ball.x=37;ball.z=3;put(0,33.5,3);put(1,28,-12);put(2,26,14);put(10,47,-7);put(11,49,8);put(12,30,20);}
    setupDone(0,0,msg||null);
  }else{
    DR.noBlocks=false;bench([0,1,2,10,11,12]);
    ball.x=12;ball.z=2;put(10,15.4,2);put(11,22,-12);put(12,24,12);put(0,-4,-7);put(1,-2,8);put(2,-22,0);
    setupDone(1,10,msg||null);
  }
}
function tutStep(i,msg){
  DR.step=i;const st=TUT[i];
  if(i===TUT.length-1&&ecoOn()&&store.get('baize.tutPaid')!=='1'){store.set('baize.tutPaid','1');earn(BAL.eco.tutorial,'Tutorial complete');}
  if(st.lay!=='keep'&&(st.lay!==DR.layout||i===0))tutLayout(st.lay,msg);else if(msg){S.msg=msg;commit();}
  if(st.wait==='select')DR.sel0=sel;
  if(st.wait==='keeper')DR.k0=keepers[0].z;
  $('#co-step').textContent=`Step ${i+1} of ${TUT.length}`;
  $('#co-title').textContent=st.t;$('#co-text').innerHTML=st.x;
  $('#co-hint').textContent=st.hint||'';
  $('#co-next').hidden=st.wait!=='next';$('#co-end').hidden=st.wait!=='end';
  $('#co-prog').style.width=((i+1)/TUT.length*100)+'%';
  updateHud();
}
function tutNext(){if(DR.step<TUT.length-1){sfx('tock',40);tutStep(DR.step+1,{t:'Nice!',s:'',c:0});}}
function tutRetry(title,sub){const lay=DR.layout;later(()=>{tutLayout(lay==='def'?'def':TUT[DR.step].lay==='shoot'||lay==='shoot'?'shoot':'off',{t:title,s:sub||'Let\'s set that up again.',c:0});},1300);}
function tutEvent(kind,info){
  const w=TUT[DR.step].wait,def=DR.layout==='def';
  if(kind==='kickoff'){tutRetry('Back to it');return true;}
  if(!def){
    if(kind==='kept'){
      if(w==='soft'&&info.soft)tutNext();
      else if(w==='snap'&&!info.soft)tutNext();
      else if(w==='pass'&&info.prevFig>=0&&info.fig!==info.prevFig)tutNext();
      return false;
    }
    if(kind==='goal'){
      S.phase='goal';S.msg={t:info.team===0?'Goal!':'Own goal',s:'',g:info.team===0?1:0,c:0};commit();
      if(info.team===0&&w==='goal')later(()=>tutStep(DR.step+1),2000);else tutRetry('Again');
      return true;
    }
    if(kind==='turnover'||kind==='setpiece'){S.phase='goal';S.msg={t:info.title||'Lost it',s:info.sub||'',c:1};commit();tutRetry(info.title==='Foul'?'Foul':'Not quite');return true;}
    return false;
  }
  // defending
  if(kind==='defended'||kind==='skip'){
    if(kind==='defended'&&info.foul){flashSub('You touched the ball. Blocks must miss it.');return false;}
    if(w==='block')tutNext();
    return false;
  }
  if(kind==='turnover'||(kind==='setpiece'&&info.team===0)){
    S.phase='goal';S.msg={t:'Ball won!',s:info.title||'',g:1,c:0};commit();
    if(w==='win'||w==='end')later(()=>tutStep(TUT.length-1),1800);else tutRetry('They lost it early','Let\'s run that again.');
    return true;
  }
  if(kind==='goal'||kind==='setpiece'){S.phase='goal';S.msg={t:kind==='goal'?'They scored':(info.title||'Restart'),s:'',c:1};commit();tutRetry('Again','Blues attack once more.');return true;}
  return false;
}
function tutFrame(){
  if(S.mode!=='tutorial'||!S.running)return;
  const w=TUT[DR.step].wait;
  if(w==='select'&&sel>=0&&DR.sel0>=0&&sel!==DR.sel0)tutNext();
  if(w==='keeper'&&S.phase==='defend'&&Math.abs(keepers[0].z-DR.k0)>1.2)tutNext();
}
$('#co-next').addEventListener('click',()=>{ensureAudio();tutNext();});
$('#co-exit').addEventListener('click',()=>{leaveDrills();S.running=false;S.phase='idle';S.mode='local';formation(0);openMenu();});
$('#co-prac').addEventListener('click',()=>{menuMode='practice';startPractice();});
$('#co-menu').addEventListener('click',()=>{leaveDrills();S.running=false;S.phase='idle';S.mode='local';formation(0);openMenu();});

/* ---------- HUD for both ---------- */
function drillHud(){
  if(!drillMode()||!S.running)return;
  $('#clock').textContent=S.mode==='practice'?'PRACTICE':'TUTORIAL';
  $('#half').textContent=S.mode==='practice'?DRILLS[DR.kind].name:'Lesson';
  if(S.mode==='practice'){$('#flickc').textContent=DR.placing?'':statLine();const ps=$('#prac-stat');if(ps)ps.textContent=DR.placing?'Pick a spot':statLine();}
  else $('#flickc').textContent='';
  if(DR.placing){const pr=$('#prompt');pr.hidden=false;$('#ptitle').textContent='Pick a spot';$('#psub').textContent=DRILLS[DR.kind].place;}
}

