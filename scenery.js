'use strict';
const Scenery={
 images:{},pending:new Set(),
 loadOne(id){if(this.images[id]||this.pending.has(id))return;this.pending.add(id);const image=new Image();image.onload=()=>{this.images[id]=image;this.pending.delete(id);Scene.groundKey=null};image.onerror=()=>{this.pending.delete(id)};image.src='assets/backgrounds/'+id+'.png'},
 load(){for(const id of ['village-panorama','fishing-lake','terrain-meadow','province-relief','fishing-lotus','fishing-river','fishing-bay']){this.loadOne(id);if(id.startsWith('fishing-')&&innerWidth>innerHeight&&id!=='fishing-lake')this.loadOne(id+'-wide')}},
 cover(c,id,x,y,w,h){const image=this.images[id];if(!image)return false;const s=Math.max(w/image.width,h/image.height),sw=w/s,sh=h/s;c.drawImage(image,(image.width-sw)/2,(image.height-sh)/2,sw,sh,x,y,w,h);return true},
 fishingStage(c,W,H,t){
  const wide=W>H,h=Math.min(wide?116:144,W*.29,H*.32),x=W*(wide?.81:.79),y=H*(wide?.77:.57),left=x-h*.95,right=Math.min(W+20,x+h*1.05),back=y-h*.15,front=y+h*.18;
  c.save();c.fillStyle='#294d4655';c.beginPath();c.ellipse(x,y+h*.23,h*1.12,h*.15,0,0,Math.PI*2);c.fill();
  // A foreground landing supplies a common contact plane in all six backgrounds.
  c.fillStyle='#725338';c.beginPath();c.moveTo(left,back);c.lineTo(right,back-h*.12);c.lineTo(right,front);c.lineTo(left,front+h*.06);c.closePath();c.fill();
  if(!this.jettyPattern){const cv=document.createElement('canvas');cv.width=256;cv.height=96;const g=cv.getContext('2d'),base=g.createLinearGradient(0,0,0,96);base.addColorStop(0,'#ad8756');base.addColorStop(1,'#795638');g.fillStyle=base;g.fillRect(0,0,256,96);g.strokeStyle='#513c2a38';g.lineWidth=.6;for(let i=0;i<56;i++){const y=(i*17.31)%96,x=(i*41.2)%256;g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+14,y-2,x+25,y+2,x+49,y);g.stroke()}for(let i=0;i<3;i++){g.beginPath();g.ellipse(35+i*81,18+i*27,8,2.3,0,0,Math.PI*2);g.stroke()}this.jettyPattern=c.createPattern(cv,'repeat');this.jettyPattern.setTransform(new DOMMatrix().scale(.4))}c.save();c.globalAlpha=.8;c.fillStyle=this.jettyPattern;c.fill();c.restore();
  c.strokeStyle='#b08b5a';c.lineWidth=Math.max(2,h*.035);for(let i=0;i<7;i++){const yy=back+(front-back)*i/6;c.beginPath();c.moveTo(left+3,yy);c.lineTo(right,yy-h*.06);c.stroke()}
  for(const px of [left+8,right-12]){c.strokeStyle='#5f4933';c.lineWidth=h*.07;c.beginPath();c.moveTo(px,front);c.lineTo(px,front+h*.3);c.stroke()}
  const seatX=x+h*.12,seatY=y-h*.29;c.strokeStyle='#65472e';c.lineWidth=h*.045;for(const dx of [-.12,.13]){c.beginPath();c.moveTo(seatX+dx*h,seatY);c.lineTo(seatX+dx*h*1.3,y);c.stroke()}c.fillStyle='#b68b50';c.beginPath();c.ellipse(seatX,seatY,h*.23,h*.065,0,0,Math.PI*2);c.fill();
  Art.draw(c,'bucket',Math.min(W-14,x+h*.55),y+h*.03,h*.32,h*.36,1);Art.draw(c,'tackle',left+h*.22,front,h*.38,h*.26,1);
  c.restore();return{x,y,h,seatY,deck:{left,right,back,front}};
 },
 fishingLife(c,W,H,t){
  const still=S.fx.reduceMotion,time=still?0:t,spot=S.fish.spot;c.save();
  const avatarH=Math.min(W>H?116:144,W*.29,H*.32),edge=W*(W>H?.81:.79)-avatarH*.95-12;c.save();c.beginPath();c.rect(0,H*.27,Math.max(0,edge),H*.65);c.clip();
  const species=FISH_SPOTS[spot].fish;for(let i=0;i<3;i++){const x=W*(.08+i*.12)+Math.sin(time*.32+i)*24,y=H*(.39+i*.085)+Math.sin(time*.7+i)*5;c.globalAlpha=.13;Art.draw(c,FISHES[species[i%species.length]]?.art||species[i%species.length],x,y,34+i*5,19+i*3,.5,Math.cos(time*.32+i)<0)}c.globalAlpha=1;
  if(!still){const phase=(time+3)%11;if(phase<1){const x=edge*.35+phase*36,y=H*.45-Math.sin(phase*Math.PI)*25;c.save();c.translate(x,y);c.rotate((phase-.5)*1.7);Art.draw(c,FISHES[species[0]]?.art||species[0],0,0,25,15,.5);c.restore()}else if(phase<2)GameVisuals.ripple(c,edge*.35+36,H*.45,(phase-1)*1.7,22)}
  if(spot==='lotus'){for(let i=0;i<2;i++){const x=W*(.12+i*.18)+Math.sin(time*.25+i)*13,y=H*(.35+i*.08);if(typeof IllustratedAnimals!=='undefined')IllustratedAnimals.draw(c,{species:'duck',x:i,water:true,phase:time*.25,moveBlend:0,face:i?-1:1,rawPose:true},x,y,25,time)}}
  else if(spot==='bay'){c.strokeStyle='#f4ffef44';c.lineWidth=1.4;for(let i=0;i<4;i++){const y=H*(.38+i*.1)+Math.sin(time*.8+i)*4;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(edge*.3,y-5,edge*.65,y+6,edge,y-3);c.stroke()}}c.restore();
  if(S.fx.particles)for(let i=0;i<(S.fx.hq?7:3);i++){const x=((i*131+time*(spot==='bay'?15:5))%(W*.63+50))-20,y=H*(.42+(i*.071)%.31)+Math.sin(time+i)*4;c.globalAlpha=.22;c.fillStyle=spot==='lotus'?'#edbfc6':spot==='river'?'#e3c77c':'#fff3bd';c.beginPath();c.ellipse(x,y,spot==='bay'?2:4,1.8,Math.sin(i+time*.3),0,Math.PI*2);c.fill()}
  c.globalAlpha=.38;c.strokeStyle=S.night?'#d0ddd4':'#345c61';c.lineWidth=1.4;for(let i=0;i<3;i++){const x=(W*.15+i*67+time*8)%(W*.6),y=H*.23+Math.sin(time*.8+i)*6,wing=still?3:Math.sin(time*3+i)*4;c.beginPath();c.moveTo(x-7,y+wing);c.quadraticCurveTo(x-3,y-3,x,y);c.quadraticCurveTo(x+3,y-3,x+7,y+wing);c.stroke()}
  c.restore();
 },
 ground(c,i,j,p,z){const image=this.images['terrain-meadow'];if(!image)return Art.tile(c,'grass',p.x,p.y,TW*z+.5,TH*z+.5);const sx=((i%8+8)%8)*128,sy=((j%8+8)%8)*128;c.save();Scene.diamond(c,i,j);c.clip();c.globalAlpha=.36;c.drawImage(image,sx,sy,128,128,p.x-TW*z/2-.5,p.y-TH*z/2-.5,TW*z+1,TH*z+1);c.restore()},
 fishing(c,W,H,t){const id='fishing-'+S.fish.spot+(W>H?'-wide':'');this.loadOne(id);const image=this.images[id]||this.images['fishing-'+S.fish.spot];if(!image)return false;const scale=Math.max(W/image.width,H/image.height),sw=W/scale,sh=H/scale;const screen=document.querySelector('#screen-fish'),key=id+'|'+image.src;if(screen){if(this.fishingBackground!==key){screen.style.backgroundImage='url("'+image.src+'")';screen.style.backgroundSize='cover';screen.style.backgroundPosition='80% 44%';this.fishingBackground=key}}else c.drawImage(image,(image.width-sw)*.8,(image.height-sh)*.44,sw,sh,0,0,W,H);c.save();if(S.night){c.fillStyle='#102a4f66';c.fillRect(0,0,W,H)}c.beginPath();c.rect(0,H*.24,W*.67,H*.76);c.clip();for(let i=0;i<16;i++){const y=H*(.3+(i*.043)%.65),x=W*(.08+(i*.137)%.55)+(S.fx.reduceMotion?0:Math.sin(t*.65+i)*6);c.strokeStyle='#d7fcf433';c.lineWidth=1;c.beginPath();c.ellipse(x,y,16+i%3*6,2,0,0,Math.PI*2);c.stroke()}c.restore();return true},
};
Scenery.load();
Scene.cropVisual=function(plot){const C=CROPS[plot.crop],stage=cropProg(plot)<.3?0:cropProg(plot)<1?1:2,base=C.growthArt||C.art||plot.crop,trees={xoai:'mango-tree',chuoi:'banana-tree',cam:'orange-tree',dua:'palm',che:'tea-bush','caphe-qua':'coffee-bush'};return{stage,sprite:stage===2?Art.cropModel(plot.crop):Art.has(base+'-'+stage)?base+'-'+stage:stage===0?'sprout':stage===1?'bush':trees[C.art||plot.crop]||base}};

