// Flick Cup 2026 · js/customize.js
// The Ground (ball, table looks, music), the kit look (My Club), preview renderer; Hobby coins and unlocks.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= customization: ball ================= */
// menu preview cameras (Distal can change them through data/scene.json, scenes.<key>.camera)
const PREVIEW_CAMS={ball:{pos:[0,0.6,7.2],look:[0,0.25,0],fov:28},kits:{pos:[0,3.6,10.5],look:[0,1.9,0],fov:28},tables:{pos:[0,1.6,2.8],look:[0,-0.1,0],fov:30}};
const PREVIEW_CAMS_DEF=JSON.parse(JSON.stringify(PREVIEW_CAMS));
function previewCam(key,c){const P=PREVIEW_CAMS[key];if(c.fov!==P.fov){c.fov=P.fov;c.updateProjectionMatrix();}c.position.fromArray(P.pos);c.lookAt(P.look[0],P.look[1],P.look[2]);}
// One WebGL renderer for all the menu previews (ball, kits, tables): only one is on screen at a time. It draws off
// screen and the picture is copied onto that preview's own canvas, which is a plain 2D canvas.
let PREV_R=null;const PREV_SZ=new THREE.Vector2();
function previewRenderer(){if(PREV_R)return PREV_R;
  const r=new THREE.WebGLRenderer({canvas:document.createElement('canvas'),antialias:true,alpha:true,preserveDrawingBuffer:true});
  r.outputEncoding=THREE.sRGBEncoding;r.toneMapping=THREE.ACESFilmicToneMapping;r.setPixelRatio(Math.min(devicePixelRatio||1,2));
  return PREV_R=r;}
// copy the last picture onto a preview canvas
function previewBlit(r,cv){const s=r.domElement;if(cv.width!==s.width||cv.height!==s.height){cv.width=s.width;cv.height=s.height;}
  const x=cv.getContext('2d');if(!x)return;x.clearRect(0,0,cv.width,cv.height);x.drawImage(s,0,0);}
// draw a preview scene at its canvas's on-screen size
function previewDraw(r,cv,scn,cam,exposure){const w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;
  r.getSize(PREV_SZ);if(PREV_SZ.x!==w||PREV_SZ.y!==h)r.setSize(w,h,false);
  if(Math.abs(cam.aspect-w/h)>1e-4){cam.aspect=w/h;cam.updateProjectionMatrix();}
  r.toneMappingExposure=exposure;r.render(scn,cam);previewBlit(r,cv);}
