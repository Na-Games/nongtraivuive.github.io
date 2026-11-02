'use strict';
/* One articulated sculpt for the editor, farm, portraits and fishing. */
const Avatar3D={
 ready:false,cache:new Map(),
 profiles:[{h:1.46,w:1.04,head:1.17},{h:1.43,w:.96,head:1.19},{h:1.64,w:1.14,head:1.11},{h:1.40,w:1.10,head:1.18},{h:1.54,w:.98,head:1.16},{h:1.24,w:.92,head:1.27}],
 signature(input){const a=Wardrobe.normalize(input);return[a.style,a.skin,a.hair,a.outfit,a.hairStyle,a.shirtStyle,a.hat].join('|')},
 geometrySignature(input){const a=Wardrobe.normalize(input);return[a.style,a.hairStyle,a.shirtStyle,a.hat].join('|')},
 material(color,roughness=.8){return new THREE.MeshStandardMaterial({color,roughness,metalness:0})},
 mesh(parent,g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1){const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh},
 sphere(p,m,x,y,z,sx,sy,sz=sx){return this.mesh(p,this.ball,m,x,y,z,sx,sy,sz)},
 tube(parent,points,radius,material){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),g=new THREE.TubeGeometry(curve,12,radius,6,false);return this.mesh(parent,g,material)},
 init(){if(this.ready)return true;if(typeof THREE==='undefined')return false;try{
  this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});this.renderer.setSize(320,400);this.renderer.setPixelRatio(1);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.0;
  this.scene=new THREE.Scene();this.scene.add(new THREE.HemisphereLight(0xfff7e6,0x6d8078,1.65));const light=new THREE.DirectionalLight(0xffe6c7,2.1);light.position.set(-3,5,6);this.scene.add(light);const rim=new THREE.DirectionalLight(0xc9e5ef,.8);rim.position.set(3,3,-2);this.scene.add(rim);this.camera=new THREE.OrthographicCamera(-.8,.8,1,-1,.1,20);
  this.ball=new THREE.SphereGeometry(1,20,16);this.box=new THREE.BoxGeometry(1,1,1);this.cylinder=new THREE.CylinderGeometry(1,1,1,20);this.cone=new THREE.ConeGeometry(1,1,40);this.capsule=new THREE.CapsuleGeometry(1,1,6,16);
  const points=[[-.035,.18],[0,.185],[.035,.19],[.10,.194],[.28,.205],[.40,.181],[.445,.12]].map(([y,x])=>new THREE.Vector2(x,y));this.torsoGeometry=new THREE.LatheGeometry(points,24);
  this.headGeometry=this.ball.clone();const pos=this.headGeometry.attributes.position;for(let i=0;i<pos.count;i++){const y=pos.getY(i),jaw=y<-.25?1-(Math.abs(y)-.25)*.16:1;pos.setX(i,pos.getX(i)*jaw);if(y<-.25)pos.setZ(i,pos.getZ(i)*.96)}this.headGeometry.computeVertexNormals();const weave=document.createElement('canvas');weave.width=weave.height=64;const wc=weave.getContext('2d');wc.fillStyle='#888';wc.fillRect(0,0,64,64);for(let i=0;i<64;i+=4){wc.fillStyle='#a5a5a5';wc.fillRect(i,0,1,64);wc.fillStyle='#707070';wc.fillRect(0,i,64,1)}this.fabric=new THREE.CanvasTexture(weave);this.fabric.wrapS=this.fabric.wrapT=THREE.RepeatWrapping;this.fabric.repeat.set(3,3);this.ready=true;return true;
 }catch(error){console.warn('Avatar renderer unavailable',error);return false}},
 updateColors(root,input){const a=Wardrobe.normalize(input),seen=new Set();root.traverse(o=>{const m=o.material;if(!m||seen.has(m))return;seen.add(m);if(m.userData.avatarRole)m.color.set(a[m.userData.avatarRole]);if(m.userData.skinMultiplier)m.color.set(a.skin).multiplyScalar(m.userData.skinMultiplier);if(m.userData.skinTint)m.color.set(a.skin).lerp(new THREE.Color('#dd8d79'),m.userData.skinTint)});root.userData.signature=this.signature(a);root.userData.avatar=a},
 build(input){
  const a=Wardrobe.normalize(input),profile=this.profiles[a.style],root=new THREE.Group(),body=new THREE.Group();root.add(body);body.scale.set(profile.w,profile.h/1.5,1);root.userData={signature:this.signature(a),geometrySignature:this.geometrySignature(a),avatar:a};
  const skin=this.material(a.skin,.72),hair=this.material(a.hair,.83),cloth=this.material(a.outfit,.94),linen=this.material('#e8dfcb',.95),pants=this.material(a.shirtStyle==='overalls'?a.outfit:'#45505a'),shoe=this.material('#594432'),sole=this.material('#b49872'),eye=this.material('#30231d',.28),white=this.material('#fffbef',.5),brass=this.material('#b89a55',.46);
  for(const m of [cloth,linen,pants]){m.bumpMap=this.fabric;m.bumpScale=.0025}skin.userData.avatarRole='skin';hair.userData.avatarRole='hair';cloth.userData.avatarRole='outfit';if(a.shirtStyle==='overalls')pants.userData.avatarRole='outfit';
  const ball=(p,m,x,y,z,sx,sy,sz=sx)=>this.sphere(p,m,x,y,z,sx,sy,sz),box=(p,m,x,y,z,sx,sy,sz)=>this.mesh(p,this.box,m,x,y,z,sx,sy,sz);
  this.mesh(body,this.torsoGeometry,a.shirtStyle==='overalls'?linen:cloth,0,.565,0,1,1,.72);ball(body,pants,0,.555,0,.167,.065,.115);
  if(a.shirtStyle==='overalls'){
   box(body,cloth,0,.776,.139,.275,.29,.028);box(body,cloth,0,.735,.16,.12,.09,.022);
   for(const x of [-.105,.105]){box(body,cloth,x,.917,.127,.045,.245,.023);ball(body,brass,x,.85,.15,.014,.014,.008)}
  }else{
   for(let i=0;i<4;i++)ball(body,brass,0,.66+i*.075,.145,.008,.008,.004);
   for(const side of [-1,1]){const collar=box(body,linen,side*.041,.982,.10,.072,.096,.018);collar.rotation.z=side*-.46}
   if(a.shirtStyle==='jacket'){for(const side of [-1,1]){const lapel=box(body,cloth,side*.09,.87,.147,.09,.27,.025);lapel.rotation.z=side*-.19;box(body,linen,side*.135,.735,.141,.072,.005,.007)}box(body,shoe,0,.659,.14,.36,.035,.022)}
  }
  const arms=[],elbows=[],hands=[],legs=[],knees=[],feet=[];
  // Soft workwear: stitched pockets, a neckerchief and a small brass clasp.
  for(const side of [-1,1]){
   box(body,linen,side*.107,.74,.147,.071,.073,.012);
   this.tube(body,[[side*.14,.77,.156],[side*.14,.714,.156],[side*.075,.714,.156]],.0024,brass);
  }
  const scarf=this.material(['#da7951','#cf817c','#d8ac51','#6c9388','#b394bf','#76a796'][a.style]);
  this.tube(body,[[-.077,1.015,.03],[0,.975,.105],[.077,1.015,.03]],.021,scarf);
  const knot=ball(body,scarf,.021,.985,.13,.029,.025,.021);knot.rotation.z=-.3;
  const scarfEnd=box(body,scarf,.034,.931,.147,.04,.09,.018);scarfEnd.rotation.z=-.24;
  for(const side of [-1,1]){
   const arm=new THREE.Group();arm.position.set(side*.202,.96,0);body.add(arm);arm.rotation.z=side*.09;
   ball(arm,a.shirtStyle==='overalls'?linen:cloth,side*.018,-.107,0,.073,.145,.073);const elbow=new THREE.Group();elbow.position.set(side*.025,-.205,0);arm.add(elbow);ball(elbow,skin,0,-.082,0,.046,.102,.047);ball(elbow,skin,0,-.176,.008,.048,.058,.038);
   for(let i=0;i<4;i++)ball(elbow,skin,-.027+i*.018,-.204,.018,.010,.025,.011);ball(elbow,skin,side*.043,-.175,.023,.018,.029,.017);arms.push(arm);elbows.push(elbow);hands.push(elbow);
   const leg=new THREE.Group();leg.position.set(side*.095,.548,0);body.add(leg);this.mesh(leg,this.capsule,pants,0,-.111,0,.073,.088,.074);const knee=new THREE.Group();knee.position.y=-.23;leg.add(knee);this.mesh(knee,this.capsule,pants,0,-.106,0,.060,.081,.061);ball(knee,shoe,0,-.253,.038,.075,.049,.112);box(knee,sole,0,-.287,.043,.137,.020,.198);box(knee,linen,0,-.205,.015,.127,.025,.12);legs.push(leg);knees.push(knee);feet.push(knee);
  }
  const head=new THREE.Group();head.position.set(0,1.247,-.006);head.scale.setScalar(profile.head);body.add(head);ball(body,skin,0,1.028,0,.057,.077,.056);this.mesh(head,this.headGeometry,skin,0,0,0,.226,.250,.204);
  const eyeParts=[];for(const side of [-1,1]){
   ball(head,skin,side*.216,-.028,-.002,.034,.052,.029);const inner=this.material(new THREE.Color(a.skin).multiplyScalar(.88));inner.userData.skinMultiplier=.88;ball(head,inner,side*.229,-.027,.015,.010,.025,.009);
   const eyes=new THREE.Group();eyes.position.set(side*.084,.012,.193);head.add(eyes);ball(eyes,white,0,0,0,.048,.039,.011);ball(eyes,eye,-side*.003,-.001,.010,.029,.035,.009);ball(eyes,white,-.008,.012,.020,.010,.011,.003);ball(eyes,white,.012,-.011,.020,.004,.005,.002);eyeParts.push(eyes);
   this.tube(head,[[side*.041,.082,.175],[side*.082,.095,.180],[side*.125,.079,.161]],.006,hair);
   const cheek=this.material(new THREE.Color(a.skin).lerp(new THREE.Color('#e99a88'),.35));cheek.userData.skinTint=.35;
   ball(head,cheek,side*.142,-.064,.159,.032,.016,.004);
   if(a.style===1||a.style===4)this.tube(head,[[side*.049,.028,.184],[side*.09,.044,.184],[side*.129,.035,.170]],.0035,hair);
  }
  ball(head,skin,0,-.047,.195,.021,.025,.020);this.tube(head,[[-.035,-.112,.190],[0,-.122,.190],[.035,-.111,.190]],.0035,this.material('#925947'));
  if(a.style===3){const grey=this.material('#c0bdac');for(const side of [-1,1])ball(head,grey,side*.03,-.092,.183,.042,.018,.019);ball(head,grey,0,-.155,.146,.056,.044,.026)}
  // A continuous cap and swept locks replace the old clusters of floating balls.
  const cap=new THREE.SphereGeometry(1,24,16,0,Math.PI*2,0,1.40);this.mesh(head,cap,hair,0,.018,-.021,.233,.254,.205);ball(head,hair,0,.065,-.10,.221,.19,.108);
  const locks=a.hairStyle==='curly'?0:5;for(let i=0;i<locks;i++){const x=-.155+i/(locks-1)*.31,rootX=a.hairStyle==='swept'?.10:x*.5,tipY=a.hairStyle==='curly'?.10+Math.sin(i*2)*.025:.105-i*.006;this.tube(head,[[rootX,.239,.035],[x*.8,.211,.141],[x,tipY,.184]],a.hairStyle==='curly'?.027:.035,hair)}
  if(a.hairStyle==='curly')for(let i=0;i<13;i++){const x=-.17+(i%7)*.055,y=.17+Math.floor(i/7)*.045,points=[];for(let j=0;j<12;j++){const angle=j/11*Math.PI*2;points.push([x+Math.cos(angle)*.026,y+Math.sin(angle)*.025,.21+Math.floor(i/7)*-.04+j*.001])}this.tube(head,points,.014,hair)}if(a.hairStyle==='long'||a.hairStyle==='braid'){
   ball(head,hair,0,-.07,-.158,.20,.248,.088);for(const side of [-1,1])this.tube(head,[[side*.17,.10,.08],[side*.21,-.04,.045],[side*.19,-.26,-.015]],.040,hair);
   if(a.hairStyle==='braid'){for(let i=0;i<8;i++)ball(head,hair,.18+Math.sin(i*2.5)*.016,-.17-i*.036,-.14,.029-i*.0015,.029,.025);box(head,this.material('#986653'),.18,-.425,-.14,.047,.023,.027)}
  }
  const hat=new THREE.Group();hat.position.y=.242;head.add(hat);hat.name='hat-'+a.hat;
  if(a.hat==='non'){this.mesh(hat,this.cone,this.material('#c7aa6f'),0,.072,0,.332,.16,.332);this.mesh(hat,this.cylinder,brass,0,-.009,0,.333,.010,.333);for(let i=0;i<20;i++){const t=i/20*Math.PI*2;this.tube(hat,[[0,.151,0],[Math.sin(t)*.17,.072,Math.cos(t)*.17],[Math.sin(t)*.33,-.005,Math.cos(t)*.33]],.0016,linen)}}
  if(a.hat==='rom'){this.mesh(hat,this.cylinder,this.material('#bda06b'),0,.041,0,.177,.112,.177);this.mesh(hat,this.cylinder,brass,0,-.012,0,.305,.014,.305);this.mesh(hat,this.cylinder,shoe,0,.009,0,.180,.025,.180)}
  if(a.hat==='khan'){ball(hat,linen,0,-.043,-.01,.239,.095,.207);ball(hat,linen,.19,-.064,-.13,.048,.035,.035);this.tube(hat,[[.19,-.06,-.13],[.22,-.13,-.16],[.20,-.22,-.13]],.022,linen)}
  root.userData.rig={body,head,arms,elbows,hands,legs,knees,feet,eyeParts,hat,height:profile.h,groundOffset:0};return root;
 },
 animate(root,o={}){
  const r=root.userData.rig;if(!r)return;const t=o.t||0,moving=o.walk?Math.min(1,o.blend??1):0,phase=(o.phase||0)*Math.PI*2,wave=Math.sin(phase),reduced=typeof S!=='undefined'&&S.fx.reduceMotion&&!o.exportPose;
  r.body.position.y=reduced?0:Math.abs(Math.sin(phase))*.022*moving+Math.sin(t*1.8)*.007*(1-moving);r.body.rotation.z=reduced?0:wave*.035*moving;r.body.rotation.y=reduced?0:Math.sin(phase)*.035*moving;r.head.rotation.y=reduced?0:Math.sin(t*.7)*.065*(1-moving);r.head.rotation.z=reduced?0:Math.sin(t*1.2)*.023;
  r.hat.rotation.z=reduced?0:-wave*.025*moving;
  for(let i=0;i<2;i++){const cycle=phase+i*Math.PI,step=Math.sin(cycle)*moving;r.legs[i].rotation.x=reduced?0:step*.50;r.knees[i].rotation.x=reduced?0:Math.max(0,-step)*.78;r.arms[i].rotation.x=reduced?0:-step*.40;r.arms[i].rotation.z=(i?1:-1)*(.09+(reduced?0:Math.sin(t*1.8)*.015));r.elbows[i].rotation.x=-.14-(reduced?0:Math.max(0,step)*.24)}
  const blink=!reduced&&t%4.7>4.54?.16:1;for(const eyes of r.eyeParts)eyes.scale.y=blink*(eyes.userData.restY||1);
  if(o.work){for(let i=0;i<2;i++){r.arms[i].rotation.x=-.65+(reduced?0:Math.sin(t*4)*.24);r.elbows[i].rotation.x=-.45-(reduced?0:Math.sin(t*4)*.22)}r.body.rotation.x=.10}else r.body.rotation.x=0;
  if(o.fishing){const cast=o.fishState==='wait'?Math.max(0,1-((t-(o.castAt||0))/.5)):0,reel=o.reel&&!reduced?Math.sin(t*9)*.18:0;r.arms[0].rotation.x=-.74-cast*.65;r.arms[1].rotation.x=-.44;r.elbows[0].rotation.x=-.48+reel;r.elbows[1].rotation.x=-.85-reel;r.head.rotation.x=.08;r.body.rotation.x=o.reel?-.08:0}else r.head.rotation.x=0;
 },
 draw(c,x,y,h,input,o={}){
  if(!this.ready)return false;const a=Wardrobe.normalize(input),signature=this.signature(a),dynamic=!!(o.preview||o.walk||o.work||o.fishing),key=signature+'|'+(o.back?'back':'front');let cv=!dynamic&&this.cache.get(key);
  if(!cv){if(this.preview?.userData.signature!==signature&&this.preview?.userData.geometrySignature===this.geometrySignature(a))this.updateColors(this.preview,a);if(!this.preview||this.preview.userData.signature!==signature){if(this.preview){this.scene.remove(this.preview);this.dispose(this.preview)}this.preview=this.build(a);this.scene.add(this.preview);const bounds=new THREE.Box3().setFromObject(this.preview),center=bounds.getCenter(new THREE.Vector3()),frame=typeof FarmerDesign!=="undefined"?FarmerDesign.frame(a):{half:(bounds.max.y-bounds.min.y)*.57,center:center.y};const half=frame.half;this.camera.left=-half*.8;this.camera.right=half*.8;this.camera.top=half;this.camera.bottom=-half;this.camera.position.set(2.0,frame.center+.85,7);this.camera.lookAt(0,frame.center,0);this.camera.updateProjectionMatrix()}this.preview.rotation.y=o.angle??(o.back?Math.PI:0);this.animate(this.preview,o);this.renderer.render(this.scene,this.camera);cv=dynamic?(this.liveCanvas??=document.createElement('canvas')):document.createElement('canvas');if(cv.width!==320||cv.height!==400){cv.width=320;cv.height=400}const cc=cv.getContext('2d');cc.clearRect(0,0,320,400);cc.drawImage(this.renderer.domElement,0,0);if(!dynamic){this.cache.set(key,cv);if(this.cache.size>64)this.cache.delete(this.cache.keys().next().value)}}
  const width=h*.8;c.drawImage(cv,x-width/2,y-h,width,h);
  if(o.fishing){const hand=this.preview.userData.rig.hands[0].localToWorld(new THREE.Vector3(0,-.19,.03)).project(this.camera),hx=x+hand.x*width/2,hy=y-h+(1-hand.y)*h/2,tipX=hx-h*.33,tipY=hy-h*.51;c.save();c.strokeStyle='#795b37';c.lineWidth=Math.max(1.5,h*.012);c.beginPath();c.moveTo(hx,hy);c.quadraticCurveTo(hx-h*.15,hy-h*.44,tipX,tipY);c.stroke();c.restore();if(o.rigOut)Object.assign(o.rigOut,{x:tipX,y:tipY,handX:hx,handY:hy})}return true;
 },
 optionIcon(a,key,size=64){this.optionCache??=new Map();const cacheKey=this.signature(a)+'|'+key+'|'+size;if(this.optionCache.has(cacheKey)){const cached=this.optionCache.get(cacheKey),copy=document.createElement('canvas');copy.width=copy.height=size;copy.getContext('2d').drawImage(cached,0,0);return copy}const full=document.createElement('canvas');full.width=320;full.height=400;this.draw(full.getContext('2d'),160,400,400,a);const cv=document.createElement('canvas');cv.width=cv.height=size;const c=cv.getContext('2d');if(key==='shirtStyle')c.drawImage(full,70,173,180,169,0,0,size,size);else c.drawImage(full,55,4,210,210,0,0,size,size);this.optionCache.set(cacheKey,cv);if(this.optionCache.size>96)this.optionCache.delete(this.optionCache.keys().next().value);return cv},
 dispose(root){const materials=new Set(),geometries=new Set();root.traverse(o=>{if(o.material)materials.add(o.material);if(o.geometry&&!Object.values(this).includes(o.geometry))geometries.add(o.geometry)});for(const m of materials)m.dispose();for(const g of geometries)g.dispose()},
};
const legacyWardrobeDraw=Wardrobe.draw.bind(Wardrobe);Wardrobe.draw=(...args)=>Avatar3D.draw(...args)||legacyWardrobeDraw(...args);
