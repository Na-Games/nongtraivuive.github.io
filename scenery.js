'use strict';
const Scenery={
 images:{},
 load(){for(const id of ['village-panorama','fishing-lake','terrain-meadow','province-relief']){const image=new Image();image.onload=()=>{this.images[id]=image;Scene.groundKey=null};image.src='assets/backgrounds/'+id+'.png'}},
 cover(c,id,x,y,w,h){const image=this.images[id];if(!image)return false;const s=Math.max(w/image.width,h/image.height),sw=w/s,sh=h/s;c.drawImage(image,(image.width-sw)/2,(image.height-sh)/2,sw,sh,x,y,w,h);return true},
 ground(c,i,j,p,z){const image=this.images['terrain-meadow'];if(!image)return Art.tile(c,'grass',p.x,p.y,TW*z+.5,TH*z+.5);const sx=((i%8+8)%8)*128,sy=((j%8+8)%8)*128;c.save();Scene.diamond(c,i,j);c.clip();c.drawImage(image,sx,sy,128,128,p.x-TW*z/2-.5,p.y-TH*z/2-.5,TW*z+1,TH*z+1);c.restore()},
 fishing(c,W,H,t){const image=this.images['fishing-lake'];if(!image)return false;c.drawImage(image,0,0,W,H);c.save();if(S.night){c.fillStyle='#102a4f66';c.fillRect(0,0,W,H)}c.beginPath();c.rect(0,H*.24,W*.67,H*.76);c.clip();for(let i=0;i<16;i++){const y=H*(.3+(i*.043)%.65),x=W*(.08+(i*.137)%.55)+(S.fx.reduceMotion?0:Math.sin(t*.65+i)*6);c.strokeStyle='#d7fcf433';c.lineWidth=1;c.beginPath();c.ellipse(x,y,16+i%3*6,2,0,0,Math.PI*2);c.stroke()}c.restore();return true},
};
Scenery.load();

/* Resolve visible silhouettes in exactly the scene's painter order. */
Scene.pick=function(sx,sy){
 const hits=[],z=this.cam.z,inside=(art,x,y,w,h)=>{const m=ART_MANIFEST.sprites[art];if(!m||!Art.has(art))return false;const b=m.bounds,s=Math.min(w/b.w,h/b.h),dw=b.w*s,dh=b.h*s,u=(sx-x+dw/2)/dw,v=(sy-y+dh)/dh;if(u<0||v<0||u>=1||v>=1)return false;const rows=typeof HIT_SHAPES!=='undefined'&&HIT_SHAPES[art];return !rows||!!(rows[Math.floor(v*32)]>>>Math.floor(u*32)&1)},add=(kind,id,value,depth,art,x,y,w,h)=>{if(inside(art,x,y,w,h))hits.push({kind,id,value,depth})};
 for(const r of this.regionHits||[])if(sx>=r.x&&sx<=r.x+r.w&&sy>=r.y&&sy<=r.y+r.h)return{kind:r.id==='coast'?'fishing':'region',id:r.id};
 PLOTS_EACH((k,i,j)=>{const p=S.plots[k];if(k>=S.plotsOpen||!p.crop)return;const pos=this.iso(i+.5,j+.5),crop=CROPS[p.crop],phase=cropProg(p),stage=phase<.2?'sprout':phase<.62?(crop.growthArt||crop.baseArt||p.crop)+'-0':phase<1?(crop.growthArt||crop.baseArt||p.crop)+'-1':crop.growthArt||crop.baseArt||p.crop;add('plot',k,null,i+j+1,Art.has(stage)?stage:crop.art||p.crop,pos.x,pos.y,70*z,65*z)});
 for(const [id,b]of Object.entries(BUILDINGS)){if(!S.b[id])continue;const p=this.iso(b.slot[0]+1,b.slot[1]+1),scale=1+Math.min(S.b[id].lv-1,4)*.035;add('building',id,null,b.slot[0]+b.slot[1]+2,b.art||id,p.x,p.y+24*z,178*z*scale,144*z*scale)}
 for(const d of S.decor||[]){const m=DECOR_CATALOG[d.id];if(!m)continue;const p=this.iso(d.gx,d.gy);add('decor',d.id,d,d.gx+d.gy,m.art||d.id,p.x,p.y+3*z,m.w*z,m.h*z)}
 for(const o of this.objs){if(o.k==='village-stone-bridge')continue;const sizes=this.objectSizes[o.k]||[60,70],p=this.iso(o.gx,o.gy),s=(o.s||1)*z;add(o.k==='sign'?'fishing':'scenery',o.k,o,o.gx+o.gy,o.k,p.x,p.y+3*s,sizes[0]*s,sizes[1]*s)}
 if(typeof Village!=='undefined')for(const o of Village.sceneObjects()){const project=Village.projects.find(p=>p.art===o.k),sizes=this.objectSizes[o.k]||[60,70],p=this.iso(o.gx,o.gy),s=(o.s||1)*z;add('village',project?.id,o,o.gx+o.gy,o.k,p.x,p.y+3*s,sizes[0]*s,sizes[1]*s)}
 return hits.sort((a,b)=>b.depth-a.depth)[0]||null;
};