let custSec='ball',custSel='',prevR=null,prevScene=null,prevCam=null,prevObj=null,prevSpin={a:0.6,v:0.5,drag:false,x:0},thumbs={};
function initPreview(){
  if(prevR)return true;
  try{
    const cv=$('#ball-prev');prevR=previewRenderer();
    prevScene=new THREE.Scene();const sky=new THREE.HemisphereLight(0xdfe8ff,0x1a2440,0.9);sky.name='Sky';prevScene.add(sky);
    const k=new THREE.DirectionalLight(0xffffff,1.7);k.name='Key';k.position.set(3,4,5);prevScene.add(k);
    const rim=new THREE.DirectionalLight(0x7aa2ff,0.9);rim.name='Rim';rim.position.set(-4,1,-3);prevScene.add(rim);
    prevCam=new THREE.PerspectiveCamera(28,1,0.1,100);
    cv.addEventListener('pointerdown',e=>{prevSpin.drag=true;prevSpin.x=e.clientX;try{cv.setPointerCapture(e.pointerId);}catch(_){}});
    cv.addEventListener('pointermove',e=>{if(!prevSpin.drag)return;const dx=e.clientX-prevSpin.x;prevSpin.x=e.clientX;prevSpin.a+=dx*0.012;prevSpin.v=dx*0.6;});
    const up=()=>{prevSpin.drag=false;};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
    return true;
  }catch(e){prevR=null;return false;}
}
function previewObject(id){
  if(prevObj){prevScene.remove(prevObj);gpuRetire(prevObj);}
  let o=BALL.variants.length?buildBallVisual(id):null;
  if(!o){o=new THREE.Mesh(ballMesh.geometry,ballMesh.material.clone());o.material.visible=true;}
  const g=new THREE.Group();g.name='Ball';g.add(o);g.scale.setScalar(1/RB);prevScene.add(g);prevObj=g;try{applySceneData();}catch(e){}return g;
}
function sizePreview(){const cv=$('#ball-prev'),w=cv.clientWidth||300,h=cv.clientHeight||300;prevR.setSize(w,h,false);prevCam.aspect=w/h;prevCam.updateProjectionMatrix();}
function makeThumbs(){
  if(!initPreview())return;
  if(prevGround)prevGround.visible=false;setTimeout(()=>{if(prevGround)prevGround.visible=true;},0);
  const cv=$('#ball-prev'),keep=[cv.width,cv.height];prevR.setSize(180,180,false);prevCam.aspect=1;prevCam.updateProjectionMatrix();prevCam.position.set(0,0.6,5.2);prevCam.lookAt(0,0,0);prevR.toneMappingExposure=1.1;
  (BALL.variants.length?BALL.variants:[{id:'',name:'Classic'}]).forEach(v=>{const o=previewObject(v.id);o.rotation.set(0.25,0.7,0);prevR.render(prevScene,prevCam);thumbs[v.id]=prevR.domElement.toDataURL('image/png');});
  sizePreview();
}
// ball preview frame (called by the central loop while the ball page is open)
function custTick(){
  const on=!$('#hub').hidden&&hubTab==='custom'&&custSec==='ball';
  if(!on||!prevR)return;
  if(!prevSpin.drag){prevSpin.v*=0.95;prevSpin.a+=0.008+prevSpin.v*0.002;}
  if(prevObj){prevObj.rotation.y=prevSpin.a;prevObj.rotation.x=0.22;}
  prevGround=groundUnder(prevScene,prevGround,120/RB,-0.97);GROUND_U.uTime.value=performance.now()/1000; // TEST-GRASS
  previewCam('ball',prevCam);
  previewDraw(prevR,$('#ball-prev'),prevScene,prevCam,1.1);
}
function renderCustom(rebuild){
  const grid=$('#ball-grid');if(!grid)return;
  if(rebuild)thumbs={};
  const list=BALL.variants.length?BALL.variants:[{id:'',name:'Classic'}];
  if(!custSel||!list.some(v=>v.id===custSel))custSel=(ballVariant(BALL.mine)||list[0]).id;
  if(hubTab!=='custom'&&!rebuild)return;
  if(!Object.keys(thumbs).length&&hubTab==='custom')makeThumbs();
  const eqId=(ballVariant(BALL.mine)||list[0]).id;
  grid.innerHTML='';
  list.forEach(v=>{
    const b=document.createElement('button');b.className='bcard';b.setAttribute('aria-pressed',String(v.id===custSel));
    const img=document.createElement('img');img.alt='';if(thumbs[v.id])img.src=thumbs[v.id];
    const nm=document.createElement('b');nm.textContent=v.name;
    b.append(img,nm);
    if(v.id===eqId){const e=document.createElement('span');e.className='eqp';e.textContent='Equipped';b.appendChild(e);}
    else if(!owns('ball',v.id)){b.classList.add('locked');const t=document.createElement('span');t.className='lock';t.innerHTML=lockTag('ball',v.id);b.appendChild(t);}
    b.onclick=()=>{custSel=v.id;renderCustom();};
    b.ondblclick=()=>{custSel=v.id;equipBall();};
    grid.appendChild(b);
  });
  const cur=list.find(v=>v.id===custSel)||list[0];
  $('#bp-no').textContent='Ball '+(cur.id||'001');$('#bp-name').textContent=cur.name;$('#bp-eq').hidden=cur.id!==eqId;
  const btn=$('#btn-equip'),own=owns('ball',cur.id);btn.disabled=cur.id===eqId;btn.lastChild.textContent=cur.id===eqId?'Equipped':own?'Equip':needCard('ball',cur.id)?'Needs an Album card':`Buy · ${priceOf('ball',cur.id)} Hobby`;
  $('#ball-note').textContent=S.mode==='online'&&S.running?'Online, the home player\'s ball is used for both of you.':'Every ball plays the same; only the look changes.';
  if(hubTab==='custom'&&custSec==='ball'&&initPreview()){sizePreview();previewObject(cur.id);}
}
function equipBall(){if(!owns('ball',custSel)&&!buy('ball',custSel)){renderCustom();return;}BALL.mine=custSel;store.set('baize.ball',custSel);showBall();renderCustom();sfx('tock',30);}
$('#btn-equip').addEventListener('click',equipBall);

