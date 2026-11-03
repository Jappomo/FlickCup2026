// Flick Cup 2026 · js/training.js
// Training: ten scored routines (10 tries, 1 point each), after the exercises on subbuteo.is-great.net/training.
// Loaded by index.html as a classic script after practice.js: it adds drills to DRILLS and wraps a few rule functions.
'use strict';
/* ================= training ================= */
// Every routine runs inside Practice: you are Reds attacking to the right. The match rules are off while a routine runs;
// each flick is judged by the routine itself.
const TR={on:false,kind:'',tries:0,score:0,step:0,cur:-1,used:new Set(),allow:new Set(),flicks:0,hits:{},slots:{},extra:{},done:false};
const TRAIN_N=10;
const TRAIN=[
  {id:'t_move1',short:'Move 1',name:'Movement 1',info:'Two flicks per figure, no ball. First into the shooting area, then into the penalty area.'},
  {id:'t_pass1',short:'Pass 1',name:'Passing 1',info:'Pass from the shooting line to the figure on the centre spot. The ball must stop in the far half of the centre circle.'},
  {id:'t_mark1',short:'Mark 1',name:'Marking 1',info:'Flick from the halfway line across the shooting line and stop in front of a Blue. Do not touch them.'},
  {id:'t_shoot1',short:'Shoot 1',name:'Shooting 1',info:'Two blocks guard the goal line. Five shots from outside the box, five from the shooting line.'},
  {id:'t_att1',short:'Attack 1',name:'Attacking 1',info:'Ball on the halfway line. Score in three flicks or fewer. Every flick must hit the ball, shots only from the shooting area.'},
  {id:'t_move2',short:'Move 2',name:'Movement 2',info:'One flick from the touchline, straight down the halfway line, through the gap into the far half. Do not touch a Blue.'},
  {id:'t_pass2',short:'Pass 2',name:'Passing 2',info:'One passer, a new spot on the shooting line each try. The ball must stop in the far half of the centre circle.'},
  {id:'t_def2',short:'Defend 2',name:'Defending 2',info:'One flick from the touchline into the centre circle. Stop between the Blue and the ball without touching either.'},
  {id:'t_shoot2',short:'Shoot 2',name:'Shooting 2',info:'Shoot from the corner of the shooting area. A block stands on the corner of the box.'},
  {id:'t_att2',short:'Attack 2',name:'Attacking 2',info:'Blues block the pass and the shot. Play the ball into space for your partner, who must score. Never hit a Blue.'}
];
TRAIN.forEach(t=>{DRILLS[t.id]={name:t.name,place:null,train:true};});
const trainOn=()=>S.mode==='practice'&&!!(DRILLS[DR.kind]&&DRILLS[DR.kind].train);
const trDef=k=>TRAIN.find(t=>t.id===k);
function trBest(){try{return JSON.parse(store.get('baize.trainBest')||'{}')||{};}catch(e){return{};}}
function trSaveBest(k,v){const b=trBest();if(!(b[k]>=v)){b[k]=v;store.set('baize.trainBest',JSON.stringify(b));return true;}return false;}

/* ---------- pitch helpers ---------- */
const CIRCLE_R=9;
const inPenArea=b=>b.x>=HX-BOX.deep&&b.x<=HX+0.5&&Math.abs(b.z)<=BOX.half;
const spread=(n,lo,hi)=>Array.from({length:n},(_,i)=>n<2?(lo+hi)/2:lo+(hi-lo)*i/(n-1));
function ballOff(x,z){ball.off=true;ball.x=x;ball.z=z;ball.vx=ball.vz=0;ballMesh.visible=false;ballShadow.visible=false;}
function ballOn(x,z){ball.off=false;ball.x=x;ball.z=z;ball.vx=ball.vz=0;ball.air=0;ball.hy=RB;ballMesh.visible=true;}
// a figure standing behind the ball, aimed at a point
function behind(id,tx,tz){const ux=tx-ball.x,uz=tz-ball.z,L=Math.hypot(ux,uz)||1,d=RF+RB+0.5;put(id,ball.x-ux/L*d,ball.z-uz/L*d);faceTo(bodies[id],ball.x,ball.z);}
function snap(){const o={};for(let i=0;i<20;i++){const b=bodies[i];if(!b.off)o[i]=[b.x,b.z];}if(!ball.off)o.ball=[ball.x,ball.z];return o;}
function movedBlue(before,tol){for(let i=10;i<20;i++){const b=bodies[i],p=before[i];if(!b.off&&p&&Math.hypot(b.x-p[0],b.z-p[1])>(tol||0.15))return true;}return false;}

