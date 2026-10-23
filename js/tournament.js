// Flick Cup 2026 · js/tournament.js
// Online tournaments: draw, schedule, results, UI.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= tournament (online) =================
   The organiser's browser runs the tournament: it keeps the settings, the teams and the bracket in its lobby presence,
   sends each pairing to its own match room (<code>m<round><match>), collects results and moves winners on.
   CPU teams fill empty places: human v CPU is played on the human's screen, CPU v CPU is simulated. */
const T={lobby:null,code:'',uid:(()=>{let u='';try{u=sessionStorage.getItem('baize.uid')||'';}catch(e){}if(!u){u=Math.random().toString(36).slice(2,10);try{sessionStorage.setItem('baize.uid',u);}catch(e){}}return u;})(),
  host:false,t0:0,state:null,unsubs:[],roomType:'match',set:{size:8,min:5,moments:true,simul:true,ball:'',fin:''},busy:false,
  rdy:'',playing:'',selM:''};   // rdy: the match I pressed Ready for; playing: the match whose room I went to; selM: picked in the bracket
const CPU_NAMES=['Rovers','Athletic','Wanderers','Albion','Rangers','Harriers','Dynamo','Rapid','Sporting','Olympic','Town','Villa','Corinthians','Spartans','Orient'];
const ROUND_NAMES={2:['Final'],4:['Semi-finals','Final'],8:['Quarter-finals','Semi-finals','Final'],16:['Round of 16','Quarter-finals','Semi-finals','Final']};
const tEl=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;};
function tourMembers(){if(!T.lobby)return[];return T.lobby.peers().filter(p=>p.presence&&p.presence.uid).map(p=>p.presence).sort((a,b)=>(a.t0||0)-(b.t0||0)||String(a.uid).localeCompare(String(b.uid)));}
function tourHostPres(){return tourMembers().filter(p=>p.host).sort((a,b)=>(a.t0||0)-(b.t0||0))[0]||null;}
function tourState(){if(T.host)return T.state;const h=tourHostPres();return h&&h.tour?h.tour:null;}
function myTeamIdx(st){st=st||tourState();return st&&st.teams?st.teams.findIndex(t=>t.id===T.uid):-1;}
function tourSave(){if(T.host&&T.state)store.set('baize.tour.'+T.code,JSON.stringify(T.state));}
function tourPublish(){if(!T.lobby)return;const me={uid:T.uid,t0:T.t0,name:(mySquads[0].name||KITS[kitSel[0]].name),kit:kitSel[0],host:T.host,rdy:T.rdy};
  if(T.host){T.state.set=Object.assign({},T.set);me.tour=T.state;tourSave();}
  T.lobby.presence(me).catch(()=>{});renderTour();}

async function tourJoin(code,create){
  code=(code||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,6);
  if(code.length<3){tourStatus('Tournament codes are 3 to 6 letters or digits.');return;}
  if(!net.room){tourStatus('Online play is not available in this view.');return;}
  await tourLeave(true);
  tourStatus((create?'Creating':'Joining')+' tournament '+code.toUpperCase()+'…');
  let r;try{r=await net.room.join('baizet-'+code);}catch(e){tourStatus('Could not open that tournament ('+((e&&e.code)||'error')+'). Try again.');return;}
  T.lobby=r;T.code=code;T.t0=Date.now();T.host=!!create;$('#tour-code').value=code.toUpperCase();
  if(T.host){let saved=null;try{saved=JSON.parse(store.get('baize.tour.'+code)||'null');}catch(e){}
    T.state=saved&&saved.host===T.uid?saved:{v:1,host:T.uid,phase:'lobby',set:Object.assign({},T.set),teams:null,rounds:null,champ:null};
    if(T.state.set)T.set=Object.assign({},T.set,T.state.set);}
  T.sig='';
  T.unsubs.push(r.onPeers(()=>{tourCheckHost();const sig=tourMembers().filter(p=>p.uid!==T.uid).map(p=>p.uid+':'+p.name+':'+p.kit).join('|');
    if(T.host&&T.state&&T.state.phase==='lobby'&&sig!==T.sig){T.sig=sig;tourPublish();}else renderTour();}));
  T.unsubs.push(r.on('tres',m=>{if(T.host&&m&&m.data)tourResult(m.data.mid,m.data.sa,m.data.sb);}));
  tourPublish();
  setTimeout(()=>{tourCheckHost();renderTour();},1500);
}
// two organisers on one code: the earlier one keeps it
function tourCheckHost(){if(!T.host||!T.lobby)return;const h=tourHostPres();if(h&&h.uid!==T.uid&&(h.t0||0)<T.t0){T.host=false;T.state=null;tourStatus('That code already has an organiser. You joined as a team.');tourPublish();}}
async function tourLeave(quiet){
  T.unsubs.forEach(u=>{try{u();}catch(e){}});T.unsubs=[];
  if(T.lobby){const r=T.lobby;T.lobby=null;try{await r.leave();}catch(e){}}
  T.host=false;T.state=null;T.code='';T.rdy='';T.playing='';T.selM='';if(!quiet)tourStatus('Left the tournament.');renderTour();
}
function tourStatus(t){const e=$('#tour-status');if(e)e.textContent=t;}

