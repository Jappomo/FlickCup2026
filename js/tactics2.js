// My Club > Tactics, second layout (19 Nov 2026, from the Tactics B7 mockup with the B6 player editor).
// Three columns: the squad list (stars per stat, the path bonus in its colour, kick-off badges; a row opens its star
// editor under it), the pitch standing up (attack at the top; drag the figures for a Custom formation, a pad moves
// them like before), and Formation, Kick-off and the Squad path and Moment chart. The legend sits at the bottom of the list.
// The old Tactics page stays in the page, hidden: renderSquad still updates it, then this one is drawn.
// Script order: after touch.js, before start.js (renderSquad, squadNudge, squadMoveStart/End, uiConfirm and hubBack are wrapped).
const T2={open:-1,ko:-1,built:false,note:'',noteT:0};
const T2_STAT_AB=['SHT','PIN','MAE','B2B','TRK'];
const T2_MSHORT={finesse:'Finesse',bicycle:'Bicycle',maradona:'Maradona',thread:'Thread',moon:'Moon'};
const T2_MIC={finesse:'FIN',bicycle:'BCK',maradona:'MAR',thread:'TTN',moon:'MOON'};
const T2_PB={att:'+1 SHT',mid:'+½ MAE ½ B2B',def:'+1 PIN'};
const T2_STAR='<path d="M6 .8l1.6 3.4 3.7.4-2.8 2.5.8 3.7L6 9 2.7 10.8l.8-3.7L.7 4.6l3.7-.4z"/>';
// one star: kind 'own' (gold), 'bonus' (path colour), 'half' (left half in the path colour), 'empty'
function t2Star(kind,col){
  if(kind==='half')return `<svg class="t2s" viewBox="0 0 12 12" aria-hidden="true"><path class="e" d="M6 .8l1.6 3.4 3.7.4-2.8 2.5.8 3.7L6 9 2.7 10.8l.8-3.7L.7 4.6l3.7-.4z"/><path d="M6 .8V9L2.7 10.8l.8-3.7L.7 4.6l3.7-.4z" style="fill:${col}"/></svg>`;
  return `<svg class="t2s ${kind==='empty'?'e':''}" viewBox="0 0 12 12" aria-hidden="true"${kind==='bonus'?` style="fill:${col}"`:''}>${T2_STAR}</svg>`;}
// own stars, then the squad path's bonus for that stat (every figure gets it), then empty places up to 3
function t2Stars(own,bonus,col){let h='',n=0;for(let i=0;i<own;i++){h+=t2Star('own');n++;}
  if(bonus>=1){for(let i=0;i<Math.floor(bonus);i++){h+=t2Star('bonus',col);n++;}}if(bonus%1)h+=t2Star('half',col),n++;
  while(n<3){h+=t2Star('empty');n++;}return h;}