/* ---------- target zones drawn on the cloth ---------- */
const ZONES=new THREE.Group();scene.add(ZONES);
const zoneMat=new THREE.MeshBasicMaterial({color:0xf2b632,transparent:true,opacity:0.4,depthWrite:false});
const zoneEdge=new THREE.MeshBasicMaterial({color:0xf2b632,transparent:true,opacity:0.95,depthWrite:false});
function clearZones(){while(ZONES.children.length){const c=ZONES.children.pop();c.geometry.dispose();}}
function zAdd(geo,mat,x,z,y){const m=new THREE.Mesh(geo,mat);m.position.set(x,y||0.06,z);m.renderOrder=5;ZONES.add(m);return m;}
// a flat strip from (x0,z0) to (x1,z1)
function zEdge(x0,z0,x1,z1){const L=Math.hypot(x1-x0,z1-z0),a=Math.atan2(-(z1-z0),x1-x0);const m=zAdd(new THREE.PlaneGeometry(L+0.5,0.5).rotateX(-Math.PI/2),zoneEdge,(x0+x1)/2,(z0+z1)/2,0.07);m.rotation.y=a;}
function zoneRect(x0,z0,x1,z1){
  zAdd(new THREE.PlaneGeometry(Math.abs(x1-x0),Math.abs(z1-z0)).rotateX(-Math.PI/2),zoneMat,(x0+x1)/2,(z0+z1)/2);
  zEdge(x0,z0,x1,z0);zEdge(x1,z0,x1,z1);zEdge(x1,z1,x0,z1);zEdge(x0,z1,x0,z0);
}
function zoneArc(x,z,r,a0,len){
  zAdd(new THREE.CircleGeometry(r,48,a0,len).rotateX(-Math.PI/2),zoneMat,x,z);
  zAdd(new THREE.RingGeometry(r-0.5,r,48,1,a0,len).rotateX(-Math.PI/2),zoneEdge,x,z,0.07);
  if(len<Math.PI*2-0.01){[a0,a0+len].forEach(a=>zEdge(x,z,x+Math.cos(a)*r,z-Math.sin(a)*r));}
}

/* ---------- running a routine ---------- */
function trainStart(kind){
  clearTimeout(DR.timer);DR.placing=false;DR.busy=true;DR.noBlocks=true;
  Object.assign(TR,{on:true,kind,tries:0,score:0,step:0,cur:-1,used:new Set(),allow:new Set(),flicks:0,hits:{},slots:{},extra:{},done:false});
  S.score=[0,0];freshState();clearZones();
  for(const b of bodies)if(!b.gk)b.off=false;
  S.kOut=[0,0];syncGK();keepers[0].z=keepers[1].z=0;keepers[0].target=keepers[1].target=0;
  TRAIN_SET[kind].init();
  trainTry(true);
}
// set up the next try (or the first one)
function trainTry(first){
  const T=TRAIN_SET[TR.kind];if(!T)return;
  DR.busy=true;S.running=true;S.armed='';stopAll();TR.step=0;TR.cur=-1;TR.flicks=0;TR.hits={};
  T.setup(TR.tries);
  separate();
  S.poss=0;S.active=0;S.phase='attack';S.flicks=0;S.lastFig=-1;S.lastFigCount=0;S.setupLeft=0;S.setupKind='';S.taker=-1;
  TR.before=snap();
  const d=trDef(TR.kind);
  S.msg=first?{t:d.name,s:d.info,c:0,w:1}:null;
  if(TR.prefer>=0)selPrefer=TR.prefer;
  DR.busy=false;commit();renderPrac();
}
function trainNext(pt,title,sub,ms){
  TR.last={pt:pt?1:0,t:title,ball:[+ball.x.toFixed(1),+ball.z.toFixed(1)],fig:TR.lastFig>=0?[+bodies[TR.lastFig].x.toFixed(1),+bodies[TR.lastFig].z.toFixed(1)]:null};
  TR.tries++;TR.score+=pt?1:0;
  S.phase='goal';S.msg={t:title,s:sub||'',g:pt?1:0,c:pt?0:1};if(pt)sfx('tock',30);commit();renderPrac();
  if(TR.tries>=TRAIN_N)later(trainFinish,ms||1100);else later(()=>trainTry(false),ms||900);
}
// keep playing the same try (another flick allowed)
function trainKeep(sub){S.phase='attack';S.active=0;S.msg=sub?{t:sub.t,s:sub.s||'',c:0}:null;TR.before=snap();if(TR.prefer>=0)selPrefer=TR.prefer;commit();renderPrac();}
function trainFinish(){
  TR.done=true;const k=TR.kind,rec=trSaveBest(k,TR.score),best=trBest()[k]||0;
  S.phase='goal';S.msg={t:`${TR.score} / ${TRAIN_N}`,s:rec&&TR.score>0?'New best! Press Reset to go again.':`Best ${best} / ${TRAIN_N}. Press Reset to go again.`,g:TR.score>=7?1:0,c:0,w:1};
  commit();renderPrac();
}
function trainStop(){if(!TR.on)return;TR.on=false;clearZones();ballMesh.visible=true;ball.off=false;}

