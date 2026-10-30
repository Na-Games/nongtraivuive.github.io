'use strict';
/* ===== Tiện ích UI ===== */
function toast(msg){const t=el('div','toast',msg);$('#layer-toast').appendChild(t);setTimeout(()=>t.remove(),2700)}
const today=()=>new Date().toISOString().slice(0,10);
let sheetRefresh=null,sheetKey=null;
function closeSheet(){
  const L=$('#layer-sheet');const sh=$('.sheet',L),bd=$('.backdrop',L);
  if(!sh)return;sh.classList.remove('on');bd&&bd.classList.remove('on');sheetRefresh=null;sheetKey=null;
  setTimeout(()=>{if(!sheetKey)L.innerHTML=''},380);
}
/* mở bảng trượt từ dưới: render(body) được gọi lại mỗi lần refreshSheet() */
function openSheet(key,title,render,h){
  hidePop();
  const L=$('#layer-sheet');L.innerHTML='';sheetKey=key;sheetRefresh=render;
  const bd=el('div','backdrop');bd.onclick=closeSheet;
  const sh=el('div','sheet');if(h)sh.style.setProperty('--h',h);
  sh.innerHTML=`<div class="ribbon">${title}</div><button class="x">✕</button><div class="body"></div>`;
  $('.x',sh).onclick=closeSheet;
  L.append(bd,sh);render($('.body',sh));
  requestAnimationFrame(()=>requestAnimationFrame(()=>{bd.classList.add('on');sh.classList.add('on')}));
  beep('pop');
}
function refreshSheet(){const b=$('.sheet .body');if(b&&sheetRefresh){const st=b.scrollTop;b.innerHTML='';sheetRefresh(b);b.scrollTop=st}}
function tabs(list,cur,cb){const t=el('div','tabs');list.forEach((n,i)=>{const b=el('button',i===cur?'on':'',n);b.onclick=()=>cb(i);t.appendChild(b)});return t}
function modal(html,cls=''){const m=$('#modal');m.innerHTML=`<div class="mcard ${cls}">${html}</div>`;m.classList.remove('hidden');return $('.mcard',m)}
function closeModal(){$('#modal').classList.add('hidden')}
function fadeTo(fn){const f=$('#fade');f.classList.add('on');setTimeout(()=>{fn();f.classList.remove('on')},480)}
function itemE(id){return ITEMS[id]?Art.icon(ITEMS[id].art||id,ITEMS[id].n):'❓'}
function setTheme(id){document.body.className=`theme-${id}${S.night?' dark':''}`;S.theme=id}

/* ===== HUD ===== */
function buildHud(){
  const h=$('#hud');
  h.innerHTML=`
  <div class="hud-top">
    <div class="res" id="r-coin"><span class="ic">🪙</span><span id="v-coin"></span></div>
    <div class="res" id="r-gem"><span class="ic">💎</span><span id="v-gem"></span></div>
    <div class="res" id="r-inv" style="cursor:pointer"><span class="ic">🏺</span><span><b id="v-inv"></b><small id="v-cap"></small></span></div>
    <div class="sp"></div>
    <button class="cbtn" id="b-day" title="Sáng/Tối"></button>
    <button class="cbtn" id="b-mail">✉️<i class="dot" id="d-mail"></i></button>
    <button class="cbtn" id="b-cam">📷</button>
  </div>
  <div class="prof">
    <div class="avatar-ring" id="b-avatar"><canvas id="av-hud" width="140" height="140"></canvas></div>
    <div class="lvbadge" id="v-lv">1</div>
    <div class="prof-info"><div class="xpbar"><i id="xp-i"></i><span id="v-xp"></span></div><div class="loc">📍 <span id="v-loc"></span></div></div>
  </div>
  <div class="side">
    <button class="sbtn" data-a="event"><div class="ico">🪷</div>Sự kiện</button>
    <button class="sbtn" data-a="season"><div class="ico">📗</div>Mùa vụ</button>
    <button class="sbtn" data-a="checkin"><div class="ico">📅<i class="dot on" id="d-ci"></i></div>Điểm danh</button>
  </div>
  <div class="side" style="top:auto;bottom:calc(120px + var(--sb))">
    <button class="sbtn" data-a="friends"><div class="ico">🧺</div>Bạn bè</button>
    <button class="sbtn new" data-a="bag"><div class="ico">🎒</div>Túi</button>
    <button class="sbtn" data-a="orders"><div class="ico">📋<i class="dot num on" id="d-ord"></i></div>Đơn hàng</button>
    <button class="sbtn" data-a="invite"><div class="ico">💌</div>Mời bạn</button>
  </div>
  <button class="cbtn" id="b-harv" style="position:absolute;left:12px;top:calc(46vh);width:56px;height:56px;font-size:30px" title="Thu hoạch nhanh">🌾</button>
  <div class="zoomctl"><button class="cbtn" id="b-zin">＋</button><button class="cbtn" id="b-zout">－</button></div>
  <div class="bl">
    <div class="bl-row"><button class="cbtn" id="b-menu" style="width:52px;height:52px">⊞<i class="dot on"></i></button><button class="cbtn" id="b-fish" style="width:52px;height:52px">🎣</button></div>
    <div class="quest"><div class="qa">👴</div><div class="qbox" id="qbox"></div></div>
    <div class="chat" id="chat"></div>
  </div>
  <button class="shopbtn" id="b-shop"><div class="ico">🏪</div><span>Cửa hàng</span></button>`;
  h.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>({event:openEvents,season:openSeason,checkin:openCheckin,friends:()=>openFriends(0),bag:openBag,orders:openOrders,invite:openInvite})[b.dataset.a]());
  $('#b-day').onclick=toggleNight;$('#b-mail').onclick=openMail;$('#b-cam').onclick=screenshot;
  $('#b-avatar').onclick=openProfile;$('#b-shop').onclick=()=>openShop(0);$('#r-inv').onclick=openStorage;
  $('#b-menu').onclick=openMenu;$('#b-fish').onclick=openFishing;$('#b-harv').onclick=harvestAll;
  $('#b-zin').onclick=()=>Scene.zoomAt(1.25,Scene.w/2,Scene.h/2);$('#b-zout').onclick=()=>Scene.zoomAt(.8,Scene.w/2,Scene.h/2);
  $('#qbox').onclick=()=>{if(!claimQuest())openQuests()};
  setInterval(chatTick,4200);chatTick();chatTick();chatTick();
}
const SUN=Art.icon('sun','Chuyển sang ban đêm');
const MOON=Art.icon('moon','Chuyển sang ban ngày');
function refreshHud(){
  if(!$('#v-coin'))return;
  $('#v-coin').textContent=fmt(S.coins);$('#v-gem').textContent=fmt(S.gems);
  $('#v-inv').textContent=invTotal();$('#v-cap').textContent='/'+S.cap;
  $('#v-lv').textContent=S.lv;$('#xp-i').style.width=(S.xp/xpNeed(S.lv)*100)+'%';$('#v-xp').textContent=`${S.xp}/${xpNeed(S.lv)}`;
  $('#v-loc').textContent=S.province||'—';
  $('#b-day').innerHTML=S.night?MOON:SUN;
  const ready=S.orders.filter(o=>o.need.every(n=>has(n.id,n.n))).length;
  const d=$('#d-ord');d.textContent=ready;d.classList.toggle('on',ready>0);
  $('#d-mail').classList.toggle('on',S.mail.some(m=>!m.got));
  $('#d-ci').classList.toggle('on',S.checkin.last!==today());
  drawHudAvatar();refreshQuest();
}
function drawHudAvatar(){const c=$('#av-hud');if(!c)return;const x=c.getContext('2d');x.clearRect(0,0,140,140);drawAvatar(x,70,150,150,S.av,{t:0})}
function refreshQuest(){
  const b=$('#qbox');if(!b)return;const q=QUESTS[S.qi];
  if(!q){b.innerHTML='<small>XONG</small><b>Hết nhiệm vụ 🎉</b>';return}
  const p=Math.min(q.goal,questProg(q));
  b.innerHTML=`<small>CHÍNH<span>${p>=q.goal?'Chạm để nhận!':'○○○○○'}</span></small><b>${q.n}<span style="color:${p>=q.goal?'#8fe05a':'#fff'}">${p}/${q.goal} ›</span></b>`;
}
function chatTick(){
  const c=$('#chat');if(!c)return;const n=pick(NPC);
  c.appendChild(el('div','',`<span>${n[0]}:</span> ${pick(CHATS)}`));while(c.children.length>3)c.firstChild.remove();
}
function toggleNight(){S.night=!S.night;document.body.classList.toggle('dark',S.night);refreshHud();beep('tap')}
function screenshot(){Scene.cv.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='nong-trai.png';a.click();toast('📷 Đã lưu ảnh trang trại!')})}

/* ===== Cấp độ ===== */
function onLevelUp(){
  const r={c:100*S.lv,g:2};reward(r);beep('win');Scene.burst(Scene.w/2,Scene.h/2,'🎉',16);
  const unlock=[...Object.entries(CROPS).filter(([,c])=>c.lv===S.lv).map(([,c])=>c.e+' '+c.n),...Object.values(BUILDINGS).filter(b=>b.lv===S.lv).map(b=>b.e+' '+b.n)];
  modal(`<div class="mribbon">Lên cấp ${S.lv}!</div><div style="font-size:80px">🎉</div><div class="box">Phần thưởng<b>${rewardText(r)}</b></div>${unlock.length?`<div class="box">Mở khóa mới<b>${unlock.join(', ')}</b></div>`:''}<button class="btn-big" onclick="closeModal()">Tuyệt vời!</button>`);
}

