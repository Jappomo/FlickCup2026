// Flick Cup 2026 · js/core.js
// Helpers, table sizes, balancing, squads, bodies and the match state (S). Shared by everything after it.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const store={get(k){try{return localStorage.getItem(k);}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,v);}catch(e){}}};

/* ================= table constants (units roughly cm) ================= */
// gameplay sizes (cm). Models can override them through their CoP_ collider objects.
let HX=60,HZ=39,GOAL=8,GDEPTH=6,SHOOT=30,RF=1.6,RB=1.15,WALLX=71,WALLZ=47;
const FIG_DEC=58,FIG_DRAG=0.8,BALL_DEC=20,BALL_DRAG=0.42;
const VMIN=6,VMAX=78,M_FIG=1,M_BALL=0.38,E_BALL=0.88,E_FIG=0.5;
let K_HALF=2.3,K_R=1.25,K_X=HX-2.3;const K_RANGE=8.6,K_SPEED=13,K_REACT=0.2;
const DEFAULT_SIZES={HX,HZ,GOAL,GDEPTH,SHOOT,RF,RB,WALLX,WALLZ,K_HALF,K_R};
const SOFT=0.75,CURL_K=0.62,BAR_MAX=100;
const SETUP={corner:3,free:1,throw:1}; // optional positional flicks before the set piece is taken
const KITS=[
  {name:'Reds',ab:'RED',shirt:0xc8322a,shorts:0xf3f1ea,socks:0xc8322a,insert:0xc8322a,gk:0x2e8b57,ui:'#e0483b'},
  {name:'Blues',ab:'BLU',shirt:0x2459c4,shorts:0xf3f1ea,socks:0x2459c4,insert:0x2459c4,gk:0xe0b52b,ui:'#4b82f0'},
  {name:'Whites',ab:'WHI',shirt:0xf2f0ea,shorts:0x1b1b1b,socks:0xf2f0ea,insert:0xf2f0ea,gk:0x7a3fb8,ui:'#e9e6dc'},
  {name:'Golds',ab:'GOL',shirt:0xe7b923,shorts:0x1f5a32,socks:0xe7b923,insert:0xe7b923,gk:0x2b2b2b,ui:'#f0c53a'},
  {name:'Tangerines',ab:'TAN',shirt:0xec7a1c,shorts:0x15151a,socks:0x15151a,insert:0xec7a1c,gk:0x2a7fc4,ui:'#f38a2f'},
  {name:'Clarets',ab:'CLA',shirt:0x7b1e3a,shorts:0xf3f1ea,socks:0x8fc3e8,insert:0x8fc3e8,gk:0x222222,ui:'#c04a72'}
];
// kit look: 10 colours per section (shirt, shorts, socks) and keeper-only shirts
const KIT_COLORS=[['Red',0xc8322a],['Blue',0x2459c4],['White',0xf2f0ea],['Black',0x1b1b1d],['Yellow',0xe7b923],['Orange',0xec7a1c],['Green',0x1f8a3e],['Sky',0x6fb7ea],['Claret',0x7b1e3a],['Purple',0x5b2a9e]];
const GK_COLORS=[['Black',0x161618],['White',0xf4f4f2],['Green Neon',0x39ff6a],['Pink Neon',0xff3fa8],['Orange Neon',0xff7a1a],['Blue Neon',0x22c8ff],['Yellow Neon',0xe8ff2a]];
const hexStr=n=>'#'+n.toString(16).padStart(6,'0');
// what a team actually wears: its kit preset, unless its squad has its own kit look switched on
function kitOf(t){return kitFrom(KITS[S.kits[t]]||KITS[t]||KITS[0],typeof matchSquads!=='undefined'&&matchSquads&&matchSquads[t]);}
// a squad's kit from a preset: an AI club wears its own colours (kitHex), your squads their kit look when it is on
function kitFrom(base,q){if(q&&q.kitHex)return Object.assign({},base,q.kitHex);const L=q&&q.useLook&&q.look;
  if(!L)return base;const c=i=>KIT_COLORS[i]?KIT_COLORS[i][1]:0xffffff;
  return Object.assign({},base,{shirt:c(L.s),shorts:c(L.p),socks:c(L.o),insert:c(L.s),gk:GK_COLORS[L.g]?GK_COLORS[L.g][1]:base.gk,ui:hexStr(c(L.s)===0xf2f0ea?c(L.p):c(L.s))});}
