// Flick Cup 2026 · js/challenges.js
// Challenges: milestones for your club (play 10 matches, win against a 3-star club, find 20 cards, ...), shown in
// My Club > Challenges. The list is data/challenges.json (Distal > Balancing > Challenges): each challenge
// has a condition (metric, optional setting, target) and an optional reward picked by hand (Hobby, a pack, an Album
// card, or a game item, which stays locked until the challenge is done).
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= what a challenge can count ================= */
const CH_GROUPS={matches:'Matches',goals:'Goals',defence:'Defence',clubs:'Clubs',modes:'Modes',album:'Album',training:'Training',club:'Club'};
const CH_MODES={cpu:'Solo',local:'Versus',online:'Online',cup:'Tournament'};
// kind 'total': read from what the game already keeps (counts from before the challenge existed too)
// kind 'match': counted at full time, one per match that meets the condition (conceded matches do not count)
// param: what the setting is (number, stars, mode, drill) with its default; text(target,param) is the description
const CH_METRICS={
  played:{name:'Matches played',kind:'total',text:t=>`Play ${t} match${t>1?'es':''}.`},
  won:{name:'Matches won',kind:'total',text:t=>t>1?`Win ${t} matches.`:'Win a match.'},
  winStreak:{name:'Wins in a row',kind:'total',text:t=>`Win ${t} matches in a row.`},
  unbeaten:{name:'Unbeaten run',kind:'total',text:t=>`Play ${t} matches in a row without losing.`},
  goals:{name:'Goals scored',kind:'total',text:t=>t>1?`Score ${t} goals.`:'Score a goal.'},
  cleanSheets:{name:'Clean sheets',kind:'total',text:t=>t>1?`Keep ${t} clean sheets.`:'Keep a clean sheet.'},
  clubsBeaten:{name:'Different AI clubs beaten',kind:'total',param:{type:'stars',label:'At least',def:0},text:(t,p)=>`Beat ${t} different AI club${t>1?'s':''}${p>0?` with ${p} star${p>1?'s':''} or more`:''}.`},
  cards:{name:'Album cards found',kind:'total',text:t=>`Find ${t} different Album card${t>1?'s':''}.`},
  collections:{name:'Album pages complete',kind:'total',text:t=>t>1?`Complete ${t} Album collections.`:'Complete an Album collection.'},
  packs:{name:'Packs opened',kind:'total',text:t=>`Open ${t} card pack${t>1?'s':''}.`},
  hobby:{name:'Hobby earned',kind:'total',text:t=>`Earn ${t} Hobby.`},
  trainTried:{name:'Training drills finished',kind:'total',text:t=>`Finish ${t} different training drill${t>1?'s':''} (Practice > Training).`},
  trainScore:{name:'Training best score',kind:'total',param:{type:'drill',label:'Drill',def:''},text:(t,p)=>{const d=typeof TRAIN!=='undefined'&&TRAIN.find(x=>x.id===p);return `Score ${t} / 10 in ${d?d.name:'any training drill'}.`;}},
  winBy:{name:'Wins by a margin',kind:'match',param:{type:'number',label:'Goals ahead',def:3,min:1,max:20},text:(t,p)=>`Win by ${p} goals or more${t>1?`, ${t} times`:''}.`},
  scoreN:{name:'Big scores',kind:'match',param:{type:'number',label:'Goals',def:5,min:1,max:30},text:(t,p)=>`Score ${p} or more in one match${t>1?`, ${t} times`:''}.`},
  hatTrick:{name:'Hat-tricks',kind:'match',param:{type:'number',label:'Goals by one figure',def:3,min:2,max:20},text:(t,p)=>`One of your figures scores ${p} in a match${t>1?`, ${t} times`:''}.`},
  comeback:{name:'Comebacks',kind:'match',text:t=>`Win a match after being behind${t>1?`, ${t} times`:''}.`},
  winVsStars:{name:'Wins against strong clubs',kind:'match',param:{type:'stars',label:'At least',def:3},text:(t,p)=>`Beat a ${p}-star club${t>1?` ${t} times`:''}.`},
  winMode:{name:'Wins in a mode',kind:'match',param:{type:'mode',label:'Mode',def:'cpu'},text:(t,p)=>`Win ${t>1?t+' ':'a'+(p==='online'?'n':'')+' '}${(CH_MODES[p]||p)} match${t>1?'es':''}.`},
};
// what a challenge can give (besides the item types an Album card can unlock)
const CH_REWARDS={hobby:'Hobby coins',pack:'Card pack',card:'Album card'};
/* ================= data: data/challenges.json ================= */
// [id, group, name, metric, target, param]; descriptions are written by the game from the condition unless set
const CH_SEED=[
  ['play1','matches','First whistle','played',1],['play10','matches','Regulars','played',10],['play50','matches','Season ticket','played',50],
  ['win1','matches','First win','won',1],['win10','matches','Ten up','won',10],['win25','matches','Silverware form','won',25],
  ['streak3','matches','On a roll','winStreak',3],['unbeaten5','matches','Unbeaten run','unbeaten',5],
  ['goal1','goals','Off the mark','goals',1],['goal50','goals','Half a century','goals',50],['goal150','goals','Goal machine','goals',150],
  ['hattrick','goals','Hat-trick hero','hatTrick',1,3],['goalfest','goals','Goal fest','scoreN',1,5],['thrashing','goals','Thrashing','winBy',1,4],
  ['cs1','defence','Shut out','cleanSheets',1],['cs10','defence','The wall','cleanSheets',10],['comeback','defence','Comeback kings','comeback',1],
  ['giant','clubs','Giant killer','winVsStars',1,3],['rivals5','clubs','Know your rivals','clubsBeaten',5,0],['rivals15','clubs','Beaten them all','clubsBeaten',15,0],
  ['versus1','modes','Bragging rights','winMode',1,'local'],['online1','modes','Online debut','winMode',1,'online'],['cup3','modes','Cup run','winMode',3,'cup'],
  ['cards20','album','Collector','cards',20],['page1','album','Page turner','collections',1],['packs10','album','Pack rat','packs',10],
  ['trainall','training','Back to school','trainTried',10],['shoot8','training','Sharpshooter','trainScore',8,'t_shoot1'],['perfect','training','Perfect ten','trainScore',10,''],
  ['hobby1000','club','Hobbyist','hobby',1000],
];
const CHAL_DEF={version:1,challenges:CH_SEED.map(([id,group,name,metric,target,param])=>({id,group,name,desc:'',metric,param:param===undefined?null:param,target,reward:null,on:true}))};
let CHAL=null;
function chRewardTypes(){return Object.assign({},CH_REWARDS,typeof UNLOCK_TYPES!=='undefined'?UNLOCK_TYPES:{});}
// the game's own clean-up of data/challenges.json (Distal uses the same through the link)
function cleanChallenges(o){
  o=o&&typeof o==='object'?o:{};
  const str=(v,n,d)=>typeof v==='string'?v.replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,n):d;
  const num=(v,lo,hi,d)=>{v=Number(v);return isFinite(v)?Math.max(lo,Math.min(hi,Math.round(v))):d;};
  const out={version:1,challenges:[]},ids=new Set(),RT=chRewardTypes();
  (Array.isArray(o.challenges)?o.challenges:CHAL_DEF.challenges).forEach((c,i)=>{if(!c||typeof c!=='object')return;
    let id=str(c.id,32,'').replace(/[^A-Za-z0-9_-]/g,'');if(!id||ids.has(id))id='ch'+(i+1);if(ids.has(id))return;ids.add(id);
    const metric=CH_METRICS[c.metric]?c.metric:'played',M=CH_METRICS[metric],P=M.param;
    let param=null;if(P){if(P.type==='number')param=num(c.param,P.min||0,P.max||999,P.def);else if(P.type==='stars')param=num(c.param,0,3,P.def);
      else if(P.type==='mode')param=CH_MODES[c.param]?c.param:P.def;else param=typeof c.param==='string'?str(c.param,32,''):P.def;}
    let reward=null;const r=c.reward;
    if(r&&typeof r==='object'&&RT[r.type]){reward=r.type==='hobby'?{type:'hobby',n:num(r.n,0,100000,100)}:r.type==='pack'?{type:'pack',n:num(r.n,1,10,3)}:{type:r.type,id:str(String(r.id==null?'':r.id),40,'')};}
    out.challenges.push({id,group:CH_GROUPS[c.group]?c.group:'matches',name:str(c.name,40,'')||'New challenge',desc:str(c.desc,160,''),metric,param,target:num(c.target,1,100000,1),reward,on:c.on!==false});});
  return out;}