/* ===== Chạm vào cảnh ===== */
function walkTo(gx,gy){Motion.navigate(Scene.player,clamp(gx-.6,.5,N-.5),clamp(gy-.2,.5,N-.5))}
function popAt(sx,sy,html,setup){
  const L=$('#layer-pop');L.innerHTML='';const p=el('div','pop',html);
  p.style.left=clamp(sx,150,Scene.w-150)+'px';p.style.top=Math.max(150,sy-24)+'px';L.appendChild(p);setup&&setup(p);return p;
}
Scene.onTap=(gx,gy,sx,sy)=>{
  if(!$('#hud')||$('#hud').classList.contains('hidden'))return;
  if(decorPlacement){placeDecor(Math.floor(gx)+.5,Math.floor(gy)+.5);return}
  const decoration=(S.decor||[]).filter(d=>DECOR_CATALOG[d.id]).sort((a,b)=>Math.hypot(gx-a.gx,gy-a.gy)-Math.hypot(gx-b.gx,gy-b.gy)).find(d=>Math.hypot(gx-d.gx,gy-d.gy)<.85);if(decoration)return tapDecor(decoration,sx,sy);
  const i=Math.floor(gx),j=Math.floor(gy);hidePop();beep('tap');
  for(const id in BUILDINGS){const[a,b]=BUILDINGS[id].slot;if(gx>=a-.2&&gx<=a+2.2&&gy>=b-.2&&gy<=b+2.2){return tapBuilding(id,sx,sy)}}
  if(Math.hypot(gx-5,gy-5)<1.3){walkTo(5,6);return openStorage()}
  if(Math.hypot(gx-12,gy-5.9)<1.2){walkTo(11.6,5.2);return openFishing()}
  if(Math.hypot(gx-1.2,gy-9)<1){walkTo(2,9.5);return toast('🪣 Giếng làng: nước trong mát!')}
  for(let k=0;k<PCOLS*PROWS;k++){const[a,b]=plotXY(k);if(i===a&&j===b)return tapPlot(k,sx,sy)}
  walkTo(gx,gy);
};
function tapPlot(k,sx,sy){
  const[i,j]=plotXY(k);walkTo(i+.5,j+1);Scene.sel=k;
  if(k>S.plotsOpen)return toast('🔒 Hãy mở các ô đất liền trước đã!');
  if(k===S.plotsOpen){
    const req=plotReqLv(k),cost=plotCost(k);
    return popAt(sx,sy,`<h4>🔒 Mở đất mới</h4><p>Cần cấp ${req} · Giá 🪙${fmt(cost)}</p><div class="acts"><button class="cbtn2 ${S.lv<req||S.coins<cost?'gray':''}" id="pb">Mở đất</button></div>`,p=>{
      $('#pb',p).onclick=()=>{if(S.lv<req)return toast(`Cần đạt cấp ${req}`),beep('err');if(S.coins<cost)return toast('Không đủ xu'),beep('err');addCoins(-cost);S.plotsOpen++;Scene.burst(sx,sy,'✨');beep('coin');hidePop();toast('Đã mở thêm ô đất!')}});
  }
  const pl=S.plots[k];
  if(!pl.crop)return seedPicker(k,sx,sy);
  if(cropProg(pl)>=1)return harvestPlot(k,sx,sy);
  const C=CROPS[pl.crop],rem=cropDur(pl)-(Date.now()-pl.t0),gc=Math.max(1,Math.ceil(rem/15000));
  const up=plotUpCost(pl);
  popAt(sx,sy,`<h4>${C.e} ${C.n} <small>(Đất ★${pl.lv})</small></h4><p>⏳ Còn <b id="pt">${fmtT(rem)}</b> · Sản lượng ×${yieldQty(pl)}</p><div class="acts"><button class="cbtn2 orange sm" id="pf">⚡ ${gc}💎 Tăng tốc</button><button class="cbtn2 blue sm" id="pu">⬆ Đất 🪙${fmt(up)}</button></div>`,p=>{
    $('#pf',p).onclick=()=>{if(S.gems<gc)return toast('Không đủ ngọc'),beep('err');addGems(-gc);pl.t0-=cropDur(pl);hidePop();Scene.burst(sx,sy,'⚡');beep('win')};
    $('#pu',p).onclick=()=>upgradePlot(k,sx,sy);
    const iv=setInterval(()=>{const t=$('#pt');if(!t||!p.isConnected)return clearInterval(iv);t.textContent=fmtT(Math.max(0,cropDur(pl)-(Date.now()-pl.t0)))},500);
  });
}
function upgradePlot(k,sx,sy){
  const pl=S.plots[k];if(pl.lv>=5)return toast('Đất đã đạt cấp tối đa!');
  const c=plotUpCost(pl);if(S.coins<c)return toast('Không đủ xu'),beep('err');
  addCoins(-c);pl.lv++;track('upgrade');Scene.burst(sx,sy,'⭐');beep('win');hidePop();toast(`⬆ Đất lên ★${pl.lv}: thu hoạch nhiều hơn & mọc nhanh hơn`);
}
function seedPicker(k,sx,sy){
  const list=Object.entries(CROPS);
  popAt(sx,sy,`<h4>🌱 Gieo hạt</h4><div class="seedgrid">${list.map(([id,c])=>{const own=S.seeds[id]||0,lock=S.lv<c.lv;return`<button data-id="${id}" ${lock?'disabled':''}><span>${Art.icon(Art.has("seed-"+id)?"seed-"+id:id,c.n)}</span>${lock?'🔒Cấp '+c.lv:c.n}<br>${lock?'':own?'x'+own:'🪙'+c.seed}</button>`}).join('')}</div><div class="acts" style="margin-top:6px"><button class="cbtn2 blue sm" id="pu">⬆ Đất ★${S.plots[k].lv} 🪙${fmt(plotUpCost(S.plots[k]))}</button></div>`,p=>{
    const search=el('input','seed-search');search.id='seed-find';search.placeholder='Tìm hạt giống…';p.querySelector('.seedgrid').before(search);search.oninput=()=>{const q=search.value.trim().toLocaleLowerCase('vi');p.querySelectorAll('[data-id]').forEach(b=>b.style.display=CROPS[b.dataset.id].n.toLocaleLowerCase('vi').includes(q)?'':'none')};
    p.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>plant(k,b.dataset.id,sx,sy));
    $('#pu',p).onclick=()=>upgradePlot(k,sx,sy);
  });
}
function plant(k,id,sx,sy,quiet){
  const C=CROPS[id];
  if(S.seeds[id]>0)S.seeds[id]--;else{if(S.coins<C.seed)return toast('Không đủ xu mua hạt'),beep('err');addCoins(-C.seed)}
  const pl=S.plots[k];pl.crop=id;pl.t0=Date.now();S.lastSeed=id;
  if(!quiet){Motion.workPlayer();Scene.burst(sx,sy,'sprout',5);hidePop();beep('tap')}
}
function harvestPlot(k,sx,sy,quiet){
  const pl=S.plots[k],C=CROPS[pl.crop],q=yieldQty(pl);
  if(invTotal()+q>S.cap){toast('Kho đầy! Hãy giao hàng hoặc nâng cấp kho.');beep('err');return false}
  addItem(pl.crop,q);const[i,j]=plotXY(k);
  Motion.workPlayer();Motion.emit('harvest',i+.5,j+.5,38,.65);Scene.float(i+.5,j+.5,`+${q} ${C.e}`);Scene.burst(sx||Scene.iso(i+.5,j+.5).x,sy||Scene.iso(i+.5,j+.5).y,'harvest-burst',5);
  addXp(C.xp);track('harvest',q);if(pl.crop==='lua')track('harvest_lua',q);
  pl.crop=null;if(!quiet){hidePop();beep('coin')}refreshHud();return true;
}
function harvestAll(){
  let n=0;for(let k=0;k<S.plotsOpen;k++){const pl=S.plots[k];if(pl.crop&&cropProg(pl)>=1){if(harvestPlot(k,null,null,true)){n++;if(S.lastSeed&&(S.seeds[S.lastSeed]>0||S.coins>=CROPS[S.lastSeed].seed*2)&&S.lv>=CROPS[S.lastSeed].lv)plant(k,S.lastSeed,0,0,true)}}}
  if(n){beep('coin');toast(`🧺 Đã thu ${n} ô và gieo lại tự động`)}else toast('Chưa có ô nào chín');
}
function tapBuilding(id,sx,sy){
  const d=BUILDINGS[id],b=S.b[id],[a,c]=d.slot;walkTo(a+1,c+2.4);
  if(!b){
    if(S.lv<d.lv)return toast(`🔒 ${d.n} mở ở cấp ${d.lv}`);
    return popAt(sx,sy,`<h4>${d.e} ${d.n}</h4><p>${d.desc}</p><div class="acts"><button class="cbtn2" id="pb">Xây 🪙${fmt(d.cost)}</button></div>`,p=>$('#pb',p).onclick=()=>buildB(id,sx,sy));
  }
  if(b.ready){
    const q=bQty(id);if(invTotal()+q>S.cap)return toast('Kho đầy!'),beep('err');
    addItem(d.out,q);b.ready=false;b.t0=0;addXp(8+b.lv*2);Scene.float(a+1,c+1,`+${q} ${ITEMS[d.out].e}`);Scene.burst(sx,sy,ITEMS[d.out].e,5);beep('coin');track('harvest',q);return;
  }
  if(b.t0){
    const rem=bTime(id)-(Date.now()-b.t0);
    return popAt(sx,sy,`<h4>${d.e} ${d.n} Lv${b.lv}</h4><p>⏳ Còn ${fmtT(rem)} → ${ITEMS[d.out].e} x${bQty(id)}</p><div class="acts"><button class="cbtn2 orange sm" id="pf">⚡ ${Math.max(1,Math.ceil(rem/20000))}💎</button><button class="cbtn2 blue sm" id="pu">⬆ 🪙${fmt(bUpCost(id))}</button></div>`,p=>{
      $('#pf',p).onclick=()=>{const g=Math.max(1,Math.ceil(rem/20000));if(S.gems<g)return toast('Không đủ ngọc');addGems(-g);b.t0-=bTime(id)};$('#pu',p).onclick=()=>upgradeB(id)});
  }
  const inp=d.in?Object.entries(d.in).map(([k,v])=>`${ITEMS[k].e}${v}`).join(' + '):'miễn phí';
  popAt(sx,sy,`<h4>${d.e} ${d.n} Lv${b.lv}</h4><p>${d.desc}<br>Cần: ${inp} · ⏱ ${fmtT(bTime(id))}</p><div class="acts"><button class="cbtn2 sm" id="ps">▶ Bắt đầu</button><button class="cbtn2 blue sm" id="pu">⬆ Nâng cấp 🪙${fmt(bUpCost(id))}</button></div>`,p=>{
    $('#ps',p).onclick=()=>{
      if(d.in)for(const k in d.in)if(!has(k,d.in[k]))return toast(`Thiếu ${ITEMS[k].e} ${ITEMS[k].n} x${d.in[k]}`),beep('err');
      if(d.in)for(const k in d.in)addItem(k,-d.in[k]);
      b.t0=Date.now();hidePop();beep('tap');refreshHud();
    };$('#pu',p).onclick=()=>upgradeB(id);
  });
}
function buildB(id,sx,sy){
  const d=BUILDINGS[id];if(S.b[id])return toast('Đã xây rồi');if(S.lv<d.lv)return toast(`Cần cấp ${d.lv}`);
  if(S.coins<d.cost)return toast('Không đủ xu'),beep('err');
  addCoins(-d.cost);S.b[id]={lv:1,t0:0,ready:false};Scene.syncAnimals();track('build_'+id);addXp(30);
  Scene.burst(sx||Scene.w/2,sy||Scene.h/2,'🔨',10);beep('win');hidePop();toast(`🏠 Đã xây ${d.n}!`);
  const p=Scene.iso(d.slot[0]+1,d.slot[1]+1);Scene.burst(p.x,p.y,'✨',10);
}
function upgradeB(id){
  const b=S.b[id];if(b.lv>=5)return toast('Đã tối đa cấp');const c=bUpCost(id);
  if(S.coins<c)return toast('Không đủ xu'),beep('err');
  addCoins(-c);b.lv++;track('upgrade');Scene.syncAnimals();hidePop();beep('win');toast(`⬆ ${BUILDINGS[id].n} lên Lv${b.lv}!`);const d=BUILDINGS[id],p=Scene.iso(d.slot[0]+1,d.slot[1]+1);Scene.burst(p.x,p.y,'⭐',10);
}
setInterval(()=>{ // công trình hoàn thành
  for(const id in S.b){const b=S.b[id];if(b.t0&&!b.ready&&Date.now()-b.t0>=bTime(id)){b.ready=true;toast(`${BUILDINGS[id].e} ${BUILDINGS[id].n} đã xong!`)}}
},1000);

