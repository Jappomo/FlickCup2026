// Flick Cup 2026 · js/rules.js
// Match rules: placement, turns and flow, Moments, the simulation driver, state commit/sync, box limits.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= placement & flow ================= */
function stopAll(){for(const b of bodies){b.vx=0;b.vz=0;b.spin=0;}ball.air=0;ball.hy=RB;for(const k of keepers){k.vz=0;k.target=k.z;}}
function separate(){
  syncGK();
  for(let it=0;it<16;it++){
    for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
      const a=bodies[i],b=bodies[j];if(a.off||b.off)continue;const dx=b.x-a.x,dz=b.z-a.z,rr=a.r+b.r+0.06,d2=dx*dx+dz*dz;
      if(d2>=rr*rr)continue;
      const d=Math.sqrt(d2);let nx=Math.cos(i+j),nz=Math.sin(i+j);if(d>1e-6){nx=dx/d;nz=dz/d;}
      const ov=rr-d;
      if(b.ball){a.x-=nx*ov;a.z-=nz*ov;}else if(a.ball){b.x+=nx*ov;b.z+=nz*ov;}
      else{a.x-=nx*ov/2;a.z-=nz*ov/2;b.x+=nx*ov/2;b.z+=nz*ov/2;}
    }
    for(const b of bodies){if(b.ball||b.off)continue;for(const k of keepers)if(!S.kOut[k.team])segHit(b,k.x,k.z-K_HALF,k.x,k.z+K_HALF,K_R+0.06,0,0,null);clampWall(b);}
  }
  stopAll();
}
function formation(ko){
  S.kOut=[0,0];S.kAt=[-1,-1];syncGK();
  for(let t=0;t<2;t++){const F=formOf(matchSquads[t]);for(let i=0;i<10;i++){
    const b=bodies[t*10+i];let [x,z]=kickSpot(F.pos[i][0],F.pos[i][1]);if(t===1){x=-x;z=-z;}
    b.x=x;b.z=z;b.yaw=t===0?0:Math.PI;}}
  // the kick-off pair stands at the ball: the first one kicks off
  const d=dirOf(ko),F=formOf(matchSquads[ko]),k=bodies[ko*10+F.kop[0]];k.x=-d*3.0;k.z=2.2*d;faceTo(k,0,0);
  const b2=bodies[ko*10+F.kop[1]];b2.x=-d*3.0;b2.z=-2.2*d;faceTo(b2,0,0);
  // the other side's kick-off pair waits just outside the centre circle, out towards the wings
  {const df=1-ko,dd=dirOf(df),FD=formOf(matchSquads[df]),R=9+RF+1,an=1.15;
    FD.kop.forEach((i,n)=>{const b=bodies[df*10+i],sz=n===0?1:-1;b.x=-dd*R*Math.cos(an);b.z=sz*dd*R*Math.sin(an);faceTo(b,0,0);});}
  ball.x=0;ball.z=0;keepers[0].z=keepers[1].z=0;keepers[0].target=keepers[1].target=0;
  stopAll();
}
function faceTo(b,x,z){b.yaw=Math.atan2(-(z-b.z),x-b.x);}
function cornerLayout(att,px,pz){
  const e=Math.sign(px)||1,sz=Math.sign(pz)||1,def=1-att;
  const spots=cornerSpots(matchSquads[att],CORNER_CFG.att),dspots=cornerSpots(matchSquads[def],CORNER_CFG.def),F=formOf(matchSquads[att]),FD=formOf(matchSquads[def]);
  const order=[0,1,2,3,5,6,7,8,9].sort((a,b)=>F.pos[b][0]-F.pos[a][0]);
  order.forEach((slot,k)=>{const [u,w]=spots[k],b=bodies[att*10+slot];b.x=e*(HX-u);b.z=sz*w;faceTo(b,e*HX,0);});
  const dorder=[0,1,2,3,4,5,6,7,8,9].sort((a,b)=>FD.pos[a][0]-FD.pos[b][0]);
  dorder.forEach((slot,k)=>{const [u,w]=dspots[k],b=bodies[def*10+slot];b.x=e*(HX-u);b.z=sz*w;faceTo(b,px,pz);});
}
function pushAway(team,px,pz,R){
  for(const b of bodies){
    if(b.ball||b.team===team)continue;
    const dx=b.x-px,dz=b.z-pz,d=Math.hypot(dx,dz);
    if(d<R){let nx=dx/d,nz=dz/d;if(!(d>1e-4)){nx=dirOf(team);nz=0;}b.x=px+nx*R;b.z=pz+nz*R;clampWall(b);}
  }
}
function placeTaker(team,sx,sz,forced){
  let best=team*10,bd=1e9;
  if(forced>=0)best=forced;else for(let i=0;i<10;i++){const b=bodies[team*10+i];if(b.off)continue;const d=Math.hypot(b.x-sx,b.z-sz);if(d<bd){bd=d;best=b.id;}}
  const b=bodies[best];b.x=sx;b.z=sz;faceTo(b,ball.x,ball.z);return best;
}
function resetPossession(team){S.possN++;S.poss=team;S.active=team;S.phase='attack';S.flicks=0;S.lastFig=-1;S.lastFigCount=0;S.setupLeft=0;S.setupKind='';S.taker=-1;S.koPend=false;}
function takeSpots(){
  // three spots behind the ball: behind = against the team's direction; for throw-ins, outside the touchline; for corners, outside the corner
  const k=S.setupKind,d=dirOf(S.active),r=RF+RB+0.9;let ang;
  if(k==='throw')ang=Math.atan2(Math.sign(ball.z)||1,0);else if(k==='corner')ang=Math.atan2(Math.sign(ball.z)||1,Math.sign(ball.x)||1);else ang=Math.atan2(0,-d);
  return [-0.62,0,0.62].map(a=>({x:ball.x+Math.cos(ang+a)*r,z:ball.z+Math.sin(ang+a)*r}));
}
function placeAtSpot(i,fig){
  if(S.phase!=='take')return;const sp=takeSpots()[clamp(i|0,0,2)];
  let id=fig!=null?fig:sel;if(!(id>=0&&bodies[id]&&bodies[id].team===S.active&&!bodies[id].off)){let bd=1e9;for(let k=0;k<10;k++){const b=bodies[S.active*10+k];if(b.off)continue;const D=Math.hypot(b.x-sp.x,b.z-sp.z);if(D<bd){bd=D;id=b.id;}}}
  const b=bodies[id];b.x=sp.x;b.z=sp.z;b.vx=b.vz=0;faceTo(b,ball.x,ball.z);separate();b.x=sp.x;b.z=sp.z;
  S.taker=id;S.phase='attack';const n=S.setupLeft,what=SP_NAME[S.setupKind]||'Set piece';
  S.msg={t:what,s:`${n} positional flick${n===1?'':'s'} if you want them, then take it.`,c:S.active};selPrefer=id;sel=id;commit();
}
const SP_NAME={corner:'Corner',free:'Free kick',throw:'Throw-in'};
function setPiece(team,kind,px,pz,title,sub){
  ball.x=px;ball.z=pz;stopAll();
  if(SETUP[kind]){
    pushAway(team,px,pz,8);separate();resetPossession(team);
    S.setupKind=kind;S.setupLeft=SETUP[kind];S.taker=-1;S.phase='take';
    let best=-1,bd=1e9;for(let i=0;i<10;i++){const b=bodies[team*10+i];if(b.off)continue;const D=Math.hypot(b.x-px,b.z-pz);if(D<bd){bd=D;best=b.id;}}
    sel=best;selPrefer=best;S.msg={t:title,s:sub+' Pick your taker and a spot.',w:1,c:team};commit();return;
  }
  const d=dirOf(team);let sx,sz,forced=-1;
  if(kind==='corner'){cornerLayout(team,px,pz);sx=px+Math.sign(px)*2.2;sz=pz+Math.sign(pz)*2.2;forced=team*10+4;}
  else if(kind==='throw'){sx=px-d*1.4;sz=pz+Math.sign(pz)*2.6;}
  else if(kind==='goalkick'){sx=px-d*2.6;sz=pz+(Math.sign(pz)||1)*1.2;}
  else{sx=px-d*3.0;sz=pz;}
  pushAway(team,px,pz,8);
  const taker=placeTaker(team,sx,sz,forced);
  separate();
  resetPossession(team);
  S.msg={t:title,s:sub,w:1,c:team};selPrefer=taker;commit();
}
function goalKick(team,side,title,sub){const d=dirOf(team);setPiece(team,'goalkick',-d*(HX-10),(side||1)*10,title||'Goal kick',sub||`${N(team)} restart from the goal area.`);}
function kickoff(team){
  formation(team);resetPossession(team);S.armed='';S.koPend=true;S.timeUp=false;
  S.msg={t:'Kick-off',s:`${N(team)} get the game going. The kick-off must be a pass.`,w:1,c:team};selPrefer=team*10+formOf(matchSquads[team]).kop[0];commit();
}
function newMatch(o){S.log=[];playMsg=null;S.paid=false;S.conceded=false;
  leaveDrills();o=o||{};
  S.ballV=o.ball||BALL.mine||((BALL.variants[0]||{}).id||'');showBall();S.lookV=o.look||lookStr(LOOKSEL);showLook();
  S.golden=false;S.score=[0,0];S.half=1;S.clock=S.halfLen;S.running=true;S.paused=false;S.ko1=0;S.bar=[0,0];S.armed='';S.armedTeam=-1;
  MBAL=BAL;applySquadStats();$('#ft').hidden=true;kickoff(0);ambience.update();
}
function addBar(t,v){if(S.noMoments)return;if(t===0||t===1)S.bar[t]=Math.min(BAR_MAX,S.bar[t]+v);}
function turnover(team,title,sub){resetPossession(team);S.msg={t:title,s:sub,c:team};commit();}
function scoreGoal(team,own){
  rumble(1,420);
  S.score[team]++;S.phase='goal';if(!own)addBar(team,MBAL.bar.goal);
  S.msg={t:'Goal!',s:own?`Own goal. ${N(team)} take it, ${S.score[0]}-${S.score[1]}.`:`${N(team)} score. ${S.score[0]}-${S.score[1]}.`,g:1,c:team};
  commit();const q=S.seq;
  setTimeout(()=>{if(S.seq!==q||!S.running)return;if(S.golden||S.clock<=0)endHalf();else kickoff(1-team);},2700);
}
function endHalf(){
  S.armed='';S.timeUp=false;S.taker=-1;S.setupKind='';S.setupLeft=0;
  if(S.half===1){
    S.phase='break';S.msg={t:'Half-time',s:`${N(0)} ${S.score[0]} - ${S.score[1]} ${N(1)}`,w:1};commit();const q=S.seq;
    setTimeout(()=>{if(S.seq!==q||!S.running)return;S.half=2;S.clock=S.halfLen;kickoff(1-S.ko1);},3000);
  }else if(S.tg&&!S.golden&&S.score[0]===S.score[1]){
    S.golden=true;S.phase='break';S.msg={t:'Golden goal',s:`${N(0)} ${S.score[0]} - ${S.score[1]} ${N(1)}. Next goal wins.`,w:1};commit();const q=S.seq;
    setTimeout(()=>{if(S.seq!==q||!S.running)return;S.clock=5999;kickoff(1-S.ko1);},3000);
  }else{S.golden=false;S.phase='end';setTimeout(()=>ambience.update(),0);S.msg={t:'Full-time',s:`${N(0)} ${S.score[0]} - ${S.score[1]} ${N(1)}`,w:1};commit();}
}
// four zones along the pitch, between the goal lines, shooting lines and halfway: 0..3 from the left end
function quarterOf(x){return clamp(Math.floor((x+HX)/(HX/2)),0,3);}
// zone letter for a team: A defence, B defensive midfield, C attacking midfield, D shooting area
function zoneOf(x,team){const q=quarterOf(x);return 'ABCD'[dirOf(team)>0?q:3-q];}
function outOfPlay(ctx,fallback){
  const o=ctx.out,lt=ctx.last==null?fallback:ctx.last;
  if(o.type==='side'){
    let t=1-lt,why=`${N(t)} take it from the touchline.`;
    // played off an opponent: only a throw if striker and that figure were in the same zone
    if(ctx.kind==='attack'&&lt!==ctx.team&&ctx.lastId>=0&&ctx.lastX!=null&&quarterOf(ctx.fx)!==quarterOf(ctx.lastX)){t=lt;why=`Played off a figure in another zone, so the throw goes to ${N(t)}.`;}
    return setPiece(t,'throw',clamp(o.x,-HX+1.5,HX-1.5),o.side*(HZ-1.3),'Throw-in',why);
  }
  const endTeam=o.end>0?1:0;
  if(lt===endTeam){const t=1-endTeam;return setPiece(t,'corner',o.end*(HX-1.2),o.side*(HZ-1.2),'Corner',`${N(t)} line up the corner.`);}
  return goalKick(endTeam,o.side);
}
// the keeper may only play the ball inside his own box: outside it he goes back on the rod and it's a free kick
function gkFoul(ctx){const t=ctx.gkFoul.t,o=1-t,k=GKB(t);
  S.kOut[t]=0;keepers[t].z=keepers[t].target=clamp(k.z,-K_RANGE,K_RANGE);k.off=true;k.x=400;k.z=400+t*8;
  const fx=clamp(ctx.gkFoul.x,-HX+2,HX-2),fz=clamp(ctx.gkFoul.z,-HZ+2,HZ-2);
  return setPiece(o,'free',fx,fz,'Keeper outside his box',`The ${N(t)} keeper played it outside his box. He goes back on the line, free kick to ${N(o)}.`);}
