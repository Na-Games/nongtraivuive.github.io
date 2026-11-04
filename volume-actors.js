'use strict';
/* Map actors use real depth and rigid anatomical segments, packed into one draw call.
   The illustrated wardrobe and seated fishing artwork remain Canvas assets. */
const VolumeActors={
 material:null,
 pack(source,human){
  source.updateMatrixWorld(true);
  const root=new THREE.Group(),map=new Map([[source,root]]),bones=[],positions=[],normals=[],colors=[],indices=[],weights=[];
  root.scale.copy(source.scale);root.userData={...source.userData,volumetric:true};
  source.traverse(o=>{if(o===source||o.isMesh)return;const b=new THREE.Bone();b.name=o.name;b.position.copy(o.position);b.quaternion.copy(o.quaternion);b.scale.copy(o.scale);b.userData={...o.userData};map.set(o,b);bones.push(b);map.get(o.parent).add(b)});
  const inverse=new THREE.Matrix4().copy(source.matrixWorld).invert(),v=new THREE.Vector3();
  source.traverse(o=>{if(!o.isMesh)return;let owner=o.parent;while(!map.has(owner))owner=owner.parent;const boneIndex=Math.max(0,bones.indexOf(map.get(owner))),g=o.geometry.index?o.geometry.toNonIndexed():o.geometry,m=new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld),n=new THREE.Matrix3().getNormalMatrix(m),p=g.attributes.position,normal=g.attributes.normal,c=g.attributes.color,color=o.material.color;
   for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m);positions.push(v.x,v.y,v.z);v.fromBufferAttribute(normal,i).applyMatrix3(n).normalize();normals.push(v.x,v.y,v.z);colors.push(c?c.getX(i):color.r,c?c.getY(i):color.g,c?c.getZ(i):color.b);indices.push(boneIndex,0,0,0);weights.push(1,0,0,0)}if(g!==o.geometry)g.dispose();
  });
  const g=new THREE.BufferGeometry();for(const [key,data,size]of [['position',positions,3],['normal',normals,3],['color',colors,3],['skinWeight',weights,4]])g.setAttribute(key,new THREE.Float32BufferAttribute(data,size));g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
  this.material??=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85});const mesh=new THREE.SkinnedMesh(g,this.material);root.add(mesh);root.updateMatrixWorld(true);mesh.bind(new THREE.Skeleton(bones));mesh.castShadow=mesh.receiveShadow=true;g.computeBoundingSphere();mesh.boundingSphere=g.boundingSphere.clone();mesh.boundingSphere.radius+=human?.8:.3;
  const remap=value=>map.get(value)|| (Array.isArray(value)?value.map(remap):value);root.userData.rig=Object.fromEntries(Object.entries(source.userData.rig).map(([k,value])=>[k,remap(value)]));root.userData.mesh=mesh;root.userData.bones=bones;root.userData.blend=0;
  // Source primitives are shared. Only release per-instance batches and materials.
  const shared=new Set(Object.values(Avatar3D).filter(x=>x?.isBufferGeometry));shared.add(Animal3D.geometry);const disposed=new Set(),materials=new Set();source.traverse(o=>{if(o.geometry&&!shared.has(o.geometry)&&!disposed.has(o.geometry)){disposed.add(o.geometry);o.geometry.dispose()}if(human&&o.material)materials.add(o.material)});for(const m of materials)m.dispose();
  return root;
 },
 human(input){const root=this.pack(meshAvatarBuild(input),true),r=root.userData.rig;root.userData.ground=.047*r.body.scale.y;return root},
 animal(entity){return this.pack(previousAnimalBuild(entity),false)},
 smooth(part,key,target,dt,rate=16){part.rotation[key]+=(target-part.rotation[key])*(1-Math.exp(-rate*dt))},
 humanPose(root,o={}){
  const d=root.userData,r=d.rig,dt=Math.min(.05,o.dt||1/60),t=o.t||0,reduced=!!S.fx.reduceMotion,phase=(o.phase||0)*Math.PI*2;
  d.blend+=((!reduced&&o.walk?(o.blend??1):0)-d.blend)*(1-Math.exp(-12*dt));const blend=d.blend,run=o.run?1:0,jump=!reduced&&o.jump?Math.sin(Math.PI*(o.phase||0)):0;
  r.body.position.y=-d.ground-(.065+.03*run)*blend+Math.sin(t*1.9)*.003*(1-blend)+Math.cos(phase*2)*.009*blend+jump*.48;
  this.smooth(r.body,'x',o.work?.13:blend*(.035+.055*run),dt);this.smooth(r.body,'y',Math.sin(phase)*.035*blend,dt);this.smooth(r.body,'z',Math.sin(phase)*.015*blend,dt);
  this.smooth(r.head,'y',Math.sin(t*.7)*.075*(1-blend)-Math.sin(phase)*.025*blend,dt);this.smooth(r.head,'z',Math.sin(t*1.2)*.015*(1-blend),dt);this.smooth(r.head,'x',o.work?.12:-blend*.025,dt);this.smooth(r.hat,'z',-Math.sin(phase)*.012*blend,dt);
  for(let i=0;i<2;i++){
   const wave=Math.sin(phase+i*Math.PI);this.smooth(r.arms[i],'x',-wave*(.38+.18*run)*blend,dt);this.smooth(r.arms[i],'z',(i?1:-1)*(.08+Math.sin(t*1.7)*.008),dt);this.smooth(r.elbows[i],'x',-.12-run*.42*blend-Math.max(0,wave)*.20*blend,dt);
   if(!d.plants||o.jump){this.smooth(r.legs[i],'x',wave*.48*blend-jump*.35,dt);this.smooth(r.knees[i],'x',Math.max(0,-wave)*.8*blend+jump*.65,dt)}
  }
  for(const eye of r.eyeParts){const blink=(t+d.avatar.style*.63)%4.7,close=reduced?1:blink>4.5?1-.95*Math.sin((blink-4.5)/.2*Math.PI):1;eye.scale.y=(eye.userData.restY||1)*close}
  if(!o.jump&&!reduced)this.plant(root,o,dt);
  else d.plants=null;
  if(o.work&&!reduced){const p=(o.actionTime??t)*5,w=Math.sin(p),watering=o.action==='water';this.smooth(r.body,'x',watering?.12:.19+Math.max(0,w)*.09,dt);for(let i=0;i<2;i++){this.smooth(r.arms[i],'x',watering?-.70:-.85+w*.52,dt,22);this.smooth(r.elbows[i],'x',watering?-.50:-.65-w*.35,dt,22)}}
  for(let i=0;i<2;i++)this.smooth(r.feet[i],'x',-r.legs[i].rotation.x-r.knees[i].rotation.x,dt,30);
  this.tool(root,o,t);this.water(root,t);d.animationFrames=(d.animationFrames||0)+1;
 },
 water(root,t){
  const d=root.userData;if(d.toolKind!=='water'){if(d.drops)d.drops.visible=false;return}
  if(!d.drops){d.drops=new THREE.InstancedMesh(new THREE.SphereGeometry(.009,5,4),new THREE.MeshBasicMaterial({color:0x9bdcf1,transparent:true,opacity:.7}),12);d.drops.frustumCulled=false;root.add(d.drops)}d.drops.visible=true;root.updateMatrixWorld(true);
  const start=root.worldToLocal(d.tool.localToWorld(new THREE.Vector3(0,-.07,.23))),m=new THREE.Matrix4();for(let i=0;i<12;i++){const p=(t*2.4+i/12)%1;m.makeTranslation(start.x+Math.sin(i*4)*.018*p,start.y-.42*p*p,start.z+.15*p);d.drops.setMatrixAt(i,m)}d.drops.instanceMatrix.needsUpdate=true;
 },
 plant(root,o,dt){
  const d=root.userData,r=d.rig,blend=d.blend;if(blend<.02){d.plants=null;return}root.updateMatrixWorld(true);d.plants??=[];
  const run=clamp(((o.speed||0)-1.4)/1.4,0,1),scale=root.scale.x*r.body.scale.y,stride=(.8+.35*run)*root.scale.x*(d.avatar.style===5?.82:1),stance=.62-.14*run,heading=root.rotation.y,forward=new THREE.Vector3(Math.sin(heading),0,Math.cos(heading)),right=new THREE.Vector3(Math.cos(heading),0,-Math.sin(heading));
  for(let i=0;i<2;i++){
   const cycle=((o.phase||0)+i*.5)%1,base=root.position.clone().addScaledVector(right,(i?1:-1)*.103*root.scale.x*r.body.scale.x);base.y=Farm3D.walkHeight(base.x,base.z)+.044*scale;
   let f=d.plants[i];if(!f)f=d.plants[i]={point:base.clone(),start:base.clone(),cycle,stance:false,target:base.clone()};const down=cycle<stance;
   if((o.speed??1)<.03){f.target.copy(f.point)}else if(down){if(!f.stance||cycle<f.cycle){f.point.copy(base).addScaledVector(forward,stride*stance*.5);f.point.y=Farm3D.walkHeight(f.point.x,f.point.z)+.044*scale}f.target.copy(f.point);f.start.copy(f.point)}else{const u=(cycle-stance)/(1-stance),ease=u*u*(3-2*u),end=base.clone().addScaledVector(forward,stride*stance*.5);end.y=Farm3D.walkHeight(end.x,end.z)+.044*scale;f.target.lerpVectors(f.start,end,ease);f.target.y+=Math.sin(Math.PI*u)*(.075+(o.run?.055:0))*scale;f.point.copy(f.target)}f.cycle=cycle;f.stance=down;
   // Solve in the hip parent's coordinate system, preserving real knee bending.
   const local=r.legs[i].parent.worldToLocal(f.target.clone()).sub(r.legs[i].position),a=.285,b=.274,dist=Math.min(a+b-.002,Math.max(.10,Math.hypot(local.y,local.z))),knee=Math.PI-Math.acos(Math.max(-1,Math.min(1,(a*a+b*b-dist*dist)/(2*a*b)))),hip=Math.atan2(-local.z,-local.y)-Math.acos(Math.max(-1,Math.min(1,(a*a+dist*dist-b*b)/(2*a*dist))));
   const weight=Math.min(1,blend*2),ease=(1-Math.exp(-35*dt))*weight;r.legs[i].rotation.x+=(hip-r.legs[i].rotation.x)*ease;r.knees[i].rotation.x+=(knee-r.knees[i].rotation.x)*ease;
  }
 },
 tool(root,o,t){
  const d=root.userData,kind=o.work?(o.action==='water'?'water':'hoe'):null;if(d.toolKind!==kind){if(d.tool){d.tool.removeFromParent();d.tool.traverse(m=>{m.geometry?.dispose();m.material?.dispose()})}d.tool=null;d.toolKind=kind;if(kind){const group=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:kind==='water'?0x628e9b:0x8b6842,roughness:.8}),handle=new THREE.Mesh(new THREE.CylinderGeometry(.012,.014,kind==='water'?.24:.65,8),mat);group.add(handle);if(kind==='hoe'){const blade=new THREE.Mesh(new THREE.BoxGeometry(.18,.035,.13),new THREE.MeshStandardMaterial({color:0x687e84,roughness:.5}));blade.position.set(0,-.30,.04);group.add(blade)}else{const can=new THREE.Mesh(new THREE.CylinderGeometry(.095,.09,.14,12),mat.clone());can.position.set(0,-.07,0);group.add(can);const spout=new THREE.Mesh(new THREE.CylinderGeometry(.012,.024,.19,8),mat.clone());spout.rotation.x=-1;spout.position.set(0,-.07,.14);group.add(spout)}group.position.set(0,-.19,.03);d.rig.elbows[1].add(group);d.tool=group}}
 },
 animalPose(root,e,t,dt){
  dt=Math.min(.05,dt||1/60);previousAnimalAnimate(root,e,t,dt);const d=root.userData,r=d.rig;if(S.fx.reduceMotion)return;const blend=e.moveBlend||0,phase=(e.phase||0)*Math.PI*2;d.legAngles??=r.legs.map(()=>({hip:0,knee:0}));
  // A walk has a long ground contact and a short, bent-knee return stroke.
  for(let i=0;i<r.legs.length;i++){const offset=r.bird?i*.5:[0,.5,.75,.25][i],u=((e.phase||0)+offset)%1,stance=r.bird?.62:.68,swing=u<stance?1-2*u/stance:-1+2*((u-stance)/(1-stance)),a=d.legAngles[i],ease=1-Math.exp(-24*dt);a.hip+=(swing*(r.bird?.32:.48)*blend-a.hip)*ease;a.knee+=((u<stance?.04:Math.sin(Math.PI*(u-stance)/(1-stance))*.9)*blend-a.knee)*ease;r.legs[i].rotation.x=a.hip;if(r.knees[i])r.knees[i].rotation.x=a.knee}
  r.body.rotation.y=Math.sin(phase)*.018*blend;
  if(!r.bird&&!r.insect&&!e.water&&!e.fly){r.body.position.y-=.045*blend;this.animalPlant(root,e,dt)}
  if(e.fly&&!r.insect){for(let i=0;i<r.wings.length;i++)r.wings[i].rotation.z=(i?1:-1)*(.4+Math.sin(t*7)*.65);for(const leg of r.legs)leg.rotation.x=-.7}
  d.animationFrames=(d.animationFrames||0)+1;
 },
 animalPlant(root,e,dt){
  const d=root.userData,r=d.rig,blend=e.moveBlend||0;if(blend<.03){d.plants=null;return}d.plants??=[];root.updateMatrixWorld(true);
  const forward=new THREE.Vector3(Math.sin(root.rotation.y),0,Math.cos(root.rotation.y)),stride=r.large?.7:.52,stance=.6;
  for(let i=0;i<r.legs.length;i++){
   const leg=r.legs[i],knee=r.knees[i],u=((e.phase||0)+[0,.5,.75,.25][i])%1,base=new THREE.Vector3(leg.position.x,0,leg.position.z+.015);root.localToWorld(base);base.y=Farm3D.walkHeight(base.x,base.z)+.03*root.scale.y;
   let f=d.plants[i];if(!f)f=d.plants[i]={point:base.clone(),start:base.clone(),target:base.clone(),cycle:u,stance:false};const down=u<stance;
   if((e.speed??1)<.025)f.target.copy(f.point);else if(down){if(!f.stance||u<f.cycle){f.point.copy(base).addScaledVector(forward,stride*stance*.5);f.point.y=Farm3D.walkHeight(f.point.x,f.point.z)+.03*root.scale.y}f.target.copy(f.point);f.start.copy(f.point)}else{const p=(u-stance)/(1-stance),end=base.clone().addScaledVector(forward,stride*stance*.5);end.y=Farm3D.walkHeight(end.x,end.z)+.03*root.scale.y;f.target.lerpVectors(f.start,end,p*p*(3-2*p));f.target.y+=Math.sin(Math.PI*p)*(r.large?.075:.05);f.point.copy(f.target)}f.stance=down;f.cycle=u;
   const p=leg.parent.worldToLocal(f.target.clone()).sub(leg.position),a=-knee.position.y,b=a*52/48-.012,length=Math.max(.025,Math.min(a+b-.001,Math.hypot(p.y,p.z))),hip=Math.atan2(-p.z,-p.y)-Math.acos(clamp((a*a+length*length-b*b)/(2*a*length),-1,1)),bend=Math.PI-Math.acos(clamp((a*a+b*b-length*length)/(2*a*b),-1,1)),ease=(1-Math.exp(-30*dt))*Math.min(1,blend*2);
   const angles=d.legAngles[i];angles.hip+=(hip-angles.hip)*ease;angles.knee+=(bend-angles.knee)*ease;leg.rotation.x=angles.hip;knee.rotation.x=angles.knee;
  }
 },
 dispose(root){root.userData.tool?.traverse(m=>{m.geometry?.dispose();m.material?.dispose()});root.userData.drops?.geometry.dispose();root.userData.drops?.material.dispose();root.userData.mesh.geometry.dispose();root.userData.mesh.skeleton.dispose()},
 recolor(root,input){const next=this.human(input);this.dispose(root);root.clear();root.userData=next.userData;for(const child of [...next.children])root.add(child);root.updateMatrixWorld(true)}
};
const illustratedRigAnimate=Avatar3D.animate,illustratedRigDispose=Avatar3D.dispose,illustratedRigColors=Avatar3D.updateColors,illustratedAnimalAnimate=Animal3D.animate,illustratedAnimalDispose=Animal3D.dispose;
Avatar3D.build=input=>VolumeActors.human(input);
Avatar3D.animate=(root,o)=>root.userData.volumetric?VolumeActors.humanPose(root,o):illustratedRigAnimate(root,o);
Avatar3D.dispose=root=>root.userData.volumetric?VolumeActors.dispose(root):illustratedRigDispose(root);
Avatar3D.updateColors=(root,input)=>root.userData.volumetric?VolumeActors.recolor(root,input):illustratedRigColors(root,input);
Animal3D.build=e=>VolumeActors.animal(e);
Animal3D.animate=(root,e,t,dt)=>root.userData.volumetric?VolumeActors.animalPose(root,e,t,dt):illustratedAnimalAnimate(root,e,t,dt);
Animal3D.dispose=root=>root.userData.volumetric?VolumeActors.dispose(root):illustratedAnimalDispose(root);
