'use strict';
/* ===== Tiện ích UI ===== */
function toast(msg){const t=el('div','toast',msg);$('#layer-toast').appendChild(t);setTimeout(()=>t.remove(),2700)}
const today=()=>new Date().toISOString().slice(0,10);
let sheetRefresh=null,sheetKey=null;
function closeSheet(){
  const L=$('#layer-sheet');const sh=$('.sheet',L),bd=$('.backdrop',L);
  if(!sh)return;sh.classList.remove('on');bd&&bd.classList.remove('on');sheetRefresh=null;sheetKey=null;
  if(typeof Fishing!=='undefined')Fishing.sheetClosed();
  setTimeout(()=>{if(!sheetKey)L.innerHTML=''},380);
}
/* mở bảng trượt từ dưới: render(body) được gọi lại mỗi lần refreshSheet() */
function openSheet(key,title,render,h){
  hidePop();
  if(typeof FS!=='undefined'&&FS){FS.paused=true;FS.reel=false;Haptics.stop();Fishing.stopAudio();$('#fpause')?.classList.add('hidden')}
  const L=$('#layer-sheet');L.innerHTML='';sheetKey=key;sheetRefresh=render;
  const bd=el('div','backdrop');bd.onclick=closeSheet;
  const sh=el('div','sheet');sh.dataset.sheet=key;if(h)sh.style.setProperty('--h',h);
  sh.innerHTML=`<div class="ribbon">${title}</div><button class="x">✕</button><div class="body"></div>`;
  $('.x',sh).onclick=closeSheet;
  L.append(bd,sh);render($('.body',sh));
  requestAnimationFrame(()=>requestAnimationFrame(()=>{bd.classList.add('on');sh.classList.add('on')}));
  beep('pop');
}
function refreshSheet(){const b=$('.sheet .body');if(b&&sheetRefresh){const st=b.scrollTop,strip=$('.tabs',b),active=strip?.querySelector('.on')?.dataset.tab,scroll=strip?.scrollLeft||0;b.innerHTML='';sheetRefresh(b);const next=$('.tabs',b),changed=active!==next?.querySelector('.on')?.dataset.tab;b.scrollTop=changed?0:st;if(next&&!changed)next.scrollLeft=scroll}}
function tabs(list,cur,cb){const t=el('div','tabs');t.setAttribute('role','tablist');list.forEach((n,i)=>{const b=el('button',i===cur?'on':'',n);b.type='button';b.dataset.tab=i;b.setAttribute('role','tab');b.setAttribute('aria-selected',String(i===cur));b.tabIndex=i===cur?0:-1;b.onclick=()=>cb(i);b.onkeydown=event=>{let next;if(event.key==='ArrowRight')next=(i+1)%list.length;if(event.key==='ArrowLeft')next=(i-1+list.length)%list.length;if(next!==undefined){event.preventDefault();cb(next);requestAnimationFrame(()=>$('.tabs button.on')?.focus({preventScroll:true}))}};t.appendChild(b)});if(typeof Art!=='undefined')Art.enhance(t);const reveal=()=>{if(!t.isConnected)return;const active=t.querySelector('.on');if(active){const a=active.getBoundingClientRect(),r=t.getBoundingClientRect();if(a.left<r.left+4||a.right>r.right-4)t.scrollLeft+=a.left-r.left-(r.width-a.width)/2}};requestAnimationFrame(()=>{reveal();requestAnimationFrame(reveal)});return t}
function modal(html,cls=''){const m=$('#modal');m.innerHTML=`<div class="mcard ${cls}">${html}</div>`;m.classList.remove('hidden');return $('.mcard',m)}
function closeModal(){$('#modal').classList.add('hidden')}
function fadeTo(fn){const f=$('#fade');f.classList.add('on');setTimeout(()=>{fn();f.classList.remove('on')},480)}
function itemE(id){return ITEMS[id]?Art.icon(ITEMS[id].art||id,ITEMS[id].n):'❓'}
function setTheme(id){for(const name of [...document.body.classList])if(name.startsWith('theme-'))document.body.classList.remove(name);document.body.classList.add('theme-'+id);document.body.classList.toggle('dark',!!S.night);S.theme=id}

