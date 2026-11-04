// Flick Cup 2026 · js/scenery.js
// What Distal's Scene tab adds to a scene, saved in data/scene.json next to the overrides:
//   add:     things added to the match (scenes.<key>.add for the menu previews): models (any SM_ node of a game GLB,
//            or a whole GLB), lights (point, spot, directional, hemisphere, ambient), empty groups and prefab copies.
//            [{id, kind:'model'|'light'|'group'|'prefab', name, parent:'' (path of the object it hangs under),
//              p, r (degrees), s, v:false (hidden), model:{file, node}, light:{type, color, ground, intensity, distance,
//              decay, angle, penumbra, shadow, target}, shadow:{cast, recv}, prefab:'Name'}]
//   env:     background colour, fog, exposure and tone mapping (scenes.<key>.env: background and fog only)
//   prefabs: {Name: {items: [the same entries; parent is a path inside the prefab]}}, placed with kind 'prefab'
//   presets: {Name: {scene, lights: {path: {color, intensity, ground, p}}, add: [lights], env}}: light presets.
//            Distal applies one by copying it into the scene; the game can switch at run time with useLightPreset(name).
// Wraps applySceneData (js/data.js), so whatever calls it (data files, Distal's live edits, rebuilt models) also
// rebuilds the added things. Loaded by index.html after vfx.js, as a classic script: every file shares one scope.
'use strict';
const SCENERY={built:{},gltf:{},preset:'',lastEff:null,envBase:new WeakMap(),toneBase:null};
const SC_TONE={aces:THREE.ACESFilmicToneMapping,linear:THREE.LinearToneMapping,reinhard:THREE.ReinhardToneMapping,cineon:THREE.CineonToneMapping,none:THREE.NoToneMapping};
function sceneryRoots(){return {match:scene,ball:typeof prevScene!=='undefined'?prevScene:null,kits:typeof kScene!=='undefined'?kScene:null,tables:typeof tScene!=='undefined'?tScene:null,album:typeof aScene!=='undefined'?aScene:null};}
const scNum=(v,d)=>isFinite(v)&&v!==null&&v!==''?+v:d;
// a GLB, loaded once per file (whole scene kept; nodes are cloned out of it)
function sceneryGltf(file){
  if(SCENERY.gltf[file])return SCENERY.gltf[file];
  return SCENERY.gltf[file]=new Promise(res=>{if(!THREE.GLTFLoader)return res(null);
    new THREE.GLTFLoader().load(file+(/\?/.test(file)?'':'?v='+(SCENERY.gen||0)),g=>{try{nameTextures(g);}catch(e){}res(g);},undefined,()=>res(null));});}
function sceneryReload(file){if(file)delete SCENERY.gltf[file];else SCENERY.gltf={};SCENERY.gen=(SCENERY.gen||0)+1;Object.values(SCENERY.built).forEach(b=>{b.sig='';});try{applySceneData();}catch(e){}}
function sceneryModel(holder,M){
  const file=String((M&&M.file)||'').replace(/^\/+/,'');if(!/\.(glb|gltf)$/i.test(file))return;
  sceneryGltf(file).then(g=>{if(!g||!holder.parent&&!holder.userData.keep)return;
    let src=M.node?g.scene.getObjectByName(M.node):g.scene;
    if(!src){holder.userData.missing=M.node;return;}
    const o=isolate(src);stripColliders(o);o.scale.multiplyScalar(100);
    const S=holder.userData.shadow||{};o.traverse(x=>{if(x.isMesh){x.castShadow=S.cast!==false;x.receiveShadow=S.recv!==false;}});
    o.name='';o.userData.sceneryMesh=1;holder.add(o);holder.updateMatrixWorld(true);});}
function sceneryLight(L){
  const t=L.type||'point',c=new THREE.Color(L.color||'#ffffff');let o;
  if(t==='spot')o=new THREE.SpotLight(c,scNum(L.intensity,1.2),scNum(L.distance,0),scNum(L.angle,30)*DEG,scNum(L.penumbra,0.35),scNum(L.decay,1));
  else if(t==='dir')o=new THREE.DirectionalLight(c,scNum(L.intensity,0.8));
  else if(t==='hemi')o=new THREE.HemisphereLight(c,new THREE.Color(L.ground||'#2a2a2a'),scNum(L.intensity,0.5));
  else if(t==='ambient')o=new THREE.AmbientLight(c,scNum(L.intensity,0.3));
  else o=new THREE.PointLight(c,scNum(L.intensity,1),scNum(L.distance,0),scNum(L.decay,1));
  if(o.target)o.target.userData.sceneryTarget=1;
  if(L.shadow&&o.shadow){o.castShadow=true;o.shadow.mapSize.set(1024,1024);o.shadow.bias=-0.0006;
    if(o.isDirectionalLight){const b=scNum(L.shadowSize,90);Object.assign(o.shadow.camera,{left:-b,right:b,top:b,bottom:-b,near:1,far:700});}
    else{o.shadow.camera.near=1;o.shadow.camera.far=700;}}
  return o;}
