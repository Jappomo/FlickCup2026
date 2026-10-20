// Flick Cup 2026 · js/clubs.js
// The 15 AI clubs (data/teams.json), playstyles and difficulty tiers, the kit clash rule and the club emblems (models/emblem.glb).
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
/* ================= AI clubs ================= */
// The 15 AI clubs live in data/teams.json (edited in Distal > Balancing > Clubs); the values below are the defaults
// when the file is missing. Each club: name, 3-letter short name, emblem (SM_Emblem_### in models/emblem.glb),
// difficulty stars (tier), playstyle, formation, kick-off pair, path, Moment, corner set-ups, home/away kits,
// keeper colours, 10 players (name + stars). Players follow the same rule as yours: 5 points, at most 3 per stat.
// TEAMS_DEF is generated with the club list (see the roadmap); edit the clubs in Distal, not here.
const TEAMS_DEF={"version":1,"clash":120,"tiers":{"1":{"name":"Amateur","aim":1.8,"power":1.5},"2":{"name":"Pro","aim":1.2,"power":1.1},"3":{"name":"Elite","aim":0.75,"power":0.85}},"playstyles":{"fortress":{"name":"Fortress","desc":"Deep and patient. Short safe passes, sits back and blocks close to goal.","pass":22,"spread":12,"aim":1,"power":0.06,"press":14,"reach":30,"sit":0.5,"moment":1},"counter":{"name":"Counter","desc":"Sits back, then breaks long and fast when it wins the ball.","pass":40,"spread":14,"aim":1,"power":0.08,"press":11,"reach":34,"sit":0.35,"moment":1},"tiki":{"name":"Tiki-Taka","desc":"Short passes along the floor, keeps the ball and waits for the gap.","pass":16,"spread":10,"aim":0.9,"power":0.05,"press":9,"reach":38,"sit":0.1,"moment":1},"longball":{"name":"Long Ball","desc":"Big flicks forward to the strikers, every time.","pass":48,"spread":18,"aim":1.1,"power":0.12,"press":9,"reach":38,"sit":0.15,"moment":1},"press":{"name":"Press","desc":"Aggressive high line: chases the ball everywhere and blocks tight.","pass":28,"spread":14,"aim":1,"power":0.08,"press":5,"reach":55,"sit":0,"moment":1},"wildcard":{"name":"Wildcard","desc":"Unpredictable: wild angles, mixed power, Moments at odd times.","pass":30,"spread":26,"aim":1.4,"power":0.2,"press":9,"reach":42,"sit":0.2,"moment":0.6}},"clubs":[{"id":"club001","name":"Millbrook Rovers","short":"MIL","emblem":"001","stars":1,"playstyle":"longball","formation":"4-4-2","kickoff":[8,9],"path":"att","moment":"bicycle","corner":"agg","dcorner":"bal","locked":false,"kits":{"home":{"shirt":"#1f8a3e","shorts":"#f2f0ea","socks":"#1f8a3e"},"away":{"shirt":"#f2f0ea","shorts":"#1f8a3e","socks":"#f2f0ea"},"keeper":"#e7b923","keeperAway":"#161618"},"players":[{"name":"Abbott","st":[0,2,0,3,0]},{"name":"Balogun","st":[0,3,1,1,0]},{"name":"Carver","st":[0,3,1,1,0]},{"name":"Delgado","st":[0,2,0,3,0]},{"name":"Ferreira","st":[1,0,1,3,0]},{"name":"Granger","st":[1,0,1,3,0]},{"name":"Juarez","st":[1,0,1,3,0]},{"name":"Lowe","st":[1,0,1,3,0]},{"name":"Murata","st":[3,1,0,1,0]},{"name":"Osei","st":[3,1,0,1,0]}]},{"id":"club002","name":"Harbourside Athletic","short":"HAR","emblem":"002","stars":1,"playstyle":"counter","formation":"5-3-2","kickoff":[8,9],"path":"def","moment":"thread","corner":"bal","dcorner":"agg","locked":false,"kits":{"home":{"shirt":"#1d2f6b","shorts":"#6fb7ea","socks":"#1d2f6b"},"away":{"shirt":"#6fb7ea","shorts":"#1d2f6b","socks":"#6fb7ea"},"keeper":"#ff7a1a","keeperAway":"#39ff6a"},"players":[{"name":"Eklund","st":[0,2,1,2,0]},{"name":"Foster","st":[0,3,1,1,0]},{"name":"Hayashi","st":[0,3,1,1,0]},{"name":"Kimura","st":[0,3,1,1,0]},{"name":"Mahler","st":[0,2,1,2,0]},{"name":"Novak","st":[0,0,2,2,1]},{"name":"Paxton","st":[0,2,2,1,0]},{"name":"Ruiz","st":[0,0,2,2,1]},{"name":"Tabor","st":[3,0,0,2,0]},{"name":"Vega","st":[3,0,0,2,0]}]},{"id":"club003","name":"Saltmarsh Town","short":"SAL","emblem":"003","stars":1,"playstyle":"fortress","formation":"5-3-2","kickoff":[8,9],"path":"def","moment":"moon","corner":"def","dcorner":"def","locked":false,"kits":{"home":{"shirt":"#7b1e3a","shorts":"#e7b923","socks":"#7b1e3a"},"away":{"shirt":"#e7b923","shorts":"#7b1e3a","socks":"#e7b923"},"keeper":"#161618","keeperAway":"#22c8ff"},"players":[{"name":"Larsen","st":[0,3,1,1,0]},{"name":"Merrick","st":[0,3,2,0,0]},{"name":"Okoro","st":[0,3,2,0,0]},{"name":"Quist","st":[0,3,2,0,0]},{"name":"Sayer","st":[0,3,1,1,0]},{"name":"Toro","st":[0,0,2,2,1]},{"name":"Ward","st":[0,3,1,1,0]},{"name":"Achebe","st":[0,0,2,2,1]},{"name":"Barrow","st":[3,0,0,0,2]},{"name":"Castillo","st":[3,0,0,0,2]}]},{"id":"club004","name":"Copperfield Wanderers","short":"COP","emblem":"004","stars":1,"playstyle":"wildcard","formation":"4-3-3","kickoff":[8,9],"path":"mid","moment":"maradona","corner":"agg","dcorner":"bal","locked":false,"kits":{"home":{"shirt":"#c8642a","shorts":"#15151a","socks":"#15151a"},"away":{"shirt":"#15151a","shorts":"#c8642a","socks":"#c8642a"},"keeper":"#22c8ff","keeperAway":"#e8ff2a"},"players":[{"name":"Rinaldi","st":[0,2,1,2,0]},{"name":"Soto","st":[0,3,1,1,0]},{"name":"Urquhart","st":[0,3,1,1,0]},{"name":"Yates","st":[0,2,1,2,0]},{"name":"Alcott","st":[1,0,1,1,2]},{"name":"Birch","st":[0,2,2,1,0]},{"name":"Corrigan","st":[1,0,1,1,2]},{"name":"Ellery","st":[1,0,1,2,1]},{"name":"Garrido","st":[2,0,0,0,3]},{"name":"Hendry","st":[1,0,1,2,1]}]},{"id":"club005","name":"Lantern Lane","short":"LAN","emblem":"005","stars":1,"playstyle":"tiki","formation":"4-2-3-1","kickoff":[9,7],"path":"mid","moment":"thread","corner":"bal","dcorner":"bal","locked":false,"kits":{"home":{"shirt":"#e7b923","shorts":"#2459c4","socks":"#e7b923"},"away":{"shirt":"#2459c4","shorts":"#e7b923","socks":"#2459c4"},"keeper":"#ff3fa8","keeperAway":"#161618"},"players":[{"name":"Zeller","st":[0,2,1,2,0]},{"name":"Ashdown","st":[0,3,1,1,0]},{"name":"Brodie","st":[0,3,1,1,0]},{"name":"Dalton","st":[0,2,1,2,0]},{"name":"Farrow","st":[0,1,3,1,0]},{"name":"Gomez","st":[0,1,3,1,0]},{"name":"Jansen","st":[0,0,3,1,1]},{"name":"Lennox","st":[1,0,3,0,1]},{"name":"Moreno","st":[0,0,3,1,1]},{"name":"Olsen","st":[2,0,1,0,2]}]},{"id":"club006","name":"Ironbridge United","short":"IRB","emblem":"006","stars":2,"playstyle":"press","formation":"4-3-3","kickoff":[8,9],"path":"att","moment":"finesse","corner":"agg","dcorner":"agg","locked":false,"kits":{"home":{"shirt":"#b3201c","shorts":"#1b1b1d","socks":"#b3201c"},"away":{"shirt":"#8a8f98","shorts":"#1b1b1d","socks":"#8a8f98"},"keeper":"#39ff6a","keeperAway":"#ff7a1a"},"players":[{"name":"Drummond","st":[0,2,1,2,0]},{"name":"Flores","st":[0,3,1,1,0]},{"name":"Halvorsen","st":[0,3,1,1,0]},{"name":"Kaya","st":[0,2,1,2,0]},{"name":"Madsen","st":[0,1,1,3,0]},{"name":"Navarro","st":[0,2,0,3,0]},{"name":"Palmer","st":[0,1,1,3,0]},{"name":"Rook","st":[1,0,1,2,1]},{"name":"Stroud","st":[3,0,0,1,1]},{"name":"Vance","st":[1,0,1,2,1]}]},{"id":"club007","name":"Bluewater Albion","short":"BWA","emblem":"007","stars":2,"playstyle":"tiki","formation":"4-3-3","kickoff":[8,9],"path":"mid","moment":"thread","corner":"bal","dcorner":"bal","locked":false,"kits":{"home":{"shirt":"#6fb7ea","shorts":"#f2f0ea","socks":"#6fb7ea"},"away":{"shirt":"#f2f0ea","shorts":"#1d2f6b","socks":"#f2f0ea"},"keeper":"#e8ff2a","keeperAway":"#ff3fa8"},"players":[{"name":"Koval","st":[0,2,1,2,0]},{"name":"Mbeki","st":[0,3,1,1,0]},{"name":"Ochoa","st":[0,3,1,1,0]},{"name":"Petit","st":[0,2,1,2,0]},{"name":"Salgado","st":[0,0,3,1,1]},{"name":"Teague","st":[0,1,3,1,0]},{"name":"Wade","st":[0,0,3,1,1]},{"name":"Zubiri","st":[1,0,1,2,1]},{"name":"Bakker","st":[2,0,1,0,2]},{"name":"Calloway","st":[1,0,1,2,1]}]},{"id":"club008","name":"Northgate Harriers","short":"NGH","emblem":"008","stars":2,"playstyle":"counter","formation":"4-4-2","kickoff":[8,9],"path":"def","moment":"thread","corner":"bal","dcorner":"agg","locked":false,"kits":{"home":{"shirt":"#f2f0ea","shorts":"#1b1b1d","socks":"#f2f0ea"},"away":{"shirt":"#1b1b1d","shorts":"#f2f0ea","socks":"#1b1b1d"},"keeper":"#ff7a1a","keeperAway":"#22c8ff"},"players":[{"name":"Ramos","st":[0,2,1,2,0]},{"name":"Shaw","st":[0,3,1,1,0]},{"name":"Ueda","st":[0,3,1,1,0]},{"name":"Whitlock","st":[0,2,1,2,0]},{"name":"Ahlberg","st":[0,0,2,2,1]},{"name":"Bellamy","st":[0,0,2,2,1]},{"name":"Cole","st":[0,0,2,2,1]},{"name":"Duarte","st":[0,0,2,2,1]},{"name":"Fontaine","st":[3,0,0,2,0]},{"name":"Harlow","st":[3,0,0,2,0]}]},{"id":"club009","name":"Valemont Sporting","short":"VAL","emblem":"009","stars":2,"playstyle":"longball","formation":"3-5-2","kickoff":[8,9],"path":"att","moment":"bicycle","corner":"agg","dcorner":"bal","locked":false,"kits":{"home":{"shirt":"#5b2a9e","shorts":"#f2f0ea","socks":"#5b2a9e"},"away":{"shirt":"#f2f0ea","shorts":"#5b2a9e","socks":"#f2f0ea"},"keeper":"#39ff6a","keeperAway":"#161618"},"players":[{"name":"Young","st":[0,3,1,1,0]},{"name":"Arkwright","st":[0,3,1,1,0]},{"name":"Bogdan","st":[0,3,1,1,0]},{"name":"Cruz","st":[0,2,0,3,0]},{"name":"Esposito","st":[1,0,1,3,0]},{"name":"Gibbs","st":[1,0,1,3,0]},{"name":"Hughes","st":[0,2,0,3,0]},{"name":"Lacroix","st":[1,0,2,1,1]},{"name":"Medina","st":[3,1,0,1,0]},{"name":"Oduya","st":[3,1,0,1,0]}]},{"id":"club010","name":"Kestrel City","short":"KES","emblem":"010","stars":2,"playstyle":"wildcard","formation":"4-2-3-1","kickoff":[9,7],"path":"mid","moment":"maradona","corner":"agg","dcorner":"bal","locked":false,"kits":{"home":{"shirt":"#138a8a","shorts":"#f2f0ea","socks":"#ec7a1c"},"away":{"shirt":"#ec7a1c","shorts":"#138a8a","socks":"#138a8a"},"keeper":"#161618","keeperAway":"#e8ff2a"},"players":[{"name":"Delgado","st":[0,2,1,2,0]},{"name":"Ferreira","st":[0,3,1,1,0]},{"name":"Granger","st":[0,3,1,1,0]},{"name":"Juarez","st":[0,2,1,2,0]},{"name":"Lowe","st":[0,2,2,1,0]},{"name":"Murata","st":[0,2,2,1,0]},{"name":"Osei","st":[1,0,1,1,2]},{"name":"Reyes","st":[1,0,1,0,3]},{"name":"Silva","st":[1,0,1,1,2]},{"name":"Underhill","st":[2,0,0,0,3]}]},{"id":"club011","name":"Royal Arcadia","short":"ARC","emblem":"011","stars":3,"playstyle":"tiki","formation":"4-3-3","kickoff":[8,9],"path":"mid","moment":"thread","corner":"bal","dcorner":"bal","locked":false,"kits":{"home":{"shirt":"#14213d","shorts":"#e7b923","socks":"#14213d"},"away":{"shirt":"#e7b923","shorts":"#14213d","socks":"#e7b923"},"keeper":"#ff3fa8","keeperAway":"#39ff6a"},"players":[{"name":"Kimura","st":[0,2,1,2,0]},{"name":"Mahler","st":[0,3,1,1,0]},{"name":"Novak","st":[0,3,1,1,0]},{"name":"Paxton","st":[0,2,1,2,0]},{"name":"Ruiz","st":[0,0,3,1,1]},{"name":"Tabor","st":[0,1,3,1,0]},{"name":"Vega","st":[0,0,3,1,1]},{"name":"Zamora","st":[1,0,1,2,1]},{"name":"Asante","st":[2,0,1,0,2]},{"name":"Brannigan","st":[1,0,1,2,1]}]},{"id":"club012","name":"Steelhaven Dynamo","short":"STD","emblem":"012","stars":3,"playstyle":"press","formation":"3-5-2","kickoff":[8,9],"path":"att","moment":"finesse","corner":"agg","dcorner":"agg","locked":false,"kits":{"home":{"shirt":"#5c6670","shorts":"#e7b923","socks":"#5c6670"},"away":{"shirt":"#e7b923","shorts":"#5c6670","socks":"#e7b923"},"keeper":"#22c8ff","keeperAway":"#ff3fa8"},"players":[{"name":"Quist","st":[0,3,1,1,0]},{"name":"Sayer","st":[0,3,1,1,0]},{"name":"Toro","st":[0,3,1,1,0]},{"name":"Ward","st":[0,2,1,2,0]},{"name":"Achebe","st":[0,1,1,3,0]},{"name":"Barrow","st":[0,1,1,3,0]},{"name":"Castillo","st":[0,2,1,2,0]},{"name":"Doherty","st":[1,0,2,1,1]},{"name":"Fitch","st":[3,0,0,1,1]},{"name":"Haddad","st":[3,0,0,1,1]}]},{"id":"club013","name":"Meridian Olympic","short":"MER","emblem":"013","stars":3,"playstyle":"fortress","formation":"5-3-2","kickoff":[8,9],"path":"def","moment":"moon","corner":"def","dcorner":"def","locked":false,"kits":{"home":{"shirt":"#1b1b1d","shorts":"#c9a24a","socks":"#1b1b1d"},"away":{"shirt":"#c9a24a","shorts":"#1b1b1d","socks":"#c9a24a"},"keeper":"#39ff6a","keeperAway":"#22c8ff"},"players":[{"name":"Yates","st":[0,3,1,1,0]},{"name":"Alcott","st":[0,3,2,0,0]},{"name":"Birch","st":[0,3,2,0,0]},{"name":"Corrigan","st":[0,3,2,0,0]},{"name":"Ellery","st":[0,3,1,1,0]},{"name":"Garrido","st":[0,0,2,2,1]},{"name":"Hendry","st":[0,3,1,1,0]},{"name":"Kirby","st":[0,0,2,2,1]},{"name":"Marlow","st":[3,0,0,0,2]},{"name":"Nwosu","st":[3,0,0,0,2]}]},{"id":"club014","name":"Calderon Vale","short":"CAV","emblem":"014","stars":3,"playstyle":"counter","formation":"4-2-3-1","kickoff":[9,7],"path":"def","moment":"thread","corner":"bal","dcorner":"agg","locked":false,"kits":{"home":{"shirt":"#0f5e3a","shorts":"#1b1b1d","socks":"#0f5e3a"},"away":{"shirt":"#f2f0ea","shorts":"#0f5e3a","socks":"#f2f0ea"},"keeper":"#ff7a1a","keeperAway":"#e8ff2a"},"players":[{"name":"Dalton","st":[0,2,1,2,0]},{"name":"Farrow","st":[0,3,1,1,0]},{"name":"Gomez","st":[0,3,1,1,0]},{"name":"Jansen","st":[0,2,1,2,0]},{"name":"Lennox","st":[0,2,2,1,0]},{"name":"Moreno","st":[0,2,2,1,0]},{"name":"Olsen","st":[0,0,2,2,1]},{"name":"Radley","st":[1,0,2,1,1]},{"name":"Serrano","st":[0,0,2,2,1]},{"name":"Tully","st":[3,0,0,2,0]}]},{"id":"club015","name":"Solano Vipers","short":"SOV","emblem":"015","stars":3,"playstyle":"wildcard","formation":"4-4-2","kickoff":[8,9],"path":"mid","moment":"maradona","corner":"agg","dcorner":"bal","locked":false,"kits":{"home":{"shirt":"#c6d93a","shorts":"#1b1b1d","socks":"#c6d93a"},"away":{"shirt":"#1b1b1d","shorts":"#c6d93a","socks":"#1b1b1d"},"keeper":"#ff3fa8","keeperAway":"#22c8ff"},"players":[{"name":"Kaya","st":[0,2,1,2,0]},{"name":"Madsen","st":[0,3,1,1,0]},{"name":"Navarro","st":[0,3,1,1,0]},{"name":"Palmer","st":[0,2,1,2,0]},{"name":"Rook","st":[1,0,1,1,2]},{"name":"Stroud","st":[1,0,1,1,2]},{"name":"Vance","st":[1,0,1,1,2]},{"name":"Yilmaz","st":[1,0,1,1,2]},{"name":"Andrade","st":[2,0,0,0,3]},{"name":"Blackwood","st":[2,0,0,0,3]}]}]};
// what each playstyle number does to the CPU (the same table drives Distal's editor)
const AI_KEYS=[
  ['pass','Pass length','How far forward it aims a normal pass (cm). The classic CPU uses 30.',8,70],
  ['spread','Pass spread','Sideways randomness of the pass target (cm).',0,60],
  ['aim','Aim error','Multiplies the aiming error. 1 = classic, lower is more accurate.',0,5],
  ['power','Power variance','Random +/- share of flick power (0.1 = up to 10% off).',0,0.6],
  ['press','Block distance','Where it blocks: cm in front of the ball, towards its own goal. Small = tight.',2,30],
  ['reach','Block reach','Farthest figure (cm) it will send to block.',10,80],
  ['sit','Sit back','Chance to skip the block while the ball is in its attacking half.',0,1],
  ['moment','Moment use','Chance to fire its Moment when the bar is full.',0,1]
];
// the classic CPU (also practice and the tutorial): exactly the behaviour before the clubs
const AI_DEFAULT={pass:30,spread:16,aim:1,power:0,press:9,reach:38,sit:0,moment:1};
const POINTS_PER_CARD=5,MAX_STAR=3;
let TEAMS=cleanTeams(null);

