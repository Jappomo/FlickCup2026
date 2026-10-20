// Flick Cup 2026 · js/camera.js
// Match camera presets and movement.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= camera ================= */
// camera presets: data/scene.json (camera) can override these, see applySceneData
const CAMS={fov:42,vertical:{el:0.98},broadcast:{el:0.9},eagle:{el:1.42},follow:{dist:34,height:0.62,back:0.72,ahead:12}};
const CAMS_DEF=JSON.parse(JSON.stringify(CAMS));
const cam={mode:(()=>{const v=+store.get('baize.cam');return v===0||v===1||v===3?v:-1;})(),zoom:1,yaw:0,pitch:0,pos:new THREE.Vector3(-150,120,0),look:new THREE.Vector3(),tPos:new THREE.Vector3(),tLook:new THREE.Vector3()};
function viewTeam(){if(S.mode==='practice'||S.mode==='tutorial')return 0;if(S.mode==='online')return net.myTeam==null?0:net.myTeam;if(S.mode==='cpu')return 1-cpuTeam;return S.running?S.poss:0;}
function camMode(){if(cam.mode>=0)return cam.mode;return innerWidth>innerHeight*1.15?1:0;}
function computeCam(){
  const aspect=innerWidth/innerHeight,tanV=Math.tan(camera.fov*Math.PI/360),tanH=tanV*aspect,mode=camMode();
  const vt=viewTeam(),d=dirOf(vt);
  if(mode===0){
    const el=CAMS.vertical.el,D=Math.max((HZ+5)/tanH,(HX+6)*Math.sin(el)/tanV*0.95)*cam.zoom;
    cam.tLook.set(d*4+ball.x*0.3,0,ball.z*0.18);
    cam.tPos.set(cam.tLook.x-d*D*Math.cos(el),D*Math.sin(el),cam.tLook.z);
  }else if(mode===1){
    const el=CAMS.broadcast.el,s=(S.mode==='local')?1:d,D=Math.max((HX+5)/tanH,(HZ+6)*Math.sin(el)/tanV*1.12)*cam.zoom;
    cam.tLook.set(ball.x*0.15,0,ball.z*0.3-2*s);
    cam.tPos.set(cam.tLook.x,D*Math.sin(el),cam.tLook.z+s*D*Math.cos(el));
  }else if(mode===3){
    const wide=aspect>1.05,el=CAMS.eagle.el,s=(S.mode==='local')?1:d;
    const D=(wide?Math.max((HX+8)/tanH,(HZ+8)/tanV):Math.max((HZ+8)/tanH,(HX+8)/tanV))*cam.zoom;
    cam.tLook.set(0,0,0);
    if(wide)cam.tPos.set(0,D*Math.sin(el),s*D*Math.cos(el));else cam.tPos.set(-d*D*Math.cos(el),D*Math.sin(el),0);
  }else{
    const id=sel>=0?sel:(S.poss*10+8),b=bodies[id];let ux=ball.x-b.x,uz=ball.z-b.z;
    if(aimShow&&aimShow.fig===id){ux=aimShow.dx;uz=aimShow.dz;}
    const L=Math.hypot(ux,uz);if(L<1){ux=dirOf(b.team);uz=0;}else{ux/=L;uz/=L;}
    const F=CAMS.follow,D=F.dist*cam.zoom;cam.tLook.set(b.x+ux*F.ahead,0,b.z+uz*F.ahead);cam.tPos.set(b.x-ux*D*F.back,D*F.height,b.z-uz*D*F.back);
  }
  // middle-mouse orbit: rotate the view around the look point
  if(cam.yaw||cam.pitch){
    const ox=cam.tPos.x-cam.tLook.x,oy=cam.tPos.y-cam.tLook.y,oz=cam.tPos.z-cam.tLook.z,r=Math.hypot(ox,oy,oz);
    const az=Math.atan2(oz,ox)+cam.yaw,el=clamp(Math.asin(oy/r)+cam.pitch,0.22,1.48);
    cam.tPos.set(cam.tLook.x+r*Math.cos(el)*Math.cos(az),cam.tLook.y+r*Math.sin(el),cam.tLook.z+r*Math.cos(el)*Math.sin(az));
  }
  // hold F: same angle, centred on the ball and a little closer; let go and the normal framing comes back
  if(keys.KeyF&&$('#hub').hidden){
    const ox=cam.tPos.x-cam.tLook.x,oy=cam.tPos.y-cam.tLook.y,oz=cam.tPos.z-cam.tLook.z,f=0.72;
    cam.tLook.set(ball.x,0,ball.z);cam.tPos.set(ball.x+ox*f,oy*f,ball.z+oz*f);
  }
}
function updateCamera(dt,snap){
  computeCam();
  // hold the camera still while aiming so the drag maps cleanly onto the table
  const k=snap?1:(ptr.on&&ptr.mode==='pull')?0:orb.on?1-Math.exp(-dt*14):1-Math.exp(-dt*(SET.calm?1.6:3.2));
  cam.pos.lerp(cam.tPos,k);cam.look.lerp(cam.tLook,k);camera.position.copy(cam.pos);camera.lookAt(cam.look);camera.updateMatrixWorld();
}
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.fov=CAMS.fov;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);resize();
const camNames={0:'Vertical',1:'Broadcast',3:'Eagle Eye'};
function resetCam(){cam.yaw=0;cam.pitch=0;cam.zoom=1;flashSub('Camera reset · '+camNames[camMode()]);}
function setCamStyle(m){cam.mode=m;store.set('baize.cam',String(m));closeCamMenu();resetCam();}
function renderCamMenu(){const cur=camMode();document.querySelectorAll('#cam-menu [data-cam]').forEach(b=>{const on=+b.dataset.cam===cur;b.setAttribute('aria-checked',String(on));b.querySelector('i').textContent=on?'✓':'';});}
function openCamMenu(){renderCamMenu();$('#cam-menu').hidden=false;$('#btn-cam-menu').setAttribute('aria-expanded','true');}
function closeCamMenu(){$('#cam-menu').hidden=true;$('#btn-cam-menu').setAttribute('aria-expanded','false');}
const cycleCam=resetCam;
const orb={on:false,id:null,x:0,y:0};
canvas.addEventListener('mousedown',e=>{if(e.button===1)e.preventDefault();});
canvas.addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault();});
canvas.addEventListener('wheel',e=>{e.preventDefault();cam.zoom=clamp(cam.zoom*(e.deltaY>0?1.08:0.93),0.5,1.7);},{passive:false});
let subT=0,subLock=false;function flashSub(t){const el=$('#psub');$('#prompt').hidden=false;el.textContent=t;subLock=true;clearTimeout(subT);subT=setTimeout(()=>{subLock=false;updateHud();},1500);}

