// Flick Cup 2026 · js/spotkeys.js
// Set-piece spots with their button (19 Nov 2026). When you take a free kick, corner, throw-in or interception, each of
// the three spots behind the ball (the discs on the cloth, js/scene.js spotRings) shows inside it the button that puts
// your taker there: the controller button in use (X / A / B in the Xbox layout, shown for the pad in use and its
// mapping, coloured by where the button sits) or the keyboard key (1 / 2 / 3, as mapped in Distal). The disc is a
// little bigger and its label turns to face the camera. In touch mode the discs stay plain (you tap them).
// Loaded by index.html after nostalgia.js, as a classic script (shared scope).
'use strict';
const SPOT_PAD=[2,0,1];                 // logical buttons that place at spots 0, 1, 2 (js/input.js pollPads)
const SPOT_KEY=['spot1','spot2','spot3'];
const SPOT_COL={xbox:['#4caf3e','#d9443a','#3a86d9','#e7b52c'],deck:['#4caf3e','#d9443a','#3a86d9','#e7b52c'],ps:['#4c79d9','#d9443a','#d76bb4','#2fa58f'],switch:['#2a2f3a','#2a2f3a','#2a2f3a','#2a2f3a']};
const SPOT_TX=spotRings.map(()=>{const c=document.createElement('canvas');c.width=c.height=128;const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return{c,t,key:''};});
function spotPaint(i,txt,bg,fg){const T=SPOT_TX[i],k=txt+bg+fg;if(T.key===k)return;T.key=k;const g=T.c.getContext('2d');
  g.clearRect(0,0,128,128);g.beginPath();g.arc(64,64,60,0,Math.PI*2);g.fillStyle=bg;g.fill();g.lineWidth=7;g.strokeStyle='#ffffff';g.stroke();
  g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';g.font=`900 ${txt.length>1?52:72}px "Barlow Condensed","Arial Narrow",system-ui,sans-serif`;g.fillText(txt,64,68);T.t.needsUpdate=true;}
// the label each spot shows now, or null for a plain disc
function spotLabel(i){if(typeof TOUCH!=='undefined'&&TOUCH.on)return null;
  if(lastInput==='pad'){const b=SPOT_PAD[i],phys=padMapNow()[b],C=SPOT_COL[padFamily()]||SPOT_COL.xbox;return{txt:padLabel(b),bg:C[phys>=0&&phys<4?phys:0],fg:'#ffffff'};}
  return{txt:keyName(KEY(SPOT_KEY[i])),bg:'#f1e4c6',fg:'#0f1f38'};}
{const base=showSpots;showSpots=function(){base();if(!spotRings[0].visible)return;
  const mine=typeof takeTurn==='function'&&takeTurn(),B=camBasis(),rot=Math.atan2(-B.fx,-B.fz);
  spotRings.forEach((m,i)=>{const L=mine&&spotLabel(i),M=m.material;
    if(L){spotPaint(i,L.txt,L.bg,L.fg);if(M.map!==SPOT_TX[i].t){M.map=SPOT_TX[i].t;M.color.set(0xffffff);M.needsUpdate=true;}
      m.rotation.y=rot;m.scale.multiplyScalar(1.1);}
    else if(M.map){M.map=null;M.color.set(0x5cf2ea);M.needsUpdate=true;m.rotation.y=0;}});};}
// the prompt names the buttons of the input in use
{const base=updateHud;updateHud=function(){const r=base.apply(this,arguments);try{
  if(S.phase==='take'&&takeTurn()&&!subLock&&!(typeof TOUCH!=='undefined'&&TOUCH.on)){const el=$('#psub');
    const t=lastInput==='pad'?`${padLabel(4)}: next figure. Then ${padLabel(2)}, ${padLabel(0)} or ${padLabel(1)} puts your taker on that spot.`
      :`Click a figure (or ${keyName(KEY('nextFig'))}), then a spot or press its key.`;
    if(el&&el.textContent!==t)el.textContent=t;}}catch(e){}return r;};}
// refresh the prompt when you switch between controller and keyboard during a set piece
let spotKeysInp='';
setInterval(()=>{if(S.phase==='take'&&spotKeysInp!==lastInput){spotKeysInp=lastInput;updateHud();}},250);
