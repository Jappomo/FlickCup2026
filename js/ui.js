// Flick Cup 2026 · js/ui.js
// The menu UI system (agreed 23 Oct 2026). Every menu screen goes through it, with seven rules:
//  1. One focus, always visible. One ring (#ui-ring) frames the selected control, glides from item to item and ticks.
//  2. Mouse and pad drive the same focus. Hovering moves the ring the stick moves (and so does the right-stick pointer).
//  3. Explicit navigation. A screen is made of groups (UI_GROUPS: rows, columns, grids). Inside a group a move goes by
//     order; at its edge it follows the screen's links (UI_LINKS), else up/down go to the previous/next group on the page.
//     Nothing is picked by "what is nearest on screen", except on the two drawn maps (formation pitch, path tree).
//  4. A screen stack. Kick-off pushes in from the right, B pops it back. Every page (tab + section) remembers its focus
//     and scroll, so switching away and back never resets anything.
//  5. Update, never rebuild. uiList() (menus.js) updates lists in place; where a screen still rebuilds its markup, the
//     focus is found again by its address (id, data-* attributes, or its place in a parent with an id).
//  6. One input layer. Keyboard, mouse and every pad land in UI.move / confirm / back / tab / section. Held directions
//     repeat and speed up; the prompt bar (#ui-bar) swaps its button icons the moment another device is touched.
//  7. Feedback on every press: a press animation, and a sound for confirm, back and anything you can't do.
// Keyboard: arrows move, Enter/Space confirm, Esc/Backspace back, Q/E tabs (clubs on Kick-off), Z/C sections.
// The tab bar and the section bars are not in the D-pad / arrow navigation: LB/RB (Q/E) switch tabs, LT/RT (Z/C)
// switch sections, and the mouse clicks them. The focus only ever moves through a page's own controls.
// Loaded by index.html after club.js, as a classic script: every file shares one scope.
'use strict';
const UI_FOC='button,input:not([type=file]):not([type=hidden]),select,textarea,[tabindex="0"]';
// switched with LB/RB and LT/RT (Q/E, Z/C) or the mouse, never focused; the Album's collection list is a list to move
// through like any other (it is also its section bar)
const UI_BARS='.tabs,.subnav:not(#al-sub)';
// [selector, type, options]: the first ancestor of a control that matches one of these is its group.
// row: left/right, col: up/down, grid: both (columns from the layout), map: the nearest control in that direction.
// follow: moving onto a member presses it (tabs, sections, game modes). wrap: the ends join up.
const UI_GROUPS=[
  ['#hub.paused-match #concede-row','col'],
  ['.modes','col',{follow:1}],['#al-sub','col',{follow:1}],['.al-page','grid',{follow:1}],['#formations','col'],['#mini','map'],['#tree','map'],
  ['.ko-dots','grid'],['.ko-car','row'],['#ko-picks','row'],['.ko-head','row'],
  ['.kitpal,.kp-pats,.ball-grid,.look-row','grid'],['#tracks','col'],
  ['.seg,.kitrow,.field,.cta,.kopbtns,.starbtns,.kitview,.pc-head,.bal-pw','row'],
];
// Links out of a group, by direction. The key is matched with closest(), so it covers everything inside it.
// A value is a selector (the first visible match that holds a control), a list of them (first that works), or 'none'.
const UI_LINKS=[
  ['#hub.paused-match #btn-resume',{d:'#concede-row',u:'none'}],['#hub.paused-match #concede-row',{u:'#btn-resume',d:'none'}],
  ['#ko-back',{d:'#ko-me'}],
  ['#ko-me',{r:'#ko-half',d:'#ko-picks',u:'#ko-back'}],
  ['#ko-half',{l:'#ko-me',r:'#ko-opp',d:'#ko-picks',u:'#ko-back'}],
  ['.ko-car',{l:'#ko-half',u:'#ko-back',d:'.ko-dots'}],
  ['.ko-dots',{l:'#ko-half',u:'.ko-car',d:['#ko-opp .ko-kits','#ko-picks']}],
  ['#ko-opp',{l:'#ko-half',d:'#ko-picks'}],
  ['#ko-picks',{r:'#ko-go',u:'#ko-half'}],
  ['#ko-go',{l:'#ko-picks',u:'#ko-opp'}],
  ['.modes',{r:'#mode-setup',d:'none'}],
  ['#mode-setup',{l:'.modes'}],
  ['#squad-name',{r:'#sq-kit'}],['#sq-kit',{l:'#squad-name',r:'#sq-crest'}],['#sq-crest',{l:'#sq-kit'}],
  ['#formations',{r:'#mini'}],['.kopbtns',{r:'#mini'}],['#mini',{l:'#formations'}],
  ['#fut',{r:'#stats'}],['#stats',{l:'#fut'}],
  ['#al-sub',{r:'#al-page'}],['#al-page',{l:'#al-sub',r:'#al-detail'}],['#al-detail',{l:'#al-page'}],
];
// where focus lands on a page it has no memory of
const UI_DEFAULT={album:['#al-page [aria-pressed="true"]','#al-sub [aria-pressed="true"]'],play:['#hub.paused-match #btn-resume','.modes [aria-pressed="true"]','.modes .tile'],kickoff:['#ko-go']};
// B inside the first selector goes to the selected control of the second (before the section bar and the tabs)
const UI_BACK=[['#mode-setup','.modes']];

