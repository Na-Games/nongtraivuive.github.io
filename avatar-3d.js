'use strict';
/* The editor, HUD, fishing and world all use this same articulated model. */
const Avatar3D={
 ready:false,cache:new Map(),
 profiles:[{h:1.50,w:.91,head:1.12},{h:1.43,w:.85,head:1.12},{h:1.77,w:1.18,head:.98},{h:1.38,w:1.12,head:1.08},{h:1.68,w:.86,head:1.02},{h:1.20,w:.83,head:1.28}],
 signature(av){av=Wardrobe.normalize(av);return [av.style,av.skin,av.hair,av.outfit,av.hairStyle,av.shirtStyle,av.hat].join('|')},
 geometrySignature(av){av=Wardrobe.normalize(av);return[av.style,av.hairStyle,av.shirtStyle,av.hat].join('|')},
 updateColors(root,input){const av=Wardrobe.normalize(input),seen=new Set();root.traverse(o=>{const m=o.material;if(!m||seen.has(m))return;seen.add(m);const role=m.userData.avatarRole;if(role)m.color.set(av[role])});root.userData.signature=this.signature(av);root.userData.avatar=av},
 material(color,roughness=.88){return new THREE.MeshStandardMaterial({color,roughness,metalness:0})},
 mesh(parent,geometry,material,x=0,y=0,z=0,sx=1,sy=1,sz=1){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m},
 init(){
  if(typeof THREE==='undefined')return false;
  try{this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});this.renderer.setSize(256,320);this.renderer.setPixelRatio(1);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;
   this.scene=new THREE.Scene();this.scene.add(new THREE.HemisphereLight(0xfff9e9,0x66715a,2.3));const sun=new THREE.DirectionalLight(0xffedd2,2.2);sun.position.set(-3,5,5);this.scene.add(sun);this.camera=new THREE.OrthographicCamera(-.92,.92,1.15,-1.15,.1,30);this.camera.position.set(3,2.1,5);this.camera.lookAt(0,.90,0);
   this.sphere=new THREE.SphereGeometry(1,20,14);this.box=new THREE.BoxGeometry(1,1,1);this.cylinder=new THREE.CylinderGeometry(1,1,1,16);this.cone=new THREE.ConeGeometry(1,1,32);this.ready=true;return true;
  }catch(error){console.warn('Avatar renderer unavailable',error);return false}
 },
 build(input){
  const av=Wardrobe.normalize(input),p=this.profiles[av.style],root=new THREE.Group(),body=new THREE.Group();root.add(body);body.scale.set(p.w,p.h/1.5,1);body.position.y=-.0635*p.h/1.5;root.userData={signature:this.signature(av),geometrySignature:this.geometrySignature(av),avatar:av};
  const skin=this.material(av.skin),hair=this.material(av.hair),cloth=this.material(av.outfit),linen=this.material('#ebe3ce'),pants=this.material(av.shirtStyle==='overalls'?av.outfit:'#514332'),boot=this.material('#503c29'),eyes=this.material('#221c17'),white=this.material('#fff9e9'),wood=this.material('#b99a50'),brass=this.material('#cda34c',.55);
  skin.userData.avatarRole='skin';hair.userData.avatarRole='hair';cloth.userData.avatarRole='outfit';if(av.shirtStyle==='overalls')pants.userData.avatarRole='outfit';
  const sphere=(parent,mat,x,y,z,sx,sy,sz=sx)=>this.mesh(parent,this.sphere,mat,x,y,z,sx,sy,sz),box=(parent,mat,x,y,z,sx,sy,sz)=>this.mesh(parent,this.box,mat,x,y,z,sx,sy,sz);
  const torsoY=.91,torso=sphere(body,cloth,0,torsoY,0,.205,.29,.135);torso.name='shirt';
  // Different clothing changes the actual silhouette and garment construction.
  if(av.shirtStyle==='overalls'){
   torso.material=linen;box(body,cloth,0,.87,.131,.27,.29,.028);box(body,cloth,0,.78,.155,.17,.10,.025);
   for(const x of [-.112,.112]){box(body,cloth,x,1.04,.126,.045,.26,.035);sphere(body,brass,x,.951,.16,.016,.016,.009)}
  }else if(av.shirtStyle==='jacket'){
   for(const side of [-1,1]){const panel=box(body,cloth,side*.113,.94,.105,.14,.43,.09);panel.rotation.z=side*-.08;const collar=box(body,linen,side*.075,1.10,.16,.07,.19,.025);collar.rotation.z=side*-.45}
   box(body,boot,0,.78,.149,.42,.045,.028);
  }else{
   for(let i=0;i<4;i++)sphere(body,wood,0,.83+i*.07,.143,.011,.011,.007);
   for(const side of [-1,1]){const collar=box(body,linen,side*.045,1.10,.13,.07,.09,.022);collar.rotation.z=side*.38}
  }
  const arms=[],legs=[];
  for(const side of [-1,1]){
   const arm=new THREE.Group();arm.position.set(side*.21,1.06,0);body.add(arm);arm.rotation.z=side*.10;const sleeveMat=av.shirtStyle==='overalls'?linen:cloth;
   sphere(arm,sleeveMat,side*.025,-.12,0,.075,.17,.076);sphere(arm,skin,side*.035,-.285,.015,.052,.13,.052);sphere(arm,skin,side*.035,-.405,.015,.057,.067,.047);arms.push(arm);
   const leg=new THREE.Group();leg.position.set(side*.10,.67,0);body.add(leg);sphere(leg,pants,0,-.18,0,.092,.23,.09);sphere(leg,pants,0,-.40,.005,.073,.15,.075);sphere(leg,skin,0,-.52,.01,.052,.05,.052);box(leg,boot,0,-.574,.055,.14,.065,.23);box(leg,wood,0,-.541,.075,.145,.022,.08);legs.push(leg);
  }
  const head=new THREE.Group();head.position.set(0,1.30,0);head.scale.set(p.head*(av.style===2?1.08:av.style===1||av.style===4?.92:1),p.head,p.head);body.add(head);
  sphere(body,skin,0,1.16,0,.062,.09,.062);sphere(head,skin,0,0,0,.183,.211,.165);
  for(const side of [-1,1]){sphere(head,skin,side*.177,-.025,0,.034,.052,.034);sphere(head,white,side*.070,.004,.144,.040,.048,.022);sphere(head,eyes,side*.070,.002,.162,.023,.033,.012);sphere(head,white,side*.063,.018,.173,.008,.011,.004);const brow=box(head,hair,side*.071,.077,.146,.071,.016,.018);brow.rotation.z=side*-.09}
  sphere(head,skin,0,-.045,.163,.031,.035,.036);box(head,this.material('#995c4a'),0,-.111,.147,.052,.009,.008);
  if(av.style===1||av.style===4){const lip=this.material('#a15f53'),cheek=this.material('#d69a83');box(head,lip,0,-.105,.152,.054,.014,.012);for(const side of [-1,1]){sphere(head,cheek,side*.117,-.061,.129,.026,.014,.007);const lash=box(head,hair,side*.086,.039,.159,.067,.009,.014);lash.rotation.z=side*.17}}
  if(av.style===3){const grey=this.material('#b9b6a5');for(const side of [-1,1])sphere(head,grey,side*.039,-.082,.166,.054,.025,.026);sphere(head,grey,0,-.145,.122,.073,.042,.04)}
  // Hair shares the skull transform; nothing is placed using image bounding boxes.
  sphere(head,hair,0,.13,-.045,.185,.115,.158);
  if(av.hairStyle==='short'){for(let i=0;i<7;i++)sphere(head,hair,-.14+i*.045,.13+Math.sin(i)*.012,.09,.043,.052,.043)}
  if(av.hairStyle==='swept'){for(let i=0;i<7;i++){const lock=sphere(head,hair,-.12+i*.037,.145-i*.013,.132,.062,.035,.032);lock.rotation.z=.35}}
  if(av.hairStyle==='long'||av.hairStyle==='braid'){
   sphere(head,hair,0,-.03,-.13,.168,.24,.075);
   if(av.hairStyle==='long'){for(const side of [-1,1])sphere(head,hair,side*.165,-.18,-.025,.048,.25,.072)}
   else{for(let i=0;i<8;i++)sphere(head,hair,.155+Math.sin(i*2)*.014,-.10-i*.047,-.11,.035-i*.0018,.035,.034);box(head,this.material('#9b4842'),.155,-.44,-.11,.06,.035,.042)}
  }
  if(av.hairStyle==='curly'){for(let i=0;i<25;i++){const angle=i*2.4,r=.10+Math.sin(i)*.055;sphere(head,hair,Math.cos(angle)*r,.14+Math.sin(i*.8)*.055,Math.sin(angle)*r-.025,.062,.060,.060)}}
  const hat=new THREE.Group();hat.position.y=.195;head.add(hat);hat.name='hat-'+av.hat;
  if(av.hat==='non'){this.mesh(hat,this.cone,this.material('#cbb16b'),0,.072,0,.335,.17,.335);this.mesh(hat,this.cylinder,wood,0,-.012,0,.335,.012,.335)}
  if(av.hat==='rom'){this.mesh(hat,this.cylinder,wood,0,.049,0,.175,.115,.175);this.mesh(hat,this.cylinder,wood,0,-.009,0,.31,.020,.31);this.mesh(hat,this.cylinder,boot,0,.015,0,.179,.025,.179)}
  if(av.hat==='khan'){sphere(hat,this.material('#ddd8c6'),0,-.045,-.024,.198,.105,.168);sphere(hat,linen,.16,-.07,-.13,.052,.055,.047);const tie=box(hat,linen,.17,-.14,-.14,.06,.15,.026);tie.rotation.z=-.4}
  root.userData.rig={body,head,arms,legs,height:p.h,groundOffset:-.0635*p.h/1.5};return root;
 },
 animate(root,o={}){const rig=root.userData.rig;if(!rig)return;const t=o.t||0,walking=!!o.walk,phase=(o.phase||0)*Math.PI*2,swing=walking?Math.sin(phase)*.48:0;rig.legs[0].rotation.x=swing;rig.legs[1].rotation.x=-swing;rig.arms[0].rotation.x=-swing*.6;rig.arms[1].rotation.x=swing*.6;rig.body.position.y=rig.groundOffset+(walking?Math.abs(Math.sin(phase))*.025:Math.sin(t*2)*.006);if(o.work){rig.arms[0].rotation.x=rig.arms[1].rotation.x=-.75+Math.sin(t*5)*.25}if(o.fishing){rig.arms[0].rotation.x=-.85;rig.arms[1].rotation.x=-.65}},
 draw(c,x,y,h,av,o={}){
  if(!this.ready)return false;const signature=this.signature(av),dynamic=!!(o.walk||o.work||o.fishing),key=signature+'|'+(o.back?'back':'front');let cv=!dynamic&&this.cache.get(key);
  if(!cv){if(this.preview&&this.preview.userData.signature!==signature&&this.preview.userData.geometrySignature===this.geometrySignature(av))this.updateColors(this.preview,av);if(!this.preview||this.preview.userData.signature!==signature){if(this.preview){this.scene.remove(this.preview);this.dispose(this.preview)}this.preview=this.build(av);this.scene.add(this.preview);const bounds=new THREE.Box3().setFromObject(this.preview),center=bounds.getCenter(new THREE.Vector3()),height=bounds.max.y-bounds.min.y,half=height*.62;this.camera.left=-half*.8;this.camera.right=half*.8;this.camera.top=half;this.camera.bottom=-half;this.camera.position.set(3,center.y+1.7,5);this.camera.lookAt(0,center.y,0);this.camera.updateProjectionMatrix()}this.preview.rotation.y=o.back?Math.PI:0;this.animate(this.preview,o);this.renderer.render(this.scene,this.camera);cv=dynamic?(this.liveCanvas??=document.createElement('canvas')):document.createElement('canvas');if(cv.width!==256||cv.height!==320){cv.width=256;cv.height=320}const context=cv.getContext('2d');context.clearRect(0,0,256,320);context.drawImage(this.renderer.domElement,0,0);if(!dynamic){this.cache.set(key,cv);if(this.cache.size>64)this.cache.delete(this.cache.keys().next().value)}}
  const profile=this.profiles[Wardrobe.normalize(av).style],width=h*.8;c.drawImage(cv,x-width/2,y-h,width,h);if(o.rigOut){o.rigOut.x=x-h*.46;o.rigOut.y=y-h*.9;o.rigOut.handX=x-h*.13;o.rigOut.handY=y-h*.46}
  if(o.fishing){c.save();c.strokeStyle='#7f603c';c.lineWidth=Math.max(1.5,h*.012);c.beginPath();c.moveTo(x-h*.13,y-h*.46);c.quadraticCurveTo(x-h*.24,y-h*.84,x-h*.46,y-h*.9);c.stroke();c.restore()}return true;
 },
 optionIcon(av,key,size=64){const full=document.createElement('canvas');full.width=256;full.height=320;this.draw(full.getContext('2d'),128,320,320,av);const cv=document.createElement('canvas');cv.width=cv.height=size;const c=cv.getContext('2d');if(key==='shirtStyle')c.drawImage(full,59,112,138,148,0,0,size,size);else c.drawImage(full,51,0,154,154,0,0,size,size);return cv},
 dispose(root){const materials=new Set();root.traverse(o=>{if(o.material)materials.add(o.material)});for(const material of materials)material.dispose()},
};
const legacyWardrobeDraw=Wardrobe.draw.bind(Wardrobe);Wardrobe.draw=(...args)=>Avatar3D.draw(...args)||legacyWardrobeDraw(...args);