// a keeper off his rod who ends up outside his box walks back in
function gkReturn(){for(let t=0;t<2;t++){if(!S.kOut[t])continue;const k=GKB(t);if(k.off||inBox(k,t,BOX.deep,BOX.half))continue;
  const s=boxSide(t);let u=clamp(HX-s*k.x,k.r+0.3,BOX.deep-k.r-0.3);k.x=s*(HX-u);k.z=clamp(k.z,-BOX.half+k.r+0.3,BOX.half-k.r-0.3);k.vx=k.vz=0;S.boxNote=(S.boxNote?S.boxNote+' ':'')+`The ${N(t)} keeper goes back into his box.`;}}
function resolveAttack(ctx){
  const att=ctx.team,def=1-att;
  if(ctx.gkFoul)return gkFoul(ctx);
  if(ctx.setup){
    // positional flick: the ball never moves for it
    if(ctx.bmoved||ctx.hit||ctx.goal||ctx.out){ball.x=ctx.bx;ball.z=ctx.bz;ball.vx=ball.vz=0;separate();}
    S.setupLeft--;S.phase='defend';S.active=def;
    const what=(SP_NAME[S.setupKind]||'set piece').toLowerCase();
    S.msg={t:'Positional flick',s:S.setupLeft>0?`${S.setupLeft} more allowed before the ${what}. ${N(def)} may block.`:`${N(att)} must take the ${what} next. ${N(def)} may block.`,c:att};
    return commit();
  }
  if(ctx.taking||ctx.hit){S.setupLeft=0;S.setupKind='';S.taker=-1;}
  if(ctx.first==='opp'||ctx.first==='mate'){
    // foul: ball and figure go back, the other side picks who takes it
    ball.x=ctx.bx;ball.z=ctx.bz;const f=bodies[ctx.fig];f.x=ctx.fx;f.z=ctx.fz;separate();
    return setPiece(def,'free',ctx.bx,ctx.bz,'Foul',`${N(att)} hit ${ctx.first==='opp'?'an opponent':'a teammate'} before the ball. Free kick to ${N(def)}.`);
  }
  if(!ctx.hit)return turnover(def,'Missed',`No contact with the ball. ${N(def)} take over.`);
  if(ctx.fromArea)addBar(att,MBAL.bar.area);
  if(ctx.goal){
    const sc=ctx.goal.team;
    if(sc===att&&!ctx.fromArea&&ctx.last!==def)return goalKick(def,Math.sign(ball.z),'No goal','Shots only count from inside the shooting area.');
    return scoreGoal(sc,sc!==att);
  }
  if(ctx.out)return outOfPlay(ctx,att);
  if(ctx.last===def){addBar(def,MBAL.bar.steal);return ctx.lastK?turnover(def,'Saved',`The ${N(def)} keeper keeps it out.`):turnover(def,'Intercepted',`The ball came off a ${N(def).replace(/s$/,'')} figure.`);}
  S.flicks++;addBar(att,MBAL.bar.keep+(S.flicks>=3?MBAL.bar.chain:0));
  if(ctx.pass){S.lastFig=-1;S.lastFigCount=0;} // a pass to a teammate resets the count
  else if(S.lastFig===ctx.fig)S.lastFigCount++;else{S.lastFig=ctx.fig;S.lastFigCount=1;}
  if(S.koPend){S.lastFig=ctx.fig;S.lastFigCount=3;S.koPend=false;} // the kick-off figure cannot play the next flick
  if(ctx.recv>=0){S.lastFig=-1;S.lastFigCount=0;selPrefer=ctx.recv;}
  S.phase='defend';S.active=def;S.msg=ctx.trick?{t:'Trickster',s:'The figure follows the ball.',c:att}:null;commit();
}
function resolveDefend(ctx){
  const att=1-ctx.team,def=ctx.team;
  if(ctx.gkFoul)return gkFoul(ctx);
  if(ctx.moonHit){
    if(ctx.goal)return scoreGoal(ctx.goal.team,ctx.goal.team!==def);
    if(ctx.out)return outOfPlay(ctx,def);
    if(ctx.last===att){S.phase='attack';S.active=att;S.msg={t:'Cleared',s:`It came back to ${N(att)}.`,c:att};return commit();}
    addBar(def,MBAL.bar.moon);return turnover(def,'To the Moon!',`${N(def)} clear their lines and win the ball.`);
  }
  S.defN++;
  if(ctx.defTouch||ctx.goal||ctx.out){
    ball.x=ctx.bx;ball.z=ctx.bz;ball.vx=ball.vz=0;
    if(ctx.defTouch){const f=bodies[ctx.fig];f.x=ctx.fx;f.z=ctx.fz;f.vx=f.vz=0;S.ban={id:ctx.fig,n:S.defN};}
    separate();S.phase='attack';S.active=att;
    S.msg=ctx.defTouch?{t:'Block touched the ball',s:`Ball and figure go back. That figure sits out ${N(def)}'s next block.`,w:1,c:att}:null;
    return commit();
  }
  S.phase='attack';S.active=att;S.msg=null;commit();
}
function skipDefend(){if(S.phase!=='defend'||sim.running)return;S.defN++;S.phase='attack';S.active=S.poss;S.msg=null;clearAim();commit();}
function eligible(id){
  if(id<0||id>22||id===20)return false;const b=bodies[id];
  if(b.off)return false;
  if(b.team!==S.active)return false;
  if(S.phase==='take')return true;
  if(S.phase==='attack'&&S.taker>=0&&S.setupLeft<=0&&id!==S.taker)return false;
  if(S.phase==='defend'&&S.ban&&S.ban.n===S.defN&&id===S.ban.id)return false;
  if(S.phase==='attack'&&S.lastFig===id&&S.lastFigCount>=3)return false;
  return S.phase==='attack'||S.phase==='defend';
}
function autoSelect(){
  if(S.phase==='take'){if(selPrefer>=0&&eligible(selPrefer)){sel=selPrefer;selPrefer=-1;}if(!eligible(sel)){let bd=1e9;for(let i=0;i<10;i++){const b=bodies[S.active*10+i];if(b.off)continue;const D=Math.hypot(b.x-ball.x,b.z-ball.z);if(D<bd){bd=D;sel=b.id;}}}return;}
  if(!(S.phase==='attack'||S.phase==='defend')){sel=-1;return;}
  if(selPrefer>=0&&eligible(selPrefer)){sel=selPrefer;selPrefer=-1;return;}
  selPrefer=-1;
  let tx=ball.x,tz=ball.z;
  if(S.phase==='defend'){const g=-dirOf(S.active)*HX;tx=lerp(ball.x,g,0.25);tz=ball.z*0.75;}
  let best=-1,bd=1e9;
  for(let i=0;i<10;i++){const id=S.active*10+i;if(!eligible(id))continue;const b=bodies[id];const d=Math.hypot(b.x-tx,b.z-tz);if(d<bd){bd=d;best=id;}}
  sel=best;
}
function cycleSel(step){
  const ids=[];for(let i=0;i<10;i++){const id=S.active*10+i;if(eligible(id))ids.push(id);}if(eligible(21+S.active))ids.push(21+S.active);
  if(!ids.length)return;
  ids.sort((a,b)=>Math.hypot(bodies[a].x-ball.x,bodies[a].z-ball.z)-Math.hypot(bodies[b].x-ball.x,bodies[b].z-ball.z));
  const k=ids.indexOf(sel);sel=ids[((k<0?0:k+step)%ids.length+ids.length)%ids.length];
}
function controls(team){if(S.mode==='local')return true;if(S.mode==='practice'||S.mode==='tutorial')return team===0;if(S.mode==='cpu')return team!==cpuTeam;return team===net.myTeam;}
// keeper off the rod: on your turn with the ball in your small box he becomes a normal figure.
// He can go back from your next turn on; doing it while you don't have the ball costs your block.
function gkState(team){
  if(!(S.running&&!S.paused&&!sim.running&&S.active===team&&(S.phase==='attack'||S.phase==='defend')))return null;
  if(!S.kOut[team]){if(S.phase==='attack'&&S.taker<0&&!S.setupKind&&inBox(ball,team,BOX.deep,BOX.half))return{out:true,label:'Keeper out'};return null;}
  if(S.possN===S.kAt[team])return null;
  return S.phase==='attack'?{out:false,label:'Keeper back'}:{out:false,cost:true,label:'Keeper back (skip block)'};
}
function gkToggle(team){
  const st=gkState(team);if(!st||!controls(team))return;
  const k=keepers[team],b=GKB(team);
  if(st.out){
    S.kOut[team]=1;S.kAt[team]=S.possN;b.off=false;b.r=RF;b.x=k.x;b.z=k.z;b.vx=b.vz=0;b.yaw=team===0?0:Math.PI;separate();
    sel=b.id;selPrefer=b.id;S.msg={t:'Keeper out',s:'Your keeper plays as a normal figure. He can go back to the line from your next turn.',c:team};sfx('tock',10);return commit();
  }
  S.kOut[team]=0;k.z=k.target=clamp(b.z,-K_RANGE,K_RANGE);b.off=true;b.x=400;b.z=400+team*8;separate();
  if(st.cost){S.defN++;S.phase='attack';S.active=1-team;S.msg={t:'Keeper back',s:`Back on the line, but it cost ${N(team)} the block.`,c:team};}
  else S.msg={t:'Keeper back',s:'Back on his line.',c:team};
  sfx('tock',10);commit();
}
function takeTurn(){return S.running&&!S.paused&&!sim.running&&S.phase==='take'&&controls(S.active);}
function localTurn(){return S.running&&!S.paused&&!sim.running&&(S.phase==='attack'||S.phase==='defend')&&controls(S.active);}
function isAuthority(){return S.mode!=='online'||S.active===net.myTeam;}