const STATS=[
  {k:'sht',name:'Striker',ab:'SHT',desc:'Harder flicks when the ball is in the opponent\'s shooting area.'},
  {k:'pin',name:'Defender',ab:'PIN',desc:'Heavier base: gets knocked around less when opponents bump into it.'},
  {k:'mae',name:'Maestro',ab:'MAE',desc:'Soft flicks land closer to the arrow, with less under- and overshoot.'},
  {k:'b2b',name:'Box-to-Box',ab:'B2B',desc:'Runs further when flicked from between the two shooting areas. Distance only: no extra shot power.'},
  {k:'trk',name:'Trickster',ab:'TRK',desc:'On a soft flick into the ball, a chance to follow it for part of its run.'}
];
const FORMATIONS={
  '4-4-2':{pos:[[-44,-24],[-46,-8],[-46,8],[-44,24],[-28,-22],[-30,-7],[-30,7],[-28,22],[-12,-8],[-12,8]],lab:['LB','CB','CB','RB','LM','CM','CM','RM','ST','ST'],ko:8},
  '4-3-3':{pos:[[-44,-24],[-46,-8],[-46,8],[-44,24],[-30,-14],[-33,0],[-30,14],[-13,-20],[-11,0],[-13,20]],lab:['LB','CB','CB','RB','CM','CDM','CM','LW','ST','RW'],ko:8},
  '4-2-3-1':{pos:[[-44,-24],[-46,-8],[-46,8],[-44,24],[-34,-9],[-34,9],[-22,-22],[-21,0],[-22,22],[-11,0]],lab:['LB','CB','CB','RB','CDM','CDM','LM','CAM','RM','ST'],ko:9},
  '3-5-2':{pos:[[-46,-15],[-47,0],[-46,15],[-31,-26],[-33,-9],[-33,9],[-31,26],[-22,0],[-12,-8],[-12,8]],lab:['CB','CB','CB','LWB','CM','CM','RWB','CAM','ST','ST'],ko:8},
  '5-3-2':{pos:[[-42,-28],[-46,-14],[-47,0],[-46,14],[-42,28],[-29,-14],[-31,0],[-29,14],[-12,-8],[-12,8]],lab:['LWB','CB','CB','CB','RWB','CM','CDM','CM','ST','ST'],ko:8}
};
// corner spots: [distance from the goal line, distance across towards the corner side]. Order: 2 shooting area, 3 midfield, 4 own half.
const CORNER_PRESETS={
  agg:{name:'Aggressive',desc:'Midfield three on the shooting line, back four pushed up to halfway.',spots:[[6,-3],[9,5],[32,12],[33,-9],[40,0],[62,16],[62,-14],[65,2],[68,-26]]},
  bal:{name:'Balanced',desc:'Two runners, a midfield screen, a steady back four.',spots:[[8,2],[12,-6],[36,12],[38,-10],[46,0],[70,18],[72,-18],[78,6],[80,-6]]},
  def:{name:'Defensive',desc:'Deep shape, ready for their counter.',spots:[[10,0],[16,-8],[48,14],[50,-12],[56,0],[86,20],[88,-20],[94,8],[94,-8]]}
};
// defending a corner: 4 in your area, 4 in your half, 1 in their half, 1 on their shooting line (u measured from your own goal line)
const DEF_PRESETS={
  agg:{name:'Aggressive',desc:'Man-mark the runners and push out fast to spring the counter.',spots:[[4,4],[9,-7],[13,4],[20,-10],[33,12],[36,-10],[45,4],[52,-16],[70,10],[90,0]]},
  bal:{name:'Balanced',desc:'Cover the near post, a screen at the edge, two outlets.',spots:[[3,5],[8,-6],[12,4],[20,0],[32,10],[34,-12],[42,0],[48,18],[66,-6],[90,6]]},
  def:{name:'Defensive',desc:'Pack the edge of your area. Hard to break down.',spots:[[3,0],[8,-7],[8,7],[19.5,2],[31,8],[31,-8],[35,0],[40,14],[62,0],[90,0]]}
};
const CORNER_CFG={
  att:{field:'corner',cc:'cc',presets:CORNER_PRESETS,zones:[{nm:'Area',n:2,u:[3,29]},{nm:'Midfield',n:3,u:[31,59]},{nm:'Your half',n:4,u:[61,112]}]},
  def:{field:'dcorner',cc:'dcc',presets:DEF_PRESETS,zones:[{nm:'Area',n:4,u:[3,29]},{nm:'Your half',n:4,u:[31,59]},{nm:'Their half',n:1,u:[61,87]},{nm:'Line',n:1,u:[89,91]}]}
};
function zoneIdx(cfg,k){let c=0;for(let i=0;i<cfg.zones.length;i++){c+=cfg.zones[i].n;if(k<c)return i;}return cfg.zones.length-1;}
function clampSpot(cfg,k,u,w){const Z=cfg.zones[zoneIdx(cfg,k)];return[Math.round(clamp(u,Z.u[0],Z.u[1])*2)/2,Math.round(clamp(w,-37,37)*2)/2];}
function cornerSpots(q,cfg){return q[cfg.field]==='custom'&&q[cfg.cc]?q[cfg.cc]:(cfg.presets[q[cfg.field]]||cfg.presets.bal).spots;}
const SPECIALS={
  finesse:{name:'Finesse',ic:'FIN',desc:'Curl the ball left or right. Ball in the shooting area.'},
  maradona:{name:'Maradona',ic:'MAR',desc:'Flick into the ball to dribble: figure and ball run on together through the defence.'},
  bicycle:{name:'Bicycle Kick',ic:'BCK',desc:'Bounce the ball off a teammate in the shooting area and he strikes it at goal.'},
  thread:{name:'Thread the Needle',ic:'TTN',desc:'Pass from midfield into space. The nearest teammate runs to meet the ball where it stops.'},
  moon:{name:'To the Moon!',ic:'MOON',desc:'During a block in your own shooting area, smash the ball clear over everyone. No foul.'}
};
const NAMES=[['Okafor','Brennan','Vidal','Hartley','Moreau','Lindqvist','Castell','Nakamura','Ferro','Kowal'],['Daly','Sorensen','Abara','Quinlan','Petrov','Mendes','Halloran','Ibsen','Rocha','Tanaka']];
const NUMS=[3,4,5,2,11,6,8,7,9,10];
// formation spots are on the whole pitch (x from -60 own goal line to +60), attacking to the right.
// Zones: A -60..-30 defence, B -30..0 midfield, C 0..30 attack, D closed. Old own-half spots convert with toE.
const toE=x=>-60+(x+57)*(90/54);
function roleLab(e,z){const w=Math.abs(z)>=18,L=z<0?'L':'R';
  if(e<-30)return w?L+'B':'CB';if(e<0)return w?L+'WB':'CM';return w?L+'W':'ST';}
