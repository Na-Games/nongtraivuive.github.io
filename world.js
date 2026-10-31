'use strict';
const World={
  ridge:new Image(),
  regions:[
    {id:'farm',n:'Nông trại',desc:'Gieo hạt, nuôi thú và giao hàng',x:7,y:10,icon:'farmhouse'},
    {id:'hills',n:'Đồi xanh',desc:'Đường mòn ngắm núi và nhặt quà mỗi 5 phút',x:18,y:3,icon:'mountains'},
    {id:'coast',n:'Bờ biển',desc:'Bãi cát, sóng biển và lối vào khu câu cá',x:25,y:14,icon:'boat'},
    {id:'orchard',n:'Vườn cây',desc:'Khoảng đất mới để trồng cây ăn quả',x:20,y:24,icon:'orange-tree'},
  ],
  open(){openSheet('world','Khám phá nông trại',body=>{
    body.append(el('p','pref-description','Bản đồ 32 × 32 ô. Kéo để khám phá, chụm hai ngón để thu phóng hoặc chọn một vùng bên dưới.'));
    const map=el('div','world-overview');map.innerHTML='<span class="world-north">ĐỒI XANH</span><span class="world-east">BIỂN</span>';
    for(const r of this.regions){const b=el('button','world-pin',Art.icon(r.icon,r.n)+`<span>${r.n}</span>`);b.style.left=(r.x/32*85)+'%';b.style.top=(r.y/32*76+8)+'%';b.onclick=()=>this.visit(r);map.append(b)}body.append(map);
    const grid=el('div','world-regions');for(const r of this.regions){const b=el('button','world-region',`${Art.icon(r.icon,r.n)}<span><b>${r.n}</b><small>${r.desc}</small></span><span>›</span>`);b.onclick=()=>this.visit(r);grid.append(b)}body.append(grid);
    const village=el('button','village-entry',`${Art.icon('deco-waterwheel','Guồng nước')}<span><b>Nhịp sống làng quê</b><small>Khôi phục công trình và làm hàng thủ công</small></span><span>›</span>`);village.onclick=openVillage;body.append(village);
  },'80%')},
  visit(region){closeSheet();if(typeof Camera!=='undefined')Camera.moveTo(region.x,region.y,clamp(innerWidth/620,.65,1.1));else Scene.centerOn(region.x,region.y,clamp(innerWidth/620,.65,1.1));toast(region.n+' · '+region.desc)},
  drawMountains(c,scene,z){
    if(Art.has('scenery-waterfall')){for(const [id,x,y,w,h]of [['scenery-waterfall',18,1,440,360],['scenery-bamboo',22,4,180,210],['scenery-pines',3,2,210,220]]){const p=scene.iso(x,y);Art.draw(c,id,p.x,p.y,w*z,h*z,1)}return}
    if(!this.ridge.complete||!this.ridge.naturalWidth)return;
    for(const x of [6,15,23]){const p=scene.iso(x,.5),w=590*z,h=w*this.ridge.naturalHeight/this.ridge.naturalWidth;c.drawImage(this.ridge,p.x-w/2,p.y-h+30*z,w,h)}
  },
  drawWater(c,scene,z,t){
    if(typeof Landscape!=='undefined')Landscape.stream(c,z,t);
    c.save();c.strokeStyle='#b9f3ee99';c.lineWidth=1.5*z;
    for(let row=2;row<32;row+=2){const x=27.3+(S.fx.reduceMotion?0:Math.sin(t*.7+row)*.15),a=scene.iso(x,row),b=scene.iso(x,row+1);c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo((a.x+b.x)/2+5*z,(a.y+b.y)/2,b.x,b.y);c.stroke()}
    c.restore();
    for(const [gx,gy,title]of [[18,3,'⛰ Đồi xanh'],[25,14,'Bờ biển · Câu cá'],[20,24,'Vườn cây']]){const p=scene.iso(gx,gy);if(p.x>-100&&p.x<scene.w+100&&p.y>0&&p.y<scene.h)scene.label(c,title,p.x,p.y-30*z,12,true)}
  },
  tap(gx,gy,sx,sy){
    if(gx>=25&&gx<32&&gy>=0&&gy<32){hidePop();popAt(sx,sy,'<h4>Bờ biển</h4><p>Nghe sóng biển và khám phá các điểm câu.</p><button class="cbtn2 sm" id="coast-fish">🎣 Đi câu cá</button>',p=>$('#coast-fish',p).onclick=openFishing);return true}
    if(Math.hypot(gx-18,gy-3)<1.8){hidePop();const remaining=Math.max(0,300000-(Date.now()-(S.hillGiftAt||0)));popAt(sx,sy,`<h4>Đường mòn đồi xanh</h4><p>${remaining?'Quà tiếp theo sau '+fmtT(remaining):'Có một giỏ quà nhỏ trên đường mòn.'}</p><button class="cbtn2 sm" id="hill-gift" ${remaining?'disabled':''}>Nhặt giỏ · 25 xu + 5 XP</button>`,p=>$('#hill-gift',p).onclick=()=>{if(Date.now()-(S.hillGiftAt||0)<300000)return;S.hillGiftAt=Date.now();addCoins(25);addXp(5);beep('coin');save();hidePop();Scene.burst(sx,sy,'sparkle',6);toast('Đã nhận 25 xu và 5 XP trên đồi!')});return true}
    return false;
  },
};
World.ridge.onload=()=>{if(typeof Scene!=='undefined')Scene.groundKey=null};
World.ridge.src='assets/sprites/terrain/mountain-ridge-v2.png';