/* ---- organiser: draw, schedule, results ---- */
function tourStart(){
  if(!T.host||T.state.phase!=='lobby')return;
  const size=T.set.size,hum=tourMembers().slice(0,size).map(p=>({id:p.uid,name:String(p.name||'Team').slice(0,16),kit:+p.kit||0,cpu:false}));
  const cpuN=CPU_NAMES.slice().sort(()=>Math.random()-0.5);
  while(hum.length<size){const i=hum.length;hum.push({id:'cpu'+i,name:cpuN[i%cpuN.length],kit:(i*2+3)%KITS.length,cpu:true});}
  for(let i=hum.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[hum[i],hum[j]]=[hum[j],hum[i]];}
  const rounds=[];let n=size/2;for(let r=0;n>=1;r++,n/=2){const ms=[];for(let k=0;k<n;k++)ms.push({id:'r'+r+'m'+k,a:r===0?2*k:null,b:r===0?2*k+1:null,sa:null,sb:null,w:null,st:'wait'});rounds.push(ms);}
  Object.assign(T.state,{phase:'run',teams:hum,rounds,champ:null,set:Object.assign({},T.set)});
  tourSchedule();tourPublish();
}
function tourFind(mid,st){st=st||tourState();if(!st||!st.rounds)return null;for(const R of st.rounds)for(const m of R)if(m.id===mid)return m;return null;}
function tourSchedule(){
  const st=T.state;let changed=true;
  while(changed){changed=false;
    st.rounds.forEach((R,r)=>R.forEach((m,k)=>{
      if(m.st==='done'&&r+1<st.rounds.length){const nx=st.rounds[r+1][k>>1];const slot=k%2?'b':'a';if(nx[slot]==null){nx[slot]=m.w;changed=true;}}
      if(m.st==='wait'&&m.a!=null&&m.b!=null&&st.teams[m.a].cpu&&st.teams[m.b].cpu){let x=Math.floor(Math.random()*4),y=Math.floor(Math.random()*4);if(x===y){if(Math.random()<0.5)x++;else y++;}
        Object.assign(m,{sa:x,sb:y,w:x>y?m.a:m.b,st:'done'});changed=true;}
    }));
  }
  const all=st.rounds.flat(),live=all.filter(m=>m.st==='live').length;
  for(const m of all){if(m.st!=='wait'||m.a==null||m.b==null)continue;if(!st.set.simul&&(live>0||all.some(x=>x.st==='live')))break;m.st='live';if(!st.set.simul)break;}
  const fin=st.rounds[st.rounds.length-1][0];if(fin.st==='done'){st.phase='done';st.champ=fin.w;}
}
function tourResult(mid,sa,sb){
  if(!T.host||!T.state||T.state.phase!=='run')return;const m=tourFind(mid,T.state);if(!m||m.st!=='live')return;
  sa=Math.max(0,Math.round(+sa)||0);sb=Math.max(0,Math.round(+sb)||0);if(sa===sb)return;
  Object.assign(m,{sa,sb,w:sa>sb?m.a:m.b,st:'done'});tourSchedule();tourPublish();
}
function tourReport(mid,sa,sb){if(T.host)tourResult(mid,sa,sb);else if(T.lobby)T.lobby.emit('tres',{mid,sa,sb}).catch(()=>{});}

