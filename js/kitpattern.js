// Flick Cup 2026 · js/kitpattern.js
// Kit patterns (My Club > Kit look): stripes, hoops, halves, ... as masks painted in the figure's UV layout, in
// models/kitpattern.glb (SM_KitPattern_###_Name, one flat plane each). The mask's red channel is the shirt, green the
// shorts and blue the socks: those areas take the kit's second colours. Every figure shares the same UV layout.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
const KITPAT={list:[],byId:{},gen:0};
function applyKitPatterns(sc,label){
  const vs=[];sc.traverse(o=>{const m=/^SM_KitPattern_(\d+)(?:_(.+))?$/i.exec(o.name||'');if(!m)return;let tex=null;
    o.traverse(x=>{if(!tex&&x.isMesh){const mt=Array.isArray(x.material)?x.material[0]:x.material;if(mt&&mt.map)tex=mt.map;}});if(tex)vs.push({id:m[1],name:(m[2]||'Pattern '+m[1]).replace(/_/g,' ').trim(),tex});});
  if(!vs.length)throw new Error('kitpattern: no SM_KitPattern_###_Name found');
  vs.sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));
  vs.forEach(v=>{v.tex.flipY=false;v.tex.encoding=THREE.LinearEncoding;v.tex.needsUpdate=true;v.parts=[false,false,false];
    try{const im=v.tex.image,c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.drawImage(im,0,0,128,128);const d=x.getImageData(0,0,128,128).data;
      for(let i=0;i<d.length;i+=4)for(let k=0;k<3;k++)if(d[i+k]>127)v.parts[k]=true;}catch(e){v.parts=[true,true,true];}});
  KITPAT.list=vs;KITPAT.byId={};vs.forEach(v=>KITPAT.byId[v.id]=v);KITPAT.gen++;kpThumbs={};
  MODEL_INFO.kitpattern={src:label,note:`${vs.length} kit pattern${vs.length===1?'':'s'}`};
  try{applyKits();renderKitLook();}catch(e){}}
APPLY.kitpattern=applyKitPatterns;MODEL_INFO.kitpattern={src:'Built-in'};
loadModel('kitpattern','models/kitpattern.glb','kitpattern.glb');
// put a kit's pattern and second colours on a set of kit materials (a team's, or the Kit look preview's)
function setPattern(M,k){const P=M.pat||(M.pat={uPat:{value:null},uHasPat:{value:0},uShirt2:{value:new THREE.Color()},uShorts2:{value:new THREE.Color()},uSocks2:{value:new THREE.Color()}});
  const v=k&&k.pattern&&KITPAT.byId[k.pattern];P.uPat.value=v?v.tex:null;P.uHasPat.value=v?1:0;
  const c=(u,h,d)=>u.value.copy(new THREE.Color(h!=null?h:d).convertSRGBToLinear());c(P.uShirt2,k&&k.shirt2,0xffffff);c(P.uShorts2,k&&k.shorts2,0xffffff);c(P.uSocks2,k&&k.socks2,0xffffff);}
{const baseAK=applyKits;applyKits=function(){const r=baseAK.apply(this,arguments);for(let t=0;t<2;t++)setPattern(teamM[t],kitOf(t));return r;};}
// locked by an Album card (unlock type 'pattern')
const patLocked=id=>id&&typeof partLock==='function'?partLock('pattern',id):null;

