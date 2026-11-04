'use strict';
/* Exact alpha PNG exports of the same model used by the farm, HUD and fishing. */
const AvatarAssets={
 version:7,
 get combinations(){return Wardrobe.names.length*SKINS.length*HAIRS.length*OUTFITS.length*Wardrobe.hairStyles.length*3*HATS.length},
 presets:[
  {style:0,skin:0,hair:0,outfit:0,hairStyle:'short',shirtStyle:'shirt',hat:'non'},
  {style:1,skin:0,hair:0,outfit:1,hairStyle:'braid',shirtStyle:'overalls',hat:'rom'},
  {style:2,skin:2,hair:1,outfit:2,hairStyle:'swept',shirtStyle:'jacket',hat:'none'},
  {style:3,skin:1,hair:4,outfit:5,hairStyle:'short',shirtStyle:'shirt',hat:'rom'},
  {style:4,skin:1,hair:0,outfit:4,hairStyle:'long',shirtStyle:'shirt',hat:'khan'},
  {style:5,skin:2,hair:1,outfit:3,hairStyle:'curly',shirtStyle:'overalls',hat:'none'},
 ],
 preset(i){const p=this.presets[i];return Wardrobe.normalize({...p,skin:SKINS[p.skin],hair:HAIRS[p.hair],outfit:OUTFITS[p.outfit]})},
 capture(input,options={},width=320){
  if(!Avatar3D.init())throw Error('Trình duyệt chưa hỗ trợ xuất nhân vật 3D. Hãy bật tăng tốc đồ họa và mở lại game.');
  const height=Math.round(width*1.25),cv=document.createElement('canvas');cv.width=width;cv.height=height;
  const settings={preview:true,exportPose:true,t:0,phase:0,...options};Avatar3D.draw(cv.getContext('2d'),width/2,height,height,input,settings);
  if(width>320){const renderer=Avatar3D.renderer;try{renderer.setSize(width,height);renderer.render(Avatar3D.scene,Avatar3D.camera);const c=cv.getContext('2d');c.clearRect(0,0,width,height);c.drawImage(renderer.domElement,0,0)}finally{renderer.setSize(320,400)}}return cv;
 },
 async bytes(canvas){const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Không xuất được ảnh nhân vật');return new Uint8Array(await blob.arrayBuffer())},
 download(blob,name){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)},
 async downloadPNG(input){const a=Wardrobe.normalize(input);await IllustratedAvatar.ready(a);const cv=this.capture(a,{},512),data=await this.bytes(cv);this.download(new Blob([data],{type:'image/png'}),'nhan-vat-'+Wardrobe.names[a.style].toLowerCase()+'-trong-suot.png')},
 states:{idle:{fps:4,frames:8},walk:{fps:10,frames:8},back:{fps:10,frames:8},run:{fps:14,frames:8},jump:{fps:10,frames:8},hoe:{fps:10,frames:8},plant:{fps:10,frames:8},water:{fps:10,frames:8},care:{fps:10,frames:8},fish:{fps:8,frames:8}},
 frames(){const frames=[];for(const [state,spec]of Object.entries(this.states))for(let i=0;i<spec.frames;i++)frames.push({id:state+'-'+String(i).padStart(2,'0'),state,index:i,options:{preview:true,exportPose:true,t:i/spec.frames*Math.PI*2/5,phase:i/spec.frames,walk:['walk','back','run'].includes(state),run:state==='run',jump:state==='jump',back:state==='back',work:['hoe','plant','water','care'].includes(state),action:state==='care'?'fertilize':state,fishing:state==='fish',seated:state==='fish',reel:state==='fish'}});return frames},
 async downloadMotion(input,onProgress=()=>{}){
  const a=Wardrobe.normalize(input),files=[],frames=this.frames();await Promise.all([IllustratedAvatar.ready(a),IllustratedAvatar.ready(a,'seated')]);
  for(let i=0;i<frames.length;i++){const frame=frames[i],cv=this.capture(a,frame.options,256);files.push({name:frame.id+'.png',data:await this.bytes(cv)});onProgress(i+1,frames.length);await new Promise(resolve=>setTimeout(resolve,0))}
  const meta={version:this.version,avatar:a,width:256,height:320,transparent:true,origin:'top-left',anchor:'Use the full 256x320 frame; do not independently crop animation poses.',states:this.states};
  files.push({name:'nhan-vat.json',data:new TextEncoder().encode(JSON.stringify(meta,null,2))});this.download(this.zip(files),'nhan-vat-'+Wardrobe.names[a.style].toLowerCase()+'-chuyen-dong.zip');
 },
 zip(files){
  const parts=[],directory=[];let offset=0;const encoder=new TextEncoder();
  this.crcTable??=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});
  for(const file of files){const name=encoder.encode(file.name),data=file.data;let crc=0xffffffff;for(const byte of data)crc=this.crcTable[(crc^byte)&255]^(crc>>>8);crc=(crc^0xffffffff)>>>0;
   const header=new Uint8Array(30),h=new DataView(header.buffer);h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,name.length,true);parts.push(header,name,data);
   const central=new Uint8Array(46),c=new DataView(central.buffer);c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);directory.push(central,name);offset+=header.length+name.length+data.length;
  }
  const size=directory.reduce((n,p)=>n+p.length,0),end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,files.length,true);v.setUint16(10,files.length,true);v.setUint32(12,size,true);v.setUint32(16,offset,true);return new Blob([...parts,...directory,end],{type:'application/zip'});
 },
 catalogue(){
  const entries=this.presets.map((_,i)=>({id:'character-'+i,group:'characters',name:Wardrobe.names[i],avatar:this.preset(i)})),base=this.preset(0);
  for(const [key,values,group,names]of [
   ['skin',SKINS,'skin',['Da sáng','Da vàng','Da nâu','Da sẫm']],
   ['hair',HAIRS,'hair-color',['Nâu đen','Nâu hạt dẻ','Nâu đồng','Vàng','Đen']],
   ['outfit',OUTFITS,'outfit-color',['Xanh lá','Đỏ san hô','Xanh dương','Vàng','Tím','Trắng ngà']],
   ['hairStyle',Wardrobe.hairStyles.map(p=>p[0]),'hair-style',Wardrobe.hairStyles.map(p=>p[1])],
   ['shirtStyle',['shirt','overalls','jacket'],'garment',['Áo sơ mi','Quần yếm','Áo khoác']],
   ['hat',HATS.map(p=>p[0]),'hat',HATS.map(p=>p[1])],
  ])values.forEach((value,i)=>entries.push({id:group+'-'+i,group,name:names[i],avatar:{...base,[key]:value,...(['hair','hairStyle'].includes(key)?{hat:'none'}:{})}}));
  return entries;
 },
 part(input,part,role=null,width=256){
  this.capture(input,{},320);const renderer=Avatar3D.renderer,root=Avatar3D.preview,states=[],materials=new Map(),autoClear=renderer.autoClear;
  root.traverse(o=>{if(!o.isMesh)return;const m=o.material;states.push([o,o.visible]);if(!materials.has(m))materials.set(m,{color:m.color.clone(),colorWrite:m.colorWrite});
   if(part!=='hat'&&m.userData.avatarPart==='hat'||part!=='hair'&&part!=='hat'&&m.userData.avatarPart==='hair'||part==='hat'&&m.userData.avatarPart==='hair')o.visible=false;
  });
  try{
   for(const m of materials.keys()){m.colorWrite=false;if(m.userData.avatarRole)m.color.set('#ffffff')}
   renderer.autoClear=true;renderer.render(Avatar3D.scene,Avatar3D.camera);
   for(const m of materials.keys())m.colorWrite=m.userData.avatarPart===part&&(!role||m.userData.avatarRole===role);
   renderer.autoClear=false;renderer.render(Avatar3D.scene,Avatar3D.camera);
   const cv=document.createElement('canvas');cv.width=width;cv.height=Math.round(width*1.25);cv.getContext('2d').drawImage(renderer.domElement,0,0,cv.width,cv.height);return cv;
  }finally{for(const [m,s]of materials){m.color.copy(s.color);m.colorWrite=s.colorWrite}for(const [o,visible]of states)o.visible=visible;renderer.autoClear=autoClear}
 },
};