/* ================= moments ================= */
function momentOk(team){
  if(!(S.phase==='attack'||S.phase==='defend')||S.active!==team||S.armed)return false;
  const k=matchSquads[team].special;
  if(k==='finesse')return S.phase==='attack'&&inAttArea(team,ball.x);
  if(k==='maradona')return S.phase==='attack';
  if(k==='bicycle'){if(S.phase!=='attack')return false;for(let i=0;i<10;i++)if(inAttArea(team,bodies[team*10+i].x))return true;return false;}
  if(k==='thread')return S.phase==='attack'&&Math.abs(ball.x)<SHOOT;
  if(k==='moon')return S.phase==='defend'&&inDefArea(team,ball.x);
  return false;
}
function momentWhy(team){return{finesse:'Needs the ball in the shooting area',maradona:'Use it on your attacking turn',bicycle:'Needs a teammate in the shooting area',thread:'Needs the ball in midfield',moon:'Use it while blocking in your own area'}[matchSquads[team].special];}
function activateMoment(team){
  if(team==null||S.bar[team]<BAR_MAX||!momentOk(team)||sim.running)return;
  S.bar[team]=0;S.armed=matchSquads[team].special;S.armedTeam=team;
  S.msg={t:SPECIALS[S.armed].name,s:'Player of the Match Moment',m:1,c:team};selPrefer=sel;commit();
}
function moment(text){if(S.mode!=='online'||isAuthority())banner(text,'',{m:1});}