/* ---------- Kit look: pattern picker and second colours ---------- */
let kpThumbs={};
function kitLookFull(q,t){const L=lookOf(q,t);return Object.assign({pt:'',s2:2,p2:2,o2:2},L);}
function kitPatThumbs(L){ // small renders of the figure in each pattern, with this look's colours
  const key=[L.s,L.p,L.o,L.s2,L.p2,L.o2,KITPAT.gen].join(',');if(kpThumbs.key===key)return kpThumbs;
  const out={key};if(!kR||!kScene||!kObj||!KITPAT.list.length)return out;
  try{const keep=new THREE.Vector2();kR.getSize(keep);const w=96,h=128;kR.setSize(w,h,false);const asp=kCam.aspect,fov=kCam.fov,cp=kCam.position.clone();kCam.aspect=w/h;
    // frame the shirt and shorts: the figure's top half, from the front
    const bx=new THREE.Box3().setFromObject(kObj),hh=bx.max.y-bx.min.y,cy=bx.min.y+hh*0.7,cx=(bx.min.x+bx.max.x)/2,cz=(bx.min.z+bx.max.z)/2;
    kCam.fov=30;kCam.position.set(cx,cy+hh*0.05,cz+hh*1.05);kCam.lookAt(cx,cy,cz);kCam.updateProjectionMatrix();
    const kc=i=>KIT_COLORS[i][1],base={shirt2:kc(L.s2),shorts2:kc(L.p2),socks2:kc(L.o2)};
    const ry=kObj.rotation.y;kObj.rotation.y=-Math.PI/2;if(kGround)kGround.visible=false;
    [{id:''},...KITPAT.list].forEach(v=>{setPattern(KIT_PM,Object.assign({pattern:v.id},base));kR.toneMappingExposure=1;kR.render(kScene,kCam);out[v.id]=kR.domElement.toDataURL('image/png');});
    kObj.rotation.y=ry;if(kGround)kGround.visible=true;kR.setSize(keep.x,keep.y,false);kCam.aspect=asp;kCam.fov=fov;kCam.position.copy(cp);kCam.updateProjectionMatrix();previewCam('kits',kCam);}catch(e){console.error('[kit pattern thumbs]',e);}
  return kpThumbs=out;}
function renderKitPattern(){
  const box=$('#kp-pat'),two=$('#kp-two');if(!box||hubTab!=='squad'||clubSec!=='kit')return;
  const q=mySquads[kitTeam],L=kitLookFull(q,kitTeam),k={pattern:L.pt,shirt2:KIT_COLORS[L.s2][1],shorts2:KIT_COLORS[L.p2][1],socks2:KIT_COLORS[L.o2][1]};
  if(!KITPAT.list.length){box.innerHTML='<p class="note">No kit patterns loaded (models/kitpattern.glb).</p>';two.innerHTML='';setPattern(KIT_PM,null);return;}
  const th=kitPatThumbs(L);setPattern(KIT_PM,k);
  const set=o=>{q.look=Object.assign({},kitLookFull(q,kitTeam),o);q.useLook=true;saveSquads();if(!S.running)applyKits();renderKits();renderKitLook();sfx('tock',20);};
  box.innerHTML='';
  [{id:'',name:'Plain'},...KITPAT.list].forEach(v=>{const b=document.createElement('button');b.type='button';b.className='kpat';b.setAttribute('aria-pressed',String(L.pt===v.id));b.title=v.name;
    const card=patLocked(v.id);b.innerHTML=(th[v.id]?`<img src="${th[v.id]}" alt="">`:'<span class="kpat-ph"></span>')+`<small>${v.name}</small>`+(card?'<span class="lock"><span class="price cardtag"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="2.5" width="14" height="19" rx="2.2" fill="#f6c443" stroke="#6b4a08" stroke-width="1.5"/></svg>Card</span></span>':'');
    if(card)b.classList.add('locked');
    b.onclick=()=>{if(card){const C=colOf(card.collection);hobbyToast(`Needs the Album card "${card.title}" (${C.name} #${card.no}).`);sfx('clack',10);return;}
      const o={pt:v.id};if(v.id&&!L.pt){o.s2=L.s===2?3:2;o.p2=L.p===2?3:2;o.o2=L.o===2?3:2;}set(o);};box.appendChild(b);});
  const v=L.pt&&KITPAT.byId[L.pt];two.innerHTML='';
  if(v)[['s2','Shirt, second colour',0],['p2','Shorts, second colour',1],['o2','Socks, second colour',2]].forEach(([key,label,part])=>{if(!v.parts[part])return;
    const r=document.createElement('div');r.className='kp-two';r.innerHTML=`<p class="h">${label}</p>`;const pal=document.createElement('div');pal.className='kitpal';
    KIT_COLORS.forEach(([n,c],i)=>{const b=document.createElement('button');b.type='button';b.className='kc';b.title=n;b.setAttribute('aria-label',n);b.style.background=hexStr(c);b.setAttribute('aria-pressed',String(L[key]===i));b.onclick=()=>set({[key]:i});pal.appendChild(b);});
    r.appendChild(pal);two.appendChild(r);});
}
{const baseKL=renderKitLook;renderKitLook=function(){const r=baseKL.apply(this,arguments);try{renderKitPattern();}catch(e){console.error('[kit pattern]',e);}return r;};}
function kitPatternItems(){return KITPAT.list.map(v=>({id:v.id,name:v.name}));}