/* ===== Cửa hàng ===== */
let shopTab=0;
function openShop(tab=shopTab){
  shopTab=tab;
  openSheet('shop','Cửa hàng',body=>{
    body.innerHTML=`<div class="row" style="justify-content:flex-end;font-weight:800;font-size:20px;margin-bottom:6px">🪙 ${fmt(S.coins)} &nbsp; 💎 ${S.gems}</div>`;
    body.appendChild(tabs(['🌱 Hạt giống','🏭 Nhà máy','🐄 Chuồng','📦 Kho & đất','🎣 Câu cá','🌳 Cây lâu năm','🏮 Trang trí','🏠 Mô hình'],shopTab,i=>{shopTab=i;refreshSheet()}));
    if(shopTab>=5){renderDecorShop(body,shopTab===5?'trees':shopTab===6?'heritage':'models');return}
    const g=el('div','grid3');
    if(shopTab===0)for(const[id,c]of Object.entries(CROPS)){const lock=S.lv<c.lv;const it=el('div','item'+(lock?' lock':''),`${S.seeds[id]?`<span class="badge">${S.seeds[id]}</span>`:''}<div class="em">${Art.icon(id,c.n)}</div>${c.n}<div class="pr">${lock?`<span class="lockt">🔒 Lv ${c.lv}</span>`:`🪙${c.seed} <small>x5</small>`}</div><small>${fmtT(c.t*1000)} · bán ${c.sell}</small>`);
      it.onclick=()=>{if(lock)return toast(`Mở ở cấp ${c.lv}`);if(S.coins<c.seed*5)return toast('Không đủ xu'),beep('err');addCoins(-c.seed*5);S.seeds[id]=(S.seeds[id]||0)+5;beep('coin');refreshSheet()};g.appendChild(it)}
    else if(shopTab===1||shopTab===2){
      const ids=Object.keys(BUILDINGS).filter(k=>shopTab===1?(['mill','oven'].includes(k)||BUILDINGS[k].kind==='factory'):(['coop','pen','bee'].includes(k)||BUILDINGS[k].kind==='animal'));
      for(const id of ids){const d=BUILDINGS[id],lock=S.lv<d.lv,own=S.b[id];
        const it=el('div','item'+(lock?' lock':''),`<div class="em">${Art.icon(d.art||id,d.n)}</div>${d.n}<div class="pr">${own?'<span style="color:#2e8b3a">✔ Đã xây Lv'+own.lv+'</span>':lock?`<span class="lockt">🔒 Lv ${d.lv}</span>`:`🪙${fmt(d.cost)}`}</div><small>${d.desc}</small>`);
        it.onclick=()=>{if(own){closeSheet();const p=Scene.iso(d.slot[0]+1,d.slot[1]+1);Scene.centerOn(d.slot[0]+1,d.slot[1]+1,1.1);return}if(lock)return toast(`Mở ở cấp ${d.lv}`);buildB(id);refreshSheet();Scene.centerOn(d.slot[0]+1,d.slot[1]+1,1.1)};g.appendChild(it)}
    }else if(shopTab===3){
      const sc=Math.round(300*S.cap/50);
      const items=[
        {e:'🏺',n:'Nâng cấp kho +50',pr:`🪙${fmt(sc)}`,f:()=>{if(S.coins<sc)return false;addCoins(-sc);S.cap+=50;return true}},
        {e:'🟫',n:'Mở đất kế tiếp',pr:S.plotsOpen<PCOLS*PROWS?`🪙${fmt(plotCost(S.plotsOpen))}`:'Đã mở hết',f:()=>{const k=S.plotsOpen;if(k>=PCOLS*PROWS||S.lv<plotReqLv(k)){toast(`Cần cấp ${plotReqLv(k)}`);return null}if(S.coins<plotCost(k))return false;addCoins(-plotCost(k));S.plotsOpen++;return true}},
        {e:'💎',n:'Đổi 5 ngọc → 500 xu',pr:'💎5',f:()=>{if(S.gems<5)return false;addGems(-5);addCoins(500);return true}},
        {e:'⚡',n:'Gói tăng tốc',pr:'💎10',f:()=>{if(S.gems<10)return false;addGems(-10);S.plots.forEach(p=>{if(p.crop)p.t0-=cropDur(p)*.5});return true}}
      ];
      for(const x of items){const it=el('div','item',`<div class="em">${x.e}</div>${x.n}<div class="pr">${x.pr}</div>`);it.onclick=()=>{const r=x.f();if(r===false){toast('Không đủ tài nguyên');beep('err')}else if(r){beep('coin');refreshSheet()}};g.appendChild(it)}
    }else{
      for(const r of RODS){const own=S.fish.rod===r.id,have=S.fish.ownedRods.includes(r.id);
        const it=el('div','item',`<div class="em">${Art.icon("rod-"+r.id,r.n)}</div>${r.n}<div class="pr">${have?(own?'✔ Đang dùng':'Đã có'):r.cur==='g'?'💎'+r.p:'🪙'+fmt(r.p)}</div><small>Lực kéo ×${r.pow}</small>`);
        it.onclick=()=>{if(have){S.fish.rod=r.id;refreshSheet();return}const cur=r.cur==='g'?S.gems:S.coins;if(cur<r.p)return toast('Không đủ'),beep('err');r.cur==='g'?addGems(-r.p):addCoins(-r.p);S.fish.rod=r.id;S.fish.ownedRods.push(r.id);beep('win');refreshSheet()};g.appendChild(it)}
      for(const b of BAITS){const it=el('div','item',`<span class="badge">${S.fish.baits[b.id]||0}</span><div class="em">${Art.icon("bait-"+b.id,b.n)}</div>${b.n}<div class="pr">🪙${b.p} <small>x5</small></div><small>Cá hiếm +${Math.round(b.rare*100)}%</small>`);
        it.onclick=()=>{if(S.coins<b.p*5)return toast('Không đủ xu'),beep('err');addCoins(-b.p*5);S.fish.baits[b.id]=(S.fish.baits[b.id]||0)+5;beep('coin');refreshSheet()};g.appendChild(it)}
      for(const t of TOOLS){const own=S.fish.tools[t.id];const it=el('div','item',`<div class="em">${Art.icon(t.id==="luoi"?"net":"bucket",t.n)}</div>${t.n}<div class="pr">${own?'✔ Đã có':'🪙'+t.p}</div><small>${t.desc}</small>`);
        it.onclick=()=>{if(own)return;if(S.coins<t.p)return toast('Không đủ xu'),beep('err');addCoins(-t.p);S.fish.tools[t.id]=1;beep('win');refreshSheet()};g.appendChild(it)}
    }
    body.appendChild(g);
  },'86%');
}
function openStorage(){openShop(3)}

