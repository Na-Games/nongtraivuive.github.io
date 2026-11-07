'use strict';
/* One skinned draw per cutout. Static art stays on the GPU; joints animate continuously. */
const ActorRig={
 animalTextures:new Map(),toolTextures:new Map(),
 smooth(a,b,v){const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t)},
 texture(image){const t=new THREE.CanvasTexture(image);t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;return t},
 bone(list,name,x,y,parent,unit){const b=new THREE.Bone();b.name=name;b.userData.pixel={x,y};const p=parent?.userData.pixel||{x:256,y:620};b.position.set((x-p.x)*unit,(p.y-y)*unit,0);parent?.add(b);list.push(b);return b},
 normalizeWeights(w){
  let sum=0;for(let j=0;j<4;j++)sum+=w[j]?.[1]||0;
  const inv=sum>1e-6?1/sum:0;
  return inv?[[w[0]?.[0]||0,(w[0]?.[1]||0)*inv],[w[1]?.[0]||0,(w[1]?.[1]||0)*inv],[w[2]?.[0]||0,(w[2]?.[1]||0)*inv],[w[3]?.[0]||0,(w[3]?.[1]||0)*inv]]:[[0,1],[0,0],[0,0],[0,0]];
 },
 segmentedSkin(root,image,width,height,unit,bones,parts,texture,anchor={x:256,y:620}){
  const positions=[],normals=[],uvs=[],skinIndices=[],skinWeights=[],indexArray=[];
  let vertexOffset=0;
  for(const part of parts){
   const nx=part.nx||8,ny=part.ny||12,y0=part.y0,y1=part.y1,zBase=part.z||0,arch=part.arch||.003;
   for(let iy=0;iy<=ny;iy++){
    const v=iy/ny,y=y0+(y1-y0)*v,x0=typeof part.x0==='function'?part.x0(y):part.x0,x1=typeof part.x1==='function'?part.x1(y):part.x1;
    for(let ix=0;ix<=nx;ix++){
     const u=ix/nx,x=x0+(x1-x0)*u,z=zBase+Math.sin(u*Math.PI)*arch;
     positions.push((x-anchor.x)*unit,(anchor.y-y)*unit,z);
     normals.push(0,0,1);
     uvs.push(clamp(x/width,0,1),clamp(1-y/height,0,1));
     const nw=this.normalizeWeights(part.weight(x,y));
     for(let j=0;j<4;j++){skinIndices.push(nw[j][0]);skinWeights.push(nw[j][1])}
    }
   }
   const stride=nx+1;
   for(let iy=0;iy<ny;iy++)for(let ix=0;ix<nx;ix++){
    const a=vertexOffset+iy*stride+ix,b=a+1,c=a+stride,d=c+1;
    indexArray.push(a,c,b,b,c,d);
   }
   vertexOffset+=(nx+1)*(ny+1);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setIndex(indexArray);
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndices,4));
  geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinWeights,4));
  const map=texture||this.texture(image),material=new THREE.MeshBasicMaterial({map,transparent:true,alphaTest:.025,depthWrite:false,side:THREE.DoubleSide}),mesh=new THREE.SkinnedMesh(geometry,material);
  material.forceSinglePass=true;mesh.add(bones[0]);mesh.bind(new THREE.Skeleton(bones));mesh.frustumCulled=false;root.add(mesh);Object.assign(root.userData,{mesh,bones,ownedTexture:!texture,unit,textureUploads:1});return mesh;
 },
 skin(root,image,width,height,unit,bones,weight,texture,anchor={x:256,y:620}){
  return this.segmentedSkin(root,image,width,height,unit,bones,[{x0:0,x1:width,y0:0,y1:height,nx:24,ny:32,z:0,weight}],texture,anchor);
 },
 clear(root){const d=root.userData;if(d.mesh){d.mesh.skeleton.dispose();d.mesh.geometry.dispose();d.mesh.material.dispose();if(d.ownedTexture)d.mesh.material.map.dispose();root.remove(d.mesh);d.mesh=null}if(d.prop){d.prop.geometry.dispose();d.prop.material.dispose();d.prop=null}if(d.drops){d.drops.geometry.dispose();d.drops.material.dispose();d.drops=null}d.tool=null},
 human(input){const a=Wardrobe.normalize(input),root=new THREE.Group();root.userData={illustrated:true,gpuRig:true,avatar:a,signature:IllustratedAvatar.signature(a),geometrySignature:Avatar3D.geometrySignature(a),lastFlip:1};this.prepareHuman(root);return root},
 prepareHuman(root){
  const d=root.userData,v=IllustratedAvatar.compose(d.avatar);if(!v)return false;this.clear(root);
  const style=clamp(d.avatar.style|0,0,5),m=v.meta,b=m.bounds,c=b.x+b.w/2,h=style===5?1.65:2.05,u=h/640,headCut=m.head.y+m.head.w*1.02,elbow=m.shoulder+(m.hand-m.shoulder)*.50,knee=m.hip+(620-m.hip)*.50,B=[];
  const leftGap=[199,197.5,191,193,200,193.5][style],rightGap=[327,323,342.5,337,328,332][style],legSplit=[256,253,263,259,255,254.5][style];
  const leftArmCut=y=>{const t=this.smooth(m.shoulder,m.shoulder+72,y);return (b.x+b.w*.235)*(1-t)+leftGap*t};
  const rightArmCut=y=>{const t=this.smooth(m.shoulder,m.shoulder+72,y);return (b.x+b.w*.765)*(1-t)+rightGap*t};
  const hip=this.bone(B,'hips',256,m.hip,null,u),spine=this.bone(B,'spine',256,m.hip-12,hip,u),head=this.bone(B,'head',m.head.x,headCut,spine,u);
  const arms=[],legs=[];
  for(const side of [-1,1]){const x=side<0?(b.x+leftGap)*.5:(rightGap+b.x+b.w)*.5,upper=this.bone(B,'arm'+side,x,m.shoulder+6,spine,u),lower=this.bone(B,'forearm'+side,x,elbow,upper,u);arms.push({upper,lower,ui:B.indexOf(upper),li:B.indexOf(lower)})}
  for(const side of [-1,1]){const x=side<0?(leftGap+legSplit)*.5:(legSplit+rightGap)*.5,upper=this.bone(B,'thigh'+side,x,m.hip,hip,u),lower=this.bone(B,'shin'+side,x,knee,upper,u),foot=this.bone(B,'foot'+side,x,598,lower,u);legs.push({upper,lower,foot,ui:B.indexOf(upper),li:B.indexOf(lower),fi:B.indexOf(foot),upperLength:(knee-m.hip)*u,lowerLength:(598-knee)*u,soleLength:22*u})}
  const armWeight=side=>(x,y)=>{
   const a=arms[side],sh=this.smooth(m.shoulder-6,m.shoulder+18,y),k=this.smooth(elbow-14,elbow+14,y);
   return[[a.ui,(1-k)*sh],[a.li,k*sh],[1,1-sh]];
  };
  const legWeight=side=>(x,y)=>{
   const l=legs[side],k=this.smooth(knee-16,knee+16,y),f=this.smooth(590,604,y),hipMix=this.smooth(m.hip,m.hip+18,y);
   return[[l.ui,(1-k)*hipMix],[l.li,k*(1-f)*hipMix],[l.fi,f*hipMix],[0,1-hipMix]];
  };
  this.segmentedSkin(root,v.cv,512,640,u,B,[
   {x0:y=>rightArmCut(y),x1:512,y0:m.shoulder-6,y1:m.hand+16,nx:6,ny:14,z:-.014,arch:.003,weight:armWeight(1)},
   {x0:legSplit,x1:y=>y<=m.hand+16?rightGap:432,y0:m.hip,y1:640,nx:8,ny:16,z:-.008,arch:.004,weight:legWeight(1)},
   {x0:y=>y<m.shoulder-6?0:leftArmCut(y),x1:y=>y<m.shoulder-6?512:rightArmCut(y),y0:headCut,y1:m.hip,nx:12,ny:14,z:0,arch:.006,weight:(x,y)=>{
    const neck=1-this.smooth(headCut,headCut+12,y),pelvis=this.smooth(m.hip-24,m.hip,y);
    return[[2,neck],[1,(1-neck)*(1-pelvis)],[0,(1-neck)*pelvis]];
   }},
   {x0:y=>y<=m.hand+16?leftGap:80,x1:legSplit,y0:m.hip,y1:640,nx:8,ny:16,z:.008,arch:.004,weight:legWeight(0)},
   {x0:0,x1:512,y0:0,y1:headCut,nx:12,ny:12,z:.014,arch:.005,weight:(x,y)=>{
    const mix=this.smooth(headCut-12,headCut,y);return[[2,1-mix],[1,mix]];
   }},
   {x0:0,x1:y=>leftArmCut(y),y0:m.shoulder-6,y1:m.hand+16,nx:6,ny:14,z:.020,arch:.003,weight:armWeight(0)},
  ]);
  Object.assign(d,{hip,spine,head,arms,legs,hipY:hip.position.y,headY:head.position.y,armRest:arms.map(a=>a.upper.position.clone())});return true;
 },
 facing(d,wanted,dt){if(wanted&&wanted!==d.lastFlip){d.turnAge=(d.turnAge||0)+dt;if(d.turnAge>.10){d.lastFlip=wanted;d.turnAge=0}}else d.turnAge=0;return d.lastFlip||1},
 animateHuman(root,o={}){
  const d=root.userData;if(!d.mesh&&!this.prepareHuman(root))return;const mesh=d.mesh,dt=clamp(o.dt||1/60,.001,.1),reduced=!!S.fx.reduceMotion,t=o.t||0,p=Scene.player;
  const visible=Farm3D.project(root.position.x,root.position.z,root.position.y);root.visible=visible.x> -150&&visible.x<innerWidth+150&&visible.y> -150&&visible.y<innerHeight+200;if(!root.visible)return;
  root.rotation.y=0;mesh.quaternion.copy(Farm3D.camera.quaternion);
  const side=Math.sin(Farm3D.yaw)*(p.vy||0)-Math.cos(Farm3D.yaw)*(p.vx||0),flip=this.facing(d,Math.abs(side)>.035?(side>0?-1:1):0,dt);mesh.scale.x=flip;
  const desired=reduced?0:o.blend??(o.walk?1:0);d.blend=reduced?0:(d.blend||0)+(desired-(d.blend||0))*(1-Math.exp(-12*dt));d.run=(d.run||0)+((o.run?1:0)-(d.run||0))*(1-Math.exp(-8*dt));
  const phase=(o.phase||0)*Math.PI*2,wave=Math.sin(phase),move=d.blend,run=d.run,jump=o.jump&&!reduced?Math.sin(clamp(o.phase||0,0,1)*Math.PI):0;
  mesh.position.y=jump*.40+Math.abs(Math.sin(phase))*(.028+.024*run)*move;
  const idle=reduced?0:1-move;
  d.hip.position.y=d.hipY-Math.min(.085,d.blend*(.060+.022*run))+Math.cos(phase*2)*.014*move+Math.sin(t*2.1)*.004*idle;
  d.hip.position.x=Math.sin(phase)*.014*move;
  d.spine.scale.y=1+Math.sin(t*2.1)*.005*idle+Math.sin(phase*2)*.008*move;
  d.spine.rotation.z=(.042+.065*run)*move+wave*(.032+.018*run)*move+Math.sin(t*1.15)*.012*idle;
  d.head.rotation.z=-d.spine.rotation.z*.45+Math.sin(phase*2-.4)*.028*move+Math.sin(t*.85)*.022*idle;
  for(let i=0;i<2;i++){
   const s=i?1:-1,v=wave*s,vLag=Math.sin(phase-.32)*s,a=d.arms[i],l=d.legs[i];
   a.upper.rotation.z=-v*(.38+run*.24)*move+s*Math.sin(t*1.7+i)*.025*idle;
   a.lower.rotation.z=(.16+run*.32+Math.max(0,-vLag)*(.32+run*.24))*move+(.05+Math.sin(t*1.7+i)*.02)*idle;
   l.upper.rotation.set(0,0,v*(.42+run*.20)*move);
   l.lower.rotation.set(0,0,-Math.max(0,-v)*(.55+run*.28)*move);
   l.lower.scale.y=1;
   if(jump){a.upper.rotation.z+=(i?.38:-.32)*jump;a.lower.rotation.z+=.42*jump;l.upper.rotation.z+=(i?.42:.24)*jump;l.lower.rotation.z-=jump*(.68+(i?.15:0))}
  }
  const work=o.work||o.fishing;d.workBlend=(d.workBlend||0)+((work?1:0)-(d.workBlend||0))*(1-Math.exp(-14*dt));
  if(d.workBlend>.005){const a=d.arms[1],clock=o.actionTime??t,w=reduced?0:Math.sin(clock*5.5),amount=d.workBlend;d.spine.rotation.z+=(.12-w*.06)*amount;d.head.rotation.z+=(.08-w*.04)*amount;a.upper.rotation.z+=(.48+w*.28)*amount;a.lower.rotation.z+=(.36+w*.22)*amount;d.arms[0].upper.rotation.z+=(-.18+w*.12)*amount;d.arms[0].lower.rotation.z+=.22*amount}
  const joints=[d.spine,d.head,...d.arms.flatMap(a=>[a.upper,a.lower]),...d.legs.flatMap(l=>[l.upper,l.lower])];d.poseState??=joints.map(j=>j.rotation.z);const ease=reduced?1:1-Math.exp(-22*dt);for(let i=0;i<joints.length;i++){d.poseState[i]+=(joints[i].rotation.z-d.poseState[i])*ease;joints[i].rotation.z=d.poseState[i]}
  if(typeof GroundedGait!=='undefined')GroundedGait.human(root,o,dt);this.tool(root,o);d.animationFrames=(d.animationFrames||0)+1;
 },
 tool(root,o){
  const d=root.userData,action=o.work?(o.action||'hoe'):o.fishing?'fish':null;
  if(!d.prop){const geometry=new THREE.PlaneGeometry(.46,.66),material=new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide});d.prop=new THREE.Mesh(geometry,material);const arm=d.arms[1];arm.lower.add(d.prop);d.prop.position.set(.14,-(d.avatar?ILLUSTRATED_ART.bodies[d.avatar.style+'-'+d.avatar.shirtStyle].hand-ILLUSTRATED_ART.bodies[d.avatar.style+'-'+d.avatar.shirtStyle].shoulder:100)*d.unit*.34,.028)}
  d.prop.visible=!!action;if(!action)return;
  if(d.tool!==action){d.tool=action;d.prop.material.map=this.toolTexture(action);d.prop.material.needsUpdate=true}d.prop.rotation.z=action==='hoe'?-.25:action==='water'?-.08:0;
  if(action==='water'&&!d.drops){d.drops=new THREE.InstancedMesh(new THREE.SphereGeometry(.009,4,3),new THREE.MeshBasicMaterial({color:'#b7e8ec',transparent:true,opacity:.78,depthWrite:false}),8);d.drops.frustumCulled=false;d.prop.add(d.drops);d.dropMatrix=new THREE.Matrix4()}
  if(d.drops){d.drops.visible=action==='water';if(d.drops.visible){for(let i=0;i<8;i++){const a=S.fx.reduceMotion?i/8:((o.t||0)*2.1+i/8)%1;d.dropMatrix.makeTranslation(.17+a*.09,-.07-a*.34,.008);d.drops.setMatrixAt(i,d.dropMatrix)}d.drops.instanceMatrix.needsUpdate=true}}
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
  const insect=['bee-animal','butterfly'].includes(id),large=['cow','buffalo'].includes(id),size=insect?.43:large?1.05:id==='crane'?1.05:.78,u=size/Math.max(m.w,m.h),B=[],body=this.bone(B,'body',m.w/2,m.h*.55,null,u),head=this.bone(B,'head',m.w*.64,m.h*.36,body,u),legs=[];
  body.position.set(0,(m.h-m.h*.55)*u,0);
  for(let i=0;i<4;i++)legs.push(this.bone(B,'leg'+i,m.w*(i+.5)/4,m.h*.70,body,u));
  const wings=[this.bone(B,'wing-left',m.w*.48,m.h*.44,body,u),this.bone(B,'wing-right',m.w*.54,m.h*.48,body,u)];
  let texture=this.animalTextures.get(id);if(!texture){texture=this.texture(image);this.animalTextures.set(id,texture)}
  this.skin(root,image,m.w,m.h,u,B,(x,y)=>{
   if(insect){const nx=x/m.w,ny=y/m.h,inWing=(1-this.smooth(.56,.68,nx))*(1-this.smooth(.52,.78,ny)),upper=1-this.smooth(.34,.52,ny);return[[6,inWing*upper],[7,inWing*(1-upper)],[0,1-inWing]]}
   if(y>m.h*.68){const i=clamp(Math.floor(x/m.w*4),0,3),mix=this.smooth(m.h*.68,m.h*.76,y);return[[2+i,mix],[0,1-mix]]}
   const mix=this.smooth(m.w*.56,m.w*.80,x)*(1-this.smooth(m.h*.36,m.h*.58,y));return[[1,mix],[0,1-mix]];
  },texture,{x:m.w/2,y:m.h});
  Object.assign(d,{body,head,legs,wings,insect,size,bodyY:body.position.y});return true;
 },
 animateAnimal(root,e,t,dt){
  const d=root.userData;if(!d.mesh&&!this.prepareAnimal(root))return;const mesh=d.mesh,reduced=!!S.fx.reduceMotion,phase=(e.phase||0)*Math.PI*2,blend=reduced?0:e.moveBlend||0;
  const visible=Farm3D.project(e.x,e.y,root.position.y);root.visible=visible.x> -100&&visible.x<innerWidth+100&&visible.y> -100&&visible.y<innerHeight+150;if(!root.visible)return;
  mesh.quaternion.copy(Farm3D.camera.quaternion);const side=Math.sin(Farm3D.yaw)*(e.vy||0)-Math.cos(Farm3D.yaw)*(e.vx||0);mesh.scale.x=this.facing(d,Math.abs(side)>.02?(side>0?-1:1):0,dt);root.rotation.y=0;
  mesh.position.y=reduced?0:d.insect?.032*Math.sin(t*3.6+e.x):e.water?.016*Math.sin(t*2.4+e.x):Math.abs(Math.sin(phase*2))*.024*blend;
  d.body.rotation.z=reduced?0:(e.water?Math.sin(t*1.9+e.x)*.022:Math.sin(phase)*.032*blend);d.head.rotation.z=reduced?0:Math.sin(t*1.9+e.x)*.035*(1-blend)+Math.sin(phase)*.065*blend;
  d.body.scale.y=reduced?1:1+Math.sin(t*2.1+e.x)*.007*(1-blend);
  for(let i=0;i<4;i++){d.legs[i].rotation.z=Math.sin(phase+(i%2)*Math.PI)*.38*blend;d.legs[i].scale.y=e.water?.15:1}
  if(d.insect){const flap=reduced?0:Math.sin(t*(d.species==='butterfly'?12:35)+e.x)*1.05;d.wings[0].rotation.y=flap;d.wings[1].rotation.y=-flap;d.wings[0].rotation.z=flap*.48;d.wings[1].rotation.z=-flap*.36}
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
