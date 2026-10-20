// Flick Cup 2026 · js/net.js
// Online rooms (PeerJS): host, join, sync.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= online room ================= */
const net={room:null,named:null,code:'',myTeam:null,others:[],joinedAt:0,claimReady:false,claimed:false,unsubs:[],lastAim:0,lastK:0};
function activePeer(){return net.others.find(p=>p.presence.team===S.active)||null;}
function oppPeer(){return net.others.find(p=>p.presence.team!==net.myTeam)||null;}
net.sendState=()=>{if(!net.named||net.myTeam==null)return;net.named.emit('state',packState()).catch(()=>{});};
/* ---- peer-to-peer rooms for the stand-alone (GitHub Pages) version ----
   Same interface as Claude's rooms: join(name) -> {presence, emit, on, onPeers, peers, leave}.
   The first player to open a room code becomes its hub (PeerJS id baizecup-<code>); everyone else connects to the hub,
   which relays presence and messages. Matchmaking goes through the free PeerJS server; play itself is browser to browser. */
const PEER_LIB='lib/peerjs.min.js';
function loadPeerLib(){return new Promise((ok,no)=>{if(window.Peer)return ok();const sc=document.createElement('script');sc.src=PEER_LIB;sc.onload=()=>window.Peer?ok():no(new Error('peerjs'));sc.onerror=()=>no(new Error('peerjs'));document.head.appendChild(sc);});}
const P2P_LIVE=new Set(['aim','sim','kz']); // fast-changing presence keys that do not need a peers refresh
function peerRoomApi(){
  const opts=()=>Object.assign({debug:0},window.BAIZE_PEER||{});
  function openPeer(id){return new Promise((ok,no)=>{const p=id?new Peer(id,opts()):new Peer(opts());const t=setTimeout(()=>{no(Object.assign(new Error('timeout'),{code:'timeout'}));try{p.destroy();}catch(e){}},12000);
    p.on('open',()=>{clearTimeout(t);ok(p);});p.on('error',e=>{clearTimeout(t);no(Object.assign(new Error(e.type||'error'),{code:e.type||'error'}));try{p.destroy();}catch(_){}});});}
  return {async join(name,jo){
    await loadPeerLib();
    const hubId='baizecup-'+String(name).replace(/[^a-z0-9-]/gi,'').toLowerCase();
    const R={me:'',isHub:false,peer:null,conns:new Map(),hub:null,pres:new Map(),handlers:new Map(),peerCbs:new Set(),left:false};
    const list=()=>[...R.pres.entries()].map(([id,pr])=>({peer:id,sameTab:id===R.me,kind:'viewer',presence:pr||{}}));
    const firePeers=ch=>R.peerCbs.forEach(cb=>{try{cb(ch);}catch(e){}});
    const fireMsg=(type,data,from)=>{const hs=R.handlers.get(type);if(hs)hs.forEach(cb=>{try{cb({data,sameTab:from===R.me,peer:from});}catch(e){}});};
    const applyPres=(id,p,silent)=>{const was=R.pres.has(id);let cur=R.pres.get(id);if(!cur){cur={};R.pres.set(id,cur);}Object.assign(cur,p); // same object: the game keeps references to it
      if(!was)firePeers({joined:list().filter(x=>x.peer===id),left:[]});else if(!silent&&Object.keys(p).some(k=>!P2P_LIVE.has(k)))firePeers({joined:[],left:[]});};
    const drop=id=>{if(!R.pres.has(id))return;const gone=list().filter(x=>x.peer===id);R.pres.delete(id);firePeers({joined:[],left:gone});};
    const send=(c,m)=>{try{if(c&&c.open)c.send(m);}catch(e){}};
    const bcast=(m,except)=>R.conns.forEach((c,id)=>{if(id!==except)send(c,m);});
    // hub side: one connection per member, relay everything
    function hubConn(c){
      c.on('open',()=>{R.conns.set(c.peer,c);send(c,{t:'all',list:[...R.pres.entries()]});});
      c.on('data',m=>{if(!m||typeof m!=='object')return;
        if(m.t==='pres'&&m.p&&typeof m.p==='object'){applyPres(c.peer,m.p);bcast({t:'pres',id:c.peer,p:m.p},c.peer);}
        else if(m.t==='emit'&&typeof m.type==='string'){fireMsg(m.type,m.data,c.peer);bcast({t:'emit',id:c.peer,type:m.type,data:m.data},c.peer);}});
      const bye=()=>{if(!R.conns.has(c.peer))return;R.conns.delete(c.peer);drop(c.peer);bcast({t:'left',id:c.peer});};
      c.on('close',bye);c.on('error',bye);
    }
    try{R.peer=await openPeer(hubId);R.isHub=true;}
    catch(e){if(e.code!=='unavailable-id')throw e;R.peer=await openPeer(null);}
    R.me=R.peer.id;R.pres.set(R.me,{});
    if(R.isHub){R.peer.on('connection',hubConn);}
    else{
      const c=R.peer.connect(hubId,{reliable:true});R.hub=c;
      await new Promise((ok,no)=>{const t=setTimeout(()=>no(Object.assign(new Error('timeout'),{code:'timeout'})),12000);c.on('open',()=>{clearTimeout(t);ok();});c.on('error',e=>{clearTimeout(t);no(Object.assign(new Error('connect'),{code:'connect'}));});});
      c.on('data',m=>{if(!m||typeof m!=='object')return;
        if(m.t==='all'&&Array.isArray(m.list))m.list.forEach(([id,p])=>{if(id!==R.me)applyPres(id,p||{});});
        else if(m.t==='pres'&&m.id!==R.me)applyPres(m.id,m.p||{});
        else if(m.t==='emit')fireMsg(m.type,m.data,m.id);
        else if(m.t==='left')drop(m.id);});
      c.on('close',()=>{if(R.left)return;[...R.pres.keys()].filter(id=>id!==R.me).forEach(drop);if(jo&&jo.onHubLost){jo.onHubLost();return;}if(typeof setRoomStatus==='function')setRoomStatus('The player who opened this room has left. Make a new room to play again.');});
    }
    R.peer.on('disconnected',()=>{try{if(!R.left)R.peer.reconnect();}catch(e){}});
    return {
      presence(p){if(R.left)return Promise.resolve();applyPres(R.me,p,true);const m={t:'pres',id:R.me,p};if(R.isHub)bcast(m);else send(R.hub,m);return Promise.resolve();},
      emit(type,data){if(R.left)return Promise.resolve();if(R.isHub)bcast({t:'emit',id:R.me,type,data});else send(R.hub,{t:'emit',type,data});return Promise.resolve();},
      on(type,cb){if(!R.handlers.has(type))R.handlers.set(type,new Set());R.handlers.get(type).add(cb);return ()=>R.handlers.get(type).delete(cb);},
      onPeers(cb){R.peerCbs.add(cb);return ()=>R.peerCbs.delete(cb);},
      peers(){return list();},
      isHub(){return R.isHub;},
      async leave(){R.left=true;try{R.conns.forEach(c=>c.close());if(R.hub)R.hub.close();}catch(e){}try{R.peer.destroy();}catch(e){}}
    };
  }};
}
async function initRoom(){
  try{if(window.claude&&typeof window.claude.use==='function')net.room=await window.claude.use('room');}catch(e){net.room=null;}
  // outside Claude (GitHub Pages, your own server): browser-to-browser rooms, when the bundled PeerJS file is there
  if(!net.room&&!window.claude&&location.protocol!=='file:')net.room=peerRoomApi();
  renderOnline();
  hereCount();
}
// how many people have the game open right now: everyone sits in one quiet lobby room
let here={r:null,n:0,tries:0,heard:new Map(),t0:0,timer:0};
// browser-to-browser rooms can miss a closed tab, so there everyone sends a heartbeat and the count is who was heard lately
function hereShow(){const el=$('#online-count');if(!el)return;const r=here.r;
  const n=!r?0:r.isHub?1+[...here.heard.values()].filter(t=>Date.now()-t<13000).length:r.peers().length;here.n=n;
  el.hidden=n<1;$('#online-n').textContent=n;{const t=$('#t-online');if(t){t.hidden=n<1;$('#t-online-n').textContent=n;}}el.title=n===1?'Only you are here right now':n+' players on the page right now';el.setAttribute('aria-label',el.title);}