/* ---- playing a tournament match ---- */
function tourMyLiveMatch(){const st=tourState(),i=myTeamIdx(st);if(i<0||!st.rounds)return null;return st.rounds.flat().find(m=>m.st==='live'&&(m.a===i||m.b===i))||null;}
function tourIsFinal(st,m){return st.rounds[st.rounds.length-1][0].id===m.id;}
function tourMatchOpts(st,m){const set=st.set||{};return{ball:set.ball||'',look:tourIsFinal(st,m)&&set.fin?lookStr(Object.assign({},LOOKSEL,{table:set.fin})):''};}
function tourPlay(){
  const st=tourState(),m=tourMyLiveMatch();if(!st||!m)return;const i=myTeamIdx(st),A=st.teams[m.a],B=st.teams[m.b],opp=i===m.a?B:A;
  const set=st.set||T.set;
  if(opp.cpu){ // on this screen, me v the computer (you are always the left team here)
    if(S.mode==='online'&&net.named)leaveRoom(true);
    const cs=defaultSquad(1);cs.name=opp.name;
    S.mode='cpu';matchSquads=[mySquads[0],cs];const myKit=(i===m.a?A:B).kit;S.kits=[myKit,opp.kit!==myKit?opp.kit:(myKit+1)%KITS.length];applyKits();
    S.halfLen=set.min*60;S.tour={mid:m.id,iAmA:i===m.a,code:T.code,reported:false};S.tg=true;S.noMoments=!set.moments;
    cam.mode=-1;closeMenu();newMatch(tourMatchOpts(st,m));return;
  }
  // a human opponent: both join the match room; the A team is always home
  net.tourMatch={mid:m.id,home:A.id,away:B.id,kits:[A.kit,B.kit!==A.kit?B.kit:(A.kit+1)%KITS.length],min:set.min,moments:set.moments,opts:tourMatchOpts(st,m),started:false};
  S.tour={mid:m.id,iAmA:true,code:T.code,reported:false};
  joinRoom(T.code+'m'+m.id.replace(/[^0-9]/g,''),{raw:true});
}
function tourWatch(mid){const st=tourState(),m=tourFind(mid,st);if(!m)return;
  net.tourMatch={mid,home:st.teams[m.a].id,away:st.teams[m.b].id,watch:true};S.tour=null;
  joinRoom(T.code+'m'+mid.replace(/[^0-9]/g,''),{raw:true});}
function tourAutoStart(){
  const tm=net.tourMatch;if(!tm||tm.watch||tm.started||net.myTeam!==0||!oppPeer()||S.running)return;
  tm.started=true;tourStatus('Opponent is here. Kick-off in a moment…');
  setTimeout(()=>{const opp=oppPeer();if(!opp||!net.named){tm.started=false;return;}
    S.mode='online';MBAL=BAL;matchSquads=[mySquads[0],parseSquad(opp.presence.sq,1)];S.kits=tm.kits.slice();applyKits();
    S.halfLen=tm.min*60;S.tg=true;S.noMoments=!tm.moments;cam.mode=-1;closeMenu();newMatch(tm.opts);},1500);
}
// at full-time: send the score to the organiser (A team first)
function tourMatchOver(){
  const t=S.tour;if(!t||t.reported)return;t.reported=true;
  let sa=S.score[0],sb=S.score[1];if(S.mode==='cpu'&&!t.iAmA){sa=S.score[1];sb=S.score[0];}
  if(S.mode==='online'&&net.myTeam==null)return;
  tourReport(t.mid,sa,sb);
}
function tourBack(){$('#ft').hidden=true;S.running=false;S.phase='idle';S.tour=null;S.tg=false;S.noMoments=false;S.golden=false;
  if(net.named&&net.tourMatch)leaveRoom(true);net.tourMatch=null;T.rdy='';T.playing='';tourPublish();openMenu();setMenuMode('online');onlineOpen('tour');}
/* ---- Ready and concede (agreed 24 Oct 2026) ----
   After the draw each player presses Ready for their next match. Against a CPU team the match starts at once; against a
   player the match room opens when both are ready (the room itself works as before). Holding the small button next to
   Ready concedes the match (3-0 to the other side). */