/* ================= customization: table looks ================= */
let tR=null,tScene=null,tCam=null,tObj=null,tSpin={a:-0.5,v:0,drag:false,x:0},tThumbs={};
function setCustSec(sec){if(!['ball','table','music'].includes(sec))sec='ball';custSec=sec;document.querySelectorAll('.cnav[data-sec]').forEach(b=>b.setAttribute('aria-current',String(b.dataset.sec===sec)));
  $('#cust-ball').hidden=sec!=='ball';$('#cust-table').hidden=sec!=='table';$('#cust-music').hidden=sec!=='music';if(sec==='ball')renderCustom();else if(sec==='table')renderLook();else renderTracks();}
document.querySelectorAll('.cnav[data-sec]').forEach(b=>b.addEventListener('click',()=>setCustSec(b.dataset.sec)));
/* ---------- kit look editor ---------- */
let kitView='player',kitTeam=0,kR=null,kScene=null,kCam=null,kObj=null;const kSpin={a:0.5,v:0,drag:false,x:0};
const KIT_PM={shirt:std(0xffffff,0.45),shorts:std(0xffffff,0.5),socks:std(0xffffff,0.5),insert:std(0xffffff,0.3),base:std(0x161616,0.3),gk:std(0xffffff,0.45)};
function lookOf(q,t){return q.look||(()=>{const k=KITS[kitSel[t]]||KITS[t];const near=(hex,pal)=>{let b=0,bd=1e9;pal.forEach(([n,c],i)=>{const d=Math.abs((c>>16)-(hex>>16))+Math.abs(((c>>8)&255)-((hex>>8)&255))+Math.abs((c&255)-(hex&255));if(d<bd){bd=d;b=i;}});return b;};
  return{s:near(k.shirt,KIT_COLORS),p:near(k.shorts,KIT_COLORS),o:near(k.socks,KIT_COLORS),g:near(k.gk,GK_COLORS)};})();}
function initKitPreview(){if(kR)return true;try{const cv=$('#kit-prev');kR=previewRenderer();
  kScene=new THREE.Scene();const sky=new THREE.HemisphereLight(0xe8f0ff,0x1a2440,0.9);sky.name='Sky';kScene.add(sky);const k=new THREE.DirectionalLight(0xfff1dc,1.5);k.name='Key';k.position.set(-3,6,4);kScene.add(k);const r=new THREE.DirectionalLight(0x9a7cff,0.6);r.name='Rim';r.position.set(4,2,-4);kScene.add(r);
  kCam=new THREE.PerspectiveCamera(28,1,0.05,200);
  cv.addEventListener('pointerdown',e=>{kSpin.drag=true;kSpin.x=e.clientX;try{cv.setPointerCapture(e.pointerId);}catch(_){}});
  cv.addEventListener('pointermove',e=>{if(!kSpin.drag)return;const dx=e.clientX-kSpin.x;kSpin.x=e.clientX;kSpin.a+=dx*0.01;kSpin.v=dx*0.5;});
  const up=()=>{kSpin.drag=false;};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);return true;}catch(e){kR=null;return false;}}
function kitPreviewObj(){const g=new THREE.Group(),only=kitView==='keeper';
  if(PIN_VIS){g.add(kitMaterials(PIN_VIS.clone(true),0,only,KIT_PM));}
  else{for(const gk of [only]){const f=buildFigure(0,0);scene.remove(f);f.traverse(o=>{if(!o.isMesh)return;const M=teamM[0];o.material=o.material===M.shirt?(gk?KIT_PM.gk:KIT_PM.shirt):o.material===M.shorts?(gk?KIT_PM.gk:KIT_PM.shorts):o.material===M.socks?(gk?KIT_PM.gk:KIT_PM.socks):o.material===M.insert?KIT_PM.insert:o.material===M.base?KIT_PM.base:o.material;});g.add(f);}}
  return g;}