const UI={cur:null,addr:null,dev:'mouse',mem:{},hold:{},kdir:'',layer:'',sw:0,glide:0,lastTick:0,box:null,depth:0};
const uiRing=document.createElement('div');uiRing.id='ui-ring';uiRing.setAttribute('aria-hidden','true');document.body.appendChild(uiRing);
const uiBar=document.createElement('div');uiBar.id='ui-bar';uiBar.setAttribute('aria-hidden','true');uiBar.innerHTML='<p class="ui-help"></p><div class="ui-keys"></div>';document.body.appendChild(uiBar);

/* ---------- sounds ---------- */
const uiSnd={
  tick(soft){const n=performance.now();if(n-UI.lastTick<28)return;UI.lastTick=n;tone(2300,1700,0.022,soft?0.03:0.055,'triangle');},
  ok(){tone(880,1320,0.05,0.07,'square');setTimeout(()=>tone(1320,1760,0.07,0.06,'square'),55);sndT=performance.now();},
  back(){tone(990,520,0.09,0.07,'square');sndT=performance.now();},
  no(){tone(150,110,0.08,0.12,'square');setTimeout(()=>tone(150,110,0.08,0.1,'square'),105);},
  tab(){noise(0.07,0.07,3400,1.4);tone(1100,1700,0.045,0.04,'triangle');},
};

/* ---------- what is on screen ---------- */
// start.js (the title screen) loads after this file
const uiTitleOn=()=>typeof TITLE==='undefined'||TITLE.on;
// the layer the UI drives: the full-time screen over the menu, the menu, or nothing (title, pack, keyboard, match)
function uiLayer(){
  if(uiTitleOn()||oskOpen()||(typeof PACK!=='undefined'&&PACK.open))return '';
  if(!$('#ft').hidden)return 'ft';
  if(!$('#hub').hidden)return 'hub';
  return '';}
function uiScopes(){return UI.layer==='ft'?[$('#ft')]:UI.layer==='hub'?[...document.querySelectorAll('#hub [data-panel]:not([hidden])')]:[];}
function uiPanel(){return document.querySelector('#hub [data-panel]:not([hidden])');}
function uiUsable(el){
  if(!el||!el.isConnected||el.closest('[hidden]')||el.closest(UI_BARS))return false;
  const r=el.getClientRects();if(!r.length||(r[0].width<1&&r[0].height<1))return false;
  if(el.closest('.glyph'))return false;
  return getComputedStyle(el).visibility!=='hidden';}
const uiShown=el=>!!el&&el.isConnected&&!el.closest('[hidden]')&&el.getClientRects().length>0;
function uiInScope(el){return !!el&&uiScopes().some(s=>s.contains(el));}
function uiCands(within){const out=[];if(within&&within.matches(UI_FOC)&&uiUsable(within))out.push(within);(within?[within]:uiScopes()).forEach(s=>s.querySelectorAll(UI_FOC).forEach(el=>{if(uiUsable(el))out.push(el);}));return out;}
const uiDisabled=el=>!!(el.disabled||el.getAttribute('aria-disabled')==='true'||el.classList.contains('locked'));
const uiText=el=>!!el&&el.matches('input[type=text],input:not([type]),input[type=search],input[type=password],input[type=number],textarea');
const uiSelected=el=>el.getAttribute('aria-pressed')==='true'||el.getAttribute('aria-selected')==='true'||el.getAttribute('aria-current')==='true'||el.classList.contains('on');
// the box the ring draws round: a settings row when the control is its only one, a toggle's track, else the control
function uiVisual(el){
  const row=el.closest('.srow');if(row&&row.querySelectorAll(UI_FOC).length===1)return row;
  return el.closest('.tog,.filebtn')||el;}

/* ---------- groups ---------- */
function uiGroupOf(el){
  const lim=uiScopes().find(s=>s.contains(el));
  for(let a=el.parentElement;a&&a!==document.body;a=a.parentElement){
    for(const g of UI_GROUPS)if(a.matches(g[0]))return {el:a,type:g[1],o:g[2]||{},sel:g[0]};
    if(a===lim)break;}
  return {el,type:'one',o:{},sel:''};}
function uiMembers(g,cands){return g.type==='one'?[g.el]:(cands||uiCands()).filter(x=>g.el.contains(x)&&uiGroupOf(x).el===g.el);}
// the groups of the page in order, each once
function uiGroups(cands){const seen=new Set(),out=[];cands.forEach(c=>{const g=uiGroupOf(c);if(!seen.has(g.el)){seen.add(g.el);out.push(g);}});return out;}
function uiCols(M){if(M.length<2)return 1;const t=M[0].getBoundingClientRect().top;let n=0;for(const m of M){if(Math.abs(m.getBoundingClientRect().top-t)<6)n++;else break;}return Math.max(1,n);}
// the nearest member in a direction (only on the drawn maps)
function uiNear(cur,M,dir){const c=cur.getBoundingClientRect(),cx=c.left+c.width/2,cy=c.top+c.height/2;let best=null,bs=1e9;
  for(const el of M){if(el===cur)continue;const r=el.getBoundingClientRect(),dx=r.left+r.width/2-cx,dy=r.top+r.height/2-cy;
    const main=dir==='u'?-dy:dir==='d'?dy:dir==='l'?-dx:dx,side=dir==='u'||dir==='d'?Math.abs(dx):Math.abs(dy);if(main<4)continue;const s=main+side*2.2;if(s<bs){bs=s;best=el;}}
  return best;}
