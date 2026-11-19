// The Ground > Table, second layout (19 Nov 2026, from the Table I mockup): a rail of table parts on the left, the
// picked part's items in the middle, the turning table on the right. Only the parts the game has today are live
// (Table, Field, Trinket, Banner, Ball); Borders, Legs and Goals are greyed placeholders. The Ball page is gone
// (19 Nov 2026): the ball is a part here, its spinning preview takes the table's place while it is picked.
// The old carousels stay in the page, hidden: renderLook still fills them and builds the preview, then this is drawn.
// Script order: after customize.js (renderLook is wrapped), before start.js.
const TB={part:'table',built:false};
const TB_IC={
  table:'<svg viewBox="0 0 32 26" aria-hidden="true"><path d="M4 8h24l3 6H1z" fill="currentColor"/><path d="M4 14v10M28 14v10" stroke="currentColor" stroke-width="3"/></svg>',
  field:'<svg viewBox="0 0 32 22" aria-hidden="true"><rect x="1" y="1" width="30" height="20" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 1v20" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="11" r="4" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  borders:'<svg viewBox="0 0 32 22" aria-hidden="true"><rect x="2" y="2" width="28" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="4"/></svg>',
  legs:'<svg viewBox="0 0 26 28" aria-hidden="true"><rect x="1" y="1" width="24" height="5" fill="currentColor"/><path d="M3 6h5l-1 21H4zM18 6h5l-1 21h-3z" fill="currentColor"/></svg>',
  goals:'<svg viewBox="0 0 32 22" aria-hidden="true"><path d="M2 21V2h28v19" fill="none" stroke="currentColor" stroke-width="3"/><path d="M9 2v19M16 2v19M23 2v19M2 9h28M2 15h28" stroke="currentColor" stroke-width="1" opacity=".6"/></svg>',
  trinket:'<svg viewBox="0 0 20 30" aria-hidden="true"><path d="M3 2v27" stroke="currentColor" stroke-width="3"/><path d="M4 3l14 5-14 5z" fill="currentColor"/></svg>',
  banner:'<svg viewBox="0 0 32 22" aria-hidden="true"><rect x="1" y="6" width="30" height="10" fill="currentColor"/><path d="M5 11h22" stroke="#0f2240" stroke-width="2" stroke-dasharray="3 2"/></svg>',
  ball:'<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M14 9l4.5 3.3-1.7 5.2h-5.6l-1.7-5.2z" fill="currentColor"/></svg>'};
const TB_PARTS=[['table','Table'],['field','Field'],['borders','Borders',1],['legs','Legs',1],['goals','Goals',1],['trinket','Trinket'],['banner','Banner'],['ball','Ball']];
const TB_LOCK='<span class="lock" aria-hidden="true"><svg width="10" height="11" viewBox="0 0 10 11"><rect x="1" y="5" width="8" height="6" rx="1" fill="#f2b632"/><path d="M3 5V3.5a2 2 0 0 1 4 0V5" fill="none" stroke="#f2b632" stroke-width="1.6"/></svg></span>';
function tbBuild(){
  const host=$('#cust-table');if(!host)return false;if(TB.built)return true;TB.built=true;host.classList.add('tb2');
  const rail=document.createElement('nav');rail.className='cardbox tb-rail';rail.id='tb-rail';rail.setAttribute('aria-label','Table parts');rail.dataset.ui='ground-parts';
  rail.innerHTML='<p class="h">Table parts</p>'+TB_PARTS.map(([k,n,soon])=>`<button type="button" class="tb-part" data-part="${k}"${soon?' disabled aria-disabled="true"':''}><span class="ic">${TB_IC[k]}</span>${n}<span class="v"></span></button>`).join('');
  const mid=document.createElement('div');mid.className='tb-mid';mid.dataset.ui='ground-items';mid.innerHTML='<p class="h" id="tb-h"></p><div class="tb-grid" id="tb-grid"></div>';
  const side=document.createElement('aside');side.className='cardbox tb-side';side.dataset.ui='ground-preview';side.innerHTML='<div class="tb-title" id="tb-title"></div><div class="tb-sub" id="tb-sub"></div><div class="tb-ball" id="tb-ball" hidden></div><div class="tb-info" id="tb-info"></div><div class="tb-act" id="tb-act"></div>';
  host.prepend(rail,mid,side);side.insertBefore($('#table-stage'),$('#tb-ball'));$('#tb-ball').append($('#ball-prev'));
  rail.querySelectorAll('.tb-part').forEach(b=>b.onclick=()=>{if(b.disabled)return;TB.part=b.dataset.part;lookPend=null;renderLook();});
  const G=[['#tb-rail','col'],['#tb-grid','grid'],['#tb-act','row']],L=[['#tb-rail',{r:'#tb-grid'}],['#tb-grid',{l:'#tb-rail',r:'#tb-act'}],['#tb-act',{l:'#tb-grid'}]];
  [UI_GROUPS,UI_NAV_BASE.groups].forEach(a=>a.unshift(...G));[UI_LINKS,UI_NAV_BASE.links].forEach(a=>a.unshift(...L));
  [UI_DEFAULT,UI_NAV_BASE.def].forEach(d=>{d.custom=['#ground-home .mc-card','#tb-grid .tb-item.on',...(d.custom||[])];});
  return true;}
