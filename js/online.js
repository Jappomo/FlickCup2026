// Flick Cup 2026 · js/online.js
// The Online screen (agreed 24 Oct 2026). Play > Online Friendly opens it, like Kick-off; B goes back. Two sections,
// switched with LT / RT: Friendly and Tournament (the tournament part is drawn by js/tournament.js).
// Friendly: your club on the left, wearing your own kit (home kit = your kit); the room code and half length in the
// middle; the opponent on the right, wearing their own kit. You can show the opponent in another kit on your screen only
// (net.kitOver, read by kitOf in core.js), for readability. The player who joins presses Ready; the home player can
// start once the opponent is ready.
// Loaded by index.html after kickoff.js, as a classic script: every file shares one scope.
'use strict';
function onlineOpen(rt){if(rt)setRoomType(rt);setTab('online');sfx('tock',12);onlineRender();}
function onlineBack(){setTab('play');sfx('tock',8);const b=$('#btn-start');if(b&&lastInput==='pad')padPick(b);}
const onKitIdx=(q,f)=>q&&q.kit!=null&&KITS[q.kit]?q.kit:f;
function onOppSquad(){const o=oppPeer();return o?parseSquad(o.presence.sq,1):null;}
const onRating=q=>Math.round(q.cards.reduce((a,c)=>a+cardOvr(c.st),0)/10);
const onFacts=q=>`<p><b>${q.form==='custom'?'Custom':koEsc(q.form)}</b><span>Formation</span></p><p><b>${onRating(q)}</b><span>Rating</span></p>`;
const onTags=q=>`<div class="ko-tags">${PATHS[q.path]?`<span class="ko-tag" style="--c:${PATHS[q.path].col}">${PATHS[q.path].name}</span>`:''}${SPECIALS[q.special]?`<span class="ko-tag mom">${SPECIALS[q.special].name}</span>`:''}</div>`;
function onSet(el,html){if(el&&el.dataset.h!==html){el.dataset.h=html;el.innerHTML=html;}}
function onlineRender(){
  const pn=document.querySelector('[data-panel="online"]');if(!pn)return;
  const tour=T.roomType==='tour';
  $('#on-title').textContent=tour?'Tournament':'Online Friendly';
  $('#on-sub').textContent=tour?'Up to 16 teams. CPU teams fill the empty places.':'Play a friend with a room code';
  const inRoom=!!net.named,opp=inRoom?oppPeer():null,home=net.myTeam===0,away=net.myTeam===1;
  // left: you, in your own kit
  const me=mySquads[0],mk=myKit(0);
  onSet($('#on-me'),koSide(away?'You · Away':'You · Home',koCrest(me,mk),me.name||(KITS[kitSel[0]]||{}).name||'Your club',onTags(me),me.form,mk,
    away&&net.ready?'Your kit · <b class="on-ok">Ready</b>':'Your kit',{q:me,facts:onFacts(me)}));
  // right: the opponent in their kit (or the one you chose to see them in)
  let html;
  if(!inRoom)html=`<p class="ko-lab">Opponent</p><div class="on-wait"><b>No room yet</b><span>Make a room and send the code, or type the code you were sent.</span></div>`;
  else if(!opp)html=`<p class="ko-lab">Opponent</p><div class="on-wait"><b>Waiting for an opponent</b><span>Send them this code</span><em>${koEsc(net.code.toUpperCase())}</em></div>`;
  else{const q=onOppSquad(),own=kitFrom(KITS[onKitIdx(q,1)]||KITS[1],q),shown=net.kitOver!=null&&KITS[net.kitOver]?KITS[net.kitOver]:own,rdy=!!opp.presence.ready;
    const note=(net.kitOver!=null?'Shown in '+koEsc(KITS[net.kitOver].name)+' · your screen only':'Their kit')+(net.myTeam===0?` · <b class="${rdy?'on-ok':'on-no'}">${rdy?'Ready':'Not ready'}</b>`:'');
    html=koSide(away?'Opponent · Home':'Opponent · Away',koCrest(q,own),q.name||'Opponent',onTags(q),q.form,shown,note,{q,facts:onFacts(q)})+
      `<div class="on-kits"><p class="h">Show them in</p><div class="on-kv" id="on-kv"><button class="on-k${net.kitOver==null?' on':''}" data-kv="own" aria-pressed="${net.kitOver==null}" title="Their own kit">${koShirt(own,'on-ks')}<small>Theirs</small></button>`+
      KITS.map((k,i)=>`<button class="on-k${net.kitOver===i?' on':''}" data-kv="${i}" aria-pressed="${net.kitOver===i}" title="${koEsc(k.name)}">${koShirt(k,'on-ks')}<small>${koEsc(k.name)}</small></button>`).join('')+`</div></div>`;}
  onSet($('#on-opp'),html);
  // in a room: only Leave; outside: Join and New room
  $('#btn-join').hidden=$('#btn-newroom').hidden=inRoom;$('#btn-leave').hidden=!inRoom;$('#room-code').disabled=inRoom;
  // half length: the home player picks it (sent to the room); the away player sees the home pick
  if(inRoom&&!home&&opp&&[3,5,8].includes(+opp.presence.half))halfMin=+opp.presence.half;
  const guest=inRoom&&!home;document.querySelectorAll('#halflen .chip').forEach(b=>{b.setAttribute('aria-pressed',String(+b.dataset.min===halfMin));b.disabled=guest&&+b.dataset.min!==halfMin;});
  $('#on-half-note').textContent=guest?'The home player picks the half length.':'';
  // the buttons along the bottom
  const running=S.running&&S.phase!=='end'&&S.mode==='online';
  $('#on-start').hidden=tour||!home;$('#on-ready').hidden=tour||!away;
  if(home){$('#on-start').disabled=!(opp&&opp.presence.ready);$('#on-start-lbl').textContent=running?'Restart match':'Start match';}
  if(away){$('#on-ready-lbl').textContent=net.ready?'Not ready':'Ready';$('#on-ready').classList.toggle('alt',net.ready);$('#on-ready').classList.toggle('go',!net.ready);}
  if(!tour)$('#on-note').textContent=!inRoom?'':!opp?'':home?(opp.presence.ready?'Your opponent is ready. Start when you are.':'Waiting for your opponent to press Ready.'):away?(net.ready?'You are ready. The home player starts the match.':'Press Ready when you are set.'):'You are watching this room.';
}
// the home player starts: each side in its own kit (their kit look when it is on)
function onlineStart(){
  const opp=oppPeer();if(!(net.named&&net.myTeam===0&&opp&&opp.presence.ready))return;
  ensureAudio();S.mode='online';MBAL=BAL;matchSquads=[mySquads[0],parseSquad(opp.presence.sq,1)];
  S.tour=null;S.tg=false;S.noMoments=false;
  S.kits=[onKitIdx(mySquads[0],kitSel[0]),onKitIdx(matchSquads[1],1)];applyKits();S.halfLen=halfMin*60;
  cam.mode=-1;closeMenu();newMatch();
}
// the home player's half length goes with their seat, so the away player sees it
function onlineHalfSync(){if(net.named&&net.myTeam===0)net.named.presence({half:halfMin}).catch(()=>{});}
function onlineReady(){if(!net.named||net.myTeam!==1)return;net.ready=!net.ready;net.named.presence({ready:net.ready}).catch(()=>{});onlineRender();}
$('#on-back').addEventListener('click',onlineBack);
$('#on-start').addEventListener('click',onlineStart);
$('#on-ready').addEventListener('click',onlineReady);
// the opponent's kit on your screen: their own, or one of the preset kits
$('#on-opp').addEventListener('click',e=>{const b=e.target.closest('[data-kv]');if(!b)return;net.kitOver=b.dataset.kv==='own'?null:+b.dataset.kv;applyKits();onlineRender();});
document.querySelectorAll('#halflen .chip').forEach(b=>b.addEventListener('click',()=>{if(net.named&&net.myTeam===0)net.named.presence({half:halfMin}).catch(()=>{});onlineRender();}));