/* ===== HUD ===== */
function buildHud(){
  const h=$('#hud');
  h.innerHTML=`
  <div class="hud-top">
    <div class="res" id="r-coin"><span class="ic">🪙</span><span id="v-coin"></span></div>
    <div class="res" id="r-gem"><span class="ic">💎</span><span id="v-gem"></span></div>
    <div class="res" id="r-inv" style="cursor:pointer"><span class="ic">🏺</span><span><b id="v-inv"></b><small id="v-cap"></small></span></div>
  </div><div class="hud-actions">
    <button class="cbtn" id="b-day" title="Sáng/Tối"></button>
    <button class="cbtn" id="b-mail">✉️<i class="dot" id="d-mail"></i></button>
    <button class="cbtn" id="b-settings" title="Cài đặt" aria-label="Cài đặt">⚙️</button>
  </div>
  <div class="prof">
    <div class="avatar-ring" id="b-avatar"><canvas id="av-hud" width="140" height="140"></canvas></div>
    <div class="lvbadge" id="v-lv">1</div>
    <div class="prof-info"><div class="xpbar"><i id="xp-i"></i><span id="v-xp"></span></div><div class="loc">📍 <span id="v-loc"></span></div></div>
  </div>
  <div class="side side-events">
    <button class="sbtn" data-a="event"><div class="ico">🪷</div>Sự kiện</button>
    <button class="sbtn" data-a="season"><div class="ico">📗</div>Mùa vụ</button>
    <button class="sbtn" data-a="checkin"><div class="ico">📅<i class="dot on" id="d-ci"></i></div>Điểm danh</button>
  </div>
  <div class="side side-social">
    <button class="sbtn" data-a="friends"><div class="ico">🧺</div>Bạn bè</button>
    <button class="sbtn new" data-a="bag"><div class="ico">🎒</div>Túi</button>
    <button class="sbtn" data-a="orders"><div class="ico">📋<i class="dot num on" id="d-ord"></i></div>Đơn hàng</button>
    <button class="sbtn" data-a="invite"><div class="ico">💌</div>Mời bạn</button>
  </div>
  <button class="cbtn" id="b-harv" style="position:absolute;left:12px;top:calc(46vh);width:56px;height:56px;font-size:30px" title="Thu hoạch nhanh">🌾</button>
  <div class="zoomctl"><button class="cbtn" id="b-zin">＋</button><button class="cbtn" id="b-zout">－</button></div>
  <div class="bl">
    <div class="bl-row"><button class="cbtn" id="b-menu" title="Menu">⊞<i class="dot on"></i></button><button class="cbtn" id="b-fish" title="Câu cá">🎣</button><button class="cbtn" id="b-world" title="Bản đồ nông trại">🗺️</button></div>
    <div class="quest"><div class="qa">👴</div><div class="qbox" id="qbox"></div></div>
    <div class="chat" id="chat"></div>
  </div>
  <button class="shopbtn" id="b-shop"><div class="ico">🏪</div><span>Cửa hàng</span></button>`;
  h.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>({event:openEvents,season:openSeason,checkin:openCheckin,friends:()=>openFriends(0),bag:openBag,orders:openOrders,invite:openInvite})[b.dataset.a]());
  $('#b-day').onclick=toggleNight;$('#b-mail').onclick=openMail;
  $('#b-avatar').onclick=openProfile;$('#b-shop').onclick=()=>openShop(0);$('#r-inv').onclick=openStorage;
  $('#b-world').onclick=()=>World.open();$('#b-settings').onclick=()=>openSettings(0);
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
  $('#v-inv').textContent=invTotal();$('#v-cap').textContent='/'+fishCapacity();
  $('#v-lv').textContent=S.lv;$('#xp-i').style.width=(S.xp/xpNeed(S.lv)*100)+'%';$('#v-xp').textContent=`${S.xp}/${xpNeed(S.lv)}`;
  $('#v-loc').textContent=S.province||'—';
  const day=$('#b-day');if(day.dataset.night!==String(S.night)){day.innerHTML=S.night?MOON:SUN;day.dataset.night=String(S.night)}
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
  p.style.visibility='hidden';L.appendChild(p);setup&&setup(p);
  const bounds=window.visualViewport,viewW=bounds?.width||innerWidth,viewH=bounds?.height||innerHeight;
  p.style.maxHeight=Math.max(120,viewH-24)+'px';
  const box=p.getBoundingClientRect(),left=clamp(sx-box.width/2,12,Math.max(12,viewW-box.width-12)),top=clamp(sy-box.height-24,12,Math.max(12,viewH-box.height-12));
  p.style.left=left+'px';p.style.top=top+'px';p.style.visibility='';return p;
}
Scene.onTap=(gx,gy,sx,sy)=>{
  if(!$('#hud')||$('#hud').classList.contains('hidden'))return;
  if(decorPlacement){placeDecor(Math.floor(gx)+.5,Math.floor(gy)+.5);return}
  hidePop();beep('tap');
  const hit=Scene.pick(sx,sy);if(hit){if(hit.kind==='plot')return tapPlot(hit.id,sx,sy);if(hit.kind==='building')return tapBuilding(hit.id,sx,sy);if(hit.kind==='decor')return tapDecor(hit.value,sx,sy);if(hit.kind==='village')return Village.open(hit.id==='hotspring'?2:1);if(hit.kind==='fishing')return openFishing();if(hit.kind==='region')return World.visit(World.regions.find(r=>r.id===hit.id));if(hit.kind==='scenery')return}
  const i=Math.floor(gx),j=Math.floor(gy);
  for(let k=0;k<PCOLS*PROWS;k++){const[a,b]=plotXY(k);if(i===a&&j===b)return tapPlot(k,sx,sy)}
  for(const id in BUILDINGS){const[a,b]=BUILDINGS[id].slot;if(gx>=a&&gx<a+2&&gy>=b&&gy<b+2)return tapBuilding(id,sx,sy)}
  if(Village.tap(gx,gy,sx,sy))return;
  if(World.tap(gx,gy,sx,sy))return;
  if(Math.hypot(gx-5,gy-5)<1.3){walkTo(5,6);return openStorage()}
  if(Math.hypot(gx-12,gy-5.9)<1.2){walkTo(11.6,5.2);return openFishing()}
  if(Math.hypot(gx-1.2,gy-9)<1){walkTo(2,9.5);return toast('🪣 Giếng làng: nước trong mát!')}
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
  return FarmCare.quick(k,sx,sy);
}
function upgradePlot(k,sx,sy){
  const pl=S.plots[k];if(pl.lv>=20)return toast('Đất đã đạt cấp tối đa!');if(pl.lv>=5&&S.lv<pl.lv*10)return toast(`Cần cấp ${pl.lv*10} để nâng đất tiếp.`);
  const c=plotUpCost(pl);if(S.coins<c)return toast('Không đủ xu'),beep('err');
  addCoins(-c);pl.lv++;track('upgrade');Scene.burst(sx,sy,'⭐');beep('win');hidePop();toast(`⬆ Đất lên ★${pl.lv}: thu hoạch nhiều hơn & mọc nhanh hơn`);
}
function seedPicker(k,sx,sy){
  const list=Object.entries(CROPS);
  popAt(sx,sy,`<h4>🌱 Gieo hạt</h4><div class="seedgrid">${list.map(([id,c])=>{const own=S.seeds[id]||0,lock=S.lv<c.lv;return`<button data-id="${id}" ${lock?'disabled':''}><span>${Art.icon(Art.has("seed-"+id)?"seed-"+id:(c.art||id),c.n)}</span>${lock?'🔒Cấp '+c.lv:c.n}<br>${lock?'':own?'x'+own:'🪙'+c.seed}</button>`}).join('')}</div><div class="acts" style="margin-top:6px"><button class="cbtn2 blue sm" id="pu">⬆ Đất ★${S.plots[k].lv} 🪙${fmt(plotUpCost(S.plots[k]))}</button></div>`,p=>{
    const search=el('input','seed-search');search.id='seed-find';search.placeholder='Tìm hạt giống…';p.querySelector('.seedgrid').before(search);search.oninput=()=>{const q=search.value.trim().toLocaleLowerCase('vi');p.querySelectorAll('[data-id]').forEach(b=>b.style.display=CROPS[b.dataset.id].n.toLocaleLowerCase('vi').includes(q)?'':'none')};
    p.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>plant(k,b.dataset.id,sx,sy));
    $('#pu',p).onclick=()=>upgradePlot(k,sx,sy);
  });
}
function plant(k,id,sx,sy,quiet){
  const C=CROPS[id];
  if(!C||k<0||k>=S.plotsOpen||S.lv<C.lv||S.plots[k].crop)return false;
  if(S.seeds[id]>0)S.seeds[id]--;else{if(S.coins<C.seed)return toast('Không đủ xu mua hạt'),beep('err');addCoins(-C.seed)}
  const pl=S.plots[k];pl.crop=id;pl.t0=Date.now();pl.durationSec=C.t;pl.care={};pl.bonus=0;S.lastSeed=id;
  if(!quiet){Haptics.pulse('farm');Motion.workPlayer();Scene.burst(sx,sy,'sprout',5);hidePop();beep('tap')}
  save();return true;
}
function harvestPlot(k,sx,sy,quiet){
  if(!S.plots[k]?.crop||cropProg(S.plots[k])<1)return false;
  const pl=S.plots[k],C=CROPS[pl.crop],q=yieldQty(pl);
  if(invTotal()+q>fishCapacity()){toast('Kho đầy! Hãy giao hàng hoặc nâng cấp kho.');beep('err');return false}
  addItem(pl.crop,q);const[i,j]=plotXY(k);
  Motion.workPlayer();Motion.emit('harvest',i+.5,j+.5,64,.9);Motion.emit('sparkle',i+.5,j+.5,46,.7,25);Scene.float(i+.5,j+.5,`+${q} ${C.e}`);Scene.burst(sx||Scene.iso(i+.5,j+.5).x,sy||Scene.iso(i+.5,j+.5).y,C.art||pl.crop,5);
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
    const q=bQty(id);if(invTotal()+q>fishCapacity())return toast('Kho đầy!'),beep('err');
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
  const b=S.b[id];if(b.lv>=20)return toast('Đã tối đa cấp');if(b.lv>=5&&S.lv<b.lv*10)return toast(`Cần cấp ${b.lv*10}`);const c=bUpCost(id);
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
    body.appendChild(tabs(['🌱 Hạt giống','🏭 Nhà máy','🐄 Chuồng','📦 Ruộng & kho','🎣 Câu cá','🌳 Cây lâu năm','🏮 Trang trí','🏠 Mô hình','🐔 Vật nuôi','🪣 Vật phẩm','⭐ Cấp 200'],shopTab,i=>{shopTab=i;refreshSheet()}));
    body.append(el('p','shop-progress',`Cấp ${S.lv}/200 · ${Object.keys(CROPS).length} giống cây · Các mục có thể vuốt ngang`));
    if(shopTab>=8){Progression.shop(body,shopTab);return}
    if(shopTab>=5){renderDecorShop(body,shopTab===5?'trees':shopTab===6?'heritage':'models');return}
    const g=el('div','grid3');
    if(shopTab===0)for(const[id,c]of Object.entries(CROPS)){const lock=S.lv<c.lv;const it=el('div','item'+(lock?' lock':''),`${S.seeds[id]?`<span class="badge">${S.seeds[id]}</span>`:''}<div class="em">${Art.icon(c.art||id,c.n)}</div>${c.n}<div class="pr">${lock?`<span class="lockt">🔒 Lv ${c.lv}</span>`:`🪙${c.seed} <small>x5</small>`}</div><small>${fmtT(c.t*1000)} · bán ${c.sell}</small>`);
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
    const search=el('input','shop-search');search.type='search';search.placeholder='Tìm trong danh mục này…';search.oninput=()=>{const q=search.value.toLocaleLowerCase('vi');g.querySelectorAll('.item').forEach(b=>b.hidden=!b.textContent.toLocaleLowerCase('vi').includes(q))};body.append(search,g);
  },'86%');
}
function openStorage(){openShop(3)}

