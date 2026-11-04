// Flick Cup 2026 · js/scenarios.js
// Scenarios: Training routines made in Distal (Events > Scenarios) instead of in code, from data/scenarios.json.
// A scenario has a setup (figures, ball, gold zones, who plays each try) and a rule graph that judges every flick:
// Flick ends -> Branch (yes / no by a condition) -> Point, Miss or Another flick. Conditions: hit the ball, ball or
// figure in a zone, touched a Blue, ball touched a Blue, touched the ball, foul, goal, goal from the shooting area,
// out of play, Blues have the ball, flicks this try, step, try number; AND / OR / NOT.
// A scenario with the id of a code routine (t_pass1, ...) replaces it; switched off or removed, the code one is back.
// Loaded by index.html as a classic script after training.js and data.js.
'use strict';
const SCN={data:{},code:{},codeDef:{},codeHint:{},ids:[]};
TRAIN.forEach(t=>{SCN.code[t.id]=TRAIN_SET[t.id];SCN.codeDef[t.id]=Object.assign({},t);SCN.codeHint[t.id]=TR_HINT[t.id];});
const SC_D2R=Math.PI/180;
function scInZone(Z,x,z){
  if(!Z)return false;
  if(Z.type==='rect'){return x>=Math.min(Z.x0,Z.x1)&&x<=Math.max(Z.x0,Z.x1)&&z>=Math.min(Z.z0,Z.z1)&&z<=Math.max(Z.z0,Z.z1);}
  const dx=x-(Z.x||0),dz=z-(Z.z||0);if(Math.hypot(dx,dz)>(Z.r||0))return false;
  const len=(Z.len==null?360:Z.len);if(len>=360)return true;
  let a=Math.atan2(-dz,dx)/SC_D2R-(Z.a0||0);a=((a%360)+360)%360;return a<=len+1e-6;
}
function scDrawZones(sc){clearZones();(sc.setup.zones||[]).forEach(Z=>{if(Z.hidden)return;
  if(Z.type==='rect')zoneRect(Z.x0,Z.z0,Z.x1,Z.z1);else zoneArc(Z.x||0,Z.z||0,Z.r||5,(Z.a0||0)*SC_D2R,Math.min(360,Z.len==null?360:Z.len)*SC_D2R);});}