Object.values(FORMATIONS).forEach(F=>{F.pos=F.pos.map(([x,z])=>[Math.round(toE(x)),z]);F.lab=F.pos.map(p=>roleLab(p[0],p[1]));});
// a squad's formation: one of FORMATIONS, or 'custom' (your own spots)
function formOf(q){const F=FORMATIONS[q&&q.form];const B=F||FORMATIONS[q&&q.cbase]||FORMATIONS['4-4-2'];
  const pos=!F&&q&&q.form==='custom'&&Array.isArray(q.cpos)&&q.cpos.length===10?q.cpos:B.pos;
  return{pos,lab:pos.map(p=>roleLab(p[0],p[1])),kop:kopOf(q,pos)};}
// the two figures that stand at the ball for a kick-off: your picks first, then the most advanced
// kick-off pair rules: no defenders, at most one midfielder, at least one forward
const kRole=p=>p[0]<-30?'def':p[0]<0?'mid':'att';
function kopOk(pair,pos){if(pair.length<2)return false;const r=pair.map(i=>kRole(pos[i]));return !r.includes('def')&&r.includes('att')&&r.filter(x=>x==='mid').length<=1;}
function kopOf(q,pos){const want=(q&&Array.isArray(q.kop)?q.kop:[]).filter((i,k,a)=>i>=0&&i<10&&a.indexOf(i)===k).slice(0,2);
  if(kopOk(want,pos))return want;
  const byAdv=[0,1,2,3,4,5,6,7,8,9].sort((a,b)=>pos[b][0]-pos[a][0]);
  // keep a valid pick, fill the other slot with the most advanced figure that makes the pair legal
  for(const keep of [want[0],want[1]]){if(keep==null||kRole(pos[keep])==='def')continue;
    for(const j of byAdv){if(j===keep)continue;const p=want.indexOf(keep)===1?[j,keep]:[keep,j];if(kopOk(p,pos))return p;}}
  for(const a of byAdv)for(const b of byAdv){if(a!==b&&kopOk([a,b],pos))return[a,b];}
  return byAdv.slice(0,2);}