// the control to land on when entering a group or a linked container
function uiEnter(box,dir,from){
  const cands=uiCands(),inside=cands.filter(x=>box===x||box.contains(x));if(!inside.length)return null;
  const g=uiGroupOf(inside[0]);
  // stacked rows of the same kind (star rows, kit palettes): keep the column
  if(from&&(dir==='u'||dir==='d')&&g.sel&&g.sel===from.g.sel&&g.el!==from.g.el&&g.type!=='col'){const M=uiMembers(g,cands);return M[Math.min(from.i,M.length-1)];}
  const mem=box.__uiLast;if(mem&&inside.includes(mem))return mem;
  const sel=inside.find(uiSelected);if(sel)return sel;
  if(dir==='u'&&(g.type==='col'||g.type==='grid')&&g.el===box)return inside[inside.length-1];
  return inside[0];}
function uiLink(cur,dir){
  for(const [s,L] of UI_LINKS){if(!(dir in L)||!cur.closest(s))continue;const v=L[dir];if(v==='none')return 'none';
    for(const t of [].concat(v)){const box=[...document.querySelectorAll(t)].find(b=>uiInScope(b)&&uiCands(b).length);if(box)return box;}
    return 'none';}
  return null;}

/* ---------- moving ---------- */
function uiMove(dir,src,rep){
  if(!UI.layer)return false;
  const cur=uiUsable(UI.cur)&&uiInScope(UI.cur)?UI.cur:null;
  if(!cur){const d=uiDefault();if(d)uiSet(d,{src,scroll:true});return true;}
  // values first: a slider moves, a toggle switches
  if(dir==='l'||dir==='r'){
    if(cur.type==='range'){const st=+cur.step||1,old=+cur.value;cur.value=old+(dir==='r'?st:-st)*Math.max(1,Math.round((+cur.max-+cur.min)/20/st));
      if(+cur.value===old){if(!rep)uiNo(cur);return false;}cur.dispatchEvent(new Event('input',{bubbles:true}));cur.dispatchEvent(new Event('change',{bubbles:true}));uiSnd.tick();uiPress(cur);return true;}
    if(cur.tagName==='SELECT'){const i=cur.selectedIndex+(dir==='r'?1:-1);if(i<0||i>=cur.options.length){if(!rep)uiNo(cur);return false;}
      cur.selectedIndex=i;cur.dispatchEvent(new Event('input',{bubbles:true}));cur.dispatchEvent(new Event('change',{bubbles:true}));uiSnd.tick();uiPress(cur);return true;}
    // a toggle row: right switches it on, left off; already there, the move leaves the row as usual
    if(cur.type==='checkbox'&&uiVisual(cur)!==cur&&cur.closest('.srow')){const want=dir==='r';if(cur.checked!==want){cur.click();uiSnd.ok();uiPress(cur);return true;}if(rep)return false;}}
  if(uiText(cur)&&document.activeElement===cur)cur.blur();
  const cands=uiCands(),g=uiGroupOf(cur),M=uiMembers(g,cands),i=M.indexOf(cur);let next=null;
  if(g.type==='row'&&(dir==='l'||dir==='r'))next=M[i+(dir==='r'?1:-1)]||(g.o.wrap?M[dir==='r'?0:M.length-1]:null);
  else if(g.type==='col'&&(dir==='u'||dir==='d'))next=M[i+(dir==='d'?1:-1)]||(g.o.wrap?M[dir==='d'?0:M.length-1]:null);
  else if(g.type==='grid'){const C=uiCols(M);if(dir==='l'&&i%C)next=M[i-1];else if(dir==='r'&&i%C<C-1)next=M[i+1]||null;else if(dir==='u')next=M[i-C]||null;else if(dir==='d')next=M[i+C]||(Math.floor(i/C)<Math.floor((M.length-1)/C)?M[M.length-1]:null);}
  else if(g.type==='map')next=uiNear(cur,M,dir);
  if(!next){
    const L=uiLink(cur,dir);
    if(L&&L!=='none')next=uiEnter(L,dir,{g,i});
    else if(!L&&(dir==='u'||dir==='d')){
      // leaving the tab bar downwards goes back to where you were on that page
      {const G=uiGroups(cands),k=G.findIndex(x=>x.el===g.el),n=G[k+(dir==='d'?1:-1)];if(n)next=uiEnter(n.type==='one'?n.el:n.el,dir,{g,i});}}}
  if(!next){
    // nothing further: a long page scrolls instead
    const sc=uiScroller(cur);if(sc&&(dir==='u'||dir==='d')&&sc.scrollHeight>sc.clientHeight+4){const before=sc.scrollTop;sc.scrollBy({top:dir==='d'?160:-160,behavior:'smooth'});if((dir==='d'&&before<sc.scrollHeight-sc.clientHeight-2)||(dir==='u'&&before>2))return true;}
    if(!rep)uiNo(cur);return false;}
  uiSet(next,{src,scroll:true});
  const ng=uiGroupOf(next);if(ng.o.follow&&!uiSelected(next)&&!uiDisabled(next))next.click();
  return true;}