// the figure that plays this try (players take turns) or null
function scTurn(sc,n){const T=sc.setup.turns;if(!T||!Array.isArray(T.order)||!T.order.length)return null;return T.order[n%T.order.length];}
function scSetup(sc,n){
  const U=sc.setup,P=U.pieces||[];
  bench(P.map(p=>p.id));
  P.forEach(p=>{put(p.id,p.x,p.z);if(p.face)faceTo(bodies[p.id],p.face[0],p.face[1]);});
  const k=scTurn(sc,n);
  if(U.ball){ballOn(U.ball.x,U.ball.z);}else ballOff(0,0);
  if(k!=null&&bodies[k]&&!bodies[k].off){const T=U.turns,b=bodies[k];
    if(T.ball){ballOn(b.x+(T.ball[0]||0),b.z+(T.ball[1]||0));}
    if(T.face)faceTo(b,T.face[0],T.face[1]);}
  if(U.keeper!=null){keepers[1].z=keepers[1].target=+U.keeper||0;}
  const allow=k!=null?[k]:(U.allow&&U.allow.length?U.allow:P.filter(p=>p.id<10).map(p=>p.id));
  TR.allow=new Set(allow);TR.prefer=k!=null?k:(U.prefer!=null?U.prefer:-1);
}
// the rule graph
function scEdge(g,id,port){const e=(g.edges||[]).find(e=>e[0]===id&&e[1]===port);return e?e[2]:null;}
function scBoolIn(g,id,port){const e=(g.edges||[]).find(e=>e[2]===id&&e[3]===port);return e?e[0]:null;}
function scCmp(a,op,b){switch(op){case'>':return a>b;case'<=':return a<=b;case'<':return a<b;case'==':return a===b;case'!=':return a!==b;default:return a>=b;}}
function scBool(sc,id,ctx,depth){
  const g=sc.graph,n=g.nodes[id];if(!n||depth>30)return false;
  const zone=i=>(sc.setup.zones||[])[+(i||0)],fig=bodies[ctx.fig]||{x:0,z:0};
  const ins=k=>{const r=[];for(let i=0;i<(n.inputs||2);i++){const s=scBoolIn(g,id,'a'+i);if(s)r.push(scBool(sc,s,ctx,depth+1));}return r;};
  switch(n.type){
    case'hitBall':return!!ctx.hit;
    case'ballZone':return!ball.off&&scInZone(zone(n.zone),ball.x,ball.z);
    case'figZone':return scInZone(zone(n.zone),fig.x,fig.z);
    case'touchBlue':return!!ctx.trOpp||movedBlue(TR.before);
    case'ballBlue':return!!ctx.trBallOpp;
    case'touchBall':{const p=TR.before&&TR.before.ball;return!!ctx.trBall||!!(p&&Math.hypot(ball.x-p[0],ball.z-p[1])>0.15);}
    case'foul':return ctx.first==='mate'||ctx.first==='opp';
    case'goal':return!!(ctx.goal&&ctx.goal.team===0);
    case'ownGoal':return!!(ctx.goal&&ctx.goal.team!==0);
    case'fromArea':return!!ctx.fromArea;
    case'out':return!!ctx.out;
    case'blueBall':return ctx.last===1;
    case'saved':return ctx.last===1&&!!ctx.lastK;
    case'flicks':return scCmp(TR.flicks,n.cmp||'>=',+n.value||0);
    case'step':return scCmp(TR.step,n.cmp||'==',+n.value||0);
    case'tryNo':return scCmp(TR.tries+1,n.cmp||'<=',+n.value||0);
    case'ballPast':return!ball.off&&scCmp(ball.x,n.cmp||'>',+n.value||0);
    case'figPast':return scCmp(fig.x,n.cmp||'>',+n.value||0);
    case'and':{const a=ins();return a.length>0&&a.every(Boolean);}
    case'or':return ins().some(Boolean);
    case'not':{const s=scBoolIn(g,id,'a0');return!(s&&scBool(sc,s,ctx,depth+1));}
  }
  return false;
}
function scJudge(sc,ctx){
  const g=sc.graph||{nodes:{},edges:[]};
  TR.flicks++;TR.hits[ctx.fig]=(TR.hits[ctx.fig]||0)+1;TR.used.add(ctx.fig);
  let cur=Object.keys(g.nodes).find(k=>g.nodes[k].type==='flick'),guard=0;const trail=[];
  while(cur&&guard++<60){
    const n=g.nodes[cur];trail.push(cur);
    if(n.type==='flick'){cur=scEdge(g,cur,'out');continue;}
    if(n.type==='branch'){const c=scBoolIn(g,cur,'cond');const ok=c?scBool(sc,c,ctx,0):false;cur=scEdge(g,cur,ok?'true':'false');continue;}
    if(n.type==='setStep'){TR.step=+n.value||0;cur=scEdge(g,cur,'out');continue;}
    SCN.trail=trail;
    if(n.type==='point')return trainNext(1,n.title||'+1',n.sub==null?'+1':n.sub,n.wait?+n.wait:undefined);
    if(n.type==='miss')return trainNext(0,n.title||'Miss',n.sub||'');
    if(n.type==='keep'){
      if(n.who==='same'){TR.allow=new Set([ctx.fig]);TR.prefer=ctx.fig;}
      else if(n.who==='other'){TR.allow.delete(ctx.fig);TR.prefer=[...TR.allow][0]??-1;}
      else TR.prefer=ctx.fig;
      if(n.max3!==false&&TR.hits[ctx.fig]>=3)TR.allow.delete(ctx.fig);
      if(!TR.allow.size)return trainNext(0,'No figures left','');
      return trainKeep({t:n.title||'Another flick',s:n.sub||''});
    }
    break;
  }
  SCN.trail=trail;
  return trainNext(0,'No result','The scenario did not decide this flick (a wire is missing).');
}
function scRoutine(sc){
  return{scenario:true,
    init(){TR.extra={};scDrawZones(sc);},
    setup(n){scSetup(sc,n);},
    judge(ctx){return scJudge(sc,ctx);}};
}
function scClean(o){
  const out={};const L=(o&&o.scenarios)||{};
  Object.entries(L).forEach(([id,s])=>{if(!/^[a-z0-9_]+$/i.test(id)||!s||typeof s!=='object')return;
    const U=s.setup||{};
    out[id]={id,name:String(s.name||id).slice(0,40),short:String(s.short||s.name||id).slice(0,10),info:String(s.info||''),on:s.on!==false,
      hint:Array.isArray(s.hint)?[String(s.hint[0]||''),String(s.hint[1]||'')]:null,
      setup:{pieces:(Array.isArray(U.pieces)?U.pieces:[]).filter(p=>p&&p.id>=0&&p.id<20&&isFinite(p.x)&&isFinite(p.z)).map(p=>({id:p.id|0,x:+p.x,z:+p.z,face:Array.isArray(p.face)?[+p.face[0]||0,+p.face[1]||0]:null})),
        ball:U.ball&&isFinite(U.ball.x)?{x:+U.ball.x,z:+U.ball.z}:null,zones:Array.isArray(U.zones)?U.zones.filter(z=>z&&(z.type==='rect'||z.type==='arc')):[],
        turns:U.turns&&Array.isArray(U.turns.order)?{order:U.turns.order.map(x=>x|0),ball:U.turns.ball||null,face:U.turns.face||null}:null,
        allow:Array.isArray(U.allow)?U.allow.map(x=>x|0):null,prefer:U.prefer!=null?U.prefer|0:null,keeper:U.keeper!=null?+U.keeper:null},
      graph:{nodes:(s.graph&&s.graph.nodes)||{},edges:(s.graph&&s.graph.edges)||[]}};
  });
  return out;
}
function scApply(o){
  const D=SCN.data=scClean(o);
  // put the code routines back first, then lay the data ones over them
  Object.keys(SCN.code).forEach(id=>{TRAIN_SET[id]=SCN.code[id];TR_HINT[id]=SCN.codeHint[id];const t=trDef(id);if(t)Object.assign(t,SCN.codeDef[id]);});
  for(let i=TRAIN.length-1;i>=0;i--)if(!SCN.code[TRAIN[i].id]){delete DRILLS[TRAIN[i].id];TRAIN.splice(i,1);}
  Object.values(D).forEach(sc=>{if(!sc.on)return;
    TRAIN_SET[sc.id]=scRoutine(sc);
    let t=trDef(sc.id);if(!t){t={id:sc.id};TRAIN.push(t);}Object.assign(t,{name:sc.name,short:sc.short,info:sc.info});
    DRILLS[sc.id]={name:sc.name,place:null,train:true};
    TR_HINT[sc.id]=sc.hint&&sc.hint[0]?()=>sc.hint:(SCN.codeHint[sc.id]||(()=>['Flick','']));});
  scPanel();
  // the routine on the table follows the edit (Distal's Try it)
  if(typeof trainOn==='function'&&trainOn()&&TR.on&&D[DR.kind]){runDrill(DR.kind,true);}
}
function scPanel(){
  const grid=$('#tdrills');if(!grid)return;
  grid.innerHTML=TRAIN.map(t=>`<button class="dbtn" data-drill="${t.id}" title="${t.name}: ${t.info}" aria-label="${t.name}"><b>${t.short}</b><small>–</small></button>`).join('');
  grid.querySelectorAll('.dbtn').forEach(b=>b.addEventListener('click',()=>{ensureAudio();if(sim.running)return;runDrill(b.dataset.drill,true);}));
  try{if(S.mode==='practice')renderPrac();}catch(e){}
}
// what Distal's Scenarios page needs: the pitch, the code routines, the rule pieces
function scenMeta(){
  return{pitch:{HX,HZ,GOAL,GDEPTH,SHOOT,RF,RB,WALLX,WALLZ,BOX:{deep:BOX.deep,half:BOX.half,sDeep:BOX.sDeep,sHalf:BOX.sHalf},circle:CIRCLE_R,ballGap:RF+RB+0.5},
    tries:TRAIN_N,routines:TRAIN.map(t=>({id:t.id,name:t.name,short:t.short,info:t.info,code:!!SCN.code[t.id],data:!!SCN.data[t.id]})),trail:SCN.trail||[]};
}
// start a routine from outside (Distal's Try it window)
function scTry(id){try{if(S.mode==='online'&&net.named)leaveRoom(true);DR.kind=id;if(typeof setMenuMode==='function')setMenuMode('practice');S.kits=kitSel.slice();applyKits();cam.mode=-1;closeMenu();startPractice();return true;}catch(e){console.warn('[scenarios]',e);return false;}}
onDataFile('scenarios',scApply);