function cleanTeams(o){
  const D=TEAMS_DEF,ok=o&&typeof o==='object';if(!ok)o={};
  const num=(v,a,b,f)=>{v=+v;return isFinite(v)?Math.min(b,Math.max(a,v)):f;};
  const str=(v,n,f)=>{v=typeof v==='string'?v.replace(/[\u0000-\u001f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,n):'';return v||f;};
  const out={version:1,clash:Math.round(num(o.clash,0,765,D.clash||120)),tiers:{},playstyles:{},clubs:[]};
  [1,2,3].forEach(t=>{const x=(o.tiers&&o.tiers[t])||{},d=D.tiers[t];out.tiers[t]={name:str(x.name,16,d.name),aim:num(x.aim,0.1,5,d.aim),power:num(x.power,0,5,d.power)};});
  const ps=o.playstyles&&typeof o.playstyles==='object'&&Object.keys(o.playstyles).length?o.playstyles:D.playstyles;
  Object.keys(ps).filter(k=>/^[a-z0-9_-]{1,24}$/i.test(k)).slice(0,24).forEach(k=>{const x=ps[k]||{},d=D.playstyles[k]||AI_DEFAULT;
    const p={name:str(x.name,20,d.name||k),desc:str(x.desc,140,d.desc||'')};AI_KEYS.forEach(([a,,,lo,hi])=>p[a]=num(x[a],lo,hi,d[a]!=null?d[a]:AI_DEFAULT[a]));out.playstyles[k]=p;});
  if(!Object.keys(out.playstyles).length)out.playstyles=JSON.parse(JSON.stringify(D.playstyles));
  const list=Array.isArray(o.clubs)?o.clubs:D.clubs,seen=new Set();
  list.slice(0,40).forEach((c,i)=>{const q=cleanClub(c,i,out);if(seen.has(q.id))q.id='club'+String(i+1).padStart(3,'0')+'b';seen.add(q.id);out.clubs.push(q);});
  if(!out.clubs.length)D.clubs.forEach((c,i)=>out.clubs.push(cleanClub(c,i,out)));
  return out;
}
function cleanClub(c,i,T){
  c=c&&typeof c==='object'?c:{};const d=TEAMS_DEF.clubs[i]||TEAMS_DEF.clubs[0];
  const hex=(v,f)=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)?v.toLowerCase():f;
  const kit=(k,f)=>({shirt:hex(k&&k.shirt,f.shirt),shorts:hex(k&&k.shorts,f.shorts),socks:hex(k&&k.socks,f.socks)});
  const name=(typeof c.name==='string'?c.name.replace(/[\u0000-\u001f<>|]/g,'').replace(/\s+/g,' ').trim().slice(0,24):'')||d.name;
  const short=(typeof c.short==='string'?c.short.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,3):'')||name.replace(/[^A-Za-z0-9]/g,'').slice(0,3).toUpperCase();
  const form=FORMATIONS[c.formation]?c.formation:d.formation;
  const path=PATHS[c.path]?c.path:d.path,moment=SPECIALS[c.moment]?c.moment:d.moment;
  const ko=Array.isArray(c.kickoff)?c.kickoff.map(Number).filter((v,k,a)=>Number.isInteger(v)&&v>=0&&v<10&&a.indexOf(v)===k).slice(0,2):[];
  const players=[];for(let k=0;k<10;k++){const p=(Array.isArray(c.players)&&c.players[k])||{},dp=d.players[k];
    let st=Array.isArray(p.st)&&p.st.length===5?p.st.map(v=>Math.max(0,Math.min(MAX_STAR,Math.round(+v)||0))):dp.st.slice();
    for(let j=4;j>=0&&st.reduce((a,b)=>a+b,0)>POINTS_PER_CARD;j--)while(st[j]>0&&st.reduce((a,b)=>a+b,0)>POINTS_PER_CARD)st[j]--;
    players.push({name:(typeof p.name==='string'?p.name.replace(/[\u0000-\u001f<>|]/g,'').trim().slice(0,16):'')||dp.name,st});}
  const dk=d.kits;
  return{id:typeof c.id==='string'&&/^[a-z0-9_-]{1,24}$/i.test(c.id)?c.id:'club'+String(i+1).padStart(3,'0'),name,short,
    emblem:c.emblem!=null&&/^\d{1,6}$/.test(String(c.emblem))?String(c.emblem):d.emblem,
    stars:Math.max(1,Math.min(3,Math.round(+c.stars)||d.stars)),playstyle:T.playstyles[c.playstyle]?c.playstyle:T.playstyles[d.playstyle]?d.playstyle:Object.keys(T.playstyles)[0],
    formation:form,kickoff:ko.length===2?ko:d.kickoff.slice(),path,moment,
    corner:CORNER_PRESETS[c.corner]?c.corner:d.corner,dcorner:DEF_PRESETS[c.dcorner]?c.dcorner:d.dcorner,locked:c.locked===true,
    kits:{home:kit(c.kits&&c.kits.home,dk.home),away:kit(c.kits&&c.kits.away,dk.away),keeper:hex(c.kits&&c.kits.keeper,dk.keeper),keeperAway:hex(c.kits&&c.kits.keeperAway,dk.keeperAway)},players};
}
const clubById=id=>TEAMS.clubs.find(c=>c.id===id)||null;
const hexNum=h=>parseInt(String(h).slice(1),16);
const kitLum=n=>(0.299*(n>>16)+0.587*((n>>8)&255)+0.114*(n&255))/255;
// a club's kit in the shape kitOf() returns
function clubKit(c,away){const k=away?c.kits.away:c.kits.home,shirt=hexNum(k.shirt),shorts=hexNum(k.shorts);
  return{name:c.name,ab:c.short,shirt,shorts,socks:hexNum(k.socks),insert:shirt,gk:hexNum(away?c.kits.keeperAway:c.kits.keeper),ui:hexStr(kitLum(shirt)>0.8?shorts:shirt)};}
