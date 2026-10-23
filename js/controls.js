// Flick Cup 2026 · js/controls.js
// Controls (agreed 22 Oct 2026): controller families and their button icons (Xbox, PlayStation, Steam Deck, Switch 2),
// button remapping, Nintendo layout, swap sticks, keyboard remapping, the on-screen keyboard for text fields, the
// controller prompt bar, and the button map in Settings > Controls. The mapping itself is set in Distal
// (Settings > Control mapping) and saved in data/controls.json.
// How remapping works: the game's code reads "logical" buttons in the Xbox layout (0 A, 1 B, 2 X, 3 Y, 4 LB, 5 RB, 6 LT,
// 7 RT, 8 View, 9 Menu, 10 L3, 11 R3, 12-15 D-pad). padsNow() hands it controllers whose buttons are already remapped:
// logical button L reads physical button padMapNow()[L], built from data/controls.json. The icons follow the same table, so a prompt always shows the
// button that does the job. Pads use the browser's standard mapping (buttons[0] is the bottom face button on every pad,
// which is B on a Nintendo controller).
// Loaded by index.html right after settings.js (it builds on input.js, hud.js and settings.js), as a classic script:
// every file shares one scope.
'use strict';
const PAD_FAMILIES={
  xbox:{name:'Xbox',btn:['A','B','X','Y','LB','RB','LT','RT','View','Menu','LS','RS','▲','▼','◀','▶']},
  ps:{name:'PlayStation',btn:['✕','○','□','△','L1','R1','L2','R2','Create','Options','L3','R3','▲','▼','◀','▶']},
  deck:{name:'Steam Deck',btn:['A','B','X','Y','L1','R1','L2','R2','View','≡','L3','R3','▲','▼','◀','▶']},
  switch:{name:'Switch 2',btn:['B','A','Y','X','L','R','ZL','ZR','−','+','LS','RS','▲','▼','◀','▶']},
};
// the actions a controller button can do; b = the logical button (Xbox layout) the game's code reads for it
const PAD_ACTIONS=[
  {id:'confirm',b:0,name:'Confirm',does:'Select in menus · skip defending · place at spot 2'},
  {id:'back',b:1,name:'Back',does:'Back in menus · cancel the aim · place at spot 3'},
  {id:'moment',b:2,name:'Moment',does:'Use your Moment · place at spot 1 · turn all cards'},
  {id:'camera',b:3,name:'Camera',does:'Reset the camera'},
  {id:'prev',b:4,name:'Previous',does:'Previous figure · previous tab'},
  {id:'next',b:5,name:'Next',does:'Next figure · next tab'},
  {id:'ltrig',b:6,name:'Left trigger',does:'Keeper left · curl left · previous section'},
  {id:'rtrig',b:7,name:'Right trigger',does:'Keeper right · curl right · next section'},
  {id:'menu',b:9,name:'Menu',does:'Pause menu'},
  {id:'music',b:11,name:'Next track',does:'Next music track'},
  {id:'keeper',b:12,name:'Keeper out',does:'Bring the keeper out'},
];
const KEY_ACTIONS=[
  {id:'menu',name:'Menu and back',def:'Escape'},{id:'camera',name:'Reset camera',def:'KeyC'},{id:'moment',name:'Moment',def:'KeyM'},
  {id:'keeper',name:'Keeper out',def:'KeyG'},{id:'skip',name:'Skip block',def:'Space'},{id:'nextFig',name:'Next figure (Shift: previous)',def:'Tab'},
  {id:'curlL',name:'Curl left',def:'KeyQ'},{id:'curlR',name:'Curl right',def:'KeyE'},{id:'music',name:'Next song',def:'KeyN'},
  {id:'spot1',name:'Set-piece spot 1',def:'Digit1'},{id:'spot2',name:'Set-piece spot 2',def:'Digit2'},{id:'spot3',name:'Set-piece spot 3',def:'Digit3'},
];
// The mapping is set in Distal (Settings > Control mapping) and saved in data/controls.json; these are the defaults.
// platforms.<p>.buttons: action -> physical button (browser standard mapping) on that controller.
const CONTROLS_DEF={version:1,
  platforms:{
    xbox:{buttons:{confirm:0,back:1,moment:2,camera:3,prev:4,next:5,ltrig:6,rtrig:7,menu:9,music:11,keeper:12},swapSticks:false},
    ps:{buttons:{confirm:0,back:1,moment:2,camera:3,prev:4,next:5,ltrig:6,rtrig:7,menu:9,music:11,keeper:12},swapSticks:false},
    deck:{buttons:{confirm:0,back:1,moment:2,camera:3,prev:4,next:5,ltrig:6,rtrig:7,menu:9,music:11,keeper:12},swapSticks:false},
    switch:{buttons:{confirm:1,back:0,moment:3,camera:2,prev:4,next:5,ltrig:6,rtrig:7,menu:9,music:11,keeper:12},swapSticks:false}},
  keys:Object.fromEntries(KEY_ACTIONS.map(k=>[k.id,k.def]))};