/* ===== Túi ===== */
function openBag(){
  openSheet('bag','Túi',body=>{
    const ids=Object.keys(S.inv);
    body.innerHTML=`<div class="row" style="justify-content:space-between;font-weight:800;margin-bottom:8px"><span>Kho: ${invTotal()}/${S.cap}</span><button class="cbtn2 sm" id="sellall">Bán hết 🪙</button></div><div class="prog" style="margin-bottom:12px"><i style="width:${invTotal()/S.cap*100}%"></i></div>`;
    $('#sellall',body).onclick=()=>{let t=0;for(const id of ids){t+=ITEMS[id].sell*S.inv[id];delete S.inv[id]}if(!t)return toast('Túi trống');addCoins(t);beep('coin');toast(`Đã bán được 🪙${fmt(t)}`);refreshSheet()};
    if(!ids.length){body.appendChild(el('div','empty','<div class="em">🎒</div><p>Túi trống. Hãy thu hoạch nông sản nhé!</p>'))}
    const g=el('div','grid3');
    for(const id of ids){const it=el('div','item',`<span class="badge">${S.inv[id]}</span><div class="em">${Art.icon(id,ITEMS[id].n)}</div>${ITEMS[id].n}<div class="pr">🪙${ITEMS[id].sell}</div>`);
      it.onclick=()=>{S.inv[id]--;if(!S.inv[id])delete S.inv[id];addCoins(ITEMS[id].sell);Scene.float(6,8,`+${ITEMS[id].sell}🪙`,'#ffe27a');beep('coin');refreshSheet()};g.appendChild(it)}
    body.appendChild(g);
    body.appendChild(el('p','', '<small style="font-weight:700">Chạm vào vật phẩm để bán 1 cái. Hạt giống: '+(Object.entries(S.seeds).filter(([,v])=>v).map(([k,v])=>CROPS[k].e+v).join(' ')||'không có')+'</small>'));
  },'76%');
}

/* ===== Đơn hàng ===== */
function openOrders(){
  openSheet('orders','Đơn xe tải',body=>{
    const done=S.orders.filter(o=>o.need.every(n=>has(n.id,n.n))).length,mk=market();
    body.innerHTML=`<div class="row" style="margin-bottom:10px"><div style="font-size:50px">🚚</div><div style="flex:1"><div class="prog"><i style="width:${done/9*100}%"></i></div></div><div style="font-weight:800;color:#2e8b3a;background:#dff2d4;border-radius:14px;padding:2px 10px">${done}/9 đủ hàng</div></div>
    <div class="cardx" style="background:#fff0c8;border:3px solid #e8b53a"><div class="row"><b style="font-size:19px">Chợ phiên:</b>${mk.map(k=>`<div class="chip"><b>${CROPS[k].e}</b></div>`).join('')}<b style="margin-left:auto">+25%</b></div></div>`;
    S.orders.forEach((o,idx)=>{
      const ok=o.need.every(n=>has(n.id,n.n)),bonus=o.need.some(n=>mk.includes(n.id))?1.25:1;
      const d=el('div','ord'+(ok?' ready':''),`${o.need.map(n=>`<div class="chip ${has(n.id,n.n)?'':'bad'}"><b>${itemE(n.id)}</b>${Math.min(n.n,S.inv[n.id]||0)}/${n.n}</div>`).join('')}<div class="rew">🪙 ${Math.round(o.coins*bonus)}<br>⭐ ${o.xp}</div><button class="cbtn2 ${ok?'':'gray'}">${ok?'Giao':'☆'}</button><button class="cbtn2 gray">🗑</button>`);
      const[b1,b2]=d.querySelectorAll('button');
      b1.onclick=()=>{if(!ok)return toast('Chưa đủ hàng'),beep('err');o.need.forEach(n=>addItem(n.id,-n.n));addCoins(Math.round(o.coins*bonus));addXp(o.xp);S.orders[idx]=genOrder();track('deliver');beep('win');Scene.burst(Scene.w/2,Scene.h*.6,'🪙',10);toast(`🚚 Giao hàng thành công +🪙${Math.round(o.coins*bonus)}`);refreshSheet()};
      b2.onclick=()=>{S.orders[idx]=genOrder();refreshSheet()};
      body.appendChild(d);
    });
  },'86%');
}

/* ===== Bạn bè, mời bạn ===== */
let friendTab=0;
function openFriends(t=0){
  friendTab=t;
  openSheet('friends','Bạn bè',body=>{
    if(S.gift.day!==today())S.gift={sent:0,recv:0,day:today()};
    body.appendChild(tabs(['Bạn bè','Quà tặng','Xin đồ'],friendTab,i=>{friendTab=i;refreshSheet()}));
    if(friendTab===0){
      S.friends.forEach(f=>{
        const d=el('div','ord',`<div style="font-size:40px">${f.e}</div><div style="flex:1;font-weight:800;font-size:19px">${f.n}<br><small>Cấp ${f.lv} ${f.st?'· 🟢 Đang online':''}</small></div><button class="cbtn2 sm">Thăm</button><button class="cbtn2 orange sm">🎁</button>`);
        const[v,g]=d.querySelectorAll('button');
        v.onclick=()=>{closeSheet();visitFriend(f)};
        g.onclick=()=>{if(S.gift.sent>=5)return toast('Hôm nay đã tặng đủ 5 quà');S.gift.sent++;addXp(5);beep('coin');toast(`🎁 Đã tặng quà cho ${f.n}`);refreshSheet()};
        body.appendChild(d)});
      body.appendChild(el('p','empty','<small>Mời thêm bạn bằng nút “Mời bạn” để nhận thưởng!</small>'));
    }else if(friendTab===1){
      body.appendChild(el('div','',`<b>Đã gửi hôm nay: ${S.gift.sent}/5 · Đã nhận hôm nay: ${S.gift.recv}/5</b>`));
      if(S.gift.recv<5&&S.friends.length){const f=S.friends[S.gift.recv%S.friends.length];
        const d=el('div','ord',`<div style="font-size:40px">🎁</div><div style="flex:1;font-weight:800">Quà từ ${f.n}<br><small>🪙80</small></div><button class="cbtn2 sm">Nhận</button>`);
        $('button',d).onclick=()=>{S.gift.recv++;addCoins(80);beep('coin');refreshSheet()};body.appendChild(d)}
      else body.appendChild(el('div','empty','<div class="em">🎁</div><b>Chưa có quà nào đang chờ.</b><p>Tặng quà cho bạn bè để họ tặng lại bạn nhé.</p>'));
    }else{
      body.appendChild(el('p','','<b>Nhờ bạn bè giúp đỡ:</b>'));
      for(const id of ['lua','ngo','trung']){const d=el('div','ord',`<div class="chip"><b>${itemE(id)}</b>${ITEMS[id].n}</div><div style="flex:1;font-weight:700">Xin 3 ${ITEMS[id].n}</div><button class="cbtn2 sm">Xin đồ</button>`);
        $('button',d).onclick=function(){this.className='cbtn2 gray sm';this.textContent='Đã gửi';setTimeout(()=>{if(invTotal()+3<=S.cap){addItem(id,3);toast(`${pick(S.friends).n} gửi bạn 3 ${ITEMS[id].e}`);refreshHud();beep('coin')}},2500)};body.appendChild(d)}
    }
  },'80%');
}
function visitFriend(f){
  fadeTo(()=>{
    const old={x:Scene.cam.x,y:Scene.cam.y,z:Scene.cam.z};
    const o=el('div','');o.id='visit';o.style.cssText='position:fixed;left:50%;top:calc(130px + var(--st));transform:translateX(-50%);z-index:25;background:var(--hud);color:#fff;border-radius:24px;padding:8px 18px;font-weight:800;font-size:19px;display:flex;gap:10px;align-items:center';
    o.innerHTML=`${f.e} Đang thăm vườn ${f.n}`;const b=el('button','cbtn2 sm','🌾 Giúp thu hoạch');const x=el('button','cbtn2 gray sm','Về nhà');o.append(b,x);document.body.appendChild(o);
    b.onclick=()=>{addCoins(60);addXp(15);Scene.burst(Scene.w/2,Scene.h/2,'🌾',8);beep('coin');b.remove();toast('Bạn nhận 🪙60 vì giúp hàng xóm!')};
    x.onclick=()=>{fadeTo(()=>o.remove())};
  });
}
function openInvite(){
  openSheet('invite','Mời bạn',body=>{
    const code=(S.refCode=S.refCode||Math.random().toString(36).slice(2,8).toUpperCase());
    const link=location.origin+location.pathname+'?ref='+code;
    body.innerHTML=`<div class="big-ico">💌</div><p style="text-align:center;font-weight:700;font-size:19px">Mời bạn bè vào xóm — mỗi người tham gia bạn nhận <b>💎 5 + 🪙 300</b>!</p><div class="lbl">Mã mời của bạn: <b style="color:var(--accent)">${code}</b></div><div class="invite">${link}</div><div class="row" style="margin-top:12px"><button class="btn-big" id="cp">📋 Sao chép liên kết</button><button class="btn-big" style="background:linear-gradient(#58a8f0,#2f78c8);box-shadow:0 5px 0 #1c4f90" id="sh">📤 Chia sẻ</button></div><p class="empty"><small>Đã mời: ${S.invited||0} người</small></p>`;
    $('#cp',body).onclick=()=>{(navigator.clipboard?navigator.clipboard.writeText(link):Promise.reject()).then(()=>toast('✅ Đã sao chép liên kết!')).catch(()=>{const t=document.createElement('textarea');t.value=link;document.body.appendChild(t);t.select();try{document.execCommand('copy');toast('✅ Đã sao chép!')}catch(e){}t.remove()})};
    $('#sh',body).onclick=()=>{if(navigator.share)navigator.share({title:'Xóm Nông Trại',text:'Vào xóm nông trại cùng mình nhé! 🌾',url:link}).catch(()=>{});else $('#cp',body).click()};
  },'70%');
}

