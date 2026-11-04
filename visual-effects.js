'use strict';
/* Screen-space signs stay above scenery in both the WebGL and canvas worlds. */
const FarmLabels={
 last:[],
 draw(c,three){
  const W=innerWidth,H=innerHeight,top=Math.min(112,H*.2),bottom=H-Math.min(110,H*.20),used=[],hits=[];
  const layoutKey=W+'|'+H,now=performance.now();
  if(this.layoutKey!==layoutKey||now-(this.layoutAt||0)>400){this.layoutKey=layoutKey;this.layoutAt=now;this.obstacles=[...document.querySelectorAll('#hud .side>*,#hud .zoomctl button,#hud .three-controls button,#hud .bl-row,#hud .shopbtn')].map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.height).map(r=>({x:r.x-3,y:r.y-3,w:r.width+6,h:r.height+6}))}
  const font=W<360?10:11,small=W<360?9:10;c.save();c.font=`700 ${font}px system-ui,sans-serif`;
  const zoom=three?Farm3D.zoom:Scene.cam.z;
  if(zoom<.92){c.restore();this.last=[];if(!three)Scene.buildingHits=[];return}
  const entries=Object.entries(BUILDINGS).map(([id,d])=>{const b=S.b[id],x=d.slot[0]+1,y=d.slot[1]+1;
   const p=three?Farm3D.project(x,y,Farm3D.height(x,y)+(b?2.8:.45)):Scene.iso(x,y);
   if(!three&&b)p.y-=108*Scene.cam.z;
   const base=three?Farm3D.project(x,y):Scene.iso(x,y);
   return{id,d,b,p,base};
  }).filter(e=>e.base.x>20&&e.base.x<W-20&&e.base.y>top&&e.base.y<bottom&&e.p.y>top&&e.p.y<bottom).sort((a,b)=>Number(!!b.b?.ready)-Number(!!a.b?.ready)||a.p.y-b.p.y);
  for(const {id,d,b,p} of entries){
   const title=d.n,lines=[];let line='';
   for(const word of title.split(' ')){if(line&&c.measureText(line+' '+word).width>143){lines.push(line);line=word}else line+=(line?' ':'')+word}lines.push(line);
   const status=!b?(S.lv>=d.lv?'Xây dựng · Cấp '+d.lv:'Mở khóa cấp '+d.lv):b.ready?'Thu '+ITEMS[d.out].n:b.t0?fmtT(Math.max(0,bTime(id)-(Date.now()-b.t0))):'Cấp '+b.lv+' · Sẵn sàng';
   const w=Math.min(W-20,Math.max(W<360?98:116,...[...lines,status].map(s=>c.measureText(s).width+20))),h=lines.length*14+21;
   const gap=4,occupied=[...used,...this.obstacles];
   // Signs stay attached to their roof/pad. Hide crowded signs instead of routing wires across the map.
   const box={x:p.x-w/2,y:p.y-h/2,w,h};
   if(box.x<8||box.x+w>W-8||box.y<top||box.y+h>bottom||occupied.some(b=>box.x<b.x+b.w+gap&&box.x+w+gap>b.x&&box.y<b.y+b.h+gap&&box.y+h+gap>b.y))continue;
   used.push(box);
   const {x,y}=box,ready=!!b?.ready,locked=!b&&S.lv<d.lv;
   c.strokeStyle=locked?'#b6a383':'#8eae8b';c.lineWidth=1;
   c.shadowColor='#293f3826';c.shadowBlur=8;c.shadowOffsetY=3;c.fillStyle=ready?'#fff1bd':locked?'#fff8e9f5':'#fffff6f5';c.beginPath();c.roundRect(x,y,w,h,10);c.fill();c.shadowBlur=0;c.shadowOffsetY=0;c.stroke();
   c.textAlign='center';c.textBaseline='middle';c.fillStyle='#2a4d40';c.font=`700 ${font}px system-ui,sans-serif`;lines.forEach((s,i)=>c.fillText(s,x+w/2,y+11+i*14));
   c.fillStyle=ready?'#9a641c':locked?'#92744e':'#527963';c.font=`500 ${small}px system-ui,sans-serif`;c.fillText(status,x+w/2,y+h-10);
   hits.push({...box,hit:{kind:'building',id},title,status});c.font=`700 ${font}px system-ui,sans-serif`;
  }
  c.restore();this.last=hits;if(three)Farm3D.overlayHits.push(...hits);else Scene.buildingHits=hits;
 },
};

