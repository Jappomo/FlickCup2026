// Flick Cup 2026 · js/scene.js
// three.js renderer, lights, pitch, figures, aim arrows.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= three.js scene ================= */
const canvas=$('#c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x050b1a);scene.fog=new THREE.Fog(0x050b1a,260,560);
const camera=new THREE.PerspectiveCamera(42,1,1,1400);
const lin=c=>new THREE.Color(c).convertSRGBToLinear();
const std=(c,r,m)=>new THREE.MeshStandardMaterial({color:lin(c),roughness:r==null?0.5:r,metalness:m||0});
const skyLight=new THREE.HemisphereLight(0xe8f0ff,0x1a2a18,0.55);skyLight.name='Sky';scene.add(skyLight);
const sun=new THREE.DirectionalLight(0xfff1dc,1.15);sun.name='Sun';sun.position.set(-40,120,60);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-85,right:85,top:62,bottom:-62,near:10,far:320});sun.shadow.bias=-0.0005;sun.shadow.normalBias=0.03;
scene.add(sun);
const fill=new THREE.DirectionalLight(0xbcd2ff,0.35);fill.name='Fill';fill.position.set(60,80,-50);scene.add(fill);
function pitchTexture(mode){
  const W=2048,H=Math.round(2048*88/132),c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  const sx=W/132,X=x=>(x+66)*sx,Z=z=>(z+44)*sx;
  if(mode!=='lines')for(let i=0;i<14;i++){g.fillStyle=i%2?'#2b6f38':'#307a3e';const w=132/14;g.fillRect(Math.floor(X(-66+i*w)),0,Math.ceil(w*sx)+1,H);}
  if(mode!=='lines')for(let i=0;i<46000;i++){const v=Math.random();g.fillStyle=v<0.5?'rgba(0,0,0,0.07)':'rgba(255,255,255,0.045)';g.fillRect(Math.random()*W,Math.random()*H,1+Math.random()*2.5,1);}
  const t0=new THREE.CanvasTexture(c);t0.encoding=THREE.sRGBEncoding;t0.anisotropy=renderer.capabilities.getMaxAnisotropy();if(mode==='cloth')return t0;
  g.strokeStyle='rgba(244,246,238,0.92)';g.fillStyle='rgba(244,246,238,0.92)';g.lineWidth=0.36*sx;g.lineCap='round';
  const line=(a,b,c2,d)=>{g.beginPath();g.moveTo(X(a),Z(b));g.lineTo(X(c2),Z(d));g.stroke();};
  const rect=(x0,z0,x1,z1)=>{g.strokeRect(X(Math.min(x0,x1)),Z(Math.min(z0,z1)),Math.abs(x1-x0)*sx,Math.abs(z1-z0)*sx);};
  const arc=(x,z,r,a0,a1)=>{g.beginPath();g.arc(X(x),Z(z),r*sx,a0,a1);g.stroke();};
  const dot=(x,z,r)=>{g.beginPath();g.arc(X(x),Z(z),r*sx,0,Math.PI*2);g.fill();};
  rect(-HX,-HZ,HX,HZ);line(0,-HZ,0,HZ);arc(0,0,9,0,Math.PI*2);dot(0,0,0.55);
  const a=Math.acos(6/9);
  for(const e of [-1,1]){
    rect(e*HX,-22,e*(HX-18),22);rect(e*HX,-10,e*(HX-6),10);dot(e*(HX-12),0,0.5);
    if(e>0)arc(HX-12,0,9,Math.PI-a,Math.PI+a);else arc(-HX+12,0,9,-a,a);
    arc(e*HX,-HZ,1.6,e>0?Math.PI/2:0,e>0?Math.PI:Math.PI/2);
    arc(e*HX,HZ,1.6,e>0?Math.PI:-Math.PI/2,e>0?Math.PI*1.5:0);
  }
  g.save();g.setLineDash([2.2*sx,1.4*sx]);g.lineWidth=0.3*sx;g.strokeStyle='rgba(244,246,238,0.75)';
  line(SHOOT,-HZ,SHOOT,HZ);line(-SHOOT,-HZ,-SHOOT,HZ);g.restore();
  g.font=`700 ${Math.round(1.6*sx)}px "Saira", sans-serif`;g.fillStyle='rgba(244,246,238,0.35)';g.textAlign='center';
  for(const e of [-1,1]){g.save();g.translate(X(e*(SHOOT+1.8)),Z(HZ-4));g.rotate(-e*Math.PI/2);g.fillText('SHOOTING AREA',0,0);g.restore();}
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;
}
function woodTexture(){
  const c=document.createElement('canvas');c.width=512;c.height=64;const g=c.getContext('2d');
  g.fillStyle='#5b3820';g.fillRect(0,0,512,64);
  for(let i=0;i<70;i++){g.strokeStyle=`rgba(${Math.random()<0.5?'30,16,8':'120,80,45'},${0.15+Math.random()*0.2})`;g.lineWidth=0.5+Math.random()*1.5;g.beginPath();const y=Math.random()*64;g.moveTo(0,y);for(let x=0;x<=512;x+=32)g.lineTo(x,y+Math.sin(x*0.02+i)*2);g.stroke();}
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
}
// built-in table: hidden when a field model is loaded
const FIELD=new THREE.Group();scene.add(FIELD);
// built-in field surface (no lines): hidden when a field model is loaded
const CLOTH=new THREE.Group();scene.add(CLOTH);
const cloth=new THREE.Mesh(new THREE.PlaneGeometry(132,88),new THREE.MeshStandardMaterial({map:pitchTexture('cloth'),roughness:0.95}));
cloth.rotation.x=-Math.PI/2;cloth.position.y=0.01;cloth.receiveShadow=true;CLOTH.add(cloth);
const surround=new THREE.Mesh(new THREE.PlaneGeometry(2*WALLX+4,2*WALLZ+4),std(0x1f4a29,0.97));
surround.rotation.x=-Math.PI/2;surround.receiveShadow=true;CLOTH.add(surround);
// pitch markings live on their own see-through layer, so every field gets the same lines
const LINES=new THREE.Mesh(new THREE.PlaneGeometry(132,88),new THREE.MeshStandardMaterial({map:pitchTexture('lines'),roughness:0.95,transparent:true,opacity:0.78,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
LINES.rotation.x=-Math.PI/2;LINES.position.y=0.03;LINES.receiveShadow=true;LINES.renderOrder=1;scene.add(LINES);
function redrawLines(){const old=LINES.material.map;LINES.material.map=pitchTexture('lines');LINES.material.needsUpdate=true;if(old)old.dispose();}
const woodMat=new THREE.MeshStandardMaterial({map:woodTexture(),roughness:0.6,color:0xffffff});
const tableTop=new THREE.Mesh(new THREE.BoxGeometry(2*WALLX+10,6,2*WALLZ+10),woodMat);tableTop.position.y=-3.05;tableTop.receiveShadow=true;FIELD.add(tableTop);
[[0,WALLZ+1.5,2*WALLX+6,3],[0,-WALLZ-1.5,2*WALLX+6,3]].forEach(([x,z,w,d])=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,2.6,d),woodMat);m.position.set(x,1.3,z);m.castShadow=m.receiveShadow=true;FIELD.add(m);});
[[WALLX+1.5,0],[-WALLX-1.5,0]].forEach(([x,z])=>{const m=new THREE.Mesh(new THREE.BoxGeometry(3,2.6,2*WALLZ),woodMat);m.position.set(x,1.3,z);m.castShadow=m.receiveShadow=true;FIELD.add(m);});
const floor=new THREE.Mesh(new THREE.CircleGeometry(400,48),std(0x070d1c,1));floor.rotation.x=-Math.PI/2;floor.position.y=-40;scene.add(floor);
[[-WALLX+4,-WALLZ+4],[WALLX-4,-WALLZ+4],[-WALLX+4,WALLZ-4],[WALLX-4,WALLZ-4]].forEach(([x,z])=>{const m=new THREE.Mesh(new THREE.BoxGeometry(5,34,5),woodMat);m.position.set(x,-23,z);FIELD.add(m);});
const white=std(0xf4f4ef,0.35);
function bar(p1,p2,r,mat){const v=new THREE.Vector3().subVectors(p2,p1),L=v.length(),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,L,10),mat);m.position.copy(p1).addScaledVector(v,0.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());m.castShadow=true;FIELD.add(m);return m;}
const netMat=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.38});
function netQuad(a,b,c,d,nu,nv){const pts=[];const P=(u,v)=>{const ab=a.clone().lerp(b,u),dc=d.clone().lerp(c,u);return ab.lerp(dc,v);};
  for(let i=0;i<=nu;i++){const u=i/nu;const p0=P(u,0),p1=P(u,1);pts.push(p0.x,p0.y,p0.z,p1.x,p1.y,p1.z);}
  for(let j=0;j<=nv;j++){const v=j/nv;const p0=P(0,v),p1=P(1,v);pts.push(p0.x,p0.y,p0.z,p1.x,p1.y,p1.z);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));FIELD.add(new THREE.LineSegments(g,netMat));}
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
for(const e of [-1,1]){
  const gx=e*HX,bx=e*(HX+GDEPTH),H=5,BH=3.4;
  bar(V(gx,0,-GOAL),V(gx,H,-GOAL),0.32,white);bar(V(gx,0,GOAL),V(gx,H,GOAL),0.32,white);bar(V(gx,H,-GOAL-0.3),V(gx,H,GOAL+0.3),0.32,white);
  bar(V(bx,0,-GOAL),V(bx,BH,-GOAL),0.15,white);bar(V(bx,0,GOAL),V(bx,BH,GOAL),0.15,white);bar(V(bx,BH,-GOAL),V(bx,BH,GOAL),0.15,white);
  bar(V(gx,H,-GOAL),V(bx,BH,-GOAL),0.15,white);bar(V(gx,H,GOAL),V(bx,BH,GOAL),0.15,white);
  netQuad(V(gx,0,-GOAL),V(bx,0,-GOAL),V(bx,BH,-GOAL),V(gx,H,-GOAL),8,7);
  netQuad(V(gx,0,GOAL),V(bx,0,GOAL),V(bx,BH,GOAL),V(gx,H,GOAL),8,7);
  netQuad(V(bx,0,-GOAL),V(bx,0,GOAL),V(bx,BH,GOAL),V(bx,BH,-GOAL),22,5);
  netQuad(V(gx,H,-GOAL),V(gx,H,GOAL),V(bx,BH,GOAL),V(bx,BH,-GOAL),22,8);
}
const skinM=[0xe8b996,0xc68e62,0x8d5a3b,0xf1cfb0].map(c=>std(c,0.6));
const hairM=[0x2b1d14,0x5a3a1e,0x111111,0xc9a35a,0x7a4a20].map(c=>std(c,0.8));
const teamM=[0,1].map(()=>({shirt:std(0xffffff,0.45),shorts:std(0xffffff,0.5),socks:std(0xffffff,0.5),insert:std(0xffffff,0.3),base:std(0x161616,0.3),gk:std(0xffffff,0.45)}));
const aimMats=[0,1].map(()=>new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.92,depthWrite:false}));
function applyKits(){
  for(let t=0;t<2;t++){const k=kitOf(t),m=teamM[t];m.shirt.color.copy(lin(k.shirt));m.shorts.color.copy(lin(k.shorts));m.socks.color.copy(lin(k.socks));m.insert.color.copy(lin(k.insert));m.gk.color.copy(lin(k.gk));aimMats[t].color.copy(lin(k.ui));}
  updateHud();
}
const GEO={
  dome:new THREE.SphereGeometry(RF,28,12,0,Math.PI*2,0,Math.PI/2),
  insert:new THREE.CylinderGeometry(RF*0.7,RF*0.7,0.14,28),
  leg:new THREE.CylinderGeometry(0.16,0.13,1.35,8),
  shorts:new THREE.BoxGeometry(0.62,0.5,0.82),
  torso:new THREE.CylinderGeometry(0.4,0.32,1.2,10),
  arm:new THREE.CylinderGeometry(0.11,0.09,1.0,6),
  head:new THREE.SphereGeometry(0.3,14,10),
  hair:new THREE.SphereGeometry(0.315,14,8,0,Math.PI*2,0,Math.PI/2.1)
};
function mesh(g,m,x,y,z,shadow){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);if(shadow!==false)o.castShadow=true;return o;}
const figGroups=[];
function buildFigure(t,i){
  const M=teamM[t],g=new THREE.Group();g.userData.id=t*10+i;
  const dome=mesh(GEO.dome,M.base,0,0,0);dome.scale.y=0.55;g.add(dome);
  g.add(mesh(GEO.insert,M.insert,0,0.86,0,false));
  const skin=skinM[(i*7+t*3)%4],hair=hairM[(i*5+t*2)%5],b=new THREE.Group();b.position.y=0.93;g.add(b);
  const l1=mesh(GEO.leg,M.socks,0.18,0.66,0.2);l1.rotation.z=-0.3;b.add(l1);
  const l2=mesh(GEO.leg,M.socks,-0.14,0.66,-0.2);l2.rotation.z=0.24;b.add(l2);
  b.add(mesh(GEO.shorts,M.shorts,0,1.35,0));
  const tor=mesh(GEO.torso,M.shirt,0.05,1.95,0);tor.rotation.z=-0.1;b.add(tor);
  const a1=mesh(GEO.arm,M.shirt,-0.05,1.95,0.52);a1.rotation.x=-0.38;a1.rotation.z=0.45;b.add(a1);
  const a2=mesh(GEO.arm,M.shirt,0.12,1.95,-0.52);a2.rotation.x=0.38;a2.rotation.z=-0.45;b.add(a2);
  b.add(mesh(GEO.head,skin,0.1,2.82,0));b.add(mesh(GEO.hair,hair,0.07,2.87,0,false));
  scene.add(g);return g;
}
for(let t=0;t<2;t++)for(let i=0;i<10;i++)figGroups.push(buildFigure(t,i));
const kFig=[0,1].map(t=>{const g=buildFigure(t,0);g.userData.id=21+t;const M=teamM[t];g.traverse(o=>{if(o.isMesh&&(o.material===M.shirt||o.material===M.shorts||o.material===M.socks))o.material=M.gk;});g.visible=false;return g;});
const keeperGroups=[0,1].map(t=>{
  const M=teamM[t],g=new THREE.Group();g.userData.keeper=t;const s=t===0?-1:1;
  const base=new THREE.Mesh(new THREE.CylinderGeometry(K_R,K_R,2*K_HALF,18),M.base);base.rotation.x=Math.PI/2;base.scale.set(1,1,0.5);base.castShadow=true;g.add(base);
  [-K_HALF,K_HALF].forEach(z=>{const c=new THREE.Mesh(new THREE.SphereGeometry(K_R,16,10),M.base);c.scale.y=0.5;c.position.z=z;c.castShadow=true;g.add(c);});
  const ins=new THREE.Mesh(new THREE.BoxGeometry(1.2,0.14,2*K_HALF),M.insert);ins.position.y=0.62;g.add(ins);
  const torso=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.36,1.5,10),M.gk);torso.rotation.x=Math.PI/2;torso.position.set(0,1.25,0.35);torso.castShadow=true;g.add(torso);
  const head=new THREE.Mesh(GEO.head,skinM[t]);head.position.set(0,1.35,1.45);head.castShadow=true;g.add(head);
  [0.28,-0.28].forEach(x=>{const a=new THREE.Mesh(GEO.arm,M.gk);a.rotation.x=Math.PI/2;a.position.set(x,1.45,2.0);a.castShadow=true;g.add(a);});
  const shorts=new THREE.Mesh(new THREE.BoxGeometry(0.75,0.5,0.6),M.gk);shorts.position.set(0,1.15,-0.6);g.add(shorts);
  [0.2,-0.2].forEach(x=>{const l=new THREE.Mesh(GEO.leg,M.gk);l.rotation.x=Math.PI/2;l.position.set(x,1.05,-1.5);l.castShadow=true;g.add(l);});
  const rodLen=(HX+GDEPTH+9)-K_X;const rod=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.13,rodLen,8),std(0x9aa3a8,0.3,0.8));rod.rotation.z=Math.PI/2;rod.position.set(s*rodLen/2,0.95,0);g.add(rod);
  const knob=new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,2.6,12),std(0x1a1a1a,0.5));knob.rotation.z=Math.PI/2;knob.position.set(s*(rodLen+1.3),0.95,0);knob.castShadow=true;g.add(knob);
  scene.add(g);return g;
});
function ballTexture(){
  const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');g.fillStyle='#f6f5f0';g.fillRect(0,0,512,256);g.fillStyle='#1b1b1b';
  const spot=(lon,lat)=>{const x=(lon/360)*512,y=(0.5-lat/180)*256,rx=22/Math.max(0.25,Math.cos(lat*Math.PI/180)),ry=22;for(const dx of [-512,0,512]){g.beginPath();g.ellipse(x+dx,y,rx,ry,0,0,Math.PI*2);g.fill();}};
  spot(0,90);spot(0,-90);for(let i=0;i<5;i++){spot(i*72,26.6);spot(i*72+36,-26.6);}
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;
}
const ballMesh=new THREE.Mesh(new THREE.SphereGeometry(RB,28,18),new THREE.MeshStandardMaterial({map:ballTexture(),roughness:0.35}));ballMesh.castShadow=true;scene.add(ballMesh);
const ballShadow=new THREE.Mesh(new THREE.CircleGeometry(RB*1.1,20),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.35,depthWrite:false}));ballShadow.rotation.x=-Math.PI/2;ballShadow.position.y=0.03;ballShadow.visible=false;scene.add(ballShadow);
const ringGeo=new THREE.RingGeometry(2.0,2.5,40);ringGeo.rotateX(-Math.PI/2);
const selRing=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:0x5cf2ea,transparent:true,opacity:0.95,depthWrite:false}));selRing.position.y=0.05;selRing.renderOrder=3;scene.add(selRing);
const lockRing=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:0xff5a4a,transparent:true,opacity:0.8,depthWrite:false}));lockRing.position.y=0.04;lockRing.scale.setScalar(0.92);scene.add(lockRing);
const recvRing=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:0xf2cf6b,transparent:true,opacity:0.9,depthWrite:false}));recvRing.position.y=0.05;recvRing.renderOrder=3;recvRing.visible=false;scene.add(recvRing);
const targetGeo=new THREE.RingGeometry(1.1,1.5,32);targetGeo.rotateX(-Math.PI/2);
const spotRings=[0,1,2].map(()=>{const m=new THREE.Mesh(new THREE.CircleGeometry(0.75,28).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x5cf2ea,transparent:true,opacity:0.95,depthWrite:false}));m.visible=false;m.renderOrder=6;m.position.y=0.07;scene.add(m);return m;});
function showSpots(){const on=S.running&&S.phase==='take';spotRings.forEach((m,i)=>{m.visible=on;if(on){const p=takeSpots()[i];m.position.x=p.x;m.position.z=p.z;m.scale.setScalar(1+0.08*Math.sin(performance.now()/220+i));}});}
const targetRing=new THREE.Mesh(targetGeo,new THREE.MeshBasicMaterial({color:0xf2cf6b,transparent:true,opacity:0.9,depthWrite:false}));targetRing.position.y=0.06;targetRing.visible=false;scene.add(targetRing);
const aimGroup=new THREE.Group();aimGroup.position.y=0.08;scene.add(aimGroup);
const shaftGeo=new THREE.PlaneGeometry(1,1.1);shaftGeo.rotateX(-Math.PI/2);shaftGeo.translate(0.5,0,0);
const headShape=new THREE.Shape();headShape.moveTo(0,-1.6);headShape.lineTo(2.1,0);headShape.lineTo(0,1.6);headShape.lineTo(0,-1.6);
const headGeo=new THREE.ShapeGeometry(headShape);headGeo.rotateX(-Math.PI/2);
const shaft=new THREE.Mesh(shaftGeo,aimMats[0]),head=new THREE.Mesh(headGeo,aimMats[0]);
const bandGeo=new THREE.PlaneGeometry(1,0.28);bandGeo.rotateX(-Math.PI/2);bandGeo.translate(-0.5,0,0);
const band=new THREE.Mesh(bandGeo,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.45,depthWrite:false}));
const ghost=new THREE.Mesh(shaftGeo,new THREE.MeshBasicMaterial({color:0xf2cf6b,transparent:true,opacity:0.35,depthWrite:false}));ghost.scale.z=0.3;
aimGroup.add(shaft,head,band,ghost);[shaft,head,band,ghost].forEach(m=>m.renderOrder=4);
// contact preview: a ghost of your figure where it meets the ball, a ghosted ball and the exact contact point
const ghostFigMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.5,depthWrite:false});
const ghostRingMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.95,depthWrite:false});
const ghostFig=new THREE.Group();
{const d=new THREE.Mesh(GEO.dome,ghostFigMat);d.scale.y=0.55;const ring=new THREE.Mesh(new THREE.RingGeometry(RF*1.02,RF*1.22,40).rotateX(-Math.PI/2),ghostRingMat);ring.position.y=0.06;ghostFig.add(d,ring);}
ghostFig.visible=false;ghostFig.renderOrder=5;ghostFig.traverse(o=>o.renderOrder=5);scene.add(ghostFig);
// ghost marker on the ground under the ball: a soft disc and a ring
const ghostBall=new THREE.Group();
{const disc=new THREE.Mesh(new THREE.CircleGeometry(RB*1.5,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.22,depthWrite:false}));
 const ring=new THREE.Mesh(new THREE.RingGeometry(RB*1.5,RB*1.72,40).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.85,depthWrite:false}));
 ghostBall.add(disc,ring);ghostBall.traverse(o=>o.renderOrder=5);}
