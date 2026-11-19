'use strict';
// Menu backgrounds (19 Nov 2026): five alternatives to the classic backdrop (streaks, pitch lines, the old ball),
// same UI on top. Picked in Settings > Graphics ("Menu background"), saved in baize.menubg. css/menubg.css swaps
// the picture of .hub-bg; the classic one stays the default.
const MENU_BGS=[['classic','Classic'],['floodlights','Floodlights'],['chalk','Chalk pitch'],['baize','Baize'],['programme','Programme'],['europe','Europe at night']];
let MENU_BG=store.get('baize.menubg')||'classic';
function setMenuBg(id){if(!MENU_BGS.some(b=>b[0]===id))id='classic';MENU_BG=id;store.set('baize.menubg',id);
  if(id==='classic')delete document.documentElement.dataset.menubg;else document.documentElement.dataset.menubg=id;
  document.querySelectorAll('#menubg-row [data-bg]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.bg===id)));}
{const box=document.querySelector('.cardbox[data-sub="gfx"]')||document.querySelector('[data-sub="gfx"]');
  if(box){const row=document.createElement('div');row.className='menubg';
    row.innerHTML='<p class="h">Menu background</p><div class="seg" id="menubg-row">'+MENU_BGS.map(([k,n])=>`<button class="chip" type="button" data-bg="${k}" aria-pressed="false">${n}</button>`).join('')+'</div>';
    row.querySelectorAll('[data-bg]').forEach(b=>b.onclick=()=>{setMenuBg(b.dataset.bg);try{sfx('tock',14);}catch(e){}});
    box.appendChild(row);}}
setMenuBg(MENU_BG);
