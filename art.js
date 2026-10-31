'use strict';
/* Shared PNG renderer for the farm, fishing, HUD, sheets and asset library. */
const Art={
  images:{},tiles:{},failed:[],ready:0,total:Object.keys(ART_MANIFEST.sheets).length,emoji:new Map(),
  load(){
    const critical=new Set(['terrain','nature','buildings','growth','produce','ui','characters','wardrobe-parts','village-landscape']);
    const entries=Object.entries(ART_MANIFEST.sheets),primary=entries.filter(([id])=>critical.has(id)),background=entries.filter(([id])=>!critical.has(id));
    const loadOne=([id,s])=>new Promise(resolve=>{const im=new Image();let settled=false;const finish=ok=>{if(settled)return;settled=true;clearTimeout(timer);if(ok){this.images[id]=im;this.ready++}else this.failed.push(id);resolve()};const timer=setTimeout(()=>finish(false),12000);im.onload=()=>finish(true);im.onerror=()=>finish(false);im.src=s.file});
    const queue=async entries=>{let cursor=0;await Promise.all(Array.from({length:Math.min(3,entries.length)},async()=>{while(cursor<entries.length)await loadOne(entries[cursor++])}))};
    this.criticalPromise=queue(primary);
    return this.criticalPromise.then(()=>queue(background));
  },
  has(id){return !!(ART_MANIFEST.sprites[id]&&this.images[ART_MANIFEST.sprites[id].sheet])},
  draw(c,id,x,y,w,h=w,anchor=.5,flip=false){
    const s=ART_MANIFEST.sprites[id];if(!s||!this.images[s.sheet])return false;
    const sheet=ART_MANIFEST.sheets[s.sheet],b=s.bounds,scale=Math.min(w/b.w,h/b.h),dw=b.w*scale,dh=b.h*scale;
    c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.translate(x,y);if(flip)c.scale(-1,1);
    c.drawImage(this.images[s.sheet],s.col*sheet.cell+b.x,s.row*sheet.cell+b.y,b.w,b.h,-dw/2,-dh*anchor,dw,dh);c.restore();return true;
  },
  icon(id,label='',cls=''){const s=ART_MANIFEST.sprites[id];if(!s)return '';return `<img class="game-icon ${cls}" src="${s.file}" alt="${label}" title="${label}" draggable="false" loading="lazy">`},
  tile(c,id,x,y,w,h){
    if(!this.has(id))return;
    if(!this.tiles[id]){const cv=document.createElement('canvas');cv.width=192;cv.height=96;const ctx=cv.getContext('2d'),s=ART_MANIFEST.sprites[id],sheet=ART_MANIFEST.sheets[s.sheet],b=s.bounds;ctx.beginPath();ctx.moveTo(96,0);ctx.lineTo(192,48);ctx.lineTo(96,96);ctx.lineTo(0,48);ctx.closePath();ctx.clip();ctx.globalAlpha=id==='grass'?.32:.7;ctx.drawImage(this.images[s.sheet],s.col*sheet.cell+b.x+b.w*.25,s.row*sheet.cell+b.y+b.h*.24,b.w*.5,b.h*.3,-2,-2,196,100);this.tiles[id]=cv}
    c.drawImage(this.tiles[id],x-w/2,y-h/2,w,h);
  },
  register(symbol,id){if(symbol&&ART_MANIFEST.sprites[id])this.emoji.set(symbol,id)},
  tokenize(str){return String(str).split(this.pattern)},
  text(c,str,x,y,maxWidth,outline=false){
    const text=String(str);if(!this.pattern||!this.emojiTest.test(text)){if(outline)c.strokeText(text,x,y);if(maxWidth==null)c.fillText(text,x,y);else c.fillText(text,x,y,maxWidth);return}
    const px=parseFloat(c.font.match(/[\d.]+px/)?.[0])||20,parts=this.tokenize(text).filter(Boolean),widths=parts.map(p=>this.emoji.has(p)?px:c.measureText(p).width),total=widths.reduce((a,b)=>a+b,0),fit=maxWidth?Math.min(1,maxWidth/total):1;
    c.save();c.translate(x,y);c.scale(fit,1);let cursor=c.textAlign==='center'?-total/2:c.textAlign==='right'||c.textAlign==='end'?-total:0;
    const baseline=c.textBaseline,cy=baseline==='middle'?0:baseline==='top'||baseline==='hanging'?px*.5:-px*.36;c.textAlign='left';
    parts.forEach((p,i)=>{const id=this.emoji.get(p);if(id&&this.has(id))this.draw(c,id,cursor+widths[i]/2,cy,px,px);else{if(outline)c.strokeText(p,cursor,0);c.fillText(p,cursor,0)}cursor+=widths[i]});c.restore();
  },
  initSymbols(){
    Object.entries(CROPS).forEach(([id,v])=>this.register(v.e,v.art||id));Object.entries(PRODUCTS).forEach(([id,v])=>this.register(v.e,id));Object.entries(FISHES).forEach(([id,v])=>this.register(v.e,v.art||id));
    const pairs={'🪙':'coin','💎':'gem','⭐':'star','🎒':'bag','📋':'orders','🎁':'gift','✉️':'mail','📗':'season','📅':'calendar','🪷':'festival','🏮':'lantern','🏆':'trophy','🏪':'shop','🧺':'friends','💌':'invite','⚙️':'settings','📷':'camera','⊞':'menu','☀️':'sun','🌙':'moon','🔒':'lock','🔨':'hammer','⬆':'upgrade','⚡':'energy','🚚':'truck','🐔':'hen','🐄':'cow','🦆':'duck','🐕':'dog','🦋':'butterfly','🐝':'bee-animal','🐷':'pig','🐑':'sheep','🐐':'goat','🐃':'buffalo','🦢':'crane','🐈':'cat','🌼':'flower','🌿':'bush','🌱':'sprout','✨':'sparkle','🌟':'sparkle-big','🎉':'levelup','❤️':'heart','🪣':'bucket','🎣':'rod-truc','🎋':'rod-tre','🪱':'bait-nho','🐛':'bait-giun','🕸️':'net','🪴':'tea-bush','🏺':'silo','🟫':'soil','📦':'planks','🪵':'planks','🧱':'bricks','🪨':'stones','👑':'crown','📍':'pin','🔥':'oven','🧑‍🌾':'farmer-0-idle','👩':'farmer-1-idle','🧑':'farmer-2-idle','👴':'farmer-3-idle','👵':'farmer-4-idle','👧':'farmer-1-idle','🧒':'farmer-5-idle','🦛':'buffalo','⚙':'settings','✉':'mail'};
    for(const [symbol,id] of Object.entries(pairs))this.register(symbol,id);
    for(const [symbol,id]of Object.entries({'🏭':'mill','👤':'farmer-0-idle','🎨':'flower','📜':'orders','🗺️':'farm-map','🖼':'farm-map','🌳':'tree','🏠':'farmhouse','🔊':'settings','🌑':'moon'}))this.register(symbol,id);
    const escaped=[...this.emoji.keys()].sort((a,b)=>b.length-a.length).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');this.pattern=new RegExp('('+escaped+')','gu');this.emojiTest=new RegExp(escaped,'u');
  },
  enhance(root=document.body){
    if(!this.pattern)return;
    const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>!n.parentElement||n.parentElement.closest('script,style,textarea,input,option,svg,canvas,.game-icon,.keep-text')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});const nodes=[];while(walk.nextNode())if(this.emojiTest.test(walk.currentNode.data))nodes.push(walk.currentNode);
    for(const n of nodes){if(!n.parentNode)continue;const frag=document.createDocumentFragment();for(const p of this.tokenize(n.data)){if(!p)continue;const id=this.emoji.get(p);if(id){const img=document.createElement('img');img.className='game-icon';img.src=ART_MANIFEST.sprites[id].file;img.alt=ITEMS[id]?.n||DECOR_CATALOG[id]?.n||p;img.draggable=false;frag.append(img)}else frag.append(document.createTextNode(p))}n.replaceWith(frag)}
  },
  observe(){this.initSymbols();this.enhance();const pending=new Set();let scheduled=false;this.observer=new MutationObserver(records=>{for(const r of records){if(r.type==='characterData')pending.add(r.target.parentElement);else for(const n of r.addedNodes){if(n.nodeType===1&&!n.matches('.game-icon'))pending.add(n);else if(n.nodeType===3)pending.add(n.parentElement)}}if(!scheduled&&pending.size){scheduled=true;requestAnimationFrame(()=>{scheduled=false;const roots=[...pending];pending.clear();for(const n of roots)if(n?.isConnected)this.enhance(n)})}});this.observer.observe(document.body,{childList:true,subtree:true,characterData:true})}
};
Art.promise=Art.load();
Art.promise.then(()=>{if(typeof drawHudAvatar==='function')drawHudAvatar()});

