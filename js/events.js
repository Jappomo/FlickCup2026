// Flick Cup 2026 · js/events.js
// Game events made in Distal's Events tab (Blueprint-style graphs), saved in data/events.json:
//   {version:1, graphs:{id:{name, on, nodes:{id:{type, x, y, ...settings}}, edges:[[from, port, to, port]]}}}
// White wires are the flow: an Event node (Goal, Full time, Kick-off ...) runs the nodes wired after it: Branch,
// Delay, Once per match, Random, then Actions (banner, toast, sound, light preset, camera, effect, Hobby, pack, flag).
// Yellow wires are conditions (score, minute, mode, which team, flag, stars of the opponent) combined with AND/OR/NOT.
// The game fires the events by wrapping its own functions (newMatch, kickoff, scoreGoal, endHalf, showFT, banner,
// activateMoment, openPack, chPay, setTab, tickClock); nothing here changes the rules.
// Loaded by index.html after challenges.js, as a classic script: every file shares one scope.
'use strict';
const EVT={data:{version:1,graphs:{}},flags:{},once:{},match:0,timers:[],last:null,log:[],secs:{}};
try{EVT.flags=JSON.parse(store.get('baize.eventFlags')||'{}')||{};}catch(e){EVT.flags={};}
const EV_TYPES={
  matchStart:{name:'Match starts'},kickoff:{name:'Kick-off'},goal:{name:'Goal'},halfTime:{name:'Half time'},fullTime:{name:'Full time'},
  foul:{name:'Foul'},save:{name:'Keeper save'},intercept:{name:'Interception'},moment:{name:'Moment used'},everySeconds:{name:'Every few seconds (match)'},
  challengeDone:{name:'Challenge done'},packOpened:{name:'Pack opened'},menuTab:{name:'Menu tab opened'}};
function cleanEvents(o){const out={version:1,graphs:{}};if(!o||typeof o!=='object'||!o.graphs||typeof o.graphs!=='object')return out;
  Object.entries(o.graphs).forEach(([id,g])=>{if(!g||typeof g!=='object'||!g.nodes||typeof g.nodes!=='object')return;
    out.graphs[id]={name:String(g.name||id).slice(0,60),on:g.on!==false,nodes:g.nodes,edges:Array.isArray(g.edges)?g.edges.filter(e=>Array.isArray(e)&&e.length===4):[]};});
  return out;}
function evMine(team){const m=typeof myLogTeam==='function'?myLogTeam():-1;return m<0?team===0:team===m;}
// a condition node's value (yellow wires)
function evBool(g,id,ctx,depth){const n=g.nodes[id];if(!n||depth>40)return false;
  const ins=g.edges.filter(e=>e[2]===id).sort((a,b)=>String(a[3]).localeCompare(String(b[3]))).map(e=>evBool(g,e[0],ctx,depth+1));
  const cmp=(a,op,b)=>op==='>'?a>b:op==='<'?a<b:op==='<='?a<=b:op==='=='?a===b:op==='!='?a!==b:a>=b;
  const me=typeof myLogTeam==='function'&&myLogTeam()>=0?myLogTeam():0,sc=(S&&S.score)||[0,0];
  switch(n.type){
    case 'and':return ins.length>0&&ins.every(Boolean);case 'or':return ins.some(Boolean);case 'not':return !ins[0];
    case 'xor':return ins.filter(Boolean).length%2===1;case 'nand':return !(ins.length>0&&ins.every(Boolean));case 'nor':return !ins.some(Boolean);
    case 'score':{const v=n.what==='mine'?sc[me]:n.what==='theirs'?sc[1-me]:n.what==='total'?sc[0]+sc[1]:sc[me]-sc[1-me];return cmp(v,n.cmp||'>=',+n.value||0);}
    case 'minute':{const total=S.halfLen||300,left=S.clock||0,played=(S.half===2?total:0)+total-left;return cmp(Math.floor(played/60),n.cmp||'>=',+n.value||0);}
    case 'half':return (S.half||1)===(+n.value||1)||(n.value==='golden'&&!!S.golden);
    case 'mode':return (n.value==='tournament'?!!(typeof T!=='undefined'&&T&&T.on):S.mode===n.value);
    case 'team':return ctx.team==null?false:n.value==='mine'?evMine(ctx.team):n.value==='theirs'?!evMine(ctx.team):ctx.team===(+n.value||0);
    case 'ownGoal':return !!ctx.own;
    case 'result':{const r=sc[me]>sc[1-me]?'win':sc[me]<sc[1-me]?'loss':'draw';return r===n.value;}
    case 'stars':{let st=0;try{st=typeof koOpp!=='undefined'&&koOpp?koOpp.stars:(typeof cpuClub!=='undefined'&&cpuClub?cpuClub.stars:0);}catch(e){}return cmp(st,n.cmp||'>=',+n.value||1);}
    case 'flag':return n.value==null||n.value===''?EVT.flags[n.flag]!=null:String(EVT.flags[n.flag])===String(n.value);
    case 'chance':return Math.random()*100<(+n.value||50);
    default:return false;}}