function kopOfOld(q,pos){const out=[];(q&&Array.isArray(q.kop)?q.kop:[]).forEach(i=>{if(i>=0&&i<10&&!out.includes(i)&&out.length<2)out.push(i);});
  const rest=[0,1,2,3,4,5,6,7,8,9].filter(i=>!out.includes(i)).sort((a,b)=>pos[b][0]-pos[a][0]);while(out.length<2)out.push(rest.shift());return out;}
// kick-off spot for a formation spot: nobody past halfway; forwards wait on the line, outside the centre circle
function kickSpot(e,z){if(e<=-3)return[Math.max(e,-57),z];return[Math.abs(z)<10?-10.5:-3,z];}
const dirOf=t=>t===0?1:-1;

/* ================= balancing ================= */
const STAT_KEYS=['sht','pin','mae','b2b','trk'];
const STAT_FX={sht:'Flick power ×, in their shooting area',pin:'Weight ×, harder to knock away',mae:'Soft-flick spread, lower is tighter',b2b:'Run distance ×, between the shooting areas (not shot power)',trk:'Chance to follow the ball on a soft flick',trkd:'Max follow distance, % of the ball\'s run (uses Trickster stars)'};
// extra modifiers that read another stat's stars
const EXTRA_MODS={trkd:{of:'trk',name:'Trickster follow'}};
const BAL_KEYS=[...STAT_KEYS,...Object.keys(EXTRA_MODS)];
function svx(b,k){const of=EXTRA_MODS[k].of;return statVal(k,b.st[STAT_KEYS.indexOf(of)]+pathBonus(b.team,of));}
const PATHS={att:{name:'Attack',col:'#ffa53d'},mid:{name:'Midfield',col:'#4fd17a'},def:{name:'Defense',col:'#4fa3ff'}};
const PATH_KEYS=['att','mid','def'];
const MOMENT_ORDER=['finesse','bicycle','maradona','thread','moon'];
const BAL_DEF={
  stats:{sht:{base:1,step:0.04},pin:{base:1,step:0.27},mae:{base:0.12,step:-0.03},b2b:{base:1,step:0.033},trk:{base:0,step:0.15},trkd:{base:30,step:0}},
  paths:{att:{sht:1,pin:0,mae:0,b2b:0,trk:0},mid:{sht:0,pin:0,mae:0.5,b2b:0.5,trk:0},def:{sht:0,pin:1,mae:0,b2b:0,trk:0}},
  unlock:{att:['finesse','bicycle'],mid:['bicycle','maradona','thread'],def:['thread','moon']},
  bar:{keep:6,chain:4,area:10,steal:10,goal:20,moon:8},
  eco:{on:true,start:100,tutorial:400,lose:40,draw:60,win:100,field:100,table:250,trinket:50,banner:50,ball:200}
};
const ECO_ROWS=[['start','Starting Hobby','New players begin with'],['tutorial','Tutorial reward','Once, for finishing the tutorial'],['lose','Solo: loss','Kick-off against the CPU'],['draw','Solo: draw','Kick-off against the CPU'],['win','Solo: win','Kick-off against the CPU'],['field','Field price','Each field'],['table','Table price','Each table'],['trinket','Trinket price','Each corner trinket'],['banner','Banner price','Each border banner'],['ball','Ball price','Each ball']];
// Moment bar: points added on each event (the bar is full at 100)
const BAR_ROWS=[['keep','Kept the ball','Each flick that keeps possession'],['chain','Third flick bonus','Extra on the 3rd and later flicks of a turn'],['area','Shot from the area','A flick from your shooting area that hits the ball'],['steal','Won the ball','Ball comes off your figure or keeper'],['goal','Goal','Scoring (not own goals)'],['moon','To the Moon clear','A To the Moon! clearance']];
function cleanBal(o){
  const d=JSON.parse(JSON.stringify(BAL_DEF));if(!o||typeof o!=='object')return d;
  const num=(v,a,b,f)=>{v=+v;return isFinite(v)?Math.min(b,Math.max(a,v)):f;};
  BAL_KEYS.forEach(k=>{const x=o.stats&&o.stats[k],pc=k==='trkd';if(x){d.stats[k].base=num(x.base,pc?0:-5,pc?100:10,d.stats[k].base);d.stats[k].step=num(x.step,pc?-50:-5,pc?50:5,d.stats[k].step);}});
  PATH_KEYS.forEach(p=>{const x=o.paths&&o.paths[p];if(x)STAT_KEYS.forEach(k=>{d.paths[p][k]=num(x[k],-3,3,d.paths[p][k]);});
    const u=o.unlock&&o.unlock[p];if(Array.isArray(u))d.unlock[p]=MOMENT_ORDER.filter(m=>u.includes(m));});
  BAR_ROWS.forEach(([k])=>{if(o.bar&&o.bar[k]!=null)d.bar[k]=num(o.bar[k],0,100,d.bar[k]);});
  if(o.eco){if(typeof o.eco.on==='boolean')d.eco.on=o.eco.on;ECO_ROWS.forEach(([k])=>{if(o.eco[k]!=null)d.eco[k]=Math.round(num(o.eco[k],0,100000,d.eco[k]));});}
  return d;
}
let BAL=cleanBal((()=>{try{return JSON.parse(store.get('baize.balance')||'null');}catch(e){return null;}})());
let MBAL=BAL; // the values a running match uses (online: the host's)
const statVal=(k,stars,bal)=>{const x=(bal||MBAL).stats[k];return x.base+x.step*stars;};
function pathBonus(team,k){const q=matchSquads[team],p=q&&MBAL.paths[q.path];return p?p[k]||0:0;}
function sv(b,k){return statVal(k,b.st[STAT_KEYS.indexOf(k)]+pathBonus(b.team,k));}
function pathFor(special){return PATH_KEYS.find(p=>BAL.unlock[p].includes(special))||'mid';}
function fitSpecial(q){const u=BAL.unlock[q.path]||[];if(u.length&&!u.includes(q.special))q.special=u[0];}
/* ================= squads ================= */
function defaultSquad(t){
  const cards=[];
  for(let i=0;i<10;i++)cards.push({st:i<4?[0,3,1,1,0]:i<8?[0,0,2,2,1]:[3,0,0,0,2]});
  return{form:'4-4-2',corner:'bal',special:t===0?'finesse':'maradona',path:t===0?'att':'mid',cards,cc:CORNER_PRESETS.bal.spots.map(a=>a.slice()),dcorner:'bal',dcc:DEF_PRESETS.bal.spots.map(a=>a.slice())};
}
function cleanSquadName(v){return String(v||'').replace(/[\u0000-\u001f<>|]/g,'').replace(/\s+/g,' ').trim().slice(0,16);}
function serSquad(q){return [q.form,q.corner,q.special,q.cards.map(c=>c.st.join('')).join(''),encCC(q.cc),q.dcorner,encCC(q.dcc),q.path||'mid',encodeURIComponent(q.name||''),q.cbase||'',q.cpos?'e'+q.cpos.map(a=>a.map(v=>Math.round(v*2)).join(',')).join(';'):'',q.kit!=null?q.kit:'',Array.isArray(q.kop)?q.kop.join(','):'',q.look?[q.look.s,q.look.p,q.look.o,q.look.g,q.useLook?1:0].join(','):''].join('|');}
function encCC(cc){return cc.map(a=>a.map(v=>Math.round(v*2)).join(',')).join(';');}
function decCC(str,cfg,n){if(!str)return null;const pairs=str.split(';');if(pairs.length!==n)return null;const cc=pairs.map((pr,k)=>{const [u,w]=pr.split(',').map(Number);return isFinite(u)&&isFinite(w)?clampSpot(cfg,k,u/2,w/2):null;});return cc.every(Boolean)?cc:null;}
function parseSquad(s,t){
  const q=defaultSquad(t);if(typeof s!=='string')return q;
  const p=s.split('|');if(p.length<4||p.length>14)return q;
  if(p[13]){const L=p[13].split(',').map(Number);if(L.length===5&&L.every(Number.isInteger)){q.look={s:clamp(L[0],0,9),p:clamp(L[1],0,9),o:clamp(L[2],0,9),g:clamp(L[3],0,GK_COLORS.length-1)};q.useLook=L[4]===1;}}
  if(p[12]){const k=p[12].split(',').map(Number).filter(i=>Number.isInteger(i)&&i>=0&&i<10);if(k.length)q.kop=[...new Set(k)].slice(0,2);}
  if(p[11]!==undefined&&p[11]!==''&&KITS[+p[11]])q.kit=+p[11];
  if(FORMATIONS[p[9]])q.cbase=p[9];
  if(p[10]){const ed=p[10][0]==='e',cp=p[10].replace(/^e/,'').split(';').map(pr=>pr.split(',').map(v=>+v/2));if(cp.length===10&&cp.every(a=>a.length===2&&a.every(isFinite)))q.cpos=cp.map(([x,z])=>[clamp(ed?x:toE(x),-57,29),clamp(z,-36,36)]);}
  if(p[0]==='custom'&&q.cpos)q.form='custom';
  try{q.name=cleanSquadName(decodeURIComponent(p[8]||''));}catch(e){q.name='';}
  if(FORMATIONS[p[0]])q.form=p[0];if(CORNER_PRESETS[p[1]]||p[1]==='custom')q.corner=p[1];
  const cc=decCC(p[4],CORNER_CFG.att,9);if(cc)q.cc=cc;
  if(DEF_PRESETS[p[5]]||p[5]==='custom')q.dcorner=p[5];const dcc=decCC(p[6],CORNER_CFG.def,10);if(dcc)q.dcc=dcc;if(SPECIALS[p[2]])q.special=p[2];q.path=PATHS[p[7]]?p[7]:pathFor(q.special);fitSpecial(q);
  if(/^[0-3]{50}$/.test(p[3])){for(let i=0;i<10;i++){const st=p[3].slice(i*5,i*5+5).split('').map(Number);if(st.reduce((a,b)=>a+b,0)<=5)q.cards[i].st=st;}}
  return q;
}
const mySquads=[parseSquad(store.get('baize.squad.0'),0),parseSquad(store.get('baize.squad.1'),1)];
const myNames=[0,1].map(t=>{let a=null;try{a=JSON.parse(store.get('baize.names.'+t)||'null');}catch(e){}return Array.isArray(a)&&a.length===10?a.map((n,i)=>typeof n==='string'&&n.trim()?n.slice(0,16):NAMES[t][i]):NAMES[t].slice();});
function saveNames(t){store.set('baize.names.'+t,JSON.stringify(myNames[t]));}
function saveSquads(){store.set('baize.squad.0',serSquad(mySquads[0]));store.set('baize.squad.1',serSquad(mySquads[1]));}
let matchSquads=[mySquads[0],mySquads[1]];
const cardOvr=st=>64+st.reduce((a,b)=>a+b,0)*3+(st.includes(3)?2:0);

