// Flick Cup 2026 · js/audio.js
// Sound effects, music player and crowd ambience.
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= audio ================= */
const SET=(()=>{const d={master:80,music:60,sfx:90,crowd:30,mute:false,inMatch:false,off:[],q:'high',scale:100,shadows:true,guides:true,calm:false,lock:true,msens:100,csens:100,invY:false,dz:20,rspeed:100,rumble:true};try{const v=JSON.parse(store.get('baize.settings')||'{}');return Object.assign(d,v&&typeof v==='object'?v:{});}catch(e){return d;}})();
if(!Array.isArray(SET.off))SET.off=[];
function saveSet(){store.set('baize.settings',JSON.stringify(SET));}
let AC=null,BUS=null,sndT=0;
const soundOn=()=>!SET.mute;
function ensureAudio(){
  if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){AC=null;}
    if(AC){const m=AC.createGain(),fx=AC.createGain(),mu=AC.createGain(),am=AC.createGain();fx.connect(m);mu.connect(m);am.gain.value=0;am.connect(m);m.connect(AC.destination);BUS={m,fx,mu,am};applyVolumes();}}
  if(AC&&AC.state==='suspended')AC.resume().catch(()=>{});
  music.kick();ambience.update();
}
function applyVolumes(){
  if(!BUS)return;const t=AC.currentTime;
  BUS.m.gain.setTargetAtTime(SET.mute?0:SET.master/100,t,0.05);
  BUS.fx.gain.setTargetAtTime(SET.sfx/100,t,0.05);
  BUS.mu.gain.setTargetAtTime((SET.music/100)*(music.inMatch()?0.6:1),t,0.25);
  ambience.update();
}
function tone(f0,f1,dur,vol,type){if(!AC||!soundOn())return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g).connect(BUS.fx);o.start(t);o.stop(t+dur+0.02);}
function noise(dur,vol,freq,q,attack){if(!AC||!soundOn())return;const t=AC.currentTime,len=Math.ceil(AC.sampleRate*dur),buf=AC.createBuffer(1,len,AC.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;const s=AC.createBufferSource();s.buffer=buf;const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;f.Q.value=q||1;const g=AC.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+(attack||0.005));g.gain.exponentialRampToValueAtTime(0.0001,t+dur);s.connect(f).connect(g).connect(BUS.fx);s.start(t);}
function sfx(k,v){
  if(!AC||!soundOn())return;
  const now=performance.now();
  if(k==='tock'||k==='clack'){if(now-sndT<35)return;sndT=now;}
  const a=clamp((v||20)/60,0.08,1);
  if(k==='flick'){noise(0.06,0.5*a+0.1,3200,1.2);tone(1400,600,0.05,0.12*a,'triangle');}
  else if(k==='tock'){tone(820,260,0.09,0.35*a,'sine');noise(0.03,0.2*a,2400,2);}
  else if(k==='clack'){tone(1700,900,0.05,0.18*a,'square');}
  else if(k==='net'){noise(0.35,0.25,600,0.7,0.02);}
  else if(k==='whistle'){[0,0.18].forEach(d=>setTimeout(()=>{tone(2750,2650,0.14,0.12,'sine');noise(0.14,0.05,2800,8);},d*1000));}
  else if(k==='goal'){noise(1.8,0.35,900,0.5,0.25);noise(1.4,0.18,2200,0.8,0.15);setTimeout(()=>sfx('whistle'),200);}
  else if(k==='moment'){tone(520,1040,0.25,0.18,'triangle');setTimeout(()=>tone(780,1560,0.3,0.16,'triangle'),120);noise(0.8,0.15,1500,0.6,0.1);}
}

