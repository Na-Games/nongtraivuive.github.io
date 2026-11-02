'use strict';
/* Production cutouts matching the approved storybook artwork. One wardrobe everywhere. */
const IllustratedAvatar={
 version:6,images:new Map(),pending:new Map(),failed:new Set(),cache:new Map(),listeners:new Set(),
 load(file){if(this.images.has(file))return this.images.get(file);if(!this.pending.has(file)&&!this.failed.has(file)){const promise=new Promise(resolve=>{const image=new Image();image.onload=()=>{this.images.set(file,image);this.pending.delete(file);for(const fn of this.listeners)fn();if(typeof drawHudAvatar==='function')drawHudAvatar();resolve(image)};image.onerror=()=>{this.failed.add(file);this.pending.delete(file);resolve(null)};image.src=file});this.pending.set(file,promise)}return null},
 files(input){const a=Wardrobe.normalize(input),b=ILLUSTRATED_ART.bodies[a.style+'-'+a.shirtStyle];return[b.file,b.skin,b.cloth,ILLUSTRATED_ART.hair[a.hairStyle].file,...(a.hat==='none'?[]:[ILLUSTRATED_ART.hats[a.hat].file])]},
 async ready(input){const files=this.files(input);for(const f of files)this.load(f);await Promise.all(files.map(f=>this.pending.get(f)));if(files.some(f=>!this.images.has(f)))throw Error('Không tải được bộ ảnh nhân vật. Hãy tải lại game.');return this.compose(input)},
 signature(input){const a=Wardrobe.normalize(input);return['illustrated-v6',a.style,a.skin,a.hair,a.outfit,a.hairStyle,a.shirtStyle,a.hat].join('|')},
 tintLayer(image,color){const cv=document.createElement('canvas');cv.width=image.naturalWidth||image.width;cv.height=image.naturalHeight||image.height;const c=cv.getContext('2d');c.drawImage(image,0,0);c.globalCompositeOperation='multiply';c.fillStyle=color;c.fillRect(0,0,cv.width,cv.height);c.globalCompositeOperation='destination-in';c.drawImage(image,0,0);return cv},
 tintBody(image,skinMask,clothMask,a){const cv=document.createElement('canvas');cv.width=512;cv.height=640;const c=cv.getContext('2d');c.drawImage(image,0,0);c.drawImage(this.tintLayer(skinMask,a.skin),0,0);c.drawImage(this.tintLayer(clothMask,a.outfit),0,0);return cv},
 tintHair(image,color){const cv=document.createElement('canvas');cv.width=image.naturalWidth||image.width;cv.height=image.naturalHeight||image.height;const c=cv.getContext('2d');c.filter='grayscale(1) brightness(2.7)';c.drawImage(image,0,0);c.filter='none';return this.tintLayer(cv,color)},
 compose(input){const a=Wardrobe.normalize(input),key=this.signature(a);if(this.cache.has(key))return this.cache.get(key);const files=this.files(a),images=files.map(f=>this.load(f));if(images.some(im=>!im))return null;
  const meta=ILLUSTRATED_ART.bodies[a.style+'-'+a.shirtStyle],cv=this.tintBody(images[0],images[1],images[2],a),c=cv.getContext('2d'),head=meta.head;
  const hair=this.tintHair(images[3],a.hair),fit={short:[1.18,.79,-.18],swept:[1.28,1.08,-.22],braid:[1.38,1.75,-.22],long:[1.45,1.60,-.22],curly:[1.25,.94,-.18]}[a.hairStyle],hw=head.w*fit[0],hh=head.w*fit[1];c.drawImage(hair,head.x-hw/2,head.y+head.w*fit[2],hw,hh);
  if(a.hat!=='none'){const image=images[4],fit={non:[1.64,.83,-.55],rom:[1.53,.73,-.48],khan:[1.52,1.15,-.40]}[a.hat],w=head.w*fit[0],h=head.w*fit[1];if(a.hat==='non')c.drawImage(image,0,0,image.naturalWidth,image.naturalHeight*.77,head.x-w/2,head.y+head.w*fit[2],w,h);else c.drawImage(image,head.x-w/2,head.y+head.w*fit[2],w,h)}
  const value={cv,meta,rig:null};this.cache.set(key,value);if(this.cache.size>48)this.cache.delete(this.cache.keys().next().value);return value;
 },
 rig(value){if(value.rig)return value.rig;const {cv,meta}=value,b=meta.bounds,center=b.x+b.w/2,headCut=meta.head.y+meta.head.w*1.02;
  const armPath=side=>{const path=new Path2D(),edge=side<0?0:512;path.moveTo(edge,meta.shoulder);path.lineTo(center+side*b.w*.22,meta.shoulder);path.lineTo(center+side*b.w*.31,meta.hand);path.lineTo(edge,meta.hand);path.closePath();return path};
  const arms=[armPath(-1),armPath(1)],rect=(x,y,w,h)=>{const path=new Path2D();path.rect(x,y,w,h);return path};
  const paths=[rect(0,0,512,headCut),rect(0,headCut,512,meta.hip-headCut),...arms,rect(0,meta.hip,center,640-meta.hip),rect(center,meta.hip,512-center,640-meta.hip)];
  value.rig=paths.map((path,i)=>{const canvas=document.createElement('canvas');canvas.width=512;canvas.height=640;const c=canvas.getContext('2d');c.save();c.clip(path);c.drawImage(cv,0,0);c.restore();if(i===1||i===4||i===5){c.globalCompositeOperation='destination-out';for(const arm of arms)c.fill(arm)}return{cv:canvas,pivot:i===0?[meta.head.x,headCut]:i===2?[center-b.w*.25,meta.shoulder+5]:i===3?[center+b.w*.25,meta.shoulder+5]:i===4?[center-b.w*.14,meta.hip]:i===5?[center+b.w*.14,meta.hip]:[center,meta.hip]}});return value.rig;
 },
 paint(c,value,o={}){const reduced=!!S.fx.reduceMotion&&!o.exportPose,t=o.t||0,moving=!!o.walk&&!reduced,phase=(o.phase||0)*Math.PI*2,blend=o.blend??1,wave=Math.sin(phase+.25)*blend;
  if(!moving&&!o.work&&!o.fishing){c.drawImage(value.cv,0,0);return}
  const rig=this.rig(value),angles=[0,0,0,0,0,0];if(moving){angles[2]=-wave*.24;angles[3]=wave*.24;angles[4]=wave*.18;angles[5]=-wave*.18}if(o.work&&!reduced){angles[2]=-.18+Math.sin(t*4)*.10;angles[3]=.18-Math.sin(t*4)*.10;angles[0]=.035}if(o.fishing){angles[2]=-.28-(o.reel&&!reduced?Math.sin(t*7)*.06:0);angles[3]=.13;angles[0]=.025}
  c.save();if(moving)c.translate(0,-Math.abs(Math.sin(phase))*3*blend);const draw=i=>{const p=rig[i];c.save();c.translate(...p.pivot);c.rotate(angles[i]);c.drawImage(p.cv,-p.pivot[0],-p.pivot[1]);c.restore()};for(const i of [4,5,2,3,1,0])draw(i);c.restore();
 },
 draw(c,x,y,h,input,o={}){const value=this.compose(input);if(!value)return false;const width=h*.8,flip=o.flip??(o.back||o.face<0||Math.sin(o.angle||0)<-.1?-1:1);c.save();c.translate(x,y);c.scale(flip*width/512,h/640);c.translate(-256,-620);this.paint(c,value,o);c.restore();
  if(o.fishing){const hx=x+flip*h*.14,hy=y-h*.30,tx=hx-h*.34,ty=hy-h*.47;c.save();c.strokeStyle='#785535';c.lineWidth=Math.max(1.6,h*.012);c.beginPath();c.moveTo(hx,hy);c.quadraticCurveTo(hx-h*.12,ty,tx,ty);c.stroke();c.restore();if(o.rigOut)Object.assign(o.rigOut,{x:tx,y:ty,handX:hx,handY:hy})}return true;
 },
 capture(input,o={},width=512){const cv=document.createElement('canvas');cv.width=width;cv.height=Math.round(width*1.25);if(!this.draw(cv.getContext('2d'),width/2,cv.height*620/640,cv.height,input,{...o,exportPose:true}))throw Error('Bộ ảnh nhân vật đang tải. Thử lại sau một chút.');return cv},
 icon(input,key,size=64){const value=this.compose(input),cv=document.createElement('canvas');cv.width=cv.height=size;if(!value)return cv;const c=cv.getContext('2d'),head=value.meta.head;if(key==='shirtStyle')c.drawImage(value.cv,128,220,256,260,0,0,size,size);else c.drawImage(value.cv,head.x-head.w*.95,Math.max(0,head.y-head.w*.65),head.w*1.9,head.w*1.9,0,0,size,size);return cv},
 build(input){const a=Wardrobe.normalize(input),root=new THREE.Group(),canvas=document.createElement('canvas');canvas.width=256;canvas.height=320;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:.02,depthWrite:false})),height=a.style===5?1.65:2.05;sprite.center.set(.5,20/640);sprite.scale.set(height*.8,height,1);sprite.position.y=0;root.add(sprite);root.userData={illustrated:true,avatar:a,signature:this.signature(a),geometrySignature:Avatar3D.geometrySignature(a),canvas,texture,sprite,frameKey:null};return root},
 animate(root,o={}){const d=root.userData,a=d.avatar,key=[this.signature(a),Math.floor((o.t||0)*24),Math.floor((o.phase||0)*32),!!o.walk,!!o.work].join('|');root.rotation.y=0;if(d.frameKey===key)return;const c=d.canvas.getContext('2d');c.clearRect(0,0,256,320);let flip=1;if(typeof Farm3D!=='undefined'&&Farm3D.active){const p=Scene.player;flip=Math.sin(Farm3D.yaw)*(p.vy||0)-Math.cos(Farm3D.yaw)*(p.vx||0)>0?-1:1;if(p.speed<.03)flip=d.lastFlip||1;d.lastFlip=flip}if(this.draw(c,128,310,320,a,{...o,flip})){d.texture.needsUpdate=true;d.frameKey=key}},
};

