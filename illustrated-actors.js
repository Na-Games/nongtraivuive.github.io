'use strict';
const IllustratedClips={
 draw(c,meta,state,phase,x,y,h,flip=1,animal=false){if(!meta)return false;const row=meta.states.indexOf(state);if(row<0)return false;const image=IllustratedAvatar.load(meta.file);if(!image)return false;const frame=((Math.floor(phase*meta.frames)%meta.frames)+meta.frames)%meta.frames,w=h*meta.w/meta.h;c.save();c.translate(x,y);c.scale(flip,1);c.drawImage(image,frame*meta.w,row*meta.h,meta.w,meta.h,-w/2,-h*(animal?155/160:620/640),w,h);c.restore();return true},
};
/* Production cutouts matching the approved storybook artwork. One wardrobe everywhere. */
const IllustratedAvatar={
 version:6,images:new Map(),pending:new Map(),failed:new Set(),cache:new Map(),listeners:new Set(),
 load(file){if(this.images.has(file))return this.images.get(file);if(!this.pending.has(file)&&!this.failed.has(file)){const promise=new Promise(resolve=>{const image=new Image();image.onload=()=>{this.images.set(file,image);this.pending.delete(file);for(const fn of this.listeners)fn();if(typeof drawHudAvatar==='function')drawHudAvatar();resolve(image)};image.onerror=()=>{this.failed.add(file);this.pending.delete(file);resolve(null)};image.src=file});this.pending.set(file,promise)}return null},
 files(input,pose='standing'){const a=Wardrobe.normalize(input),b=(pose==='seated'&&typeof SEATED_ART!=='undefined'?SEATED_ART:ILLUSTRATED_ART).bodies[a.style+'-'+a.shirtStyle];return[b.file,b.skin,b.cloth,ILLUSTRATED_ART.hair[a.hairStyle].file,...(a.hat==='none'?[]:[ILLUSTRATED_ART.hats[a.hat].file])]},
 async ready(input,pose='standing'){const files=this.files(input,pose);for(const f of files)this.load(f);await Promise.all(files.map(f=>this.pending.get(f)));if(files.some(f=>!this.images.has(f)))throw Error('Không tải được bộ ảnh nhân vật. Hãy tải lại game.');return this.compose(input,pose)},
 signature(input){const a=Wardrobe.normalize(input);return['illustrated-v6',a.style,a.skin,a.hair,a.outfit,a.hairStyle,a.shirtStyle,a.hat].join('|')},
 tintLayer(image,color){const cv=document.createElement('canvas');cv.width=image.naturalWidth||image.width;cv.height=image.naturalHeight||image.height;const c=cv.getContext('2d');c.drawImage(image,0,0);c.globalCompositeOperation='multiply';c.fillStyle=color;c.fillRect(0,0,cv.width,cv.height);c.globalCompositeOperation='destination-in';c.drawImage(image,0,0);return cv},
 tintBody(image,skinMask,clothMask,a){const cv=document.createElement('canvas');cv.width=512;cv.height=640;const c=cv.getContext('2d');c.drawImage(image,0,0);c.drawImage(this.tintLayer(skinMask,a.skin),0,0);c.drawImage(this.tintLayer(clothMask,a.outfit),0,0);return cv},
 tintHair(image,color){const cv=document.createElement('canvas');cv.width=image.naturalWidth||image.width;cv.height=image.naturalHeight||image.height;const c=cv.getContext('2d');c.filter='grayscale(1) brightness(2.7)';c.drawImage(image,0,0);c.filter='none';return this.tintLayer(cv,color)},
 compose(input,pose='standing'){const a=Wardrobe.normalize(input),key=this.signature(a)+(pose==='seated'?'|seated':'');if(this.cache.has(key))return this.cache.get(key);const files=this.files(a,pose),images=files.map(f=>this.load(f));if(images.some(im=>!im))return null;
  const meta=(pose==='seated'&&typeof SEATED_ART!=='undefined'?SEATED_ART:ILLUSTRATED_ART).bodies[a.style+'-'+a.shirtStyle],cv=this.tintBody(images[0],images[1],images[2],a),c=cv.getContext('2d'),head=meta.head;
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
 paint(c,value,o={}){const reduced=!!S.fx.reduceMotion&&!o.exportPose,t=o.work?(o.actionTime??o.t??0):(o.t||0),moving=!!o.walk&&!reduced,phase=(o.phase||0)*Math.PI*2,blend=o.blend??1,wave=Math.sin(phase+.25)*blend;
  if(value.meta.pose==='seated'){const seat=value.meta.seat,angle=reduced?0:Math.sin(t*(o.reel?6:1.5))*(o.reel?.012:.003),breath=reduced?0:Math.sin(t*2)*.6;c.save();c.translate(seat.x,seat.y+breath);c.rotate(angle);c.drawImage(value.cv,-seat.x,-seat.y);c.restore();return}
  if(!moving&&!o.work&&!o.fishing&&!o.jump){c.save();const breath=reduced?0:Math.sin(t*2.1)*.0025;c.translate(0,620);c.scale(1,1+breath);c.drawImage(value.cv,0,-620);c.restore();return}
  const rig=this.rig(value),angles=[0,0,0,0,0,0];if(moving){angles[2]=-wave*.24;angles[3]=wave*.24;angles[4]=wave*.18;angles[5]=-wave*.18}if(o.work&&!reduced){angles[2]=-.18+Math.sin(t*4)*.10;angles[3]=.18-Math.sin(t*4)*.10;angles[0]=.035}if(o.fishing){angles[2]=-.28-(o.reel&&!reduced?Math.sin(t*7)*.06:0);angles[3]=.13-(reduced?0:Math.sin(t*(o.reel?7:2))*(o.reel?.05:.008));angles[0]=.025+(reduced?0:Math.sin(t*2)*.006);angles[1]=reduced?0:Math.sin(t*2)*.004}
  if(o.run&&moving){angles[2]*=1.6;angles[3]*=1.6;angles[4]*=1.5;angles[5]*=1.5;angles[1]=-.025}
  c.save();if(o.jump&&!reduced)c.translate(0,-Math.sin(((o.phase||0)%1)*Math.PI)*62);if(moving)c.translate(0,-Math.abs(Math.sin(phase))*(o.run?7:3)*blend);
  const draw=i=>{const p=rig[i];c.save();c.translate(...p.pivot);c.rotate(angles[i]);c.drawImage(p.cv,-p.pivot[0],-p.pivot[1]);c.restore()};
  if(o.fishing&&o.seated){
   // The thighs fold toward the water; lower legs hang beneath the seat.
   const hip=value.meta.hip,knee=hip+(620-hip)*.48,center=value.meta.bounds.x+value.meta.bounds.w/2;
   for(let side=0;side<2;side++){const x=side?center:0,w=side?512-center:center,pivot=center+(side?1:-1)*value.meta.bounds.w*.13;
    c.save();c.translate(pivot,hip+42);c.rotate(-.95);c.drawImage(rig[4+side].cv,x,hip,w,knee-hip,x-pivot,0,w,knee-hip);c.translate(0,knee-hip-3);c.rotate(1.08);c.drawImage(rig[4+side].cv,x,knee,w,640-knee,x-pivot,0,w,640-knee);c.restore();
   }
   c.translate(0,42);for(const i of [2,3,1,0])draw(i);
  }else for(const i of [4,5,2,3,1,0])draw(i);
  if(o.work&&!o.fishing){const action=o.action||'hoe',hand=[value.meta.bounds.x+value.meta.bounds.w*.79,value.meta.hand-30],swing=reduced?0:Math.sin(t*5);c.save();c.translate(...hand);c.rotate(-.4+swing*.17);c.lineCap='round';
   if(action==='water'){c.fillStyle='#73acbd';c.beginPath();c.roundRect(-15,-14,44,32,6);c.fill();c.strokeStyle='#aacdd0';c.lineWidth=5;c.strokeRect(-5,-26,20,14);c.beginPath();c.moveTo(26,-7);c.lineTo(55,7);c.stroke();if(!reduced){c.fillStyle='#b9edee';for(let i=0;i<5;i++){const age=(t*1.5+i/5)%1;c.beginPath();c.ellipse(54+age*25,10+age*55,2,4,0,0,Math.PI*2);c.fill()}}}
   else if(action==='plant'||action==='fertilize'){c.fillStyle=action==='plant'?'#75ab5a':'#ba9a5d';c.beginPath();c.roundRect(-8,-10,29,35,5);c.fill();if(!reduced){c.fillStyle='#d7ba76';for(let i=0;i<4;i++){const a=(t*1.7+i/4)%1;c.beginPath();c.arc(24+a*14,12+a*42,2,0,Math.PI*2);c.fill()}}}
   else{c.strokeStyle='#93663c';c.lineWidth=7;c.beginPath();c.moveTo(0,-65);c.lineTo(0,80);c.stroke();c.fillStyle='#8a9b96';c.beginPath();c.roundRect(-30,64,48,18,4);c.fill()}
   c.restore();
  }c.restore();
 },
 draw(c,x,y,h,input,o={}){const value=this.compose(input,o.fishing?'seated':'standing');if(!value)return false;const width=h*.8,flip=o.flip??(o.back||o.face<0||Math.sin(o.angle||0)<-.1?-1:1);
  const clip=typeof ILLUSTRATED_CLIPS!=='undefined'?ILLUSTRATED_CLIPS.avatars[input.style]:null,state=o.jump?'jump':o.work?(o.action==='fertilize'?'care':o.action||'hoe'):o.walk?(o.run?'run':o.back?'back':'walk'):'idle';
  if(o.atlas&&!o.fishing&&clip?.signature===this.signature(input)&&IllustratedClips.draw(c,clip,state,S.fx.reduceMotion?0:o.walk||o.jump?o.phase||0:(o.t||0)*.8,x,y,h,flip))return true;
  c.save();c.translate(x,y);c.scale(flip*width/512,h/640);c.translate(-256,-620);this.paint(c,value,o);c.restore();
  if(o.fishing){const m=value.meta,grip=m.grip||{x:m.head.x+70,y:m.hand},seat=m.seat||{x:256,y:m.hip},a=S.fx.reduceMotion?0:Math.sin((o.t||0)*(o.reel?6:1.5))*(o.reel?.012:.003),dx=grip.x-seat.x,dy=grip.y-seat.y,hx=x+flip*(seat.x+dx*Math.cos(a)-dy*Math.sin(a)-256)*h/640,hy=y+(seat.y+dx*Math.sin(a)+dy*Math.cos(a)+(S.fx.reduceMotion?0:Math.sin((o.t||0)*2)*.6)-620)*h/640,casting=o.fishState==='wait'&&!S.fx.reduceMotion?clamp(((o.t||0)-(o.castAt||0))/.65,0,1):1,u=casting*casting*(3-2*casting),tx=hx+h*(.16*(1-u)-.36*u),ty=hy-h*(.60*(1-u)+.45*u)+(o.reel&&!S.fx.reduceMotion?Math.sin((o.t||0)*7)*h*.012:0);c.save();c.strokeStyle='#785535';c.lineWidth=Math.max(1.6,h*.012);c.beginPath();c.moveTo(hx,hy);c.quadraticCurveTo(hx-h*.12,ty,tx,ty);c.stroke();c.restore();if(o.rigOut)Object.assign(o.rigOut,{x:tx,y:ty,handX:hx,handY:hy})}return true;
 },
 capture(input,o={},width=512){const cv=document.createElement('canvas');cv.width=width;cv.height=Math.round(width*1.25);if(!this.draw(cv.getContext('2d'),width/2,cv.height*620/640,cv.height,input,{...o,exportPose:true}))throw Error('Bộ ảnh nhân vật đang tải. Thử lại sau một chút.');return cv},
 icon(input,key,size=64){const value=this.compose(input),cv=document.createElement('canvas');cv.width=cv.height=size;if(!value)return cv;const c=cv.getContext('2d'),head=value.meta.head;if(key==='shirtStyle')c.drawImage(value.cv,128,220,256,260,0,0,size,size);else c.drawImage(value.cv,head.x-head.w*.95,Math.max(0,head.y-head.w*.65),head.w*1.9,head.w*1.9,0,0,size,size);return cv},
 build(input){const a=Wardrobe.normalize(input),root=new THREE.Group(),canvas=document.createElement('canvas');canvas.width=256;canvas.height=320;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:.02,depthWrite:false})),height=a.style===5?1.65:2.05;sprite.center.set(.5,20/640);sprite.scale.set(height*.8,height,1);sprite.position.y=0;root.add(sprite);root.userData={illustrated:true,avatar:a,signature:this.signature(a),geometrySignature:Avatar3D.geometrySignature(a),canvas,texture,sprite,frameKey:null};return root},
 animate(root,o={}){if(typeof Farm3D!=='undefined'&&Farm3D.active){const p=Farm3D.project(root.position.x,root.position.z,root.position.y);if(p.x< -150||p.x>innerWidth+150||p.y< -150||p.y>innerHeight+200)return}const d=root.userData,a=d.avatar,key=[this.signature(a),Math.floor((o.t||0)*30),Math.floor((o.phase||0)*32),!!o.walk,!!o.work,o.action,o.run,!!o.jump].join('|');root.rotation.y=0;if(d.frameKey===key)return;const c=d.canvas.getContext('2d');c.clearRect(0,0,256,320);let flip=1;if(typeof Farm3D!=='undefined'&&Farm3D.active){const p=Scene.player;flip=Math.sin(Farm3D.yaw)*(p.vy||0)-Math.cos(Farm3D.yaw)*(p.vx||0)>0?-1:1;if(p.speed<.03)flip=d.lastFlip||1;d.lastFlip=flip}if(this.draw(c,128,310,320,a,{...o,flip,atlas:true})){d.texture.needsUpdate=true;d.frameKey=key}},
};

