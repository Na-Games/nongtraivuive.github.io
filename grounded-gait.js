'use strict';
/* Stance feet stay in world space; swing feet travel in the actual walking direction. */
const GroundedGait={
 state(root){const d=root.userData;if(!d.gait)d.gait={inverse:new THREE.Quaternion(),combined:new THREE.Quaternion(),rotation:new THREE.Quaternion(),direction:new THREE.Vector3(1,0,0),right:new THREE.Vector3(),base:new THREE.Vector3(),target:new THREE.Vector3(),local:new THREE.Vector3(),hip:new THREE.Vector3(),axis:new THREE.Vector3(),pole:new THREE.Vector3(),knee:new THREE.Vector3(),lower:new THREE.Vector3(),down:new THREE.Vector3(0,-1,0),feet:[]};return d.gait},
 foot(root,g,index,entity,cycle,stance,lateral,stride,lift){
  const d=root.userData,scale=root.scale.x||1,q=d.mesh.quaternion;g.right.set(lateral*scale,0,0).applyQuaternion(q);
  g.base.copy(root.position).add(g.right);g.base.y=Farm3D.walkHeight(g.base.x,g.base.z);
  let f=g.feet[index];if(!f)f=g.feet[index]={plant:g.base.clone(),start:g.base.clone(),stance:false,cycle};
  const inStance=cycle<stance;
  if(inStance){if(!f.stance||cycle<f.cycle){if(f.swing&&f.end)f.plant.copy(f.end);else{f.plant.copy(g.base).addScaledVector(g.direction,stride*stance*.5);f.plant.y=Farm3D.walkHeight(f.plant.x,f.plant.z)}}f.swing=false;g.target.copy(f.plant);f.start.copy(f.plant)}
  else{const u=(cycle-stance)/(1-stance),ease=u*u*u*(10+u*(-15+6*u));if(!f.swing){f.end??=g.base.clone();f.end.copy(g.base).addScaledVector(g.direction,stride*(1-stance*.5));f.end.y=Farm3D.walkHeight(f.end.x,f.end.z);f.swing=true}g.target.lerpVectors(f.start,f.end,ease);g.target.y=Math.max(Farm3D.walkHeight(g.target.x,g.target.z),g.target.y)+Math.sin(u*Math.PI)**2*lift}
  f.stance=inStance;f.cycle=cycle;f.world??=new THREE.Vector3();f.world.copy(g.target);
  g.local.copy(g.target).sub(root.position).divideScalar(scale);g.local.y-=d.mesh.position.y;g.local.applyQuaternion(g.inverse);g.local.x/=d.mesh.scale.x;return g.local;
 },
 human(root,o,dt){
  const d=root.userData,g=this.state(root),p=Scene.player,blend=S.fx.reduceMotion?0:d.blend||0;
  for(const l of d.legs)l.foot?.quaternion.identity();
  if(blend<.025||o.jump){g.feet.length=0;g.walkTime=0;for(const l of d.legs){l.ikUpper?.copy(l.upper.quaternion);l.ikLower?.copy(l.lower.quaternion)}return}
  g.walkTime=(g.walkTime||0)+dt;const stopping=o.speed!==undefined&&o.speed<.03;if(stopping&&g.wasMoving)for(const f of g.feet){if(f?.world){f.plant.copy(f.world);f.stance=true;f.cycle=0}}g.wasMoving=!stopping;if(p.speed>.03)g.direction.set(p.vx,0,p.vy).normalize();g.inverse.copy(d.mesh.quaternion).invert();
  const run=d.run||0,stride=(.8+.35*run)*(root.scale.x||1)*(d.avatar.style===5?.82:1),stance=.62-.14*run,alpha=clamp(blend*2,0,1);
  for(let i=0;i<2;i++){const l=d.legs[i],cycle=stopping?0:(((o.phase||0)+i*.5)%1+1)%1,lateral=l.upper.position.x;
   const target=this.foot(root,g,i,p,cycle,stance,lateral,stride,.075+.07*run);target.y+=l.soleLength;
   g.hip.set(lateral,d.hip.position.y,0);g.axis.copy(target).sub(g.hip);const raw=g.axis.length(),length=Math.min(raw,(l.upperLength+l.lowerLength)*.997);g.axis.normalize();
   g.pole.copy(g.direction).applyQuaternion(g.inverse);g.pole.x/=d.mesh.scale.x;g.pole.addScaledVector(g.axis,-g.pole.dot(g.axis));if(g.pole.lengthSq()<.001)g.pole.set(0,0,1);g.pole.normalize();
   const a=(l.upperLength*l.upperLength-l.lowerLength*l.lowerLength+length*length)/(2*Math.max(.001,length)),h=Math.sqrt(Math.max(0,l.upperLength*l.upperLength-a*a));g.knee.copy(g.hip).addScaledVector(g.axis,a).addScaledVector(g.pole,h);
   l.ikUpper??=l.upper.quaternion.clone();l.ikLower??=l.lower.quaternion.clone();const settle=clamp(g.walkTime/.4,0,1),ease=1-Math.exp(-(22+800*settle*settle)*dt);
   g.lower.copy(g.knee).sub(g.hip).normalize();g.rotation.setFromUnitVectors(g.down,g.lower);l.upper.quaternion.slerp(g.rotation,alpha);l.ikUpper.slerp(l.upper.quaternion,ease);l.upper.quaternion.copy(l.ikUpper);
   g.lower.copy(target).sub(g.knee).normalize();g.combined.copy(l.upper.quaternion).invert();g.lower.applyQuaternion(g.combined);g.rotation.setFromUnitVectors(g.down,g.lower);l.lower.quaternion.slerp(g.rotation,alpha);l.ikLower.slerp(l.lower.quaternion,ease);l.lower.quaternion.copy(l.ikLower);
   g.combined.multiplyQuaternions(l.upper.quaternion,l.lower.quaternion).invert();l.foot.quaternion.slerp(g.combined,alpha);
  }
 },
 animal(root,e,t,dt){
  const d=root.userData;if(d.insect||e.water||S.fx.reduceMotion)return;const g=this.state(root),blend=e.moveBlend||0;
  for(const l of d.legs)l.userData.rest??=l.position.clone();
  if(blend<.03){g.feet.length=0;for(const l of d.legs)l.position.lerp(l.userData.rest,1-Math.exp(-12*dt));return}
  if(e.speed>.02)g.direction.set(e.vx,0,e.vy).normalize();g.inverse.copy(d.mesh.quaternion).invert();
  const m=ILLUSTRATED_ART.animals[d.species],stride=(d.size>.9?.70:.52),lift=d.size*.055;
  for(let i=0;i<4;i++){const l=d.legs[i],rest=l.userData.rest,cycle=(((e.phase||0)+(i%2)*.5+(i>1?.08:0))%1+1)%1,lateral=(m.w*(i+.5)/4-m.w/2)*d.unit;
   const target=this.foot(root,g,i,e,cycle,.65,lateral,stride,lift);l.position.x=rest.x+clamp(target.x-lateral,-.025,.025)*blend;l.position.y=rest.y+(g.feet[i].stance?0:clamp(target.y*.25,0,.025))*blend;l.position.z=rest.z+clamp(target.z,-.015,.015)*blend;l.rotation.z*=.2;
  }
 },
};