const IllustratedAnimals={
 cache:new Map(),
 species(e){return({'🐄':'cow','🐃':'buffalo','🐷':'pig','🐐':'goat','🐑':'sheep','🐕':'dog','🐈':'cat','🐔':'hen','🦆':'duck','🦢':'crane','🐝':'bee-animal','🦋':'butterfly'})[e.e]||Art.emoji.get(e.e)||'cow'},
 draw(c,e,x,y,size,t){const id=this.species(e),meta=ILLUSTRATED_ART.animals[id];if(!meta)return false;const image=IllustratedAvatar.load(meta.file);if(!image)return false;const reduced=!!S.fx.reduceMotion,phase=(e.phase||0)*Math.PI*2,blend=e.moveBlend||0,flip=(e.turn??e.face??1)<0?-1:1,scale=Math.min(size/meta.w,size/meta.h),w=meta.w*scale,h=meta.h*scale;c.save();c.translate(x,y);c.scale(flip,1);
  const insect=['bee-animal','butterfly'].includes(id),bob=reduced?0:insect?Math.sin(t*4+(e.x||0))*size*.025:e.water?Math.sin(t*2+(e.x||0))*size*.012:Math.abs(Math.sin(phase))*size*.014*blend;c.translate(0,-bob);
  if(insect){if(!reduced)c.rotate(Math.sin(t*(id==='butterfly'?8:24))*.045);c.drawImage(image,-w/2,-h,w,h)}else if(blend>.05&&!reduced&&!e.water){const split=meta.h*(['hen','duck','crane'].includes(id)?.69:.70),topH=h*split/meta.h;c.drawImage(image,0,0,meta.w,split,-w/2,-h,w,topH);for(let i=0;i<2;i++){const dy=Math.sin(phase+i*Math.PI)*size*.035*blend;c.drawImage(image,i*meta.w/2,split,meta.w/2,meta.h-split,-w/2+i*w/2,-h+topH,w/2,h-topH+dy)}}else{if(e.water&&['duck','crane'].includes(id))c.drawImage(image,0,0,meta.w,meta.h*.88,-w/2,-h*.88,w,h*.88);else c.drawImage(image,-w/2,-h,w,h)}c.restore();return true;
 },
 build(e){const root=new THREE.Group(),canvas=document.createElement('canvas');canvas.width=canvas.height=192;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;const id=this.species(e),large=['cow','buffalo'].includes(id),insect=['bee-animal','butterfly'].includes(id),height=insect?.43:large?1.05:id==='crane'?1.05:.78,sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:.02,depthWrite:false}));sprite.center.set(.5,.06);sprite.scale.set(height,height,1);root.add(sprite);root.userData={illustratedAnimal:true,species:id,canvas,texture,sprite,frameKey:null};return root},
 animate(root,e,t,dt){const d=root.userData,key=[Math.floor(t*20),Math.floor((e.phase||0)*24),e.turn<0].join('|');root.rotation.y=0;if(d.frameKey===key)return;const c=d.canvas.getContext('2d');c.clearRect(0,0,192,192);if(this.draw(c,e,96,181,170,t)){d.texture.needsUpdate=true;d.frameKey=key}},
};

