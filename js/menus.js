// Flick Cup 2026 · js/menus.js
// Concede, hub Play tab, squad builder, balancing sheet.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= update in place ================= */
// Lists in the menus are kept, not rebuilt (UI rule 5): uiList() reuses the child with the same key, makes the missing
// ones, drops the extra ones and puts them in order. upd() writes the current state into each one. The focus, the
// scroll and any running animation on a kept child survive the update.
function uiList(box,items,key,make,upd){
  const old=new Map();[...box.children].forEach(c=>{if(c.dataset.uk!=null)old.set(c.dataset.uk,c);});
  let prev=null;items.forEach((it,i)=>{const k=String(key(it,i));let el=old.get(k);if(el)old.delete(k);else{el=make(it,i);el.dataset.uk=k;}
    upd(el,it,i);const want=prev?prev.nextSibling:box.firstChild;if(el!==want)box.insertBefore(el,want);prev=el;});
  old.forEach(el=>el.remove());}
const setAttr=(el,a,v)=>{v=String(v);if(el.getAttribute(a)!==v)el.setAttribute(a,v);};

/* ================= concede ================= */
function concede(team){
  if(!S.running||S.phase==='end'||!(team===0||team===1))return;
  const o=1-team;sim.running=false;sim.ctx=null;stopAll();S.conceded=true;
  if(S.score[o]-S.score[team]<3){S.score[team]=0;S.score[o]=3;}
  S.golden=false;S.phase='end';S.armed='';S.msg={t:'Conceded',s:`${N(team)} concede. ${N(o)} win ${S.score[0]}-${S.score[1]}.`,w:1,c:o};
  closeMenu();commit();setTimeout(()=>ambience.update(),0);
}
const concedeSure={};let concedeSig='';
function renderConcede(){
  const row=$('#concede-row');if(!row)return;
  const live=S.running&&S.phase!=='end'&&(S.mode==='online'||S.mode==='cpu'||S.mode==='local')&&!(S.mode==='online'&&net.myTeam==null);
  const teams=!live?[]:S.mode==='online'?[net.myTeam]:S.mode==='cpu'?[0]:[0,1];
  const label=t=>concedeSure[t]?'Tap again to concede':teams.length>1?`${N(t)} concede`:'Concede';
  const sig=teams.map(t=>t+':'+label(t)).join('|');row.hidden=!teams.length;if(sig===concedeSig)return;concedeSig=sig;row.innerHTML='';
  teams.forEach(t=>{const b=tEl('button','big alt concede',label(t));b.type='button';
    b.onclick=()=>{if(concedeSure[t]){concedeSure[t]=0;concedeSig='';concede(t);return;}concedeSure[t]=Date.now();renderConcede();setTimeout(()=>{if(concedeSure[t]&&Date.now()-concedeSure[t]>=4900){concedeSure[t]=0;renderConcede();}},5000);};row.appendChild(b);});
}