/* ===== Điểm danh ===== */
function openCheckin(){
  openSheet('checkin','Điểm danh',body=>{
    const ci=S.checkin,can=ci.last!==today();
    body.innerHTML=`<p style="text-align:center;font-weight:700;font-size:19px">Điểm danh 7 ngày liên tiếp để nhận quà lớn!</p>`;
    const g=el('div','days');
    CHECKIN.forEach((c,i)=>{g.appendChild(el('div','day'+(i<ci.day?' done':'')+(i===ci.day&&can?' today':''),`Ngày ${i+1}<div class="em">${c.e}</div><small>${c.t}</small>`))});
    body.appendChild(g);
    const b=el('button','btn-big',can?'Nhận quà hôm nay':'Hôm nay đã điểm danh ✔');b.style.marginTop='16px';b.disabled=!can;
    b.onclick=()=>{const c=CHECKIN[ci.day%7];reward({c:c.c,g:c.g,i:c.i});ci.day=(ci.day+1)%8>=7?0:ci.day+1;ci.last=today();beep('win');Scene.burst(Scene.w/2,Scene.h/2,'🎁',10);toast('🎁 Nhận quà điểm danh!');refreshSheet()};
    body.appendChild(b);
  },'70%');
}

/* ===== Mùa vụ ===== */
let seasonTab=0;
function openSeason(){
  openSheet('season','Mùa vụ',body=>{
    body.appendChild(tabs(['Phần thưởng','Đua tỉnh'],seasonTab,i=>{seasonTab=i;refreshSheet()}));
    if(seasonTab===0){
      const tier=Math.floor(S.sxp/100);
      body.appendChild(el('div','',`<b>Điểm mùa vụ: ${S.sxp} · Bậc ${Math.min(tier,SEASON_TIERS)}/${SEASON_TIERS}</b><div class="prog" style="margin:6px 0 12px"><i style="width:${S.sxp%100}%"></i></div>`));
      for(let i=1;i<=SEASON_TIERS;i++){
        const r=i%5===0?{g:5+i/5}:{c:100+i*40},got=S.sclaimed.includes(i),ok=tier>=i;
        const d=el('div','ord'+(ok&&!got?' ready':''),`<div class="chip"><b>${i}</b>Bậc</div><div style="flex:1;font-weight:800;font-size:19px">${rewardText(r)}</div><button class="cbtn2 ${ok&&!got?'':'gray'}">${got?'✔':ok?'Nhận':'🔒'}</button>`);
        $('button',d).onclick=()=>{if(!ok||got)return;S.sclaimed.push(i);reward(r);beep('coin');refreshSheet()};body.appendChild(d)}
    }else{
      const ps=PROVINCES.map(p=>[p[0],hashN(p[0])%900+300]);if(S.province)ps.push([S.province,(S.sxp+S.lv*40)+ (hashN(S.province)%200)]);
      ps.sort((a,b)=>b[1]-a[1]);
      ps.slice(0,20).forEach((p,i)=>body.appendChild(el('div','ord'+(p[0]===S.province?' ready':''),`<div class="chip"><b>${i<3?['🥇','🥈','🥉'][i]:i+1}</b></div><div style="flex:1;font-weight:800;font-size:19px">${p[0]}</div><b>${(p[1]/10).toFixed(1)} điểm</b>`)));
    }
  },'84%');
}
function hashN(s){let h=7;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h}

/* ===== Sự kiện ===== */
function openEvents(){
  openSheet('events','Sự kiện',body=>{
    EVENTS.forEach(e=>{
      const p=Math.min(e.goal,S.ev[e.id]||0),done=p>=e.goal,got=S.evClaimed[e.id];
      const d=el('div','cardx',`<div class="row"><div style="font-size:56px">${e.e}</div><div style="flex:1"><b style="font-size:21px">${e.n}</b><br><small style="font-weight:700">${e.d}</small><div class="prog" style="margin:6px 0"><i style="width:${p/e.goal*100}%"></i></div><b>${p}/${e.goal}</b> · ${rewardText(e.r)}</div><button class="cbtn2 ${done&&!got?'':'gray'}">${got?'✔':done?'Nhận':'Đang chơi'}</button></div>`);
      $('button',d).onclick=()=>{if(!done||got)return;S.evClaimed[e.id]=1;reward(e.r);beep('win');Scene.burst(Scene.w/2,Scene.h/2,'🎉',12);refreshSheet()};body.appendChild(d)});
  },'74%');
}

/* ===== Hộp thư, nhiệm vụ, menu ===== */
function openMail(){
  openSheet('mail','Hộp thư',body=>{
    if(!S.mail.length)body.appendChild(el('div','empty','<div class="em">📭</div><b>Hộp thư trống</b>'));
    S.mail.forEach(m=>{const d=el('div','cardx',`<div class="row"><div style="font-size:40px">${m.got?'📭':'✉️'}</div><div style="flex:1"><b style="font-size:19px">${m.t}</b><br><small style="font-weight:700">${m.d}</small>${m.c||m.g?`<br><b>${rewardText({c:m.c,g:m.g})}</b>`:''}</div><button class="cbtn2 ${m.got?'gray':''}">${m.got?'Đã đọc':'Nhận'}</button></div>`);
      $('button',d).onclick=()=>{if(m.got)return;m.got=true;reward({c:m.c,g:m.g});beep('coin');refreshSheet();refreshHud()};body.appendChild(d)});
  },'66%');
}
function openQuests(){
  openSheet('quests','Nhiệm vụ',body=>{
    QUESTS.forEach((q,i)=>{const cur=i===S.qi,done=i<S.qi,p=cur?Math.min(q.goal,questProg(q)):done?q.goal:0;
      const d=el('div','ord'+(cur&&p>=q.goal?' ready':''),`<div style="font-size:34px">${done?'✅':cur?'📜':'🔒'}</div><div style="flex:1"><b style="font-size:19px">${q.n}</b><div class="prog" style="margin:4px 0"><i style="width:${p/q.goal*100}%"></i></div><small>${p}/${q.goal} · ${rewardText(q.r)}</small></div>${cur&&p>=q.goal?'<button class="cbtn2">Nhận</button>':''}`);
      const b=$('button',d);if(b)b.onclick=()=>{claimQuest();refreshSheet()};body.appendChild(d)});
  },'70%');
}
function openMenu(){
  openSheet('menu','Menu',body=>{
    const g=el('div','grid3');
    [['🎣','Câu cá',openFishing],['🐟','Sổ cá',openFishAlbum],['🖼','Thư viện PNG',openArtLibrary],['🦋','Xem chuyển động',()=>window.open('chuyen-dong.html','_blank','noopener')],['👤','Hồ sơ',openProfile],['🎨','Giao diện',()=>openSettings(1)],['⚙️','Cài đặt',()=>openSettings(0)],['📜','Nhiệm vụ',openQuests],['🗺️','Đổi quê',changeProvince]].forEach(([e,n,f])=>{const it=el('div','item',`<div class="em">${e}</div>${n}`);it.onclick=f;g.appendChild(it)});
    body.appendChild(g);
  },'50%');
}