CHAL=cleanChallenges(CHAL_DEF);
const chById=id=>CHAL.challenges.find(c=>c.id===id)||null;
const chList=()=>CHAL.challenges.filter(c=>c.on);
function chalText(c){const M=CH_METRICS[c.metric];return c.desc||(M?M.text(c.target,c.param):'');}

/* ================= save: baize.challenges ================= */
// {v, s:{packs, hobby, ws, wsBest, ub, ubBest, beaten:[club ids]}, prog:{id:n} (match counts), done:{id:time}, paid:{id:1}, fresh:{id:1}, items:{'type:id':1}}
const CH=(()=>{let c=null;try{c=JSON.parse(store.get('baize.challenges')||'null');}catch(e){}
  if(!c||typeof c!=='object'||c.v!==1){c={v:1,s:null,prog:{},done:{},paid:{},fresh:{},items:{}};}
  ['prog','done','paid','fresh','items'].forEach(k=>{if(!c[k]||typeof c[k]!=='object')c[k]={};});
  if(!c.s||typeof c.s!=='object'){ // first start: streaks and beaten clubs from the club history you already have
    const s={packs:0,hobby:0,ws:0,wsBest:0,ub:0,ubBest:0,beaten:[]};
    try{let ws=0,ub=0,wd=true,ud=true;HIST.recent.forEach(r=>{if(wd&&r.res==='w')ws++;else wd=false;if(ud&&r.res!=='l')ub++;else ud=false;});s.ws=s.wsBest=ws;s.ub=s.ubBest=ub;
      let w=0,u=0;HIST.recent.slice().reverse().forEach(r=>{w=r.res==='w'?w+1:0;u=r.res!=='l'?u+1:0;s.wsBest=Math.max(s.wsBest,w);s.ubBest=Math.max(s.ubBest,u);});
      s.beaten=Object.keys(HIST.opps).filter(k=>!/^n:/.test(k)&&HIST.opps[k].w>0);}catch(e){}
    c.s=s;}
  if(!Array.isArray(c.s.beaten))c.s.beaten=[];return c;})();