/* ================= simulation driver ================= */
const sim={running:false,ctx:null,acc:0,t:0,still:0,lastSend:0};
function startFlick(id,dx,dz,power,kind,soft){
  const p=clamp(power,0,1.4);if(p<0.02||sim.running)return;
  const b=bodies[id],L=Math.hypot(dx,dz);if(!(L>1e-6))return;
  let ux=dx/L,uz=dz/L;
  let v=flickSpeed(id,p,kind);
  if(soft){const amp=Math.max(0,sv(b,'mae')),e=Math.random()+Math.random()-1;v*=Math.sqrt(Math.max(0.5,1+amp*e*1.6));const a=(Math.random()*2-1)*amp*0.1,c=Math.cos(a),s=Math.sin(a),nx=ux*c-uz*s,nz=ux*s+uz*c;ux=nx;uz=nz;}
  b.vx=ux*v;b.vz=uz*v;b.spin=(Math.random()-0.5)*(4+p*14);rumble(clamp(p*0.6,0.15,0.7),90);
  const special=(S.armed&&S.armedTeam===b.team)?S.armed:'';
  sim.ctx={glide:Math.abs(b.x)<SHOOT?clamp(sv(b,'b2b'),0.3,3):1,kind,team:b.team,fig:id,bx:ball.x,bz:ball.z,fdx:ux,fdz:uz,first:null,hit:false,last:null,defTouch:false,out:null,goal:null,done:false,
    fromArea:inAttArea(b.team,ball.x),setup:kind==='attack'&&S.taker>=0&&id!==S.taker&&S.setupLeft>0,taking:kind==='attack'&&S.taker===id,fx:b.x,fz:b.z,pass:false,lastId:null,lastX:null,soft:!!soft,special,curl:special==='finesse'&&kind==='attack'?curlSign:0,recv:-1};
  if(special)S.armed='';
  sim.running=true;sim.acc=0;sim.t=0;sim.still=0;sim.lastSend=0;
  clearAim();sfx('flick',v);updateHud();
  if(S.mode==='online'&&net.named)net.named.presence({aim:null,kz:null}).catch(()=>{});
}
function runSim(dt){
  sim.acc+=dt;const h=1/240;let n=0;
  while(sim.acc>=h&&n<48){physStep(h,sim.ctx);sim.acc-=h;n++;}
  sim.t+=dt;
  if(S.mode==='online'&&net.named){const now=performance.now();if(now-sim.lastSend>60){sim.lastSend=now;net.named.presence({sim:{s:S.seq,p:packPos()}}).catch(()=>{});}}
  let mv=0;for(const b of bodies)mv=Math.max(mv,Math.abs(b.vx)+Math.abs(b.vz));
  sim.still=mv<0.5&&ball.air<=0?sim.still+dt:0;
  if(sim.still>0.25||sim.t>12)endSim();
}
function endSim(){
  sim.running=false;const ctx=sim.ctx;sim.ctx=null;
  ctx.bmoved=Math.hypot(ball.x-ctx.bx,ball.z-ctx.bz)>0.05;
  if(ctx.attached||ctx.attach){ctx.attach=false;separate();}else stopAll();
  if(S.mode==='online'&&net.named)net.named.presence({sim:null}).catch(()=>{});
  playPend={kind:ctx.kind,team:ctx.team,fig:ctx.fig,hit:!!ctx.hit,setup:!!ctx.setup};
  if(ctx.kind==='attack')resolveAttack(ctx);else resolveDefend(ctx);
  playPend=null;
  // time ran out: the half ends once the attacking turn has been played (not on a positional flick)
  if(S.timeUp&&ctx.kind==='attack'&&!ctx.setup&&S.running&&S.phase!=='goal'&&S.phase!=='end'&&S.phase!=='break'){const q=S.seq;setTimeout(()=>{if(S.seq===q&&S.timeUp&&S.running&&!sim.running)endHalf();},1300);}
}

