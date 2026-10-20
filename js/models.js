// Flick Cup 2026 · js/models.js
// GLB loading (ball, pin, table, field, trinket, banner), kit materials, GPU clean-up.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= models (GLB) ================= */
// Naming rules: CoP_ objects are gameplay colliders (only their bounding boxes are read), SM_ objects are what you see.
// Files are in metres; the game works in centimetres.
const MODEL_INFO={emblem:{src:'Built-in'},ball:{src:'Built-in'},pin:{src:'Built-in'},table:{src:'Built-in'},field:{src:'Built-in'},trinket:{src:'Built-in'},banner:{src:'Built-in'}};
const modelVis={ball:null,pin:[],keeper:[],look:null};let PIN_VIS=null;
// ----- GPU clean-up -----
// Clones share geometry, materials and textures with the loaded file, so a swap must not free what is still on show.
// gpuRetire(obj) queues anything taken out of a scene (old field, ball, pins, preview objects, thumbnails). Once per
// frame gpuSweep() frees what those used and no live scene (the match or a menu preview) still uses. Freed items keep
// their data in memory, so showing them again just uploads them again.
const GPUMEM={retired:[],freed:{geometries:0,materials:0,textures:0}};
function gpuRetire(o){if(o)GPUMEM.retired.push(o);}
function gpuCollect(root,set){if(!root)return set;
  root.traverse(o=>{if(o.geometry)set.add(o.geometry);const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
    ms.forEach(m=>{set.add(m);for(const k in m){const v=m[k];if(v&&v.isTexture)set.add(v);}
      if(m.uniforms)for(const k in m.uniforms){const v=m.uniforms[k]&&m.uniforms[k].value;if(v&&v.isTexture)set.add(v);}});});
  return set;}
