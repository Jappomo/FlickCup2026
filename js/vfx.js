// Flick Cup 2026 · js/vfx.js
// Visual effects from models/vfx.glb: one group per effect, SM_Vfx_###_Name, made of flat parts (lines, sparks) that the
// game moves outwards, shrinks and fades. Its custom properties (Blender) set the look: duration (s), spread (how far
// the parts travel, x their distance), size (x), color, event (what plays it). Today: pinHit, two figures bumping.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
const VFX={list:[],byId:{},byEvent:{},live:[]};
const VFX_DEFAULT={duration:0.32,spread:1.4,size:1,color:'#ffffff'};
function applyVfx(sc,label){
  const vs=[];sc.traverse(o=>{const m=/^SM_Vfx_(\d+)(?:_(.+))?$/i.exec(o.name||'');if(m)vs.push({id:m[1],name:(m[2]||'Effect '+m[1]).replace(/_/g,' ').trim(),node:o});});
  if(!vs.length)throw new Error('vfx: no SM_Vfx_###_Name found');
  vs.sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));
  VFX.list=vs.map(v=>{const d=v.node.userData||{},num=(x,def,lo,hi)=>{x=Number(x);return isFinite(x)?Math.max(lo,Math.min(hi,x)):def;};
    const e={id:v.id,name:v.name,event:typeof d.event==='string'?d.event:'',duration:num(d.duration,VFX_DEFAULT.duration,0.05,5),spread:num(d.spread,VFX_DEFAULT.spread,0,10),size:num(d.size,VFX_DEFAULT.size,0.05,20),
      color:typeof d.color==='string'&&/^#[0-9a-f]{6}$/i.test(d.color)?d.color:VFX_DEFAULT.color,node:isolate(v.node)};
    // every part glows and fades on its own material
    e.node.traverse(o=>{if(o.isMesh){const src=Array.isArray(o.material)?o.material[0]:o.material;const c=new THREE.Color(e.color);
      if(src&&src.emissive&&src.emissive.getHex())c.multiply(src.emissive);else if(src&&src.color&&src.color.getHex())c.multiply(src.color);
      o.material=new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:1,blending:THREE.NormalBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});o.castShadow=o.receiveShadow=false;o.renderOrder=5;}});
    return e;});
  VFX.byId={};VFX.byEvent={};VFX.list.forEach(e=>{VFX.byId[e.id]=e;if(e.event&&!VFX.byEvent[e.event])VFX.byEvent[e.event]=e;});
  if(!VFX.byEvent.pinHit&&VFX.list[0])VFX.byEvent.pinHit=VFX.list[0];
  MODEL_INFO.vfx={src:label,note:`${vs.length} effect${vs.length===1?'':'s'}: `+VFX.list.map(e=>e.name+(e.event?' ('+e.event+')':'')).join(', ')};}
APPLY.vfx=applyVfx;MODEL_INFO.vfx={src:'Built-in'};
loadModel('vfx','models/vfx.glb','vfx.glb');
// play an effect at a point of the table (cm); scale grows with how hard the hit was
function vfxPlay(e,x,y,z,scale){
  if(!e||RM_VFX())return;while(VFX.live.length>=14){const old=VFX.live.shift();scene.remove(old.o);old.o.traverse(m=>{if(m.isMesh)m.material.dispose();});}
  const o=e.node.clone(true);o.traverse(m=>{if(m.isMesh)m.material=m.material.clone();});
  const g=new THREE.Group();g.add(o);prepVisual(g,{cast:false,recv:false});g.scale.multiplyScalar(e.size*(scale||1));g.position.set(x,y,z);g.rotation.y=Math.random()*Math.PI*2;g.name='Vfx';
  const parts=[];o.children.forEach(c=>parts.push({c,p:c.position.clone(),s:c.scale.clone()}));
  scene.add(g);VFX.live.push({o:g,e,t0:performance.now(),parts});}
const RM_VFX=()=>typeof RM!=='undefined'&&RM.matches;
function vfxTick(now){
  for(let i=VFX.live.length-1;i>=0;i--){const L=VFX.live[i],t=(now-L.t0)/1000/L.e.duration;
    if(t>=1){scene.remove(L.o);L.o.traverse(m=>{if(m.isMesh)m.material.dispose();});VFX.live.splice(i,1);continue;}
    const out=1-Math.pow(1-t,3),fade=(1-t)*(1-t);
    L.parts.forEach(({c,p,s})=>{c.position.set(p.x*(1+L.e.spread*out),p.y,p.z*(1+L.e.spread*out));c.scale.set(s.x*(1-0.65*t),s.y,s.z);
      c.traverse(m=>{if(m.isMesh)m.material.opacity=fade;});});}}
{const baseFrame=frame;frame=function(now){try{vfxTick(now||performance.now());}catch(e){}return baseFrame(now);};}
// two figures bump (physics.js circlePair): a click where they touch
function vfxHit(a,b,nx,nz,v){const e=VFX.byEvent.pinHit;if(!e||(S.paused))return;
  vfxPlay(e,a.x+nx*a.r,0,a.z+nz*a.r,0.75+Math.min(v,50)/50*0.6);}
// what Distal shows (link.js)
function vfxMeta(){return VFX.list.map(e=>({id:e.id,name:e.name,event:e.event,duration:e.duration,spread:e.spread,size:e.size,color:e.color}));}