// kit preview frame (called by the central loop while the kit page is open)
function kitTick(){if($('#hub').hidden||hubTab!=='squad'||clubSec!=='kit'||!kR)return;
  if(!kSpin.drag){kSpin.v*=0.94;kSpin.a+=0.0022+kSpin.v*0.002;}if(kObj)kObj.rotation.y=kSpin.a;kGround=groundUnder(kScene,kGround,170,0);GROUND_U.uTime.value=performance.now()/1000; // TEST-GRASS
  
  previewCam('kits',kCam);previewDraw(kR,$('#kit-prev'),kScene,kCam,1);}
function renderKitLook(){
  if(hubTab!=='squad'||clubSec!=='kit')return;
  const q=mySquads[kitTeam],L=lookOf(q,kitTeam);
  document.querySelectorAll('#kit-team .chip').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.team===kitTeam)));
  $('#kit-use').checked=!!q.useLook;$('#kit-team-l').textContent=kitTeam?'Away squad':'Home squad';$('#kit-name').textContent=q.name||KITS[kitSel[kitTeam]].name;
  const row=(id,pal,key)=>{const el=$(id);el.innerHTML='';pal.forEach(([n,c],i)=>{const b=document.createElement('button');b.type='button';b.className='kc';b.title=n;b.setAttribute('aria-label',n);b.style.background=hexStr(c);b.setAttribute('aria-pressed',String(L[key]===i));
    b.onclick=()=>{q.look=Object.assign({},lookOf(q,kitTeam),{[key]:i});q.useLook=true;saveSquads();if(!S.running){applyKits();}renderKits();renderKitLook();sfx('tock',20);};el.appendChild(b);});};
  row('#kp-s',KIT_COLORS,'s');row('#kp-p',KIT_COLORS,'p');row('#kp-o',KIT_COLORS,'o');row('#kp-g',GK_COLORS,'g');
  const lc=(m,c)=>m.color.copy(new THREE.Color(c).convertSRGBToLinear());lc(KIT_PM.shirt,KIT_COLORS[L.s][1]);lc(KIT_PM.insert,KIT_COLORS[L.s][1]);lc(KIT_PM.shorts,KIT_COLORS[L.p][1]);lc(KIT_PM.socks,KIT_COLORS[L.o][1]);lc(KIT_PM.gk,GK_COLORS[L.g][1]);
  if(initKitPreview()){const cv=$('#kit-prev'),w=cv.clientWidth||400,h=cv.clientHeight||400;kR.setSize(w,h,false);kCam.aspect=w/h;kCam.updateProjectionMatrix();
    document.querySelectorAll('#cust-kit .kv').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kv===kitView)));
    if(!kObj||kObj.userData.pin!==PIN_VIS||kObj.userData.view!==kitView){if(kObj){kScene.remove(kObj);gpuRetire(kObj);}kObj=kitPreviewObj();kObj.name='Figure';kObj.userData.pin=PIN_VIS;kObj.userData.view=kitView;kScene.add(kObj);try{applySceneData();}catch(e){}}
  }
}
document.querySelectorAll('#cust-kit .kv').forEach(b=>b.addEventListener('click',()=>{kitView=b.dataset.kv;renderKitLook();}));
document.querySelectorAll('#kit-team .chip').forEach(b=>b.addEventListener('click',()=>{kitTeam=+b.dataset.team;renderKitLook();}));
$('#kit-use').addEventListener('change',e=>{const q=mySquads[kitTeam];if(!q.look)q.look=lookOf(q,kitTeam);q.useLook=e.target.checked;saveSquads();if(!S.running)applyKits();renderKits();renderKitLook();});
/* ---------- TEST: grass turf under the ball and kit previews (delete this block and the two lines tagged TEST-GRASS to remove) ---------- */
let GROUND_VIS=null,prevGround=null,kGround=null;
// preview grass shading: blades bend away from whatever stands in the middle, sway a little at the tip,
// and are lit the same on both sides (no dark back faces)
const GROUND_U={uTime:{value:0},uR:{value:0.0095}};
function groundMat(m,blades){m=m.clone();m.onBeforeCompile=sh=>{sh.uniforms.uTime=GROUND_U.uTime;sh.uniforms.uR=GROUND_U.uR;
  // the code is shaders/grass_blades.glsl and shaders/grass_light.glsl (js/shaders.js)
  if(blades)sh.vertexShader='uniform float uTime;uniform float uR;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n'+shaderSrc('grass_blades'));
  sh.fragmentShader=sh.fragmentShader.replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\n'+shaderSrc('grass_light'));};
  shaderUse(m,'grass_blades','grass_light');m.customProgramCacheKey=()=>'ground'+(blades?'b':'p')+shaderKey('grass_blades')+shaderKey('grass_light');return m;}
