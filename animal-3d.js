'use strict';
/* Species-specific articulated bodies. Position comes from Motion, never from animation. */
const Animal3D={
 materials:new Map(),
 mat(color){if(!this.materials.has(color))this.materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.86}));return this.materials.get(color)},
 ball(parent,color,x,y,z,sx,sy,sz=sx){this.geometry??=new THREE.SphereGeometry(1,14,10);return Avatar3D.mesh(parent,this.geometry,this.mat(color),x,y,z,sx,sy,sz)},
 tube(parent,color,points,radius){return Avatar3D.tube(parent,points,radius,this.mat(color))},
 batchRigid(root){root.updateMatrixWorld(true);const inverse=new THREE.Matrix4().copy(root.matrixWorld).invert(),positions=[],normals=[],colors=[],objects=[],v=new THREE.Vector3();root.traverse(o=>{if(!o.isMesh)return;const geometry=o.geometry.index?o.geometry.toNonIndexed():o.geometry,matrix=new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld),normal=new THREE.Matrix3().getNormalMatrix(matrix),p=geometry.attributes.position,n=geometry.attributes.normal,color=o.material.color;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(matrix);positions.push(v.x,v.y,v.z);v.fromBufferAttribute(n,i).applyMatrix3(normal).normalize();normals.push(v.x,v.y,v.z);colors.push(color.r,color.g,color.b)}if(geometry!==o.geometry)geometry.dispose();objects.push(o)});if(!objects.length)return;for(const o of objects)o.removeFromParent();const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));this.vertexMaterial??=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.86});const mesh=new THREE.Mesh(geometry,this.vertexMaterial);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh)},
 build(entity){
  const type=Art.emoji.get(entity.e)||'cow',root=new THREE.Group(),body=new THREE.Group(),core=new THREE.Group(),head=new THREE.Group(),tail=new THREE.Group(),legs=[],knees=[],wings=[];root.add(body);body.add(core,head,tail);root.userData.species=type;
  const bird=['hen','duck','crane'].includes(type),insect=['bee-animal','butterfly'].includes(type),large=['cow','buffalo'].includes(type),coat={cow:'#fff0d6',buffalo:'#707c83',pig:'#f5b6b0',goat:'#e9d5ad',sheep:'#faf0d8',dog:'#d8a15c',cat:'#e2a867',hen:'#c38b4a',duck:'#fff7dc',crane:'#eaf3ed'}[type]||'#b8a16e',hoof='#635245';
  if(insect){
   const bee=type==='bee-animal';this.ball(core,bee?'#c7a74d':'#423a2d',0,.10,0,.065,.075,.15);if(bee)for(const z of [-.08,0,.08])this.ball(core,'#473c2b',0,.1,z,.067,.076,.025);head.position.set(0,.13,.15);this.ball(head,'#55422d',0,0,0,.062,.06,.06);
   for(const side of [-1,1]){const wing=new THREE.Group();wing.position.set(side*.03,.17,0);body.add(wing);this.ball(wing,bee?'#d7e5df':side<0?'#e4aa57':'#ce8b4d',side*(bee?.10:.16),0,0,bee?.13:.18,.008,bee?.10:.15);if(!bee){this.ball(wing,'#6e5236',side*.16,.009,.07,.09,.009,.062);this.ball(wing,'#f0d183',side*.22,.012,-.07,.04,.008,.04)}wings.push(wing)}
  }else if(bird){
   const crane=type==='crane',duck=type==='duck',bodyY=crane?.58:.28;this.ball(core,coat,0,bodyY,0,crane?.17:.20,crane?.22:.18,crane?.30:.27);
   head.position.set(0,crane?.94:duck?.54:.55,.18);this.ball(head,coat,0,0,0,crane?.085:.105,crane?.115:.12,.105);this.ball(head,duck?'#c89b41':'#b38a3f',0,-.025,.14,duck?.072:.032,duck?.022:.028,crane?.16:.08);
   if(crane){this.tube(core,coat,[[0,.57,.08],[0,.76,.12],[0,.93,.18]],.047);this.ball(head,'#ae4f3b',0,.095,.018,.055,.025,.05)}
   if(type==='hen'){for(let i=0;i<3;i++)this.ball(head,'#b24d35',0,.105+i*.002,-.055+i*.05,.030,.044,.027);this.ball(head,'#b24d35',0,-.10,.08,.035,.052,.024)}
   for(const side of [-1,1]){const wing=new THREE.Group();wing.position.set(side*.15,bodyY+.02,-.025);body.add(wing);this.ball(wing,type==='hen'?'#85502c':crane?'#505349':'#d5ceb2',side*.02,0,0,.055,.115,crane?.22:.18);wings.push(wing);
    const leg=new THREE.Group();leg.position.set(side*.075,crane?.43:.16,.015);body.add(leg);const length=crane?.40:.13;this.tube(leg,'#b28a45',[[0,0,0],[0,-length*.52,-.015],[0,-length,.012]],crane?.013:.016);for(const toe of [-1,0,1])this.tube(leg,duck?'#c59b46':'#a98a52',[[0,-length,.01],[toe*.031,-length,.065],[toe*.045,-length,.095]],duck?.012:.007);legs.push(leg);knees.push(null)}
   tail.position.set(0,bodyY+.07,-.22);for(let i=0;i<3;i++){const feather=this.ball(tail,coat,(i-1)*.037,.02,-.025,.037,.065,.105);feather.rotation.x=-.25}
  }else{
   const pig=type==='pig',pet=['dog','cat'].includes(type),height=large?.44:pig?.27:pet?.27:.36,bodyLength=large?.38:pig?.30:pet?.26:.28;this.ball(core,coat,0,height,0,large?.23:pig?.20:pet?.13:.19,large?.25:pig?.17:.18,bodyLength);
   if(type==='cow')for(const [x,y,z,sx,sy,sz]of [[.209,.48,-.10,.028,.14,.15],[-.209,.48,.10,.028,.15,.14],[.12,.64,.02,.10,.03,.18]])this.ball(core,'#8c5f39',x,y,z,sx,sy,sz);
   if(type==='sheep')for(let i=0;i<18;i++){const a=i*2.4;this.ball(core,'#e7e0c6',Math.cos(a)*.15,height+Math.sin(a)*.11,-.22+i/17*.44,.10,.10,.10)}
   head.position.set(0,height+.11,bodyLength*.84);this.ball(head,coat,0,0,.06,large?.15:pet?.105:.12,large?.18:pet?.12:.13,large?.16:pet?.11:.12);this.ball(head,pig?'#c78d88':large?'#c3b194':coat,0,-.07,large?.19:.16,large?.13:pig?.092:.075,large?.085:.052,large?.09:.065);
   for(const side of [-1,1]){this.ball(head,large?'#6c5849':'#71584b',side*(large?.055:.032),-.059,large?.26:.212,.012,.009,.005);const ear=this.ball(head,coat,side*(large?.17:.11),.07,-.005,pet&&type==='cat'?.037:.075,pet&&type==='cat'?.071:.039,.045);ear.rotation.z=side*-.4;
    if(['cow','buffalo','goat'].includes(type))this.tube(head,'#c3b59a',[[side*.10,.11,-.04],[side*(type==='buffalo'?.24:.15),.17,-.10],[side*(type==='buffalo'?.27:.13),type==='goat'?.30:.24,-.14]],large?.020:.015)}
   if(type==='goat')this.ball(head,'#d1c4aa',0,-.17,.11,.032,.073,.036);
   for(let i=0;i<4;i++){const side=i%2?1:-1,front=i<2,leg=new THREE.Group();leg.position.set(side*(large?.14:.105),height-.075,front?bodyLength*.64:-bodyLength*.64);body.add(leg);const length=height-.09,upper=length*.48,lower=length*.52;this.ball(leg,coat,0,-upper*.48,0,large?.064:.043,upper*.65,large?.063:.043);const knee=new THREE.Group();knee.position.y=-upper;leg.add(knee);this.ball(knee,coat,0,-lower*.45,0,large?.039:.027,lower*.62,large?.039:.027);this.ball(knee,pet?coat:hoof,0,-lower+.012,.015,large?.049:.035,.030,large?.068:.047);legs.push(leg);knees.push(knee)}
   tail.position.set(0,height+.05,-bodyLength*.84);const points=pig?[[0,0,0],[.06,.02,-.08],[.04,.07,-.12],[-.01,.04,-.12],[.01,.02,-.08]]:pet?[[0,0,0],[.05,.05,-.15],[.08,.20,-.25],[.04,.25,-.31]]:[[0,0,0],[.015,-.12,-.05],[.02,-.28,-.07]];this.tube(tail,coat,points,pet?.032:.016);if(large)this.ball(tail,hoof,.02,-.27,-.07,.035,.059,.03);
  }
  const eyes=[];if(!insect)for(const side of [-1,1]){const x=bird?(type==='crane'?.075:.092):large?.12:.093,z=bird?.060:large?.13:.11,y=bird?.025:.035;
   const socket=new THREE.Group();socket.position.set(side*x,y,z);head.add(socket);this.ball(socket,'#fff9eb',0,0,0,.024,.029,.014);this.ball(socket,'#302920',0,0,.010,.017,.023,.009);this.ball(socket,'#fff8df',-side*.005,.009,.018,.006,.007,.003);eyes.push(socket);
  }
  if(type==='cat'){for(const side of [-1,1])for(let i=0;i<3;i++)this.tube(head,'#6f5847',[[side*.055,-.068,.18],[side*.11,-.055+i*.012,.18],[side*.18,-.075+i*.022,.16]],.0025);for(let i=0;i<3;i++)this.ball(core,'#b37d45',0,.40,-.15+i*.11,.10,.025,.029)}
  if(type==='dog'){this.tube(core,'#6e9c91',[[-.10,.36,.18],[0,.31,.23],[.10,.36,.18]],.021);this.ball(core,'#e7be65',0,.29,.23,.025,.033,.009)}
  if(type==='pig')for(const side of [-1,1])this.ball(head,'#dc8f91',side*.105,-.045,.13,.026,.019,.008);
  if(type==='sheep')for(let i=0;i<5;i++)this.ball(head,'#fff7e1',(i-2)*.04,.12,.04,.05,.044,.047);
  head.scale.setScalar(insect?1:bird?1.12:1.16);
  this.batchRigid(core);for(const eye of eyes)head.remove(eye);this.batchRigid(head);head.add(...eyes);this.batchRigid(tail);for(const knee of knees)if(knee)this.batchRigid(knee);if(bird)for(const leg of legs)this.batchRigid(leg);
  root.scale.setScalar(large?.90:insect?1:.92);root.userData.rig={body,head,tail,legs,knees,wings,eyes,bird,insect,large,water:entity.water,homeHeadY:head.position.y};return root;
 },
 animate(root,e,t,dt){const r=root.userData.rig,blend=e.moveBlend||0,phase=(e.phase||0)*Math.PI*2,target=e.heading??Math.atan2(e.vx||0,e.vy||1),delta=Math.atan2(Math.sin(target-root.rotation.y),Math.cos(target-root.rotation.y));root.rotation.y+=delta*(1-Math.exp(-9*dt));
  const reduced=!!S.fx.reduceMotion;if(reduced){for(const part of [r.body,r.head,r.tail,...r.legs,...r.knees.filter(Boolean),...r.wings]){part.rotation.set(0,0,0)}r.body.position.y=0;for(const eye of r.eyes)eye.scale.y=1;return}
  r.body.position.y=r.insect?Math.sin(t*3+e.x)*.055:r.water?Math.sin(t*2+e.x)*.015:Math.abs(Math.sin(phase))*(r.bird?.025:.016)*blend;r.body.rotation.z=r.water?Math.sin(t*1.8)*.035:Math.sin(phase)*.023*blend;
  for(let i=0;i<r.legs.length;i++){const offset=r.bird?i*Math.PI:[0,Math.PI,.65*Math.PI,1.65*Math.PI][i],step=Math.sin(phase+offset)*blend;r.legs[i].rotation.x=step*(r.bird?.30:.36);if(r.knees[i])r.knees[i].rotation.x=Math.max(0,-step)*.48;r.legs[i].visible=!(e.water&&root.userData.species==='duck')}
  const grazing=['cow','buffalo','sheep','goat'].includes(root.userData.species)?Math.max(0,Math.sin(t*.5+e.x)-.35)*.65*(1-blend):0,peck=root.userData.species==='hen'?Math.max(0,Math.sin(t*2.4+e.x)-.75)*1.8*(1-blend):0;r.head.rotation.x=Math.sin(phase)*.045*blend+Math.sin(t*.8+e.x)*.055*(1-blend)+grazing+peck;r.head.rotation.y=Math.sin(t*.9+e.y)*.16*(1-blend);r.tail.rotation.y=Math.sin(t*(root.userData.species==='dog'?7:2.2)+e.x)*(root.userData.species==='dog'?.42:.22);r.body.position.y+=Math.sin(t*1.8+e.x)*.006*(1-blend);
  for(const eye of r.eyes)eye.scale.y=(t+e.x*.37)%5.1>4.94?.12:1;
  for(let i=0;i<r.wings.length;i++)r.wings[i].rotation.z=(i?1:-1)*(r.insect?Math.sin(t*(root.userData.species==='butterfly'?12:38))*.85:Math.sin(t*1.4)*.025);
 },
 dispose(root){const geometries=new Set();root.traverse(o=>{if(o.geometry&&o.geometry!==this.geometry&&o.geometry!==Avatar3D.ball)geometries.add(o.geometry)});for(const g of geometries)g.dispose()},
 draw(c,e,x,y,size,t){
  if(!Avatar3D.init())return false;
  this.previews??=new Map();let entry=this.previews.get(e.e);
  if(!entry){const scene=new THREE.Scene(),root=this.build(e);scene.add(root);scene.add(new THREE.HemisphereLight(0xfff8e5,0x667c6b,2));const sun=new THREE.DirectionalLight(0xffedd3,2.5);sun.position.set(-3,5,5);scene.add(sun);const bounds=new THREE.Box3().setFromObject(root),center=bounds.getCenter(new THREE.Vector3()),half=Math.max(.3,bounds.max.y-bounds.min.y,bounds.max.x-bounds.min.x)*.65,camera=new THREE.OrthographicCamera(-half*.8,half*.8,half,-half,.1,20);camera.position.set(2,center.y+.8,5);camera.lookAt(0,center.y,0);camera.updateProjectionMatrix();entry={scene,root,camera};this.previews.set(e.e,entry)}
  this.animate(entry.root,e,t,1/60);entry.root.rotation.y=(e.turn??e.face??1)<0?-.65:.65;
  Avatar3D.renderer.render(entry.scene,entry.camera);c.drawImage(Avatar3D.renderer.domElement,x-size*.4,y-size,size*.8,size);return true;
 },
};
const previousAnimalDraw=Motion.animal.bind(Motion);
Motion.animal=(c,e,z,t,scene)=>{if(typeof Farm3D!=='undefined'&&Farm3D.active)return previousAnimalDraw(c,e,z,t,scene);const p=scene.iso(e.x,e.y),size=(e.fly?32:e.e==='🐃'||e.e==='🐄'?70:52)*z;return Animal3D.draw(c,e,p.x,p.y,size,t)||previousAnimalDraw(c,e,z,t,scene)};
