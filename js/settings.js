// Flick Cup 2026 · js/settings.js
// Settings: music, volumes, graphics, controls.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= settings ================= */
const fmtDur=s=>Math.floor(s/60)+':'+String(Math.round(s%60)).padStart(2,'0');
function renderTracks(){
  const ul=$('#tracks');if(!ul)return;ul.innerHTML='';const curT=music.current();
  TRACKS.forEach(t=>{
    const on=!SET.off.includes(t.id),li=document.createElement('li');li.className='trk'+(t===curT?' cur':'')+(on?'':' off');
    const tog=document.createElement('span');tog.className='tog';tog.innerHTML='<input type="checkbox"><i></i>';const cb=tog.querySelector('input');cb.checked=on;cb.setAttribute('aria-label','Include '+t.title+' in the playlist');
    cb.onchange=()=>{SET.off=SET.off.filter(x=>x!==t.id);if(!cb.checked)SET.off.push(t.id);saveSet();renderTracks();music.refresh();};
    const pb=document.createElement('button');pb.className='ibtn';pb.textContent=t===curT?'❚❚':'▶';pb.setAttribute('aria-label',(t===curT?'Stop ':'Play ')+t.title);
    pb.onclick=()=>{ensureAudio();if(t===curT)music.halt();else music.play(t,1.5);};
    const tt=document.createElement('div');tt.className='tt';const b=document.createElement('b');b.textContent=t.title;
    if(t.alt){const a=document.createElement('span');a.className='alt';a.textContent=t.alt;b.appendChild(a);}
    const sm=document.createElement('small');sm.textContent=(t.artist||'Unknown artist')+(t.user?' · added this session':'');tt.append(b,sm);
    const du=document.createElement('span');du.className='dur';du.textContent=t.dur?fmtDur(t.dur):'';
    li.append(tog,pb,tt,du);ul.appendChild(li);
  });
}
// On GitHub Pages, any audio file pushed into music/ joins the playlist (named "Title + Version - Artist.mp3")
(async function findRepoTracks(){
  // which files are in music/: on GitHub Pages ask GitHub, elsewhere read the folder listing your web server shows
  let names=[];
  const h=location.hostname;
  if(/\.github\.io$/i.test(h)){
    const owner=h.split('.')[0],seg=location.pathname.split('/').filter(Boolean)[0],repo=seg&&!/\.html?$/i.test(seg)?seg:h;
    try{const r=await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/music`);if(r.ok){const list=await r.json();if(Array.isArray(list))names=list.filter(f=>f&&f.type==='file').map(f=>f.name);}}catch(e){}
  }else if(location.protocol!=='file:'&&!window.claude){
    try{const r=await fetch('music/');if(r.ok){const html=await r.text();names=[...html.matchAll(/href="([^"?#]+)"/gi)].map(m=>{try{return decodeURIComponent(m[1]).split('/').pop();}catch(e){return '';}});}}catch(e){}
  }
  const known=new Set(TRACKS.map(t=>decodeURIComponent(String(t.src).split('/').pop()).toLowerCase()));
  let added=0;
  [...new Set(names)].filter(n=>/\.(mp3|ogg|m4a|wav)$/i.test(n)&&!/^stadium-ambience\./i.test(n)&&!known.has(n.toLowerCase())).sort((a,b)=>a.localeCompare(b)).forEach(n=>{
    known.add(n.toLowerCase());const t=Object.assign({id:'gh_'+n,src:'music/'+encodeURIComponent(n),dur:0},parseTrackName(n));TRACKS.push(t);added++;
    const a=new Audio();a.preload='metadata';a.src=t.src;a.onloadedmetadata=()=>{t.dur=a.duration;renderTracks();};});
  if(added){renderTracks();music.refresh();}
})();
$('#add-tracks').addEventListener('change',e=>{
  const files=Array.from(e.target.files||[]);
  files.forEach((f,i)=>{const t=Object.assign({id:'u'+Date.now()+'_'+i,src:URL.createObjectURL(f),user:true,dur:0},parseTrackName(f.name));TRACKS.push(t);
    const a=new Audio();a.preload='metadata';a.src=t.src;a.onloadedmetadata=()=>{t.dur=a.duration;renderTracks();};});
  e.target.value='';renderTracks();
});
$('#btn-np-skip').addEventListener('click',()=>{ensureAudio();music.next();});
$('#np-next').addEventListener('click',()=>{ensureAudio();music.next();});
function bindRange(id,out,key,fmt,onChange){const el=$('#'+id),o=$('#'+out);el.value=SET[key];o.textContent=fmt(SET[key]);el.addEventListener('input',()=>{SET[key]=+el.value;o.textContent=fmt(SET[key]);onChange();saveSet();});}
function bindToggle(id,key,onChange){const el=$('#'+id);el.checked=!!SET[key];el.addEventListener('change',()=>{SET[key]=el.checked;saveSet();onChange();});}
const pct=v=>v+'%';
bindRange('vol-master','o-master','master',pct,applyVolumes);
bindRange('vol-music','o-music','music',pct,applyVolumes);
bindRange('vol-crowd','o-crowd','crowd',pct,()=>{ensureAudio();applyVolumes();});
bindRange('vol-sfx','o-sfx','sfx',pct,()=>{applyVolumes();ensureAudio();sfx('tock',30);});
bindToggle('music-match','inMatch',()=>{applyVolumes();music.refresh();});
bindToggle('mute-all','mute',()=>{syncMuteBtn();applyVolumes();});
const PRESETS={low:{scale:60,shadows:false},med:{scale:85,shadows:true},high:{scale:100,shadows:true}};
function applyGraphics(){
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75)*SET.scale/100);resize();
  const sz=SET.q==='high'?2048:1024;
  if(sun.castShadow!==SET.shadows||sun.shadow.mapSize.x!==sz){
    sun.castShadow=SET.shadows;
    if(sun.shadow.mapSize.x!==sz){sun.shadow.mapSize.set(sz,sz);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}
    scene.traverse(o=>{if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true);}});
  }
  document.body.classList.toggle('calm',!!SET.calm);
  document.querySelectorAll('#gfx-preset .chip').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.q===SET.q)));
  $('#gfx-scale').value=SET.scale;$('#o-scale').textContent=SET.scale+'%';$('#gfx-shadows').checked=SET.shadows;
}
document.querySelectorAll('#gfx-preset .chip').forEach(b=>b.addEventListener('click',()=>{SET.q=b.dataset.q;Object.assign(SET,PRESETS[SET.q]);saveSet();applyGraphics();}));
bindRange('gfx-scale','o-scale','scale',pct,()=>{SET.q='custom';applyGraphics();});
bindToggle('gfx-shadows','shadows',()=>{SET.q='custom';applyGraphics();});
bindToggle('gfx-guides','guides',()=>{});
bindToggle('gfx-calm','calm',applyGraphics);
bindToggle('ctl-lock','lock',()=>{});
bindRange('ctl-msens','o-msens','msens',pct,()=>{});bindRange('ctl-csens','o-csens','csens',pct,()=>{});bindToggle('ctl-invy','invY',()=>{});
bindRange('ctl-dz','o-dz','dz',pct,()=>{});bindRange('ctl-rspeed','o-rspeed','rspeed',pct,()=>{});bindToggle('ctl-rumble','rumble',()=>{});
syncMuteBtn();syncHobby();renderTracks();applyGraphics();
// the browser only allows sound after the viewer interacts: start audio (and the menu music) on the first press anywhere
['pointerdown','keydown','touchstart'].forEach(ev=>window.addEventListener(ev,()=>ensureAudio(),{capture:true,passive:true}));