const t2Bonus=(q,k)=>{const p=BAL.paths[q.path];return p?Math.max(0,p[k]||0):0;};
// rows top to bottom: defenders first (own goal), then midfield, then attack; left to right inside a line
function t2Order(F){return [0,1,2,3,4,5,6,7,8,9].sort((a,b)=>(kRole(F.pos[a])===kRole(F.pos[b])?0:F.pos[a][0]-F.pos[b][0])||F.pos[a][1]-F.pos[b][1]);}
function t2Build(){
  const host=$('#club-tactics');if(!host||T2.built)return !!host;T2.built=true;host.classList.add('t2on');
  const el=document.createElement('div');el.id='t2';el.className='t2';
  el.innerHTML=`<section class="cardbox t2-squad" data-ui="tactics-squad" aria-label="Squad">
      <div class="t2-head"><div><p class="h">Squad</p><h2 class="t2-club" id="t2-club"></h2></div><div class="t2-pts" id="t2-pts"></div></div>
      <div class="t2-cols" aria-hidden="true"><span>No</span><span>Figure</span><span>Role</span><span>Pts</span><span class="t2-sc">${T2_STAT_AB.map(a=>`<i>${a}</i>`).join('')}</span></div>
      <div class="t2-list" id="t2-list"></div>
      <div class="t2-legend" aria-hidden="true"><span>${t2Star('own')} Your stars</span><span><i class="t2-pathsw"></i> Path bonus</span><span>${t2Star('half','var(--t2pc)')} Half bonus</span><span><b class="t2-kb">1</b> Kick-off</span></div>
    </section>
    <section class="t2-pitchbox" data-ui="tactics-pitch" aria-label="Formation on the pitch">
      <div class="t2-pitch" id="t2-pitch"><svg class="t2-lines" viewBox="0 0 78 120" preserveAspectRatio="none" aria-hidden="true">
        <rect x=".6" y=".6" width="76.8" height="118.8"/><line x1="0" y1="60" x2="78" y2="60"/><circle cx="39" cy="60" r="9.5"/><circle cx="39" cy="60" r=".7" class="d"/>
        <rect x="17" y=".6" width="44" height="18"/><rect x="29" y=".6" width="20" height="6"/><rect x="17" y="101.4" width="44" height="18"/><rect x="29" y="113.4" width="20" height="6"/></svg>
        <span class="t2-gk" aria-hidden="true">1</span></div>
    </section>
    <aside class="t2-side" aria-label="Setup">
      <div class="cardbox" data-ui="tactics-formation"><p class="h">Formation</p><div class="t2-forms" id="t2-forms"></div></div>
      <div class="cardbox" data-ui="tactics-kickoff"><p class="h">Kick-off</p><div class="t2-ko" id="t2-ko"></div></div>
      <div class="cardbox t2-pathbox" data-ui="tactics-path"><p class="h">Squad path and Moment</p><div class="t2-tree" id="t2-tree"></div>
        <div class="t2-mom"><div class="t2-mom-h"><b id="t2-mname"></b><span id="t2-pname"></span></div><p id="t2-mdesc"></p><p class="t2-pb" id="t2-pbon"></p></div></div>
    </aside>`;
  host.appendChild(el);
  // pitch: one button per figure (made once, then only updated)
  const P=$('#t2-pitch');
  for(let i=0;i<10;i++){const b=document.createElement('button');b.type='button';b.className='t2-tok';b.dataset.i=i;P.appendChild(b);t2TokEvents(b,i);}
  // the path chart: base, three paths, five Moments; lines drawn in an SVG under them
  const tr=$('#t2-tree');let h='<svg class="t2-tl" viewBox="0 0 330 300" preserveAspectRatio="none" aria-hidden="true"></svg><div class="t2-base" id="t2-base"></div>';
  PATH_KEYS.forEach(p=>{h+=`<button type="button" class="t2-path" data-path="${p}" style="--pc:${PATHS[p].col}"><b>${PATHS[p].name}</b><small>${T2_PB[p]}</small></button>`;});
  MOMENT_ORDER.forEach(m=>{h+=`<button type="button" class="t2-mnode" data-m="${m}"><b>${T2_MIC[m]}</b></button><span class="t2-ml" data-ml="${m}">${T2_MSHORT[m]}</span>`;});
  tr.innerHTML=h;
  tr.querySelectorAll('[data-path]').forEach(b=>b.onclick=()=>{const q=mySquads[sqTeam];q.path=b.dataset.path;fitSpecial(q);saveSquads();renderSquad();});
  tr.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{const q=mySquads[sqTeam],m=b.dataset.m;if(!(BAL.unlock[q.path]||[]).includes(m)){t2Note('Needs another path');sfx&&sfx('clack',10);return;}q.special=m;saveSquads();renderSquad();});
  // pad: groups and links for the new page (kept when data/ui.json is applied again)
  const G=[['#t2-list','col'],['.t2-stat','row'],['.t2-edfoot','row'],['#t2-pitch','map'],['#t2-forms','grid'],['#t2-ko','row'],['#t2-tree','map']];
  const L=[['#t2-list',{r:'#t2-pitch'}],['.t2-ed',{r:'#t2-pitch'}],['#t2-pitch',{l:'#t2-list',r:'#t2-forms'}],['#t2-forms',{l:'#t2-pitch',d:'#t2-ko'}],['#t2-ko',{l:'#t2-pitch',u:'#t2-forms',d:'#t2-tree'}],['#t2-tree',{l:'#t2-pitch',u:'#t2-ko'}]];
  [UI_GROUPS,UI_NAV_BASE.groups].forEach(a=>a.unshift(...G));[UI_LINKS,UI_NAV_BASE.links].forEach(a=>a.unshift(...L));
  [UI_DEFAULT,UI_NAV_BASE.def].forEach(d=>{d.squad=['#t2-list .t2-row.sel',...(d.squad||[])];});
  return true;}