/* ================= bodies ================= */
const bodies=[];
for(let t=0;t<2;t++)for(let i=0;i<10;i++)bodies.push({id:t*10+i,team:t,idx:i,x:0,z:0,vx:0,vz:0,r:RF,m:M_FIG,mass:1,st:[0,0,0,0,0],yaw:0,spin:0,ball:false});
const ball={id:20,team:-1,x:0,z:0,vx:0,vz:0,r:RB,m:M_BALL,mass:M_BALL,yaw:0,spin:0,ball:true,air:0,airT:1,hy:RB};
bodies.push(ball);
for(let t=0;t<2;t++)bodies.push({id:21+t,team:t,idx:10,x:0,z:0,vx:0,vz:0,r:RF,m:M_FIG,mass:1,st:[0,0,0,0,0],yaw:t===0?0:Math.PI,spin:0,ball:false,off:true,gk:true});
const GKB=t=>bodies[21+t];
function syncGK(){for(let t=0;t<2;t++)GKB(t).off=!S.kOut[t];}
const keepers=[{team:0,x:-K_X,z:0,vz:0,target:0},{team:1,x:K_X,z:0,vz:0,target:0}];
function applySquadStats(){for(let t=0;t<2;t++)for(let i=0;i<10;i++){const b=bodies[t*10+i],st=matchSquads[t].cards[i].st;b.st=st.slice();b.mass=Math.max(0.2,sv(b,'pin'));}}