function saveCh(){store.set('baize.challenges',JSON.stringify(CH));chDot();}

/* ================= progress ================= */
function chStarsOf(club){try{const c=TEAMS.clubs.find(x=>x.id===club);return c?c.stars:0;}catch(e){return 0;}}
function chTrainBest(){try{return typeof trBest==='function'?trBest():{};}catch(e){return{};}}
function chProgress(c){
  const H=HIST,s=CH.s;
  switch(c.metric){
    case 'played':return H.p;case 'won':return H.w;case 'goals':return H.gf;case 'cleanSheets':return H.cs;
    case 'winStreak':return s.wsBest;case 'unbeaten':return s.ubBest;
    case 'clubsBeaten':return s.beaten.filter(id=>!(c.param>0)||chStarsOf(id)>=c.param).length;
    case 'cards':return typeof CARDS!=='undefined'?CARDS.cards.filter(x=>hasCard(x.id)).length:0;
    case 'collections':return typeof ALBUM!=='undefined'?Object.keys(ALBUM.done).length:0;
    case 'packs':return s.packs;case 'hobby':return s.hobby;
    case 'trainTried':{const b=chTrainBest();return Object.keys(b).filter(k=>typeof TRAIN!=='undefined'&&TRAIN.some(t=>t.id===k)).length;}
    case 'trainScore':{const b=chTrainBest();return c.param?(b[c.param]||0):Math.max(0,...Object.values(b).map(v=>+v||0));}
    default:return CH.prog[c.id]||0;}}