ghostBall.visible=false;scene.add(ghostBall);
function ghostTheBall(){}
const hitDot=new THREE.Mesh(new THREE.CircleGeometry(0.36,16).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xf2cf6b,transparent:true,depthWrite:false}));hitDot.visible=false;hitDot.renderOrder=6;scene.add(hitDot);
const dotGeo=new THREE.CircleGeometry(0.42,14);dotGeo.rotateX(-Math.PI/2);
const DOTS=[];for(let i=0;i<48;i++){const m=new THREE.Mesh(dotGeo,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}));m.position.y=0.07;m.renderOrder=4;m.visible=false;scene.add(m);DOTS.push({m,x:0,z:0,on:false});}
let aimShow=null;
function hideAim(){aimGroup.visible=false;ghostFig.visible=false;ghostBall.visible=false;hitDot.visible=false;ghostTheBall(false);DOTS.forEach(d=>{d.m.visible=false;d.on=false;});recvRing.visible=false;targetRing.visible=false;}
function drawAim(a){
  if(!a||a.fig<0){hideAim();return;}
  const b=bodies[a.fig],L=Math.hypot(a.dx,a.dz);if(!(L>1e-6)){hideAim();return;}
  const ux=a.dx/L,uz=a.dz/L,p=clamp(a.p,0,1.4),kind=S.phase==='defend'?'defend':'attack';
  const special=(S.armed&&S.armedTeam===b.team)?S.armed:'';
  const pr=predict(a.fig,ux,uz,Math.max(0.02,p),kind,special),m=aimMats[b.team];
  shaft.material=m;head.material=m;
  aimGroup.visible=true;aimGroup.position.set(b.x,0.08,b.z);aimGroup.rotation.y=Math.atan2(-uz,ux);
  const start=RF+0.25;
  if(pr.hit){
    // shaft runs to the ghost figure; no arrowhead
    const len=Math.max(0.05,pr.len-start-RF*0.95);
    shaft.position.x=start;shaft.scale.x=len;head.visible=false;
    const cx=b.x+ux*pr.len,cz=b.z+uz*pr.len;let nx=ball.x-cx,nz=ball.z-cz;const nl=Math.hypot(nx,nz)||1;nx/=nl;nz/=nl;
    ghostFigMat.color.copy(m.color).lerp(new THREE.Color(1,1,1),0.35);ghostFigMat.opacity=0.45+0.1*Math.sin(performance.now()/160);ghostRingMat.color.copy(m.color);
    ghostFig.visible=true;ghostFig.position.set(cx,0.02,cz);ghostFig.scale.setScalar(RF/1.6);ghostBall.scale.setScalar(RB/1.15);
    ghostBall.visible=true;ghostBall.position.set(ball.x,0.05,ball.z);
    hitDot.visible=true;hitDot.position.set(ball.x-nx*RB*1.6,0.07,ball.z-nz*RB*1.6);
  }else{
    const len=Math.max(0.3,pr.len-start-2.1);
    shaft.position.x=start;shaft.scale.x=len;head.position.x=start+len;head.visible=true;
    ghostFig.visible=false;ghostBall.visible=false;hitDot.visible=false;ghostTheBall(false);
  }
  band.position.x=-start;band.scale.x=Math.max(0.01,p*7);
  if(a.snap!==false&&!pr.hit){const full=travelDist(flickSpeed(a.fig,Math.min(1,p/SOFT),kind),FIG_DEC,FIG_DRAG);if(full>pr.len+0.5){ghost.visible=true;ghost.position.x=pr.len+0.2;ghost.scale.x=full-pr.len;}else ghost.visible=false;}else ghost.visible=false;
  const n=pr.hit&&SET.guides?Math.min(DOTS.length,PATH.length/2):0,fade=clamp(pr.cos*2.5,0.25,1);
  for(let i=0;i<DOTS.length;i++){
    const d=DOTS[i];
    if(i<n){const tx=PATH[i*2],tz=PATH[i*2+1];if(!d.on){d.x=tx;d.z=tz;d.on=true;}else{d.x=lerp(d.x,tx,0.45);d.z=lerp(d.z,tz,0.45);}
      d.m.visible=true;d.m.position.set(d.x,0.07,d.z);d.m.material.opacity=fade*(0.9-0.55*i/Math.max(1,n));d.m.material.color.setHex(special?0xf2cf6b:0xffffff);d.m.scale.setScalar(i===n-1?1.5:1);}
    else{d.m.visible=false;d.on=false;}
  }
  if(special==='thread'&&pr.hit&&n>0){
    const px=PATH[(n-1)*2],pz=PATH[(n-1)*2+1];let rid=-1,rd=40;for(let i=0;i<10;i++){const id=b.team*10+i;if(id===a.fig)continue;const r=bodies[id],dd=Math.hypot(r.x-px,r.z-pz);if(dd<rd){rd=dd;rid=id;}}
    targetRing.visible=true;targetRing.position.set(px,0.06,pz);
    if(rid>=0){recvRing.visible=true;recvRing.position.set(bodies[rid].x,0.05,bodies[rid].z);}else recvRing.visible=false;
  }else{recvRing.visible=false;targetRing.visible=false;}
}

