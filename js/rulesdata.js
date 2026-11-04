// Flick Cup 2026 · js/rulesdata.js
// Rules, physics, formations and corner layouts from data/rules.json (Distal > Data > Rules).
// The file only holds what was changed: everything else keeps the value written in the code, which Distal calls the
// "Distal default" and can restore. RULES_DEF is that snapshot, taken at start before any change.
// Loaded by index.html as a classic script after core, rules and data.js.
'use strict';
const RULES_PHYS=['FIG_DEC','FIG_DRAG','BALL_DEC','BALL_DRAG','VMIN','VMAX','E_BALL','E_FIG','K_RANGE','K_SPEED','K_REACT','SOFT','CURL_K','BAR_MAX'];
const RULES_DEF={
  rules:{maxFlicks:MAXF,setup:Object.assign({},SETUP),box:{deep:BOX.deep,half:BOX.half,sDeep:BOX.sDeep,sHalf:BOX.sHalf,maxSmall:BOX.maxSmall,maxBig:BOX.maxBig}},
  physics:Object.fromEntries(RULES_PHYS.map(k=>[k,eval(k)])),
  formations:Object.fromEntries(Object.entries(FORMATIONS).map(([k,f])=>[k,{pos:f.pos.map(p=>p.slice()),ko:f.ko}])),
  corners:{att:Object.fromEntries(Object.entries(CORNER_PRESETS).map(([k,p])=>[k,p.spots.map(s=>s.slice())])),def:Object.fromEntries(Object.entries(DEF_PRESETS).map(([k,p])=>[k,p.spots.map(s=>s.slice())]))}
};
let RULES_ON={}; // the overrides in use
const rNum=(v,lo,hi,d)=>{v=+v;return isFinite(v)?Math.min(hi,Math.max(lo,v)):d;};
function rulesApply(o){
  o=o&&typeof o==='object'?o:{};RULES_ON=o;
  const D=RULES_DEF,R=o.rules||{},P=o.physics||{};
  MAXF=Math.round(rNum(R.maxFlicks,1,9,D.rules.maxFlicks));
  Object.keys(D.rules.setup).forEach(k=>{SETUP[k]=Math.round(rNum((R.setup||{})[k],0,5,D.rules.setup[k]));});
  Object.keys(D.rules.box).forEach(k=>{const lim=/^max/.test(k)?[0,10]:[1,60];BOX[k]=rNum((R.box||{})[k],lim[0],lim[1],D.rules.box[k]);if(/^max/.test(k))BOX[k]=Math.round(BOX[k]);});
  RULES_PHYS.forEach(k=>{const v=P[k]!=null&&isFinite(+P[k])&&+P[k]>=0?+P[k]:D.physics[k];eval(k+'=v');});
  Object.entries(D.formations).forEach(([k,d])=>{const F=FORMATIONS[k],c=(o.formations||{})[k]||{};if(!F)return;
    const pos=Array.isArray(c.pos)&&c.pos.length===10&&c.pos.every(p=>Array.isArray(p)&&isFinite(p[0])&&isFinite(p[1]))?c.pos.map(p=>[clamp(+p[0],-HX+2,HX-2),clamp(+p[1],-HZ+2,HZ-2)]):d.pos.map(p=>p.slice());
    F.pos=pos;F.lab=pos.map(p=>roleLab(p[0],p[1]));F.ko=c.ko!=null&&c.ko>=0&&c.ko<10?c.ko|0:d.ko;});
  [['att',CORNER_PRESETS],['def',DEF_PRESETS]].forEach(([side,L])=>Object.entries(D.corners[side]).forEach(([k,d])=>{const c=((o.corners||{})[side]||{})[k];
    L[k].spots=Array.isArray(c)&&c.length===d.length&&c.every(p=>Array.isArray(p)&&isFinite(p[0])&&isFinite(p[1]))?c.map(p=>[+p[0],+p[1]]):d.map(p=>p.slice());}));
  try{if(typeof hubTab!=='undefined'&&hubTab==='squad'&&typeof renderSquad==='function')renderSquad();}catch(e){}
}
// for Distal: the defaults (code values), what is in use now, and the names
function rulesMeta(){
  return{defaults:JSON.parse(JSON.stringify(RULES_DEF)),overrides:JSON.parse(JSON.stringify(RULES_ON)),
    now:{maxFlicks:MAXF,setup:Object.assign({},SETUP),box:Object.assign({},BOX),physics:Object.fromEntries(RULES_PHYS.map(k=>[k,eval(k)]))},
    pitch:{HX,HZ,SHOOT,GOAL,RF},labels:Object.fromEntries(Object.entries(FORMATIONS).map(([k,f])=>[k,f.lab.slice()])),
    corners:{att:Object.fromEntries(Object.entries(CORNER_PRESETS).map(([k,p])=>[k,p.name])),def:Object.fromEntries(Object.entries(DEF_PRESETS).map(([k,p])=>[k,p.name]))},
    cornerZones:{att:CORNER_CFG.att.zones,def:CORNER_CFG.def.zones}};
}
onDataFile('rules',rulesApply);