function gpuSweep(){
  if(!GPUMEM.retired.length)return;
  const old=new Set();GPUMEM.retired.splice(0).forEach(o=>gpuCollect(o,old));
  const live=new Set();[scene,prevScene,kScene,tScene].forEach(r=>gpuCollect(r,live));
  old.forEach(r=>{if(live.has(r)||typeof r.dispose!=='function')return;r.dispose();
    if(r.isTexture)GPUMEM.freed.textures++;else if(r.isMaterial)GPUMEM.freed.materials++;else GPUMEM.freed.geometries++;});
  kitMatCache.forEach((m,k)=>{if(old.has(m)&&!live.has(m))kitMatCache.delete(k);});
}
function isolate(node){const c=node.clone(true);c.position.set(0,0,0);c.rotation.set(0,0,0);c.scale.set(1,1,1);c.updateMatrixWorld(true);return c;}
function copBox(root,name){const o=root.getObjectByName(name);if(!o)return null;const b=new THREE.Box3().setFromObject(o);if(b.isEmpty())return null;const r=v=>Math.round(v*1000)/1000;b.min.multiplyScalar(100);b.max.multiplyScalar(100);['x','y','z'].forEach(k=>{b.min[k]=r(b.min[k]);b.max[k]=r(b.max[k]);});return b;}
function stripColliders(root){const kill=[];root.traverse(o=>{if(o.name&&o.name.startsWith('CoP_'))kill.push(o);});kill.forEach(o=>o.parent&&o.parent.remove(o));return root;}
function prepVisual(root,{cast=true,recv=true}={}){root.scale.setScalar(100);root.traverse(o=>{if(o.isMesh){o.castShadow=cast;o.receiveShadow=recv;}});return root;}
function kitMaterials(root,t,gk,MM){
  const M=MM||teamM[t];
  // keeper gloves only on the standing keeper
  root.traverse(o=>{if(/_KeeperGloves?$/i.test(o.name||''))o.visible=!!gk;else if(/_Hands?$/i.test(o.name||''))o.visible=!gk;if(o.isMesh&&isKitMask(o.material))o.material=kitMaskMaterial(o.material,M,gk);});
  const map={Kit_Shirt:gk?M.gk:M.shirt,Kit_Shorts:gk?M.gk:M.shorts,Kit_Socks:gk?M.gk:M.socks,Kit_Insert:M.insert,Kit_Keeper:M.gk};
  root.traverse(o=>{if(o.isMesh&&o.material&&map[o.material.name])o.material=map[o.material.name];});return root;
}
const half=(b,ax)=>(b.max[ax]-b.min[ax])/2;
function applyBall(scene,label){
  const node=scene.getObjectByName('Ball')||scene,iso=isolate(node),cb=copBox(iso,'CoP_Ball');
  if(!cb)throw new Error('ball: no CoP_Ball found');
  RB=clamp(Math.max(half(cb,'x'),half(cb,'y'),half(cb,'z')),0.5,3);ball.r=RB;
  stripColliders(iso);
  // variants: SM_Ball_###_Name (the loader turns spaces into underscores). Anything else under Ball is shared by all variants.
  const vs=[],shared=[];
  iso.children.forEach(c=>{const m=/^SM_Ball_(\d+)(?:_(.+))?$/.exec(c.name||'');if(m)vs.push({id:m[1],name:(m[2]||'Ball '+m[1]).replace(/_/g,' ').trim(),node:c});else shared.push(c);});
  vs.sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));
  if(!vs.length)vs.push({id:'001',name:'Ball',node:null});
  BALL.variants=vs;BALL.shared=shared;BALL.iso=iso;BALL.gen++; // gen: a reloaded file always rebuilds the ball on show
  showBall();
  MODEL_INFO.ball={src:label,note:`${vs.length} ball${vs.length>1?'s':''} · radius ${RB.toFixed(2)} cm`};
  if(typeof renderCustom==='function')renderCustom(true);
}
// ----- ball variants -----
const BALL={variants:[],shared:[],iso:null,gen:0,mine:store.get('baize.ball')||''};
function ballVariant(id){return BALL.variants.find(v=>v.id===id)||BALL.variants[0]||null;}
function buildBallVisual(id){
  const v=ballVariant(id),root=new THREE.Group();
  if(!v)return null;
  if(v.node)root.add(v.node.clone(true));else if(BALL.iso)BALL.iso.children.forEach(c=>root.add(c.clone(true)));
  BALL.shared.forEach(c=>{if(v.node)root.add(c.clone(true));});
  return prepVisual(root);
}
// which ball is on the table: online it is the home player's pick, otherwise your own
function activeBallId(){return S.mode==='online'&&S.running&&S.ballV?S.ballV:BALL.mine;}
function showBall(){
  if(!BALL.variants.length)return;
  const id=(ballVariant(activeBallId())||{}).id;if(modelVis.ball&&modelVis.ball.userData.vid===id&&modelVis.ball.userData.gen===BALL.gen)return;
  const vis=buildBallVisual(id);if(!vis)return;vis.userData.vid=id;vis.userData.gen=BALL.gen;
  if(modelVis.ball){ballMesh.remove(modelVis.ball);gpuRetire(modelVis.ball);}
  ballMesh.material.visible=false;ballMesh.add(vis);modelVis.ball=vis;
}
// pin.glb naming (20 Oct 2026). A player is a Pin (base) plus a Figure standing on the pin's Loc_Figure spot.
//   SM_Figure_###_Name  the player figure (kit, _Hands, _KeeperGloves)  SM_Pin_###_Name     the base pin (collider CoP_Pin, Loc_Figure)
//   SM_Keeper_###_Name  the lying keeper figure                          SM_WidePin_###_Name the keeper's wide base (collider CoP_Keeper)
// Usually under a 'Pin' group and a 'Keeper' group, but found anywhere in the file. The lowest number of each is used for now.
// Older files (an unnumbered SM_Keeper, or no variants at all) still work.
const PIN_RE={figure:/^SM_Figure_(\d+)(?:_(.+))?$/i,pin:/^SM_Pin_(\d+)(?:_(.+))?$/i,keeper:/^SM_Keeper_(\d+)(?:_(.+))?$/i,widepin:/^SM_WidePin_(\d+)(?:_(.+))?$/i};
const PINS={figure:[],pin:[],keeper:[],widepin:[]};
const PIN_PICK={figure:'',pin:'',keeper:'',widepin:''};
function pinVariants(root,kind){const vs=[];root.traverse(o=>{const m=PIN_RE[kind].exec(o.name||'');if(m)vs.push({id:m[1],name:(m[2]||'').replace(/_/g,' ').trim()||kind+' '+m[1],node:o});});
  vs.sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));return vs;}