function tourOppOf(st,m){const i=myTeamIdx(st);return st.teams[i===m.a?m.b:m.a];}
function tourReady(){const st=tourState(),m=tourMyLiveMatch();if(!st||!m)return;const o=tourOppOf(st,m);
  if(o.cpu){T.playing=m.id;tourPlay();return;}
  T.rdy=T.rdy===m.id?'':m.id;tourPublish();}
function tourBothReady(){const st=tourState(),m=st&&st.rounds&&tourMyLiveMatch();if(!m||T.rdy!==m.id||T.playing===m.id||(S.running&&S.tour))return;
  const o=tourOppOf(st,m),op=tourMembers().find(p=>p.uid===o.id);if(op&&op.rdy===m.id){T.playing=m.id;tourStatus('Both ready. Opening your match room…');tourPlay();}}
function tourConcede(){const st=tourState(),m=tourMyLiveMatch();if(!st||!m)return;const a=myTeamIdx(st)===m.a;
  T.rdy='';T.playing='';tourReport(m.id,a?0:3,a?3:0);tourPublish();sfx('clack',10);}

/* ---- UI ---- */
function setRoomType(rt){T.roomType=rt;document.querySelectorAll('#room-type .chip').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.rt===rt)));
  $('#rt-match').hidden=rt!=='match';$('#rt-tour').hidden=rt!=='tour';updateStartBtn();renderTour();if(typeof onlineRender==='function')onlineRender();
  const br=$('#tour-bracket');if(rt==='tour'&&br&&br.dataset.size)requestAnimationFrame(()=>tourLines(br,Math.round(Math.log2(+br.dataset.size))));}
function segRow(label,opts,cur,on,locked){const row=tEl('div','tset-row');row.appendChild(tEl('span','tset-l',label));const seg=tEl('div','seg');
  opts.forEach(([v,t])=>{const b=tEl('button','chip',t);b.type='button';b.setAttribute('aria-pressed',String(v===cur));b.disabled=locked&&v!==cur;if(!locked)b.onclick=()=>on(v);seg.appendChild(b);});row.appendChild(seg);return row;}
function selRow(label,opts,cur,on,locked){const row=tEl('div','tset-row');row.appendChild(tEl('span','tset-l',label));const s=tEl('select','tsel');s.disabled=locked;
  opts.forEach(([v,t])=>{const o=tEl('option',null,t);o.value=v;if(v===cur)o.selected=true;s.appendChild(o);});s.onchange=()=>on(s.value);row.appendChild(s);return row;}