/* ---------- focus ---------- */
function uiSet(el,o){o=o||{};
  if(!el||el===UI.cur){if(el&&o.scroll)uiScrollTo(el);return;}
  const was=UI.cur;if(was)was.classList.remove('ui-on');
  UI.cur=el;UI.addr=uiAddrOf(el);el.classList.add('ui-on');
  if(o.src!=='mouse'&&o.src!=='silent'&&!uiText(el)){try{el.focus({preventScroll:true});}catch(e){}}
  if(o.scroll)uiScrollTo(el);
  if(was&&o.src!=='silent'){UI.glide=performance.now();uiSnd.tick(o.src==='mouse');}
  for(let a=el.parentElement;a&&a!==document.body;a=a.parentElement)a.__uiLast=el;
  const pk=uiPageKey();if(pk)UI.mem[pk]=UI.addr;
  uiBarRender();}
// the nearest box around a control that scrolls (only the Balancing page does: every other page fits the frame)
function uiScroller(el){for(let a=el.parentElement;a&&a!==document.body;a=a.parentElement){if(a.scrollHeight>a.clientHeight+4&&/auto|scroll/.test(getComputedStyle(a).overflowY))return a;if(a.matches('#hub,#ft'))break;}return null;}
function uiScrollTo(el){const sc=uiScroller(el);if(!sc)return;const v=uiVisual(el).getBoundingClientRect(),c=sc.getBoundingClientRect(),m=24;
  if(v.top<c.top+m)sc.scrollBy({top:v.top-c.top-m,behavior:'smooth'});else if(v.bottom>c.bottom-m)sc.scrollBy({top:v.bottom-c.bottom+m,behavior:'smooth'});}
// an address that still finds "the same" control after its markup was rebuilt
function uiAddrOf(el){
  if(el.id)return {sel:'#'+CSS.escape(el.id)};
  const ds=[...el.attributes].filter(a=>a.name.startsWith('data-')&&!/^data-(drag|g)/.test(a.name));
  const anc=el.parentElement&&el.parentElement.closest('[id]'),pre=anc?'#'+CSS.escape(anc.id)+' ':'';
  if(ds.length)return {sel:pre+el.tagName.toLowerCase()+ds.map(a=>`[${a.name}="${CSS.escape(a.value)}"]`).join('')};
  if(anc)return {anc:'#'+CSS.escape(anc.id),i:[...anc.querySelectorAll(UI_FOC)].indexOf(el),lab:el.getAttribute('aria-label')||''};
  return null;}
function uiFind(a){if(!a)return null;try{
  if(a.sel){const el=[...document.querySelectorAll(a.sel)].find(uiUsable);return el||null;}
  const anc=document.querySelector(a.anc);if(!anc)return null;const L=[...anc.querySelectorAll(UI_FOC)];
  return (a.lab&&L.find(x=>x.getAttribute('aria-label')===a.lab&&uiUsable(x)))||(uiUsable(L[a.i])?L[a.i]:null);}catch(e){return null;}}
function uiPageKey(){if(UI.layer!=='hub')return UI.layer;const pn=uiPanel();if(!pn)return '';
  const sub=pn.querySelector('.subnav :is([aria-pressed="true"],[aria-current="true"])');return pn.dataset.panel+(sub?'/'+(sub.dataset.club||sub.dataset.sub||sub.dataset.sec||sub.dataset.col||sub.dataset.rsec||sub.textContent):'');}
// where to land: this page's memory, its preferred control, the selected section, or the first control
function uiDefault(){
  if(UI.layer==='ft'){return $('#btn-rematch')&&uiUsable($('#btn-rematch'))?$('#btn-rematch'):uiCands()[0]||null;}
  const pn=uiPanel();if(!pn)return null;
  const m=uiFind(UI.mem[uiPageKey()]);if(m&&pn.contains(m))return m;
  for(const s of UI_DEFAULT[pn.dataset.panel]||[]){const el=[...pn.querySelectorAll(s)].find(uiUsable);if(el)return el;}
  return uiCands(pn)[0]||null;}

/* ---------- actions ---------- */
function uiPress(el){const v=uiVisual(el);v.classList.remove('ui-press');void v.offsetWidth;v.classList.add('ui-press');
  uiRing.classList.remove('punch');void uiRing.offsetWidth;uiRing.classList.add('punch');}
function uiNo(el){uiSnd.no();uiRing.classList.remove('deny');void uiRing.offsetWidth;uiRing.classList.add('deny');clearTimeout(UI.denyT);UI.denyT=setTimeout(()=>uiRing.classList.remove('deny'),340);if(el){const v=uiVisual(el);v.classList.remove('ui-deny');void v.offsetWidth;v.classList.add('ui-deny');}}
function uiConfirm(src){
  if(!UI.layer)return;
  const el=uiUsable(UI.cur)&&uiInScope(UI.cur)?UI.cur:null;
  if(!el){const d=uiDefault();if(d){uiSet(d,{src,scroll:true});uiSnd.tick();}return;}
  if(uiDisabled(el)){uiNo(el);return;}
  uiPress(el);
  if(el.type==='range'){uiNo(el);return;}
  if(el.tagName==='SELECT'){uiSnd.ok();el.selectedIndex=(el.selectedIndex+1)%el.options.length;el.dispatchEvent(new Event('change',{bubbles:true}));return;}
  if(uiText(el)){uiSnd.ok();if(src==='pad'&&typeof oskShow==='function')oskShow(el);else{el.focus();try{el.select();}catch(e){}}return;}
  if(src==='pad'&&el.classList.contains('tok')&&typeof squadMoveStart==='function'){uiSnd.ok();squadMoveStart([...$('#mini').querySelectorAll('.tok')].indexOf(el));return;}
  uiSnd.ok();
  // a game mode: pick it and go to its setup
  if(el.closest('.modes')){el.click();const t=el.dataset.mode==='online'?['#online-panel :is(#btn-newroom,#tour-create)','#online-panel button']:['#btn-start'];
    for(const s of t){const n=[...document.querySelectorAll(s)].find(x=>uiUsable(x)&&!uiDisabled(x));if(n){uiSet(n,{src:'silent',scroll:true});UI.glide=performance.now();break;}}return;}
  el.click();}