function openArtLibrary(){
  openSheet('art-library','Thư viện hình ảnh',body=>{
    const names={produce:'Nông sản',buildings:'Công trình & xe',nature:'Thiên nhiên & vật nuôi',fishing:'Cá & dụng cụ',ui:'Giao diện',effects:'Hiệu ứng',growth:'Sinh trưởng',terrain:'Địa hình & bản đồ',characters:'Nhân vật',goods:'Chế phẩm & vật liệu','crops-extra':'Rau củ & hoa','botanical':'Thảo mộc & nấm','trees-a':'Cây lâu năm I','trees-b':'Cây lâu năm II',heritage:'Trang trí làng Việt',facilities:'Mô hình công trình'};
Object.assign(names,{'wardrobe-parts':'Wardrobe',scenery:'Village scenery'});
    for(const [id,sheet]of Object.entries(ART_MANIFEST.sheets))names[id]=names[id]||sheet.title||id;
    body.innerHTML=`<p class="art-intro">${Object.keys(ART_MANIFEST.sprites).length} hình PNG trong suốt · Khoảng đệm an toàn 24 px. Chạm hình để xem và tải PNG riêng.</p><button class="cbtn2 sm" id="art-vfx">Trình diễn bộ hiệu ứng</button><input class="search" id="art-search" placeholder="Tìm mã hình: lua, farmer, rod, soil…"><div id="art-list"></div>`;
    $('#art-vfx',body).onclick=()=>{closeSheet();Object.entries(ART_MANIFEST.sprites).filter(([,s])=>s.sheet==='effects').forEach(([id],i)=>setTimeout(()=>Scene.burst(Scene.w*(.2+(i%5)*.15),Scene.h*(.3+Math.floor(i/5)*.09),id,4),i*90))};
    const render=()=>{const q=$('#art-search',body).value.toLowerCase(),list=$('#art-list',body);list.innerHTML='';for(const [sheet,title]of Object.entries(names)){const entries=Object.entries(ART_MANIFEST.sprites).filter(([id,v])=>v.sheet===sheet&&(!q||id.includes(q)||title.toLowerCase().includes(q)));if(!entries.length)continue;list.append(el('div','lbl',`${title} · ${entries.length}`));const grid=el('div','art-grid');for(const [id,v]of entries){const a=el('a','art-tile',Art.icon(id,id)+`<small>${id}</small>`);a.href=v.file;a.download=id+'.png';a.title='Tải PNG '+id;grid.append(a)}list.append(grid)}};$('#art-search',body).oninput=render;render();
  },'90%');
}
