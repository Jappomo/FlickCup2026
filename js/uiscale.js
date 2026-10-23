// Flick Cup 2026 · js/uiscale.js
// UI scale (solution B, agreed 22 Oct 2026). Every UI layer is designed at a 1600 x 900 reference (16:9) and zoomed to
// the screen as one piece, like a game canvas scaler: zoom = min(width / 1600, height / 900) x the player's Interface size.
// 1600 x 900 rather than 1920 x 1080 so the menus fill a 1080p screen and the smallest text stays readable on the Steam
// Deck (1280 x 800 gives zoom 0.8). Interface size starts at 100% (140% on touch-only devices such as phones).
// On a wider or taller screen the layer gets more room in reference units, so anything pinned to an edge stays on that
// edge. The zoom is the CSS variable --uiz (the zoomed layers are listed in index.html, next to --uiz); an inline script
// in index.html sets it before the first paint. Phones are landscape only (a "turn your device" screen in portrait).
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
const UI_REF={w:1600,h:900,min:0.5};      // reference size; the zoom never goes under min, so text stays readable
let UIZ=1,MZ=1;
const UI_TOUCH=matchMedia('(pointer:coarse)').matches&&!matchMedia('(pointer:fine)').matches;
if(SET.ui==null)SET.ui=UI_TOUCH?140:100;
// The menus (js/ui.js, css/retro.css) are one fixed 1600 x 900 frame scaled to fit the screen, like a game: --mz =
// min(width / 1600, height / 900), whatever the Interface size, so a menu page never needs to scroll. Interface size
// applies to what is shown during a match (--uiz).
// the match layers need about 1480 reference units across, so a big Interface size on a small screen stops there
function uiZoom(){return Math.max(UI_REF.min,Math.min(Math.min(innerWidth/UI_REF.w,innerHeight/UI_REF.h)*(SET.ui||100)/100,innerWidth/1480));}
function applyUiScale(){
  const z=uiZoom(),root=document.documentElement;
  if(Math.abs(z-UIZ)>1e-4||root.style.getPropertyValue('--uiz')===''){UIZ=z;root.style.setProperty('--uiz',z.toFixed(4));}
  const m=Math.min(innerWidth/UI_REF.w,innerHeight/UI_REF.h);if(Math.abs(m-MZ)>1e-4||root.style.getPropertyValue('--mz')===''){MZ=m;root.style.setProperty('--mz',m.toFixed(4));}
  root.classList.toggle('portrait',UI_TOUCH&&innerHeight>innerWidth*1.05&&!/[?&]distal=/.test(location.search));}
addEventListener('resize',applyUiScale);
addEventListener('orientationchange',()=>setTimeout(applyUiScale,120));
applyUiScale();
// the menu previews draw at their on-screen size: their CSS size times the menu zoom
(function(){
  const base=previewDraw;
  previewDraw=function(r,cv,scn,cam,exposure){const pr=Math.min((devicePixelRatio||1)*MZ,2.5);if(Math.abs(r.getPixelRatio()-pr)>1e-3)r.setPixelRatio(pr);return base(r,cv,scn,cam,exposure);};
})();
// Settings > Graphics: Interface size
(function(){
  const box=document.querySelector('#hub .cardbox[data-sub="gfx"]');if(!box||$('#gfx-ui'))return;
  const row=document.createElement('div');row.className='srow';row.title='Makes the match information bigger or smaller. The menus always fit the screen.';
  row.innerHTML='<label for="gfx-ui">Interface size</label><div class="rng"><input type="range" id="gfx-ui" min="70" max="150" step="5"><output id="o-ui"></output></div>';
  const h=box.querySelector('.h');(h&&h.nextSibling?box.insertBefore(row,h.nextSibling):box.appendChild(row));
  bindRange('gfx-ui','o-ui','ui',pct,applyUiScale);
})();