const previousIllustratedIcon=Art.icon.bind(Art),previousIllustratedDraw=Art.draw.bind(Art);
Art.icon=(id,label='',cls='')=>ILLUSTRATED_ART.animals[id]?`<img class="game-icon ${cls}" src="${ILLUSTRATED_ART.animals[id].file}" alt="${label}" title="${label}" draggable="false" loading="lazy">`:previousIllustratedIcon(id,label,cls);
Art.draw=(c,id,x,y,w,h=w,anchor=.5,flip=false)=>{const meta=ILLUSTRATED_ART.animals[id];if(!meta)return previousIllustratedDraw(c,id,x,y,w,h,anchor,flip);const image=IllustratedAvatar.load(meta.file);if(!image)return previousIllustratedDraw(c,id,x,y,w,h,anchor,flip);const scale=Math.min(w/meta.w,h/meta.h),dw=meta.w*scale,dh=meta.h*scale;c.save();c.translate(x,y);if(flip)c.scale(-1,1);c.drawImage(image,-dw/2,-dh*anchor,dw,dh);c.restore();return true};

const meshAvatarBuild=Avatar3D.build.bind(Avatar3D),meshAvatarAnimate=Avatar3D.animate.bind(Avatar3D),meshAvatarDraw=Avatar3D.draw.bind(Avatar3D),meshAvatarDispose=Avatar3D.dispose.bind(Avatar3D);
Avatar3D.signature=input=>IllustratedAvatar.signature(input);
Avatar3D.build=input=>IllustratedAvatar.build(input);
Avatar3D.animate=(root,o)=>root.userData.illustrated?IllustratedAvatar.animate(root,o):meshAvatarAnimate(root,o);
Avatar3D.draw=(...args)=>IllustratedAvatar.draw(...args);
Avatar3D.optionIcon=(input,key,size)=>IllustratedAvatar.icon(input,key,size);
Avatar3D.dispose=root=>{if(root.userData.illustrated){root.userData.texture.dispose();root.userData.sprite.material.dispose()}else meshAvatarDispose(root)};
Wardrobe.draw=(...args)=>IllustratedAvatar.draw(...args);
AvatarAssets.capture=(input,o={},width=320)=>IllustratedAvatar.capture(input,o,width);
const previousAnimalBuild=Animal3D.build.bind(Animal3D),previousAnimalAnimate=Animal3D.animate.bind(Animal3D),previousAnimalDispose=Animal3D.dispose.bind(Animal3D);
Animal3D.build=e=>IllustratedAnimals.build(e);Animal3D.animate=(root,e,t,dt)=>root.userData.illustratedAnimal?IllustratedAnimals.animate(root,e,t,dt):previousAnimalAnimate(root,e,t,dt);
Animal3D.draw=(...args)=>IllustratedAnimals.draw(...args);Animal3D.dispose=root=>{if(root.userData.illustratedAnimal){root.userData.texture.dispose();root.userData.sprite.material.dispose()}else previousAnimalDispose(root)};
IllustratedAvatar.criticalPromise=IllustratedAvatar.ready(S.av).then(()=>{for(let style=0;style<6;style++)IllustratedAvatar.ready({...S.av,style}).catch(()=>{});for(const m of Object.values(ILLUSTRATED_ART.animals))IllustratedAvatar.load(m.file)}).catch(error=>console.error(error.message));