// keep one variant of each kind in the copy, drop the others
function keepVariant(iso,kinds){kinds.forEach(k=>{const vs=pinVariants(iso,k),keep=(vs.find(v=>v.id===PIN_PICK[k])||vs[0]||{}).node;vs.forEach(v=>{if(v.node!==keep&&v.node.parent)v.node.parent.remove(v.node);});});return iso;}
function applyPins(scene,label){
  ['figure','pin','keeper','widepin'].forEach(k=>PINS[k]=pinVariants(scene,k));
  const firstOf=k=>PINS[k][0]&&PINS[k][0].node;
  const P=scene.getObjectByName('Pin')||(firstOf('pin')||{}).parent||null;
  const K=scene.getObjectByName('Keeper')||((firstOf('keeper')||firstOf('widepin'))||{}).parent||null;
  let note=[];
  if(!P&&!K)throw new Error('pin: nothing found (expects SM_Figure_ / SM_Pin_ / SM_Keeper_ / SM_WidePin_)');
  if(P){
    const iso=keepVariant(isolate(P),['figure','pin']),cb=copBox(iso,'CoP_Pin');if(!cb)throw new Error('pin: no CoP_Pin found');
    // the figure lives in its own 'Figure' group. Modelled already standing on the pin: keep it where it is.
    // Modelled with its feet at the origin: stand it on the pin's Loc_Figure spot.
    if(!pinVariants(iso,'figure').length){const f=PINS.figure.find(v=>v.id===PIN_PICK.figure)||PINS.figure[0];
      if(f){const fc=isolate(f.node),fb=new THREE.Box3().setFromObject(fc);let loc=null;iso.traverse(o=>{if(!loc&&/^Loc_Figure/i.test(o.name||''))loc=o;});
        const atOrigin=!fb.isEmpty()&&Math.abs(fb.min.y)<0.002;fc.name=f.node.name;(atOrigin&&loc?loc:iso).add(fc);}}
    RF=clamp(Math.max(half(cb,'x'),half(cb,'z')),0.8,3.5);for(const b of bodies)if(!b.ball)b.r=RF;
    const vis=prepVisual(stripColliders(iso));PIN_VIS=vis;
    for(let i=0;i<22;i++){const g=i<20?figGroups[i]:kFig[i-20];if(modelVis.pin[i]){g.remove(modelVis.pin[i]);gpuRetire(modelVis.pin[i]);}else g.children.slice().forEach(c=>c.visible=false);const v=kitMaterials(vis.clone(true),i<10?0:i<20?1:i-20,i>=20);g.add(v);modelVis.pin[i]=v;}
    note.push(`${PINS.figure.length} figure${PINS.figure.length===1?'':'s'} · ${PINS.pin.length} pin${PINS.pin.length===1?'':'s'} · radius ${RF.toFixed(2)} cm`);
  }
  if(K&&K!==P){
    const iso=keepVariant(isolate(K),['keeper','widepin']),cb=copBox(iso,'CoP_Keeper');if(!cb)throw new Error('pin: no CoP_Keeper found');
    K_R=clamp(half(cb,'x'),0.5,3);K_HALF=clamp(half(cb,'z')-K_R,0.5,6);
    const vis=prepVisual(stripColliders(iso));
    for(let t=0;t<2;t++){const g=keeperGroups[t];if(modelVis.keeper[t]){g.remove(modelVis.keeper[t]);gpuRetire(modelVis.keeper[t]);}else g.children.slice().forEach(c=>c.visible=false);const v=kitMaterials(vis.clone(true),t,true);if(t===1)v.rotation.y=Math.PI;g.add(v);modelVis.keeper[t]=v;}
    note.push((PINS.keeper.length?`${PINS.keeper.length} keeper${PINS.keeper.length===1?'':'s'} · `:'')+(PINS.widepin.length?`${PINS.widepin.length} wide pin${PINS.widepin.length===1?'':'s'} · `:'')+`keeper ${(2*(K_HALF+K_R)).toFixed(1)} cm wide`);
  }
  MODEL_INFO.pin={src:label,note:note.join(' · ')};
  if(typeof renderKitLook==='function')renderKitLook();
}
// ----- table looks: SM_<Part>_###_Name variants are the direct children of the file's root (Table / Field / Trinket / Banner) -----
const LOOK_PARTS=['field','table','trinket','banner'];
const LOOK={field:[],table:[],trinket:[],banner:[]};let LOOK_GEN=0; // goes up whenever a table, field, trinket or banner file (re)loads
const LOOK_ROOT={field:'Field',table:'Table',trinket:'Trinket',banner:'Banner'};
const LOOK_DEF={field:'',table:'',trinket:'001',banner:'001'};
let LOOKSEL=(()=>{let o=null;try{o=JSON.parse(store.get('baize.look')||'null');}catch(e){}const d=Object.assign({},LOOK_DEF);if(o&&typeof o==='object')LOOK_PARTS.forEach(k=>{if(typeof o[k]==='string')d[k]=o[k].replace(/[^0-9]/g,'').slice(0,6);});return d;})();
function saveLook(){store.set('baize.look',JSON.stringify(LOOKSEL));}
function lookVariants(scene,part){
  const cap=part[0].toUpperCase()+part.slice(1),root=scene.getObjectByName(LOOK_ROOT[part])||scene,re=new RegExp('^SM_'+cap+'_(\\d+)(?:_(.+))?$','i'),vs=[];
  root.children.forEach(c=>{const m=re.exec(c.name||'');if(m)vs.push({id:m[1],name:(m[2]||cap+' '+m[1]).replace(/_/g,' ').trim(),node:c});});
  vs.sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));return vs;
}
const hasLoc=(node,kind)=>{let f=false;node.traverse(o=>{if(new RegExp('^Loc_'+kind,'i').test(o.name||''))f=true;});return f;};
function lookPick(part,id,optional){const L=LOOK[part];if(!L.length)return null;if(optional&&!id)return null;return L.find(v=>v.id===id)||(optional?null:L[0]);}
const lookStr=o=>LOOK_PARTS.map(k=>o[k]||'').join('|');
function parseLookStr(v){const p=String(v||'').split('|'),o={};LOOK_PARTS.forEach((k,i)=>o[k]=(p[i]||'').replace(/[^0-9]/g,'').slice(0,6));return o;}
function activeLook(){return S.mode==='online'&&S.running&&S.lookV?parseLookStr(S.lookV):LOOKSEL;}
function buildLookGroup(sel){
  const g=new THREE.Group(),f=lookPick('field',sel.field),t=lookPick('table',sel.table);
  if(f)g.add(f.node.clone(true));
  if(t){
    const tc=t.node.clone(true);g.add(tc);
    const tr=lookPick('trinket',sel.trinket,true),bn=lookPick('banner',sel.banner,true),spots=[];
    tc.traverse(o=>{const n=o.name||'';if(tr&&/^Loc_Trinket/i.test(n))spots.push([o,tr]);if(bn&&/^Loc_Banner/i.test(n))spots.push([o,bn]);});
    spots.forEach(([o,v])=>o.add(v.node.clone(true)));
  }
  prepVisual(g);g.traverse(o=>{if(o.isMesh&&/field|cloth|surround/i.test(o.name))o.castShadow=false;});
  return {g,hasField:!!f,hasTable:!!t};
}
function showLook(){
  const sel=activeLook(),key=lookStr(sel)+'#'+LOOK_PARTS.map(k=>LOOK[k].length).join(',')+'#'+LOOK_GEN;
  if(modelVis.look&&modelVis.look.userData.key===key)return;
  if(modelVis.look){scene.remove(modelVis.look);gpuRetire(modelVis.look);}
  const {g,hasField,hasTable}=buildLookGroup(sel);g.name='Look';g.userData.key=key;scene.add(g);modelVis.look=g;try{applySceneData();}catch(e){}
  CLOTH.visible=!hasField;FIELD.visible=!hasTable;
  // a field can ask for its own line colour (custom property 'lines' on the SM_Field node), e.g. dark lines on snow
  const f=lookPick('field',sel.field),lc=f&&f.node.userData&&f.node.userData.lines;LINES.material.color.set(typeof lc==='string'&&/^#?[0-9a-f]{6}$/i.test(lc)?(lc[0]==='#'?lc:'#'+lc):'#ffffff');
  const lo=f&&f.node.userData?Number(f.node.userData.lines_opacity):NaN;LINES.material.opacity=isFinite(lo)?clamp(lo,0,1):0.78;
}
function applyTable(scene,label){
  const iso=isolate(scene.getObjectByName('Table')||scene);
  const P=copBox(iso,'CoP_Pitch'),W=copBox(iso,'CoP_Walls'),GL=copBox(iso,'CoP_Goal_L')||copBox(iso,'CoP_Goal_R'),SL=copBox(iso,'CoP_ShootLine_R')||copBox(iso,'CoP_ShootLine_L');
  if(!P)throw new Error('table: no CoP_Pitch found');
  HX=clamp(half(P,'x'),30,120);HZ=clamp(half(P,'z'),20,80);
  if(W){WALLX=Math.max(HX+3,half(W,'x'));WALLZ=Math.max(HZ+3,half(W,'z'));}else{WALLX=HX+11;WALLZ=HZ+8;}
  if(GL){GOAL=clamp(half(GL,'z'),3,HZ-2);GDEPTH=clamp(GL.max.x-GL.min.x,2,15);}
  if(SL){SHOOT=clamp(Math.abs((SL.min.x+SL.max.x)/2),5,HX-5);}
  K_X=HX-2.3;keepers[0].x=-K_X;keepers[1].x=K_X;redrawLines();
  stripColliders(iso);LOOK.table=lookVariants(iso,'table');LOOK_GEN++;
  if(!LOOK.table.length)throw new Error('table: no SM_Table_###_Name found');
  MODEL_INFO.table={src:label,note:`${LOOK.table.length} table${LOOK.table.length>1?'s':''} · pitch ${(2*HX).toFixed(0)} x ${(2*HZ).toFixed(0)} cm`};
  showLook();if(typeof renderLook==='function')renderLook(true);
}
function applyLookPart(part){return (scene,label)=>{
  const vs=lookVariants(scene,part);if(!vs.length)throw new Error(part+': no SM_'+part[0].toUpperCase()+part.slice(1)+'_###_Name found');
  LOOK[part]=vs;LOOK_GEN++;MODEL_INFO[part]={src:label,note:vs.length+' '+part+(vs.length>1?'s':'')};
  showLook();if(typeof renderLook==='function')renderLook(true);
};}
const scene3=scene;
function resetModel(kind){
  const D=DEFAULT_SIZES;
  if(kind==='ball'){if(modelVis.ball){ballMesh.remove(modelVis.ball);gpuRetire(modelVis.ball);}modelVis.ball=null;ballMesh.material.visible=true;RB=D.RB;ball.r=RB;BALL.variants=[];}
  if(kind==='pin'){for(let i=0;i<22;i++){const g=i<20?figGroups[i]:kFig[i-20];if(modelVis.pin[i]){g.remove(modelVis.pin[i]);gpuRetire(modelVis.pin[i]);modelVis.pin[i]=null;}g.children.forEach(c=>c.visible=true);bodies[i].r=D.RF;}RF=D.RF;
    for(let t=0;t<2;t++){const g=keeperGroups[t];if(modelVis.keeper[t]){g.remove(modelVis.keeper[t]);gpuRetire(modelVis.keeper[t]);modelVis.keeper[t]=null;}g.children.forEach(c=>c.visible=true);}K_R=D.K_R;K_HALF=D.K_HALF;}
  if(kind==='table'){({HX,HZ,GOAL,GDEPTH,SHOOT,WALLX,WALLZ}=D);K_X=HX-2.3;keepers[0].x=-K_X;keepers[1].x=K_X;redrawLines();}
  if(LOOK[kind]){LOOK[kind]=[];LOOK_GEN++;showLook();if(typeof renderLook==='function')renderLook(true);}
  MODEL_INFO[kind]={src:'Built-in'};renderModels();
}
const APPLY={emblem:(s,l)=>applyEmblems(s,l),ball:applyBall,pin:applyPins,table:applyTable,field:applyLookPart('field'),trinket:applyLookPart('trinket'),banner:applyLookPart('banner')};
// three r128 names textures only from the texture entry; Blender names the image, so copy that over
function nameTextures(g){const P=g&&g.parser;if(!P||!P.associations)return;g.scene.traverse(o=>{const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];ms.forEach(m=>{['map'].forEach(k=>{const t=m[k];if(!t||t.name)return;const a=P.associations.get(t);if(a&&a.type==='textures'){const td=P.json.textures[a.index],im=td&&P.json.images&&P.json.images[td.source];if(im&&im.name)t.name=im.name;}});});});}
// Colour ID map: R shirt, G shorts, B socks. Painted areas take the kit colour over the colour texture;
// black areas keep the texture as it is. The map is models/<colour texture name with _Color -> _ID>.png
// (or the file named in the material's 'idmap' custom property).
const ID_MAPS={};
function idMapFor(mat){const nm=(mat.userData&&mat.userData.idmap)||(mat.map&&mat.map.name?mat.map.name.replace(/_Color$/i,'')+'_ID.png':'');if(!nm)return null;
  const file=/\.(png|jpe?g|webp)$/i.test(nm)?nm:nm+'.png';
  if(!(file in ID_MAPS)){const e={tex:null,users:[]};ID_MAPS[file]=e;new THREE.TextureLoader().load('models/'+file,t=>{t.flipY=false;e.tex=t;e.users.forEach(u=>{u.uIdMap.value=t;u.uHasId.value=1;});},undefined,()=>{e.failed=true;});}
  return ID_MAPS[file];}