/* ===== Túi ===== */
function openBag(){
  openSheet('bag','Túi',body=>{
    const ids=Object.keys(S.inv);
    body.innerHTML=`<div class="row" style="justify-content:space-between;font-weight:800;margin-bottom:8px"><span>Kho: ${invTotal()}/${fishCapacity()}</span><button class="cbtn2 sm" id="sellall">Bán hết 🪙</button></div><div class="prog" style="margin-bottom:12px"><i style="width:${invTotal()/fishCapacity()*100}%"></i></div>`;
    $('#sellall',body).onclick=()=>{let t=0;for(const id of ids){t+=fishSellPrice(id)*S.inv[id];delete S.inv[id]}if(!t)return toast('Túi trống');addCoins(t);beep('coin');toast(`Đã bán được 🪙${fmt(t)}`);save();refreshSheet()};
    if(!ids.length){body.appendChild(el('div','empty','<div class="em">🎒</div><p>Túi trống. Hãy thu hoạch nông sản nhé!</p>'))}
    const g=el('div','grid3');
    for(const id of ids){const it=el('div','item',`<span class="badge">${S.inv[id]}</span><div class="em">${Art.icon(ITEMS[id].art||id,ITEMS[id].n)}</div>${ITEMS[id].n}<div class="pr">🪙${fishSellPrice(id)}</div>`);
      it.onclick=()=>{S.inv[id]--;if(!S.inv[id])delete S.inv[id];addCoins(fishSellPrice(id));Scene.float(6,8,`+${fishSellPrice(id)}🪙`,'#ffe27a');beep('coin');save();refreshSheet()};g.appendChild(it)}
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
        $('button',d).onclick=function(){this.className='cbtn2 gray sm';this.textContent='Đã gửi';setTimeout(()=>{if(invTotal()+3<=fishCapacity()){addItem(id,3);toast(`${pick(S.friends).n} gửi bạn 3 ${ITEMS[id].e}`);refreshHud();beep('coin')}},2500)};body.appendChild(d)}
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
    const village=el('button','village-entry',`${Art.icon('deco-waterwheel','Làng quê')}<span><b>Nhịp sống làng quê</b><small>Guồng nước · Xưởng chàm · Suối khoáng</small></span><span>›</span>`);village.onclick=openVillage;body.append(village,g);
  },'50%');
}