// props.glb: general props. The preview ground is SM_Ground_###_Name (e.g. SM_Ground_001_Pitch_Turf) under 'Ground';
// inside it, a mesh or material named ..._Turf is the flat plane, everything else is grass blades. The lowest number is used.
(function(){if(!THREE.GLTFLoader)return;new THREE.GLTFLoader().load('models/props.glb',g=>{const r=g.scene.getObjectByName('Ground')||g.scene;stripColliders(r);
  const vs=[];r.traverse(o=>{const m=/^SM_Ground_(\d+)(?:_(.+))?$/i.exec(o.name||'');if(m)vs.push({id:m[1],node:o});});
  vs.sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));const gid=vs.length?vs[0].id:'';vs.forEach(v=>{if(v.id!==gid&&v.node.parent)v.node.parent.remove(v.node);});
  r.traverse(o=>{if(o.isMesh){o.receiveShadow=true;const plane=/_Turf$/i.test(o.name||'')||/Turf/i.test((o.material&&o.material.name)||'');o.material=groundMat(o.material,!plane);}});GROUND_VIS=r;},undefined,()=>{});})();
function groundUnder(scn,cur,scale,y){if(!GROUND_VIS||cur)return cur;const o=GROUND_VIS.clone(true);o.name='Ground';o.position.set(0,y,0);o.scale.setScalar(scale);scn.add(o);try{applySceneData();}catch(e){}return o;}
/* ---------- end TEST ---------- */
function initTablePreview(){
  if(tR)return true;
  try{
    const cv=$('#table-prev');tR=previewRenderer();
    tScene=new THREE.Scene();const sky=new THREE.HemisphereLight(0xe8f0ff,0x1a2440,0.8);sky.name='Sky';tScene.add(sky);
    const k=new THREE.DirectionalLight(0xfff1dc,1.4);k.name='Key';k.position.set(-3,6,4);tScene.add(k);const r=new THREE.DirectionalLight(0x9a7cff,0.6);r.name='Rim';r.position.set(4,2,-4);tScene.add(r);
    tCam=new THREE.PerspectiveCamera(30,1,0.05,200);
    cv.addEventListener('pointerdown',e=>{tSpin.drag=true;tSpin.x=e.clientX;try{cv.setPointerCapture(e.pointerId);}catch(_){}});
    cv.addEventListener('pointermove',e=>{if(!tSpin.drag)return;const dx=e.clientX-tSpin.x;tSpin.x=e.clientX;tSpin.a+=dx*0.01;tSpin.v=dx*0.5;});
    const up=()=>{tSpin.drag=false;};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
    return true;
  }catch(e){tR=null;return false;}
}
// any object, centred and scaled to roughly unit size
function fitGroup(o){const g=new THREE.Group();g.add(o);const b=new THREE.Box3().setFromObject(o),c=b.getCenter(new THREE.Vector3()),sz=b.getSize(new THREE.Vector3()),m=Math.max(sz.x,sz.y,sz.z)||1;o.position.sub(c);g.scale.setScalar(2/m);return g;}
function snapThumb(o,dir,w,h){
  tR.setSize(w,h,false);tCam.aspect=w/h;tCam.updateProjectionMatrix();tR.toneMappingExposure=1.05;
  const g=fitGroup(o);tScene.add(g);tCam.position.set(dir[0],dir[1],dir[2]).multiplyScalar(dir[3]||3.6);tCam.lookAt(0,0,0);tR.render(tScene,tCam);const url=tR.domElement.toDataURL('image/png');tScene.remove(g);gpuRetire(g);return url;
}
function partObject(part,v){
  if(part==='table'){const sel=Object.assign({},LOOKSEL,{table:v.id,trinket:'',banner:''});return buildLookGroup(sel).g;}
  if(part==='field'){const g=new THREE.Group();g.add(v.node.clone(true));return prepVisual(g);}
  const g=new THREE.Group();g.add(v.node.clone(true));return prepVisual(g);
}
const THUMB_DIR={field:[0,1,0.08,2.4],table:[0.55,0.75,0.9,2.9],trinket:[0.6,0.45,1,3.3],banner:[0,0.12,1,2.4]};
function makeLookThumbs(){
  if(!initTablePreview())return;
  LOOK_PARTS.forEach(p=>LOOK[p].forEach(v=>{const k=p+v.id;if(!tThumbs[k])tThumbs[k]=snapThumb(partObject(p,v),THUMB_DIR[p],192,128);}));
}
/* ================= Hobby: coins, rewards and unlocks ================= */
const HOBBY={get n(){const v=parseInt(store.get('baize.hobby'),10);return isFinite(v)?v:null;},set n(v){store.set('baize.hobby',String(Math.max(0,Math.round(v))));}};
if(HOBBY.n==null)HOBBY.n=BAL.eco.start;
let OWNED=(()=>{try{const o=JSON.parse(store.get('baize.owned')||'null');if(o&&typeof o==='object')return o;}catch(e){}return null;})();
// first run with the economy: keep whatever is already in use
if(!OWNED){OWNED={field:[],table:[],trinket:[],banner:[],ball:[]};LOOK_PARTS.forEach(p=>{if(LOOKSEL[p])OWNED[p].push(LOOKSEL[p]);});if(BALL.mine)OWNED.ball.push(BALL.mine);store.set('baize.owned',JSON.stringify(OWNED));}
const ecoOn=()=>!!(BAL.eco&&BAL.eco.on);
function firstId(part){const L=part==='ball'?BALL.variants:LOOK[part];return L&&L.length?L[0].id:'';}
function owns(part,id){if(!ecoOn()||!id||id===firstId(part)||priceOf(part,id)===0)return true;return (OWNED[part]||[]).includes(id);}
// an item can set its own price with a 'price' custom property (0 = free); otherwise the Balancing price
function variantNode(part,id){const L=part==='ball'?BALL.variants:LOOK[part];const v=L&&L.find(x=>x.id===id);return v&&v.node;}
function priceOf(part,id){const n=id!=null&&variantNode(part,id),p=n&&n.userData?Number(n.userData.price):NaN;return isFinite(p)&&p>=0?Math.round(p):(BAL.eco[part]||0);}
function syncHobby(){const h=$('#hobby');h.hidden=!ecoOn();$('#hobby-n').textContent=(HOBBY.n||0).toLocaleString();}
function hobbyToast(t,good){const el=$('#htoast');el.textContent=t;el.className='htoast'+(good?' good':'');el.hidden=false;clearTimeout(el._t);el._t=setTimeout(()=>{el.hidden=true;},2600);}
function earn(n,why){if(!ecoOn()||!(n>0))return 0;HOBBY.n=(HOBBY.n||0)+n;syncHobby();const h=$('#hobby');h.classList.remove('pop');void h.offsetWidth;h.classList.add('pop');if(why)hobbyToast(`+${n} Hobby · ${why}`,true);return n;}
function buy(part,id){if(owns(part,id))return true;const p=priceOf(part,id);
  if((HOBBY.n||0)<p){hobbyToast(`Not enough Hobby: this costs ${p}, you have ${HOBBY.n||0}.`);sfx('clack',10);return false;}
  HOBBY.n=(HOBBY.n||0)-p;OWNED[part]=[...(OWNED[part]||[]),id];store.set('baize.owned',JSON.stringify(OWNED));syncHobby();hobbyToast(`Unlocked for ${p} Hobby`,true);sfx('tock',30);return true;}