const chDone=c=>!!CH.done[c.id];
// a match that has just been written to the club history: streaks, beaten clubs and the match challenges
let CHM={behind:false};
function chMatch(){
  const me=histSide();if(me==null||!S.score)return;
  const gf=S.score[me],ga=S.score[1-me],res=gf>ga?'w':gf<ga?'l':'d',s=CH.s;
  s.ws=res==='w'?s.ws+1:0;s.wsBest=Math.max(s.wsBest,s.ws);s.ub=res!=='l'?s.ub+1:0;s.ubBest=Math.max(s.ubBest,s.ub);
  const opp=matchSquads&&matchSquads[1-me]||{},club=opp.club&&chStarsOf(opp.club)?opp.club:'';
  if(res==='w'&&club&&!s.beaten.includes(club))s.beaten.push(club);
  if(!S.conceded){
    const byFig={};HM.goals.filter(g=>g.team===me).forEach(g=>byFig[g.idx]=(byFig[g.idx]||0)+1);const hat=Math.max(0,...Object.values(byFig));
    const mode=S.tour?'cup':S.mode,stars=club?chStarsOf(club):0;
    const hit={winBy:p=>res==='w'&&gf-ga>=p,scoreN:p=>gf>=p,hatTrick:p=>hat>=p,comeback:()=>res==='w'&&CHM.behind,winVsStars:p=>res==='w'&&stars>=p,winMode:p=>res==='w'&&mode===p};
    CHAL.challenges.forEach(c=>{if(CH_METRICS[c.metric].kind==='match'&&!chDone(c)&&hit[c.metric]&&hit[c.metric](c.param))CH.prog[c.id]=(CH.prog[c.id]||0)+1;});}
  saveCh();chCheck();}
{const bN=newMatch,bG=scoreGoal,bF=showFT;
  newMatch=function(o){CHM={behind:false};return bN(o);};
  scoreGoal=function(team,own){const r=bG(team,own);try{const me=histSide();if(me!=null&&S.score[me]<S.score[1-me])CHM.behind=true;}catch(e){}return r;};
  // club.js writes the match into the history inside showFT (HM.done); count it here once
  showFT=function(){const was=HM.done;bF();try{if(HM.done&&!was)chMatch();}catch(e){console.error('[challenges]',e);}};}
// other things that move challenges along
{const bO=openPack;openPack=function(){const r=bO();if(r){CH.s.packs++;saveCh();chCheck();}return r;};}
{const bE=earn;earn=function(n,why){const r=bE(n,why);if(r>0){CH.s.hobby+=r;saveCh();setTimeout(chCheck,1300);}return r;};}
{const bC=cardGained;cardGained=function(c,first){bC(c,first);if(first)setTimeout(chCheck,1600);};}
if(typeof trainFinish==='function'){const bT=trainFinish;trainFinish=function(){bT();chCheck();};}

/* ================= done: rewards ================= */
function chRewardText(r){if(!r)return '';const RT=chRewardTypes();
  if(r.type==='hobby')return r.n+' Hobby';if(r.type==='pack')return `a card pack (${r.n} card${r.n>1?'s':''})`;
  if(r.type==='card'){const c=typeof cardById==='function'&&cardById(r.id);return c?`the Album card "${c.title}"`:'an Album card';}
  const it=typeof unlockItems==='function'?unlockItems(r.type).find(x=>x.id===r.id):null;return `${(RT[r.type]||r.type).toLowerCase()}: ${it?it.name:(r.id||'to be decided')}`;}
function chPay(c){const r=c.reward;if(!r||CH.paid[c.id])return;
  if(r.type==='hobby'){if(!ecoOn())return;earn(r.n,`Challenge: ${c.name}`);}
  else if(r.type==='pack')addPack(r.n);
  else if(r.type==='card'){if(!r.id||!cardById(r.id))return;giveCard(r.id);}
  else{if(!r.id)return;if(CARD_PARTS.includes(r.type)){OWNED[r.type]=OWNED[r.type]||[];if(!OWNED[r.type].includes(r.id)){OWNED[r.type].push(r.id);store.set('baize.owned',JSON.stringify(OWNED));}}
    CH.items[r.type+':'+r.id]=1;}
  CH.paid[c.id]=1;}
// newly done challenges: mark them, pay the reward, say so (quiet at start: the dot in My Club shows them)
let chToastQ=[],chToastT=0;
function chToast(t){chToastQ.push(t);if(chToastT)return;const next=()=>{const m=chToastQ.shift();if(!m){chToastT=0;return;}hobbyToast(m,true);try{sfx('moment',18);}catch(e){}chToastT=setTimeout(next,2800);};next();}
function chCheck(quiet){
  let any=false;
  chList().forEach(c=>{if(!chDone(c)&&chProgress(c)>=c.target){CH.done[c.id]=Date.now();CH.fresh[c.id]=1;any=true;if(!quiet)chToast(`Challenge done: ${c.name}`+(c.reward?` · ${chRewardText(c.reward)}`:''));}
    if(chDone(c)&&c.reward&&!CH.paid[c.id])chPay(c);});
  saveCh();if(any&&hubTab==='squad'&&clubSec==='chal')renderChallenges();return any;}