/* ================= match state ================= */
const S={mode:'local',running:false,paused:false,seq:0,score:[0,0],half:1,halfLen:300,clock:300,phase:'idle',poss:0,active:0,flicks:0,lastFig:-1,lastFigCount:0,ko1:0,kits:[0,1],msg:null,setupLeft:0,setupKind:'',bar:[0,0],armed:'',armedTeam:-1,taker:-1,timeUp:false,ban:null,defN:0,koPend:false,kOut:[0,0],kAt:[-1,-1],possN:0,log:[]};
const cpuTeam=1;
let sel=-1,selPrefer=-1,curlSign=1;
const N=t=>(matchSquads&&matchSquads[t]&&matchSquads[t].name)||kitOf(t).name;
const AB=t=>{if(matchSquads&&matchSquads[t]&&matchSquads[t].ab)return matchSquads[t].ab;const n=matchSquads&&matchSquads[t]&&matchSquads[t].name;const w=n?n.replace(/[^A-Za-z0-9 ]/g,'').trim().split(' ').filter(Boolean):[];if(!w.length)return KITS[S.kits[t]].ab;return (w.length>1&&w[0].length<=3?w.map(x=>x[0]).join(''):w[0]).slice(0,3).toUpperCase();};
const inAttArea=(t,x)=>dirOf(t)>0?x>=SHOOT:x<=-SHOOT;
const inDefArea=(t,x)=>dirOf(t)>0?x<=-SHOOT:x>=SHOOT;