/* ---------- the ten routines ---------- */
const RED10=[0,1,2,3,4,5,6,7,8,9];
const TRAIN_SET={
  // Movement 1: the whole team on the halfway line, two flicks each (no ball)
  t_move1:{
    init(){bench(RED10);ballOff(0,0);spread(10,-33,33).forEach((z,i)=>{put(i,-RF-0.3,z);});zoneRect(HX-BOX.deep,-BOX.half,HX,BOX.half);},
    setup(){TR.allow=new Set(RED10.filter(i=>!TR.used.has(i)));TR.prefer=-1;},
    judge(ctx){
      const b=bodies[ctx.fig];
      if(TR.step===0){TR.used.add(ctx.fig);
        if(b.x>=SHOOT){TR.step=1;TR.allow=new Set([ctx.fig]);TR.prefer=ctx.fig;return trainKeep({t:'In the shooting area',s:'Second flick: into the penalty area.'});}
        return trainNext(0,'Short','That figure did not reach the shooting area.');}
      TR.prefer=-1;
      return inPenArea(b)?trainNext(1,'In the box','+1'):trainNext(0,'Missed the box','');
    }
  },
  // Passing 1: nine passers along your shooting line, the tenth figure on the centre spot
  t_pass1:{
    init(){zoneArc(0,0,CIRCLE_R,-Math.PI/2,Math.PI);},
    setup(n){bench(RED10);ballOn(-SHOOT,0);
      const zs=spread(9,-32,32);zs.forEach((z,i)=>put(i,-SHOOT-(RF+RB+0.5),z));put(9,0,0);faceTo(bodies[9],-HX,0);
      const k=n<9?n:4;ball.x=-SHOOT;ball.z=zs[k];put(k,-SHOOT-(RF+RB+0.5),zs[k]);faceTo(bodies[k],0,0);
      TR.allow=new Set([k]);TR.prefer=k;},
    judge(ctx){return trPassJudge(ctx);}
  },
  // Marking 1: ten Reds on the halfway line, ten Blues two figures beyond the shooting line
  t_mark1:{
    init(){bench(RED10.concat(BLUE));ballOff(0,0);const zs=spread(10,-33,33),bx=SHOOT+4*RF+RF;
      zs.forEach((z,i)=>{put(i,-RF-0.3,z);put(10+i,bx,z);TR.slots[10+i]=[bx,z];});zoneRect(SHOOT,-HZ,bx-RF,HZ);},
    setup(){TR.allow=new Set(RED10.filter(i=>!TR.used.has(i)));TR.prefer=-1;
      for(let i=10;i<20;i++){const s=TR.slots[i];if(s){bodies[i].x=s[0];bodies[i].z=s[1];}}},
    judge(ctx){
      const b=bodies[ctx.fig];TR.used.add(ctx.fig);
      if(ctx.trOpp||movedBlue(TR.before))return trainNext(0,'You hit a Blue','Markers must stop short.');
      let o=null,bd=1e9;for(let i=10;i<20;i++){const q=bodies[i],d=Math.abs(q.z-b.z);if(d<bd){bd=d;o=q;}}
      const ok=b.x>SHOOT&&o&&b.x<o.x&&bd<=RF*2.6;
      return ok?trainNext(1,'Marked','+1'):trainNext(0,b.x<=SHOOT?'Not across the line':'Not in front of a Blue','');
    }
  },
  // Shooting 1: two blocks on the goal line, five shots from outside the box, five from the shooting line
  t_shoot1:{
    init(){},
    setup(n){bench([8,10,11]);const far=n<5,zs=[-14,7,0,-7,14],z=zs[n%5]+rnd(-1,1);
      ballOn(far?HX-BOX.deep-2.5:SHOOT+2,z);behind(8,HX,0);
      [-1,1].forEach((s,j)=>{put(10+j,HX-RF-0.4,s*GOAL*0.5);faceTo(bodies[10+j],-HX,0);});
      keepers[1].z=keepers[1].target=0;TR.allow=new Set([8]);TR.prefer=8;},
    judge(ctx){return trShotJudge(ctx);}
  },
  // Attacking 1: the ball on the halfway line, score in at most three flicks
  t_att1:{
    init(){zoneRect(SHOOT,-HZ,HX,HZ);},
    setup(){bench(RED10);ballOn(0,rnd(-10,10));
      [[1,-24,-14],[2,-24,14],[3,-34,0],[4,12,-20],[5,12,20],[6,22,-8],[7,22,8],[9,-8,-26],[0,-8,26]].forEach(([i,x,z])=>{put(i,x,z);faceTo(bodies[i],HX,0);});
      behind(8,HX,ball.z*0.5);keepers[1].z=keepers[1].target=0;TR.allow=new Set(RED10);TR.prefer=8;TR.extra.max=3;},
    judge(ctx){return trAttackJudge(ctx,null);}
  },
  // Movement 2: from the touchline, one straight flick down the halfway line through a corridor of Blues
  t_move2:{
    init(){ballOff(0,0);zoneRect(-3.6,0,3.6,-HZ);},
    setup(){bench([4,10,11,12,13,14,15,16,17]);put(4,0,HZ-RF-0.6);bodies[4].yaw=-Math.PI/2;
      const zs=[25,15,5,-5],gx=RF+1.4+RF;zs.forEach((z,j)=>{put(10+j,-gx,z);put(14+j,gx,z);});put(18,rnd(-6,6),-HZ+6);
      TR.allow=new Set([4]);TR.prefer=4;},
    judge(ctx){
      const b=bodies[ctx.fig];
      if(ctx.trOpp||movedBlue(TR.before))return trainNext(0,'You hit a Blue','');
      return b.z<=0&&Math.abs(b.x)<=3.6?trainNext(1,'Through','+1'):trainNext(0,b.z>0?'Short':'Off the line','');
    }
  },
  // Passing 2: one passer, a new spot on the shooting line every try
  t_pass2:{
    init(){zoneArc(0,0,CIRCLE_R,-Math.PI/2,Math.PI);TR.extra.zs=[-30,22,-12,6,30,-24,14,-4,26,0];},
    setup(n){bench([2,9]);ballOn(-SHOOT,TR.extra.zs[n]);behind(2,0,0);put(9,0,0);faceTo(bodies[9],-HX,0);TR.allow=new Set([2]);TR.prefer=2;},
    judge(ctx){return trPassJudge(ctx);}
  },
  // Defending 2: from the touchline into the centre circle, between the Blue and the ball
  t_def2:{
    init(){zoneArc(0,0,CIRCLE_R,0,Math.PI*2);},
    setup(){bench([4,15]);put(4,0,HZ-RF-0.6);bodies[4].yaw=-Math.PI/2;
      const a=rnd(0,Math.PI*2),cx=rnd(-2,2),cz=rnd(-2,2),ux=Math.cos(a),uz=Math.sin(a);
      put(15,cx-ux*5,cz-uz*5);ballOn(cx+ux*4.6,cz+uz*4.6);faceTo(bodies[15],ball.x,ball.z);
      TR.allow=new Set([4]);TR.prefer=4;},
    judge(ctx){
      const b=bodies[ctx.fig],o=bodies[15],p=TR.before;
      if(ctx.trOpp||movedBlue(p))return trainNext(0,'You hit the Blue','');
      if(ctx.trBall||Math.hypot(ball.x-p.ball[0],ball.z-p.ball[1])>0.15){ball.x=p.ball[0];ball.z=p.ball[1];return trainNext(0,'You touched the ball','');}
      const ox=o.x,oz=o.z,vx=ball.x-ox,vz=ball.z-oz,L2=vx*vx+vz*vz,t=((b.x-ox)*vx+(b.z-oz)*vz)/L2,dist=Math.abs((b.x-ox)*vz-(b.z-oz)*vx)/Math.sqrt(L2);
      const ok=t>0.12&&t<0.88&&dist<=RF*1.4&&Math.hypot(b.x,b.z)<=CIRCLE_R+RF*0.5;
      return ok?trainNext(1,'In between','+1'):trainNext(0,Math.hypot(b.x,b.z)>CIRCLE_R+RF*0.5?'Not in the circle':'Not in between','');
    }
  },
  // Shooting 2: from the corner of the shooting area, past a block on the corner of the box
  t_shoot2:{
    init(){},
    setup(n){bench([8,10]);const s=n%2?1:-1;ballOn(SHOOT+1.5,s*(HZ-6));behind(8,HX,0);
      put(10,HX-BOX.deep,s*(BOX.half-1.2));faceTo(bodies[10],ball.x,ball.z);keepers[1].z=keepers[1].target=s*2;
      TR.allow=new Set([8]);TR.prefer=8;},
    judge(ctx){return trShotJudge(ctx);}
  },
  // Attacking 2: carrier and partner against Blues that block the pass and the shot
  t_att2:{
    init(){zoneRect(SHOOT,-HZ,HX,HZ);},
    setup(){bench([5,8,10,11,12]);const s=Math.random()<0.5?-1:1,z0=s*rnd(4,12);
      ballOn(14,z0);behind(8,HX,0);put(5,22,z0-s*20);faceTo(bodies[5],HX,0);
      const gx=HX-ball.x,gz=-ball.z,L=Math.hypot(gx,gz);put(10,ball.x+gx/L*9,ball.z+gz/L*9);put(11,ball.x+gx/L*17,ball.z+gz/L*17);
      put(12,(ball.x+bodies[5].x)/2+1,(ball.z+bodies[5].z)/2);for(const i of[10,11,12])faceTo(bodies[i],ball.x,ball.z);
      keepers[1].z=keepers[1].target=0;TR.allow=new Set([5,8]);TR.prefer=8;TR.extra.max=6;TR.extra.carrier=8;},
    judge(ctx){return trAttackJudge(ctx,{carrier:8});}
  }
};
function trPassJudge(ctx){
  if(!ctx.hit)return trainNext(0,'Missed the ball','');
  const ok=Math.hypot(ball.x,ball.z)<=CIRCLE_R&&ball.x>0;
  return ok?trainNext(1,'Perfect pass','+1'):trainNext(0,ball.x<=0&&Math.hypot(ball.x,ball.z)<=CIRCLE_R?'Wrong half of the circle':'Not in the circle','');
}
function trShotJudge(ctx){
  if(!ctx.hit)return trainNext(0,'Missed the ball','');
  if(ctx.goal&&ctx.goal.team===0)return trainNext(1,'Goal!','+1',1300);
  return trainNext(0,ctx.last===1&&ctx.lastK?'Saved':ctx.trBallOpp?'Blocked':'No goal','');
}
// normal attacking rules: hit the ball every flick, no fouls, at most 3 hits per figure, goals only from the shooting area
function trAttackJudge(ctx,o){
  TR.flicks++;TR.hits[ctx.fig]=(TR.hits[ctx.fig]||0)+1;
  if(!ctx.hit)return trainNext(0,'Missed the ball','Every flick must hit the ball.');
  if(ctx.first==='mate'||ctx.first==='opp')return trainNext(0,'Foul','The figure touched another figure before the ball.');
  if(o&&ctx.trBallOpp)return trainNext(0,'Hit a Blue','The ball must never touch a Blue.');
  if(ctx.goal){
    if(ctx.goal.team!==0)return trainNext(0,'Own goal','');
    if(!ctx.fromArea)return trainNext(0,'No goal','Shots only count from inside the shooting area.');
    if(o&&ctx.fig===o.carrier)return trainNext(0,'Wrong scorer','Your partner has to score.');
    return trainNext(1,'Goal!','+1',1300);
  }
  if(ctx.out)return trainNext(0,'Out of play','');
  if(ctx.last===1)return trainNext(0,ctx.lastK?'Saved':'Lost it','');
  if(TR.flicks>=TR.extra.max)return trainNext(0,'Out of flicks',`Score within ${TR.extra.max} flicks.`);
  if(TR.hits[ctx.fig]>=3)TR.allow.delete(ctx.fig);
  if(o&&ctx.fig===o.carrier&&TR.flicks===1){TR.prefer=[...TR.allow].find(i=>i!==o.carrier);}else TR.prefer=ctx.fig;
  const left=TR.extra.max-TR.flicks;
  return trainKeep({t:`${left} flick${left>1?'s':''} left`,s:''});
}