function renderTour(){
  const body=$('#tour-body');if(!body)return;
  const inT=!!T.lobby,st=tourState(),run=!!(st&&st.rounds);
  body.hidden=!inT;$('#tour-leave').hidden=!inT;$('#tour-create').hidden=inT;$('#tour-join').hidden=inT;
  const set=(st&&st.set)||T.set,editable=T.host&&st&&st.phase==='lobby',mi=run?myTeamIdx(st):-1;
  // before the draw: rules and teams; after it: your squad (quick edit) for your next match
  $('#tour-set').hidden=run;document.querySelector('.tour-teams').hidden=run;$('#tour-mine').hidden=!(run&&mi>=0);
  if(inT&&!run){
    const box=$('#tour-set');box.innerHTML='';box.appendChild(tEl('p','h','Rules'));const grid=tEl('div','tset-grid');box.appendChild(grid);
    const upd=(k,v)=>{T.set[k]=v;tourPublish();};
    grid.appendChild(segRow('Teams',[[4,'4'],[8,'8'],[16,'16']],set.size,v=>upd('size',v),!editable));
    grid.appendChild(segRow('Moments',[[true,'On'],[false,'Off']],set.moments,v=>upd('moments',v),!editable));
    grid.appendChild(segRow('Half length',[[3,'3 min'],[5,'5 min'],[8,'8 min']],set.min,v=>upd('min',v),!editable));
    grid.appendChild(segRow('Simultaneous',[[true,'On'],[false,'Off']],set.simul,v=>upd('simul',v),!editable));
    grid.appendChild(selRow('Ball',[['',"Home team's ball"]].concat(BALL.variants.map(v=>[v.id,v.name])),set.ball||'',v=>upd('ball',v),!editable));
    grid.appendChild(selRow('Final stadium',[['',"Home team's table"]].concat(LOOK.table.map(v=>[v.id,v.name])),set.fin||'',v=>upd('fin',v),!editable));
    if(!st)box.appendChild(tEl('p','note','Waiting for the organiser…'));
    const tl=$('#tour-teams');tl.innerHTML='';
    const ms=tourMembers().slice(0,set.size),teams=ms.map(p=>({id:p.uid,name:p.name,kit:+p.kit||0,cpu:false,host:p.host}));while(teams.length<set.size)teams.push({cpu:true,name:'CPU',kit:-1,id:'cpu?'+teams.length});
    const humans=teams.filter(t=>!t.cpu).length;$('#tour-count').textContent=`${humans} player${humans===1?'':'s'} · ${teams.length-humans} CPU`;
    teams.forEach(t=>{const row=tEl('div','tteam'+(t.cpu?' cpu':'')+(t.id===T.uid?' me':''));const sw=tEl('i','tkit');sw.style.background=t.kit>=0?KITS[t.kit].ui:'transparent';row.appendChild(sw);
      row.appendChild(tEl('b',null,t.cpu?'CPU (fills in)':t.name));if(t.id===T.uid)row.appendChild(tEl('small',null,'You'));else if(t.host)row.appendChild(tEl('small',null,'Organiser'));tl.appendChild(row);});
  }
  if(run&&mi>=0)tourMineRender(st);
  tourBracketRender(st,set);
  // the buttons along the bottom of the Online screen
  const tourOn=T.roomType==='tour',my=run?tourMyLiveMatch():null,inMatch=S.running&&!!S.tour;
  if(T.rdy&&(!my||T.rdy!==my.id)){T.rdy='';tourPublish();return;}
  $('#tour-start').hidden=!(tourOn&&T.host&&st&&st.phase==='lobby');
  const pb=$('#tour-play'),cb=$('#tour-concede');pb.hidden=cb.hidden=!(tourOn&&my&&!inMatch);
  let note='';
  if(my&&!inMatch){const o=tourOppOf(st,my),op=o.cpu?null:tourMembers().find(p=>p.uid===o.id),oR=!!(op&&op.rdy===my.id);
    $('#tour-play-lbl').textContent=o.cpu?'Play '+o.name:T.rdy===my.id?'Not ready':'Ready';pb.classList.toggle('alt',T.rdy===my.id);pb.classList.toggle('go',T.rdy!==my.id);
    note=o.cpu?`Your match: ${o.name} (CPU). It starts when you press Play.`:T.rdy===my.id?(oR?'Both ready. Opening your match room…':`You are ready. Waiting for ${o.name}.`):`Your match: ${o.name}${oR?' (ready)':''}. Press Ready when you are set.`;}
  if(tourOn)$('#on-note').textContent=note;
  const c=T.code.toUpperCase();
  if(!inT){}
  else if(!st)tourStatus(`Tournament ${c}: waiting for the organiser.`);
  else if(st.phase==='lobby')tourStatus(T.host?`Tournament ${c}: share the code. Empty places are filled with CPU teams when you start.`:`Tournament ${c}: you're in. Waiting for the organiser to start.`);
  else if(st.phase==='done')tourStatus(`Tournament ${c} is over. ${st.teams[st.champ].name} win the Flick Cup 2026!`);
  else if(my)tourStatus(`Tournament ${c}: your match is ready.`);
  else if(mi<0)tourStatus(`Tournament ${c} is under way. You are watching.`);
  else{const alive=st.rounds.flat().some(m=>m.st!=='done'&&(m.a===mi||m.b===mi||m.a==null||m.b==null));tourStatus(alive?`Tournament ${c}: waiting for your next match…`:`Tournament ${c}: you are out. Stay to watch the rest.`);}
  updateStartBtn();
  tourBothReady();
}
// your squad between matches: formation, path and Moment (they travel with you into the next match)
function tourMineRender(st){
  const box=$('#tour-mine'),q=mySquads[0];
  if(!box.dataset.built){box.dataset.built='1';box.innerHTML='<p class="h">Your squad</p><p class="tm-next" id="tm-next"></p><span class="tset-l">Formation</span><div class="seg" id="tm-form"></div><span class="tset-l">Path</span><div class="seg" id="tm-path"></div><span class="tset-l">Moment</span><div class="seg" id="tm-mom"></div><p class="note" id="tm-desc"></p>';}
  const my=tourMyLiveMatch();$('#tm-next').textContent=my?'Next: '+tourOppOf(st,my).name:'Waiting for your next opponent';
  const done=()=>{fitSpecial(q);saveSquads();tourMineRender(st);};
  uiList($('#tm-form'),Object.keys(FORMATIONS).concat(q.form==='custom'?['custom']:[]),f=>f,f=>{const b=tEl('button','chip',f==='custom'?'Custom':f);b.type='button';b.onclick=()=>{q.form=f;done();};return b;},(b,f)=>setAttr(b,'aria-pressed',q.form===f));
  uiList($('#tm-path'),PATH_KEYS,p=>p,p=>{const b=tEl('button','chip',PATHS[p].name);b.type='button';b.onclick=()=>{q.path=p;done();};return b;},(b,p)=>setAttr(b,'aria-pressed',q.path===p));
  const open=BAL.unlock[q.path]||[];
  uiList($('#tm-mom'),open,m=>m,m=>{const b=tEl('button','chip',SPECIALS[m].name);b.type='button';b.onclick=()=>{q.special=m;done();};return b;},(b,m)=>{setAttr(b,'aria-pressed',q.special===m);b.title=SPECIALS[m].desc;});
  const sd=SPECIALS[q.special];$('#tm-desc').textContent=(PATHS[q.path]?PATHS[q.path].name+': '+bonusText(q.path)+' for every player. ':'')+(sd?sd.name+': '+sd.desc:'');
}
// the bracket: the two halves meet in the middle at the trophy; lines join each match to the next
function tourBracketRender(st,set){
  const br=$('#tour-bracket');if(!br)return;
  const size=st&&st.teams?st.teams.length:set.size,R=Math.round(Math.log2(size)),run=!!(st&&st.rounds),mi=run?myTeamIdx(st):-1;
  const half=(r,side)=>{const n=size>>(r+1),h=n/2;return Array.from({length:h},(_,j)=>side?h+j:j);};
  const box=(r,k)=>{const m=run?st.rounds[r][k]:null,cls=['bm'];if(m){cls.push('st-'+m.st);if(mi>=0&&(m.a===mi||m.b===mi))cls.push('mine');if(T.selM===m.id)cls.push('sel');}
    const row=s=>{const t=m&&m[s]!=null?st.teams[m[s]]:null,sc=m&&m[s==='a'?'sa':'sb'],win=m&&m.w!=null&&m.w===m[s];
      return `<span class="bt${win?' win':''}${m&&m.w!=null&&!win?' out':''}"><i style="background:${t?KITS[t.kit].ui:'transparent'}"></i><b>${t?koEsc(t.name):r===0?'Team':''}</b><em>${sc!=null?sc:''}</em></span>`;};
    return `<button type="button" class="${cls.join(' ')}" data-r="${r}" data-k="${k}"${m?` data-mid="${m.id}"`:''}>${row('a')}${row('b')}</button>`;};
  const names=ROUND_NAMES[size]||[];let cols='';
  for(let r=0;r<R-1;r++)cols+=`<div class="bc" style="grid-column:${r+1}">${half(r,0).map(k=>box(r,k)).join('')}</div>`;
  const champ=run&&st.phase==='done'?st.teams[st.champ]:null;
  cols+=`<div class="bc bfin" style="grid-column:${R}"><p class="h">${names[R-1]||'Final'}</p>${box(R-1,0)}<div class="btro"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M20 8h24v14a12 12 0 0 1-24 0z" fill="currentColor"/><path d="M20 12H10v4a10 10 0 0 0 10 10M44 12h10v4a10 10 0 0 1-10 10" fill="none" stroke="currentColor" stroke-width="3"/><path d="M29 34h6v8h-6zM22 44h20v6H22z" fill="currentColor"/></svg>${champ?`<b>${koEsc(champ.name)}</b><small>Champions</small>`:''}</div></div>`;
  for(let r=R-2;r>=0;r--)cols+=`<div class="bc" style="grid-column:${2*R-1-r}">${half(r,1).map(k=>box(r,k)).join('')}</div>`;
  const html=`<div class="bgrid" style="grid-template-columns:repeat(${2*R-1},minmax(0,1fr))">${cols}</div><svg class="blines" aria-hidden="true"></svg>`;
  if(br.dataset.h!==html){br.dataset.h=html;br.innerHTML=html;br.dataset.size=size;requestAnimationFrame(()=>tourLines(br,R));}
  // the match picked in the bracket: watch it, or (organiser) award it
  const bar=$('#tour-bar'),m=run&&T.selM?tourFind(T.selM,st):null;bar.hidden=!m;
  if(m){bar.innerHTML='';const A=m.a!=null?st.teams[m.a]:null,B=m.b!=null?st.teams[m.b]:null;
    bar.appendChild(tEl('b',null,(A?A.name:'…')+' v '+(B?B.name:'…')));bar.appendChild(tEl('small',null,m.st==='live'?'Live':m.st==='done'?'Full-time '+m.sa+'-'+m.sb:'Waiting'));
    const hum=A&&B&&!A.cpu&&!B.cpu;if(m.st==='live'&&hum&&m.a!==mi&&m.b!==mi){const w=tEl('button','chip','Watch');w.type='button';w.onclick=()=>tourWatch(m.id);bar.appendChild(w);}
    if(T.host&&m.st==='live'&&A&&B)[['a',A],['b',B]].forEach(([s,t])=>{const aw=tEl('button','chip','Award '+t.name.slice(0,10));aw.type='button';aw.title='Give this match to '+t.name+' (for no-shows)';aw.onclick=()=>s==='a'?tourResult(m.id,3,0):tourResult(m.id,0,3);bar.appendChild(aw);});}
}
function tourLines(br,R){
  const svg=br.querySelector('.blines');if(!svg||!br.offsetWidth)return;const rb=br.getBoundingClientRect(),z=rb.width/br.offsetWidth||1;
  const at=(r,k)=>{const e=br.querySelector(`.bm[data-r="${r}"][data-k="${k}"]`);if(!e)return null;const b=e.getBoundingClientRect();return{l:(b.left-rb.left)/z,r:(b.right-rb.left)/z,y:(b.top+b.height/2-rb.top)/z};};
  let d='';
  for(let r=0;r<R-1;r++){const n=Number(br.dataset.size)>>(r+1);for(let k=0;k<n;k++){const c=at(r,k),p=at(r+1,k>>1);if(!c||!p)continue;
    const left=c.r<=p.l+1,x1=left?c.r:c.l,x2=left?p.l:p.r,mx=(x1+x2)/2;d+=`M${x1.toFixed(1)} ${c.y.toFixed(1)}H${mx.toFixed(1)}V${p.y.toFixed(1)}H${x2.toFixed(1)}`;}}
  svg.setAttribute('viewBox',`0 0 ${br.offsetWidth} ${br.offsetHeight}`);svg.innerHTML=`<path d="${d}"/>`;}
