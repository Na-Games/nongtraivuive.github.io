'use strict';
/* The approved detailed cutouts remain sharp; only joint matrices change per frame. */
const ReferenceActors={
 ANATOMY:{
  cow:{centers:[.13,.31,.53,.67],splits:[.22,.42,.60],minLegX:.04,maxLegX:.76,cut:.66,knee:.82,head:[.68,.36],tail:[.12,.44],tailSplit:.13,stride:.38,kneeBend:.52,bob:.018},
  buffalo:{centers:[.16,.35,.51,.67],splits:[.255,.43,.59],minLegX:.06,maxLegX:.75,cut:.65,knee:.82,head:[.66,.38],tail:[.15,.45],tailSplit:.16,stride:.36,kneeBend:.50,bob:.017},
  pig:{centers:[.10,.32,.50,.70],splits:[.21,.41,.60],minLegX:.04,maxLegX:.78,cut:.71,knee:.84,head:[.68,.46],tail:[.09,.44],tailSplit:.11,stride:.42,kneeBend:.54,bob:.020},
  goat:{centers:[.08,.31,.52,.65],splits:[.195,.415,.585],minLegX:.03,maxLegX:.74,cut:.66,knee:.82,head:[.64,.34],tail:[.10,.38],tailSplit:.12,stride:.42,kneeBend:.56,bob:.022},
  sheep:{centers:[.18,.35,.46,.66],splits:[.265,.405,.56],minLegX:.08,maxLegX:.75,cut:.72,knee:.85,head:[.68,.40],tail:[.15,.48],tailSplit:.16,stride:.38,kneeBend:.50,bob:.019},
  dog:{centers:[.16,.40,.60,.81],splits:[.28,.50,.705],minLegX:.08,maxLegX:.88,cut:.67,knee:.83,head:[.64,.34],tail:[.21,.34],tailSplit:.22,stride:.46,kneeBend:.60,bob:.024},
  cat:{centers:[.19,.45,.61,.79],splits:[.32,.53,.70],minLegX:.10,maxLegX:.86,cut:.69,knee:.84,head:[.66,.38],tail:[.23,.40],tailSplit:.24,stride:.44,kneeBend:.58,bob:.020},
  hen:{centers:[.40,.61],splits:[.505],minLegX:.26,maxLegX:.72,cut:.76,knee:.86,head:[.64,.36],tail:[.24,.44],tailSplit:.26,stride:.46,kneeBend:.58,bob:.022},
  duck:{centers:[.33,.57],splits:[.45],minLegX:.20,maxLegX:.70,cut:.76,knee:.86,head:[.64,.34],tail:[.20,.54],tailSplit:.22,stride:.44,kneeBend:.54,bob:.020},
  crane:{centers:[.27,.51],splits:[.39],minLegX:.20,maxLegX:.62,cut:.60,knee:.77,head:[.58,.28],tail:[.22,.46],tailSplit:.22,stride:.42,kneeBend:.62,bob:.022},
  'bee-animal':{insect:true,head:[.66,.46],wings:[[.30,.30],[.48,.28]]},
  butterfly:{insect:true,head:[.68,.44],wings:[[.26,.28],[.46,.34]]}
 },
 // Match velocity at both boundaries of the short return stroke.
 stroke(cycle,stance){if(cycle<stance)return 1-2*cycle/stance;const u=(cycle-stance)/(1-stance),v=-2*(1-stance)/stance;return -1+6*u*u-4*u*u*u+v*(2*u*u*u-3*u*u+u)},
 visible(root,margin){const p=Farm3D.project(root.position.x,root.position.z,root.position.y);root.visible=p.x>-margin&&p.x<innerWidth+margin&&p.y>-margin&&p.y<innerHeight+margin;return root.visible},
 turn(root,vx,vy,dt){
  const d=root.userData,camera=Farm3D.camera,side=Math.sin(Farm3D.yaw)*vy-Math.cos(Farm3D.yaw)*vx,thresh=d.targetFacing==null?.035:.075;
  if(Math.abs(side)>thresh)d.targetFacing=side>0?Math.PI:0;d.facingAngle??=d.targetFacing||0;d.facingAngle+=((d.targetFacing||0)-d.facingAngle)*(1-Math.exp(-10*dt));
  d.turnQuaternion??=new THREE.Quaternion();d.turnAxis??=new THREE.Vector3(0,1,0);d.turnQuaternion.setFromAxisAngle(d.turnAxis,d.facingAngle);d.mesh.scale.x=1;d.mesh.quaternion.copy(camera.quaternion).multiply(d.turnQuaternion);root.rotation.y=0;
 },
 human(root,o={}){
  const d=root.userData;if(!d.mesh&&!ActorRig.prepareHuman(root))return;if(!this.visible(root,300))return;const dt=Math.min(.05,o.dt||1/60),t=o.t||0,p=Scene.player,reduced=!!S.fx.reduceMotion;
  this.turn(root,p.vx||0,p.vy||0,dt);const phase=(o.phase||0)*Math.PI*2,move=reduced?0:o.blend??(o.walk?1:0);d.blend=(d.blend||0)+(move-(d.blend||0))*(1-Math.exp(-12*dt));d.run=(d.run||0)+((o.run?1:0)-(d.run||0))*(1-Math.exp(-9*dt));
  const blend=d.blend,idle=reduced?0:1-blend,jump=!reduced&&o.jump?Math.sin(clamp(o.phase||0,0,1)*Math.PI):0,wave=Math.sin(phase),stride=Math.cos(phase);
  d.mesh.position.y=jump*.42+Math.abs(wave)*(.026+.020*d.run)*blend;
  d.hip.position.y=d.hipY-(.048+.020*d.run)*blend+Math.cos(phase*2)*(.014+.009*d.run)*blend+Math.sin(t*2.1)*.0045*idle;
  d.hip.position.x=stride*.012*blend+Math.sin(t*1.05)*.0035*idle;
  d.spine.scale.y=1+Math.sin(t*2.1)*.0075*idle+Math.cos(phase*2)*.007*blend;
  d.spine.scale.x=1-Math.sin(t*2.1)*.0035*idle;
  d.spine.rotation.z=wave*(.028+.016*d.run)*blend-(.038+.058*d.run)*blend+Math.sin(t*1.05)*.011*idle-jump*.07;
  d.spine.rotation.y=wave*(.08+.04*d.run)*blend;
  d.head.position.y=(d.headY||d.head.position.y)+Math.cos(phase*2)*.005*blend+Math.sin(t*2.1)*.0025*idle;
  d.head.rotation.z=-d.spine.rotation.z*.55+Math.cos(phase*2)*.016*blend+(Math.sin(t*.85)*.020+Math.sin(t*1.75)*.007)*idle+jump*.06;
  for(let i=0;i<2;i++){
   const s=i?1:-1,w=wave*s,a=d.arms[i],l=d.legs[i],ease=1-Math.exp(-18*dt);
   const targetUpperX=-w*(.35+.12*d.run)*blend;
   const targetUpperZ=(-w*(.36+.18*d.run)+(.04+.06*d.run))*blend+s*(.025+Math.sin(t*1.55+i*1.2)*.020)*idle+jump*(i?.38:-.24);
   const targetLowerZ=(Math.max(0,-w)*(.42+.22*d.run)+.11)*blend+(.05+Math.sin(t*1.55+i*1.2)*.022)*idle+jump*.32;
   const targetHandZ=-w*.12*blend+Math.sin(t*2.1+i)*.025*idle;
   a.upper.rotation.x+=(targetUpperX-a.upper.rotation.x)*ease;
   a.upper.rotation.z+=(targetUpperZ-a.upper.rotation.z)*ease;
   a.lower.rotation.z+=(targetLowerZ-a.lower.rotation.z)*ease;
   if(a.hand)a.hand.rotation.z+=(targetHandZ-a.hand.rotation.z)*ease;
   l.upper.rotation.set(w*.38*blend-jump*.18,0,w*.34*blend+jump*(i?.42:-.22));
   l.lower.rotation.set(Math.max(0,-w)*.65*blend+jump*.3,0,-Math.max(0,-w)*.52*blend-jump*(i?.68:.48));
  }
  if(!o.jump&&!reduced)GroundedGait.human(root,o,dt);else{d.gait?.feet.splice(0);for(const l of d.legs)l.foot.quaternion.identity()}
  const work=o.work?1:0;d.workBlend=(d.workBlend||0)+(work-(d.workBlend||0))*(1-Math.exp(-13*dt));
  if(d.workBlend>.005){
   const a=d.arms[1],w=reduced?0:Math.sin((o.actionTime??t)*5.4),chop=reduced?0:Math.max(0,Math.sin((o.actionTime??t)*5.4-.35)),amount=d.workBlend;
   d.spine.rotation.z+=(-.055-chop*.065)*amount;
   d.head.rotation.z+=(-.035+w*.028)*amount;
   a.upper.rotation.z+=(.48+w*.34)*amount;
   a.lower.rotation.z+=(.30+w*.24)*amount;
   if(a.hand)a.hand.rotation.z+=(.10-w*.16)*amount;
  }
  ActorRig.tool(root,o);d.animationFrames=(d.animationFrames||0)+1;
 },
 animal(e){
  const root=new THREE.Group(),id=IllustratedAnimals.species(e);root.userData={illustratedAnimal:true,gpuRig:true,referenceStyle:true,species:id};this.prepare(root);return root;
 },
 prepare(root){
  const d=root.userData,m=ILLUSTRATED_ART.animals[d.species],image=IllustratedAvatar.load(m.file);if(!image)return false;
  const cfg=this.ANATOMY[d.species]||this.ANATOMY.cow,insect=!!cfg.insect,bird=['hen','duck','crane'].includes(d.species),large=['cow','buffalo'].includes(d.species),size=insect?.43:large?1.05:d.species==='crane'?1.05:.78,u=size/Math.max(m.w,m.h),bones=[];
  const body=ActorRig.bone(bones,'body',m.w/2,m.h*.54,null,u);body.position.set(0,m.h*.46*u,0);
  const hx=cfg.head?cfg.head[0]:.66,hy=cfg.head?cfg.head[1]:.36,head=ActorRig.bone(bones,'head',m.w*hx,m.h*hy,body,u);
  const tx=cfg.tail?cfg.tail[0]:.14,ty=cfg.tail?cfg.tail[1]:.44,tail=ActorRig.bone(bones,'tail',m.w*tx,m.h*ty,body,u);
  const centers=cfg.centers||(bird?[.40,.60]:[.15,.34,.52,.68]),cut=cfg.cut||(bird?.76:.67),knee=cfg.knee||(bird?.86:.83);
  const legs=centers.map((x,i)=>ActorRig.bone(bones,'leg'+i,m.w*x,m.h*cut,body,u)),feet=legs.map((leg,i)=>ActorRig.bone(bones,'paw'+i,m.w*centers[i],m.h*knee,leg,u));
  const w0=cfg.wings?cfg.wings[0]:[.32,.32],w1=cfg.wings?cfg.wings[1]:[.48,.32],wings=[ActorRig.bone(bones,'wing0',m.w*w0[0],m.h*w0[1],body,u),ActorRig.bone(bones,'wing1',m.w*w1[0],m.h*w1[1],body,u)];
  let texture=ActorRig.animalTextures.get(d.species);if(!texture){texture=ActorRig.texture(image);ActorRig.animalTextures.set(d.species,texture)}
  const bi=bones.indexOf(body),hi=bones.indexOf(head),ti=bones.indexOf(tail),li=legs.map(b=>bones.indexOf(b)),fi=feet.map(b=>bones.indexOf(b)),wi=wings.map(b=>bones.indexOf(b));
  if(insect){
   ActorRig.skin(root,image,m.w,m.h,u,bones,(x,y)=>{
    const nx=x/m.w,ny=y/m.h;
    const wingRegion=(1-ActorRig.smooth(.56,.68,nx))*(1-ActorRig.smooth(.52,.72,ny));
    if(wingRegion>.01){
     const wIdx=nx<.37?wi[0]:wi[1];
     return[[wIdx,wingRegion],[bi,1-wingRegion]];
    }
    const headAmt=ActorRig.smooth(.56,.74,nx)*(1-ActorRig.smooth(.32,.66,ny));
    return[[hi,headAmt],[bi,1-headAmt]];
   },texture,{x:m.w/2,y:m.h});
  }else{
   const splits=cfg.splits||(bird?[.50]:[.24,.43,.60]),minLegX=cfg.minLegX??.04,maxLegX=cfg.maxLegX??.82,tailSplit=cfg.tailSplit??.16;
   const upperWeight=(x,y)=>{
    const nx=x/m.w,ny=y/m.h;
    const headAmt=ActorRig.smooth(hx-.12,hx+.08,nx)*(1-ActorRig.smooth(hy+.10,hy+.26,ny));
    const tailAmt=(1-ActorRig.smooth(tailSplit-.04,tailSplit+.06,nx))*(1-ActorRig.smooth(cut-.04,cut+.06,ny))*ActorRig.smooth(.20,.34,ny);
    const rem=Math.max(0,1-headAmt-tailAmt);
    return[[hi,headAmt],[ti,tailAmt],[bi,rem]];
   };
   const legWeight=i=>(x,y)=>{
    const nx=x/m.w,ny=y/m.h;
    if(nx<minLegX||nx>maxLegX){
     const tailAmt=nx<minLegX?ActorRig.smooth(cut-.04,cut+.10,ny)*.65:0;
     return[[ti,tailAmt],[bi,1-tailAmt]];
    }
    const amount=ActorRig.smooth(cut-.02,cut+.07,ny),lower=ActorRig.smooth(knee-.04,knee+.05,ny);
    return[[li[i],amount*(1-lower)],[fi[i],amount*lower],[bi,1-amount]];
   };
   const patches=[];
   const legBounds=[0,...splits,1];
   for(let i=0;i<legs.length;i++){
    const isNear=bird?(i===1):(i===1||i===3);
    if(!isNear)patches.push({u0:legBounds[i],u1:legBounds[i+1],v0:Math.max(0,cut-.03),v1:1,z:-.008+i*.001,cols:6,rows:12,weightAt:legWeight(i)});
   }
   patches.push({u0:0,u1:1,v0:0,v1:Math.min(1,cut+.025),z:0,cols:18,rows:16,weightAt:upperWeight});
   for(let i=0;i<legs.length;i++){
    const isNear=bird?(i===1):(i===1||i===3);
    if(isNear)patches.push({u0:legBounds[i],u1:legBounds[i+1],v0:Math.max(0,cut-.03),v1:1,z:.008+i*.001,cols:6,rows:12,weightAt:legWeight(i)});
   }
   ActorRig.segmentedSkin(root,m.w,m.h,u,bones,patches,texture,{x:m.w/2,y:m.h});
  }
  Object.assign(d,{body,head,tail,legs,feet,wings,insect,bird,size,cfg,bodyY:body.position.y,headY:head.position.y});return true;
 },
 animalPose(root,e,t,dt){
  const d=root.userData;if(!d.mesh&&!this.prepare(root))return;if(!this.visible(root,180))return;dt=Math.min(.05,dt||1/60);this.turn(root,e.vx||0,e.vy||0,dt);
  const reduced=!!S.fx.reduceMotion,blend=reduced?0:e.moveBlend||0,idle=reduced?0:1-blend,phase=(e.phase||0)*Math.PI*2,seed=(e.seed||e.x||0)*1.7,cfg=d.cfg||this.ANATOMY[d.species]||this.ANATOMY.cow;
  if(d.insect){
   const hover=reduced?0:Math.sin(t*3.8+seed)*.032+Math.cos(t*2.3+seed)*(.018*blend);
   d.mesh.position.y=hover;
   d.body.rotation.z=reduced?0:-.12*blend+Math.sin(t*4.1+seed)*.05;
   d.head.rotation.z=reduced?0:Math.sin(t*3.2+seed)*.04;
   const freq=d.species==='butterfly'?10.5:42,wave=reduced?0:Math.sin(t*freq+seed),flap=wave*.78;
   d.wings[0].rotation.y=flap;d.wings[1].rotation.y=-flap;
   d.wings[0].rotation.z=wave*.38;d.wings[1].rotation.z=-wave*.30;
   const wingScale=1-Math.abs(wave)*.16;
   d.wings[0].scale.y=wingScale;d.wings[1].scale.y=wingScale;
   d.animationFrames=(d.animationFrames||0)+1;return;
  }
  const bobAmp=cfg.bob||.020;
  d.mesh.position.y=reduced?0:e.water?Math.sin(t*2.2+seed)*.014:Math.abs(Math.sin(phase))*bobAmp*blend;
  d.body.position.y=d.bodyY-(.018*blend)+Math.sin(t*1.9+seed)*.004*idle;
  d.body.scale.y=reduced?1:1+Math.sin(t*1.9+seed)*.007*idle+Math.cos(phase*2)*.006*blend;
  d.body.rotation.z=reduced?0:e.water?Math.sin(t*1.8+seed)*.025:Math.cos(phase)*(.028*blend)+Math.sin(t*1.2+seed)*.006*idle;
  const graze=!e.water&&!d.bird?Math.max(0,Math.sin(t*.75+seed*1.3)-.35)*.14*idle:0;
  const peck=!e.water&&d.bird?Math.max(0,Math.sin(t*2.6+seed*1.9)-.55)*.22*idle:0;
  const headBob=d.bird?Math.cos(phase*2)*.055*blend:Math.sin(phase)*.028*blend;
  d.head.rotation.z=reduced?0:Math.sin(t*1.05+seed)*.024*idle+headBob-graze-peck;
  d.head.position.y=(d.headY||d.head.position.y)+Math.cos(phase*2)*(.006*blend);
  if(d.tail){
   const wagSpeed=d.species==='dog'?7.5:d.species==='cat'?2.8:3.4;
   const wagAmp=d.species==='dog'?(.14+.16*blend):(.07+.09*blend);
   d.tail.rotation.z=reduced?0:Math.sin(t*wagSpeed+seed)*wagAmp;
  }
  const offsets=d.bird?[0,.5]:[0,.5,.25,.75],strideAmp=cfg.stride||.40,kneeAmp=cfg.kneeBend||.54;
  for(let i=0;i<d.legs.length;i++){
   const cycle=(((e.phase||0)+offsets[i])%1+1)%1,stance=.62,returning=cycle>=stance,u=returning?(cycle-stance)/(1-stance):0,stroke=this.stroke(cycle,stance),l=d.legs[i],f=d.feet[i],ease=1-Math.exp(-22*dt);
   const targetX=e.water?-.4:stroke*.36*blend;
   l.rotation.x+=(targetX-l.rotation.x)*ease;
   if(e.water){
    const paddle=Math.sin(phase+i*Math.PI),kick=Math.cos(phase+i*Math.PI);
    const targetZ=-.32+paddle*(.28*blend+.08*idle);
    const footZ=-.24+kick*(.32*blend+.10*idle);
    l.rotation.z+=(targetZ-l.rotation.z)*ease;
    f.rotation.z+=(footZ-f.rotation.z)*ease;
    f.rotation.x=-l.rotation.x*.65;
   }else{
    const idleStance=(i%2?1:-1)*Math.sin(t*1.1+seed)*.015*idle;
    const targetZ=stroke*strideAmp*blend+idleStance;
    const swingFlex=returning?-Math.sin(u*Math.PI)*kneeAmp*blend+Math.sin(u*Math.PI*2)*.10*blend:-targetZ*.42;
    l.rotation.z+=(targetZ-l.rotation.z)*ease;
    f.rotation.z+=(swingFlex-f.rotation.z)*ease;
    f.rotation.x=-l.rotation.x*.65;
   }
   l.userData.restY??=l.position.y;
   l.position.y=l.userData.restY+Math.sin(u*Math.PI)**2*.026*blend;
  }
  d.animationFrames=(d.animationFrames||0)+1;
 }
};
Avatar3D.build=input=>{const root=ActorRig.human(input);root.userData.referenceStyle=true;return root};
Avatar3D.animate=(root,o)=>ReferenceActors.human(root,o);
Avatar3D.updateColors=(root,input)=>{root.userData.avatar=Wardrobe.normalize(input);root.userData.signature=IllustratedAvatar.signature(input);ActorRig.prepareHuman(root)};
Avatar3D.dispose=root=>ActorRig.clear(root);
Avatar3D.draw=(...args)=>IllustratedAvatar.draw(...args);Avatar3D.optionIcon=(...args)=>IllustratedAvatar.icon(...args);Wardrobe.draw=(...args)=>IllustratedAvatar.draw(...args);AvatarAssets.capture=(...args)=>IllustratedAvatar.capture(...args);
Animal3D.build=e=>ReferenceActors.animal(e);Animal3D.animate=(...args)=>ReferenceActors.animalPose(...args);Animal3D.dispose=root=>ActorRig.clear(root);