/* ================= hub: play ================= */
let menuMode='local',halfMin=5,kitSel=[mySquads[0].kit!=null?mySquads[0].kit:0,mySquads[1].kit!=null?mySquads[1].kit:1],hubTab='play';
if(kitSel[0]===kitSel[1])kitSel[1]=(kitSel[0]+1)%KITS.length;
const TABS=['play','squad','custom','album','settings','rules','balance'];
const PAUSE_HIDE=['squad','custom','album'];
// My Club sections: tactics (formation, cards, path), kit look, history
let clubSec='tactics';
function setTab(t){hubTab=t;$('#hub').classList.toggle('ko-on',t==='kickoff');document.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===t)));document.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==t);if(t==='squad')setClubSec(clubSec);if(t==='custom')setCustSec(custSec);if(t==='album'&&typeof renderAlbum==='function')renderAlbum();if(t==='kickoff')koRender();}
function setClubSec(sec){clubSec=sec;document.querySelectorAll('#club-sub [data-club]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.club===sec)));
  $('#club-tactics').hidden=sec!=='tactics';$('#club-kit').hidden=sec!=='kit';$('#club-history').hidden=sec!=='history';$('#club-crest').hidden=sec!=='crest';
  if(hubTab!=='squad')return;if(sec==='tactics')renderSquad();else if(sec==='kit')renderKitLook();else if(sec==='crest'){if(typeof renderCrest==='function')renderCrest();}else if(typeof renderHistory==='function')renderHistory();}
document.querySelectorAll('#club-sub [data-club]').forEach(b=>b.addEventListener('click',()=>setClubSec(b.dataset.club)));
let setSub='audio';
function setSettingsSub(k){setSub=k;document.querySelectorAll('#set-sub [data-sub]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sub===k)));document.querySelectorAll('.set-grid [data-sub]').forEach(c=>c.classList.toggle('on',c.dataset.sub===k));}
document.querySelectorAll('#set-sub [data-sub]').forEach(b=>b.addEventListener('click',()=>setSettingsSub(b.dataset.sub)));
setSettingsSub('audio');
// How to play: Rules, Controls, Cards and Moments, one at a time (LT / RT or a click)
let rulesSub='rules';
function setRulesSub(k){rulesSub=k;document.querySelectorAll('#rules-sub [data-rsec]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.rsec===k)));document.querySelectorAll('[data-panel=rules]>.cardbox[data-rsec]').forEach(c=>c.hidden=c.dataset.rsec!==k);}
document.querySelectorAll('#rules-sub [data-rsec]').forEach(b=>b.addEventListener('click',()=>setRulesSub(b.dataset.rsec)));
// LT / RT: step through the sub-menu of the open tab
function subStep(d){const pn=document.querySelector('#hub [data-panel]:not([hidden])');const nav=pn&&pn.querySelector('.subnav');if(!nav||nav.hidden||!nav.offsetParent)return;
  const bs=[...nav.querySelectorAll('button')].filter(b=>!b.disabled&&b.offsetParent);if(bs.length<2)return;
  let k=bs.findIndex(b=>b.getAttribute('aria-pressed')==='true'||b.getAttribute('aria-current')==='true');k=(k<0?0:k+d+bs.length)%bs.length;bs[k].click();sfx('tock',6);}
function stepTab(d){const paused=$('#hub').classList.contains('paused-match'),list=TABS.filter(t=>!(paused&&PAUSE_HIDE.includes(t)));let i=list.indexOf(hubTab);if(i<0)i=0;setTab(list[(i+d+list.length)%list.length]);}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
function setMenuMode(m){menuMode=m;document.querySelectorAll('.tile').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===m)));$('#online-panel').hidden=m!=='online';updateStartBtn();if(hubTab==='squad'&&clubSec==='tactics')renderSquad();}
function kitSwatch(b,k){b.style.background='none';b.innerHTML='';[['shirt',50],['shorts',30],['socks',20]].forEach(([p,h])=>{const i=document.createElement('i');i.className='kst';i.style.height=h+'%';i.style.background=typeof k[p]==='number'?hexStr(k[p]):k[p];b.appendChild(i);});}
function renderKits(){
  for(let t=0;t<2;t++){const row=$('#kit'+t),q=mySquads[t];
    const items=(q.look?['my']:[]).concat(KITS.map((k,i)=>i));
    uiList(row,items,x=>x,x=>{const b=document.createElement('button');b.className=x==='my'?'sw my':'sw';b.type='button';
      b.onclick=x==='my'?()=>{mySquads[t].useLook=true;saveSquads();if(!S.running)applyKits();renderKits();}
        :()=>{kitSel[t]=x;mySquads[t].kit=x;mySquads[t].useLook=false;saveSquads();renderKits();if(!S.running){S.kits=kitSel.slice();applyKits();}if(hubTab==='squad')renderSquad();};
      return b;},(b,x)=>{
      if(x==='my'){const L=q.look,sig=[L.s,L.p,L.o].join();if(b.dataset.sig!==sig){b.dataset.sig=sig;kitSwatch(b,{shirt:KIT_COLORS[L.s][1],shorts:KIT_COLORS[L.p][1],socks:KIT_COLORS[L.o][1]});}
        b.title='My kit (My Club > Kit look)';setAttr(b,'aria-pressed',!!q.useLook);setAttr(b,'aria-label',(t?'Away':'Home')+' kit: my kit');return;}
      const k=KITS[x];if(!b.firstChild)kitSwatch(b,k);b.title=k.name;
      setAttr(b,'aria-pressed',!q.useLook&&kitSel[t]===x);setAttr(b,'aria-label',(t?'Away':'Home')+' kit '+k.name);b.disabled=!mySquads[1-t].useLook&&kitSel[1-t]===x;});}
}
function updateStartBtn(){
  const b=$('#btn-start'),running=S.running&&S.phase!=='end';
  $('#mode-setup').hidden=!menuMode;
  const tourView=menuMode==='online'&&T.roomType==='tour';$('#match-settings').hidden=tourView;$('#btn-start').hidden=tourView;
  renderConcede();
  {const paused=S.running&&S.phase!=='end';$('#hub').classList.toggle('paused-match',paused);
    if(paused&&PAUSE_HIDE.includes(hubTab))setTab('play');}
  $('#btn-resume').hidden=!running||(menuMode==='online')!==(S.mode==='online');
  $('#match-settings').style.display=(menuMode==='online'&&net.named&&net.myTeam!==0)?'none':'';
  if(menuMode==='online'){const ready=net.named&&net.myTeam===0&&!!oppPeer();$('#start-lbl').textContent=running&&S.mode==='online'?'Restart match':'Start match';b.disabled=!ready;}
  else if(menuMode==='practice'){$('#start-lbl').textContent=S.mode==='practice'&&running?'Restart practice':'Start practice';b.disabled=false;}
  else if(menuMode==='tutorial'){$('#start-lbl').textContent=S.mode==='tutorial'&&running?'Restart tutorial':'Start tutorial';b.disabled=false;}
  else{$('#start-lbl').textContent=running?'New match':menuMode==='local'?'Choose clubs':'Choose opponent';b.disabled=false;}
  // Solo and Versus pick the kits and half length on the Kick-off screen
  if(menuMode==='practice'||menuMode==='tutorial'||menuMode==='cpu'||menuMode==='local')$('#match-settings').style.display='none';
}
function openMenu(){const was=$('#hub').hidden;$('#hub').hidden=false;if(was)music.menu(true);applyVolumes();if(S.mode!=='online')S.paused=true;setMenuMode(S.mode==='online'&&S.running?'online':menuMode);updateStartBtn();updateHud();}
function closeMenu(){retShow(false);const was=!$('#hub').hidden;$('#hub').hidden=true;S.paused=false;updateHud();if(was){music.menu(false);applyVolumes();}}
function toggleMenu(){if($('#hub').hidden)openMenu();else if(S.running&&S.phase!=='end')closeMenu();}
document.querySelectorAll('.tile').forEach(b=>b.addEventListener('click',()=>{ensureAudio();setMenuMode(b.dataset.mode);}));
document.querySelectorAll('#halflen .chip').forEach(b=>b.addEventListener('click',()=>{halfMin=+b.dataset.min;document.querySelectorAll('#halflen .chip').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}));
$('#btn-start').addEventListener('click',()=>{
  ensureAudio();
  if(menuMode==='cpu'||menuMode==='local'){koOpen();return;}
  if(menuMode==='practice'||menuMode==='tutorial'){
    if(S.mode==='online'&&net.named)leaveRoom(true);
    S.kits=kitSel.slice();applyKits();cam.mode=-1;closeMenu();
    if(menuMode==='practice')startPractice();else startTutorial();
    return;
  }
  if(menuMode==='online'){
    const opp=oppPeer();if(!(net.named&&net.myTeam===0&&opp))return;
    S.mode='online';MBAL=BAL;matchSquads=[mySquads[0],parseSquad(opp.presence.sq,1)];
  }else{
    if(S.mode==='online'&&net.named)leaveRoom(true);
    S.mode=menuMode;matchSquads=S.mode==='cpu'?[mySquads[0],defaultSquad(1)]:[mySquads[0],mySquads[1]];
  }
  S.tour=null;S.tg=false;S.noMoments=false;
  S.kits=kitSel.slice();applyKits();S.halfLen=halfMin*60;
  cam.mode=-1;closeMenu();newMatch();
});
$('#btn-resume').addEventListener('click',()=>closeMenu());
$('#btn-join').addEventListener('click',()=>{ensureAudio();joinRoom($('#room-code').value);});
$('#room-code').addEventListener('keydown',e=>{if(e.key==='Enter')joinRoom($('#room-code').value);});
$('#btn-newroom').addEventListener('click',()=>{const ch='abcdefghjkmnpqrstuvwxyz23456789';let c='';for(let i=0;i<4;i++)c+=ch[Math.floor(Math.random()*ch.length)];joinRoom(c);});
$('#btn-leave').addEventListener('click',()=>leaveRoom(false));
function syncMuteBtn(){const b=$('#btn-sound');b.classList.toggle('muted',!!SET.mute);b.setAttribute('aria-label',SET.mute?'Unmute':'Mute');b.title=SET.mute?'Unmute':'Mute';$('#mute-all').checked=SET.mute;}
$('#btn-sound').addEventListener('click',()=>{SET.mute=!SET.mute;saveSet();syncMuteBtn();ensureAudio();applyVolumes();});
$('#btn-skip').addEventListener('click',()=>{if(localTurn())skipDefend();});
$('#btn-gk').addEventListener('click',()=>{if(localTurn())gkToggle(S.active);});
$('#btn-cam').addEventListener('click',()=>{closeCamMenu();resetCam();});
$('#btn-cam-menu').addEventListener('click',e=>{e.stopPropagation();if($('#cam-menu').hidden)openCamMenu();else closeCamMenu();});
document.querySelectorAll('#cam-menu [data-cam]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();setCamStyle(+b.dataset.cam);}));
document.addEventListener('pointerdown',e=>{if(!$('#cam-menu').hidden&&!e.target.closest('.camgrp'))closeCamMenu();},true);
$('#btn-menu').addEventListener('click',toggleMenu);
{const box=$('#plays'),tg=$('#plays-toggle');let open=store.get('baize.plays')!=='0';const ap=()=>{box.classList.toggle('closed',!open);tg.setAttribute('aria-expanded',String(open));};ap();
  tg.addEventListener('click',()=>{open=!open;store.set('baize.plays',open?'1':'0');ap();});
  const mb=$('#plays-more'),me=$('#plays-mine'),sync=()=>{mb.setAttribute('aria-pressed',String(PL.more));me.setAttribute('aria-pressed',String(PL.mine));mb.title=PL.more?'Show the last 3 plays':'Show the last 6 plays';};sync();
  mb.addEventListener('click',()=>{PL.more=!PL.more;store.set('baize.plays6',PL.more?'1':'0');if(!open){open=true;ap();}sync();renderLog();});
  me.addEventListener('click',()=>{PL.mine=!PL.mine;store.set('baize.playsMe',PL.mine?'1':'0');if(!open){open=true;ap();}sync();renderLog();});}
$('#btn-moment').addEventListener('click',()=>activateMoment(myMomentTeam()));
$('#curl-l').addEventListener('click',()=>setCurl(-1));$('#curl-r').addEventListener('click',()=>setCurl(1));
$('#btn-rematch').addEventListener('click',()=>{$('#ft').hidden=true;newMatch();music.menu(false);applyVolumes();});
$('#btn-ft-menu').addEventListener('click',()=>{if(S.tour||(net.tourMatch&&net.tourMatch.watch)){tourBack();return;}$('#ft').hidden=true;S.running=false;S.phase='idle';openMenu();});

/* ================= hub: squad builder ================= */
let sqTeam=0,sqSlot=8,noteT=0;
const stars=n=>'★'.repeat(n)+'☆'.repeat(3-n);
// controller: move one formation shield
let tokMove=-1;
function squadNudge(i,dx,dz){const q=mySquads[sqTeam],F=formOf(q);
  if(q.form!=='custom'){q.cbase=FORMATIONS[q.form]?q.form:'4-4-2';q.cpos=F.pos.map(p=>p.slice());q.form='custom';document.querySelectorAll('#formations .chip').forEach(c=>c.setAttribute('aria-pressed',String(c.textContent==='Custom')));}
  const p=q.cpos[i];p[0]=clamp(p[0]+dx,-57,29);p[1]=clamp(p[1]+dz,-36,36);
  const b=$('#mini').querySelectorAll('.tok')[i];if(b){b.style.left=((p[0]+60)/120*100)+'%';b.style.top=((p[1]+39)/78*100)+'%';const sm=b.querySelector('small');if(sm)sm.textContent=roleLab(p[0],p[1]);}}
function squadMoveStart(i){sqSlot=i;tokMove=i;renderSquad();const b=$('#mini').querySelectorAll('.tok')[i];if(b){b.classList.add('moving');b.focus({preventScroll:true});}flashSubMenu('Move it with the right stick. Press X to confirm.');}
function squadMoveEnd(){const i=tokMove;tokMove=-1;$('#mini').querySelectorAll('.tok.moving').forEach(t=>t.classList.remove('moving'));const q=mySquads[sqTeam];if(q.cpos)q.cpos=q.cpos.map(([x,z])=>[Math.round(x*2)/2,Math.round(z*2)/2]);saveSquads();renderSquad();const b=$('#mini').querySelectorAll('.tok')[i];if(b)b.focus({preventScroll:true});}
function flashSubMenu(t){const n=$('#squad-note');if(n){n.textContent=t;n.style.color='var(--cyan)';}}
function renderSquad(){
  const showTeams=menuMode==='local'||!menuMode;
  $('#squad-team').hidden=!showTeams;if(!showTeams)sqTeam=0;
  document.querySelectorAll('#squad-team .chip').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.team===sqTeam)));
  $('#squad-note').style.color='';
  $('#squad-note').textContent=(menuMode==='online'?'Your squad travels with you online. ':menuMode==='cpu'?'Your side against the CPU. ':'')+'Changes apply from the next kick-off.';
  const q=mySquads[sqTeam],F=formOf(q),kit=KITS[kitSel[sqTeam]];
  {const ni=$('#squad-name');if(document.activeElement!==ni)ni.value=q.name||'';ni.placeholder=kit.name;const team=sqTeam;
    ni.oninput=()=>{mySquads[team].name=cleanSquadName(ni.value);saveSquads();if(!S.running)updateHud();if(net.named)net.named.presence({sq:serSquad(mySquads[0])}).catch(()=>{});};}
  uiList($('#sq-kit'),KITS,(k,i)=>i,(k,i)=>{const b=document.createElement('button');b.className='sw';b.type='button';b.appendChild(document.createElement('i'));
      b.onclick=()=>{const team=sqTeam;kitSel[team]=i;mySquads[team].kit=i;if(kitSel[1-team]===i)kitSel[1-team]=(i+1)%KITS.length;saveSquads();renderKits();if(!S.running){S.kits=kitSel.slice();applyKits();}renderSquad();};return b;},
    (b,k,i)=>{b.title=k.name;b.style.background=k.ui;b.firstChild.style.background='#'+k.shorts.toString(16).padStart(6,'0');
      setAttr(b,'aria-pressed',kitSel[sqTeam]===i);setAttr(b,'aria-label','Preferred color '+k.name);b.disabled=showTeams&&kitSel[1-sqTeam]===i;});
  const fr=$('#formations');
  uiList(fr,Object.keys(FORMATIONS).concat('custom'),f=>f,f=>{const b=document.createElement('button');b.className='chip';b.textContent=f==='custom'?'Custom':f;
      if(f==='custom'){b.title='Your own layout: drag the shields';b.onclick=()=>{const q=mySquads[sqTeam];if(q.form!=='custom'){if(!q.cpos||q.cpos.length!==10){q.cbase=FORMATIONS[q.form]?q.form:'4-4-2';q.cpos=FORMATIONS[q.cbase].pos.map(p=>p.slice());}q.form='custom';saveSquads();renderSquad();}};}
      else b.onclick=()=>{mySquads[sqTeam].form=f;saveSquads();renderSquad();};return b;},
    (b,f)=>setAttr(b,'aria-pressed',q.form===f));
  const mini=$('#mini'),toks=[...mini.querySelectorAll('.tok')];
  for(let i=0;i<10;i++){let b=toks[i];if(!b){b=squadTok(i);mini.appendChild(b);}
    const [x,z]=F.pos[i],kp=F.kop.indexOf(i);
    b.style.left=((x+60)/120*100)+'%';b.style.top=((z+39)/78*100)+'%';
    const html=shieldSVG(i===sqSlot?'url(#tokSel)':'url(#tokGold)','#1a0b40')+`<b>${NUMS[i]}</b><small>${F.lab[i]}</small>`+(kp===0?'<i class="kb"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"9.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"/><path d=\"M12 7.2l4 2.9-1.5 4.7h-5L8 10.1z\" fill=\"currentColor\"/><path d=\"M12 7.2V2.6M16 10.1l4.3-1.4M14.5 14.8l2.7 3.7M9.5 14.8l-2.7 3.7M8 10.1L3.7 8.7\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg></i>':kp===1?'<i class="kb">2</i>':'');
    if(b.dataset.h!==html){b.dataset.h=html;b.innerHTML=html;}
    setAttr(b,'aria-pressed',i===sqSlot);setAttr(b,'aria-label',`${F.lab[i]} ${myNames[sqTeam][i]}`);b.title=myNames[sqTeam][i];}
  {const pair=F.kop,role=kRole(F.pos[sqSlot]),k1=$('#btn-kick'),k2=$('#btn-kick2');
    const tryPair=(slot)=>{const p=pair.slice();const o=1-slot;p[slot]=sqSlot;if(p[o]===sqSlot)p[o]=pair[slot];
      if(!kopOk(p,F.pos)){let fix=null;for(let j=0;j<10&&!fix;j++){if(j===sqSlot)continue;const c=p.slice();c[o]=j;if(kopOk(c,F.pos))fix=c;}return fix;}return p;};
    [[k1,0],[k2,1]].forEach(([btn,slot])=>{const on=pair[slot]===sqSlot,cand=role==='def'?null:tryPair(slot);
      btn.setAttribute('aria-pressed',String(on));btn.disabled=!on&&!cand;
      btn.onclick=()=>{if(on||!cand)return;q.kop=cand;saveSquads();renderSquad();};});
    $('#kop-note').textContent=role==='def'?'Defenders cannot take the kick-off.':`Kick-off: ${NUMS[pair[0]]} and ${NUMS[pair[1]]}. One forward needed, one midfielder at most.`;}
  const cr=$('#corners');
  const cfg=CORNER_CFG[cornerSide];
  document.querySelectorAll('#corner-side .chip').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.side===cornerSide)));
  uiList(cr,[...Object.keys(cfg.presets),'custom'],k=>cornerSide+k,k=>{const b=document.createElement('button');b.className='chip';b.onclick=()=>{const q=mySquads[sqTeam];q[CORNER_CFG[cornerSide].field]=k;saveSquads();renderSquad();};return b;},
    (b,k)=>{const L=k==='custom'?{name:'Custom',desc:'Your own layout. Drag the dots.'}:cfg.presets[k];if(b.textContent!==L.name)b.textContent=L.name;b.title=L.desc;setAttr(b,'aria-pressed',q[cfg.field]===k);});
  $('#corner-note').textContent=cornerSide==='att'?'Your corner, taken from the top right. Drag a dot to make it Custom.':'Their corner, your goal on the right. Drag a dot to make it Custom.';
  drawCornerEditor(q);
  const c=q.cards[sqSlot],sum=c.st.reduce((a,b)=>a+b,0);
  if(!$('#fut-name'))$('#fut').innerHTML=shieldSVG('url(#cardGold)','#1a0b40')+`<div class="fnum"></div><div class="fpos"></div><input class="nm" id="fut-name" maxlength="16" spellcheck="false" autocomplete="off" aria-label="Player name" title="Tap to rename">`;
  $('#fut .fnum').textContent=NUMS[sqSlot];$('#fut .fpos').textContent=F.lab[sqSlot];
  {const ni=$('#fut-name'),slot=sqSlot,team=sqTeam;if(document.activeElement!==ni)ni.value=myNames[team][slot];ni.oninput=()=>{const v=ni.value.trim();myNames[team][slot]=v||NAMES[team][slot];saveNames(team);const tk=$('#mini').querySelectorAll('.tok')[slot];if(tk){tk.title=myNames[team][slot];tk.setAttribute('aria-label',`${F.lab[slot]} ${myNames[team][slot]}`);}};ni.onkeydown=e=>{if(e.key==='Enter')ni.blur();};ni.onblur=()=>{if(!ni.value.trim())ni.value=NAMES[team][slot];};}
  $('#pts-left').textContent=5-sum;
  uiList($('#stats'),STATS,(st,k)=>k,(st,k)=>{
    const row=document.createElement('div');row.className='stat';row.innerHTML=`<b>${st.name}</b><div class="starbtns"></div>`;row.title=st.desc;
    const sb=row.querySelector('.starbtns');
    for(let n=1;n<=3;n++){const btn=document.createElement('button');btn.textContent='★';btn.setAttribute('aria-label',`${st.name} ${n} star${n>1?'s':''}`);
      btn.onclick=()=>{const c=mySquads[sqTeam].cards[sqSlot],cur=c.st[k],want=cur===n?n-1:n,left=5-c.st.reduce((a,b)=>a+b,0);if(want-cur>left){squadNote('Out of points. Take a star from another stat first.');return;}c.st[k]=want;saveSquads();renderSquad();};sb.appendChild(btn);}
    return row;},
    (row,st,k)=>{row.querySelectorAll('.starbtns button').forEach((btn,j)=>{const on=c.st[k]>=j+1;if(btn.classList.contains('on')!==on)btn.className=on?'on':'';});});
  renderTree(q);
  if(net.named)net.named.presence({sq:serSquad(mySquads[0])}).catch(()=>{});
}
// one formation shield; made once and then only updated (its handlers read the squad when they run)
function squadTok(i){const b=document.createElement('button');b.className='tok';b.type='button';const mini=$('#mini');
  b.onclick=()=>{if(b.dataset.drag){delete b.dataset.drag;return;}sqSlot=i;renderSquad();};
  b.onpointerdown=e=>{if(e.button!==0)return;const q=mySquads[sqTeam],F=formOf(q),r=mini.getBoundingClientRect(),sx=e.clientX,sy=e.clientY;let moved=false;try{b.setPointerCapture(e.pointerId);}catch(_){}
    b.onpointermove=ev=>{if(!moved&&Math.hypot(ev.clientX-sx,ev.clientY-sy)<5)return;
      if(!moved){moved=true;if(q.form!=='custom'){q.cbase=q.form;q.cpos=F.pos.map(p=>p.slice());q.form='custom';$('#formations').querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-pressed',String(c.textContent==='Custom')));}}
      const lf=clamp((ev.clientX-r.left)/r.width,0,1),tf=clamp((ev.clientY-r.top)/r.height,0,1);
      const x=Math.round(clamp(lf*120-60,-57,29)*2)/2,z=Math.round(clamp(tf*78-39,-36,36)*2)/2;q.cpos[i]=[x,z];
      b.style.left=((x+60)/120*100)+'%';b.style.top=((z+39)/78*100)+'%';const sm=b.querySelector('small');if(sm)sm.textContent=roleLab(x,z);};
    b.onpointerup=b.onpointercancel=()=>{b.onpointermove=null;b.onpointerup=b.onpointercancel=null;if(moved){b.dataset.drag='1';saveSquads();setTimeout(renderSquad,0);}};};
  return b;}
function shieldSVG(fill,edge,cls){
  // one gold shield with a clean inner line
  return `<svg class="${cls||'shield'}" viewBox="0 0 100 112" aria-hidden="true"><path d="M50 3 L96 19 L91 71 L50 108 L9 71 L4 19 Z" fill="${fill}"/>`+
  `<path d="M50 12 L87 25 L83 66 L50 96 L17 66 L13 25 Z" fill="none" stroke="${edge}" stroke-opacity=".32" stroke-width="2" stroke-linejoin="miter"/></svg>`;
}
function bonusText(p){const b=BAL.paths[p];return STAT_KEYS.filter(k=>b[k]).map(k=>`${b[k]>0?'+':''}${b[k]} ${STATS[STAT_KEYS.indexOf(k)].name}`).join(', ')||'No bonus';}
function renderTree(q){
  const box=$('#tree');if(!box)return;
  const P={base:[50,12],att:[18,46],mid:[50,46],def:[82,46]},M={};MOMENT_ORDER.forEach((m,i)=>M[m]=[10+i*20,86]);
  let lines='';
  const ln=(a,b,col,on)=>{lines+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${on?col:'rgba(255,255,255,.18)'}" stroke-width="${on?3:2}" vector-effect="non-scaling-stroke"/>`;};
  PATH_KEYS.forEach(p=>{ln(P.base,P[p],'#ffffff',q.path===p);BAL.unlock[p].forEach(m=>ln(P[p],M[m],PATHS[p].col,q.path===p));});
  if(!box.querySelector('.tree-lines')){
    let h=`<svg class="tree-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>`;
    h+=`<div class="tnode base" style="left:${P.base[0]}%;top:${P.base[1]}%" title="Always unlocked. No bonus."><b>Base</b></div>`;
    PATH_KEYS.forEach(p=>{h+=`<button class="tnode path" data-path="${p}" style="left:${P[p][0]}%;top:${P[p][1]}%;--pc:${PATHS[p].col}"><b>+1</b><span>${PATHS[p].name}</span></button>`;});
    MOMENT_ORDER.forEach(m=>{h+=`<button class="tnode mom" data-m="${m}" style="left:${M[m][0]}%;top:${M[m][1]}%"><b>${SPECIALS[m].name}</b></button>`;});
    box.innerHTML=h;
    box.querySelectorAll('[data-path]').forEach(b=>b.onclick=()=>{const q=mySquads[sqTeam];q.path=b.dataset.path;fitSpecial(q);saveSquads();renderSquad();});
    box.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{const q=mySquads[sqTeam],m=b.dataset.m;if(!(BAL.unlock[q.path]||[]).includes(m)){squadNote('Pick a path that unlocks '+SPECIALS[m].name+' first.');return;}q.special=m;saveSquads();renderSquad();});}
  box.querySelector('.tree-lines').innerHTML=lines;
  box.querySelectorAll('[data-path]').forEach(b=>{const p=b.dataset.path,on=q.path===p;b.classList.toggle('on',on);setAttr(b,'aria-pressed',on);b.title=bonusText(p);});
  const open=BAL.unlock[q.path]||[];
  box.querySelectorAll('[data-m]').forEach(b=>{const m=b.dataset.m,ok=open.includes(m),on=ok&&q.special===m,who=PATH_KEYS.filter(p=>BAL.unlock[p].includes(m)).map(p=>PATHS[p].name).join(' or ')||'no path';
    b.classList.toggle('on',on);b.classList.toggle('locked',!ok);setAttr(b,'aria-pressed',on);if(ok)b.removeAttribute('aria-disabled');else b.setAttribute('aria-disabled','true');b.title=ok?SPECIALS[m].desc:'Unlocked by the '+who+' path';});
  const sd=SPECIALS[q.special],pp=PATHS[q.path];$('#spc-desc').innerHTML=`<b style="color:${pp.col}">${pp.name}</b>: ${bonusText(q.path)} for every player.<br>`+(open.length&&sd?`<b>${sd.name}</b>: ${sd.desc}`:'This path has no Moments yet.');
}
// corner editor: full pitch, attacking right, corner at top right
const CX=u=>226-u*1.8,CY=w=>80-w*1.8;
let cornerSide='att';
function drawCornerEditor(q){
  const cfg=CORNER_CFG[cornerSide],kit=KITS[kitSel[sqTeam]],opp=KITS[kitSel[1-sqTeam]],spots=cornerSpots(q,cfg);
  let g=`<rect width="236" height="160" fill="#1d5a2c"/>`;
  const band=(u0,u1,fill)=>`<rect x="${CX(u1)}" y="${CY(39)}" width="${(u1-u0)*1.8}" height="${78*1.8}" fill="${fill}"/>`;
  g+=band(0,30,'#2f8a45')+band(30,60,'#2a7a3d')+band(60,120,'#256c36');
  if(cornerSide==='def')g+=`<rect x="${CX(91)}" y="${CY(39)}" width="${2*1.8}" height="${78*1.8}" fill="#f2cf6b" fill-opacity=".35"/>`;
  g+=`<rect x="${CX(120)}" y="${CY(39)}" width="${120*1.8}" height="${78*1.8}" fill="none" stroke="#fff" stroke-opacity=".75"/>`;
  g+=`<line x1="${CX(60)}" y1="${CY(39)}" x2="${CX(60)}" y2="${CY(-39)}" stroke="#fff" stroke-opacity=".7"/><circle cx="${CX(60)}" cy="${CY(0)}" r="${9*1.8}" fill="none" stroke="#fff" stroke-opacity=".5"/>`;
  [30,90].forEach(u=>{g+=`<line x1="${CX(u)}" y1="${CY(39)}" x2="${CX(u)}" y2="${CY(-39)}" stroke="#fff" stroke-opacity=".55" stroke-dasharray="4 3"/>`;});
  [[0,18],[120,102]].forEach(([a,b2])=>{g+=`<rect x="${CX(Math.max(a,b2))}" y="${CY(22)}" width="${18*1.8}" height="${44*1.8}" fill="none" stroke="#fff" stroke-opacity=".5"/>`;});
  g+=`<rect x="${CX(0)}" y="${CY(8)}" width="4" height="${16*1.8}" fill="#fff"/><rect x="${CX(120)-4}" y="${CY(8)}" width="4" height="${16*1.8}" fill="#fff" fill-opacity=".6"/>`;
  cfg.zones.forEach(Z=>{const mid=Z.u[1]>100?90:Z.nm==='Line'?90:Z.nm==='Their half'?75:(Z.u[0]+Z.u[1])/2,y=Z.nm==='Line'?CY(36):CY(-35);g+=`<text x="${CX(mid)}" y="${y}" fill="#fff" fill-opacity=".9" font-size="6" text-anchor="middle">${Z.nm} · ${Z.n}</text>`;});
  const tk=cornerSide==='att'?kit.ui:opp.ui;
  g+=`<circle cx="${CX(1.2)}" cy="${CY(37.8)}" r="2.4" fill="#fff"/><circle cx="${CX(-1.6)}" cy="${CY(40.6)}" r="4.6" fill="${tk}" stroke="${cornerSide==='att'?'#f2cf6b':'#fff'}" stroke-width="1.6" fill-opacity="${cornerSide==='att'?1:.6}"/>`;
  g+=`<rect x="${CX(0)-3}" y="${CY(2.3)}" width="3" height="${4.6*1.8}" fill="${cornerSide==='def'?kit.ui:opp.ui}"/>`;
  spots.forEach(([u,w],k)=>{g+=`<circle data-k="${k}" cx="${CX(u)}" cy="${CY(w)}" r="5" fill="${kit.ui}" stroke="#fff" stroke-width="1.2"/>`;});
  $('#corner-prev').innerHTML=g;
}
{let dragK=-1;const el=$('#corner-prev');
  const pt=e=>{const p=el.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(el.getScreenCTM().inverse());};
  el.addEventListener('pointerdown',e=>{const t=e.target.closest('[data-k]');if(!t)return;e.preventDefault();dragK=+t.dataset.k;try{el.setPointerCapture(e.pointerId);}catch(_){}
    const cfg=CORNER_CFG[cornerSide],q=mySquads[sqTeam];if(q[cfg.field]!=='custom'){q[cfg.cc]=cornerSpots(q,cfg).map(a=>a.slice());q[cfg.field]='custom';renderSquad();}});
  el.addEventListener('pointermove',e=>{if(dragK<0)return;const cfg=CORNER_CFG[cornerSide],p=pt(e),q=mySquads[sqTeam];q[cfg.cc][dragK]=clampSpot(cfg,dragK,(226-p.x)/1.8,(80-p.y)/1.8);drawCornerEditor(q);});
  const end=()=>{if(dragK<0)return;dragK=-1;saveSquads();renderSquad();};
  el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
}
document.querySelectorAll('#corner-side .chip').forEach(b=>b.addEventListener('click',()=>{cornerSide=b.dataset.side;renderSquad();}));
function squadNote(t){const n=$('#squad-note');n.textContent=t;n.style.color='var(--warn)';clearTimeout(noteT);noteT=setTimeout(renderSquad,1800);}
document.querySelectorAll('#squad-team .chip').forEach(b=>b.addEventListener('click',()=>{sqTeam=+b.dataset.team;renderSquad();}));
$('#btn-reset-card').addEventListener('click',()=>{const d=defaultSquad(sqTeam);mySquads[sqTeam].cards[sqSlot].st=d.cards[sqSlot].st.slice();saveSquads();renderSquad();});
/* ================= balancing sheet ================= */
const BAL_PW='Admin123';
let balOpen=false,balDraft=null;
const r3=v=>Math.round(v*1000)/1000;
function balRows(){const r=[];STATS.forEach((st,i)=>{const k=STAT_KEYS[i];r.push([k,st.name]);Object.keys(EXTRA_MODS).filter(e=>EXTRA_MODS[e].of===k).forEach(e=>r.push([e,EXTRA_MODS[e].name]));});return r;}
const balPv=(k,x,n)=>k==='trkd'?r3(x.base+x.step*n)+'%':r3(x.base+x.step*n);
function renderBal(){
  $('#bal-lock').hidden=balOpen;$('#bal-edit').hidden=!balOpen;if(!balOpen)return;
  if(!balDraft)balDraft=cleanBal(BAL);
  const D=balDraft,dirty=JSON.stringify(D)!==JSON.stringify(BAL);
  $('#bal-save').disabled=!dirty;$('#bal-save').textContent=dirty?'Save':'Saved';
  let t='<thead><tr><th>Stat</th><th>Effect</th><th>Base</th><th>Per star</th><th>0★</th><th>1★</th><th>2★</th><th>3★</th></tr></thead><tbody>';
  balRows().forEach(([k,name])=>{const x=D.stats[k],pc=k==='trkd';t+=`<tr data-row="${k}"><th scope="row">${name}</th><td class="fx">${STAT_FX[k]}</td>`+
    `<td><input type="number" step="${pc?1:0.01}" data-s="${k}" data-f="base" value="${x.base}"></td><td><input type="number" step="${pc?1:0.005}" data-s="${k}" data-f="step" value="${x.step}"></td>`+
    [0,1,2,3].map(n=>`<td class="pv">${balPv(k,x,n)}</td>`).join('')+'</tr>';});
  $('#bal-stats').innerHTML=t+'</tbody>';
  let u='<thead><tr><th>Path</th>'+STATS.map(st=>`<th>${st.name}<small>bonus stars</small></th>`).join('')+MOMENT_ORDER.map(m=>`<th>${SPECIALS[m].name}<small>unlocks</small></th>`).join('')+'</tr></thead><tbody>';
  PATH_KEYS.forEach(p=>{u+=`<tr><th scope="row" style="color:${PATHS[p].col}">${PATHS[p].name}</th>`+STAT_KEYS.map(k=>`<td><input type="number" step="0.5" data-p="${p}" data-k="${k}" value="${D.paths[p][k]}"></td>`).join('')+
    MOMENT_ORDER.map(m=>`<td class="ck"><input type="checkbox" data-u="${p}" data-m="${m}" ${D.unlock[p].includes(m)?'checked':''} aria-label="${PATHS[p].name} unlocks ${SPECIALS[m].name}"></td>`).join('')+'</tr>';});
  $('#bal-paths').innerHTML=u+'</tbody>';
  $('#bal-eco').innerHTML='<thead><tr><th>Setting</th><th>When</th><th>Hobby</th></tr></thead><tbody>'+ECO_ROWS.map(([k,n,w])=>`<tr><th scope="row">${n}</th><td class="fx">${w}</td><td><input type="number" step="10" min="0" data-e="${k}" value="${D.eco[k]}"></td></tr>`).join('')+'</tbody>';
  $('#bal-eco-on').checked=!!D.eco.on;$('#bal-wallet').value=HOBBY.n||0;
  $('#bal-bar').innerHTML='<thead><tr><th>Event</th><th>When</th><th>Points</th></tr></thead><tbody>'+BAR_ROWS.map(([k,n,w])=>`<tr><th scope="row">${n}</th><td class="fx">${w}</td><td><input type="number" step="1" min="0" max="100" data-b="${k}" value="${D.bar[k]}"></td></tr>`).join('')+'</tbody>';
}
$('#bal-form').addEventListener('submit',e=>{e.preventDefault();const v=$('#bal-pw').value;$('#bal-pw').value='';
  if(v===BAL_PW){balOpen=true;balDraft=cleanBal(BAL);$('#bal-msg').textContent='';renderBal();}else{$('#bal-msg').textContent='Wrong password.';}});
$('#bal-edit').addEventListener('input',e=>{const el=e.target;if(!balDraft)return;
  if(el.dataset.s){const v=parseFloat(el.value);if(isFinite(v))balDraft.stats[el.dataset.s][el.dataset.f]=v;}
  else if(el.dataset.p){const v=parseFloat(el.value);if(isFinite(v))balDraft.paths[el.dataset.p][el.dataset.k]=v;}
  else if(el.dataset.e){const v=parseFloat(el.value);if(isFinite(v))balDraft.eco[el.dataset.e]=v;}
  else if(el.id==='bal-eco-on'){balDraft.eco.on=el.checked;}
  else if(el.dataset.b){const v=parseFloat(el.value);if(isFinite(v))balDraft.bar[el.dataset.b]=v;}
  else if(el.dataset.u){const p=el.dataset.u,set=new Set(balDraft.unlock[p]);el.checked?set.add(el.dataset.m):set.delete(el.dataset.m);balDraft.unlock[p]=MOMENT_ORDER.filter(m=>set.has(m));}
  balDraft=cleanBal(balDraft);
  // refresh previews and the save button without rebuilding the inputs being typed in
  BAL_KEYS.forEach(k=>{const row=$('#bal-stats').querySelector(`tr[data-row="${k}"]`),x=balDraft.stats[k];if(row)[0,1,2,3].forEach(n=>row.cells[4+n].textContent=balPv(k,x,n));});
  const dirty=JSON.stringify(balDraft)!==JSON.stringify(BAL);$('#bal-save').disabled=!dirty;$('#bal-save').textContent=dirty?'Save':'Saved';});
$('#bal-save').onclick=()=>{BAL=cleanBal(balDraft);store.set('baize.balance',JSON.stringify(BAL));mySquads.forEach(fitSpecial);saveSquads();renderSquad();renderBal();
  syncHobby();renderLook();renderCustom();
  const live=S.running&&S.phase!=='end'&&S.mode!=='online';if(live){MBAL=BAL;applySquadStats();}
  $('#bal-state').textContent=live?'Saved and applied to this match.':S.running&&S.mode==='online'?'Saved. Online matches use the host\'s values; yours apply from your next match.':'Saved. New values apply from the next kick-off.';};
$('#bal-wallet-set').onclick=()=>{const v=parseInt($('#bal-wallet').value,10);if(isFinite(v)){HOBBY.n=v;syncHobby();$('#bal-state').textContent='Wallet set to '+HOBBY.n+' Hobby.';}};
$('#bal-owned-reset').onclick=()=>{OWNED={field:[],table:[],trinket:[],banner:[],ball:[]};store.set('baize.owned',JSON.stringify(OWNED));$('#bal-state').textContent='Bought items are locked again (the first of each and the ones in use stay usable).';renderLook();renderCustom();};
$('#bal-reset').onclick=()=>{balDraft=cleanBal(null);renderBal();$('#bal-state').textContent='Defaults loaded. Save to keep them.';};
$('#bal-lockbtn').onclick=()=>{balOpen=false;balDraft=null;renderBal();};
$('#bal-copy').onclick=()=>{const txt=JSON.stringify(balDraft||BAL,null,1);try{navigator.clipboard.writeText(txt).then(()=>{$('#bal-state').textContent='Copied to the clipboard.';},()=>{$('#bal-state').textContent=txt;});}catch(e){$('#bal-state').textContent=txt;}};
function balApplyJson(txt){let o;try{o=JSON.parse(txt);}catch(e){$('#bal-state').textContent='That is not valid JSON.';return false;}
  if(!o||typeof o!=='object'||!(o.stats||o.paths||o.unlock)){$('#bal-state').textContent='No balancing values found in that JSON.';return false;}
  balDraft=cleanBal(o);renderBal();$('#bal-pastebox').hidden=true;$('#bal-state').textContent='Pasted. Check the values, then Save to keep them.';return true;}
$('#bal-paste').onclick=async()=>{let txt='';try{txt=await navigator.clipboard.readText();}catch(e){}
  if(txt&&txt.trim().startsWith('{')&&balApplyJson(txt))return;
  $('#bal-pastebox').hidden=false;$('#bal-json').value=txt||'';$('#bal-json').focus();$('#bal-state').textContent='Paste the JSON in the box, then Apply.';};
$('#bal-apply').onclick=()=>balApplyJson($('#bal-json').value);
$('#bal-cancel').onclick=()=>{$('#bal-pastebox').hidden=true;};
renderBal();
$('#stat-help').innerHTML=STATS.map(s=>`<li><b>${s.name}.</b> ${s.desc}</li>`).join('')+'<li><b>Points.</b> Each card has 5 points to spend, at most 3 stars per stat. One star is a very small boost, two is noticeable, three is strong.</li><li><b>Squad path.</b> Pick Attack, Midfield or Defense for the whole squad. The path adds a bonus to every player and decides which Moments you can choose.</li><li><b>Soft flicks.</b> Letting go plays the arrow, give or take a little under- or overshoot. Maestro tightens that.</li>'+Object.values(SPECIALS).map(s=>`<li><b>${s.name}.</b> ${s.desc}</li>`).join('');

