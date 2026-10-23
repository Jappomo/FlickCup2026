// Flick Cup 2026 · js/hud.js
// Scoreboard and match HUD.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= HUD ================= */
function fmtClock(s){if(S.golden)return 'GG';s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
let lastClockTxt='';
function myMomentTeam(){if(S.mode==='practice'||S.mode==='tutorial')return 0;if(S.mode==='online')return net.myTeam;if(S.mode==='cpu')return 1-cpuTeam;return S.active;}
function updateHud(){renderLog();
  lastClockTxt=fmtClock(S.clock);$('#clock').textContent=lastClockTxt;
  for(let t=0;t<2;t++){$('#ab'+t).textContent=AB(t);$('#k'+t).style.background=kitOf(t).ui;$('#s'+t).textContent=S.score[t];$('#sbt'+t).classList.toggle('poss',S.running&&S.poss===t);
    $('#bar'+t).style.width=(S.bar[t]/BAR_MAX*100)+'%';$('#mb'+t).classList.toggle('full',S.bar[t]>=BAR_MAX);}
  $('#half').textContent=S.golden?'Golden goal':S.timeUp?'Last turn':S.half===1?'1st half':'2nd half';
  const lockTxt=(S.phase==='attack'&&S.lastFigCount>=3)?' · figure resting':'';
  const tot=SETUP[S.setupKind]||0;
  $('#flickc').textContent=!S.running||S.phase==='end'?'':S.phase==='take'?'Pick a taker':S.setupKind?`Positional ${tot-S.setupLeft}/${tot}`:`Flick ${S.flicks+1}${lockTxt}`;
  const pr=$('#prompt');
  if(!S.running||S.phase==='idle'){pr.hidden=true;}
  else if(!subLock){
    pr.hidden=false;let t='',s='';const A=N(S.active),mine=controls(S.active);
    const what=SP_NAME[S.setupKind]||'Free kick';
    const armedMine=S.armed&&S.armedTeam===S.active;
    if(armedMine&&(S.phase==='attack'||S.phase==='defend')){t=SPECIALS[S.armed].name+(mine?'':` · ${A}`);s=mine?{finesse:'Pick the curl side, then flick through the ball.',maradona:'Flick into the ball: figure and ball run on together.',bicycle:'Play the ball off a teammate in the shooting area.',thread:'Aim the pass into space; the gold ring shows who runs.',moon:'Hit the ball with your block flick to clear it.'}[S.armed]:'';}
    else if(S.phase==='take'){t=mine?`${what}: pick your taker`:`${A} picking a taker`;s=mine?'Tap a figure, then one of the three rings (or press 1, 2, 3).':'';}
    else if(S.phase==='attack'&&S.setupKind&&S.setupLeft>0){t=mine?`${what}: reposition or take it`:`${A} setting up`;s=mine?`${S.setupLeft} positional flick${S.setupLeft>1?'s':''} left with your other figures, or take it with the taker.`:'';}
    else if(S.phase==='attack'&&S.setupKind){t=mine?`Take the ${what.toLowerCase()}`:`${A} taking the ${what.toLowerCase()}`;s=mine?'Only the taker can play now.':'';}
    else if(S.phase==='attack'&&S.koPend){t=mine?'Kick-off':`${A} kicking off`;s=mine?'Pass it: the kicker cannot play the next flick.':'';}
    else if(S.phase==='attack'){t=mine?(S.mode==='local'?`${A} in possession`:'Your flick'):`${A} lining up`;s=mine?'Hit the ball first and keep it off their figures.':'';}
    else if(S.phase==='defend'){t=mine?(S.mode==='local'?`${A}: block or skip`:'Block or skip'):`${A} may block`;s=mine?'Do not touch the ball. Drag your keeper too.':'';}
    else if(S.phase==='goal')t='Goal';else if(S.phase==='break')t='Half-time';else if(S.phase==='end')t='Full-time';
    if(ptr.on&&ptr.mode==='pull'&&mine)s=lastInput==='touch'?'Tap with a second finger to cancel.':'Right-click or Esc to cancel.';
    $('#ptitle').textContent=t;$('#psub').textContent=s;$('#ptitle').style.borderLeftColor=kitOf(S.active).ui;
  }
  $('#btn-skip').hidden=!(localTurn()&&S.phase==='defend');
  {const gs=localTurn()?gkState(S.active):null;$('#btn-gk').hidden=!gs;if(gs)$('#gk-lbl').textContent=gs.label;}
  const mt=myMomentTeam(),mb=$('#btn-moment');
  if(!S.running||S.phase==='end'||mt==null||S.noMoments){mb.hidden=true;}
  else{
    mb.hidden=false;$('#mname').textContent=SPECIALS[matchSquads[mt].special].name;
    $('#barme').style.width=(S.bar[mt]/BAR_MAX*100)+'%';
    const armed=S.armed&&S.armedTeam===mt,full=S.bar[mt]>=BAR_MAX,ok=full&&localTurn()&&S.active===mt&&momentOk(mt);
    mb.classList.toggle('armed',!!armed);mb.classList.toggle('ready',!armed&&ok);
    $('#mstate').textContent=armed?'Active on your next flick':ok?'Ready: tap to use':full?momentWhy(mt):`${Math.round(S.bar[mt])}%`;
    mb.disabled=!ok;
  }
  $('#curl').hidden=!(S.armed==='finesse'&&localTurn()&&S.armedTeam===S.active&&S.phase==='attack');
  $('#net-banner').hidden=!(S.mode==='online'&&S.running&&S.phase!=='end'&&net.myTeam!=null&&!oppPeer());
  updateGlyphs();
  drillHud();
}
function setInput(k){if(lastInput===k)return;lastInput=k;updateGlyphs();if(typeof TITLE!=='undefined'&&TITLE.on)titleMsg();}
function updateGlyphs(){
  const pad=lastInput==='pad',touch=lastInput==='touch';document.body.classList.toggle('padmode',pad);
  const g=(id,padTxt,keyTxt,cls)=>{const el=$(id);el.textContent=pad?padTxt:keyTxt;el.className='glyph'+(pad&&cls?' '+cls:'');el.hidden=touch;};
  g('#g-skip','B','Space','b');g('#g-cam','R3','C','');g('#g-menu','≡','Esc','');g('#mglyph','X','M','x');
  // keeper out is RB + Y on a controller: both icons for the pad in use (controls.js), written out here
  g('#g-gk',typeof padLabel==='function'?padLabel(5)+'+'+padLabel(3):'RB+Y','G','');
  $('#g-lb').hidden=false;$('#g-rb').hidden=false;$('#g-lb').style.visibility=$('#g-rb').style.visibility=pad?'visible':'hidden';
}
function showMeter(p){const m=$('#meter');if(p<0){m.hidden=true;return;}m.hidden=false;$('#meter-fill').style.height=(clamp(p,0,1)*100)+'%';$('#meter-snap').style.bottom=(clamp(p*4/3,0,1)*100)+'%';}
function showFT(){
  const a=S.score[0],b=S.score[1];
  if(S.tour)tourMatchOver();
  const tourOn=!!(S.tour||(net.tourMatch&&net.tourMatch.watch));$('#btn-rematch').hidden=tourOn;$('#btn-ft-menu').textContent=tourOn?'Back to tournament':'Main menu';
  $('#ft-title').textContent=a===b?'Honours even':(a>b?N(0):N(1))+' win';
  $('#ft-score').textContent=a+' - '+b;
  let note=S.mode==='online'&&net.myTeam===1?'Home can start a rematch.':'';
  if(S.mode==='cpu'&&!S.tour&&!S.paid&&ecoOn()){S.paid=true;const me=1-cpuTeam,r=S.conceded?0:a===b?BAL.eco.draw:S.score[me]>S.score[1-me]?BAL.eco.win:BAL.eco.lose;
    if(r>0){earn(r,a===b?'Draw':S.score[me]>S.score[1-me]?'Victory':'Good game');note=`+${r} Hobby`;}else if(S.conceded)note='No Hobby for a conceded match.';}
  $('#ft-note').textContent=note;
  $('#btn-rematch').disabled=S.mode==='online'&&net.myTeam!==0;
  setTimeout(()=>{if(S.phase==='end'){$('#ft').hidden=false;music.menu(true);applyVolumes();}},1600);
}