// a locked item: its price, or the Album card it needs (js/album.js)
const needCard=(part,id)=>typeof cardLock==='function'?cardLock(part,id):null;
function lockTag(part,id){const c=needCard(part,id);return c?`<span class="price cardtag" title="${String(c.title).replace(/"/g,'&quot;')}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="2.5" width="14" height="19" rx="2.2" fill="#f6c443" stroke="#6b4a08" stroke-width="1.5"/><path d="M9 8h6M9 12h6M9 16h3" stroke="#6b4a08" stroke-width="1.6" stroke-linecap="round"/></svg>Card</span>`:coinTag(priceOf(part,id));}
const coinTag=n=>`<span class="price">${'<svg class="hb-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#f6c443" stroke="#9a6d12" stroke-width="1.6"/><circle cx="12" cy="12" r="6.6" fill="none" stroke="#9a6d12" stroke-width="1.2" opacity=".6"/><path d="M9.2 7.5v9M14.8 7.5v9M9.2 12h5.6" stroke="#6b4a08" stroke-width="2" stroke-linecap="round"/></svg>'}${n}</span>`;
let lookPend=null;
function lookCard(part,v,on,disabled){
  const b=document.createElement('button');b.className='lcard';b.setAttribute('aria-pressed',String(on));if(disabled)b.disabled=true;
  if(v){const img=document.createElement('img');img.alt='';if(tThumbs[part+v.id])img.src=tThumbs[part+v.id];b.appendChild(img);}
  else{const n=document.createElement('span');n.className='none';n.textContent='None';b.appendChild(n);}
  const nm=document.createElement('b');nm.textContent=v?v.name:'None';b.appendChild(nm);
  const locked=v&&!owns(part,v.id),pend=locked&&lookPend&&lookPend.part===part&&lookPend.id===v.id;
  if(locked){b.classList.add('locked');const t=document.createElement('span');t.className='lock';t.innerHTML=pend&&!needCard(part,v.id)?'Buy · '+lockTag(part,v.id):lockTag(part,v.id);if(pend)t.classList.add('buy');b.appendChild(t);}
  b.onclick=()=>{if(locked&&needCard(part,v.id)){buy(part,v.id);return;}if(locked){if(!pend){lookPend={part,id:v.id};renderLook();sfx('tock',10);return;}lookPend=null;if(!buy(part,v.id)){renderLook();return;}}
    lookPend=null;LOOKSEL[part]=v?v.id:'';saveLook();showLook();renderLook();sfx('tock',30);};
  return b;
}
function renderLook(rebuild){
  if(rebuild){tThumbs={};if(tObj&&tScene){tScene.remove(tObj);gpuRetire(tObj);tObj=null;}}
  if(hubTab!=='custom'||custSec!=='table')return;
  makeLookThumbs();
  const t=lookPick('table',LOOKSEL.table),banners=!!(t&&hasLoc(t.node,'Banner'));
  LOOK_PARTS.forEach(p=>{
    const row=$('#look-'+p);row.innerHTML='';const optional=p==='trinket'||p==='banner',cur=lookPick(p,LOOKSEL[p],optional);
    if(!LOOK[p].length){row.innerHTML='<p class="note">No '+p+' models loaded.</p>';return;}
    if(optional)row.appendChild(lookCard(p,null,!cur,p==='banner'&&!banners));
    LOOK[p].forEach(v=>row.appendChild(lookCard(p,v,!!cur&&cur.id===v.id,p==='banner'&&!banners)));
  });
  $('#banner-note').hidden=banners;
  $('#tp-name').textContent=t?t.name:'Classic';
  if(initTablePreview()){
    const cv=$('#table-prev'),w=cv.clientWidth||400,h=cv.clientHeight||400;tR.setSize(w,h,false);tCam.aspect=w/h;tCam.updateProjectionMatrix();
    if(tObj){tScene.remove(tObj);gpuRetire(tObj);}tObj=fitGroup(buildLookGroup(LOOKSEL).g);tObj.name='Table';tScene.add(tObj);try{applySceneData();}catch(e){}
  }
}
// table preview frame (called by the central loop while the table page is open)
function tableTick(){
  if($('#hub').hidden||hubTab!=='custom'||custSec!=='table'||!tR)return;
  if(!tSpin.drag){tSpin.v*=0.94;tSpin.a+=0.003+tSpin.v*0.002;}
  if(tObj)tObj.rotation.y=tSpin.a;
  previewCam('tables',tCam);previewDraw(tR,$('#table-prev'),tScene,tCam,1.05);
}
window.addEventListener('resize',()=>{if(tR&&hubTab==='custom'&&custSec==='table')renderLook();});
window.addEventListener('resize',()=>{if(prevR&&hubTab==='custom')sizePreview();});