/* Product badges are independent of the zoom-dependent name labels. */
const FarmProducts={
 last:[],
 draw(c,three){const hits=[],used=[],now=Date.now(),zoom=three?Farm3D.zoom:Scene.cam.z,r=clamp(18*zoom,13,19);c.save();
  for(const [id,b]of Object.entries(S.b)){const d=BUILDINGS[id];if(!d||!(b.ready||b.t0&&now-b.t0>=bTime(id)))continue;const gx=d.slot[0]+1,gy=d.slot[1]+1,base=three?Farm3D.project(gx,gy):Scene.iso(gx,gy),p=three?Farm3D.project(gx,gy,Farm3D.height(gx,gy)+3.25):{x:base.x,y:base.y-126*zoom};
   if(base.x<0||base.x>innerWidth||base.y<70||base.y>innerHeight-65||p.x<r||p.x>innerWidth-r||p.y<60+r||p.y>innerHeight-65-r)continue;
   let y=p.y;for(let n=0;n<3&&used.some(q=>Math.hypot(q.x-p.x,q.y-y)<r*2.1);n++)y-=r*2.1;
   const pulse=S.fx.reduceMotion?0:Math.sin(Scene.t*2.4+gx)*1.5;c.fillStyle='#fff9da';c.strokeStyle='#cf9c38';c.lineWidth=2;c.shadowColor='#9b6a2650';c.shadowBlur=6;c.beginPath();c.arc(p.x,y+pulse,r,0,Math.PI*2);c.fill();c.stroke();c.shadowBlur=0;
   Art.draw(c,ITEMS[d.out]?.art||d.out,p.x,y+pulse,r*1.55,r*1.55,.5);c.fillStyle='#488953';c.beginPath();c.arc(p.x+r*.72,y-r*.67,6,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.font='bold 9px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText('✓',p.x+r*.72,y-r*.67);
   hits.push({x:p.x-r-3,y:y-r-3,w:r*2+6,h:r*2+6,hit:{kind:'building',id},product:d.out});used.push({x:p.x,y});
  }c.restore();this.last=hits;if(three)Farm3D.overlayHits.unshift(...hits);else Scene.buildingHits=[...hits,...Scene.buildingHits||[]];
 },
};

/* No extra textures: bounded, deterministic water and motion effects. */
const GameVisuals={
 water(c,W,H,time){
  const t=S.fx.reduceMotion?0:time;c.save();c.beginPath();c.rect(0,H*.26,W*.69,H*.7);c.clip();
  for(let i=0;i<(S.fx.hq?26:12);i++){
   const x=W*(.05+(i*.137)%.61)+Math.sin(t*.6+i)*7,y=H*(.31+(i*.073)%.59),a=.10+.09*Math.sin(t*1.5+i);
   c.strokeStyle=`rgba(255,248,203,${a})`;c.lineWidth=1.2;c.beginPath();c.moveTo(x-7,y);c.quadraticCurveTo(x,y-3,x+11+(i%4)*5,y);c.stroke();
  }
  if(S.fx.particles)for(let i=0;i<10;i++){
   const x=(i*97.3+t*5)%(W*.67),y=H*(.32+(i*.077)%.54)+Math.sin(t+i)*9;
   c.fillStyle=`rgba(255,248,190,${.13+.12*Math.sin(t*1.8+i)})`;c.beginPath();c.arc(x,y,1.4,0,Math.PI*2);c.fill();
  }
  c.restore();
 },
 ripple(c,x,y,t,size=40){
  c.save();for(let i=0;i<3;i++){const age=(t*.85+i/3)%1;c.globalAlpha=(1-age)*.6;c.strokeStyle='#e7fff5';c.lineWidth=1.6-age;c.beginPath();c.ellipse(x,y,8+age*size,3+age*size*.28,0,0,Math.PI*2);c.stroke()}c.restore();
 },
 splash(c,x,y,t,force=1){
  if(!S.fx.particles||S.fx.reduceMotion)return;c.save();c.fillStyle='#ecfff5';
  for(let i=0;i<12;i++){const age=(t*1.8+i*.083)%1,angle=i*2.399;c.globalAlpha=(1-age)*.8;const dx=Math.cos(angle)*age*34*force,dy=-Math.sin(age*Math.PI)*24*force+Math.sin(angle)*8;c.beginPath();c.ellipse(x+dx,y+dy,1.4,2.5,angle,0,Math.PI*2);c.fill()}c.restore();
 },
 actors(c){
  if(!Farm3D.active||S.fx.reduceMotion)return;const t=Scene.t;c.save();
  for(const a of Scene.animals){if(!a.water)continue;const p=Farm3D.project(a.x,a.y,.07);if(p.x<0||p.x>innerWidth||p.y<0||p.y>innerHeight)continue;this.ripple(c,p.x,p.y+3,t+a.x,12*Farm3D.zoom)}
  const p=Scene.player;if(p.speed>.25&&S.fx.particles){const foot=Farm3D.project(p.x,p.y,Farm3D.walkHeight(p.x,p.y));for(let i=0;i<3;i++){const age=((p.phase||0)+i/3)%1;c.globalAlpha=(1-age)*.16;c.fillStyle='#e6d0a1';c.beginPath();c.ellipse(foot.x+(i-1)*6,foot.y-age*9,2+age*5,1+age*2,0,0,Math.PI*2);c.fill()}}
  c.restore();
 },
};
const previousVisualPick=Scene.pick.bind(Scene);
Scene.pick=(x,y)=>{for(const r of Scene.buildingHits||[])if(x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h)return r.hit;return previousVisualPick(x,y)};