function tbPickName(p){if(p==='ball'){const v=ballVariant(BALL.mine)||BALL.variants[0];return v?v.name:'Classic';}
  if(!LOOK[p])return 'Soon';const o=p==='trinket'||p==='banner',v=lookPick(p,LOOKSEL[p],o);return v?v.name:'None';}
function tbRender(){
  if(hubTab!=='custom'||custSec!=='table'||!TB.built)return;
  const ballOn=TB.part==='ball';$('#tb-ball').hidden=!ballOn;$('#table-stage').hidden=ballOn;
  if(ballOn){tbBall();return;}
  const p=TB.part,t=lookPick('table',LOOKSEL.table),optional=p==='trinket'||p==='banner',banners=!!(t&&hasLoc(t.node,'Banner')),off=p==='banner'&&!banners;
  $('#tb-rail').querySelectorAll('.tb-part').forEach(b=>{const k=b.dataset.part;setAttr(b,'aria-current',k===p);b.querySelector('.v').textContent=b.disabled?'Soon':tbPickName(k);});
  const name=TB_PARTS.find(x=>x[0]===p)[1];
  const L=(optional?[null]:[]).concat(LOOK[p]||[]),cur=lookPick(p,LOOKSEL[p],optional);
  const own=(LOOK[p]||[]).filter(v=>owns(p,v.id)).length;
  $('#tb-h').textContent=`${name} · ${own} / ${(LOOK[p]||[]).length} owned`;
  const g=$('#tb-grid');g.dataset.part=p;
  g.innerHTML=!(LOOK[p]||[]).length?`<p class="note">No ${p} models loaded.</p>`:L.map((v,i)=>{
    if(!v)return `<button type="button" class="tb-item${!cur?' on':''}" data-i="${i}" aria-pressed="${!cur}"${off?' disabled':''}><span class="img"><span class="none"></span></span><span class="nm">None</span></button>`;
    const locked=!owns(p,v.id),card=locked&&needCard(p,v.id),pend=locked&&lookPend&&lookPend.part===p&&lookPend.id===v.id,on=pend||(!lookPend||lookPend.part!==p)&&cur&&cur.id===v.id;
    return `<button type="button" class="tb-item${on?' on':''}${card?' lk':''}${pend?' pv':''}" data-i="${i}" aria-pressed="${!!on}"${off?' disabled':''} title="${v.name}"><span class="img">${tThumbs[p+v.id]?`<img src="${tThumbs[p+v.id]}" alt="">`:''}</span><span class="nm">${v.name}</span>${tbCorner(p,v.id,cur&&cur.id===v.id)}</button>`;}).join('')+(off?'<p class="note">This table has no banner spots.</p>':'');
  // pick an item you own: it is used. One you don't: it is only previewed, the Buy button (or A again) buys and uses it.
  g.querySelectorAll('.tb-item').forEach(b=>b.onclick=()=>{const v=L[+b.dataset.i];
    if(v&&!owns(p,v.id)){if(lookPend&&lookPend.part===p&&lookPend.id===v.id){tbBuy();return;}
      lookPend={part:p,id:v.id};renderLook();sfx('tock',10);tbRefocus(b.dataset.i);return;}
    lookPend=null;LOOKSEL[p]=v?v.id:'';saveLook();showLook();renderLook();sfx('tock',30);tbRefocus(b.dataset.i);});
  const tp=lookPend&&lookPend.part==='table'?(LOOK.table||[]).find(v=>v.id===lookPend.id):null;$('#tb-title').textContent=tp?tp.name:t?t.name:'Classic';
  const pv=lookPend&&lookPend.part===p?(LOOK[p]||[]).find(v=>v.id===lookPend.id):cur;
  $('#tb-sub').textContent=`${name} · ${pv?pv.name:'None'}`;
  const how=!pv?'—':!owns(p,pv.id)?(needCard(p,pv.id)?(needCard(p,pv.id).chal?'A challenge':'Album card'):`${priceOf(p,pv.id)} Hobby`):(pv.id===firstId(p)||priceOf(p,pv.id)===0?'Starter':'Owned');
  const card=pv&&needCard(p,pv.id);
  $('#tb-info').innerHTML=`<div><span>Unlocked by</span><b>${how}</b></div>`+(card&&!card.chal?`<div><span>Album card</span><b>${String(card.title).replace(/</g,'&lt;')}</b></div>`:'');
  tbAct(p,pv&&!owns(p,pv.id)?pv.id:null);
}
// the corner of an item: its price (or the Album card lock) when you don't own it, a tick on the one in use
function tbCorner(p,id,inUse){if(owns(p,id))return inUse?'<span class="tb-c use" aria-label="In use"><svg viewBox="0 0 12 10"><path d="M1 5l3.5 3.5L11 1.5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg></span>':'';
  const c=needCard(p,id);if(c)return '<span class="tb-c card" title="'+(c.chal?'A challenge':'Album card')+'">'+TB_LOCK+'</span>';
  return `<span class="tb-c buy${(HOBBY.n||0)<priceOf(p,id)?' poor':''}">${coinTag(priceOf(p,id))}</span>`;}