/* ================= items a challenge gives stay locked until it is done ================= */
function chalFor(type,id){if(id==null||id==='')return null;return chList().find(c=>c.reward&&c.reward.type===type&&c.reward.id===String(id))||null;}
function chalLock(type,id){if(!ecoOn())return null;const c=chalFor(type,id);if(!c||chDone(c)||CH.items[type+':'+id])return null;
  if(CARD_PARTS.includes(type)&&(id===firstId(type)||(OWNED[type]||[]).includes(id)))return null;
  return{chal:c,title:c.name,collection:'',no:0};}
{const bL=cardLock,bP=partLock,bO=owns,bB=buy,bT=lockTag;
  cardLock=function(part,id){return bL(part,id)||chalLock(part,id);};
  partLock=function(type,id){return bP(type,id)||chalLock(type,id);};
  owns=function(part,id){if(CARD_PARTS.includes(part)&&chalLock(part,id))return false;return bO(part,id);};
  buy=function(part,id){const l=chalLock(part,id);if(l&&!bL(part,id)){hobbyToast(`Complete the challenge "${l.title}" (My Club > Challenges).`);sfx('clack',10);return false;}return bB(part,id);};
  lockTag=function(part,id){const c=cardLock(part,id);if(c&&c.chal)return `<span class="price cardtag chaltag" title="${String(c.title).replace(/"/g,'&quot;')}">${CH_ICON}Challenge</span>`;return bT(part,id);};}
const CH_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v5a5 5 0 0 1-10 0z" fill="#f6c443" stroke="#6b4a08" stroke-width="1.5"/><path d="M7 5H4v1.5A3.5 3.5 0 0 0 7.5 10M17 5h3v1.5A3.5 3.5 0 0 1 16.5 10" fill="none" stroke="#6b4a08" stroke-width="1.5"/><path d="M10.5 13h3v4h-3zM8 18h8v3H8z" fill="#f6c443" stroke="#6b4a08" stroke-width="1.3"/></svg>';

/* ================= My Club > Challenges ================= */
let chGroup='';
function chDot(){const b=document.querySelector('#club-sub [data-club="chal"]');if(!b)return;let d=b.querySelector('.tab-dot');const on=Object.keys(CH.fresh).some(id=>chById(id));
  if(on&&!d){d=document.createElement('i');d.className='tab-dot';b.appendChild(d);}else if(!on&&d)d.remove();}
function renderChallenges(){
  const el=$('#club-chal');if(!el||hubTab!=='squad'||clubSec!=='chal')return;
  el.innerHTML=chRender();
  el.querySelectorAll('[data-chg]').forEach(b=>b.onclick=()=>{chGroup=b.dataset.chg;sfx('tock',10);renderChallenges();const f=el.querySelector(`[data-chg="${chGroup}"]`);if(f)f.focus();});
  if(Object.keys(CH.fresh).length){setTimeout(()=>{if(clubSec==='chal'){CH.fresh={};saveCh();}},0);}}
{const bS=setClubSec;setClubSec=function(sec){const r=bS(sec);const el=$('#club-chal');if(el)el.hidden=sec!=='chal';if(sec==='chal')renderChallenges();return r;};}
function chRender(){
  const L=chList(),done=L.filter(chDone),pct=L.length?Math.round(done.length/L.length*100):0;
  const groups=Object.keys(CH_GROUPS).filter(g=>L.some(c=>c.group===g));if(chGroup&&!groups.includes(chGroup))chGroup='';
  const chips=`<div class="seg ch-groups"><button class="chip" type="button" data-chg="" aria-pressed="${!chGroup}">All</button>${groups.map(g=>{const a=L.filter(c=>c.group===g);return `<button class="chip" type="button" data-chg="${g}" aria-pressed="${chGroup===g}">${CH_GROUPS[g]} <small>${a.filter(chDone).length}/${a.length}</small></button>`;}).join('')}</div>`;
  const show=L.filter(c=>!chGroup||c.group===chGroup),order=[...show.filter(c=>!chDone(c)),...show.filter(chDone)];
  const row=c=>{const d=chDone(c),p=Math.min(c.target,chProgress(c)),w=Math.round(p/c.target*100),fr=CH.fresh[c.id];
    return `<div class="ch-row${d?' done':''}"><i class="ch-ic">${d?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>':CH_ICON}</i>
      <div class="ch-t"><b>${hEsc(c.name)}${fr?' <em class="ch-new">New</em>':''}</b><span>${hEsc(chalText(c))}</span>
      ${d?`<small class="ch-when">Done ${new Date(CH.done[c.id]).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}</small>`:`<div class="ch-bar"><i style="width:${w}%"></i></div><small class="ch-n">${p} / ${c.target}</small>`}
      ${c.reward?`<small class="ch-rw">Reward: ${hEsc(chRewardText(c.reward))}</small>`:''}</div></div>`;};
  return `<div class="hs-head"><h2>Challenges</h2><p class="note">Milestones for your club. Every Solo, Versus and Online match counts, and so do the Album and Training.</p></div>
    <div class="ch-sum"><b>${done.length} / ${L.length}</b><div class="ch-bar tot"><i style="width:${pct}%"></i></div><span>${pct}%</span></div>${chips}
    <div class="ch-list">${order.map(row).join('')||'<p class="note">No challenges yet.</p>'}</div>`;}