let CONTROLS=JSON.parse(JSON.stringify(CONTROLS_DEF));
function applyControls(o){const C=JSON.parse(JSON.stringify(CONTROLS_DEF));
  if(o&&o.platforms)for(const p of Object.keys(C.platforms)){const d=o.platforms[p];if(!d)continue;
    if(d.buttons)for(const a of PAD_ACTIONS){const v=+d.buttons[a.id];if(Number.isInteger(v)&&v>=0&&v<16)C.platforms[p].buttons[a.id]=v;}
    if(typeof d.swapSticks==='boolean')C.platforms[p].swapSticks=d.swapSticks;}
  if(o&&o.keys)for(const k of KEY_ACTIONS)if(typeof o.keys[k.id]==='string'&&o.keys[k.id])C.keys[k.id]=o.keys[k.id];
  CONTROLS=C;PAD_MAPS={};if(typeof updateGlyphs==='function')updateGlyphs();glyphsSoon();ctlMapRender();}
addEventListener('DOMContentLoaded',()=>onDataFile('controls',applyControls));
const KEY=id=>CONTROLS.keys[id]||(KEY_ACTIONS.find(k=>k.id===id)||{}).def;
function keyName(code){if(!code)return '?';const m={Escape:'Esc',Space:'Space',Tab:'Tab',Enter:'Enter',Backspace:'⌫',ShiftLeft:'Shift',ShiftRight:'R Shift',ControlLeft:'Ctrl',ControlRight:'R Ctrl',AltLeft:'Alt',AltRight:'Alt Gr',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→'};
  return m[code]||code.replace(/^Key/,'').replace(/^Digit/,'').replace(/^Numpad/,'Num ');}
// which family a controller is, from the name the browser reports
function padFamilyOf(id){id=String(id||'');
  if(/054c|playstation|dualsense|dualshock|ps[345] controller|wireless controller/i.test(id))return 'ps';
  if(/057e|nintendo|pro controller|joy-?con|switch/i.test(id))return 'switch';
  if(/28de|steam|valve/i.test(id))return 'deck';
  return 'xbox';}
let PAD_LAST_ID='';
function padFamily(){return padFamilyOf(PAD_LAST_ID);}
// logical -> physical for a family: the actions' buttons first, the other buttons fill the free places
let PAD_MAPS={};
function padMapNow(fam){fam=fam||padFamily();if(PAD_MAPS[fam])return PAD_MAPS[fam];
  const P=(CONTROLS.platforms[fam]||CONTROLS.platforms.xbox).buttons,map=Array(16).fill(-1),used=new Set();
  PAD_ACTIONS.forEach(a=>{const v=P[a.id];if(v!=null&&!used.has(v)){map[a.b]=v;used.add(v);}});
  for(let L=0;L<16;L++)if(map[L]<0&&!used.has(L)){map[L]=L;used.add(L);}
  for(let L=0;L<16;L++)if(map[L]<0){let q=0;while(used.has(q))q++;map[L]=q;used.add(q);}
  return PAD_MAPS[fam]=map;}
const PAD_OFF={pressed:false,touched:false,value:0};
function padVirtual(gp){
  const fam=padFamilyOf(gp.id),map=padMapNow(fam),bt=gp.buttons||[];
  const buttons=map.map(p=>bt[p]||PAD_OFF);for(let k=16;k<bt.length;k++)buttons.push(bt[k]);
  const a=gp.axes||[],sw=(CONTROLS.platforms[fam]||{}).swapSticks,axes=sw?[a[2]||0,a[3]||0,a[0]||0,a[1]||0]:Array.from(a);
  return {id:gp.id,index:gp.index,connected:gp.connected,mapping:gp.mapping,timestamp:gp.timestamp,axes,buttons,vibrationActuator:gp.vibrationActuator,raw:gp};}
function padsRaw(){try{return navigator.getGamepads?Array.from(navigator.getGamepads()).filter(p=>p&&p.connected):[];}catch(e){return [];}}
function padsNow(){const raw=padsRaw();const act=raw.find(g=>g.buttons.some(b=>b.pressed)||g.axes.some(v=>Math.abs(v)>0.5));if(act&&act.id!==PAD_LAST_ID){PAD_LAST_ID=act.id;glyphsSoon();}else if(!PAD_LAST_ID&&raw[0]){PAD_LAST_ID=raw[0].id;glyphsSoon();}
  return raw.map(padVirtual);}
// the icon for a logical button on the controller in use
function padLabel(b,fam){fam=fam||padFamily();const F=PAD_FAMILIES[fam]||PAD_FAMILIES.xbox,p=padMapNow(fam)[b];return F.btn[p==null?b:p]||'?';}

/* ---------- button icons on screen: every .glyph written in the Xbox layout is shown for the pad in use ---------- */
const GLYPH_X={A:0,B:1,X:2,Y:3,LB:4,RB:5,LT:6,RT:7,'≡':9,R3:11,'▲':12};
function glyphPass(){
  document.documentElement.dataset.pad=padFamily();
  document.querySelectorAll('.glyph').forEach(el=>{
    const t=el.textContent.trim();let base=el.dataset.gx;
    if(t!==el.dataset.gshow){if(!(t in GLYPH_X)){delete el.dataset.gx;delete el.dataset.gshow;return;}base=t;}
    if(!base)return;const want=padLabel(GLYPH_X[base]);
    el.dataset.gx=base;el.dataset.gshow=want;if(el.textContent!==want)el.textContent=want;});}
let glyphT=0;function glyphsSoon(){if(glyphT)return;glyphT=requestAnimationFrame(()=>{glyphT=0;glyphPass();padBarRender();ctlMapRender();});}
new MutationObserver(glyphsSoon).observe(document.body,{subtree:true,childList:true,characterData:true});
// keyboard prompts follow the keyboard map
{const base=updateGlyphs;updateGlyphs=function(){base();if(lastInput!=='pointer')return;
  const s=(id,a)=>{const el=$(id);if(el)el.textContent=keyName(KEY(a));};s('#g-skip','skip');s('#g-cam','camera');s('#g-menu','menu');s('#mglyph','moment');s('#g-gk','keeper');};}

/* ---------- on-screen keyboard for text fields when you use a controller ---------- */
const OSK={el:null,field:null,shift:true,i:0,keys:[]};
const OSK_ROWS=[['1','2','3','4','5','6','7','8','9','0'],['Q','W','E','R','T','Y','U','I','O','P'],['A','S','D','F','G','H','J','K','L','-'],['Z','X','C','V','B','N','M','.','\'','&'],['⇧','Space','⌫','Done']];
function oskOpen(){return !!(OSK.el&&!OSK.el.hidden);}
function oskBuild(){if(OSK.el)return;const d=document.createElement('div');d.id='osk';d.hidden=true;d.setAttribute('role','dialog');d.setAttribute('aria-label','On-screen keyboard');
  d.innerHTML='<div class="osk-in"><p class="h" id="osk-lab">Type</p><div class="osk-val" id="osk-val"></div><div class="osk-keys" id="osk-keys"></div><p class="osk-help"><span class="glyph a">A</span> Type <span class="glyph x">X</span> Delete <span class="glyph y">Y</span> Space <span class="glyph">≡</span> Done <span class="glyph b">B</span> Close</p></div>';
  document.body.appendChild(d);OSK.el=d;
  const box=d.querySelector('#osk-keys');OSK_ROWS.forEach(r=>{const row=document.createElement('div');row.className='osk-row';r.forEach(k=>{const b=document.createElement('button');b.type='button';b.className='osk-k'+(k.length>1?' wide':'');b.dataset.k=k;b.textContent=k;b.tabIndex=-1;
    b.addEventListener('click',()=>{OSK.i=OSK.keys.indexOf(b);oskPress(k);});row.appendChild(b);OSK.keys.push(b);});box.appendChild(row);});}
function oskShow(field){oskBuild();OSK.field=field;OSK.shift=!field.value;OSK.i=OSK.keys.findIndex(b=>b.dataset.k==='Q');
  const lab=field.id&&document.querySelector(`label[for="${field.id}"]`);$('#osk-lab').textContent=(lab&&lab.textContent)||field.getAttribute('aria-label')||field.placeholder||'Type';
  OSK.el.hidden=false;oskDraw();sfx('tock',10);}
function oskClose(done){if(!oskOpen())return;OSK.el.hidden=true;const f=OSK.field;OSK.field=null;if(f){f.dispatchEvent(new Event('change',{bubbles:true}));f.focus({preventScroll:true});}if(done)sfx('tock',20);}
function oskSet(v){const f=OSK.field;if(!f)return;const max=+f.getAttribute('maxlength')||64;v=v.slice(0,max);if(f.value!==v){f.value=v;f.dispatchEvent(new Event('input',{bubbles:true}));}oskDraw();}
function oskPress(k){const f=OSK.field;if(!f)return;
  if(k==='Done'){oskClose(true);return;}if(k==='⇧'){OSK.shift=!OSK.shift;oskDraw();return;}
  if(k==='⌫'){oskSet(f.value.slice(0,-1));return;}
  const ch=k==='Space'?' ':(OSK.shift?k:k.toLowerCase());oskSet(f.value+ch);if(OSK.shift&&/[A-Z]/i.test(ch))OSK.shift=false;oskDraw();sfx('tock',4);}
function oskDraw(){if(!OSK.el)return;$('#osk-val').textContent=(OSK.field?OSK.field.value:'')+'▏';
  OSK.keys.forEach((b,i)=>{const k=b.dataset.k;if(k.length===1)b.textContent=OSK.shift?k:k.toLowerCase();b.classList.toggle('on',i===OSK.i);b.classList.toggle('lit',k==='⇧'&&OSK.shift);});}
function oskMove(dir){const cur=OSK.keys[OSK.i]||OSK.keys[0],c=cur.getBoundingClientRect(),cx=c.left+c.width/2,cy=c.top+c.height/2;let best=-1,bs=1e9;
  OSK.keys.forEach((b,i)=>{if(i===OSK.i)return;const r=b.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,dx=x-cx,dy=y-cy;
    const main=dir==='u'?-dy:dir==='d'?dy:dir==='l'?-dx:dx,side=dir==='u'||dir==='d'?Math.abs(dx):Math.abs(dy);if(main<4)return;const s=main+side*2;if(s<bs){bs=s;best=i;}});
  if(best<0){const row=cur.parentElement,list=[...row.children];if(dir==='l')best=OSK.keys.indexOf(list[list.length-1]);else if(dir==='r')best=OSK.keys.indexOf(list[0]);}
  if(best>=0){OSK.i=best;oskDraw();sfx('tock',3);}}
function oskPad(gp,st,dt){const pressed=k=>gp.buttons[k]&&gp.buttons[k].pressed,edge=k=>pressed(k)&&!st.btn[k];
  const lx=gp.axes[0]||0,ly=gp.axes[1]||0,now=performance.now();
  const dir=pressed(12)?'u':pressed(13)?'d':pressed(14)?'l':pressed(15)?'r':Math.abs(ly)>0.6&&Math.abs(ly)>=Math.abs(lx)?(ly<0?'u':'d'):Math.abs(lx)>0.6?(lx<0?'l':'r'):'';
  if(!dir)st.navD='';else if(dir!==st.navD){st.navD=dir;st.navT=now+340;oskMove(dir);}else if(now>st.navT){st.navT=now+120;oskMove(dir);}
  if(edge(0))oskPress(OSK.keys[OSK.i].dataset.k);
  if(edge(2))oskPress('⌫');if(edge(3))oskPress('Space');if(edge(4)||edge(5))oskPress('⇧');
  if(edge(9))oskClose(true);else if(edge(1))oskClose(false);}
addEventListener('keydown',e=>{if(!oskOpen())return;e.stopPropagation();
  if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();oskClose(e.key==='Enter');return;}
  if(e.key==='Backspace'){e.preventDefault();oskPress('⌫');return;}
  if(e.key.length===1){e.preventDefault();OSK.field&&oskSet(OSK.field.value+e.key);}},true);