/* ================= state commit / sync ================= */
function banner(t,s,o){
  o=o||{};const el=$('#toast'),band=$('#toast-band');
  $('#toast-t').textContent=t;$('#toast-s').textContent=s||'';
  band.style.setProperty('--tc',o.m?'#c99a2e':o.c!=null?kitOf(o.c).ui:'#6e33e6');
  band.style.color=(o.c!=null&&!o.m&&(S.kits[o.c]===2||S.kits[o.c]===3))?'#07142c':'#fff';
  el.classList.remove('on');void el.offsetWidth;el.classList.toggle('long',!!o.g);el.classList.add('on');
  if(o.m)sfx('moment');
}
/* ================= box limits =================
   In your own penalty box: at most 1 figure in the small box (goal area) and 3 in the whole box.
   Checked at the start of every turn. The figures that went in last are moved just outside. */
const BOX={deep:18,half:22,sDeep:6,sHalf:10,maxSmall:1,maxBig:3};let boxClock=0;
function boxSide(t){return -dirOf(t);} // the end a team defends
function inBox(b,t,deep,half){const s=boxSide(t),u=HX-s*b.x;return u>=-1&&u<=deep&&Math.abs(b.z)<=half;}
function spotFree(x,z,r,skip){for(const o of bodies){if(o===skip||o.off)continue;if(Math.hypot(o.x-x,o.z-z)<r+o.r+0.25)return false;}return true;}
function pushOut(b,t,deep,half){
  const s=boxSide(t),gap=b.r+0.4,u=HX-s*b.x;
  // nearest way out: through the front edge, or through a side edge
  const front=deep+gap-u,side=half+gap-Math.abs(b.z);
  let x,z;if(front<=side){x=s*(HX-(deep+gap));z=b.z;}else{x=b.x;z=Math.sign(b.z||1)*(half+gap);}
  z=clamp(z,-(HZ-b.r-0.2),HZ-b.r-0.2);
  // slide along the edge until the spot is clear
  const alongZ=front<=side;
  for(let k=0;k<40;k++){const off=(k%2?1:-1)*Math.ceil(k/2)*(b.r*1.1);const px=alongZ?x:clamp(x+off,-HX+b.r,HX-b.r),pz=alongZ?clamp(z+off,-(HZ-b.r-0.2),HZ-b.r-0.2):z;
    if(spotFree(px,pz,b.r,b)){x=px;z=pz;break;}}
  b.x=x;b.z=z;b.vx=b.vz=0;
}
function enforceBoxes(){
  if(!(S.phase==='attack'||S.phase==='defend')||sim.running)return 0;
  let moved=0;
  for(let t=0;t<2;t++){
    const figs=[];for(let i=0;i<10;i++){const b=bodies[t*10+i];if(b.off)continue;if(inBox(b,t,BOX.deep,BOX.half)){if(!b.boxT)b.boxT=++boxClock;figs.push(b);}else b.boxT=0;}
    const order=a=>a.slice().sort((p,q)=>p.boxT-q.boxT);
    const small=order(figs.filter(b=>inBox(b,t,BOX.sDeep,BOX.sHalf)));
    small.slice(BOX.maxSmall).forEach(b=>{pushOut(b,t,BOX.sDeep,BOX.sHalf);moved++;});
    const big=order(figs.filter(b=>inBox(b,t,BOX.deep,BOX.half)));
    big.slice(BOX.maxBig).forEach(b=>{pushOut(b,t,BOX.deep,BOX.half);b.boxT=0;moved++;});
  }
  if(moved)S.boxNote=`Box limit: ${moved} figure${moved>1?'s':''} moved outside the box.`;
  return moved;
}
// last plays: every banner message, otherwise a short line for the flick that was just played
let playPend=null,playMsg=null;
function figTag(id){if(id==null||id<0)return'';if(id>20)return 'GK';const t=id<10?0:1,i=id%10,F=formOf(matchSquads[t]);return (F.lab[i]||'')+' #'+NUMS[i];}
function logPlay(){
  let e=null;
  if(S.msg&&S.msg!==playMsg){playMsg=S.msg;e={t:String(S.msg.t||''),s:String(S.msg.s||'').slice(0,90),c:S.msg.c!=null?S.msg.c:-1};}
  else if(playPend){const p=playPend,who=figTag(p.fig);
    e={t:p.kind==='defend'?`${N(p.team)} block`:p.setup?`${N(p.team)} reposition`:`${N(p.team)} flick`,s:p.kind==='defend'?`${who} slid in.`:p.setup?`${who} moved into place.`:p.hit?`${who} played the ball.`:`${who} moved.`,c:p.team};}
  playPend=null;
  if(e&&e.t){S.log=[e,...(S.log||[])].slice(0,12);}
}
const PL={more:store.get('baize.plays6')==='1',mine:store.get('baize.playsMe')==='1'};
function myLogTeam(){return S.mode==='online'?(net.myTeam==null?-1:net.myTeam):S.mode==='cpu'?1-cpuTeam:-1;}
function renderLog(){const box=$('#plays');if(!box)return;const on=S.running&&$('#hub').hidden&&S.phase!=='end';box.hidden=!on;if(!on)return;
  const mt=myLogTeam();$('#plays-mine').hidden=mt<0;
  const all=S.log||[],L=(PL.mine&&mt>=0?all.filter(e=>e.c===mt):all).slice(0,PL.more?6:3),ul=$('#plays-list'),sig=JSON.stringify(L)+PL.more+PL.mine;if(ul.dataset.sig===sig)return;ul.dataset.sig=sig;ul.innerHTML='';
  if(!L.length){const li=document.createElement('li');li.className='empty';li.textContent=PL.mine?'None of your plays yet.':'No plays yet.';ul.appendChild(li);return;}
  L.forEach((e,k)=>{const li=document.createElement('li');if(k===0)li.className='new';const col=e.c>=0&&S.kits?kitOf(e.c).ui:'rgba(255,255,255,.4)';li.style.setProperty('--pc',col);
    const b=document.createElement('b');b.textContent=e.t;const sm=document.createElement('small');sm.textContent=e.s;li.appendChild(b);li.appendChild(sm);ul.appendChild(li);});}