// the Buy button under the preview, for the previewed item you don't own
function tbAct(p,id){const a=$('#tb-act');if(!a)return;a.dataset.p=p||'';a.dataset.id=id==null?'':id;
  if(id==null){a.innerHTML='';a.hidden=true;return;}a.hidden=false;
  const c=needCard(p,id);
  a.innerHTML=c?`<button type="button" class="big tb-buy" disabled>${c.chal?'Win the challenge':'Find the Album card'}</button>`
    :`<button type="button" class="big go tb-buy${(HOBBY.n||0)<priceOf(p,id)?' poor':''}"><span class="glyph a">A</span>Buy${coinTag(priceOf(p,id))}</button>`;
  const b=a.querySelector('.tb-buy:not([disabled])');if(b)b.onclick=tbBuy;}
function tbBuy(){const a=$('#tb-act');if(!a||a.hidden)return;const p=a.dataset.p,id=a.dataset.id;if(!p||needCard(p,id))return;
  if(p==='ball'){custSel=id;if(!buy('ball',id)){tbBall();return;}equipBall();tbRefocusOn();return;}
  if(!buy(p,id)){renderLook();return;}lookPend=null;LOOKSEL[p]=id;saveLook();showLook();renderLook();tbRefocusOn();}
function tbRefocusOn(){requestAnimationFrame(()=>{const b=$('#tb-grid .tb-item.on');if(b&&typeof uiSet==='function'&&typeof UI!=='undefined'&&UI.layer)uiSet(b,{src:'silent'});});}
function tbRefocus(i){requestAnimationFrame(()=>{const b=$(`#tb-grid .tb-item[data-i="${i}"]`);if(b&&typeof uiSet==='function'&&typeof UI!=='undefined'&&UI.layer)uiSet(b,{src:'silent'});});}
{const base=renderLook;renderLook=function(){if(hubTab==='custom'&&custSec==='table')tbBuild();const r=base.apply(this,arguments);try{tbRender();}catch(e){console.error('[tablepage]',e);}return r;};}

