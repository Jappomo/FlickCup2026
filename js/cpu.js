// Flick Cup 2026 · js/cpu.js
// The computer opponent.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= CPU ================= */
let cpuPlan=null;
function blockedPath(fid,x0,z0,x1,z1){
  const dx=x1-x0,dz=z1-z0,L2=dx*dx+dz*dz||1;
  for(const b of bodies){if(b.id===fid||b.ball||b.off)continue;const t=clamp(((b.x-x0)*dx+(b.z-z0)*dz)/L2,0,1),px=x0+dx*t,pz=z0+dz*t;if(Math.hypot(b.x-px,b.z-pz)<RF+b.r+0.3)return true;}
  return false;
}
let cpuTakeT=0;
function cpuAttack(team){
  const d=dirOf(team),gx=d*HX,inArea=inAttArea(team,ball.x),ok=keepers[1-team],P=cpuStyle(team);
  let tx,tz;
  if(inArea){const side=ok.z>0?-1:1;tx=gx+d*2;tz=side*(GOAL-2.4)+(Math.random()-0.5)*1.5;}
  else{tx=ball.x+d*P.pass;tz=clamp(ball.z*0.55+(Math.random()-0.5)*P.spread,-HZ+6,HZ-6);}
  let ddx=tx-ball.x,ddz=tz-ball.z;const dl=Math.hypot(ddx,ddz)||1;ddx/=dl;ddz/=dl;
  const ix=ball.x-ddx*(RF+RB-0.05),iz=ball.z-ddz*(RF+RB-0.05);
  let best=null;
  for(let i=0;i<10;i++){
    const id=team*10+i;if(!eligible(id))continue;if(S.taker>=0&&id!==S.taker)continue;const b=bodies[id];
    const ax=ix-b.x,az=iz-b.z,D=Math.hypot(ax,az);if(D<0.3||D>70)continue;
    const cos=(ax*ddx+az*ddz)/D;if(cos<0.4)continue;
    const cost=D*(1+(1-cos)*3)+(blockedPath(id,b.x,b.z,ix,iz)?200:0);
    if(!best||cost<best.cost)best={id,cost,ax,az,D,cos};
  }
  if(!best){let bd=1e9;for(let i=0;i<10;i++){const id=team*10+i;if(!eligible(id))continue;const b=bodies[id],D=Math.hypot(ball.x-b.x,ball.z-b.z);if(D<bd){bd=D;best={id,ax:ball.x-b.x,az:ball.z-b.z,D,cos:1};}}}
  if(!best)return{fig:null};
  const want=inArea?95:Math.sqrt(2*(BALL_DEC+8)*clamp(dl,14,P.pass>30?P.pass+4:34));
  const vc=Math.min(90,want/(1.36*Math.max(0.5,best.cos)));
  const v0=Math.sqrt(vc*vc+2*(FIG_DEC+FIG_DRAG*vc*0.6)*best.D);
  let p=clamp(Math.pow(clamp((v0-VMIN)/(VMAX-VMIN),0,1),1/1.15),0.12,1);
  if(P.power)p=clamp(p*(1+(Math.random()-0.5)*2*P.power),0.12,1);
  const err=(Math.random()-0.5)*(inArea?0.05:0.07)*P.aim,c=Math.cos(err),s=Math.sin(err);
  return{fig:best.id,dx:best.ax*c-best.az*s,dz:best.ax*s+best.az*c,p};
}
function cpuDefend(team){
  const P=cpuStyle(team),gx=-dirOf(team)*HX;let ux=gx-ball.x,uz=-ball.z;const L=Math.hypot(ux,uz)||1;ux/=L;uz/=L;
  const tx=ball.x+ux*P.press,tz=ball.z+uz*P.press,kz=clamp(ball.z*0.35,-K_RANGE,K_RANGE);
  // sit back: some playstyles let the ball run while it is in their attacking half
  if(P.sit&&ball.x*dirOf(team)>0&&Math.random()<P.sit)return{fig:null,kz};
  for(let i=0;i<10;i++){const b=bodies[team*10+i];if(b.off)continue;if(Math.hypot(b.x-tx,b.z-tz)<3.5)return{fig:null,kz};}
  let best=null;
  for(let i=0;i<10;i++){const id=team*10+i,b=bodies[id];if(b.off)continue;const D=Math.hypot(tx-b.x,tz-b.z);if(D<1||D>P.reach)continue;
    const dx=tx-b.x,dz=tz-b.z,t=clamp(((ball.x-b.x)*dx+(ball.z-b.z)*dz)/(D*D),0,1),px=b.x+dx*t,pz=b.z+dz*t;
    if(Math.hypot(ball.x-px,ball.z-pz)<RF+RB+1.2)continue;
    if(!best||D<best.D)best={id,D,dx,dz};}
  if(!best)return{fig:null,kz};
  const v0=Math.sqrt(2*(FIG_DEC+FIG_DRAG*12)*best.D*0.92);
  const p=clamp(Math.pow(clamp((v0-VMIN)/(VMAX-VMIN),0,1),1/1.15),0.05,1);
  return{fig:best.id,dx:best.dx,dz:best.dz,p,kz};
}
function cpuTick(dt){
  if((S.mode==='cpu'||S.mode==='practice'||S.mode==='tutorial')&&S.running&&!S.paused&&!sim.running&&S.phase==='take'&&S.active===cpuTeam){if(!cpuTakeT)cpuTakeT=performance.now();if(performance.now()-cpuTakeT>900){cpuTakeT=0;placeAtSpot(1,-1);}return;}
  if(S.mode==='tutorial'&&(TUT[DR.step].wait==='next'||TUT[DR.step].wait==='end'))return;
  if(DR.noBlocks&&S.running&&!S.paused&&!sim.running&&S.phase==='defend'&&S.active===cpuTeam&&(S.mode==='practice'||S.mode==='tutorial')){skipDefend();return;}
  if(!(S.mode==='cpu'||S.mode==='practice'||S.mode==='tutorial')||!S.running||S.paused||sim.running||!(S.phase==='attack'||S.phase==='defend')||S.active!==cpuTeam){if(cpuPlan&&cpuPlan.seq!==S.seq)cpuPlan=null;return;}
  if(!cpuPlan||cpuPlan.seq!==S.seq){
    if(S.mode==='cpu'&&S.bar[cpuTeam]>=BAR_MAX&&momentOk(cpuTeam)&&!inAttArea(cpuTeam,ball.x)&&(cpuStyle(cpuTeam).moment>=1||Math.random()<cpuStyle(cpuTeam).moment)){activateMoment(cpuTeam);return;}
    cpuPlan=S.phase==='attack'?cpuAttack(cpuTeam):cpuDefend(cpuTeam);cpuPlan.seq=S.seq;cpuPlan.t=0;cpuPlan.k0=keepers[cpuTeam].z;
  }
  if(cpuPlan.done)return;
  cpuPlan.t+=dt;
  if(cpuPlan.kz!=null){const k=keepers[cpuTeam];k.z=k.target=lerp(cpuPlan.k0,cpuPlan.kz,clamp(cpuPlan.t/0.8,0,1));}
  if(cpuPlan.fig!=null){sel=cpuPlan.fig;const k=clamp((cpuPlan.t-0.45)/0.75,0,1);aimShow=k>0?{fig:cpuPlan.fig,dx:cpuPlan.dx,dz:cpuPlan.dz,p:cpuPlan.p*k,snap:false}:null;}
  if(cpuPlan.t>1.45){cpuPlan.done=true;aimShow=null;if(cpuPlan.fig==null)skipDefend();else startFlick(cpuPlan.fig,cpuPlan.dx,cpuPlan.dz,cpuPlan.p,S.phase,cpuPlan.p<=SOFT);}
}

