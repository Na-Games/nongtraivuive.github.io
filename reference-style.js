'use strict';
/* The approved detailed cutouts remain sharp; only joint matrices change per frame. */
const ReferenceActors={
 // Match velocity at both boundaries of the short return stroke.
 stroke(cycle,stance){if(cycle<stance)return 1-2*cycle/stance;const u=(cycle-stance)/(1-stance),v=-2*(1-stance)/stance;return -1+6*u*u-4*u*u*u+v*(2*u*u*u-3*u*u+u)},
 visible(root,margin){const p=Farm3D.project(root.position.x,root.position.z,root.position.y);root.visible=p.x>-margin&&p.x<innerWidth+margin&&p.y>-margin&&p.y<innerHeight+margin;return root.visible},
 turn(root,vx,vy,dt){
  const d=root.userData,camera=Farm3D.camera,side=Math.sin(Farm3D.yaw)*vy-Math.cos(Farm3D.yaw)*vx;
  if(Math.abs(side)>.035)d.targetFacing=side>0?Math.PI:0;d.facingAngle??=d.targetFacing||0;d.facingAngle+=((d.targetFacing||0)-d.facingAngle)*(1-Math.exp(-10*dt));
  d.turnQuaternion??=new THREE.Quaternion();d.turnAxis??=new THREE.Vector3(0,1,0);d.turnQuaternion.setFromAxisAngle(d.turnAxis,d.facingAngle);d.mesh.scale.x=1;d.mesh.quaternion.copy(camera.quaternion).multiply(d.turnQuaternion);root.rotation.y=0;
 },
 human(root,o={}){
  const d=root.userData;if(!d.mesh&&!ActorRig.prepareHuman(root))return;if(!this.visible(root,300))return;const dt=Math.min(.05,o.dt||1/60),t=o.t||0,p=Scene.player,reduced=!!S.fx.reduceMotion;
  this.turn(root,p.vx||0,p.vy||0,dt);const phase=(o.phase||0)*Math.PI*2,move=reduced?0:o.blend??(o.walk?1:0);d.blend=(d.blend||0)+(move-(d.blend||0))*(1-Math.exp(-12*dt));d.run=(d.run||0)+((o.run?1:0)-(d.run||0))*(1-Math.exp(-9*dt));
  const blend=d.blend,idle=reduced?0:1-blend,jump=!reduced&&o.jump?Math.sin(clamp(o.phase||0,0,1)*Math.PI):0,wave=Math.sin(phase);
  d.mesh.position.y=jump*.38+Math.cos(phase*2)*.005*blend;d.hip.position.y=d.hipY-.055*blend+Math.sin(t*1.9)*.0025*idle;d.spine.scale.y=1+Math.sin(t*1.9)*.0025*idle;
  d.spine.rotation.z=wave*.009*blend-.025*d.run*blend+Math.sin(t*.9)*.006*idle;d.head.rotation.z=-d.spine.rotation.z*.4+Math.sin(t*.7)*.009*idle;
  for(let i=0;i<2;i++){const s=i?1:-1,w=wave*s,a=d.arms[i],l=d.legs[i],ease=1-Math.exp(-18*dt);a.upper.rotation.x+=(-w*(.35+.12*d.run)*blend-a.upper.rotation.x)*ease;a.upper.rotation.z+=(-w*.12*blend-a.upper.rotation.z)*ease;a.lower.rotation.z+=(-.07*blend-a.lower.rotation.z)*ease;l.upper.rotation.set(w*.38*blend-jump*.18,0,w*.045*blend);l.lower.rotation.set(Math.max(0,-w)*.65*blend+jump*.3,0,0)}
  if(!o.jump&&!reduced)GroundedGait.human(root,o,dt);else{d.gait?.feet.splice(0);for(const l of d.legs)l.foot.quaternion.identity()}
  const work=o.work?1:0;d.workBlend=(d.workBlend||0)+(work-(d.workBlend||0))*(1-Math.exp(-13*dt));if(d.workBlend>.005){const a=d.arms[1],w=reduced?0:Math.sin((o.actionTime??t)*5),amount=d.workBlend;d.spine.rotation.z+=(-.025+w*.025)*amount;a.upper.rotation.z+=(-.20+w*.18)*amount;a.lower.rotation.z+=(-.13+w*.13)*amount}
  ActorRig.tool(root,o);d.animationFrames=(d.animationFrames||0)+1;
 },
 animal(e){
  const root=new THREE.Group(),id=IllustratedAnimals.species(e);root.userData={illustratedAnimal:true,gpuRig:true,referenceStyle:true,species:id};this.prepare(root);return root;
 },
 prepare(root){
  const d=root.userData,m=ILLUSTRATED_ART.animals[d.species],image=IllustratedAvatar.load(m.file);if(!image)return false;
  const insect=['bee-animal','butterfly'].includes(d.species),bird=['hen','duck','crane'].includes(d.species),large=['cow','buffalo'].includes(d.species),size=insect?.43:large?1.05:d.species==='crane'?1.05:.78,u=size/Math.max(m.w,m.h),bones=[];
  const body=ActorRig.bone(bones,'body',m.w/2,m.h*.55,null,u);body.position.set(0,m.h*.45*u,0);const head=ActorRig.bone(bones,'head',m.w*.66,m.h*.36,body,u),centers=bird?[.46,.62]:[.27,.43,.60,.75],legs=centers.map((x,i)=>ActorRig.bone(bones,'leg'+i,m.w*x,m.h*(bird?.79:.67),body,u)),feet=legs.map((leg,i)=>ActorRig.bone(bones,'paw'+i,m.w*centers[i],m.h*.93,leg,u)),wings=[ActorRig.bone(bones,'wing0',m.w*.48,m.h*.48,body,u),ActorRig.bone(bones,'wing1',m.w*.52,m.h*.48,body,u)];
  let texture=ActorRig.animalTextures.get(d.species);if(!texture){texture=ActorRig.texture(image);ActorRig.animalTextures.set(d.species,texture)}
  ActorRig.skin(root,image,m.w,m.h,u,bones,(x,y)=>{
   if(insect){const spread=ActorRig.smooth(.04,.25,Math.abs(x/m.w-.5)),top=1-ActorRig.smooth(.45,.67,y/m.h),amount=spread*top;return[[bones.indexOf(wings[x<m.w/2?0:1]),amount],[0,1-amount]]}
   const cut=bird?.79:.67;if(y>m.h*cut){let i=0;for(let k=1;k<centers.length;k++)if(Math.abs(x/m.w-centers[k])<Math.abs(x/m.w-centers[i]))i=k;const amount=ActorRig.smooth(cut,cut+.11,y/m.h),ankle=ActorRig.smooth(.88,.95,y/m.h);return[[bones.indexOf(legs[i]),amount*(1-ankle)],[bones.indexOf(feet[i]),amount*ankle],[0,1-amount]]}
   const amount=ActorRig.smooth(.58,.81,x/m.w)*(1-ActorRig.smooth(.34,.54,y/m.h));return[[1,amount],[0,1-amount]];
  },texture,{x:m.w/2,y:m.h});Object.assign(d,{body,head,legs,feet,wings,insect,bird,size,bodyY:body.position.y});return true;
 },
 animalPose(root,e,t,dt){
  const d=root.userData;if(!d.mesh&&!this.prepare(root))return;if(!this.visible(root,180))return;dt=Math.min(.05,dt||1/60);this.turn(root,e.vx||0,e.vy||0,dt);const reduced=!!S.fx.reduceMotion,blend=reduced?0:e.moveBlend||0,phase=(e.phase||0)*Math.PI*2;
  d.mesh.position.y=reduced?0:d.insect?Math.sin(t*3.3+e.x)*.025:e.water?Math.sin(t*2+e.x)*.010:Math.cos(phase*2)*.004*blend;d.body.scale.y=reduced?1:1+Math.sin(t*1.7+e.x)*.003*(1-blend);d.head.rotation.z=reduced?0:Math.sin(t*.9+e.x)*.012*(1-blend)+Math.sin(phase)*.009*blend;
  for(let i=0;i<d.legs.length;i++){const cycle=(((e.phase||0)+(d.bird?i*.5:[0,.5,.75,.25][i]))%1+1)%1,stance=.64,returning=cycle>=stance,u=returning?(cycle-stance)/(1-stance):0,stroke=this.stroke(cycle,stance),l=d.legs[i],f=d.feet[i],ease=1-Math.exp(-22*dt),target=e.water?-.4:stroke*.36*blend;l.rotation.x+=(target-l.rotation.x)*ease;l.rotation.z=stroke*.022*blend;l.userData.restY??=l.position.y;l.position.y=l.userData.restY+Math.sin(u*Math.PI)**2*.020*blend;f.rotation.x=-l.rotation.x*.65;f.rotation.z=-l.rotation.z*.6}
  if(d.insect){const flap=reduced?0:Math.sin(t*(d.species==='butterfly'?9:43)+e.x)*.75;d.wings[0].rotation.y=flap;d.wings[1].rotation.y=-flap}d.animationFrames=(d.animationFrames||0)+1;
 }
};
Avatar3D.build=input=>{const root=ActorRig.human(input);root.userData.referenceStyle=true;return root};
Avatar3D.animate=(root,o)=>ReferenceActors.human(root,o);
Avatar3D.updateColors=(root,input)=>{root.userData.avatar=Wardrobe.normalize(input);root.userData.signature=IllustratedAvatar.signature(input);ActorRig.prepareHuman(root)};
Avatar3D.dispose=root=>ActorRig.clear(root);
Avatar3D.draw=(...args)=>IllustratedAvatar.draw(...args);Avatar3D.optionIcon=(...args)=>IllustratedAvatar.icon(...args);Wardrobe.draw=(...args)=>IllustratedAvatar.draw(...args);AvatarAssets.capture=(...args)=>IllustratedAvatar.capture(...args);
Animal3D.build=e=>ReferenceActors.animal(e);Animal3D.animate=(...args)=>ReferenceActors.animalPose(...args);Animal3D.dispose=root=>ActorRig.clear(root);