// how different two shirts look (0 = the same, 765 = black against white); shorts only break a tie
function kitGap(a,b){const d=(x,y)=>Math.abs((x>>16)-(y>>16))+Math.abs(((x>>8)&255)-((y>>8)&255))+Math.abs((x&255)-(y&255));return d(a.shirt,b.shirt)+d(a.shorts,b.shorts)/100;}
// kit clash rule: the club wears its away kit when its home kit is too close to the other side's
function clubWearsAway(c,other){const h=kitGap(clubKit(c,false),other),a=kitGap(clubKit(c,true),other);return h<TEAMS.clash&&a>h;}
function aiOf(c){const P=TEAMS.playstyles[c.playstyle]||AI_DEFAULT,T=TEAMS.tiers[c.stars]||{aim:1,power:1},o={};AI_KEYS.forEach(([k])=>o[k]=P[k]!=null?P[k]:AI_DEFAULT[k]);o.aim*=T.aim;o.power*=T.power;return o;}
// the squad a club plays a match with (same shape as your own squad)
function clubSquad(c,away){
  const q=defaultSquad(1);
  Object.assign(q,{name:c.name,ab:c.short,club:c.id,emblem:c.emblem,form:c.formation,kop:c.kickoff.slice(),path:c.path,special:c.moment,corner:c.corner,dcorner:c.dcorner,
    cc:CORNER_PRESETS[c.corner].spots.map(a=>a.slice()),dcc:DEF_PRESETS[c.dcorner].spots.map(a=>a.slice()),cards:c.players.map(p=>({st:p.st.slice()})),pnames:c.players.map(p=>p.name),
    kitHex:clubKit(c,away),away:!!away,ai:aiOf(c)});
  fitSpecial(q);return q;
}
// the CPU's numbers this match: a club's playstyle against the computer, the classic CPU everywhere else
function cpuStyle(team){const q=S.mode==='cpu'&&matchSquads&&matchSquads[team];return q&&q.ai||AI_DEFAULT;}