/* ===== Hồ sơ / cài đặt / avatar ===== */
function openProfile(){
  openSheet('profile','Hồ sơ',body=>{
    body.innerHTML=`<canvas id="pav" class="av-prev" width="340" height="400"></canvas><div style="text-align:center;font-weight:800;font-size:24px">${S.name}</div><div style="text-align:center;font-weight:700">Cấp ${S.lv} · 📍 ${S.province||'—'}</div>
    <div class="grid3" style="margin:14px 0"><div class="item"><div class="em" style="height:40px">🪙</div>${fmt(S.coins)}</div><div class="item"><div class="em" style="height:40px">💎</div>${S.gems}</div><div class="item"><div class="em" style="height:40px">🐟</div>${S.fish.caught} cá</div></div>
    <div class="row profile-actions"><button class="btn-big" id="e1">✏️ Chỉnh nhân vật</button><button class="btn-big" id="e2" style="background:linear-gradient(#f5a43d,#d67410);box-shadow:0 5px 0 #9d520a">⚙️ Cài đặt</button></div>`;
    const x=$('#pav',body).getContext('2d');drawAvatar(x,170,380,330,S.av,{t:0});
    $('#e1',body).onclick=openAvatarEditor;$('#e2',body).onclick=()=>openSettings(0);
  },'84%');
}
function openAvatarEditor(){
  openSheet('avatar','Nhân vật',body=>{
    body.innerHTML='<canvas id="pav" class="av-prev" width="340" height="400"></canvas><p class="avatar-description"></p>';
    const redraw=()=>{const c=$('#pav',body).getContext('2d');c.clearRect(0,0,340,400);Wardrobe.draw(c,170,382,326,S.av,{t:0});$('.avatar-description',body).textContent=Wardrobe.names[S.av.style||0]+' · '+['Nông dân trẻ','Cô gái làm vườn','Nông dân lực điền','Ông lão làng','Nghệ nhân làng','Em bé hiếu động'][S.av.style||0];drawHudAvatar()};
    const choose=(key,value)=>{S.av[key]=value;S.av.art=true;for(const b of body.querySelectorAll('[data-avatar-key="'+key+'"]')){const on=b.dataset.avatarValue===String(value);b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))}save();redraw()};
    const option=(key,value,label,content)=>{const b=el('button',String(S.av[key])===String(value)?'on':'',content||label);b.type='button';b.dataset.avatarKey=key;b.dataset.avatarValue=value;b.title=label;b.setAttribute('aria-label',label);b.setAttribute('aria-pressed',String(String(S.av[key])===String(value)));b.onclick=()=>choose(key,value);return b};
    body.append(el('div','lbl','Chọn nhân vật'));const styles=el('div','avatar-styles');for(let i=0;i<6;i++){const b=option('style',i,Wardrobe.names[i]);b.replaceChildren(Wardrobe.icon({...S.av,style:i}),el('small','',Wardrobe.names[i]));styles.append(b)}body.append(styles);
    const colors=(label,key,values,names)=>{body.append(el('div','lbl',label));const row=el('div','sw-row');values.forEach((color,i)=>{const b=option(key,color,names[i]);b.textContent='';b.classList.add('sw-c');b.style.background=color;row.append(b)});body.append(row)};
    colors('Màu da','skin',SKINS,['Da sáng','Da vàng','Da nâu','Da sẫm']);colors('Màu tóc','hair',HAIRS,['Nâu đen','Nâu hạt dẻ','Nâu đồng','Vàng','Đen']);colors('Màu áo','outfit',OUTFITS,['Xanh lá','Đỏ san hô','Xanh dương','Vàng','Tím','Trắng ngà']);
    const choices=(title,key,values,artPrefix)=>{body.append(el('div','lbl',title));const row=el('div','seg avatar-options');for(const [id,label]of values){const art=artPrefix&&Art.icon(artPrefix+id,label);row.append(option(key,id,label,(art||'')+'<span>'+label+'</span>'))}body.append(row)};
    choices('Kiểu tóc','hairStyle',Wardrobe.hairStyles,'hair-');choices('Kiểu áo','shirtStyle',[['shirt','Áo sơ mi'],['overalls','Quần yếm'],['jacket','Áo khoác']],'shirt-');choices('Mũ','hat',HATS,'hat-');
    body.append(el('div','lbl','Tên'));const input=el('input','search');input.value=S.name;input.maxLength=16;input.oninput=()=>{S.name=input.value||'Nông dân';save()};body.append(input);redraw();
  },'88%');
}