function t2Note(t){T2.note=t;clearTimeout(T2.noteT);T2.noteT=setTimeout(()=>{T2.note='';t2Pts();},1800);t2Pts();}
function t2Pts(){const el=$('#t2-pts');if(!el)return;const q=mySquads[sqTeam],used=q.cards.reduce((a,c)=>a+c.st.reduce((x,y)=>x+y,0),0);
  el.classList.toggle('warn',!!T2.note);el.innerHTML=T2.note?T2.note:`Points <b>${used}</b> / 50`;}
// pitch spot (whole pitch x -60..60 attacking up, z -39..39) to % inside the standing pitch
const t2At=p=>({l:(p[1]+39)/78*100,t:(60-p[0])/120*100});
function t2TokEvents(b,i){const P=$('#t2-pitch');
  b.onclick=()=>{if(b.dataset.drag){delete b.dataset.drag;return;}t2Pick(i);};
  b.onpointerdown=e=>{if(e.button!==0||T2.ko>=0)return;const q=mySquads[sqTeam],F=formOf(q),r=P.getBoundingClientRect(),sx=e.clientX,sy=e.clientY;let moved=false;try{b.setPointerCapture(e.pointerId);}catch(_){}
    b.onpointermove=ev=>{if(!moved&&Math.hypot(ev.clientX-sx,ev.clientY-sy)<5)return;
      if(!moved){moved=true;if(q.form!=='custom'){q.cbase=FORMATIONS[q.form]?q.form:'4-4-2';q.cpos=F.pos.map(p=>p.slice());q.form='custom';}}
      const lf=clamp((ev.clientX-r.left)/r.width,0,1),tf=clamp((ev.clientY-r.top)/r.height,0,1);
      const x=Math.round(clamp(60-tf*120,-57,29)*2)/2,z=Math.round(clamp(lf*78-39,-36,36)*2)/2;q.cpos[i]=[x,z];
      const a=t2At([x,z]);b.style.left=a.l+'%';b.style.top=a.t+'%';};
    b.onpointerup=b.onpointercancel=()=>{b.onpointermove=null;b.onpointerup=b.onpointercancel=null;if(moved){b.dataset.drag='1';saveSquads();setTimeout(renderSquad,0);}};};}
// a figure picked on the list or the pitch: while choosing a kick-off figure it fills that slot, else it is selected
function t2Pick(i){
  if(T2.ko>=0){const q=mySquads[sqTeam],F=formOf(q),slot=T2.ko,p=F.kop.slice(),o=1-slot;
    if(kRole(F.pos[i])==='def'){t2Note('No defenders at kick-off');sfx&&sfx('clack',10);return;}
    p[slot]=i;if(p[o]===i)p[o]=F.kop[slot];
    if(!kopOk(p,F.pos)){let fix=null;for(let j=0;j<10&&!fix;j++){if(j===i)continue;const c=p.slice();c[o]=j;if(kopOk(c,F.pos))fix=c;}if(!fix){t2Note('Needs a striker');return;}p.splice(0,2,...fix);}
    q.kop=p;T2.ko=-1;saveSquads();renderSquad();t2FocusRow(i);return;}
  if(sqSlot===i&&T2.open===i){T2.open=-1;}else{sqSlot=i;T2.open=i;}renderSquad();t2FocusRow(i,T2.open===i);}
function t2FocusRow(i,intoEditor){requestAnimationFrame(()=>{if(typeof uiSet!=='function'||typeof UI==='undefined'||!UI.layer)return;
  const t=intoEditor?$('#t2-list .t2-stat button'):$(`#t2-list .t2-row[data-i="${i}"]`);if(t&&uiUsable(t))uiSet(t,{src:'silent',scroll:true});});}
