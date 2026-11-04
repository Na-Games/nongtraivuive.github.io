'use strict';
/* One skinned draw per cutout. Static art stays on the GPU; joints animate continuously. */
const ActorRig={
 animalTextures:new Map(),toolTextures:new Map(),
 smooth(a,b,v){const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t)},
 texture(image){const t=new THREE.CanvasTexture(image);t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;return t},
 bone(list,name,x,y,parent,unit){const b=new THREE.Bone();b.name=name;b.userData.pixel={x,y};const p=parent?.userData.pixel||{x:256,y:620};b.position.set((x-p.x)*unit,(p.y-y)*unit,0);parent?.add(b);list.push(b);return b},
 skin(root,image,width,height,unit,bones,weight,texture,anchor={x:256,y:620}){
  const geometry=new THREE.PlaneGeometry(width*unit,height*unit,24,32);geometry.translate((width/2-anchor.x)*unit,(anchor.y-height/2)*unit,0);
  const pos=geometry.attributes.position,indices=[],weights=[];
  for(let i=0;i<pos.count;i++){const x=pos.getX(i)/unit+anchor.x,y=anchor.y-pos.getY(i)/unit,w=weight(x,y);for(let j=0;j<4;j++){indices.push(w[j]?.[0]||0);weights.push(w[j]?.[1]||0)}}
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
  const map=texture||this.texture(image),material=new THREE.MeshBasicMaterial({map,transparent:true,alphaTest:.025,depthWrite:false,side:THREE.DoubleSide}),mesh=new THREE.SkinnedMesh(geometry,material);
  material.forceSinglePass=true;mesh.add(bones[0]);mesh.bind(new THREE.Skeleton(bones));mesh.frustumCulled=false;root.add(mesh);Object.assign(root.userData,{mesh,bones,ownedTexture:!texture,unit,textureUploads:1});return mesh;
 },
 clear(root){const d=root.userData;if(d.mesh){d.mesh.skeleton.dispose();d.mesh.geometry.dispose();d.mesh.material.dispose();if(d.ownedTexture)d.mesh.material.map.dispose();root.remove(d.mesh);d.mesh=null}if(d.prop){d.prop.geometry.dispose();d.prop.material.dispose();d.prop=null}if(d.drops){d.drops.geometry.dispose();d.drops.material.dispose();d.drops=null}d.tool=null},
 human(input){const a=Wardrobe.normalize(input),root=new THREE.Group();root.userData={illustrated:true,gpuRig:true,avatar:a,signature:IllustratedAvatar.signature(a),geometrySignature:Avatar3D.geometrySignature(a),lastFlip:1};this.prepareHuman(root);return root},
 prepareHuman(root){
  const d=root.userData,v=IllustratedAvatar.compose(d.avatar);if(!v)return false;this.clear(root);
  const m=v.meta,b=m.bounds,c=b.x+b.w/2,h=d.avatar.style===5?1.65:2.05,u=h/640,headCut=m.head.y+m.head.w*1.02,elbow=m.shoulder+(m.hand-m.shoulder)*.52,knee=m.hip+(620-m.hip)*.52,B=[];
  const hip=this.bone(B,'hips',256,m.hip,null,u),spine=this.bone(B,'spine',256,m.hip-12,hip,u),head=this.bone(B,'head',m.head.x,headCut,spine,u);
  const arms=[],legs=[];
  for(const side of [-1,1]){const x=c+side*b.w*.25,upper=this.bone(B,'arm'+side,x,m.shoulder,spine,u),lower=this.bone(B,'forearm'+side,x,elbow,upper,u);arms.push({upper,lower,ui:B.indexOf(upper),li:B.indexOf(lower)})}
  for(const side of [-1,1]){const x=c+side*b.w*.14,upper=this.bone(B,'thigh'+side,x,m.hip,hip,u),lower=this.bone(B,'shin'+side,x,knee,upper,u),foot=this.bone(B,'foot'+side,x,598,lower,u);legs.push({upper,lower,foot,ui:B.indexOf(upper),li:B.indexOf(lower),fi:B.indexOf(foot),upperLength:(knee-m.hip)*u,lowerLength:(598-knee)*u,soleLength:22*u})}
  this.skin(root,v.cv,512,640,u,B,(x,y)=>{
   if(y<headCut+8){const mix=this.smooth(headCut-10,headCut+8,y);return[[2,1-mix],[1,mix]]}
   const edge=b.w*(.22+(y-m.shoulder)/(m.hand-m.shoulder)*.09);
   if(y>=m.shoulder&&y<=m.hand&&Math.abs(x-c)>edge){const a=arms[x<c?0:1],k=this.smooth(elbow-13,elbow+13,y);return[[a.ui,1-k],[a.li,k]]}
   if(y>m.hip){const l=legs[x<c?0:1],k=this.smooth(knee-16,knee+16,y),f=this.smooth(592,604,y),hipMix=this.smooth(m.hip,m.hip+15,y);return[[l.ui,(1-k)*hipMix],[l.li,k*(1-f)*hipMix],[l.fi,f*hipMix],[0,1-hipMix]]}
   return[[1,1]];
  });Object.assign(d,{hip,spine,head,arms,legs,hipY:hip.position.y,armRest:arms.map(a=>a.upper.position.clone())});return true;
 },
 facing(d,wanted,dt){if(wanted&&wanted!==d.lastFlip){d.turnAge=(d.turnAge||0)+dt;if(d.turnAge>.10){d.lastFlip=wanted;d.turnAge=0}}else d.turnAge=0;return d.lastFlip||1},
 animateHuman(root,o={}){
  const d=root.userData;if(!d.mesh&&!this.prepareHuman(root))return;const mesh=d.mesh,dt=clamp(o.dt||1/60,.001,.1),reduced=!!S.fx.reduceMotion,t=o.t||0,p=Scene.player;
  const visible=Farm3D.project(root.position.x,root.position.z,root.position.y);root.visible=visible.x> -150&&visible.x<innerWidth+150&&visible.y> -150&&visible.y<innerHeight+200;if(!root.visible)return;
  root.rotation.y=0;mesh.quaternion.copy(Farm3D.camera.quaternion);
  const side=Math.sin(Farm3D.yaw)*(p.vy||0)-Math.cos(Farm3D.yaw)*(p.vx||0),flip=this.facing(d,Math.abs(side)>.035?(side>0?-1:1):0,dt);mesh.scale.x=flip;
  const desired=reduced?0:o.blend??(o.walk?1:0);d.blend=reduced?0:(d.blend||0)+(desired-(d.blend||0))*(1-Math.exp(-12*dt));d.run=(d.run||0)+((o.run?1:0)-(d.run||0))*(1-Math.exp(-7*dt));
  const phase=(o.phase||0)*Math.PI*2,wave=Math.sin(phase),move=d.blend,run=d.run,jump=o.jump&&!reduced?Math.sin(clamp(o.phase||0,0,1)*Math.PI):0;
  mesh.position.y=jump*.38+Math.abs(Math.sin(phase*2))*.016*move;
  const idle=reduced?0:1-move;
  d.hip.position.y=d.hipY-Math.min(.09,d.blend*.09)+Math.sin(t*2.1)*.003*idle;d.spine.scale.y=1+Math.sin(t*2.1)*.003*idle;d.spine.rotation.z=-.045*run*move+wave*.018*move+Math.sin(t*1.15)*.012*idle;d.head.rotation.z=-d.spine.rotation.z*.45+Math.sin(t*.85)*.018*idle;
  for(let i=0;i<2;i++){const s=i?1:-1,v=wave*s,a=d.arms[i],l=d.legs[i];a.upper.rotation.z=-v*(.29+run*.16)*move+Math.sin(t*1.7+i)*.018*idle;a.lower.rotation.z=(-.09-run*.23)*move;l.upper.rotation.set(0,0,v*(.37+run*.18)*move);l.lower.rotation.set(0,0,-Math.max(0,-v)*(.42+run*.25)*move);l.lower.scale.y=1;
   if(jump){a.upper.rotation.z+=s*jump*.22;l.upper.rotation.z+=jump*.14;l.lower.rotation.z-=jump*.30}
  }
  const work=o.work||o.fishing;d.workBlend=(d.workBlend||0)+((work?1:0)-(d.workBlend||0))*(1-Math.exp(-14*dt));
  if(d.workBlend>.005){const a=d.arms[1],clock=o.actionTime??t,w=reduced?0:Math.sin(clock*5),amount=d.workBlend;d.spine.rotation.z+=(-.04+w*.035)*amount;a.upper.rotation.z+=(-.35+w*.32)*amount;a.lower.rotation.z+=(-.24+w*.22)*amount;d.arms[0].upper.rotation.z+=(.16+w*.10)*amount}
  const joints=[d.spine,d.head,...d.arms.flatMap(a=>[a.upper,a.lower]),...d.legs.flatMap(l=>[l.upper,l.lower])];d.poseState??=joints.map(j=>j.rotation.z);const ease=reduced?1:1-Math.exp(-22*dt);for(let i=0;i<joints.length;i++){d.poseState[i]+=(joints[i].rotation.z-d.poseState[i])*ease;joints[i].rotation.z=d.poseState[i]}
  if(typeof GroundedGait!=='undefined')GroundedGait.human(root,o,dt);this.tool(root,o);d.animationFrames=(d.animationFrames||0)+1;
 },
 tool(root,o){
  const d=root.userData,action=o.work?(o.action||'hoe'):o.fishing?'fish':null;
  if(!d.prop){const geometry=new THREE.PlaneGeometry(.46,.66),material=new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide});d.prop=new THREE.Mesh(geometry,material);const arm=d.arms[1];arm.lower.add(d.prop);d.prop.position.set(.12,-(d.avatar?ILLUSTRATED_ART.bodies[d.avatar.style+'-'+d.avatar.shirtStyle].hand-ILLUSTRATED_ART.bodies[d.avatar.style+'-'+d.avatar.shirtStyle].shoulder:100)*d.unit*.35,.004)}
  d.prop.visible=!!action;if(!action)return;
  if(d.tool!==action){d.tool=action;d.prop.material.map=this.toolTexture(action);d.prop.material.needsUpdate=true}d.prop.rotation.z=action==='hoe'?-.3:action==='water'?-.12:0;
  if(action==='water'&&!d.drops){d.drops=new THREE.InstancedMesh(new THREE.SphereGeometry(.008,4,3),new THREE.MeshBasicMaterial({color:'#b7e8ec',transparent:true,opacity:.7,depthWrite:false}),8);d.drops.frustumCulled=false;d.prop.add(d.drops);d.dropMatrix=new THREE.Matrix4()}
  if(d.drops){d.drops.visible=action==='water';if(d.drops.visible){for(let i=0;i<8;i++){const a=S.fx.reduceMotion?i/8:((o.t||0)*1.8+i/8)%1;d.dropMatrix.makeTranslation(.17+a*.08,-.07-a*.32,.006);d.drops.setMatrixAt(i,d.dropMatrix)}d.drops.instanceMatrix.needsUpdate=true}}
 },
 toolTexture(action){if(this.toolTextures.has(action))return this.toolTextures.get(action);const cv=document.createElement('canvas');cv.width=128;cv.height=184;const c=cv.getContext('2d');c.lineCap='round';
  if(action==='water'){c.fillStyle='#78b0ba';c.beginPath();c.roundRect(26,71,61,46,10);c.fill();c.strokeStyle='#badbdb';c.lineWidth=7;c.strokeRect(40,53,31,24);c.beginPath();c.moveTo(84,78);c.lineTo(116,95);c.stroke();c.fillStyle='#ceeef0';for(let i=0;i<4;i++){c.beginPath();c.ellipse(111+i*3,111+i*11,2,4,.2,0,7);c.fill()}}
  else if(action==='plant'||action==='fertilize'){c.fillStyle=action==='plant'?'#80a85c':'#bd9c69';c.beginPath();c.roundRect(38,70,48,61,8);c.fill();c.fillStyle='#e7cf85';for(let i=0;i<5;i++){c.beginPath();c.arc(95+i*4,123+i*9,2,0,7);c.fill()}}
  else if(action==='fish'){c.strokeStyle='#917047';c.lineWidth=4;c.beginPath();c.moveTo(100,150);c.quadraticCurveTo(82,40,7,5);c.stroke()}
  else{c.strokeStyle='#9b713f';c.lineWidth=7;c.beginPath();c.moveTo(69,12);c.lineTo(47,164);c.stroke();c.fillStyle='#8d9d95';c.beginPath();c.roundRect(17,150,62,18,4);c.fill()}
  const texture=this.texture(cv);this.toolTextures.set(action,texture);return texture;
 },
 animal(e){const root=new THREE.Group();root.userData={illustratedAnimal:true,gpuRig:true,species:IllustratedAnimals.species(e),lastFlip:1};this.prepareAnimal(root);return root},
 prepareAnimal(root){
  const d=root.userData,id=d.species,m=ILLUSTRATED_ART.animals[id],image=IllustratedAvatar.load(m.file);if(!image)return false;
  const insect=['bee-animal','butterfly'].includes(id),large=['cow','buffalo'].includes(id),size=insect?.43:large?1.05:id==='crane'?1.05:.78,u=size/Math.max(m.w,m.h),B=[],body=this.bone(B,'body',m.w/2,m.h*.55,null,u),head=this.bone(B,'head',m.w*.72,m.h*.38,body,u),legs=[];
  // Center the original image on the shared world-space foot anchor.
  body.position.set(0,(m.h-m.h*.55)*u,0);
  for(let i=0;i<4;i++)legs.push(this.bone(B,'leg'+i,m.w*(i+.5)/4,m.h*.73,body,u));
  const wings=[this.bone(B,'wing-left',m.w*.48,m.h*.48,body,u),this.bone(B,'wing-right',m.w*.52,m.h*.48,body,u)];
  let texture=this.animalTextures.get(id);if(!texture){texture=this.texture(image);this.animalTextures.set(id,texture)}
  const mesh=this.skin(root,image,m.w,m.h,u,B,(x,y)=>{
   if(insect){const mix=this.smooth(m.w*.04,m.w*.23,Math.abs(x-m.w/2));return[[x<m.w/2?6:7,mix],[0,1-mix]]}
   if(y>m.h*.71){const i=clamp(Math.floor(x/m.w*4),0,3),mix=this.smooth(m.h*.71,m.h*.78,y);return[[2+i,mix],[0,1-mix]]}
   const mix=this.smooth(m.w*.64,m.w*.83,x)*(1-this.smooth(m.h*.38,m.h*.59,y));return[[1,mix],[0,1-mix]];
  },texture,{x:m.w/2,y:m.h});
  Object.assign(d,{body,head,legs,wings,insect,size,bodyY:body.position.y});return true;
 },
 animateAnimal(root,e,t,dt){
  const d=root.userData;if(!d.mesh&&!this.prepareAnimal(root))return;const mesh=d.mesh,reduced=!!S.fx.reduceMotion,phase=(e.phase||0)*Math.PI*2,blend=reduced?0:e.moveBlend||0;
  const visible=Farm3D.project(e.x,e.y,root.position.y);root.visible=visible.x> -100&&visible.x<innerWidth+100&&visible.y> -100&&visible.y<innerHeight+150;if(!root.visible)return;
  mesh.quaternion.copy(Farm3D.camera.quaternion);const side=Math.sin(Farm3D.yaw)*(e.vy||0)-Math.cos(Farm3D.yaw)*(e.vx||0);mesh.scale.x=this.facing(d,Math.abs(side)>.02?(side>0?-1:1):0,dt);root.rotation.y=0;
  mesh.position.y=reduced?0:d.insect?.025*Math.sin(t*3.3+e.x):e.water?.012*Math.sin(t*2.2+e.x):Math.abs(Math.sin(phase*2))*.009*blend;
  d.body.rotation.z=reduced?0:(e.water?Math.sin(t*1.7+e.x)*.015:Math.sin(phase)*.012*blend);d.head.rotation.z=reduced?0:Math.sin(t*1.9+e.x)*.018*(1-blend)+Math.sin(phase)*.025*blend;
  d.body.scale.y=reduced?1:1+Math.sin(t*1.9+e.x)*.004*(1-blend);
  for(let i=0;i<4;i++){d.legs[i].rotation.z=Math.sin(phase+(i%2)*Math.PI)*.25*blend;d.legs[i].scale.y=e.water?.15:1}
  if(d.insect){const flap=reduced?0:Math.sin(t*(d.species==='butterfly'?12:35)+e.x)*1.05;d.wings[0].rotation.y=flap;d.wings[1].rotation.y=-flap}
  if(typeof GroundedGait!=='undefined')GroundedGait.animal(root,e,t,dt);d.animationFrames=(d.animationFrames||0)+1;
 },
 shadows(farm){
  if(!S.fx.shadow){if(this.shadowMesh)this.shadowMesh.visible=false;return}
  if(!this.shadowMesh){const cv=document.createElement('canvas');cv.width=cv.height=64;const c=cv.getContext('2d'),g=c.createRadialGradient(32,32,3,32,32,31);g.addColorStop(0,'#18241960');g.addColorStop(1,'#18241900');c.fillStyle=g;c.fillRect(0,0,64,64);this.shadowMesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:this.texture(cv),transparent:true,depthWrite:false}),128);this.shadowMesh.frustumCulled=false;this.shadowMatrix=new THREE.Matrix4();this.shadowScale=new THREE.Vector3();farm.scene.add(this.shadowMesh)}
  const mesh=this.shadowMesh;mesh.visible=true;let count=0;
  const add=(x,z,w,h)=>{if(count>=128)return;this.shadowMatrix.makeRotationX(-Math.PI/2);this.shadowMatrix.scale(this.shadowScale.set(w,h,1));this.shadowMatrix.setPosition(x,farm.walkHeight(x,z)+.025,z);mesh.setMatrixAt(count++,this.shadowMatrix)};
  if(farm.player?.visible){const p=Scene.player,jump=p.jump>0?Math.sin((1-p.jump/.65)*Math.PI):0;add(p.x,p.y,.58-jump*.16,.35-jump*.09)}
  for(const e of Scene.animals)if(!e.water&&farm.actors.get(e.k)?.visible){const id=IllustratedAnimals.species(e),w=e.fly?.18:['cow','buffalo'].includes(id)?.85:.48;add(e.x,e.y,w,w*.55)}
  mesh.count=count;mesh.instanceMatrix.needsUpdate=true;
 },
};
Avatar3D.build=input=>ActorRig.human(input);
Avatar3D.animate=(root,o)=>root.userData.gpuRig?ActorRig.animateHuman(root,o):IllustratedAvatar.animate(root,o);
const previousRigColors=Avatar3D.updateColors.bind(Avatar3D);
Avatar3D.updateColors=(root,input)=>{if(!root.userData.gpuRig)return previousRigColors(root,input);root.userData.avatar=Wardrobe.normalize(input);root.userData.signature=IllustratedAvatar.signature(input);ActorRig.prepareHuman(root)};
Avatar3D.dispose=root=>ActorRig.clear(root);
Animal3D.build=e=>ActorRig.animal(e);Animal3D.animate=(root,e,t,dt)=>ActorRig.animateAnimal(root,e,t,dt);Animal3D.dispose=root=>ActorRig.clear(root);
