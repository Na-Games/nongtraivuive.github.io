'use strict';
/* The same separated wardrobe PNGs keep customization working without WebGL. */
const AvatarRaster={
 images:new Map(),pending:new Set(),cache:new Map(),failed:new Set(),
 file(style,part,value,mask=false){return 'assets/avatars-v5/parts/'+style+'-'+part+(value?'-'+value:'')+(mask?'-mask':'')+'.png'},
 load(file){if(this.images.has(file))return this.images.get(file);if(this.pending.has(file)||this.failed.has(file))return null;this.pending.add(file);const image=new Image();image.onload=()=>{this.images.set(file,image);this.pending.delete(file);this.cache.clear();if(typeof drawHudAvatar==='function')drawHudAvatar()};image.onerror=()=>{this.failed.add(file);this.pending.delete(file)};image.src=file;return null},
 layers(a){return[
  {file:this.file(a.style,'body'),mask:this.file(a.style,'body','',true),color:a.skin},
  {file:this.file(a.style,'garment',a.shirtStyle),mask:this.file(a.style,'garment',a.shirtStyle,true),color:a.outfit},
  {file:this.file(a.style,'hair',a.hairStyle),mask:this.file(a.style,'hair',a.hairStyle,true),color:a.hair},
  ...(a.hat==='none'?[]:[{file:this.file(a.style,'hat',a.hat)}]),
 ]},
 tint(image,mask,color){
  const cv=document.createElement('canvas');cv.width=image.naturalWidth;cv.height=image.naturalHeight;const c=cv.getContext('2d');c.drawImage(image,0,0);if(!mask)return cv;
  const mc=document.createElement('canvas');mc.width=cv.width;mc.height=cv.height;const m=mc.getContext('2d');m.drawImage(mask,0,0);const data=c.getImageData(0,0,cv.width,cv.height),alpha=m.getImageData(0,0,cv.width,cv.height).data;
  const rgb=color.length===4?color.slice(1).split('').map(x=>parseInt(x+x,16)):[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
  for(let i=0;i<data.data.length;i+=4){if(!data.data[i+3]||!alpha[i+3])continue;const mix=Math.min(1,alpha[i+3]/data.data[i+3]);for(let ch=0;ch<3;ch++)data.data[i+ch]*=1-mix+mix*rgb[ch]/255}c.putImageData(data,0,0);return cv;
 },
 compose(input){const a=Wardrobe.normalize(input),key=Avatar3D.signature(a);if(this.cache.has(key))return this.cache.get(key);const layers=this.layers(a).map(p=>({...p,image:this.load(p.file),maskImage:p.mask?this.load(p.mask):null}));if(layers.some(p=>!p.image||p.mask&&!p.maskImage))return null;const cv=document.createElement('canvas');cv.width=256;cv.height=320;const c=cv.getContext('2d');for(const p of layers)c.drawImage(this.tint(p.image,p.maskImage,p.color),0,0,256,320);this.cache.set(key,cv);if(this.cache.size>48)this.cache.delete(this.cache.keys().next().value);return cv},
 async ready(input){const a=Wardrobe.normalize(input);this.compose(a);for(let i=0;i<100;i++){if(this.layers(a).some(p=>this.failed.has(p.file)||p.mask&&this.failed.has(p.mask)))throw Error('Không tải được bộ ảnh nhân vật');const cv=this.compose(a);if(cv)return cv;await new Promise(r=>setTimeout(r,50))}throw Error('Bộ ảnh nhân vật đang tải chậm, hãy thử lại')},
 draw(c,x,y,h,input,o={}){const cv=this.compose(input);if(!cv)return false;const w=h*.8,phase=(o.phase||0)*Math.PI*2,move=o.walk&&!S.fx.reduceMotion?Math.sin(phase)*h*.022:0;c.save();c.translate(x,y);if(o.back)c.scale(-1,1);if(o.work)c.rotate(-.035);if(move){const split=cv.height*.65;c.drawImage(cv,0,0,cv.width,split,-w/2,-h,w,h*.65);for(let side=0;side<2;side++){const dy=move*(side?1:-1);c.drawImage(cv,side*cv.width/2,split,cv.width/2,cv.height-split,-w/2+side*w/2,-h*.35,w/2,h*.35+dy)}}else c.drawImage(cv,-w/2,-h,w,h);c.restore();
  if(o.fishing){const hx=x-h*.15,hy=y-h*.43,tx=hx-h*.34,ty=hy-h*.46;c.strokeStyle='#795b37';c.lineWidth=2;c.beginPath();c.moveTo(hx,hy);c.quadraticCurveTo(hx-h*.1,ty,tx,ty);c.stroke();if(o.rigOut)Object.assign(o.rigOut,{x:tx,y:ty,handX:hx,handY:hy})}return true},
 capture(input,o={},width=320){const cv=document.createElement('canvas');cv.width=width;cv.height=Math.round(width*1.25);if(!this.draw(cv.getContext('2d'),width/2,cv.height,cv.height,input,o))throw Error('Ảnh nhân vật đang tải');return cv},
};
const previousAvatarDraw=Wardrobe.draw.bind(Wardrobe);
Wardrobe.draw=(...args)=>Avatar3D.ready?previousAvatarDraw(...args):AvatarRaster.draw(...args)||previousAvatarDraw(...args);