const kitMatCache=new Map();
function kitMaskMaterial(src,M,gk){
  const key=src.uuid+'|'+M.shirt.uuid+'|'+(gk?1:0);if(kitMatCache.has(key))return kitMatCache.get(key);
  const m=src.clone(),u={uIdMap:{value:null},uHasId:{value:0},uShirt:{value:(gk?M.gk:M.shirt).color},uShorts:{value:(gk?M.gk:M.shorts).color},uSocks:{value:(gk?M.gk:M.socks).color}};
  const e=idMapFor(src);if(e){e.users.push(u);if(e.tex){u.uIdMap.value=e.tex;u.uHasId.value=1;}}
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,u);
    sh.fragmentShader='uniform sampler2D uIdMap;uniform float uHasId;uniform vec3 uShirt;uniform vec3 uShorts;uniform vec3 uSocks;\n'+sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
  #ifdef USE_MAP
  vec3 idm=uHasId>0.5?texture2D(uIdMap,vUv).rgb:vec3(smoothstep(0.45,0.7,min(min(diffuseColor.r,diffuseColor.g),diffuseColor.b)),0.,0.);
  diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*uShirt,idm.r);
  diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*uShorts,idm.g);
  diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*uSocks,idm.b);
  #endif`);};
  m.customProgramCacheKey=()=>'kitmask';kitMatCache.set(key,m);return m;}