/* ================= music ================= */
// Name convention: "Title + Alternative version - Artist"
function parseTrackName(n){
  n=String(n).replace(/\.[a-z0-9]{2,4}$/i,'').replace(/_/g,' ').replace(/\s+/g,' ').trim();
  let artist='';const i=n.lastIndexOf(' - ');if(i>0){artist=n.slice(i+3).trim();n=n.slice(0,i);}
  const parts=n.split(/\s\+\s|\+/);
  return{title:parts[0].trim()||'Untitled',alt:parts.slice(1).map(x=>x.trim()).filter(Boolean).join(' · '),artist};
}
const TRACKS=[]; // filled from the files in music/ when the page loads
const music=(()=>{
  const decks=[0,1].map(()=>{const el=new Audio();el.preload='none';el.crossOrigin='anonymous';return{el,g:null};});
  let cur=-1,deck=0,lastTrack=null,npT=0;
  const enabled=()=>TRACKS.filter(t=>!SET.off.includes(t.id));
  function wire(d){if(d.g||!AC)return;try{const src=AC.createMediaElementSource(d.el);d.g=AC.createGain();d.g.gain.value=0;src.connect(d.g).connect(BUS.mu);}catch(e){d.g=null;}}
  function fade(d,to,sec){
    if(d.g){const t=AC.currentTime;d.g.gain.cancelScheduledValues(t);d.g.gain.setValueAtTime(d.g.gain.value,t);d.g.gain.linearRampToValueAtTime(to,t+sec);}
    else{const from=d.el.volume,st=performance.now(),vol=(SET.mute?0:SET.master/100)*(SET.music/100);clearInterval(d.iv);d.iv=setInterval(()=>{const k=Math.min(1,(performance.now()-st)/(sec*1000));d.el.volume=clamp(lerp(from,to*vol,k),0,1);if(k>=1)clearInterval(d.iv);},50);}
  }
  function stop(d,sec){fade(d,0,sec);clearTimeout(d.st);d.st=setTimeout(()=>{if(d!==decks[deck]||cur<0)d.el.pause();},sec*1000+80);}
  function play(track,sec){
    if(!AC||!track)return;
    const old=decks[deck];if(cur>=0)stop(old,1.8);
    deck=1-deck;const d=decks[deck];wire(d);clearTimeout(d.st);
    d.el.src=track.src;d.el.currentTime=0;if(!d.g)d.el.volume=0;
    const p=d.el.play();if(p&&p.catch)p.catch(()=>{});
    fade(d,1,sec||3.2);cur=1;lastTrack=track;showNP(track);renderTracks();
    d.el.onended=()=>{if(d===decks[deck])next();};
  }
  function pickRandom(){const list=enabled().filter(t=>t!==lastTrack);const pool=list.length?list:enabled();return pool.length?pool[Math.floor(Math.random()*pool.length)]:null;}
  function next(){const t=pickRandom();if(t)play(t);else halt();}
  function halt(){if(cur<0)return;stop(decks[deck],2.2);cur=-1;hideNP();renderTracks();}
  function wanted(){return !$('#hub').hidden||!$('#ft').hidden||(SET.inMatch&&S.running);}
  function showNP(t){
    $('#np-lab').textContent='Now playing';
    const ttl=$('#np-ttl');ttl.textContent=t.title;if(t.alt){const a=document.createElement('span');a.className='alt';a.textContent=t.alt;ttl.appendChild(a);}
    $('#np-art').textContent=t.artist||'Unknown artist';
    const el=$('#np');el.classList.add('on');el.classList.remove('paused');clearTimeout(npT);
    if($('#hub').hidden&&$('#ft').hidden)npT=setTimeout(()=>el.classList.remove('on'),4500);
  }
  function hideNP(){$('#np').classList.remove('on');}
  return{
    kick(){if(!AC)return;if(wanted()&&cur<0)next();},
    // called whenever the menu opens or closes
    menu(open){if(!AC)return;if(open){next();}else if(!SET.inMatch)halt();else{clearTimeout(npT);npT=setTimeout(hideNP,2500);}},
    next,halt,play,
    inMatch(){return $('#hub').hidden&&$('#ft').hidden&&S.running;},
    current(){return cur>=0?lastTrack:null;},
    refresh(){if(cur>=0&&!enabled().includes(lastTrack))next();else if(cur<0&&wanted())next();}
  };
})();

/* ================= crowd ambience ================= */
// a 60 s seamless loop (cut and crossfaded from the stadium recording), decoded once and looped gaplessly
const ambience=(()=>{
  let buf=null,loading=false,src=null,on=false,stopT=0;
  async function load(){
    if(buf||loading||!AC)return;loading=true;
    try{const r=await fetch('music/stadium-ambience.mp3');const ab=await r.arrayBuffer();buf=await new Promise((ok,no)=>{const pr=AC.decodeAudioData(ab,ok,no);if(pr&&pr.then)pr.then(ok,no);});}catch(e){buf=null;}
    loading=false;update();
  }
  function edges(b){const d=b.getChannelData(0),n=d.length;let a=0,z=n-1;while(a<n&&Math.abs(d[a])<1e-4)a++;while(z>a&&Math.abs(d[z])<1e-4)z--;return[a/b.sampleRate,(z+1)/b.sampleRate];}
  function wanted(){return S.running&&S.phase!=='end'&&$('#hub').hidden&&$('#ft').hidden&&!SET.mute&&SET.crowd>0;}
  function update(){
    if(!AC||!BUS)return;
    const want=wanted(),t=AC.currentTime,lvl=(SET.crowd/100)*0.32;
    if(want&&!buf){load();return;}
    if(want){
      if(!src){src=AC.createBufferSource();src.buffer=buf;src.loop=true;const [a,z]=edges(buf);src.loopStart=a;src.loopEnd=z;src.connect(BUS.am);src.start(0,a+Math.random()*(z-a));}
      BUS.am.gain.cancelScheduledValues(t);BUS.am.gain.setTargetAtTime(lvl,t,on?0.3:1.2);on=true;
    }else if(on){
      on=false;BUS.am.gain.cancelScheduledValues(t);BUS.am.gain.setTargetAtTime(0,t,0.6);
      clearTimeout(stopT);stopT=setTimeout(()=>{if(!on&&src){try{src.stop();}catch(e){}src.disconnect();src=null;}},3500);
    }
  }
  return{update};
})();