// run the flow after a node's output port
function evRun(g,gid,id,port,ctx,steps){
  if(steps.n++>200)return;
  g.edges.filter(e=>e[0]===id&&e[1]===port).forEach(e=>{const to=e[2],n=g.nodes[to];if(!n)return;steps.trail.push(to);
    switch(n.type){
      case 'branch':{const c=g.edges.find(x=>x[2]===to&&x[3]==='cond');evRun(g,gid,to,c&&evBool(g,c[0],ctx,0)?'true':'false',ctx,steps);break;}
      case 'delay':{const ms=Math.max(0,+n.value||1)*1000,m=EVT.match;EVT.timers.push(setTimeout(()=>{if(n.match!==false&&m!==EVT.match)return;evRun(g,gid,to,'out',ctx,{n:0,trail:[]});},ms));break;}
      case 'once':{const k=gid+'/'+to;if(EVT.once[k]===EVT.match)break;EVT.once[k]=EVT.match;evRun(g,gid,to,'out',ctx,steps);break;}
      case 'random':{evRun(g,gid,to,Math.random()*100<(+n.value||50)?'true':'false',ctx,steps);break;}
      case 'action':(n.ops||[]).forEach(op=>{try{evDo(op,ctx);}catch(err){console.warn('[events]',op.op,err);}});evRun(g,gid,to,'out',ctx,steps);break;
      default:break;}});}
function evFill(t,ctx){return String(t||'').replace(/\{(\w+)\}/g,(m,k)=>{const me=typeof myLogTeam==='function'&&myLogTeam()>=0?myLogTeam():0,sc=(S&&S.score)||[0,0];
  return k==='score'?sc[0]+'-'+sc[1]:k==='mine'?sc[me]:k==='theirs'?sc[1-me]:k==='team'?(ctx.team!=null&&typeof AB==='function'?AB(ctx.team):''):k==='flag'?'':m;});}
function evDo(op,ctx){
  switch(op.op){
    case 'banner':banner(evFill(op.text,ctx),evFill(op.sub,ctx),{c:op.color||undefined});break;
    case 'toast':if(typeof hobbyToast==='function')hobbyToast(evFill(op.text,ctx));else banner(evFill(op.text,ctx),'');break;
    case 'sound':if(typeof sfx==='function')sfx(op.value||'whistle',+op.volume||40);break;
    case 'preset':if(typeof useLightPreset==='function')useLightPreset(op.value||'');break;
    case 'camera':if(typeof cam!=='undefined'){cam.mode=+op.value||0;try{updateCamera(0,true);}catch(e){}}break;
    case 'vfx':if(typeof vfxPlay==='function'&&typeof VFX!=='undefined'){const e=VFX.byId[op.value]||VFX.list[0];const b=bodies&&bodies[20];if(e&&b)vfxPlay(e,b.x,0,b.z,+op.scale||1.5);}break;
    case 'hobby':if(typeof earn==='function')earn(+op.value||0,'event');break;
    case 'pack':if(typeof addPack==='function')addPack(Math.max(1,+op.value||1));break;
    case 'flag':EVT.flags[op.flag||'flag']=op.value==null||op.value===''?1:op.value;try{store.set('baize.eventFlags',JSON.stringify(EVT.flags));}catch(e){}break;
    case 'clearFlag':delete EVT.flags[op.flag||'flag'];try{store.set('baize.eventFlags',JSON.stringify(EVT.flags));}catch(e){}break;
    default:break;}}