/* ===== Hồ sơ / cài đặt / avatar ===== */
function openProfile(){
  openSheet('profile','Hồ sơ',body=>{
    body.innerHTML=`<canvas id="pav" class="av-prev" width="340" height="400"></canvas><div style="text-align:center;font-weight:800;font-size:24px">${S.name}</div><div style="text-align:center;font-weight:700">Cấp ${S.lv} · 📍 ${S.province||'—'}</div>
    <div class="grid3" style="margin:14px 0"><div class="item"><div class="em" style="height:40px">🪙</div>${fmt(S.coins)}</div><div class="item"><div class="em" style="height:40px">💎</div>${S.gems}</div><div class="item"><div class="em" style="height:40px">🐟</div>${S.fish.caught} cá</div></div>
    <div class="row"><button class="btn-big" id="e1">✏️ Chỉnh nhân vật</button><button class="btn-big" id="e2" style="background:linear-gradient(#f5a43d,#d67410);box-shadow:0 5px 0 #9d520a">⚙️ Cài đặt</button></div>`;
    const x=$('#pav',body).getContext('2d');drawAvatar(x,170,380,330,S.av,{t:0});
    $('#e1',body).onclick=openAvatarEditor;$('#e2',body).onclick=()=>openSettings(0);
  },'84%');
}
function openAvatarEditor(){
  openSheet('avatar','Nhân vật',body=>{
    body.innerHTML=`<canvas id="pav" class="av-prev" width="340" height="400"></canvas>`;
    body.appendChild(el('div','lbl','Bộ nhân vật PNG'));const styles=el('div','avatar-styles');for(let i=0;i<6;i++){const b=el('button',(S.av.art!==false&&(S.av.style||0)===i)?'on':'',Art.icon(`farmer-${i}-idle`,'Nhân vật '+(i+1)));b.onclick=()=>{S.av.art=true;S.av.style=i;S.av.outfit=OUTFITS[i];refreshSheet();drawHudAvatar()};styles.appendChild(b)}body.appendChild(styles);const custom=el('button','cbtn2 sm','Tự phối màu da, tóc, áo và mũ');custom.onclick=()=>{S.av.art=false;refreshSheet();drawHudAvatar()};body.appendChild(custom);
    const redraw=()=>{const x=$('#pav',body).getContext('2d');x.clearRect(0,0,340,400);drawAvatar(x,170,380,330,S.av,{t:0});drawHudAvatar()};
    const row=(lbl,key,arr)=>{body.appendChild(el('div','lbl',lbl));const r=el('div','sw-row');arr.forEach(c=>{const b=el('button','sw-c'+(S.av[key]===c?' on':''));b.style.background=c;b.onclick=()=>{S.av.art=false;S.av[key]=c;refreshSheet();drawHudAvatar()};r.appendChild(b)});body.appendChild(r)};
    row('Màu da','skin',SKINS);row('Tóc','hair',HAIRS);row('Áo','outfit',OUTFITS);
    body.appendChild(el('div','lbl','Mũ'));const s=el('div','seg');HATS.forEach(([k,n])=>{const b=el('button',S.av.hat===k?'on':'',n);b.onclick=()=>{S.av.art=false;S.av.hat=k;refreshSheet();drawHudAvatar()};s.appendChild(b)});body.appendChild(s);
    body.appendChild(el('div','lbl','Tên'));const inp=el('input','search');inp.value=S.name;inp.maxLength=16;inp.oninput=()=>S.name=inp.value||'Nông dân';body.appendChild(inp);
    redraw();
  },'88%');
}
let setTab=0;
function openSettings(t=setTab){
  setTab=t;
  openSheet('settings','Cài đặt',body=>{
    const library=el('button','btn-big','🖼 Thư viện PNG trong suốt');library.onclick=openArtLibrary;body.appendChild(library);body.appendChild(el('p','art-status',`${Object.keys(ART_MANIFEST.sprites).length} hình · ${Art.failed.length?'Lỗi tải: '+Art.failed.join(', '):'Bộ ảnh được lưu trong game'}`));
    body.appendChild(tabs(['Chung','Chủ đề màu','Hiệu ứng'],setTab,i=>{setTab=i;refreshSheet()}));
    const sw=(label,get,set)=>{const r=el('div','setrow',`<span>${label}</span><div class="sw ${get()?'on':''}"></div>`);r.onclick=()=>{set(!get());refreshSheet()};body.appendChild(r)};
    if(setTab===0){
      sw('🔊 Âm thanh',()=>S.fx.sound,v=>S.fx.sound=v);
      sw('🌙 Chế độ tối',()=>S.night,()=>toggleNight());
      sw('⛶ Toàn màn hình',()=>!!document.fullscreenElement,()=>{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen({navigationUI:'hide'}).catch(()=>toast('Trình duyệt không hỗ trợ'))});
      const b=el('button','btn-big','🗑 Xóa dữ liệu & chơi lại');b.style.cssText+='background:linear-gradient(#e9695a,#c0392b);box-shadow:0 5px 0 #8a2418;margin-top:20px';b.onclick=()=>{if(confirm('Xóa toàn bộ tiến trình?')){localStorage.removeItem(SAVE_KEY);location.reload()}};body.appendChild(b);
    }else if(setTab===1){
      body.appendChild(el('div','lbl','Chọn chủ đề màu giao diện'));
      const g=el('div','themes');THEMES.forEach(([id,n,c])=>{const b=el('button','theme-chip'+(S.theme===id?' on':''),n);b.style.background=c;b.onclick=()=>{setTheme(id);refreshSheet();beep('pop')};g.appendChild(b)});body.appendChild(g);
    }else{
      body.appendChild(el('div','lbl','Thời tiết & hiệu ứng nền'));
      const s=el('div','seg');[['none','Trong lành'],['rain','Mưa'],['petal','Hoa rơi'],['leaf','Lá rơi'],['firefly','Đom đóm']].forEach(([k,n])=>{const b=el('button',S.fx.weather===k?'on':'',n);b.onclick=()=>{S.fx.weather=k;Scene.parts=[];refreshSheet()};s.appendChild(b)});body.appendChild(s);
      sw('✨ Hạt hiệu ứng',()=>S.fx.particles,v=>S.fx.particles=v);
      sw('🌿 Cây đung đưa theo gió',()=>S.fx.wind!==false,v=>S.fx.wind=v);
      sw('Chuyển động nhẹ',()=>!!S.fx.reduceMotion,v=>S.fx.reduceMotion=v);
      sw('🌑 Bóng đổ & mây',()=>S.fx.shadow,v=>S.fx.shadow=v);
      sw('🖼 Độ nét cao',()=>S.fx.hq,v=>{S.fx.hq=v;Scene.resize()});
    }
  },'72%');
}

/* ===== Đổi quê ===== */
function changeProvince(){closeSheet();$('#hud').classList.add('hidden');fadeTo(()=>showMapScreen(true))}

/* ===== Màn hình tải ===== */
function runLoader(done){
  Art.promise.then(()=>{

  if(Art.failed.length)toast('Một số bộ ảnh chưa tải được: '+Art.failed.join(', '));
  const msgs=['Đang dọn vườn, chờ chút nhé…','Đang gieo hạt…','Đang dắt trâu ra đồng…','Sắp xong rồi…'];
  let p=0;const iv=setInterval(()=>{
    p=Math.min(100,p+rnd(4,11));$('#load-bar').style.width=p+'%';$('#load-pct').textContent=`Đang tải ${Math.floor(p)}%`;$('#load-msg').textContent=msgs[Math.min(3,Math.floor(p/26))];
    if(p>=100){clearInterval(iv);setTimeout(()=>{const s=$('#screen-load');s.classList.add('out');setTimeout(()=>s.remove(),500);done()},350)}
  },120);
  });
}

