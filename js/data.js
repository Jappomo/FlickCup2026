// Flick Cup 2026 · js/data.js
// Boot, data files (data/*.json, edited with Distal) and the Distal editor hook.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= boot ================= */
renderKits();S.kits=kitSel.slice();applyKits();applySquadStats();formation(0);setMenuMode('');setTab('play');setCurl(1);updateHud();
updateCamera(0,true);
/* ================= data files (edited with Distal) ================= */
// data/scene.json: overrides by object path (names from the scene root joined with '/', '#n' for an unnamed child),
// rotations in degrees, light colour/intensity, material colour/roughness/metalness, camera presets (CAMS).
// data/balance.json: the default balancing (an admin save in this browser still wins). Missing files change nothing.
let SCENE_DATA={objects:{},materials:{},camera:{}};
const SCENE_BASE=new WeakMap(),MAT_BASE=new WeakMap();
function scenePathOf(o){const p=[];for(let n=o;n&&n.parent;n=n.parent)p.unshift(n.name||('#'+n.parent.children.indexOf(n)));return p.join('/');}
function sceneFind(path,root){let n=root||scene;for(const seg of String(path).split('/')){if(!n)return null;n=seg[0]==='#'?n.children[+seg.slice(1)]:n.children.find(c=>c.name===seg);}return n||null;}
function sceneBase(o){if(!SCENE_BASE.has(o))SCENE_BASE.set(o,{p:o.position.toArray(),r:[o.rotation.x,o.rotation.y,o.rotation.z],s:o.scale.toArray(),v:o.visible,c:o.isLight?'#'+o.color.getHexString():null,i:o.isLight?o.intensity:null,g:o.isHemisphereLight?'#'+o.groundColor.getHexString():null});return SCENE_BASE.get(o);}
const DEG=Math.PI/180,num3=a=>Array.isArray(a)&&a.length===3&&a.every(v=>isFinite(+v));
function applySceneObject(o,d){const b=sceneBase(o);d=d||{};
  o.position.fromArray(num3(d.p)?d.p.map(Number):b.p);
  const r=num3(d.r)?d.r.map(v=>v*DEG):b.r;o.rotation.set(r[0],r[1],r[2]);
  o.scale.fromArray(num3(d.s)?d.s.map(Number):b.s);
  if(d.v===false)o.visible=false;else if(o.userData.sceneHidden)o.visible=b.v;o.userData.sceneHidden=d.v===false;
  if(o.isLight){o.color.set(typeof d.color==='string'?d.color:b.c);o.intensity=isFinite(d.intensity)?+d.intensity:b.i;if(o.isHemisphereLight)o.groundColor.set(typeof d.ground==='string'?d.ground:b.g);}
  o.updateMatrixWorld(true);}
function applySceneMaterials(M){[scene,prevScene,kScene,tScene].filter(Boolean).forEach(root=>root.traverse(o=>{if(!o.isMesh||!o.material)return;(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{
  const d=M[m.name];if(!d&&!MAT_BASE.has(m))return;
  if(!MAT_BASE.has(m))MAT_BASE.set(m,{c:m.color?m.color.getHex():null,r:m.roughness,me:m.metalness,e:m.emissive?m.emissive.getHex():null,ei:m.emissiveIntensity});
  const b=MAT_BASE.get(m),x=d||{};
  if(m.color)typeof x.color==='string'?m.color.set(x.color).convertSRGBToLinear():m.color.setHex(b.c);
  if(m.roughness!=null)m.roughness=isFinite(x.roughness)?+x.roughness:b.r;
  if(m.metalness!=null)m.metalness=isFinite(x.metalness)?+x.metalness:b.me;
  if(m.emissive){typeof x.emissive==='string'?m.emissive.set(x.emissive).convertSRGBToLinear():m.emissive.setHex(b.e);m.emissiveIntensity=isFinite(x.emissiveIntensity)?+x.emissiveIntensity:b.ei;}});}));}
// prev: the data applied before, so objects that lost their override go back to how the game built them
function applySceneData(prev){const D=SCENE_DATA||{},O=D.objects||{};
  const keys=new Set([...Object.keys(O),...Object.keys((prev&&prev.objects)||{})]);
  keys.forEach(k=>{const o=sceneFind(k);if(o)applySceneObject(o,O[k]);});
  applySceneMaterials(Object.assign({},...Object.keys((prev&&prev.materials)||{}).map(k=>({[k]:null})),D.materials||{}));
  const C=D.camera||{};Object.keys(CAMS_DEF).forEach(k=>{if(typeof CAMS_DEF[k]==='object')CAMS[k]=Object.assign({},CAMS_DEF[k],C[k]&&typeof C[k]==='object'?C[k]:{});else CAMS[k]=isFinite(C[k])?+C[k]:CAMS_DEF[k];});
  CAMS.fov=clamp(CAMS.fov,15,100);resize();
  // menu preview scenes (ball, kits, tables): their own objects, lights and camera under scenes.<key>
  const SC=D.scenes||{},PS=(prev&&prev.scenes)||{},roots={ball:prevScene,kits:kScene,tables:tScene};
  Object.keys(PREVIEW_CAMS_DEF).forEach(k=>{const root=roots[k],O=(SC[k]&&SC[k].objects)||{},PO=(PS[k]&&PS[k].objects)||{};
    if(root)new Set([...Object.keys(O),...Object.keys(PO)]).forEach(p=>{const o=sceneFind(p,root);if(o)applySceneObject(o,O[p]);});
    const c=(SC[k]&&SC[k].camera)||{},d=PREVIEW_CAMS_DEF[k];
    PREVIEW_CAMS[k]={pos:num3(c.pos)?c.pos.map(Number):d.pos.slice(),look:num3(c.look)?c.look.map(Number):d.look.slice(),fov:isFinite(c.fov)?clamp(+c.fov,10,100):d.fov};});}
function loadDataFiles(){
  fetch('data/scene.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(o=>{if(o&&typeof o==='object'){const prev=SCENE_DATA;SCENE_DATA=o;applySceneData(prev);}}).catch(()=>{});
  fetch('data/balance.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(o=>{if(!o||typeof o!=='object')return;
    const d=cleanBal(o);Object.keys(d).forEach(k=>{BAL_DEF[k]=d[k];});
    if(!store.get('baize.balance')){BAL=cleanBal(null);if(!S.running)MBAL=BAL;balDraft=null;try{mySquads.forEach(fitSpecial);renderSquad();renderBal();syncHobby();renderLook();renderCustom();}catch(e){}}}).catch(()=>{});
}
// any other data file: onDataFile('teams',apply) loads data/teams.json at start and Distal can send live edits to the same function
const DATA_HOOKS={};
function onDataFile(name,apply){DATA_HOOKS[name]=apply;fetch('data/'+name+'.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(o=>{if(o&&typeof o==='object')apply(o);}).catch(()=>{});}
const BAL_CODE=JSON.parse(JSON.stringify(BAL_DEF)); // the values written in this file, before data/balance.json
loadDataFiles();
// Distal editor link: only when Distal opens the game (?distal=edit or play). Lets the editor reach the game's scene and settings.
if(/[?&]distal=/.test(location.search))window.__distalScope=function(code){return eval(code);};