/* Resolve visible silhouettes in exactly the scene's painter order. */
Scene.pick=function(sx,sy){
 const hits=[],z=this.cam.z,inside=(art,x,y,w,h)=>{const m=ART_MANIFEST.sprites[art];if(!m||!Art.has(art))return false;const b=m.bounds,s=Math.min(w/b.w,h/b.h),dw=b.w*s,dh=b.h*s,u=(sx-x+dw/2)/dw,v=(sy-y+dh)/dh;if(u<0||v<0||u>=1||v>=1)return false;const rows=typeof HIT_SHAPES!=='undefined'&&HIT_SHAPES[art];return !rows||!!(rows[Math.floor(v*32)]>>>Math.floor(u*32)&1)},add=(kind,id,value,depth,art,x,y,w,h)=>{if(inside(art,x,y,w,h))hits.push({kind,id,value,depth})};
 for(const r of this.regionHits||[])if(sx>=r.x&&sx<=r.x+r.w&&sy>=r.y&&sy<=r.y+r.h)return{kind:r.id==='coast'?'fishing':'region',id:r.id};
 PLOTS_EACH((k,i,j)=>{const p=S.plots[k];if(k>=S.plotsOpen||!p.crop)return;const pos=this.iso(i+.5,j+.5),visual=Scene.cropVisual(p);for(const [dx,dy]of [[-17,-3],[16,-3],[0,10]])add('plot',k,null,i+j+1,visual.sprite,pos.x+dx*z,pos.y+(dy+6)*z,(visual.stage===2?36:28)*z,(visual.stage===2?42:30)*z)});
 for(const [id,b]of Object.entries(BUILDINGS)){if(!S.b[id])continue;const p=this.iso(b.slot[0]+1,b.slot[1]+1),scale=1+Math.min(S.b[id].lv-1,4)*.035;add('building',id,null,b.slot[0]+b.slot[1]+2,b.art||id,p.x,p.y+24*z,178*z*scale,144*z*scale)}
 for(const d of S.decor||[]){const m=DECOR_CATALOG[d.id];if(!m)continue;const p=this.iso(d.gx,d.gy);add('decor',d.id,d,d.gx+d.gy,m.art||d.id,p.x,p.y+3*z,m.w*z,m.h*z)}
 for(const o of this.objs){if(o.k==='village-stone-bridge')continue;const sizes=this.objectSizes[o.k]||[60,70],p=this.iso(o.gx,o.gy),s=(o.s||1)*z;add(o.k==='sign'?'fishing':'scenery',o.k,o,o.gx+o.gy,o.k,p.x,p.y+3*s,sizes[0]*s,sizes[1]*s)}
 if(typeof Village!=='undefined')for(const o of Village.sceneObjects()){const project=Village.projects.find(p=>p.art===o.k),sizes=this.objectSizes[o.k]||[60,70],p=this.iso(o.gx,o.gy),s=(o.s||1)*z;add('village',project?.id,o,o.gx+o.gy,o.k,p.x,p.y+3*s,sizes[0]*s,sizes[1]*s)}
 return hits.sort((a,b)=>b.depth-a.depth)[0]||null;
};
