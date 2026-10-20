// Flick Cup 2026 · js/physics.js
// Movement, collisions and flick physics of the pieces and the ball.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= physics ================= */
function clampWall(b){
  if(b.x>WALLX-b.r){b.x=WALLX-b.r;if(b.vx>0)b.vx=-b.vx*0.4;}
  if(b.x<-WALLX+b.r){b.x=-WALLX+b.r;if(b.vx<0)b.vx=-b.vx*0.4;}
  if(b.z>WALLZ-b.r){b.z=WALLZ-b.r;if(b.vz>0)b.vz=-b.vz*0.4;}
  if(b.z<-WALLZ+b.r){b.z=-WALLZ+b.r;if(b.vz<0)b.vz=-b.vz*0.4;}
}
function segHit(b,ax,az,bx,bz,rad,e,kv,onHit){
  const abx=bx-ax,abz=bz-az,L2=abx*abx+abz*abz;
  const t=L2>0?clamp(((b.x-ax)*abx+(b.z-az)*abz)/L2,0,1):0;
  const px=ax+abx*t,pz=az+abz*t;let dx=b.x-px,dz=b.z-pz;const rr=b.r+rad,d2=dx*dx+dz*dz;
  if(d2>=rr*rr)return false;
  let d=Math.sqrt(d2);if(d<1e-6){dx=Math.sign(b.x||1);dz=0;d=1;}
  const nx=dx/d,nz=dz/d;b.x=px+nx*rr;b.z=pz+nz*rr;
  const vn=b.vx*nx+(b.vz-kv)*nz;
  if(vn<0){b.vx-=(1+e)*vn*nx;b.vz-=(1+e)*vn*nz;if(onHit&&vn<-0.3)onHit(-vn);}
  return true;
}
function circlePair(a,b,ctx){
  if(a.off||b.off)return;
  const isBall=a.ball||b.ball;
  if(isBall&&ball.air>0)return;
  if(ctx&&ctx.attach){const f=ctx.fig;if(isBall||a.id===f||b.id===f)return;}
  const dx=b.x-a.x,dz=b.z-a.z,rr=a.r+b.r,d2=dx*dx+dz*dz;
  if(d2>=rr*rr)return;
  let d=Math.sqrt(d2),nx=1,nz=0;if(d>1e-6){nx=dx/d;nz=dz/d;}
  const ma=isBall?a.m:a.mass,mb=isBall?b.m:b.mass;
  const ia=1/ma,ib=1/mb,sum=ia+ib,ov=rr-d;
  a.x-=nx*ov*ia/sum;a.z-=nz*ov*ia/sum;b.x+=nx*ov*ib/sum;b.z+=nz*ov*ib/sum;
  const rv=(b.vx-a.vx)*nx+(b.vz-a.vz)*nz;
  if(rv>=0)return;
  const e=isBall?E_BALL:E_FIG,j=-(1+e)*rv/sum;
  a.vx-=j*nx*ia;a.vz-=j*nz*ia;b.vx+=j*nx*ib;b.vz+=j*nz*ib;
  if(!isBall){const tw=(rv*0.15)*(Math.random()-0.5);a.spin+=tw;b.spin-=tw;}
  if(rv<-0.3){contact(a,b,ctx);sfx(isBall?'tock':'clack',-rv);}
}
function contact(a,b,ctx){
  if(!ctx||ctx.done)return;
  if(a.ball||b.ball){const f=a.ball?b:a;ballTouched(ctx,f.team,f.id);}
  else if(a.id===ctx.fig||b.id===ctx.fig){const o=a.id===ctx.fig?b:a;if(!ctx.first)ctx.first=o.team===ctx.team?'mate':'opp';}
}
function travelDist(v,dec,drag){if(v<=0)return 0;return (v-(dec/drag)*Math.log(1+drag*v/dec))/drag;}
function speedForDist(d,dec,drag){let lo=0,hi=260;for(let i=0;i<32;i++){const m=(lo+hi)/2;if(travelDist(m,dec,drag)<d)lo=m;else hi=m;}return (lo+hi)/2;}
function ballTouched(ctx,team,id){
  if(id>20&&id===ctx.fig&&!ctx.gkFoul){const k=bodies[id];if(k&&!inBox(k,k.team,BOX.deep,BOX.half))ctx.gkFoul={t:k.team,x:ball.x,z:ball.z};}
  const first=id===ctx.fig&&!ctx.hit;
  if(ctx.hit&&id!==ctx.fig)ctx.curlOff=true;
  if(first){ctx.hit=true;if(!ctx.first)ctx.first='ball';}
  ctx.last=team;ctx.lastK=id===-1;ctx.lastId=id;ctx.lastX=id>=0?bodies[id].x:null;
  if(ctx.kind==='attack'&&ctx.hit&&team===ctx.team&&id>=0&&id!==ctx.fig)ctx.pass=true; // played onto a teammate
  if(ctx.kind==='defend'&&team===ctx.team&&id===ctx.fig&&ctx.special==='moon'&&!ctx.moonHit){
    ctx.moonHit=true;let ux=ball.vx,uz=ball.vz,L=Math.hypot(ux,uz);if(L<0.5){ux=ctx.fdx;uz=ctx.fdz;L=1;}
    const sp=Math.max(70,L*1.5);ball.vx=ux/L*sp;ball.vz=uz/L*sp;ball.air=ball.airT=1.05;moment('To the Moon!');return;
  }
  if(ctx.kind==='defend'&&team===ctx.team)ctx.defTouch=true;
  if(first){
    const f=bodies[ctx.fig],bs=Math.hypot(ball.vx,ball.vz);
    if(ctx.special==='maradona'){
      ctx.attach=true;ctx.adx=ctx.fdx;ctx.adz=ctx.fdz;const v=speedForDist(26,FIG_DEC,FIG_DRAG);f.vx=ctx.adx*v;f.vz=ctx.adz*v;moment('Maradona!');
    }else if(ctx.special==='thread'&&bs>1){
      const ux=ball.vx/bs,uz=ball.vz/bs,T=travelDist(bs,BALL_DEC,BALL_DRAG),px=ball.x+ux*T,pz=ball.z+uz*T;
      let rid=-1,rd=40;for(let i=0;i<10;i++){const id2=ctx.team*10+i;if(id2===ctx.fig)continue;const r=bodies[id2],dd=Math.hypot(r.x-px,r.z-pz);if(dd<rd){rd=dd;rid=id2;}}
      if(rid>=0){const r=bodies[rid],qx=px+ux*(RF+RB)*0.5,qz=pz+uz*(RF+RB)*0.5,D=Math.hypot(qx-r.x,qz-r.z);if(D>0.3){const v=speedForDist(D,FIG_DEC,FIG_DRAG);r.vx=(qx-r.x)/D*v;r.vz=(qz-r.z)/D*v;}ctx.recv=rid;moment('Thread the Needle!');}
    }else if(ctx.soft&&bs>1&&Math.random()<clamp(sv(f,'trk'),0,1)){
      const mx=clamp(svx(f,'trkd'),0,100)/100,T=travelDist(bs,BALL_DEC,BALL_DRAG),v=speedForDist(T*mx*(0.67+Math.random()*0.33),FIG_DEC,FIG_DRAG);f.vx=ball.vx/bs*v;f.vz=ball.vz/bs*v;ctx.trick=true;
    }
  }
  if(id>=0&&id!==ctx.fig&&id===ctx.recv&&!ctx.trapped){const r=bodies[id];ctx.trapped=true;ball.vx=r.vx*0.35;ball.vz=r.vz*0.35;}
  if(ctx.special==='bicycle'&&ctx.hit&&!ctx.bikeDone&&id>=0&&id!==ctx.fig&&team===ctx.team&&inAttArea(team,bodies[id].x)){
    const d=dirOf(team),kz=keepers[1-team].z,gz=(kz>0?-1:1)*(GOAL-2.6);let tx=d*HX+d*2-ball.x,tz=gz-ball.z;const tl=Math.hypot(tx,tz)||1;tx/=tl;tz/=tl;
    let bx=ball.vx,bz=ball.vz;const bl=Math.hypot(bx,bz);if(bl>0.1){bx/=bl;bz/=bl;}else{bx=tx;bz=tz;}
    const fx=tx*0.72+bx*0.28,fz=tz*0.72+bz*0.28,fl=Math.hypot(fx,fz)||1;ball.vx=fx/fl*84;ball.vz=fz/fl*84;
    ctx.bikeDone=true;ctx.fromArea=true;ctx.curlOff=true;moment('Bicycle kick!');
  }
}
function keeperContact(k,b,ctx,v){
  sfx(b.ball?'tock':'clack',v);
  if(!ctx||ctx.done)return;
  if(b.ball)ballTouched(ctx,k.team,-1);
  else if(b.id===ctx.fig&&!ctx.first)ctx.first=k.team===ctx.team?'mate':'opp';
}
function keeperReflex(ctx,h){
  const def=1-ctx.team,k=keepers[def],s=Math.sign(k.x);if(S.kOut[def])return;
  const vx=ball.vx*s,dist=Math.abs(k.x-ball.x);
  if(vx>5&&dist<50&&!ctx.done&&ball.air<=0){
    ctx.react=(ctx.react||0)+h;
    if(ctx.react>K_REACT){const t=dist/vx;k.target=clamp(ball.z+ball.vz*t,-K_RANGE,K_RANGE);}
  }else ctx.react=0;
}
function ballHeight(){if(ball.air<=0)return RB;const t=clamp(1-ball.air/ball.airT,0,1);return RB+11*4*t*(1-t);}
function checkBall(ctx){
  if(ctx.done){if(ctx.out){ball.vx=0;ball.vz=0;ball.air=0;}return;}
  const ax=Math.abs(ball.x),az=Math.abs(ball.z);
  if(ax>HX+RB){
    if(az<GOAL&&ballHeight()<5){ctx.goal={team:ball.x>0?0:1};ctx.done=true;sfx('net');}
    else{ctx.out={type:'end',end:Math.sign(ball.x),side:Math.sign(ball.z)||1,x:ball.x};ctx.done=true;ball.vx=ball.vz=0;ball.air=0;}
  }else if(az>HZ+RB){ctx.out={type:'side',side:Math.sign(ball.z),x:ball.x};ctx.done=true;ball.vx=ball.vz=0;ball.air=0;}
}
function physStep(h,ctx){
  syncGK();
  if(ctx&&ctx.kind==='attack')keeperReflex(ctx,h);
  for(const k of keepers){const p=k.z,d=k.target-k.z,m=K_SPEED*h;k.z=clamp(k.z+clamp(d,-m,m),-K_RANGE,K_RANGE);k.vz=(k.z-p)/h;}
  if(ctx&&ctx.curl&&ctx.hit&&!ctx.curlOff){const sp=Math.hypot(ball.vx,ball.vz);if(sp>3){const k=ctx.curl*CURL_K*h,nvx=ball.vx-ball.vz*k,nvz=ball.vz+ball.vx*k,ns=Math.hypot(nvx,nvz);ball.vx=nvx/ns*sp;ball.vz=nvz/ns*sp;}}
  for(const b of bodies){if(b.vx||b.vz){b.x+=b.vx*h;b.z+=b.vz*h;}}
  if(ball.air>0){ball.air-=h;if(ball.air<=0){ball.air=0;sfx('tock',20);}}
  const n=bodies.length;
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)circlePair(bodies[i],bodies[j],ctx);
  for(const b of bodies){
    if(b.off)continue;
    const skip=b.ball&&(ball.air>0||(ctx&&ctx.attach));
    if(!skip&&Math.abs(b.x)>HX-3){
      const e=Math.sign(b.x),gx=e*HX,bx=e*(HX+GDEPTH);
      segHit(b,gx,-GOAL,gx,-GOAL,0.35,0.35,0,v=>sfx('clack',v));
      segHit(b,gx,GOAL,gx,GOAL,0.35,0.35,0,v=>sfx('clack',v));
      segHit(b,gx,-GOAL,bx,-GOAL,0.15,0.12,0,null);
      segHit(b,gx,GOAL,bx,GOAL,0.15,0.12,0,null);
      segHit(b,bx,-GOAL,bx,GOAL,0.15,0.12,0,null);
    }
    if(!skip&&Math.abs(b.x)>53){for(const k of keepers)if(!S.kOut[k.team])segHit(b,k.x,k.z-K_HALF,k.x,k.z+K_HALF,K_R,0.5,k.vz,v=>keeperContact(k,b,ctx,v));}
    clampWall(b);
  }
  if(ctx&&ctx.attach){
    const f=bodies[ctx.fig],sp=Math.hypot(f.vx,f.vz);
    if(sp>0.8){ctx.adx=f.vx/sp;ctx.adz=f.vz/sp;}
    ball.x=f.x+ctx.adx*(RF+RB+0.08);ball.z=f.z+ctx.adz*(RF+RB+0.08);ball.vx=f.vx;ball.vz=f.vz;
    if(sp<1.2||Math.abs(ball.z)>HZ-1||Math.abs(ball.x)>HX-1){ctx.attach=false;ctx.attached=true;ball.vx=ctx.adx*8;ball.vz=ctx.adz*8;}
  }
  for(const b of bodies){
    const sp=Math.hypot(b.vx,b.vz);
    if(sp>0&&!(b.ball&&ball.air>0)){let dec=(b.ball?BALL_DEC+BALL_DRAG*sp:FIG_DEC+FIG_DRAG*sp)*h;
      // Box-to-Box: the flicked figure slides further until it reaches the ball, so it never adds power
      if(ctx&&b.id===ctx.fig&&!ctx.hit&&ctx.glide!==1)dec/=ctx.glide;if(sp<=dec){b.vx=0;b.vz=0;}else{const s=(sp-dec)/sp;b.vx*=s;b.vz*=s;}}
    if(!b.ball){b.yaw+=b.spin*h;b.spin*=Math.exp(-(sp<0.5?9:2.5)*h);}
  }
  ball.hy=ballHeight();
  if(ctx)checkBall(ctx);
}
const speedOf=p=>VMIN+(VMAX-VMIN)*Math.pow(clamp(p,0,1.4),1.15);
function flickSpeed(id,p,kind){
  const b=bodies[id];let v=speedOf(p);
  if(kind==='attack'&&inAttArea(b.team,ball.x))v*=Math.max(0.1,sv(b,'sht'));
  return v;
}
const PATH=[];
function predict(id,dx,dz,p,kind,special){
  const b=bodies[id],L=Math.hypot(dx,dz)||1,ux=dx/L,uz=dz/L,v0=flickSpeed(id,p,kind);
  const rx=ball.x-b.x,rz=ball.z-b.z,proj=rx*ux+rz*uz,perp2=rx*rx+rz*rz-proj*proj,R=RF+RB;
  let sHit=Infinity;if(proj>0&&perp2<R*R)sHit=proj-Math.sqrt(R*R-perp2);
  const total=travelDist(v0,FIG_DEC,FIG_DRAG);
  PATH.length=0;
  if(!(sHit<=total))return{len:total,hit:false,cos:0};
  let v=v0,s=0;const hh=1/240;
  while(s<sHit&&v>0){s+=v*hh;v-=(FIG_DEC+FIG_DRAG*v)*hh;}
  const cx=b.x+ux*sHit,cz=b.z+uz*sHit;let nx=ball.x-cx,nz=ball.z-cz;const nl=Math.hypot(nx,nz)||1;nx/=nl;nz/=nl;
  const cos=Math.max(0,ux*nx+uz*nz);
  let vb=(1+E_BALL)*M_FIG/(M_FIG+M_BALL)*Math.max(0,v)*cos,bvx=nx*vb,bvz=nz*vb,air=0;
  if(special==='maradona'&&kind==='attack'){for(let i=1;i<=10;i++)PATH.push(ball.x+ux*26*i/10,ball.z+uz*26*i/10);return{len:sHit,hit:true,cos:1};}
  if(special==='moon'&&kind==='defend'){const sp=Math.max(70,vb*1.5);bvx=nx*sp;bvz=nz*sp;air=1.05;}
  let x=ball.x,z=ball.z,t=0,acc=0,lx=x,lz=z;const curl=(special==='finesse'&&kind==='attack')?curlSign:0,h=1/90;
  while(t<4&&PATH.length<96){
    const sp=Math.hypot(bvx,bvz);if(sp<0.4)break;
    if(curl&&sp>3){const k=curl*CURL_K*h,nvx=bvx-bvz*k,nvz=bvz+bvx*k,ns=Math.hypot(nvx,nvz);bvx=nvx/ns*sp;bvz=nvz/ns*sp;}
    x+=bvx*h;z+=bvz*h;t+=h;
    if(air>0)air-=h;else{const dec=(BALL_DEC+BALL_DRAG*sp)*h,s2=Math.max(0,sp-dec)/sp;bvx*=s2;bvz*=s2;}
    acc+=Math.hypot(x-lx,z-lz);lx=x;lz=z;
    if(acc>=2.6){acc=0;PATH.push(x,z);}
    if(Math.abs(x)>HX+2||Math.abs(z)>HZ+2)break;
  }
  if(PATH.length===0)PATH.push(x,z);
  return{len:sHit,hit:true,cos};
}