function commit(){if(!sim.running)gkReturn();logPlay();enforceBoxes();S.seq++;onState();if(S.boxNote){const t=S.boxNote;S.boxNote='';setTimeout(()=>flashSub(t),0);}if(S.mode==='online')net.sendState();}
function onState(){
  if(S.msg){banner(S.msg.t,S.msg.s,S.msg);if(S.msg.g)sfx('goal');else if(S.msg.w)sfx('whistle');}
  autoSelect();updateHud();
  if(S.phase==='end')showFT();
}
const POSLEN=71;
function packPos(){
  const a=[];
  for(let i=0;i<20;i++){const b=bodies[i];a.push(Math.round(b.x*10),Math.round(b.z*10),Math.round((((b.yaw%6.2832)+6.2832)%6.2832)*100));}
  a.push(Math.round(ball.x*10),Math.round(ball.z*10),Math.round(keepers[0].z*100),Math.round(keepers[1].z*100),Math.round(ball.hy*10));
  for(let t=0;t<2;t++){const b=GKB(t);a.push(Math.round(b.x*10),Math.round(b.z*10),Math.round((((b.yaw%6.2832)+6.2832)%6.2832)*100));}
  return a;
}
function unpackPos(a,out){
  for(let i=0;i<20;i++){const b=bodies[i],x=+a[i*3]/10,z=+a[i*3+1]/10,y=+a[i*3+2]/100;
    if(!isFinite(x)||!isFinite(z))continue;
    if(out){out[i*3]=x;out[i*3+1]=z;out[i*3+2]=isFinite(y)?y:b.yaw;}else{b.x=x;b.z=z;if(isFinite(y))b.yaw=y;}}
  const bx=+a[60]/10,bz=+a[61]/10,k0=+a[62]/100,k1=+a[63]/100,hy=+a[64]/10;
  if(out){out[60]=bx;out[61]=bz;out[62]=k0;out[63]=k1;out[64]=isFinite(hy)?hy:RB;}
  else{if(isFinite(bx))ball.x=bx;if(isFinite(bz))ball.z=bz;if(isFinite(k0))keepers[0].z=clamp(k0,-K_RANGE,K_RANGE);if(isFinite(k1))keepers[1].z=clamp(k1,-K_RANGE,K_RANGE);ball.hy=RB;}
  for(let t=0;t<2;t++){const j=65+t*3,x=+a[j]/10,z=+a[j+1]/10,y=+a[j+2]/100;if(!isFinite(x)||!isFinite(z))continue;if(out){out[j]=x;out[j+1]=z;out[j+2]=isFinite(y)?y:0;}else{const b=GKB(t);b.x=x;b.z=z;if(isFinite(y))b.yaw=y;}}
}
function packState(){return{v:2,seq:S.seq,running:S.running,score:S.score.slice(),half:S.half,clock:Math.round(S.clock*10)/10,halfLen:S.halfLen,phase:S.phase,poss:S.poss,active:S.active,flicks:S.flicks,lastFig:S.lastFig,lastFigCount:S.lastFigCount,ko1:S.ko1,setupLeft:S.setupLeft,setupKind:S.setupKind,bar:S.bar.slice(),ballV:S.ballV||'',lookV:S.lookV||'',armed:S.armed,armedTeam:S.armedTeam,kits:S.kits.slice(),sq:[serSquad(matchSquads[0]),serSquad(matchSquads[1])],bal:MBAL,log:S.log,tk:S.taker,tu:S.timeUp?1:0,kout:S.kOut.slice(),kat:S.kAt.slice(),pn:S.possN,ban:S.ban,dn:S.defN,ko:S.koPend?1:0,tg:S.tg?1:0,gg:S.golden?1:0,nm:S.noMoments?1:0,msg:S.msg,p:packPos()};}
const PHASES=['idle','attack','defend','goal','break','end','take'];
function onRemoteState(d){
  if(!d||d.v!==2||!Array.isArray(d.p)||d.p.length!==POSLEN||!PHASES.includes(d.phase))return;
  if(S.mode==='online'&&S.running&&!(d.seq>S.seq))return;
  const int=(v,a,b,f)=>{v=Math.round(+v);return isFinite(v)?clamp(v,a,b):f;};
  S.mode='online';sim.running=false;sim.ctx=null;remoteT=null;
  S.seq=int(d.seq,0,1e9,S.seq);S.running=!!d.running;S.score=[int(d.score&&d.score[0],0,99,0),int(d.score&&d.score[1],0,99,0)];
  S.half=int(d.half,1,2,1);S.halfLen=int(d.halfLen,60,900,300);S.clock=clamp(+d.clock||0,0,900);S.phase=d.phase;
  S.poss=int(d.poss,0,1,0);S.active=int(d.active,0,1,0);S.flicks=int(d.flicks,0,999,0);S.lastFig=int(d.lastFig,-1,22,-1);S.lastFigCount=int(d.lastFigCount,0,9,0);S.ko1=int(d.ko1,0,1,0);
  S.setupLeft=int(d.setupLeft,0,3,0);S.setupKind=SETUP[d.setupKind]?d.setupKind:'';
  S.bar=[int(d.bar&&d.bar[0],0,BAR_MAX,0),int(d.bar&&d.bar[1],0,BAR_MAX,0)];
  S.ballV=typeof d.ballV==='string'?d.ballV.replace(/[^0-9]/g,'').slice(0,6):'';showBall();
  S.lookV=typeof d.lookV==='string'?lookStr(parseLookStr(d.lookV.slice(0,40))):'';showLook();
  S.armed=SPECIALS[d.armed]?d.armed:'';S.armedTeam=int(d.armedTeam,-1,1,-1);
  const k0=int(d.kits&&d.kits[0],0,KITS.length-1,0),k1=int(d.kits&&d.kits[1],0,KITS.length-1,1);S.kits=[k0,k1];applyKits();
  if(d.bal)MBAL=cleanBal(d.bal);
  S.tg=!!d.tg;S.golden=!!d.gg;S.noMoments=!!d.nm;
  S.log=Array.isArray(d.log)?d.log.slice(0,12).filter(e=>e&&typeof e==='object').map(e=>({t:String(e.t||'').slice(0,40),s:String(e.s||'').slice(0,90),c:e.c===0||e.c===1?e.c:-1})):[];
  S.kOut=[0,1].map(t=>d.kout&&d.kout[t]?1:0);S.kAt=[0,1].map(t=>int(d.kat&&d.kat[t],-1,1e9,-1));S.possN=int(d.pn,0,1e9,0);syncGK();
  S.taker=int(d.tk,-1,22,-1);S.timeUp=!!d.tu;S.defN=int(d.dn,0,1e6,0);S.koPend=!!d.ko;S.ban=d.ban&&isFinite(+d.ban.id)?{id:int(d.ban.id,0,22,0),n:int(d.ban.n,0,1e6,0)}:null;
  if(Array.isArray(d.sq)){matchSquads=[parseSquad(d.sq[0],0),parseSquad(d.sq[1],1)];applySquadStats();}
  S.msg=d.msg&&typeof d.msg.t==='string'?{t:String(d.msg.t).slice(0,40),s:String(d.msg.s||'').slice(0,160),g:!!d.msg.g,w:!!d.msg.w,m:!!d.msg.m,c:d.msg.c===0||d.msg.c===1?d.msg.c:undefined}:null;
  unpackPos(d.p,null);stopAll();
  if(S.phase!=='end')$('#ft').hidden=true;
  if(S.running&&S.phase!=='end'&&!$('#hub').hidden&&net.named)closeMenu();
  onState();
}