const IllustratedAnimals={
 cache:new Map(),
 species(e){return e.species||({'🐄':'cow','🐃':'buffalo','🐷':'pig','🐐':'goat','🐑':'sheep','🐕':'dog','🐈':'cat','🐔':'hen','🦆':'duck','🦢':'crane','🐝':'bee-animal','🦋':'butterfly'})[e.e]||Art.emoji.get(e.e)||'cow'},
 draw(c,e,x,y,size,t){const id=this.species(e),meta=ILLUSTRATED_ART.animals[id];if(!meta)return false;const image=IllustratedAvatar.load(meta.file);if(!image)return false;const reduced=!!S.fx.reduceMotion,phase=(e.phase||0)*Math.PI*2,blend=e.moveBlend||0,flip=(e.turn??e.face??1)<0?-1:1,scale=Math.min(size/meta.w,size/meta.h),w=meta.w*scale,h=meta.h*scale;c.save();c.translate(x,y);c.scale(flip,1);
  if(!e.rawPose&&typeof ILLUSTRATED_CLIPS!=='undefined'&&IllustratedClips.draw(c,ILLUSTRATED_CLIPS.animals[id],e.water?'swim':blend>.05||e.fly?'walk':'idle',reduced?0:blend>.05?e.phase||0:t*.8,0,0,size*160/115,1,true)){c.restore();return true}const insect=['bee-animal','butterfly'].includes(id),bob=reduced?0:insect?Math.sin(t*4+(e.x||0))*size*.025:e.water?Math.sin(t*2+(e.x||0))*size*.012:Math.abs(Math.sin(phase))*size*.014*blend;c.translate(0,-bob);
  if(insect){const flap=reduced?1:.60+Math.abs(Math.sin(t*(id==='butterfly'?10:31)))*.40;c.save();c.scale(flap,1);c.rotate(reduced?0:Math.sin(t*4)*.045);c.drawImage(image,-w/2,-h,w,h);c.restore()}
  else if(blend>.05&&!reduced&&!e.water){
   const split=meta.h*(['hen','duck','crane'].includes(id)?.73:.73),topH=h*split/meta.h,legH=h-topH;
   c.save();c.translate(0,-Math.abs(Math.sin(phase))*size*.006*blend);c.drawImage(image,0,0,meta.w,split,-w/2,-h,w,topH);
   // Rotate four narrow leg regions at their hips without stretching the illustration.
   for(let i=0;i<4;i++){const lx=-w/2+(i+.5)*w/4,angle=Math.sin(phase+(i%2)*Math.PI)*.13*blend;
    c.save();c.translate(lx,-h+topH-1);c.rotate(angle);c.drawImage(image,i*meta.w/4,split-2,meta.w/4,meta.h-split+2,-w/8,0,w/4,legH+2*scale);c.restore()}
   c.restore();
  }else{if(e.water&&['duck','crane'].includes(id))c.drawImage(image,0,0,meta.w,meta.h*.88,-w/2,-h*.88,w,h*.88);else{c.save();const breath=reduced?1:1+Math.sin(t*2+(e.x||0))*.003;c.scale(1,breath);c.drawImage(image,-w/2,-h,w,h);c.restore()}}c.restore();return true;
 },
 build(e){const root=new THREE.Group(),canvas=document.createElement('canvas');canvas.width=canvas.height=192;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;const id=this.species(e),large=['cow','buffalo'].includes(id),insect=['bee-animal','butterfly'].includes(id),height=insect?.43:large?1.05:id==='crane'?1.05:.78,sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:.02,depthWrite:false}));sprite.center.set(.5,.06);sprite.scale.set(height,height,1);root.add(sprite);root.userData={illustratedAnimal:true,species:id,canvas,texture,sprite,frameKey:null};return root},
 animate(root,e,t,dt){if(typeof Farm3D!=='undefined'&&Farm3D.active){const p=Farm3D.project(e.x,e.y,root.position.y);if(p.x< -100||p.x>innerWidth+100||p.y< -100||p.y>innerHeight+150)return}const d=root.userData,key=[Math.floor(t*20),Math.floor((e.phase||0)*24),e.turn<0].join('|');root.rotation.y=0;if(d.frameKey===key)return;const c=d.canvas.getContext('2d');c.clearRect(0,0,192,192);if(this.draw(c,e,96,181,170,t)){d.texture.needsUpdate=true;d.frameKey=key}},
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
const previousCanvasAnimal=Motion.animal.bind(Motion);
Motion.animal=(c,a,z,t,scene)=>{const p=scene.iso(a.x,a.y),id=IllustratedAnimals.species(a),size=(['cow','buffalo'].includes(id)?47:['bee-animal','butterfly'].includes(id)?24:35)*z;return IllustratedAnimals.draw(c,a,p.x,p.y-(a.fly?24*z:0),size,t)||previousCanvasAnimal(c,a,z,t,scene)};
IllustratedAvatar.criticalPromise=IllustratedAvatar.ready(S.av).then(()=>{if(typeof SEATED_ART!=='undefined')IllustratedAvatar.ready(S.av,'seated').catch(()=>{});for(let style=0;style<6;style++)IllustratedAvatar.ready({...S.av,style}).catch(()=>{});for(const m of Object.values(ILLUSTRATED_ART.animals))IllustratedAvatar.load(m.file)}).catch(error=>console.error(error.message));