/* ===== Màn hình chọn tỉnh (bản đồ Việt Nam) ===== */
let mapState=null;
function showMapScreen(change){
  const scr=$('#screen-map');scr.classList.remove('hidden','out');
  const SC=34,PW=330,PH=620,proj=(lon,lat)=>[(lon-101.5)*SC+10,(23.8-lat)*SC+10];
  const outline=VN_OUTLINE.map(([a,b])=>proj(a,b).join(',')).join(' ');
  let sel=null;
  const marks=PROVINCES.map(p=>{const[x,y]=proj(p[1],p[2]);const col=p[3]==='Bắc'?'#6fae4e':p[3]==='Trung'?'#e5b45a':'#d98f4a';return`<g class="pv" data-n="${p[0]}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="7" fill="${col}" stroke="#fff" stroke-width="1.5"/><text x="${x+9}" y="${y+4}" font-size="10" font-weight="800" fill="#fff" stroke="#16384f" stroke-width="2.5" paint-order="stroke" font-family="Baloo 2">${p[0]}</text></g>`}).join('');
  scr.innerHTML=`<div id="mapSvgWrap"><svg id="mapSvg" width="${PW*1.4}" height="${PH*1.4}" viewBox="0 0 ${PW} ${PH}">
   <defs><pattern id="gr" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="rgba(255,255,255,.07)"/></pattern><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f7ba3"/><stop offset="1" stop-color="#1d5478"/></linearGradient></defs>
   <rect x="-600" y="-600" width="2000" height="2400" fill="url(#sea)"/><rect x="-600" y="-600" width="2000" height="2400" fill="url(#gr)"/>
   <polygon points="${outline}" fill="#9cd06e" stroke="#e9f7c8" stroke-width="4" stroke-linejoin="round" opacity=".5" transform="translate(0 0)"/>
   <polygon points="${outline}" fill="#8fc462" stroke="#4f8a3a" stroke-width="2" stroke-linejoin="round"/>
   <g fill="#ffd45e" stroke="#fff" stroke-width="1"><circle cx="${proj(112,16.5)[0]}" cy="${proj(112,16.5)[1]}" r="3"/><circle cx="${proj(114,10)[0]}" cy="${proj(114,10)[1]}" r="3"/></g>
   <text x="${proj(111,17.5)[0]}" y="${proj(111,17.5)[1]}" font-size="9" fill="#fff" font-weight="800" font-family="Baloo 2" stroke="#16384f" stroke-width="2" paint-order="stroke">QĐ. Hoàng Sa</text>
   <text x="${proj(112.5,11)[0]}" y="${proj(112.5,11)[1]}" font-size="9" fill="#fff" font-weight="800" font-family="Baloo 2" stroke="#16384f" stroke-width="2" paint-order="stroke">QĐ. Trường Sa</text>
   <text x="${proj(107.8,19.5)[0]}" y="${proj(107.8,19.5)[1]}" font-size="10" fill="#cfe8f7" font-style="italic" font-family="Baloo 2">Biển Đông</text>
   ${marks}</svg></div>
   <div class="map-top"><div>${change?'<button class="pill" id="mback">‹ Quay lại</button>':'<button class="pill" id="mback">‹ Đăng nhập</button>'}</div><div class="pill" style="pointer-events:none">Chọn quê</div><div><button class="rbtn" id="mz1">+</button><button class="rbtn" id="mz2">−</button><button class="rbtn" id="mz3">⛶</button></div></div>
   <div class="map-sheet" id="msheet"><div class="grab"></div><div class="card"><div class="sel-info" id="msel">Chạm vào một tỉnh trên bản đồ, hoặc tìm tên tỉnh ở danh sách bên dưới.</div><button class="btn-big" id="mgo" disabled>Chọn một tỉnh</button></div><input class="search" id="msearch" placeholder="Tìm tỉnh… (vd: Đà Nẵng, Bình Dương)"><div class="plist" id="plist"></div></div>`;
  const svg=$('#mapSvg',scr),T={x:(innerWidth-PW*1.4)/2+20,y:30,z:1};
  const apply=()=>svg.style.transform=`translate(${T.x}px,${T.y}px) scale(${T.z})`;apply();
  const zoom=(f,cx=innerWidth/2,cy=innerHeight/3)=>{const nz=clamp(T.z*f,.6,4),k=nz/T.z;T.x=cx-(cx-T.x)*k;T.y=cy-(cy-T.y)*k;T.z=nz;apply()};
  $('#mz1',scr).onclick=()=>zoom(1.4);$('#mz2',scr).onclick=()=>zoom(.7);$('#mz3',scr).onclick=()=>{T.x=(innerWidth-PW*1.4)/2+20;T.y=30;T.z=1;apply()};
  const wrap=$('#mapSvgWrap',scr);let drag=null,pts=new Map(),pd=0,mv=0;
  wrap.onpointerdown=e=>{wrap.setPointerCapture(e.pointerId);pts.set(e.pointerId,[e.clientX,e.clientY]);mv=0;if(pts.size===2){const[a,b]=[...pts.values()];pd=Math.hypot(a[0]-b[0],a[1]-b[1])}};
  wrap.onpointermove=e=>{const p=pts.get(e.pointerId);if(!p)return;
    if(pts.size===1){const dx=e.clientX-p[0],dy=e.clientY-p[1];mv+=Math.abs(dx)+Math.abs(dy);T.x+=dx;T.y+=dy;apply()}
    else{pts.set(e.pointerId,[e.clientX,e.clientY]);const[a,b]=[...pts.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pd)zoom(d/pd,(a[0]+b[0])/2,(a[1]+b[1])/2);pd=d;mv=99;return}
    pts.set(e.pointerId,[e.clientX,e.clientY])};
  wrap.onpointerup=wrap.onpointercancel=e=>{pts.delete(e.pointerId);if(pts.size<2)pd=0;if(mv<8){const g=e.target.closest&&e.target.closest('.pv');if(g)choose(g.dataset.n)}};
  wrap.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1.15:.87,e.clientX,e.clientY)},{passive:false});
  const choose=n=>{sel=n;$('#msel',scr).innerHTML=`📍 <b>${n}</b> — quê hương của bạn?`;const g=$('#mgo',scr);g.disabled=false;g.textContent=`Chọn ${n}`;
    scr.querySelectorAll('.pv circle').forEach(c=>{const on=c.parentNode.dataset.n===n;c.setAttribute('r',on?11:7);c.setAttribute('fill',on?'#ff5a4a':c.getAttribute('fill'))});
    const p=PROVINCES.find(x=>x[0]===n),[x,y]=proj(p[1],p[2]);T.z=Math.max(T.z,1.8);T.x=innerWidth/2-x*1.4*T.z;T.y=innerHeight*.28-y*1.4*T.z;svg.style.transition='transform .5s';apply();setTimeout(()=>svg.style.transition='',520);renderList();beep('pop')};
  const renderList=()=>{const q=$('#msearch',scr).value.trim().toLowerCase(),L=$('#plist',scr);L.innerHTML='';
    ['Bắc','Trung','Nam'].forEach(r=>{const items=PROVINCES.filter(p=>p[3]===r&&p[0].toLowerCase().includes(q));if(!items.length)return;L.appendChild(el('div','reg',r));const g=el('div','pgrid');
      items.forEach(p=>{const h=hashN(p[0]),it=el('button','pitem'+(sel===p[0]?' sel':''),`${p[0]} ${h%3===0?'⭐':''}<small>${h%20}/20 đang gom</small>`);it.onclick=()=>choose(p[0]);g.appendChild(it)});L.appendChild(g)})};
  renderList();$('#msearch',scr).oninput=renderList;
  $('#msearch',scr).onfocus=()=>$('#msheet',scr).classList.add('big');
  $('#mgo',scr).onclick=()=>{if(!sel)return;S.province=sel;if(!S.joined)S.joined=ri(40,300);save();enterFarm(true)};
  $('#mback',scr).onclick=()=>{if(change&&S.province)enterFarm(false);else toast('Chào mừng bạn đến Xóm Nông Trại! 🌾')};
}
function enterFarm(welcome){
  fadeTo(()=>{
    $('#screen-map').classList.add('hidden');$('#hud').classList.remove('hidden');
    refreshHud();Scene.syncAnimals();
    if(welcome){
      const r=S.province;
      setTimeout(()=>{modal(`<div class="mribbon">Chào đồng hương ${r}!</div>
      <svg class="illu" viewBox="0 0 300 150" width="100%"><defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd3f2"/><stop offset="1" stop-color="#e6f5d8"/></linearGradient></defs><rect width="300" height="150" fill="url(#sk)"/><ellipse cx="60" cy="30" rx="30" ry="10" fill="#fff"/><ellipse cx="230" cy="40" rx="34" ry="11" fill="#fff"/><path d="M0 80 Q60 40 120 75 T300 70 V150 H0z" fill="#6eae4e"/><path d="M0 105 Q100 80 150 110 T300 100 V150 H0z" fill="#4f9a3e"/><path d="M140 150 Q150 120 150 100 Q170 90 190 80" stroke="#d9b46a" stroke-width="14" fill="none"/><rect x="120" y="68" width="14" height="42" fill="#b8402e"/><rect x="170" y="68" width="14" height="42" fill="#b8402e"/><path d="M110 70 L152 46 L194 70z" fill="#c95a3a"/><rect x="132" y="66" width="40" height="8" fill="#a8362a"/></svg>
      <p>Bạn là người chơi thứ ${S.joined+1} của tỉnh.<br>Mỗi người tính như nhau, nên tỉnh ít người vẫn đua ngang tỉnh đông người.</p>
      <div class="box"><b>${r} mùa này</b>${ri(2,9)}/20 người chơi · chưa xếp hạng</div>
      <ol><li>Chơi như thường: thu hoạch, giao đơn, giúp bạn.</li><li>Đạt Lv6 để được tính vào bình quân tỉnh.</li><li>Xem hạng tỉnh ở Mùa vụ Pass, tab Đua tỉnh.</li></ol>
      <button class="btn-big" id="mv">Vào vườn</button>`);$('#mv').onclick=()=>{closeModal();Scene.burst(Scene.w/2,Scene.h/2,'🌾',12);beep('win')}},600);
    }
    save();
  });
}