function changeProvince(){closeSheet();$('#hud').classList.add('hidden');fadeTo(()=>showMapScreen(true))}

/* ===== Màn hình tải ===== */
function runLoader(done){
  const screen=$('#screen-load'),bar=$('#load-bar'),pct=$('#load-pct'),msg=$('#load-msg');
  let finished=false,p=8;const start=performance.now();
  const progress=value=>{p=Math.max(p,Math.min(100,value));bar.style.width=p+'%';pct.textContent=`Đang tải ${Math.floor(p)}%`};
  progress(p);msg.textContent='Đang chuẩn bị nông trại…';
  const iv=setInterval(()=>{const elapsed=performance.now()-start;progress(Math.min(92,12+Art.ready*10+elapsed/70));if(elapsed>1200)msg.textContent='Sắp vào vườn, hình ảnh còn lại tải ở nền…'},80);
  const finish=()=>{if(finished)return;finished=true;clearInterval(iv);clearTimeout(deadline);progress(100);msg.textContent='Nông trại đã sẵn sàng!';setTimeout(()=>{screen.classList.add('out');done();setTimeout(()=>{screen.remove();GameAudio.sync()},500)},120)};
  // Enter even on a slow/missing image. All gameplay has a canvas fallback.
  const deadline=setTimeout(finish,3000);
  Promise.resolve(Art.criticalPromise).then(()=>{const minimum=Math.max(0,350-(performance.now()-start));setTimeout(finish,minimum)},finish);
}