// an event happened: every graph that is on runs its matching Event nodes
function eventsFire(type,ctx,test){ctx=ctx||{};let ran=0;const trails={};
  Object.entries(EVT.data.graphs||{}).forEach(([gid,g])=>{if(!g.on&&!test)return;
    Object.entries(g.nodes).forEach(([id,n])=>{if(n.type!=='event'||n.event!==type)return;
      if(type==='goal'&&n.who&&n.who!=='any'&&!(n.who==='mine'?evMine(ctx.team):n.who==='theirs'?!evMine(ctx.team):true))return;
      if(type==='menuTab'&&n.tab&&n.tab!==ctx.tab)return;
      if(type==='everySeconds'&&ctx.every!==id)return;
      const steps={n:0,trail:[id]};evRun(g,gid,id,'out',ctx,steps);ran++;(trails[gid]=trails[gid]||[]).push(...steps.trail);});});
  EVT.last={type,ctx:{team:ctx.team,own:ctx.own,tab:ctx.tab},ran,trails,t:Date.now()};EVT.log.unshift(EVT.last);EVT.log.length=Math.min(EVT.log.length,30);
  return EVT.last;}
function eventsMeta(){return {types:JSON.parse(JSON.stringify(EV_TYPES)),presets:typeof lightPresets==='function'?lightPresets():[],vfx:typeof VFX!=='undefined'?VFX.list.map(v=>({id:v.id,name:v.name||v.id})):[],
  sounds:['whistle','goal','net','moment','flick','clack','tock'],tabs:typeof TABS!=='undefined'?TABS.slice():['play','squad','custom','album','settings'],flags:Object.assign({},EVT.flags),log:EVT.log.slice(0,10),current:JSON.parse(JSON.stringify(EVT.data))};}
onDataFile('events',o=>{EVT.data=cleanEvents(o);});
// ---------- the game's own moments, wrapped ----------
{const W=(name,f)=>{try{const base=eval(name);if(typeof base!=='function')return;eval(name+'=f(base)');}catch(e){console.warn('[events] hook',name,e);}};
  W('newMatch',base=>function(o){const r=base.apply(this,arguments);EVT.match++;EVT.timers.splice(0).forEach(clearTimeout);EVT.secs={};try{eventsFire('matchStart',{});}catch(e){}return r;});
  W('kickoff',base=>function(team){const r=base.apply(this,arguments);try{if(S.running)eventsFire('kickoff',{team});}catch(e){}return r;});
  W('scoreGoal',base=>function(team,own){const r=base.apply(this,arguments);try{eventsFire('goal',{team,own:!!own});}catch(e){}return r;});
  W('endHalf',base=>function(){const r=base.apply(this,arguments);try{eventsFire('halfTime',{});}catch(e){}return r;});
  W('showFT',base=>function(){const r=base.apply(this,arguments);try{eventsFire('fullTime',{});}catch(e){}return r;});
  W('activateMoment',base=>function(team){const r=base.apply(this,arguments);try{eventsFire('moment',{team});}catch(e){}return r;});
  W('openPack',base=>function(){const r=base.apply(this,arguments);try{eventsFire('packOpened',{});}catch(e){}return r;});
  W('chPay',base=>function(c){const r=base.apply(this,arguments);try{eventsFire('challengeDone',{id:c&&c.id});}catch(e){}return r;});
  W('setTab',base=>function(t){const was=typeof hubTab!=='undefined'?hubTab:'';const r=base.apply(this,arguments);try{if(t!==was)eventsFire('menuTab',{tab:t});}catch(e){}return r;});
  // the game's banners tell what happened (Foul, Saved, Intercepted) without touching the rules
  W('banner',base=>function(t,s,o){const r=base.apply(this,arguments);try{const x=String(t||'').toLowerCase();if(!EVT.inBanner){EVT.inBanner=1;
    if(/foul|penalty/.test(x))eventsFire('foul',{});else if(/save/.test(x))eventsFire('save',{});else if(/intercept/.test(x))eventsFire('intercept',{});EVT.inBanner=0;}}catch(e){EVT.inBanner=0;}return r;});
  W('tickClock',base=>function(dt){const r=base.apply(this,arguments);try{if(S.running&&!S.paused&&$('#hub').hidden)Object.values(EVT.data.graphs).forEach(g=>{if(!g.on)return;Object.entries(g.nodes).forEach(([id,n])=>{if(n.type!=='event'||n.event!=='everySeconds')return;
    EVT.secs[id]=(EVT.secs[id]||0)+dt;const every=Math.max(1,+n.every||30);if(EVT.secs[id]>=every){EVT.secs[id]-=every;eventsFire('everySeconds',{every:id});}});});}catch(e){}return r;});}