// parameters that can change without rebuilding the light (rebuilding recompiles every material)
function sceneryLightSet(o,L){if(!o||!o.isLight)return;o.color.set(L.color||'#ffffff');if(isFinite(L.intensity))o.intensity=+L.intensity;
  if(o.isHemisphereLight&&L.ground)o.groundColor.set(L.ground);
  if(o.isPointLight||o.isSpotLight){o.distance=scNum(L.distance,0);o.decay=scNum(L.decay,1);}
  if(o.isSpotLight){o.angle=scNum(L.angle,30)*DEG;o.penumbra=scNum(L.penumbra,0.35);}
  if(o.target){const t=num3(L.target)?L.target.map(Number):[0,0,0];o.target.position.set(t[0],t[1],t[2]);o.target.updateMatrixWorld(true);}}
function sceneryBuild(e,depth,prefabs){
  let o;
  if(e.kind==='light'){o=sceneryLight(e.light||{});}
  else{o=new THREE.Group();
    if(e.kind==='model'){o.userData.shadow=e.shadow||{};sceneryModel(o,e.model);}
    else if(e.kind==='prefab'&&depth<4){const P=prefabs[e.prefab];if(P)sceneryFill(o,P.items||[],depth+1,prefabs,e.id);}}
  o.userData.distalAdd=e.id;o.userData.kind=e.kind;return o;}
// prefab contents: the items hang under the prefab copy, by their own names
function sceneryFill(group,items,depth,prefabs,inst){
  const made={};
  sceneryOrder(items).forEach(e=>{const o=sceneryBuild(e,depth,prefabs);o.userData.distalAdd='';o.userData.distalIn=inst;o.name=e.name||'';
    const par=e.parent?(sceneFind(e.parent,group)||group):group;par.add(o);if(o.target)group.add(o.target);
    sceneryPose(o,e);if(o.isLight)sceneryLightSet(o,e.light||{});made[e.id]=o;});
  return made;}
// parents first: an entry hanging under another added one comes after it
function sceneryOrder(list){const names=new Set(),out=[],rest=list.filter(e=>e&&typeof e==='object').slice();let guard=0;
  while(rest.length&&guard++<20){for(let i=0;i<rest.length;i++){const e=rest[i],top=String(e.parent||'').split('/')[0];
    const waits=rest.some(x=>x!==e&&x.name===top);if(!waits){out.push(e);names.add(e.name);rest.splice(i--,1);}}}
  return out.concat(rest);}
function sceneryPose(o,e){
  o.position.fromArray(num3(e.p)?e.p.map(Number):[0,0,0]);
  const r=num3(e.r)?e.r.map(v=>v*DEG):[0,0,0];o.rotation.set(r[0],r[1],r[2]);
  o.scale.fromArray(num3(e.s)?e.s.map(Number):[1,1,1]);o.visible=e.v!==false;o.updateMatrixWorld(true);}
function sceneryApplyRoot(key,root,list,prefabs){
  const B=SCENERY.built[key]||(SCENERY.built[key]={});
  const keep=new Set();
  sceneryOrder(list).forEach(e=>{if(!e.id)return;keep.add(e.id);
    const sig=JSON.stringify([e.kind,e.model,e.kind==='prefab'?prefabs[e.prefab]||null:null,e.light&&e.light.type,e.light&&!!e.light.shadow,e.light&&e.light.shadowSize,e.shadow]);
    let b=B[e.id];
    if(b&&b.sig!==sig){sceneryDrop(b);b=null;}
    if(!b){const o=sceneryBuild(e,0,prefabs);b=B[e.id]={o,sig};}
    const o=b.o;o.name=e.name||('Added '+e.id);
    const par=e.parent?sceneFind(e.parent,root):root;
    const want=par&&!sceneryInside(par,o)?par:root;
    if(o.parent!==want){if(o.parent)o.parent.remove(o);want.add(o);}
    if(o.target&&o.target.parent!==root){if(o.target.parent)o.target.parent.remove(o.target);root.add(o.target);}
    sceneryPose(o,e);if(o.isLight)sceneryLightSet(o,e.light||{});});
  Object.keys(B).forEach(id=>{if(!keep.has(id)){sceneryDrop(B[id]);delete B[id];}});}