/* ===== Màn hình chọn tỉnh (bản đồ Việt Nam) ===== */
let mapState=null;
function showMapScreen(change){
  const scr=$('#screen-map');scr.classList.remove('hidden','out');
  const SC=34,PW=330,PH=620,proj=(lon,lat)=>[(lon-101.5)*SC+10,(23.8-lat)*SC+10];
  const outline=VN_OUTLINE.map(([a,b])=>proj(a,b).join(',')).join(' ');
  let sel=null;
  const marks=PROVINCES.map(p=>{const[x,y]=proj(p[1],p[2]);const col=p[3]==='Bắc'?'#6fae4e':p[3]==='Trung'?'#e5b45a':'#d98f4a';return`<g class="pv" data-n="${p[0]}" role="button" tabindex="0" aria-label="Chọn ${p[0]}" style="cursor:pointer"><circle class="map-hit" cx="${x}" cy="${y}" r="13"/><circle class="map-marker" cx="${x}" cy="${y}" r="5" fill="${col}" data-color="${col}" stroke="#fff" stroke-width="1.5"/><text x="${x+9}" y="${y+4}" font-size="10" font-weight="800" fill="#fff" stroke="#16384f" stroke-width="2.5" paint-order="stroke" font-family="Baloo 2">${p[0]}</text></g>`}).join('');
  scr.innerHTML=`<div id="mapSvgWrap"><svg id="mapSvg" width="${PW*1.4}" height="${PH*1.4}" viewBox="0 0 ${PW} ${PH}">
   <defs><pattern id="relief" width="330" height="620" patternUnits="userSpaceOnUse"><image href="assets/backgrounds/province-relief.png" width="330" height="620" preserveAspectRatio="none"/></pattern><filter id="map-depth" x="-30%" y="-20%" width="160%" height="160%"><feDropShadow dx="-3" dy="5" stdDeviation="3" flood-color="#102f32" flood-opacity=".8"/></filter><pattern id="gr" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="rgba(255,255,255,.07)"/></pattern><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f7ba3"/><stop offset="1" stop-color="#1d5478"/></linearGradient></defs>
   <rect x="-600" y="-600" width="2000" height="2400" fill="url(#sea)"/><rect x="-600" y="-600" width="2000" height="2400" fill="url(#gr)"/>
   <polygon points="${outline}" fill="#9cd06e" stroke="#e9f7c8" stroke-width="4" stroke-linejoin="round" opacity=".5" transform="translate(0 0)"/>
   <polygon points="${outline}" fill="url(#relief)" filter="url(#map-depth)" stroke="#dce7b1" stroke-width="1.5" stroke-linejoin="round"/>
   <g fill="#ffd45e" stroke="#fff" stroke-width="1"><circle cx="${proj(112,16.5)[0]}" cy="${proj(112,16.5)[1]}" r="3"/><circle cx="${proj(114,10)[0]}" cy="${proj(114,10)[1]}" r="3"/></g>
   <text x="${proj(111,17.5)[0]}" y="${proj(111,17.5)[1]}" font-size="9" fill="#fff" font-weight="800" font-family="Baloo 2" stroke="#16384f" stroke-width="2" paint-order="stroke">QĐ. Hoàng Sa</text>
   <text x="${proj(112.5,11)[0]}" y="${proj(112.5,11)[1]}" font-size="9" fill="#fff" font-weight="800" font-family="Baloo 2" stroke="#16384f" stroke-width="2" paint-order="stroke">QĐ. Trường Sa</text>
   <text x="${proj(107.8,19.5)[0]}" y="${proj(107.8,19.5)[1]}" font-size="10" fill="#cfe8f7" font-style="italic" font-family="Baloo 2">Biển Đông</text>
   ${marks}</svg></div>
   <div class="map-top"><div>${change?'<button class="pill" id="mback">‹ Quay lại</button>':'<button class="pill" id="mback">‹ Đăng nhập</button>'}</div><div class="pill" style="pointer-events:none">Chọn quê</div><div><button class="rbtn" id="mz1">+</button><button class="rbtn" id="mz2">−</button><button class="rbtn" id="mz3">⛶</button></div></div>
   <div class="map-sheet" id="msheet"><div class="grab"></div><div class="card"><div class="sel-info" id="msel">Chạm vào một tỉnh trên bản đồ, hoặc tìm tên tỉnh ở danh sách bên dưới.</div><button class="btn-big" id="mgo" disabled>Chọn một tỉnh</button></div><input class="search" id="msearch" placeholder="Tìm tỉnh… (vd: Đà Nẵng, Bình Dương)"><div class="plist" id="plist"></div></div>`;
  const svg=$('#mapSvg',scr),T={x:(innerWidth-PW*1.4)/2+20,y:30,z:1};
  const apply=()=>svg.style.transform=`translate(${T.x}px,${T.y}px) scale(${T.z})`;apply();
  const fit=()=>{const landscape=innerWidth>innerHeight&&innerHeight<600,availableW=landscape?innerWidth-360:innerWidth,availableH=landscape?innerHeight-80:innerHeight*.46;T.z=clamp(Math.min(availableW/(PW*1.4),availableH/(PH*1.4)),.3,1.2);T.x=(availableW-PW*1.4*T.z)/2;T.y=60;apply()};fit();
  mapState={resize:fit};
  const zoom=(f,cx=innerWidth/2,cy=innerHeight/3)=>{const nz=clamp(T.z*f,.25,4),k=nz/T.z;T.x=cx-(cx-T.x)*k;T.y=cy-(cy-T.y)*k;T.z=nz;apply()};
  $('#mz1',scr).onclick=()=>zoom(1.4);$('#mz2',scr).onclick=()=>zoom(.7);$('#mz3',scr).onclick=fit;
  const wrap=$('#mapSvgWrap',scr);let drag=null,pts=new Map(),pd=0,mv=0;
  wrap.onpointerdown=e=>{wrap.setPointerCapture(e.pointerId);pts.set(e.pointerId,[e.clientX,e.clientY]);mv=0;if(pts.size===2){const[a,b]=[...pts.values()];pd=Math.hypot(a[0]-b[0],a[1]-b[1])}};
  wrap.onpointermove=e=>{const p=pts.get(e.pointerId);if(!p)return;
    if(pts.size===1){const dx=e.clientX-p[0],dy=e.clientY-p[1];mv+=Math.abs(dx)+Math.abs(dy);T.x+=dx;T.y+=dy;apply()}
    else{pts.set(e.pointerId,[e.clientX,e.clientY]);const[a,b]=[...pts.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pd)zoom(d/pd,(a[0]+b[0])/2,(a[1]+b[1])/2);pd=d;mv=99;return}
    pts.set(e.pointerId,[e.clientX,e.clientY])};
  wrap.onpointerup=wrap.onpointercancel=e=>{pts.delete(e.pointerId);if(pts.size<2)pd=0;if(e.type==='pointerup'&&mv<8){const g=document.elementFromPoint(e.clientX,e.clientY)?.closest('.pv');if(g)choose(g.dataset.n)}};
  wrap.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1.15:.87,e.clientX,e.clientY)},{passive:false});
  const choose=n=>{sel=n;$('#msel',scr).innerHTML=`📍 <b>${n}</b> — quê hương của bạn?`;const g=$('#mgo',scr);g.disabled=false;g.textContent=`Chọn ${n}`;
    scr.querySelectorAll('.pv .map-marker').forEach(c=>{const on=c.parentNode.dataset.n===n;c.parentNode.classList.toggle('selected',on);c.setAttribute('r',on?8:5);c.setAttribute('fill',on?'#e76148':c.dataset.color)});
    const p=PROVINCES.find(x=>x[0]===n),[x,y]=proj(p[1],p[2]);T.z=Math.max(T.z,1.8);T.x=innerWidth/2-x*1.4*T.z;T.y=innerHeight*.28-y*1.4*T.z;svg.style.transition='transform .5s';apply();setTimeout(()=>svg.style.transition='',520);renderList();beep('pop')};
  const renderList=()=>{const q=$('#msearch',scr).value.trim().toLowerCase(),L=$('#plist',scr);L.innerHTML='';
    ['Bắc','Trung','Nam'].forEach(r=>{const items=PROVINCES.filter(p=>p[3]===r&&p[0].toLowerCase().includes(q));if(!items.length)return;L.appendChild(el('div','reg',r));const g=el('div','pgrid');
      items.forEach(p=>{const it=el('button','pitem'+(sel===p[0]?' sel':''),`${Art.icon('pin',p[0])} ${p[0]}<small>${sel===p[0]?'Đã chọn':'Miền '+r+' · Chạm để chọn'}</small>`);it.onclick=()=>choose(p[0]);g.appendChild(it)});L.appendChild(g)})};
  renderList();$('#msearch',scr).oninput=renderList;
  scr.querySelectorAll('.pv').forEach(g=>g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(g.dataset.n)}});
  $('#msearch',scr).onfocus=()=>$('#msheet',scr).classList.add('big');
  $('#mgo',scr).onclick=()=>{if(!sel)return;S.province=sel;if(!S.joined)S.joined=ri(40,300);save();enterFarm(true)};
  $('#mback',scr).onclick=()=>{if(change&&S.province)enterFarm(false);else toast('Chào mừng bạn đến Xóm Nông Trại! 🌾')};
}
function enterFarm(welcome){
  fadeTo(()=>{
    $('#screen-map').classList.add('hidden');$('#hud').classList.remove('hidden');
    GameAudio.sync();
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

/* ===== Khởi động ===== */
(function boot(){
  load();
  Village.ensure();
  FarmCare.ensure();
  const ref=new URLSearchParams(location.search).get('ref');
  if(ref&&!S.refUsed){S.refUsed=ref;S.mail.unshift({id:Date.now(),t:'Bạn được mời!',d:'Cảm ơn bạn đã vào xóm theo lời mời của bạn bè.',c:300,g:5,got:false})}
  document.body.classList.toggle('dark',!!S.night);setTheme(S.theme);Preferences.apply(false);
  Scene.init();buildHud();Art.observe();
  // tiến độ vắng mặt: thông báo
  runLoader(()=>{
    if(S.province){$('#hud').classList.remove('hidden');refreshHud();const away=Date.now()-S.ts;if(away>60000)toast('🌾 Chào mừng trở lại! Nông sản của bạn đã lớn lên.')}
    else showMapScreen(false);
  });
  window.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSheet();cancelDecorPlacement()}});
  window.addEventListener('resize',()=>{if(!$('#screen-map').classList.contains('hidden'))mapState?.resize()});
  document.addEventListener('click',e=>{if(e.target.closest('button,[role=button],.avatar-ring,.item'))Haptics.pulse('tap')});
})();