/* ---------- hooks ---------- */
const TR_BASE={resolveAttack,eligible,enforceBoxes,contact,runDrill,statLine,renderPrac,leaveDrills};
resolveAttack=function(ctx){if(trainOn()&&TR.on){if(TR.done)return;const T=TRAIN_SET[TR.kind];if(T){stopAll();TR.lastFig=ctx.fig;return T.judge(ctx);}}return TR_BASE.resolveAttack(ctx);};
eligible=function(id){if(trainOn()&&TR.on){const b=bodies[id];return S.running&&S.phase==='attack'&&!!b&&!b.off&&TR.allow.has(id);}return TR_BASE.eligible(id);};
enforceBoxes=function(){if(trainOn())return 0;return TR_BASE.enforceBoxes();};
// remember touches the routines care about (a Blue, or the ball)
contact=function(a,b,ctx){
  if(ctx&&!ctx.done&&trainOn()){
    const f=a.ball?b:b.ball?a:null;
    if(f){if(f.team===1&&f.id<20)ctx.trBallOpp=true;if(f.id===ctx.fig)ctx.trBall=true;}
    else if((a.team===1&&a.id<20&&b.team===0)||(b.team===1&&b.id<20&&a.team===0))ctx.trOpp=true;
  }
  return TR_BASE.contact(a,b,ctx);
};
runDrill=function(kind,fresh){
  if(DRILLS[kind]&&DRILLS[kind].train){DR.kind=kind;DR.spot=null;return trainStart(kind);}
  trainStop();return TR_BASE.runDrill(kind,fresh);
};
statLine=function(){
  if(trainOn()&&TR.on){const b=trBest()[DR.kind];return TR.done?`${TR.score}/${TRAIN_N} · Best ${b||0}`:`Try ${Math.min(TR.tries+1,TRAIN_N)}/${TRAIN_N} · ${TR.score} pts`;}
  return TR_BASE.statLine();
};
renderPrac=function(){
  TR_BASE.renderPrac();
  const best=trBest();
  document.querySelectorAll('#tdrills .dbtn').forEach(b=>{const k=b.dataset.drill;b.setAttribute('aria-pressed',String(k===DR.kind));const s=b.querySelector('small');if(s)s.textContent=best[k]!=null?`${best[k]}/10`:'–';});
  const info=$('#prac-info');if(info){const d=trainOn()?trDef(DR.kind):null;info.hidden=!d;if(d)info.textContent=d.info;}
  const t=$('#prac-reset b');if(t)t.textContent=trainOn()?'Restart':'Reset';
};
leaveDrills=function(){trainStop();return TR_BASE.leaveDrills();};