const isKitMask=m=>!!(m&&m.map&&((m.userData&&(m.userData.idmap||m.userData.kitmask))||/_Player/i.test(m.name||'')));
function loadModel(kind,urlOrBuffer,label){
  return new Promise(res=>{
    if(!THREE.GLTFLoader){MODEL_INFO[kind]={src:'Built-in',err:'The model loader could not be downloaded.'};renderModels();return res(false);}
    const L=new THREE.GLTFLoader();
    const ok=g=>{try{nameTextures(g);APPLY[kind](g.scene,label);if(!S.running)formation(0);renderModels();res(true);}catch(e){MODEL_INFO[kind]=Object.assign(MODEL_INFO[kind]||{},{err:String(e.message||e)});renderModels();res(false);}};
    const fail=e=>{MODEL_INFO[kind]=Object.assign(MODEL_INFO[kind]||{src:'Built-in'},{err:typeof urlOrBuffer==='string'?null:'This file could not be read as a GLB.'});renderModels();res(false);};
    if(typeof urlOrBuffer==='string')L.load(urlOrBuffer,ok,undefined,fail);else L.parse(urlOrBuffer,'',ok,fail);
  });
}
function renderModels(){
  const box=document.getElementById('models-list');if(!box)return;
  box.innerHTML='';
  [['ball','Ball','ball.glb'],['pin','Pins and keepers','pin.glb'],['table','Tables','table.glb'],['field','Fields','field.glb'],['trinket','Trinkets','trinket.glb'],['banner','Banners','banner.glb'],['emblem','Club emblems','emblem.glb']].forEach(([k,label,file])=>{
    const I=MODEL_INFO[k],row=document.createElement('div');row.className='srow';
    const t=document.createElement('div');t.innerHTML=`<span class="sl">${label}</span>`;
    const p=document.createElement('p');p.textContent=(I.src==='Built-in'?'Built-in shapes':'From '+I.src)+(I.note?' · '+I.note:'')+(I.err?' · '+I.err:'');if(I.err)p.style.color='var(--warn)';
    const ctl=document.createElement('div');ctl.className='seg';
    const up=document.createElement('span');up.className='chip filebtn';up.textContent='Load '+file;const inp=document.createElement('input');inp.type='file';inp.accept='.glb,model/gltf-binary';inp.setAttribute('aria-label','Load your own '+file);up.appendChild(inp);
    inp.onchange=async()=>{const f=inp.files&&inp.files[0];if(!f)return;const ab=await f.arrayBuffer();await loadModel(k,ab,f.name+' (this tab only)');inp.value='';};
    const rs=document.createElement('button');rs.className='chip';rs.textContent='Built-in';rs.onclick=()=>resetModel(k);rs.disabled=I.src==='Built-in';
    ctl.append(up,rs);row.append(t,ctl,p);box.appendChild(row);
  });
}
// published models next to the page are used for everyone (stored as embedded glTF JSON, the same content as the .glb); missing files simply keep the built-in shapes
loadModel('ball','models/ball.glb','ball.glb');
loadModel('pin','models/pin.glb','pin.glb');
loadModel('table','models/table.glb','table.glb');
loadModel('field','models/field.glb','field.glb');
loadModel('trinket','models/trinket.glb','trinket.glb');
loadModel('banner','models/banner.glb','banner.glb');
loadModel('emblem','models/emblem.glb','emblem.glb');