function t2Render(){
  if(hubTab!=='squad'||!t2Build())return;
  const q=mySquads[sqTeam],F=formOf(q),col=PATHS[q.path]?PATHS[q.path].col:'#fff',koOn=T2.ko>=0;
  $('#t2').style.setProperty('--t2pc',col);$('#t2').classList.toggle('kopick',koOn);
  $('#t2-club').textContent=q.name||KITS[kitSel[sqTeam]].name;t2Pts();
  // list rows + the open player's editor
  const list=$('#t2-list'),ord=t2Order(F);let h='';
  ord.forEach(i=>{const c=q.cards[i],kp=F.kop.indexOf(i),def=kRole(F.pos[i])==='def',dim=(koOn&&def)||(T2.open>=0&&T2.open!==i&&!koOn);
    h+=`<button type="button" class="t2-row${i===sqSlot?' sel':''}${dim?' dim':''}${T2.open===i?' open':''}" data-i="${i}" aria-pressed="${i===sqSlot}" aria-expanded="${T2.open===i}"><span class="t2-no">${NUMS[i]}</span><span class="t2-nm">${esc2(myNames[sqTeam][i])}${kp>=0?`<b class="t2-kb">${kp+1}</b>`:''}</span><span class="t2-ro">${F.lab[i]}</span><span class="t2-pt">${c.st.reduce((a,b)=>a+b,0)}/5</span><span class="t2-sc">${STAT_KEYS.map((k,j)=>`<i>${t2Stars(c.st[j],t2Bonus(q,k),col)}</i>`).join('')}</span></button>`;
    if(T2.open===i&&!koOn){const sum=c.st.reduce((a,b)=>a+b,0);
      h+=`<div class="t2-ed" role="group" aria-label="${esc2(myNames[sqTeam][i])}: stars">${STATS.map((st,j)=>{const bn=t2Bonus(q,st.k);
        return `<div class="t2-stat" data-k="${j}"><span class="t2-ab">${T2_STAT_AB[j]}</span><span class="t2-sn">${st.name}</span><span class="t2-pips">${[1,2,3].map(n=>`<button type="button" data-n="${n}" aria-label="${st.name} ${n} star${n>1?'s':''}" aria-pressed="${c.st[j]>=n}">${t2Star(c.st[j]>=n?'own':'empty')}</button>`).join('')}</span><span class="t2-bn">${bn?`${t2Star(bn%1?'half':'bonus',col)} +${bn%1?'½':bn}`:''}</span></div>`;}).join('')}
        <div class="t2-edfoot"><input class="t2-name" id="t2-name" maxlength="16" spellcheck="false" autocomplete="off" aria-label="Player name" value="${esc2(myNames[sqTeam][i])}"><button type="button" class="chip" id="t2-reset">Reset</button><span class="t2-left">Points <b>${sum}</b> / 5</span></div></div>`;}});
  list.innerHTML=h;
  list.querySelectorAll('.t2-row').forEach(r=>r.onclick=()=>t2Pick(+r.dataset.i));
  list.querySelectorAll('.t2-stat').forEach(r=>{const k=+r.dataset.k;r.querySelectorAll('[data-n]').forEach(btn=>btn.onclick=()=>{const n=+btn.dataset.n,c=mySquads[sqTeam].cards[sqSlot],cur=c.st[k],want=cur===n?n-1:n,left=5-c.st.reduce((a,b)=>a+b,0);
    if(want-cur>left){t2Note('Out of points');sfx&&sfx('clack',10);return;}c.st[k]=want;saveSquads();renderSquad();
    requestAnimationFrame(()=>{const b=$(`#t2-list .t2-stat[data-k="${k}"] [data-n="${n}"]`);if(b&&typeof uiSet==='function'&&UI.layer)uiSet(b,{src:'silent'});});});});
  {const ni=$('#t2-name');if(ni){const slot=sqSlot,team=sqTeam;ni.oninput=()=>{const v=ni.value.trim();myNames[team][slot]=v||NAMES[team][slot];saveNames(team);const r=$(`#t2-list .t2-row[data-i="${slot}"] .t2-nm`);if(r&&r.firstChild)r.firstChild.textContent=myNames[team][slot];};ni.onkeydown=e=>{if(e.key==='Enter')ni.blur();};ni.onblur=()=>{if(!ni.value.trim())ni.value=NAMES[team][slot];};}
    const rs=$('#t2-reset');if(rs)rs.onclick=()=>{const d=defaultSquad(sqTeam);mySquads[sqTeam].cards[sqSlot].st=d.cards[sqSlot].st.slice();saveSquads();renderSquad();};}
  // pitch
  const P=$('#t2-pitch');P.querySelectorAll('.t2-tok').forEach(b=>{const i=+b.dataset.i,p=F.pos[i],a=t2At(p),kp=F.kop.indexOf(i),c=q.cards[i],top=Math.max(...c.st),def=kRole(p)==='def';
    if(!b.classList.contains('moving')){b.style.left=a.l+'%';b.style.top=a.t+'%';}
    const html=`<b>${NUMS[i]}</b>${kp>=0?`<i class="t2-kb">${kp+1}</i>`:''}<small>${top?Array(top).fill(t2Star('own')).join(''):''}</small>`;
    if(b.dataset.h!==html){b.dataset.h=html;b.innerHTML=html;}
    b.classList.toggle('sel',i===sqSlot);b.classList.toggle('no',koOn&&def);b.classList.toggle('can',koOn&&!def&&kp<0);
    setAttr(b,'aria-pressed',i===sqSlot);setAttr(b,'aria-label',`${NUMS[i]} ${F.lab[i]} ${myNames[sqTeam][i]}`);});
  // formation
  const fr=$('#t2-forms');if(!fr.children.length){Object.keys(FORMATIONS).concat('custom').forEach(f=>{const b=document.createElement('button');b.type='button';b.className='chip';b.dataset.f=f;b.textContent=f==='custom'?'Custom':f;
      b.onclick=()=>{const q=mySquads[sqTeam];if(f==='custom'){if(q.form!=='custom'){if(!q.cpos||q.cpos.length!==10){q.cbase=FORMATIONS[q.form]?q.form:'4-4-2';q.cpos=FORMATIONS[q.cbase].pos.map(p=>p.slice());}q.form='custom';}}else q.form=f;saveSquads();renderSquad();};fr.appendChild(b);});}
  fr.querySelectorAll('[data-f]').forEach(b=>setAttr(b,'aria-pressed',q.form===b.dataset.f));
  // kick-off slots
  const ko=$('#t2-ko');ko.innerHTML=[0,1].map(s=>{const i=F.kop[s];return `<button type="button" class="t2-kos${T2.ko===s?' pick':''}" data-s="${s}" aria-pressed="${T2.ko===s}"><b class="t2-kb">${s+1}</b><span>${T2.ko===s?'Pick one':`${NUMS[i]} ${esc2(myNames[sqTeam][i])}`}</span><small>${s?'Partner':'Kicker'}</small></button>`;}).join('')+
    `<div class="t2-korule${koOn?'':' hide'}" aria-hidden="true"><span class="ok">1+ ST</span><span class="ok">Max 1 MID</span><span class="no">No DEF</span></div>`;
  ko.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{const s=+b.dataset.s;T2.ko=T2.ko===s?-1:s;T2.open=-1;renderSquad();if(T2.ko>=0)t2FocusRow(F.kop[s]);});
  // path chart
  // positions in % of the chart box (the lines are drawn in a 100 x 100 box stretched over it, like the old tree)
  const tr=$('#t2-tree');
  const base=[50,8],PP={att:[17,40],mid:[50,40],def:[83,40]},MM={};MOMENT_ORDER.forEach((m,j)=>MM[m]=[10+j*20,80]);
  t2Lines(q,base,PP,MM);requestAnimationFrame(()=>t2Lines(q,base,PP,MM));
  const bs=$('#t2-base');bs.textContent=q.name||KITS[kitSel[sqTeam]].name;bs.style.left=base[0]+'%';bs.style.top=base[1]+'%';
  const open=BAL.unlock[q.path]||[];
  tr.querySelectorAll('[data-path]').forEach(b=>{const p=b.dataset.path;b.style.left=PP[p][0]+'%';b.style.top=PP[p][1]+'%';b.classList.toggle('on',q.path===p);setAttr(b,'aria-pressed',q.path===p);b.title=bonusText(p);});
  tr.querySelectorAll('[data-m]').forEach(b=>{const m=b.dataset.m,ok=open.includes(m);b.style.left=MM[m][0]+'%';b.style.top=MM[m][1]+'%';b.classList.toggle('on',q.special===m);b.classList.toggle('off',!ok);setAttr(b,'aria-pressed',q.special===m);setAttr(b,'aria-label',SPECIALS[m].name+(ok?'':' (needs another path)'));b.title=SPECIALS[m].name;
    const l=tr.querySelector(`[data-ml="${m}"]`);l.style.left=MM[m][0]+'%';l.style.top=`calc(${MM[m][1]}% + 31px)`;l.classList.toggle('off',!ok);});
  $('#t2-mname').textContent=SPECIALS[q.special]?SPECIALS[q.special].name:'';$('#t2-pname').textContent=(PATHS[q.path]||{name:''}).name+' path';
  $('#t2-mdesc').textContent=SPECIALS[q.special]?SPECIALS[q.special].desc:'';$('#t2-pbon').textContent='Path bonus: '+bonusText(q.path)+' for every figure';
}
// the chart's lines (100 x 100 box over the chart); the ends stop at the nodes' edges, which are in px
function t2Lines(q,base,PP,MM){const tr=$('#t2-tree');if(!tr)return;const ky=100/(tr.clientHeight||300);
  let ln='';const cv=(a,b,col,on,dash)=>{const my=(a[1]+b[1])/2;ln+=`<path d="M${a[0]} ${a[1]} C${a[0]} ${my},${b[0]} ${my},${b[0]} ${b[1]}" fill="none" stroke="${on?col:'rgba(241,228,198,.14)'}" stroke-width="${on?3.5:1.6}" vector-effect="non-scaling-stroke"${dash&&!on?' stroke-dasharray="3 5"':''}/>`;};
  PATH_KEYS.forEach(p=>cv([base[0],base[1]+14*ky],[PP[p][0],PP[p][1]-22*ky],'#f1e4c6',q.path===p));
  PATH_KEYS.forEach(p=>(BAL.unlock[p]||[]).forEach(m=>cv([PP[p][0],PP[p][1]+22*ky],[MM[m][0],MM[m][1]-28*ky],PATHS[p].col,q.path===p,true)));
  const svg=tr.querySelector('.t2-tl');svg.setAttribute('viewBox','0 0 100 100');svg.innerHTML=ln;
}
const esc2=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
{const base=renderSquad;renderSquad=function(){const r=base.apply(this,arguments);try{t2Render();}catch(e){console.error('[tactics2]',e);}return r;};}
// leaving the page closes the editor and the kick-off pick
{const base=setClubSec;setClubSec=function(sec){if(sec!=='tactics'){T2.open=-1;T2.ko=-1;}return base.apply(this,arguments);};}
// B closes the open editor / the kick-off pick before leaving the page
{const base=hubBack;hubBack=function(){if(hubTab==='squad'&&clubSec==='tactics'&&(T2.ko>=0||T2.open>=0)){const i=T2.ko>=0?formOf(mySquads[sqTeam]).kop[T2.ko]:T2.open;T2.ko=-1;T2.open=-1;renderSquad();t2FocusRow(i);return true;}return base.apply(this,arguments);};}
// pad: A on a figure on the pitch picks it up (like before); the stick or D-pad moves it, A/B/X puts it down
{const base=uiConfirm;uiConfirm=function(src){const el=typeof UI!=='undefined'&&UI.cur;if(src==='pad'&&el&&el.classList&&el.classList.contains('t2-tok')&&uiUsable(el)&&T2.ko<0){uiSnd.ok();squadMoveStart(+el.dataset.i);return;}return base.apply(this,arguments);};}
// the pad's move works on the standing pitch: up is attack (x+), right is z+
{const bN=squadNudge,bS=squadMoveStart,bE=squadMoveEnd;
  squadNudge=function(i,dx,dz){if(!T2.built)return bN.apply(this,arguments);const q=mySquads[sqTeam],F=formOf(q);
    if(q.form!=='custom'){q.cbase=FORMATIONS[q.form]?q.form:'4-4-2';q.cpos=F.pos.map(p=>p.slice());q.form='custom';}
    const p=q.cpos[i];p[0]=clamp(p[0]-dz,-57,29);p[1]=clamp(p[1]+dx,-36,36);
    const b=$(`#t2-pitch .t2-tok[data-i="${i}"]`);if(b){const a=t2At(p);b.style.left=a.l+'%';b.style.top=a.t+'%';}};
  squadMoveStart=function(i){if(!T2.built)return bS.apply(this,arguments);sqSlot=i;tokMove=i;T2.open=-1;renderSquad();const b=$(`#t2-pitch .t2-tok[data-i="${i}"]`);if(b)b.classList.add('moving');};
  squadMoveEnd=function(){if(!T2.built)return bE.apply(this,arguments);const i=tokMove;tokMove=-1;document.querySelectorAll('#t2-pitch .t2-tok.moving').forEach(t=>t.classList.remove('moving'));
    const q=mySquads[sqTeam];if(q.cpos)q.cpos=q.cpos.map(([x,z])=>[Math.round(x*2)/2,Math.round(z*2)/2]);saveSquads();renderSquad();
    const b=$(`#t2-pitch .t2-tok[data-i="${i}"]`);if(b&&typeof uiSet==='function'&&UI.layer)uiSet(b,{src:'silent'});};}
window.addEventListener('resize',()=>{if(T2.built&&hubTab==='squad'&&clubSec==='tactics')t2Render();});