function hereLost(){const old=here.r;here.r=null;here.heard.clear();clearInterval(here.timer);hereShow();try{old&&old.leave();}catch(e){}setTimeout(hereCount,400+Math.random()*1600);}
async function hereCount(){
  if(!net.room||here.r)return;
  try{
    const r=await net.room.join('flickcup-here',{onHubLost:hereLost});
    here.r=r;here.tries=0;here.t0=Date.now();here.heard.clear();r.presence({here:1}).catch(()=>{});r.onPeers(hereShow);
    if(r.isHub){
      r.on('hb',m=>{if(!m.sameTab&&m.peer){here.heard.set(m.peer,Date.now());hereShow();}});
      const beat=()=>{if(here.r!==r)return;r.emit('hb',1).catch(()=>{});
        // a member that hears nobody for a while has lost its host: start over (one of us becomes the host)
        const last=Math.max(here.t0,...here.heard.values());if(!r.isHub()&&Date.now()-last>14000){hereLost();return;}hereShow();};
      clearInterval(here.timer);here.timer=setInterval(beat,4000);beat();
    }
    hereShow();
  }catch(e){here.r=null;here.tries++;setTimeout(hereCount,Math.min(15000,2500*here.tries)+Math.random()*1500);}
}
// leave the lobby on the way out so the next visitor can take over straight away
addEventListener('pagehide',()=>{try{if(here.r)here.r.leave();}catch(e){}});
function myPeer(){const me=net.named&&net.named.peers().find(p=>p.sameTab);return me?me.peer:'';}
function refreshPlayers(){
  if(!net.named)return;
  const peers=net.named.peers();
  net.others=peers.filter(p=>!p.sameTab&&p.kind==='viewer'&&p.presence&&p.presence.seat==='p'&&(p.presence.team===0||p.presence.team===1));
  if(net.claimReady){
    const mp=myPeer();
    const beats=p=>(+p.presence.t0||0)<net.joinedAt||((+p.presence.t0||0)===net.joinedAt&&p.peer<mp);
    let want=net.myTeam;
    if(net.tourMatch){want=T.uid===net.tourMatch.home?0:T.uid===net.tourMatch.away?1:null;}
    else if(want==null||net.others.some(p=>p.presence.team===want&&beats(p))){
      const taken=new Set(net.others.filter(p=>want==null||beats(p)||p.presence.team!==want).map(p=>p.presence.team));
      want=!taken.has(0)?0:!taken.has(1)?1:null;
    }
    if(want!==net.myTeam||!net.claimed){net.myTeam=want;net.claimed=true;net.named.presence({seat:want==null?'s':'p',team:want,t0:net.joinedAt,sq:serSquad(mySquads[0])}).catch(()=>{});}
  }
  renderOnline();updateHud();if(net.tourMatch)tourAutoStart();
}
async function joinRoom(code,o){
  code=(code||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,o&&o.raw?24:6);
  if(!(o&&o.raw))net.tourMatch=null;
  if(code.length<3){setRoomStatus('Room codes are 3 to 6 letters or digits.');return;}
  if(!net.room){setRoomStatus('Online play is not available in this view.');return;}
  await leaveRoom(true);
  setRoomStatus('Joining room '+code.toUpperCase()+'…');
  let r;
  try{r=await net.room.join('baize-'+code);}catch(e){const c=(e&&e.code)||(e&&e.message)||'error';setRoomStatus(c==='peerjs'?'Online play could not load (lib/peerjs.min.js is missing).':c==='connect'||c==='peer-unavailable'||c==='timeout'?'Could not reach the other player. Check the code, or make a new room.':'Could not join that room ('+c+'). Try again in a moment.');return;}
  net.named=r;net.code=code;net.joinedAt=Date.now();net.myTeam=null;net.claimReady=false;net.claimed=false;net.others=[];
  $('#room-code').value=code.toUpperCase();
  r.presence({seat:'w',t0:net.joinedAt,sq:serSquad(mySquads[0])}).catch(()=>{});
  net.unsubs.push(r.on('state',m=>{if(m.sameTab)return;onRemoteState(m.data);}));
  net.unsubs.push(r.onPeers(ch=>{
    refreshPlayers();
    if(ch.joined.some(p=>!p.sameTab)&&S.running&&S.mode==='online'&&net.myTeam!=null)setTimeout(()=>net.sendState(),500+Math.random()*400);
  }));
  setTimeout(()=>{if(net.named===r){net.claimReady=true;refreshPlayers();}},1300);
  renderOnline();
}
async function leaveRoom(quiet){
  net.unsubs.forEach(u=>{try{u();}catch(e){}});net.unsubs=[];
  if(net.named){const r=net.named;net.named=null;try{await r.leave();}catch(e){}}
  net.myTeam=null;net.others=[];net.code='';
  if(S.mode==='online'){S.running=false;S.phase='idle';S.mode='local';S.tg=false;S.noMoments=false;S.golden=false;matchSquads=[mySquads[0],mySquads[1]];applySquadStats();formation(0);updateHud();}
  if(!quiet)setRoomStatus('Left the room.');
  renderOnline();
}
function setRoomStatus(t){$('#room-status').textContent=t;}
function renderOnline(){
  const avail=!!net.room;
  $('#mode-online').disabled=!avail;
  $('#online-sub').textContent=avail?'Share a room code with a friend. Each side brings its own squad.':'Online play needs the Claude-hosted version of the game.';
  if(!avail&&menuMode==='online')setMenuMode('');
  $('#seats').hidden=!net.named;$('#btn-leave').hidden=!net.named;
  if(net.named){
    const name=t=>{if(net.myTeam===t)return 'You';return net.others.some(p=>p.presence.team===t)?'Opponent':'Open';};
    $('#seat0').textContent=name(0);$('#seat1').textContent=name(1);
    const opp=oppPeer(),c=net.code.toUpperCase();
    if(!net.claimReady)setRoomStatus(`Room ${c}: finding your seat…`);
    else if(net.myTeam==null)setRoomStatus(`Room ${c} is full. You are watching.`);
    else if(!opp)setRoomStatus(`Room ${c}: send this code to your opponent. Waiting for them to join.`);
    else if(net.myTeam===0)setRoomStatus(`Room ${c}: opponent is here. You are home, so you pick kits and start.`);
    else setRoomStatus(`Room ${c}: you are away. Waiting for home to kick off.`);
  }
  updateStartBtn();
}