const isTextField=el=>el&&el.matches&&el.matches('input[type=text],input:not([type]),input[type=search],textarea');

/* ---------- controller prompt bar (bottom right of the menus while you use a controller) ---------- */
function padBarRender(){
  let bar=$('#padbar');if(!bar){bar=document.createElement('div');bar.id='padbar';bar.setAttribute('aria-hidden','true');(document.querySelector('#hub .hub-main')||$('#hub')).after(bar);}
  const ko=typeof hubTab!=='undefined'&&hubTab==='kickoff';
  const items=ko?[['A','Kick off'],['B','Back'],['LB','RB','Club']]:[['A','Select'],['B','Back'],['LB','RB','Tabs'],['LT','RT','Sections']];
  const html=items.map(it=>it.slice(0,-1).map(g=>`<span class="glyph ${g==='A'?'a':g==='B'?'b':''}">${padLabel(GLYPH_X[g])}</span>`).join('')+'<b>'+it[it.length-1]+'</b>').join('');
  if(bar.dataset.h!==html){bar.dataset.h=html;bar.innerHTML=html;}}

/* ---------- Settings > Controls: the button map, written from the mapping (data/controls.json) ---------- */
function ctlMapRender(){const box=document.querySelector('#hub .ctl-map');if(!box)return;
  const k=a=>keyName(KEY(a)),g=a=>{const x=PAD_ACTIONS.find(p=>p.id===a);return x?padLabel(x.b):'?';};
  const rows=[['Flick','Press on the pitch, pull back, release','Right stick: pull back, then flick'],
    ['Pick a figure','Click it, or '+k('nextFig'),'Left stick, '+g('prev')+' / '+g('next')],['Moment',k('moment'),g('moment')],
    ['Curl (Finesse)',k('curlL')+' / '+k('curlR'),g('ltrig')+' / '+g('rtrig')],['Slide keeper (block)','Drag him, or '+k('curlL')+' / '+k('curlR'),g('ltrig')+' / '+g('rtrig')],
    ['Skip block',k('skip'),g('confirm')],['Keeper out / back',k('keeper'),g('keeper')],['Set-piece spot',k('spot1')+' / '+k('spot2')+' / '+k('spot3'),g('moment')+' / '+g('confirm')+' / '+g('back')],
    ['Reset camera',k('camera'),g('camera')],['Orbit camera','Hold middle mouse and drag','–'],['Frame the ball','Hold F','–'],
    ['Cancel a pull','Right click, or Esc',g('back')],['Pause',k('menu'),g('menu')],['Next song',k('music'),g('music')],
    ['Move a formation shield','Drag it',g('confirm')+' to pick it, right stick to move, '+g('moment')+' to confirm'],
    ['Menu tabs','Click, or Q / E',g('prev')+' / '+g('next')],['Sub-menus','Click, or Z / C',g('ltrig')+' / '+g('rtrig')],
    ['Move in menus','Hover, or the arrow keys (hold to speed up)','D-pad or left stick (hold to speed up)'],['Press and go back','Click, Enter or Space · Esc or Backspace',g('confirm')+' to press, '+g('back')+' to go back'],
    ['Change a value','Arrow left / right on a slider, toggle or list','Left / right on a slider, toggle or list'],['Menu pointer','Mouse','Right stick, '+g('confirm')+' to click or drag'],
    ['Type a name','Keyboard',g('confirm')+' on the field opens the on-screen keyboard']];
  const fam=PAD_FAMILIES[padFamily()].name,e=t=>String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const html='<div class="cm-h"></div><div class="cm-h">Keyboard and mouse</div><div class="cm-h">Controller ('+e(fam)+')</div>'+rows.map(r=>'<div class="cm-a">'+e(r[0])+'</div><div>'+e(r[1])+'</div><div>'+e(r[2])+'</div>').join('');
  if(box.dataset.h!==html){box.dataset.h=html;box.innerHTML=html;}}
{const base=setInput;setInput=function(k){base(k);glyphsSoon();ctlMapRender();};}
// a build for a handheld (Distal > Settings > Build) can hide what needs a mouse or is only for development
if(window.FLICK_BUILD&&FLICK_BUILD.hideDev){document.documentElement.classList.add('nodev');const i=TABS.indexOf('balance');if(i>=0)TABS.splice(i,1);}
ctlMapRender();glyphsSoon();