// Ball part: the same grid, the old Ball page rules (pick a ball to buy once to see it, again to buy and use it;
// Album card / challenge balls only say what they need). custSel is the ball on show, BALL.mine the one in use.
function tbBall(){
  const list=BALL.variants.length?BALL.variants:[{id:'',name:'Classic'}];
  if(!Object.keys(thumbs).length)makeThumbs();
  const eqId=(ballVariant(BALL.mine)||list[0]).id;
  if(!custSel||!list.some(v=>v.id===custSel))custSel=eqId;
  $('#tb-rail').querySelectorAll('.tb-part').forEach(b=>{const k=b.dataset.part;setAttr(b,'aria-current',k==='ball');b.querySelector('.v').textContent=b.disabled?'Soon':tbPickName(k);});
  const own=list.filter(v=>owns('ball',v.id)).length;
  $('#tb-h').textContent=`Ball · ${own} / ${list.length} owned`;
  const g=$('#tb-grid');g.dataset.part='ball';
  g.innerHTML=list.map((v,i)=>{const locked=!owns('ball',v.id),card=locked&&needCard('ball',v.id),on=v.id===custSel;
    return `<button type="button" class="tb-item${on?' on':''}${card?' lk':''}${on&&locked?' pv':''}" data-i="${i}" aria-pressed="${on}" title="${v.name}"><span class="img">${thumbs[v.id]?`<img src="${thumbs[v.id]}" alt="">`:''}</span><span class="nm">${v.name}</span>${tbCorner('ball',v.id,v.id===eqId)}</button>`;}).join('');
  g.querySelectorAll('.tb-item').forEach(b=>b.onclick=()=>{const v=list[+b.dataset.i];
    if(!owns('ball',v.id)){if(custSel===v.id){tbBuy();return;}custSel=v.id;tbBall();sfx('tock',10);tbRefocus(b.dataset.i);return;}
    custSel=v.id;equipBall();tbRefocus(b.dataset.i);});
  const cur=list.find(v=>v.id===custSel)||list[0];
  $('#tb-title').textContent=cur.name;$('#tb-sub').textContent='Ball · '+(cur.id===eqId?'In use':owns('ball',cur.id)?'Owned':'Not owned');
  const card=needCard('ball',cur.id),how=owns('ball',cur.id)?(cur.id===firstId('ball')||priceOf('ball',cur.id)===0?'Starter':'Owned'):card?(card.chal?'A challenge':'Album card'):`${priceOf('ball',cur.id)} Hobby`;
  $('#tb-info').innerHTML=`<div><span>Unlocked by</span><b>${how}</b></div>`+(card&&!card.chal&&!owns('ball',cur.id)?`<div><span>Album card</span><b>${String(card.title).replace(/</g,'&lt;')}</b></div>`:'')+'<div><span>Play</span><b>Same for every ball</b></div>';
  tbAct('ball',owns('ball',cur.id)?null:cur.id);
  if(initPreview()){requestAnimationFrame(()=>{try{sizePreview();}catch(e){}});previewObject(cur.id);}
}
// The Ball page is folded in: anything that still opens it (Album "use it" links, old saves) lands on Table > Ball.
{const base=setCustSec;setCustSec=function(sec){if(sec==='ball'){TB.part='ball';sec='table';}return base.call(this,sec);};}
{const base=renderCustom;renderCustom=function(){const r=base.apply(this,arguments);try{if(hubTab==='custom'&&custSec==='table'&&TB.built&&TB.part==='ball')tbBall();}catch(e){console.error('[tablepage]',e);}return r;};}
// the loop runs tableTick on the Table page: with the Ball part it spins the ball preview instead
{const ball=custTick;custTick=function(){if(custSec==='table'&&TB.part==='ball'){custSec='ball';try{ball();}finally{custSec='table';}return;}return ball.apply(this,arguments);};
 const table=tableTick;tableTick=function(){if(TB.built&&TB.part==='ball')return custTick();return table.apply(this,arguments);};}
// The Ground home: Table and Music (Ball lives in Table now)
{const i=GROUND_CARDS.findIndex(c=>c.id==='ball');if(i>=0)GROUND_CARDS.splice(i,1);if(groundFrom==='ball')groundFrom='table';
 const b=document.querySelector('.cnav[data-sec="ball"]');if(b)b.hidden=true;}
// leaving the Table page drops an unbought preview, so the table shows what you own again
{const base=setCustSec;setCustSec=function(sec){if(sec!=='table')lookPend=null;return base.apply(this,arguments);};}