function uiBack(){
  if(!UI.layer)return;
  if(UI.layer==='ft'){uiSnd.back();$('#btn-ft-menu').click();return;}
  const cur=uiUsable(UI.cur)&&uiInScope(UI.cur)?UI.cur:null;
  if(cur&&uiText(cur)&&document.activeElement===cur){cur.blur();uiSnd.back();return;}
  if(hubTab==='kickoff'){uiSnd.back();koBack();return;}
  const paused=$('#hub').classList.contains('paused-match');
  if(paused&&hubTab==='play'){uiSnd.back();closeMenu();return;}
  if(cur)for(const [a,b] of UI_BACK)if(cur.closest(a)){const t=uiEnter(document.querySelector(b),'');if(t){uiSnd.back();uiSet(t,{src:'silent',scroll:true});UI.glide=performance.now();return;}}
  // from any other tab, B goes back to Play
  if(hubTab!=='play'){uiSnd.back();setTab('play');return;}
  if(!$('#btn-resume').hidden){uiSnd.back();closeMenu();return;}
  uiNo(cur);}
function uiTab(d){if(UI.layer!=='hub')return;
  if(hubTab==='kickoff'){koStep(d);uiPress($('#ko-opp .ko-card')||$('#ko-opp'));return;}
  stepTab(d);uiSnd.tab();}
function uiSection(d){if(UI.layer!=='hub')return;const pn=uiPanel(),nav=pn&&pn.querySelector('.subnav');
  if(!uiShown(nav)){uiNo(null);return;}
  subStep(d);uiSnd.tab();}

/* ---------- page switching: remember focus and scroll, slide the new page in ---------- */
function uiSwitching(fn,dirOf){return function(...a){
  const outer=UI.depth===0,from=outer?uiPageKey():'',tab0=hubTab,pn0=outer&&uiPanel();
  // the boxes that scroll inside this page keep their place (hiding a box would reset it)
  if(pn0)pn0.querySelectorAll('*').forEach(e=>{if(e.scrollTop>0||e.__uiTop)e.__uiTop=e.scrollTop;});
  UI.depth++;let r;try{r=fn.apply(this,a);}finally{UI.depth--;}
  if(outer){const to=uiPageKey();
    if(to!==from){const pn1=uiPanel();if(pn1)pn1.querySelectorAll('*').forEach(e=>{if(e.__uiTop)e.scrollTop=e.__uiTop;});
      const d=dirOf?dirOf(tab0,hubTab):0,pn=uiPanel();
      if(d&&pn){pn.classList.remove('ui-in-r','ui-in-l');void pn.offsetWidth;pn.classList.add(d>0?'ui-in-r':'ui-in-l');}
      // the focus goes back to where it was on this page
      const t=uiDefault();if(t){UI.cur=null;uiSet(t,{src:'silent'});}}}
  return r;};}
const uiTabDir=(a,b)=>{if(a===b)return 0;if(b==='kickoff')return 1;if(a==='kickoff')return -1;return TABS.indexOf(b)>TABS.indexOf(a)?1:-1;};
setTab=uiSwitching(setTab,uiTabDir);
setClubSec=uiSwitching(setClubSec);
setSettingsSub=uiSwitching(setSettingsSub);
if(typeof setCustSec==='function')setCustSec=uiSwitching(setCustSec);
setRulesSub=uiSwitching(setRulesSub);
// the old controller helpers now drive the one focus
padPick=function(el){if(el&&uiUsable(el))uiSet(el,{src:'silent',scroll:true});};