// the turn prompt says what this flick is for
const TR_HINT={
  t_move1:()=>TR.step?['Second flick','Into the gold penalty area.']:['Pick a figure','Flick it into the shooting area.'],
  t_pass1:()=>['Pass','Stop the ball in the gold half of the circle.'],
  t_pass2:()=>['Pass','Stop the ball in the gold half of the circle.'],
  t_mark1:()=>['Mark a Blue','Cross the line and stop in front of a Blue.'],
  t_shoot1:()=>['Shoot',TR.tries<5?'From outside the box, past the blocks.':'From the shooting line, past the blocks.'],
  t_shoot2:()=>['Shoot','From the corner, past the block.'],
  t_att1:()=>{const l=3-TR.flicks;return['Attack',`${l} flick${l>1?'s':''} left. Score from the shooting area.`];},
  t_move2:()=>['Run the line','Straight down the halfway line into the gold zone.'],
  t_def2:()=>['Cut in','Stop between the Blue and the ball. Touch neither.'],
  t_att2:()=>TR.flicks?['Finish it',`${6-TR.flicks} flicks left. Your partner must score.`]:['Play it into space','Your partner must score. Never hit a Blue.']
};
drillHud=(base=>function(){base();if(!(trainOn()&&TR.on&&S.running&&S.phase==='attack'&&!sim.running))return;const h=TR_HINT[DR.kind];if(!h)return;const [t,s]=h();$('#prompt').hidden=false;$('#ptitle').textContent=t;$('#psub').textContent=s;})(drillHud);

/* ---------- the panel ---------- */
(function buildTrainPanel(){
  const grid=$('#tdrills');if(!grid)return;
  grid.innerHTML=TRAIN.map(t=>`<button class="dbtn" data-drill="${t.id}" title="${t.name}: ${t.info}" aria-label="${t.name}"><b>${t.short}</b><small>–</small></button>`).join('');
  grid.querySelectorAll('.dbtn').forEach(b=>b.addEventListener('click',()=>{ensureAudio();if(sim.running)return;runDrill(b.dataset.drill,true);}));
})();
