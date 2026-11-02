'use strict';
/* All screens and exported PNGs share this articulated, separately fitted wardrobe. */
const FarmerDesign={
 version:5,
 profiles:[
  {h:1.80,w:1,head:1,eye:1,jaw:1,cheek:1},
  {h:1.74,w:.93,head:1.02,eye:1.08,jaw:.91,cheek:.96},
  {h:1.97,w:1.18,head:.98,eye:.91,jaw:1.10,cheek:1.06},
  {h:1.69,w:1.08,head:1.01,eye:.84,jaw:1.04,cheek:1.04},
  {h:1.86,w:.95,head:1,eye:1.03,jaw:.93,cheek:.96},
  {h:1.48,w:.90,head:1.15,eye:1.13,jaw:.94,cheek:1.04},
 ],
 material(color,role,part,roughness=.83){const m=Avatar3D.material(color,roughness);m.userData.avatarPart=part;if(role)m.userData.avatarRole=role;return m},
 build(input){
  const a=Wardrobe.normalize(input),profile=this.profiles[a.style],root=new THREE.Group(),body=new THREE.Group(),torso=new THREE.Group();root.add(body);body.add(torso);body.scale.set(profile.w,profile.h/1.8,1);
  root.userData={signature:Avatar3D.signature(a),geometrySignature:Avatar3D.geometrySignature(a),avatar:a,designVersion:this.version};
  const skin=this.material(a.skin,'skin','body',.77),hair=this.material(a.hair,'hair','hair'),cloth=this.material(a.outfit,'outfit','garment',.96),linen=this.material('#f5ebd9',null,'garment',.98),pants=this.material(a.shirtStyle==='overalls'?a.outfit:'#344a56',a.shirtStyle==='overalls'?'outfit':null,a.shirtStyle==='overalls'?'garment':'body'),leather=this.material('#724c30',null,'body'),sole=this.material('#b38b5c',null,'body'),eyeWhite=this.material('#fff9e9',null,'body',.45),iris=this.material('#513121',null,'body',.4),pupil=this.material('#201a17',null,'body',.3),button=this.material('#d1ad65',null,'garment',.55);
  const ball=(p,m,x,y,z,sx,sy,sz=sx)=>Avatar3D.sphere(p,m,x,y,z,sx,sy,sz),box=(p,m,x,y,z,w,h,d)=>Avatar3D.mesh(p,Avatar3D.box,m,x,y,z,w,h,d),tube=(p,points,r,m)=>Avatar3D.tube(p,points,r,m);
  for(const m of [cloth,linen,pants]){m.bumpMap=Avatar3D.fabric;m.bumpScale=.0012}
  const torsoMat=a.shirtStyle==='overalls'?linen:cloth;
  const points=[[.0,.17],[.035,.205],[.15,.212],[.32,.232],[.43,.21],[.49,.12]].map(([y,r])=>new THREE.Vector2(r,y));
  const torsoGeometry=new THREE.LatheGeometry(points,28);Avatar3D.mesh(torso,torsoGeometry,torsoMat,0,.635,0,1,1,.72);ball(torso,pants,0,.64,0,.19,.085,.13);
  // Actual collar and seams follow the garment instead of floating in front of it.
  const collar= a.shirtStyle==='overalls'?linen:this.material('#f3e5ce',null,'garment');
  for(const side of [-1,1]){const leaf=ball(torso,collar,side*.052,1.086,.116,.046,.063,.014);leaf.rotation.z=side*-.48}
  if(a.shirtStyle==='overalls'){
   box(torso,cloth,0,.875,.151,.278,.31,.023);ball(torso,cloth,0,.73,.14,.17,.09,.025);
   for(const side of [-1,1]){const strap=box(torso,cloth,side*.106,1.02,.117,.043,.24,.021);strap.rotation.z=side*-.08;ball(torso,button,side*.105,.952,.151,.013,.013,.007)}
   box(torso,cloth,0,.846,.174,.103,.081,.012);tube(torso,[[-.045,.88,.184],[-.045,.81,.184],[.045,.81,.184],[.045,.88,.184]],.0025,linen);
  }else{
   tube(torso,[[0,.70,.154],[0,.88,.166],[0,1.064,.124]],.004,collar);
   for(let i=0;i<4;i++)ball(torso,button,0,.744+i*.078,.164-i*.003,.008,.008,.005);
   const pocket=box(torso,cloth,-.109,.935,.152,.086,.09,.014);pocket.rotation.y=-.08;tube(torso,[[-.148,.969,.162],[-.148,.902,.162],[-.108,.889,.167],[-.067,.902,.162]],.0024,collar);
   if(a.shirtStyle==='jacket'){
    const lining=this.material('#eee0c6',null,'garment');box(torso,lining,0,.895,.17,.055,.31,.013);
    for(const side of [-1,1]){const lapel=ball(torso,cloth,side*.065,1.008,.153,.045,.13,.022);lapel.rotation.z=side*-.23;box(torso,cloth,side*.127,.77,.157,.093,.067,.015);tube(torso,[[side*.08,.80,.173],[side*.17,.80,.163]],.004,lining)}
    tube(torso,[[-.18,.68,.09],[0,.66,.155],[.18,.68,.09]],.012,cloth);
   }
  }
  const scarf=this.material(['#c98b43','#d59b7b','#e0bd69','#799c91','#b7a3bf','#d9ab58'][a.style],null,'garment');
  tube(torso,[[-.074,1.115,.035],[0,1.075,.12],[.074,1.115,.035]],.015,scarf);ball(torso,scarf,.019,1.079,.143,.021,.022,.014);const end=box(torso,scarf,.033,1.031,.148,.025,.067,.012);end.rotation.z=-.22;
  const arms=[],elbows=[],hands=[],legs=[],knees=[],feet=[];
  for(const side of [-1,1]){
   const arm=new THREE.Group();arm.position.set(side*.222,1.067,0);body.add(arm);arm.rotation.z=side*.08;
   ball(arm,torsoMat,side*.008,-.095,0,.080,.14,.079);const cuff=ball(arm,a.shirtStyle==='overalls'?linen:cloth,side*.015,-.195,0,.071,.036,.071);cuff.rotation.z=side*.08;
   const elbow=new THREE.Group();elbow.position.set(side*.018,-.217,0);arm.add(elbow);ball(elbow,skin,0,-.083,0,.049,.105,.048);
   ball(elbow,skin,0,-.176,.008,.049,.059,.035);for(let i=0;i<4;i++)ball(elbow,skin,-.026+i*.017,-.205,.013,.010,.025,.011);ball(elbow,skin,side*.042,-.176,.03,.018,.028,.017);arms.push(arm);elbows.push(elbow);hands.push(elbow);
   const leg=new THREE.Group();leg.position.set(side*.103,.65,0);body.add(leg);Avatar3D.mesh(leg,Avatar3D.capsule,pants,0,-.136,0,.079,.093,.077);
   const knee=new THREE.Group();knee.position.y=-.285;leg.add(knee);Avatar3D.mesh(knee,Avatar3D.capsule,pants,0,-.115,0,.064,.081,.065);ball(knee,pants,0,-.222,0,.068,.024,.068);
   ball(knee,sole,0,-.296,.044,.081,.022,.137);ball(knee,skin,0,-.265,.049,.065,.036,.108);
   for(const z of [-.005,.071]){const sandal=ball(knee,leather,0,-.247,z,.075,.013,.024);sandal.rotation.z=side*.05}tube(knee,[[-.068,-.267,-.015],[-.063,-.243,-.058],[.063,-.243,-.058],[.068,-.267,-.015]],.012,leather);
   legs.push(leg);knees.push(knee);feet.push(knee);
  }
  ball(torso,skin,0,1.133,0,.064,.087,.06);
  const head=new THREE.Group();head.position.set(0,1.40,-.002);head.scale.setScalar(profile.head);body.add(head);
  Avatar3D.mesh(head,Avatar3D.headGeometry,skin,0,0,0,.255*profile.cheek,.293,.239*profile.jaw);
  const eyeParts=[];for(const side of [-1,1]){
   ball(head,skin,side*.25,-.022,-.015,.043,.060,.032);
   const inner=this.material(new THREE.Color(a.skin).multiplyScalar(.82),null,'body');inner.userData.skinMultiplier=.82;ball(head,inner,side*.272,-.021,.011,.013,.031,.009);
   const eye=new THREE.Group();eye.position.set(side*.091,.021,.222);eye.rotation.y=side*.13;head.add(eye);eye.scale.y=profile.eye;
   ball(eye,eyeWhite,0,0,0,.049,.049,.012);ball(eye,iris,-side*.003,-.001,.010,.031,.039,.010);ball(eye,pupil,-side*.003,-.001,.019,.019,.030,.006);ball(eye,eyeWhite,-.009,.014,.026,.010,.011,.003);ball(eye,eyeWhite,.011,-.011,.027,.004,.005,.002);eyeParts.push(eye);eye.userData.restY=profile.eye;
   tube(head,[[side*.048,.098,.219],[side*.091,.111,.219],[side*.137,.094,.198]],a.style===2?.009:.006,hair);
   const blush=this.material(new THREE.Color(a.skin).lerp(new THREE.Color('#dd8d79'),a.style===3?.12:.2),null,'body');blush.userData.skinTint=a.style===3?.12:.2;
   ball(head,blush,side*.163,-.059,.184,.034,.016,.003);
   if(a.style===3){const wrinkle=this.material(new THREE.Color(a.skin).multiplyScalar(.72),null,'body');wrinkle.userData.skinMultiplier=.72;tube(head,[[side*.139,.003,.198],[side*.165,-.005,.18],[side*.174,-.002,.17]],.002,wrinkle);tube(head,[[side*.056,.15,.212],[side*.10,.153,.198],[side*.14,.147,.183]],.002,wrinkle)}
  }
  ball(head,skin,0,-.049,.234,.026,.033,.029);ball(head,skin,0,-.066,.24,.032,.016,.023);
  const lip=this.material(new THREE.Color(a.skin).multiplyScalar(.58),null,'body');lip.userData.skinMultiplier=.58;
  tube(head,[[-.045,-.112,.211],[0,-.126,.220],[.045,-.112,.211]],a.style===5?.0045:.0035,lip);
  if(a.style===3){for(const side of [-1,1]){const moustache=ball(head,hair,side*.034,-.096,.215,.041,.014,.014);moustache.rotation.z=side*-.18}ball(head,hair,0,-.171,.16,.066,.034,.025)}
  this.hair(head,a,profile,hair,ball,tube);
  const hat=new THREE.Group();hat.position.y=.268;hat.name='hat-'+a.hat;head.add(hat);this.hat(hat,a,ball,tube);
  root.userData.rig={body,head,arms,elbows,hands,legs,knees,feet,eyeParts,hat,height:profile.h,groundOffset:0};
  // Merge only rigid pieces of the same material; all animated joints stay separate.
  this.batch(torso);for(const arm of arms){const elbow=elbows[arms.indexOf(arm)];arm.remove(elbow);this.batch(arm);arm.add(elbow);this.batch(elbow)}for(const knee of knees)this.batch(knee);
  head.remove(hat,...eyeParts);this.batch(head);head.add(hat,...eyeParts);this.batch(hat);for(const eye of eyeParts)this.batch(eye);
  return root;
 },
 hair(head,a,profile,mat,ball,tube){
  const cap=new THREE.SphereGeometry(1,28,18,0,Math.PI*2,0,1.43);Avatar3D.mesh(head,cap,mat,0,.012,-.018,.263*profile.cheek,.299,.247);
  ball(head,mat,0,.057,-.142,.235,.22,.108);
  if(a.hairStyle==='short')for(let i=0;i<6;i++){const x=-.175+i*.067;tube(head,[[x*.55,.277,.03],[x,.23,.165],[x*.97,.119+(i%2)*.017,.217]],.033,mat)}
  if(a.hairStyle==='swept')for(let i=0;i<7;i++){const x=-.18+i*.054;tube(head,[[.115,.266,-.005],[x*.5,.258,.156],[x,.10+(i/6)*.07,.22]],.036,mat)}
  if(a.hairStyle==='curly')for(let i=0;i<22;i++){const angle=i*2.399,rad=.06+Math.sqrt(i/22)*.17;ball(head,mat,Math.cos(angle)*rad,.197+Math.sin(angle)*.065,.105+(i%3)*.038,.045,.048,.041)}
  if(a.hairStyle==='long'||a.hairStyle==='braid'){
   ball(head,mat,0,-.113,-.178,.226,.31,.092);
   for(const side of [-1,1])tube(head,[[side*.17,.19,.096],[side*.247,.02,.057],[side*.229,-.20,.004],[side*.19,-.335,-.051]],.043,mat);
   for(let i=0;i<4;i++){const x=-.16+i*.095;tube(head,[[.08,.27,.045],[x,.24,.166],[x,.147,.217]],.029,mat)}
   if(a.hairStyle==='braid'){
    for(let i=0;i<9;i++){const y=-.13-i*.042;for(const side of [-1,1])ball(head,mat,.19+side*.014*Math.cos(i*.8),y,-.135+side*.021*Math.sin(i*.8),.030-i*.001,.032,.029)}
    const tie=this.material('#c98772',null,'hair');ball(head,tie,.19,-.49,-.135,.033,.014,.03);
   }
  }
 },
 hat(hat,a,ball,tube){
  const straw=this.material('#d4b579',null,'hat',.97),edge=this.material('#b59158',null,'hat'),weave=this.material('#f1d8a1',null,'hat'),band=this.material('#8e6850',null,'hat');
  if(a.hat==='non'){
   const cone=new THREE.ConeGeometry(.372,.20,48,1,true),material=straw;material.side=THREE.DoubleSide;Avatar3D.mesh(hat,cone,material,0,.085,0);
   const brim=new THREE.TorusGeometry(.371,.007,6,48),rim=Avatar3D.mesh(hat,brim,edge,0,-.015,0);rim.rotation.x=Math.PI/2;
   for(let i=0;i<20;i++){const t=i/20*Math.PI*2;tube(hat,[[0,.183,0],[Math.sin(t)*.18,.088,Math.cos(t)*.18],[Math.sin(t)*.368,-.012,Math.cos(t)*.368]],.0018,weave)}
   for(const r of [.09,.18,.27]){const ring=Avatar3D.mesh(hat,new THREE.TorusGeometry(r,.0017,4,40),weave,0,.183-r/.372*.20,0);ring.rotation.x=Math.PI/2}
   // Chin straps are part of the hat, attached to the sides instead of covering the face.
   for(const side of [-1,1])tube(hat,[[side*.26,-.013,-.045],[side*.258,-.27,-.02],[side*.16,-.45,.06]],.004,this.material('#a87969',null,'hat'));
  }
  if(a.hat==='rom'){
   Avatar3D.mesh(hat,new THREE.CylinderGeometry(.187,.205,.13,32),straw,0,.04,0);
   const brim=Avatar3D.mesh(hat,new THREE.CylinderGeometry(.33,.333,.014,48),straw,0,-.026,0);brim.rotation.z=-.045;
   Avatar3D.mesh(hat,new THREE.CylinderGeometry(.202,.205,.034,32),band,0,-.006,0);
   const ribbon=ball(hat,band,.201,.001,-.025,.015,.026,.049);ribbon.rotation.z=-.3;
   for(let i=0;i<3;i++){const r=.235+i*.035,ring=Avatar3D.mesh(hat,new THREE.TorusGeometry(r,.0018,4,40),weave,0,-.016,0);ring.rotation.x=Math.PI/2}
  }
  if(a.hat==='khan'){
   const fabric=this.material('#ece6ce',null,'hat',1),trim=this.material('#7e7e68',null,'hat');ball(hat,fabric,0,-.037,-.04,.268,.098,.226);
   const peak=new THREE.BufferGeometry();peak.setAttribute('position',new THREE.Float32BufferAttribute([-.11,-.05,.178,0,-.12,.25,.11,-.05,.178],3));peak.computeVertexNormals();const pm=fabric.clone();pm.side=THREE.DoubleSide;Avatar3D.mesh(hat,peak,pm);
   for(const side of [-1,1]){const knot=ball(hat,fabric,side*.19,-.083,-.17,.058,.025,.061);knot.rotation.y=side*.5;tube(hat,[[side*.19,-.09,-.17],[side*.22,-.17,-.19],[side*.19,-.25,-.16]],.019,fabric)}
   tube(hat,[[-.20,-.08,.09],[0,-.083,.205],[.20,-.08,.09]],.003,trim);
  }
 },
 batch(root){
  root.updateMatrixWorld(true);const inverse=new THREE.Matrix4().copy(root.matrixWorld).invert(),groups=new Map(),remove=[],v=new THREE.Vector3();
  root.traverse(o=>{if(!o.isMesh)return;const m=o.material;let data=groups.get(m);if(!data){data={p:[],n:[],uv:[]};groups.set(m,data)}const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry,matrix=new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld),normalMatrix=new THREE.Matrix3().getNormalMatrix(matrix),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(matrix);data.p.push(v.x,v.y,v.z);v.fromBufferAttribute(n,i).applyMatrix3(normalMatrix).normalize();data.n.push(v.x,v.y,v.z);data.uv.push(uv?uv.getX(i):0,uv?uv.getY(i):0)}if(g!==o.geometry)g.dispose();remove.push(o)});
  const shared=new Set(Object.values(Avatar3D).filter(v=>v?.isBufferGeometry)),disposed=new Set();for(const o of remove){o.removeFromParent();if(!shared.has(o.geometry)&&!disposed.has(o.geometry)){disposed.add(o.geometry);o.geometry.dispose()}}
  for(const [m,d]of groups){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(d.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(d.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(d.uv,2));g.computeBoundingSphere();Avatar3D.mesh(root,g,m)}
 },
 frame(input){const p=this.profiles[Wardrobe.normalize(input).style];return{height:p.h,half:p.h*.66,center:p.h*.535}},
};
Avatar3D.profiles=FarmerDesign.profiles;
Avatar3D.build=input=>FarmerDesign.build(input);
const previousAvatarSignature=Avatar3D.signature.bind(Avatar3D);
Avatar3D.signature=input=>'v'+FarmerDesign.version+'|'+previousAvatarSignature(input);