/* ---------- play tab: the briefing card next to the mode list (updated in place) ---------- */
const UI_MODES={
  cpu:{k:'Solo',t:'Kick-off',d:'Your squad against a club run by the computer. Pick the opponent, the kits and the half length next.',p:['15 clubs, one to three stars','Pick the ball, field and table']},
  online:{k:'Online',t:'Online Friendly',d:'Make a room and send the code to a friend, or type the code you were sent. Each side brings its own squad.',p:['Match rooms and tournaments','Your squad travels with you']},
  local:{k:'Local',t:'Versus',d:'Two players on one screen: share the mouse, or plug in two controllers.',p:['Two controllers supported','Home and away squads']},
  tutorial:{k:'Learn',t:'Tutorial',d:'A coach walks you through the flick, passing, blocks and set pieces, one step at a time.',p:['One step at a time','Start again any time']},
  practice:{k:'Training',t:'Practice',d:'An empty pitch and a set of drills. Try flicks, curls and shots with no clock and no opponent.',p:['Place your own drills','No clock, no opponent']},
};
// Your own picture for a mode: put the file in the game folder and its path here (e.g. local:'img/modes/versus.webp').
// It fills the picture box of the card instead of the drawn one.
const UI_MODE_IMG={};
// the drawn pictures: cream chalk on the blue box (470 x 250)
const UI_ART=(()=>{
  const C='#f1e4c6',Y='#f2b632',S='stroke="'+C+'" stroke-width="3" fill="none"';
  const pitch=`<g opacity=".9">${[0,1,2,3,4,5].map(i=>`<rect x="${22+i*72}" y="20" width="36" height="210" fill="rgba(255,255,255,.035)"/>`).join('')}<g ${S}><rect x="22" y="20" width="426" height="210"/><path d="M235 20V230"/><circle cx="235" cy="125" r="34"/><rect x="22" y="72" width="62" height="106"/><rect x="22" y="102" width="22" height="46"/><rect x="386" y="72" width="62" height="106"/><rect x="426" y="102" width="22" height="46"/></g><circle cx="235" cy="125" r="4" fill="${C}"/></g>`;
  const dots=(pts,f,st)=>pts.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="9" fill="${f}" stroke="${st}" stroke-width="3"/>`).join('');
  const home=[[60,125],[110,70],[110,180],[160,100],[160,150],[205,125]],away=[[410,125],[360,70],[360,180],[310,100],[310,150],[265,125]];
  const arrow=(d,c)=>`<path d="${d}" stroke="${c}" stroke-width="4" fill="none" stroke-dasharray="10 8" stroke-linecap="round"/>`;
  const head=(x,y,a,c)=>`<path d="M0 0L-16 -9L-16 9Z" fill="${c}" transform="translate(${x} ${y}) rotate(${a})"/>`;
  return{
    local:pitch+dots(home,Y,'#0f1f38')+dots(away,C,'#0f1f38')+arrow('M160 100 Q 235 40 310 100',Y)+head(310,100,40,Y)+arrow('M310 150 Q 235 210 160 150',C)+head(160,150,220,C),
    cpu:pitch+dots(home,Y,'#0f1f38')+dots(away,'#2f6aa3',C)+arrow('M205 125 Q 300 60 420 118',Y)+head(420,118,30,Y)+`<g transform="translate(330 196)"><rect x="-30" y="-15" width="60" height="30" fill="#0f1f38" stroke="${C}" stroke-width="2"/><text x="0" y="7" fill="${C}" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="900" font-style="italic" font-size="20" text-anchor="middle">CPU</text></g>`,
    online:`<g ${S}><circle cx="235" cy="128" r="92"/><ellipse cx="235" cy="128" rx="40" ry="92"/><path d="M143 128H327M155 82H315M155 174H315"/></g>`+arrow('M120 70 Q 235 -20 350 70',Y)+`<g fill="${Y}" stroke="#0f1f38" stroke-width="3"><path d="M120 92 C 100 66 100 44 120 44 C 140 44 140 66 120 92Z"/><path d="M350 92 C 330 66 330 44 350 44 C 370 44 370 66 350 92Z"/></g><circle cx="120" cy="60" r="6" fill="#0f1f38"/><circle cx="350" cy="60" r="6" fill="#0f1f38"/>`,
    tutorial:pitch+arrow('M80 190 L 170 130 L 270 160 L 380 90',Y)+[[80,190,'1'],[170,130,'2'],[270,160,'3'],[380,90,'4']].map(([x,y,n])=>`<circle cx="${x}" cy="${y}" r="20" fill="${Y}" stroke="#0f1f38" stroke-width="3"/><text x="${x}" y="${y+8}" fill="#0f1f38" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="900" font-size="24" text-anchor="middle">${n}</text>`).join(''),
    practice:pitch+[[120,70],[170,180],[220,70],[270,180]].map(([x,y])=>`<path d="M${x} ${y-16}L${x+13} ${y+10}H${x-13}Z" fill="${Y}" stroke="#0f1f38" stroke-width="2"/>`).join('')+arrow('M70 125 Q 120 30 170 125 T 270 125 T 400 125',C)+`<g ${S}><circle cx="410" cy="125" r="30"/><circle cx="410" cy="125" r="18"/></g><circle cx="410" cy="125" r="7" fill="${Y}"/>`,
  };})();
(function(){
  const setup=$('#mode-setup');if(!setup)return;
  const box=document.createElement('div');box.className='mode-brief';box.id='mode-brief';
  box.innerHTML='<div class="mb-main"><p class="mb-k"></p><h2 class="mb-t"></h2><p class="mb-d"></p><ul class="mb-p"></ul></div><div class="mb-art" aria-hidden="true"></div>';
  setup.insertBefore(box,setup.firstChild);
  // the mode list always has one mode picked, so the card and its setup are never empty (Versus, as at first launch)
  const base=setMenuMode;setMenuMode=function(m){base(m||'local');uiBrief();};
})();
function uiBrief(){const b=$('#mode-brief');if(!b)return;const M=UI_MODES[menuMode];b.hidden=!M;if(!M)return;
  const set=(s,v)=>{const e=b.querySelector(s);if(e.textContent!==v)e.textContent=v;};
  set('.mb-k',M.k);set('.mb-t',M.t);set('.mb-d',M.d);
  const ul=b.querySelector('.mb-p');while(ul.children.length<M.p.length)ul.appendChild(document.createElement('li'));while(ul.children.length>M.p.length)ul.lastChild.remove();
  M.p.forEach((t,i)=>{if(ul.children[i].textContent!==t)ul.children[i].textContent=t;});
  // the picture only changes with the mode
  if(b.dataset.mode!==menuMode){b.dataset.mode=menuMode;const art=b.querySelector('.mb-art'),img=UI_MODE_IMG[menuMode];
    art.style.backgroundImage=img?`url("${img}")`:'';art.innerHTML=img?'':`<svg viewBox="0 0 470 250" preserveAspectRatio="xMidYMid meet">${UI_ART[menuMode]||''}</svg>`;}}
uiBrief();

/* ---------- the input layer ---------- */
function uiSetDev(d){if(UI.dev===d)return;UI.dev=d;document.documentElement.dataset.dev=d;uiBarRender();}
document.documentElement.dataset.dev=UI.dev;
{const base=setInput;setInput=function(k){base(k);if(k==='pad')uiSetDev('pad');else if(k==='touch')uiSetDev('touch');else if(UI.dev==='pad'||UI.dev==='touch')uiSetDev('mouse');};}
// held directions: the first move at once, the next after 360 ms, then faster and faster
function uiHold(src,dir){const now=performance.now(),s=UI.hold[src]||(UI.hold[src]={d:'',t:0,n:0});
  if(dir!==s.d){s.d=dir;s.n=0;if(dir){uiMove(dir,src==='kbd'?'kbd':'pad',false);s.t=now+360;}return;}
  if(dir&&now>=s.t){s.n++;uiMove(dir,src==='kbd'?'kbd':'pad',true);s.t=now+Math.max(45,150*Math.pow(0.86,s.n));}}
// one controller in the menus (called from pollPads)
function uiPad(gp,st){
  const pressed=k=>gp.buttons[k]&&gp.buttons[k].pressed,edge=k=>pressed(k)&&!st.btn[k];
  const lx=gp.axes[0]||0,ly=gp.axes[1]||0,DZ=0.55;
  const dir=pressed(12)?'u':pressed(13)?'d':pressed(14)?'l':pressed(15)?'r':Math.abs(ly)>DZ&&Math.abs(ly)>=Math.abs(lx)?(ly<0?'u':'d'):Math.abs(lx)>DZ?(lx<0?'l':'r'):'';
  uiHold('pad'+gp.index,dir);
  if(edge(0))uiConfirm('pad');
  if(edge(1))uiBack();
  if(UI.layer==='hub'){if(edge(4))uiTab(-1);if(edge(5))uiTab(1);if(edge(6))uiSection(-1);if(edge(7))uiSection(1);}}
const UI_KDIR={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r'};
addEventListener('keydown',e=>{
  if(!UI.layer||oskOpen()||e.ctrlKey||e.metaKey||e.altKey)return;
  uiSetDev('kbd');
  const t=e.target,typing=uiText(t)&&document.activeElement===t;
  if(typing){
    if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();e.stopPropagation();t.blur();uiSnd.back();UI.cur=null;uiSet(t,{src:'silent'});return;}
    if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();e.stopPropagation();t.blur();uiMove(UI_KDIR[e.key],'kbd');}
    return;}
  if(t&&t.tagName==='TEXTAREA')return;
  const d=UI_KDIR[e.key];
  if(d){e.preventDefault();e.stopPropagation();if(!e.repeat){UI.kdir=d;uiHold('kbd',d);}return;}
  if(e.repeat){if(/^( |Enter|Escape|Backspace)$/.test(e.key))e.preventDefault();return;}
  if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();uiConfirm('kbd');return;}
  if(e.key==='Escape'||e.key==='Backspace'){e.preventDefault();e.stopPropagation();uiBack();return;}
  if(e.code==='KeyQ'||e.code==='KeyE'){e.preventDefault();e.stopPropagation();uiTab(e.code==='KeyE'?1:-1);return;}
  if(e.code==='KeyZ'||e.code==='KeyC'){e.preventDefault();e.stopPropagation();uiSection(e.code==='KeyC'?1:-1);return;}
},true);
addEventListener('keyup',e=>{const d=UI_KDIR[e.key];if(d&&UI.kdir===d)UI.kdir='';});
addEventListener('blur',()=>{UI.kdir='';});
// the mouse moves the same focus: whatever control (or settings row) is under it
const uiHoverTarget=t=>{if(!t||!t.closest)return null;let el=t.closest(UI_FOC);
  if(!el){const row=t.closest('.srow');if(row){const c=row.querySelectorAll(UI_FOC);if(c.length===1)el=c[0];}}
  return el&&uiInScope(el)&&uiUsable(el)?el:null;};
addEventListener('pointermove',e=>{
  if(e.pointerType==='touch'||!UI.layer)return;
  if(Math.abs(e.movementX)+Math.abs(e.movementY)>1)uiSetDev('mouse');
  if(e.buttons||UI.dev!=='mouse')return;
  const el=uiHoverTarget(e.target);if(el&&el!==UI.cur)uiSet(el,{src:'mouse'});},{passive:true,capture:true});
// press feedback for the mouse and touch: the animation on press, the sound on click (or the "can't" buzz)
addEventListener('pointerdown',e=>{if(!UI.layer||e.button!==0)return;
  const bar=e.target.closest&&e.target.closest(UI_BARS)&&e.target.closest('button');if(bar&&UI.layer==='hub'){uiPress(bar);return;}
  const el=uiHoverTarget(e.target)||(e.target.closest&&e.target.closest(UI_FOC));if(!el||!uiInScope(el))return;
  if(el!==UI.cur)uiSet(el,{src:'silent'});if(uiDisabled(el)){uiNo(el);return;}uiPress(el);},true);
addEventListener('click',e=>{if(!UI.layer||!e.isTrusted||e.detail===0)return;const el=e.target.closest&&e.target.closest(UI_FOC);if(!el||uiText(el)||el.type==='range')return;
  if(el.closest(UI_BARS)&&el.closest('#hub')){uiSnd.tab();return;}if(!uiInScope(el))return;uiSnd.ok();},true);

/* ---------- the prompt bar ---------- */
const UI_KEYS={A:'Enter',B:'Esc',LB:'Q',RB:'E',LT:'Z',RT:'C',X:'X',Y:'Y'};
function uiBarRender(){
  // the bar stays while a menu is on screen, also under the on-screen keyboard or a card pack
  const shown=!uiTitleOn()&&(!$('#hub').hidden||!$('#ft').hidden);uiBar.hidden=!shown;document.documentElement.classList.toggle('ui-menu',shown);
  if(!UI.layer)return;
  const pad=UI.dev==='pad',el=uiUsable(UI.cur)?UI.cur:null,ko=UI.layer==='hub'&&hubTab==='kickoff';
  const hasSub=UI.layer==='hub'&&!ko&&(()=>{const pn=uiPanel(),n=pn&&pn.querySelector('.subnav');return uiShown(n);})();
  let a='Select';if(el){if(el.type==='range')a='';else if(el.tagName==='SELECT')a='Next option';else if(el.type==='checkbox')a='Toggle';else if(uiText(el))a=pad?'Type':'Edit';else if(pad&&el.classList.contains('tok'))a='Move';else if(ko&&el.id==='ko-go')a='Kick off';}
  const items=[{g:[pad?'✥':'↑↓←→'],t:el&&(el.type==='range'||el.tagName==='SELECT')?'Adjust':'Move'}];
  if(a)items.push({g:['A'],t:a});
  items.push({g:['B'],t:UI.layer==='ft'?'Main menu':'Back'});
  if(UI.layer==='hub')items.push({g:['LB','RB'],t:ko?'Club':'Tabs'});
  if(hasSub)items.push({g:['LT','RT'],t:'Sections'});
  const cap=g=>{if(g==='✥'||g==='↑↓←→')return `<span class="kcap dpad">${g}</span>`;
    if(pad)return `<span class="glyph ${g==='A'?'a':g==='B'?'b':''}">${padLabel(GLYPH_X[g])}</span>`;
    return `<span class="kcap">${UI_KEYS[g]||g}</span>`;};
  const html=items.map(it=>`<span class="ui-k">${it.g.map(cap).join('')}<b>${it.t}</b></span>`).join('');
  const k=uiBar.querySelector('.ui-keys');if(k.dataset.h!==html){k.dataset.h=html;k.innerHTML=html;}
  // the help line: what the selected control does
  let help='';if(el){const t=el.closest('[title]');help=(t&&t.title)||'';if(!help&&el.closest('.modes')&&UI_MODES[el.dataset.mode])help=UI_MODES[el.dataset.mode].d;}
  const h=uiBar.querySelector('.ui-help');if(h.textContent!==help)h.textContent=help;}
// the old controller bar is replaced by this one
padBarRender=function(){uiBarRender();};

/* ---------- every frame: keep the focus valid and the ring on it ---------- */
function uiTick(){
  requestAnimationFrame(uiTick);
  const layer=uiLayer();
  if(layer!==UI.layer){UI.layer=layer;for(const k in UI.hold)UI.hold[k].d='';
    if(layer){const d=uiDefault();UI.cur=null;if(d)uiSet(d,{src:'silent'});}
    uiBarRender();}
  if(!layer){uiRing.classList.remove('on');return;}
  uiHold('kbd',UI.kdir);
  // the control was rebuilt or hidden: find it again by its address, else this page's default
  if(!uiUsable(UI.cur)||!uiInScope(UI.cur)){const el=uiFind(UI.addr);const t=el&&uiInScope(el)?el:uiDefault();
    if(t){UI.cur=null;uiSet(t,{src:'silent'});}else{uiRing.classList.remove('on');return;}}
  if(!UI.cur.classList.contains('ui-on'))UI.cur.classList.add('ui-on');
  // the ring: glide on a new target, stick to it while the page scrolls
  const v=uiVisual(UI.cur),r=v.getBoundingClientRect(),P=5;
  const x=r.left-P,y=r.top-P,w=r.width+P*2,h=r.height+P*2;
  const k=Math.round(x)+','+Math.round(y)+','+Math.round(w)+','+Math.round(h);
  uiRing.classList.toggle('glide',performance.now()-UI.glide<220);
  if(k!==UI.box){UI.box=k;uiRing.style.transform=`translate(${x}px,${y}px)`;uiRing.style.width=w+'px';uiRing.style.height=h+'px';
    const br=getComputedStyle(v).borderRadius;uiRing.style.borderRadius=br==='50%'||parseFloat(br)>=Math.min(r.width,r.height)/2?'50%':'3px';}
  // clipped to the scrolling page, so it never sits on the tab bar
  const sc=uiScroller(UI.cur);let clip='none';
  if(sc){const c=sc.getBoundingClientRect(),t=Math.max(0,c.top-y),b=Math.max(0,y+h-c.bottom);if(t>=h||b>=h)clip='inset(50%)';else if(t||b)clip=`inset(${t}px -40px ${b}px -40px)`;}
  if(uiRing.style.clipPath!==clip)uiRing.style.clipPath=clip;
  uiRing.classList.add('on');
  // the control is already yellow (picked mode, open tab or section, chosen chip): that is the highlight
  uiRing.classList.toggle('self',UI.cur.matches('.modes .tile')||uiSelected(UI.cur));}
requestAnimationFrame(uiTick);