/* ---------- club emblems: models/emblem.glb ---------- */
// One flat plane per emblem, SM_Emblem_###_Name (anywhere in the file, usually under 'Emblem'). Its colour texture
// is the emblem, so it can be replaced in Distal's Models tab like any other texture. The menus show it as a picture.
const EMBLEMS={list:[],byId:{}};
function emblemPic(img,size){try{const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');
  const w=img.width||img.naturalWidth||size,h=img.height||img.naturalHeight||size,s=Math.min(size/w,size/h);x.drawImage(img,(size-w*s)/2,(size-h*s)/2,w*s,h*s);return c.toDataURL('image/png');}catch(e){return '';}}
function applyEmblems(scene,label){
  const vs=[];scene.traverse(o=>{const m=/^SM_Emblem_(\d+)(?:_(.+))?$/i.exec(o.name||'');if(m)vs.push({id:m[1],name:(m[2]||'Emblem '+m[1]).replace(/_/g,' ').trim(),node:o});});
  if(!vs.length)throw new Error('emblem: no SM_Emblem_###_Name found');
  vs.sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));
  EMBLEMS.list=vs.map(v=>{let img=null;v.node.traverse(o=>{if(!img&&o.isMesh){const m=Array.isArray(o.material)?o.material[0]:o.material;if(m&&m.map&&m.map.image)img=m.map.image;}});
    return{id:v.id,name:(v.node.userData&&v.node.userData.menu_name)||v.name,url:img?emblemPic(img,256):''};});
  EMBLEMS.byId={};EMBLEMS.list.forEach(e=>EMBLEMS.byId[e.id]=e);
  MODEL_INFO.emblem={src:label,note:`${vs.length} emblem${vs.length===1?'':'s'}`};
  if(typeof koRender==='function')koRender();
}
const emblemUrl=id=>(EMBLEMS.byId[id]||{}).url||'';
// what Distal's club editor needs from the game (link.js D.teamsMeta)
function teamsMeta(){
  const C=o=>JSON.parse(JSON.stringify(o));
  return{defaults:C(TEAMS_DEF),current:C(TEAMS),aiKeys:C(AI_KEYS),aiDefault:C(AI_DEFAULT),points:POINTS_PER_CARD,maxStar:MAX_STAR,
    stats:STATS.map(s=>({key:s.k,name:s.name,ab:s.ab,desc:s.desc})),paths:C(PATHS),unlock:C(BAL.unlock),
    moments:Object.entries(SPECIALS).map(([k,v])=>({key:k,name:v.name,desc:v.desc})),
    formations:Object.fromEntries(Object.entries(FORMATIONS).map(([k,f])=>[k,{lab:f.lab.slice(),pos:C(f.pos),kop:kopOf({form:k},f.pos)}])),
    corners:Object.fromEntries(Object.entries(CORNER_PRESETS).map(([k,v])=>[k,v.name])),dcorners:Object.fromEntries(Object.entries(DEF_PRESETS).map(([k,v])=>[k,v.name])),
    emblems:EMBLEMS.list.map(e=>({id:e.id,name:e.name,url:e.url})),
    kits:KITS.map(k=>({name:k.name,shirt:hexStr(k.shirt),shorts:hexStr(k.shorts),socks:hexStr(k.socks)})),
    kopRule:'Kick-off pair: no defenders, at most one midfielder, at least one forward.'};
}
// is this kick-off pair allowed for this formation? (Distal shows it)
function kopValid(pair,form){const F=FORMATIONS[form];return !!F&&kopOk(pair||[],F.pos);}
function applyTeams(o){TEAMS=cleanTeams(o);if(typeof koRender==='function')koRender();}
onDataFile('teams',applyTeams);
