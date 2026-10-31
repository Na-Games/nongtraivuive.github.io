'use strict';
/* Content expansion and persistent, collision-aware placement for orchard and decoration PNGs. */
const DECOR_CATALOG={};
for(const [sheet,entries]of Object.entries(EXPANDED_ART)){
  if(sheet==='crops-extra'||sheet==='botanical'){
    entries.forEach(({id,n},i)=>{const lv=sheet==='crops-extra'?12+i*2:30+i*4;CROPS[id]={n,e:`{${id}}`,lv,t:150+lv*8,sell:90+lv*12,xp:24+lv*3,seed:40+lv*5,col:'#72a346'};ITEMS[id]=CROPS[id]});
  }else entries.forEach(({id,n},i)=>DECOR_CATALOG[id]={id,n,group:sheet.startsWith('trees')?'trees':sheet==='facilities'?'models':'heritage',lv:Math.min(30,2+Math.floor(i/2)),cost:100+i*45,w:sheet.startsWith('trees')?86:sheet==='facilities'?120:76,h:sheet.startsWith('trees')?110:sheet==='facilities'?108:82});
}
const TREE_OUTPUT={'tree-cam':'cam','tree-vai':null,'tree-tao':'tao','tree-xoai':'xoai','tree-caphe':'caphe-qua','tree-thanhlong':'thanhlong','tree-dua':'dua','tree-chuoi':'chuoi','tree-chashan':'che','tree-dau':'dau','tree-taoxanh':'tao','tree-xoaicat':'xoai','tree-duatam':'dua'};
TREE_OUTPUT['tree-dau']=null;
let decorPlacement=null;
function renderDecorShop(body,group){
  body.appendChild(el('p','art-intro',group==='models'?'Các mô hình dùng để trang trí. Công trình có chuỗi sản xuất nằm trong mục Nhà máy và Chuồng.':'Chọn một hình, rồi chạm vùng đất trống trên bản đồ để đặt. Cây có quả tương ứng trong kho sẽ cho thu hoạch theo thời gian.'));
  const grid=el('div','grid3');for(const d of Object.values(DECOR_CATALOG).filter(x=>x.group===group)){const lock=S.lv<d.lv,it=el('div','item'+(lock?' lock':''),`<div class="em">${Art.icon(d.art||d.id,d.n)}</div>${d.n}<div class="pr">${lock?'🔒 Cấp '+d.lv:'🪙 '+fmt(d.cost)}</div><small>${TREE_OUTPUT[d.id]?'Cho '+CROPS[TREE_OUTPUT[d.id]].n:'Trang trí bản đồ'}</small>`);it.onclick=()=>{if(lock)return toast('Mở ở cấp '+d.lv);if(S.coins<d.cost)return toast('Không đủ xu');startDecorPlacement(d.id)};grid.append(it)}body.append(grid);
}
function startDecorPlacement(id){
  const d=DECOR_CATALOG[id];if(!d)return;decorPlacement=id;closeSheet();hidePop();document.querySelector('#decor-placement')?.remove();
  const banner=el('div','decor-placement',`${Art.icon(id,d.n)}<span>Đặt ${d.n}<small>Chạm vùng đất trống · 🪙 ${fmt(d.cost)}</small></span><button class="cbtn2 sm">Hủy</button>`);banner.id='decor-placement';banner.querySelector('button').onclick=cancelDecorPlacement;document.body.append(banner);
}
function cancelDecorPlacement(){decorPlacement=null;document.querySelector('#decor-placement')?.remove()}
function decorCanPlace(x,y){
  if(x>=1&&x<9&&y>=22&&y<29)return false;
  if(x>=26||y<2)return false;
  if(x<.5||y<.5||x>N-.5||y>N-.5)return false;
  if(x>PX0-1&&x<PX0+PCOLS+1&&y>PY0-1&&y<PY0+Math.min(PROWS,5)+1)return false;
  if(Math.hypot((x-11.5)/3.6,(y-3.6)/2.9)<1)return false;
  if(Object.values(BUILDINGS).some(b=>x>b.slot[0]-.5&&x<b.slot[0]+2.5&&y>b.slot[1]-.5&&y<b.slot[1]+2.5))return false;
  if((S.decor||[]).some(d=>Math.hypot(x-d.gx,y-d.gy)<1.25))return false;
  if(Scene.objs.some(d=>!['flower','bush','rock'].includes(d.k)&&Math.hypot(x-d.gx,y-d.gy)<1))return false;
  return true;
}
function placeDecor(x,y){
  const d=DECOR_CATALOG[decorPlacement];if(!d)return false;
  if((S.decor||[]).length>=80){toast('Vườn đã có 80 món trang trí. Hãy thu hồi bớt.');return false}
  if(!decorCanPlace(x,y)){toast('Vị trí này có vật cản. Hãy chọn đất trống khác.');return false}
  if(S.coins<d.cost){toast('Không đủ xu');cancelDecorPlacement();return false}
  if(S.lv<d.lv){toast('Cần cấp '+d.lv);cancelDecorPlacement();return false}
  addCoins(-d.cost);S.decor=S.decor||[];S.decor.push({id:d.id,gx:x,gy:y,t0:Date.now(),uid:Date.now()+'-'+Math.random().toString(36).slice(2,6)});save();cancelDecorPlacement();const p=Scene.iso(x,y);Scene.burst(p.x,p.y,'✨',8);beep('win');toast('Đã đặt '+d.n);return true;
}
function tapDecor(d,sx,sy){
  const meta=DECOR_CATALOG[d.id];if(!meta)return;
  const fruit=TREE_OUTPUT[d.id],ready=fruit&&Date.now()-d.t0>=120000;
  popAt(sx,sy,`<h4>${Art.icon(meta.art||d.id,meta.n)} ${meta.n}</h4><p>${fruit?(ready?'Quả đã chín. Chạm để thu hoạch!':'Thu hoạch sau '+fmtT(120000-(Date.now()-d.t0))):'Trang trí riêng cho khu vườn của bạn.'}</p><div class="acts">${fruit?`<button class="cbtn2 sm ${ready?'':'gray'}" id="deco-harvest">Thu hoạch</button>`:''}<button class="cbtn2 gray sm" id="deco-remove">Thu hồi +🪙${Math.floor(meta.cost/2)}</button></div>`,p=>{
    $('#deco-remove',p).onclick=()=>{S.decor=S.decor.filter(x=>x.uid!==d.uid);addCoins(Math.floor(meta.cost/2));save();hidePop();toast('Đã thu hồi '+meta.n)};
    const b=$('#deco-harvest',p);if(b)b.onclick=()=>{if(!ready)return toast('Quả chưa chín');if(invTotal()>=fishCapacity())return toast('Kho đầy');addItem(fruit,1);d.t0=Date.now();addXp(12);track('harvest');track('harvest_'+fruit);Scene.float(d.gx,d.gy,'+1 '+CROPS[fruit].e);Scene.burst(sx,sy,'✨',6);refreshHud();save();hidePop();beep('coin')};
  });
}

function openFishAlbum(){
  openSheet('fish-album','Sổ cá',body=>{
    const seen=S.fish.seen||{},entries=Object.entries(FISHES);body.innerHTML=`<p class="art-intro">Đã khám phá ${entries.filter(([id])=>seen[id]).length}/${entries.length} loài. Cá đã bắt được ghi lại kể cả khi bán. Những loài chưa gặp vẫn có ảnh để bạn nhận biết.</p>`;const grid=el('div','grid3');for(const [id,f]of entries){const count=seen[id]||0,record=S.fish.records?.[id],locations=Object.values(FISH_SPOTS).filter(spot=>spot.fish.includes(id)).map(spot=>spot.name).join(' · ');grid.append(el('div','item',`<div class="em">${Art.icon(f.art||id,f.n)}</div>${f.n}<div class="pr">${count?'Đã bắt: '+count:'Chưa khám phá'}</div><small>🪙 ${fishSellPrice(id)} · Lực ×${f.str}</small>${record?`<small class="fish-record">Kỷ lục ${record.kg.toFixed(2)} kg</small>`:''}<small>${locations}</small>`))}body.append(grid);
  },'86%');
}