/* ================= data file, Distal, tests ================= */
function applyChallengesData(o){CHAL=cleanChallenges(o);chCheck(true);chDot();if(hubTab==='squad'&&clubSec==='chal')renderChallenges();try{renderCustom();renderLook();}catch(e){}}
onDataFile('challenges',applyChallengesData);
// what Distal's Challenges editor needs from the game (link.js D.chalMeta)
function chalMeta(){const C=o=>JSON.parse(JSON.stringify(o)),RT=chRewardTypes(),items={};
  Object.keys(RT).forEach(t=>{if(t==='card')items[t]=typeof CARDS!=='undefined'?CARDS.cards.map(c=>({id:c.id,name:c.title})):[];else if(!CH_REWARDS[t])items[t]=typeof unlockItems==='function'?unlockItems(t):[];});
  const metrics={};Object.entries(CH_METRICS).forEach(([k,m])=>metrics[k]={name:m.name,kind:m.kind,param:m.param?C(m.param):null});
  return{defaults:C(cleanChallenges(CHAL_DEF)),current:C(CHAL),groups:C(CH_GROUPS),modes:C(CH_MODES),metrics,rewards:RT,items,
    live:['hobby','pack','card',...(typeof CARD_PARTS!=='undefined'?CARD_PARTS:[]),...(typeof CARD_FREE!=='undefined'?CARD_FREE:[])],
    drills:typeof TRAIN!=='undefined'?TRAIN.map(t=>({id:t.id,name:t.name})):[],
    progress:CHAL.challenges.map(c=>[c.id,chProgress(c),chDone(c)]),
    cardItems:typeof CARDS!=='undefined'?CARDS.cards.filter(c=>c.unlock&&c.unlock.id).map(c=>({type:c.unlock.type,id:c.unlock.id,card:c.title})):[]};}
function chalAdmin(cmd,id){
  if(cmd==='reset'){Object.assign(CH,{prog:{},done:{},paid:{},fresh:{},items:{}});CH.s={packs:0,hobby:0,ws:0,wsBest:0,ub:0,ubBest:0,beaten:[]};saveCh();chCheck(true);}
  else if(cmd==='done'){(id?[chById(id)].filter(Boolean):chList()).forEach(c=>{if(!chDone(c)){CH.done[c.id]=Date.now();CH.fresh[c.id]=1;}});saveCh();chCheck();}
  else if(cmd==='undo'&&id){delete CH.done[id];delete CH.paid[id];delete CH.fresh[id];delete CH.prog[id];saveCh();}
  if(hubTab==='squad'&&clubSec==='chal')renderChallenges();try{renderCustom();renderLook();}catch(e){}}
{const box=document.createElement('div');box.className='cardbox';box.style.marginTop='12px';
  box.innerHTML='<p class="h">Challenges (this browser)</p><div class="seg"><button class="chip" type="button" data-ch="done">Complete all</button><button class="chip" type="button" data-ch="reset">Reset challenges</button></div><p class="note" style="margin-top:8px">For testing. The list follows data/challenges.json (Distal &gt; Balancing &gt; Challenges).</p>';
  box.querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>{chalAdmin(b.dataset.ch);hobbyToast(b.dataset.ch==='reset'?'Challenges reset (counts from your history stay).':'Every challenge done.',true);});
  const ed=$('#bal-edit');if(ed)ed.appendChild(box);}
chCheck(true);chDot();