function sceneryInside(a,o){for(let n=a;n;n=n.parent)if(n===o)return true;return false;}
function sceneryDrop(b){const o=b.o;if(o.target&&o.target.parent)o.target.parent.remove(o.target);if(o.parent)o.parent.remove(o);try{gpuRetire(o);}catch(e){}}
// background, fog, exposure, tone mapping (exposure and tone: the match only, they belong to the main renderer)
function sceneryEnv(key,root,E){
  if(!SCENERY.envBase.has(root))SCENERY.envBase.set(root,{bg:root.background&&root.background.isColor?root.background.clone():root.background||null,fog:root.fog?{c:root.fog.color.clone(),n:root.fog.near,f:root.fog.far}:null});
  const b=SCENERY.envBase.get(root);E=E||{};
  if(typeof E.bg==='string'&&E.bg)root.background=new THREE.Color(E.bg);else root.background=b.bg&&b.bg.isColor?b.bg.clone():b.bg;
  const F=E.fog;
  if(F&&F.on===false)root.fog=null;
  else if(F&&(F.color||isFinite(F.near)||isFinite(F.far))){const c=F.color||E.bg||(b.fog?'#'+b.fog.c.getHexString():'#000000');root.fog=new THREE.Fog(new THREE.Color(c),scNum(F.near,b.fog?b.fog.n:200),scNum(F.far,b.fog?b.fog.f:600));}
  else root.fog=b.fog?new THREE.Fog(b.fog.c.clone(),b.fog.n,b.fog.f):null;
  if(key!=='match')return;
  if(!SCENERY.toneBase)SCENERY.toneBase={x:renderer.toneMappingExposure,t:renderer.toneMapping};
  renderer.toneMappingExposure=isFinite(E.exposure)&&E.exposure!==null?clamp(+E.exposure,0.1,4):SCENERY.toneBase.x;
  const t=SC_TONE[E.tone]!=null?SC_TONE[E.tone]:SCENERY.toneBase.t;
  if(renderer.toneMapping!==t){renderer.toneMapping=t;scene.traverse(o=>{if(o.material)[].concat(o.material).forEach(m=>{m.needsUpdate=true;});});}}
// the scene data with a light preset switched on at run time (useLightPreset): its light values, its added lights
// in place of the scene's own, its environment
function sceneryEffective(D){
  const P=SCENERY.preset&&D&&D.presets&&D.presets[SCENERY.preset];if(!P)return D;
  const E=JSON.parse(JSON.stringify(D)),key=P.scene||'match';
  const host=key==='match'?E:((E.scenes=E.scenes||{})[key]=E.scenes[key]||{});
  const O=key==='match'?(E.objects=E.objects||{}):(host.objects=host.objects||{});
  Object.entries(P.lights||{}).forEach(([p,v])=>{O[p]=Object.assign({},O[p],v);});
  host.add=(host.add||[]).filter(a=>!(a.kind==='light'&&!a.parent)).concat((P.add||[]).map(a=>Object.assign({},a,{id:'pre_'+a.id})));
  if(P.env)host.env=P.env;
  return E;}
function useLightPreset(name){SCENERY.preset=name&&SCENE_DATA&&SCENE_DATA.presets&&SCENE_DATA.presets[name]?name:'';try{applySceneData();}catch(e){}return SCENERY.preset;}
function lightPresets(){return Object.keys((SCENE_DATA&&SCENE_DATA.presets)||{});}
{const baseScenery=applySceneData;
  applySceneData=function(prev){
    const real=SCENE_DATA,eff=sceneryEffective(real);
    SCENE_DATA=eff;try{baseScenery(SCENERY.lastEff||prev);}finally{SCENE_DATA=real;}
    SCENERY.lastEff=eff;
    try{const R=sceneryRoots(),pf=(eff&&eff.prefabs)||{};
      Object.entries(R).forEach(([k,root])=>{if(!root)return;const host=k==='match'?eff||{}:((eff&&eff.scenes)||{})[k]||{};
        sceneryApplyRoot(k,root,Array.isArray(host.add)?host.add:[],pf);sceneryEnv(k,root,host.env);});
    }catch(e){console.warn('[scenery]',e);}};}