/* ===== Câu cá ===== */
let FS=null;
function openFishing(){
  closeSheet();hidePop();fadeTo(()=>{
    const scr=$('#screen-fish');scr.classList.remove('hidden');
    scr.innerHTML=`<canvas id="fishCv"></canvas>
    <div class="fish-top"><div class="fish-card" style="flex:1;margin:0"><span>🎣 Câu cá bên sông</span><span id="fstat" style="font-size:15px"></span></div></div>
    <div class="fish-nav"><button class="fbtn" id="fshop">Cửa hàng</button><button class="fbtn" id="fexit">Xong</button></div>
    <div class="fish-gear" style="margin-top:8px"><div class="gear" id="grod"></div><div class="gear" id="gbait"></div><div class="gear" id="gcatch"></div></div>
    <div class="fish-panel"><div class="moods"><div data-m="0">Mệt</div><div data-m="1">Quẩy</div><div data-m="2">Sắp lao</div><div data-m="3">Lao</div></div><div class="alert calm" id="falert">Chạm “Thả câu” để bắt đầu</div><div class="tension"><i id="ften"></i></div><div class="row" style="justify-content:space-between;font-size:13px;color:#8a6a3a"><span>An toàn</span><span>Căng</span><span>Nguy hiểm</span></div><div class="prog" style="margin:8px 0"><i id="fprog" style="width:0"></i></div><button class="hold" id="fhold">THẢ CÂU</button><div style="text-align:center;font-size:14px;color:#8a6a3a;margin-top:6px" id="fhint">Giữ nút để kéo, thả khi cá quẩy mạnh.</div></div>`;
    const cv=$('#fishCv'),ctx=cv.getContext('2d');cv.width=innerWidth*Math.min(devicePixelRatio,2);cv.height=innerHeight*Math.min(devicePixelRatio,2);
    FS={cv,ctx,state:'idle',t:0,wait:0,fish:null,tension:0,prog:0,reel:false,mood:0,moodT:0,bob:{x:.3,y:.5},lim:0,raf:0,last:performance.now(),shake:0};
    $('#fexit').onclick=closeFishing;$('#fshop').onclick=()=>{closeFishing();setTimeout(()=>openShop(4),520)};
    const hold=$('#fhold');
    const dn=e=>{e.preventDefault();hold.classList.add('on');if(FS.state==='idle')return cast();if(FS.state==='fight'||FS.state==='bite'){FS.reel=true;if(FS.state==='bite')startFight()}};
    const upf=()=>{hold.classList.remove('on');FS.reel=false};
    hold.addEventListener('pointerdown',dn);hold.addEventListener('pointerup',upf);hold.addEventListener('pointerleave',upf);hold.addEventListener('pointercancel',upf);
    fishGear();fishLoop();
  });
}
function closeFishing(){if(!FS)return;cancelAnimationFrame(FS.raf);FS=null;fadeTo(()=>{$('#screen-fish').classList.add('hidden');$('#screen-fish').innerHTML='';refreshHud()})}
function fishGear(){
  const rod=RODS.find(r=>r.id===S.fish.rod),b=BAITS.slice().reverse().find(b=>(S.fish.baits[b.id]||0)>0);
  $('#grod').textContent=`${rod.e} ${rod.n}`;$('#gbait').textContent=b?`${b.e} ${b.n} ×${S.fish.baits[b.id]}`:'Hết mồi!';$('#gcatch').textContent=`🐟 Đã câu: ${S.fish.caught}`;$('#fstat').textContent=`🪙 ${fmt(S.coins)}`;
}
function cast(){
  const b=BAITS.slice().reverse().find(b=>(S.fish.baits[b.id]||0)>0);
  if(!b){toast('Hết mồi! Hãy mua thêm ở cửa hàng.');return beep('err')}
  if(invTotal()>=S.cap){toast('Kho đầy!');return beep('err')}
  S.fish.baits[b.id]--;FS.bait=b;FS.state='wait';FS.castAt=FS.t;FS.wait=rnd(1.8,4.2);FS.bob={x:rnd(.15,.38),y:rnd(.4,.6)};
  $('#falert').className='alert calm';$('#falert').textContent='Đang chờ cá cắn…';$('#fhold').textContent='ĐANG CHỜ…';fishGear();beep('tap');
}
function pickFish(){
  const rare=FS.bait.rare;let tot=0;const ws=Object.entries(FISHES).map(([k,f])=>{const w=f.w*(f.sell>60?1+rare*5:1);tot+=w;return[k,w]});
  let r=Math.random()*tot;for(const[k,w]of ws){if((r-=w)<=0)return k}return'caro';
}
function startFight(){FS.state='fight';FS.tension=25;FS.prog=12;FS.mood=0;FS.moodT=2;FS.lim=38;$('#fhold').textContent='GIỮ ĐỂ KÉO'}
function fishUpdate(dt){
  const F=FS;F.t+=dt;const rod=RODS.find(r=>r.id===S.fish.rod);
  if(F.state==='wait'){F.wait-=dt;if(F.wait<=0){F.state='bite';F.fishId=pickFish();F.bt=4;$('#falert').className='alert';$('#falert').textContent='CÁ CẮN CÂU! KÉO NGAY!';$('#fhold').textContent='GIỮ ĐỂ KÉO';beep('win');F.shake=.4}}
  else if(F.state==='bite'){F.bt-=dt;if(F.bt<=0){F.state='idle';$('#falert').className='alert calm';$('#falert').textContent='Cá chạy mất rồi…';$('#fhold').textContent='THẢ CÂU'}}
  else if(F.state==='fight'){
    const fish=FISHES[F.fishId];F.lim-=dt;F.moodT-=dt;
    if(F.moodT<=0){F.mood=(F.mood+1+(Math.random()<.3?1:0))%4;F.moodT=F.mood===3?rnd(1,1.7):rnd(1.2,2.4)}
    const rate=[16,38,62,115][F.mood]*fish.str/rod.pow;
    if(F.reel){F.tension+=rate*dt;if(F.mood<2)F.prog+=(13*rod.pow/fish.str)*dt}
    else{F.tension-=36*dt;F.prog-=2.5*dt}
    F.tension=clamp(F.tension,0,100);F.prog=clamp(F.prog,0,100);
    const al=$('#falert');
    const labels=['Cá đã mệt — kéo đi!','Cá quẩy mạnh — cẩn thận!','Sắp lao — chuẩn bị nhả!','LAO! NHẢ NGAY!'];al.textContent=labels[F.mood];al.className='alert'+(F.mood<2?' calm':'');
    $('#fhold').textContent=F.mood>=2?'NHẢ ĐỂ CHÙNG':'GIỮ ĐỂ KÉO';
    document.querySelectorAll('.moods div').forEach((d,i)=>d.classList.toggle('on',i===F.mood));
    $('#ften').style.left=`calc(${F.tension}% - 3px)`;$('#fprog').style.width=F.prog+'%';
    if(F.tension>=100)return endFight(false,'Dây bị đứt! Mất cá rồi.');
    if(F.prog>=100)return endFight(true);
    if(F.lim<=0)return endFight(false,'Cá đã thoát khỏi lưỡi câu.');
  }
}
function endFight(win,msg){
  const F=FS;F.state='idle';F.reel=false;$('#fhold').classList.remove('on');document.querySelectorAll('.moods div').forEach(d=>d.classList.remove('on'));$('#fhold').textContent='THẢ CÂU';
  if(win){const f=FISHES[F.fishId];let price=f.sell;if(S.fish.tools.luoi)price=Math.round(price*1.1);
    addItem(F.fishId,1);S.fish.seen[F.fishId]=(S.fish.seen[F.fishId]||0)+1;S.fish.caught++;track('fish');addXp(10+Math.round(f.sell/8));
    $('#falert').className='alert calm';$('#falert').textContent=`Bắt được ${f.e} ${f.n}! (bán ~🪙${price})`;beep('win');F.catchE=f.e;F.catchT=1.6;F.prog=0;F.tension=0;
  }else{$('#falert').className='alert';$('#falert').textContent=msg;beep('err');F.shake=.4;document.getElementById('fishCv').parentNode.classList.add('shake');setTimeout(()=>FS&&document.getElementById('fishCv').parentNode.classList.remove('shake'),300)}
  fishGear();
}
function fishLoop(){
  const F=FS;if(!F)return;const n=performance.now(),dt=Math.min(.05,(n-F.last)/1000);F.last=n;
  fishUpdate(dt);if(!FS)return;fishDraw(dt);F.raf=requestAnimationFrame(fishLoop);
}
function fishDraw(dt){
  const F=FS,c=F.ctx,dpr=F.cv.width/innerWidth,W=innerWidth,H=innerHeight,t=F.t;c.setTransform(dpr,0,0,dpr,0,0);
  const shore=W*.52;
  // nước
  const g=c.createLinearGradient(0,0,shore,H);g.addColorStop(0,'#1f8a9a');g.addColorStop(1,'#145f7a');c.fillStyle=g;c.fillRect(0,0,W,H);
  c.strokeStyle='rgba(255,255,255,.22)';c.lineWidth=2;
  for(let k=0;k<26;k++){const y=(k*53+t*18)%(H+40)-20,x=(k*97)%shore;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+20,y-8,x+40,y);c.quadraticCurveTo(x+60,y+8,x+80,y);c.stroke()}
  // bờ
  c.fillStyle='#5fb04a';c.beginPath();c.moveTo(shore,0);for(let y=0;y<=H;y+=20)c.lineTo(shore+Math.sin(y*.05)*10,y);c.lineTo(W,H);c.lineTo(W,0);c.fill();
  c.fillStyle='#c9a46a';c.beginPath();c.moveTo(shore-8,0);for(let y=0;y<=H;y+=20)c.lineTo(shore+Math.sin(y*.05)*10-8,y);for(let y=H;y>=0;y-=20)c.lineTo(shore+Math.sin(y*.05)*10+6,y);c.fill();
  c.font='26px serif';c.textAlign='center';for(let k=0;k<14;k++){const x=shore+30+(k*71)%(W-shore-40),y=(k*131)%H;Art.text(c,k%3?'🌼':'🌿',x,y+(k%2?10:0))}
  c.font='40px serif';Art.text(c,'🪴',W-50,H*.2);Art.text(c,'🌾',W-30,H*.55);
  // cò
  c.font='40px serif';const bx=((t*30)%(shore+100))-50;Art.text(c,'🦢',bx,H*.28+Math.sin(t)*6);
  // người câu
  const px=shore+50,py=H*.43;
  const animatedFishing=S.av.art!==false&&Motion.has('farmer'+(S.av.style??Math.max(0,OUTFITS.indexOf(S.av.outfit)))+'-fish');
  Motion.foliage(c,'reeds',shore+15,H*.75,55,90,t);Art.draw(c,'lotus',shore*.4,H*.7+Math.sin(t)*3,72,45);Art.draw(c,'boat',shore*.35,H*.15,110,65);if(!animatedFishing)Art.draw(c,'rod-'+S.fish.rod,px-18,py-36,85,110,1);
  drawAvatar(c,px,py+40,120,S.av,{t,face:-1,fishing:true,fishState:F.state,castAt:F.castAt,reel:F.reel,caught:F.catchT>0,work:F.state==='fight'&&F.reel});
  // dây & phao
  const bobX=W*F.bob.x,bobY=H*F.bob.y+Math.sin(t*3)*(F.state==='bite'?9:F.state==='wait'?2:0);
  if(F.state!=='idle'||F.catchT>0){
    c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=2;c.beginPath();c.moveTo(px-20,py-30);c.quadraticCurveTo((px+bobX)/2,py-90,bobX,bobY);c.stroke();
    c.fillStyle='#e43a2a';c.beginPath();c.arc(bobX,bobY,8,0,6.283);c.fill();c.fillStyle='#fff';c.fillRect(bobX-8,bobY-1,16,3);Art.draw(c,'bobber',bobX,bobY,22,30);
    if(F.state==='bite'||F.state==='fight'){c.strokeStyle='rgba(255,255,255,.7)';for(let k=0;k<3;k++){const r=((t*1.5+k/3)%1)*30;c.globalAlpha=1-r/30;c.beginPath();c.arc(bobX,bobY+6,r,0,6.283);c.stroke()}c.globalAlpha=1;Motion.draw(c,'motion-ripple',(t*.9)%1,bobX,bobY+10,54);
      c.fillStyle='rgba(10,40,60,.5)';c.beginPath();c.ellipse(bobX+Math.sin(t*(F.mood+2))*20,bobY+22,26,10,0,0,6.283);c.fill()}
    // cần
    if(!animatedFishing){c.strokeStyle='#8a5a2b';c.lineWidth=4;c.beginPath();c.moveTo(px-6,py);c.quadraticCurveTo(px-60,py-80,px-20,py-30-(F.reel?6:0));c.stroke()}
  }
  if(F.catchT>0){F.catchT-=dt;c.font=`${70+Math.sin(t*10)*4}px serif`;c.globalAlpha=Math.min(1,F.catchT);Art.text(c,F.catchE,W*.4,H*.3-(1.6-F.catchT)*60);c.globalAlpha=1}
}

/* ===== Khởi động ===== */
(function boot(){
  load();
  const ref=new URLSearchParams(location.search).get('ref');
  if(ref&&!S.refUsed){S.refUsed=ref;S.mail.unshift({id:Date.now(),t:'Bạn được mời!',d:'Cảm ơn bạn đã vào xóm theo lời mời của bạn bè.',c:300,g:5,got:false})}
  document.body.classList.toggle('dark',!!S.night);setTheme(S.theme);
  Scene.init();buildHud();Art.observe();
  // tiến độ vắng mặt: thông báo
  runLoader(()=>{
    if(S.province){$('#hud').classList.remove('hidden');refreshHud();const away=Date.now()-S.ts;if(away>60000)toast('🌾 Chào mừng trở lại! Nông sản của bạn đã lớn lên.')}
    else showMapScreen(false);
  });
  window.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSheet();cancelDecorPlacement()}});
})();