document.querySelectorAll('#room-type .chip').forEach(b=>b.addEventListener('click',()=>setRoomType(b.dataset.rt)));
$('#tour-create').addEventListener('click',()=>{ensureAudio();let c=($('#tour-code').value||'').toLowerCase().replace(/[^a-z0-9]/g,'');if(c.length<3){const ch='abcdefghjkmnpqrstuvwxyz23456789';c='';for(let i=0;i<4;i++)c+=ch[Math.floor(Math.random()*ch.length)];}tourJoin(c,true);});
$('#tour-join').addEventListener('click',()=>{ensureAudio();tourJoin($('#tour-code').value,false);});
$('#tour-code').addEventListener('keydown',e=>{if(e.key==='Enter')tourJoin($('#tour-code').value,false);});
$('#tour-leave').addEventListener('click',()=>tourLeave(false));
$('#tour-start').addEventListener('click',()=>{ensureAudio();tourStart();});
$('#tour-play').addEventListener('click',()=>{ensureAudio();tourReady();});
$('#tour-concede').addEventListener('hold',()=>tourConcede());
$('#tour-bracket').addEventListener('click',e=>{const b=e.target.closest('[data-mid]');if(!b)return;T.selM=T.selM===b.dataset.mid?'':b.dataset.mid;renderTour();});
addEventListener('resize',()=>{const br=$('#tour-bracket');if(br&&br.dataset.size)requestAnimationFrame(()=>tourLines(br,Math.round(Math.log2(+br.dataset.size))));});

