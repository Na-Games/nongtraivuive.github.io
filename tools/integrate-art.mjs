import fs from 'node:fs';
function edit(file,fn){const original=fs.readFileSync(file,'utf8');fs.mkdirSync('docs/original',{recursive:true});if(!fs.existsSync('docs/original/'+file))fs.writeFileSync('docs/original/'+file,original);fs.writeFileSync(file,fn(original))}
function replace(s,a,b){if(!s.includes(a))throw Error('Missing integration anchor: '+a.slice(0,100));return s.replace(a,b)}
edit('index.html',s=>{
 s=replace(s,'<link rel="stylesheet" href="style.css">','<link rel="stylesheet" href="style.css">\n<link rel="stylesheet" href="art.css">');
 s=replace(s,'<script src="game.js"></script>','<script src="catalog.js"></script>\n<script src="assets/manifest.js"></script>\n<script src="art.js"></script>\n<script src="game.js"></script>');return s;
});
edit('game.js',s=>{
 s=replace(s,'const N=16,','const N=22,');
 s=replace(s,"const d=BUILDINGS[id],[i,j]=d.slot,b=S.b[id];","const d=BUILDINGS[id],[i,j]=d.slot,b=S.b[id];\n    if(b&&Art.has(d.art||id)){const p=this.iso(i+1,j+1),scale=1+Math.min(b.lv-1,4)*.035;this.shadow(c,p.x,p.y+16*z,64*z,20*z);Art.draw(c,d.art||id,p.x,p.y+24*z,178*z*scale,144*z*scale,1);if(b.t0&&!b.ready){const phase=(t*.6)%1;c.save();c.globalAlpha=(1-phase)*.6;Art.draw(c,'smoke',p.x+18*z,p.y-100*z-phase*25*z,24*z,30*z);c.restore()}return}");
 s=replace(s,'switch(o.k){',"const sizes={tree:[78,102],palm:[92,122],bamboo:[76,112],bush:[45,40],flower:[32,28],rock:[34,26],silo:[64,94],sign:[54,68],well:[70,78],scarecrow:[48,72],hay:[43,32],farmhouse:[160,140],truck:[80,65],tractor:[70,64],'shop-stall':[100,90],boat:[74,48],greenhouse:[106,90],gate:[56,62],bridge:[85,46],'peach-tree':[78,104],cat:[30,35],buffalo:[54,46]};\n    if(Art.has(o.k)){const [w,h]=sizes[o.k]||[60,70];this.shadow(c,p.x,p.y+2*s,w*.3*s,7*s);Art.draw(c,o.k,p.x+sw*.4,p.y+3*s,w*s,h*s,1);return}\n    switch(o.k){");
 s=replace(s,'this.objs=o;',"o.push({gx:6,gy:1,k:'farmhouse',s:1,ph:0},{gx:7.6,gy:5.5,k:'truck',s:.9,ph:0},{gx:9.7,gy:7,k:'tractor',s:.9,ph:0},{gx:14.5,gy:14.5,k:'shop-stall',s:1,ph:0},{gx:14,gy:4.2,k:'boat',s:.85,ph:0},{gx:14,gy:17,k:'greenhouse',s:1,ph:0},{gx:3,gy:7.1,k:'gate',s:1,ph:0},{gx:10.8,gy:1.2,k:'bridge',s:1,ph:0},{gx:7,gy:3,k:'peach-tree',s:1,ph:0},{gx:6.8,gy:2,k:'cat',s:1,ph:0},{gx:14.8,gy:19,k:'buffalo',s:1,ph:0});\n    this.objs=o;");
 s=replace(s,'const keep=new Map(this.animals.map(a=>[a.k,a]));',"for(const [id,e]of [['pigs','🐷'],['ducks','🦆'],['goats','🐐'],['sheep','🐑']])if(S.b[id])for(let i=0;i<Math.min(5,S.b[id].lv+1);i++){const slot=BUILDINGS[id].slot;want.push({e,home:[slot[0]+1,slot[1]+2.5],r:1,sp:.5,k:id+i})}\n    const keep=new Map(this.animals.map(a=>[a.k,a]));");
 s=replace(s,'const pl=S.plots[k];\n    this.diamond',"const pl=S.plots[k];\n    const ground=this.iso(i+.5,j+.5);Art.draw(c,pl.lv>2?'rich-soil':pl.crop?'wet-soil':'soil',ground.x,ground.y+2*z,92*z,46*z);\n    this.diamond");
 // Keep exact interactive plot geometry and outlines, with texture painted inside it.
 s=replace(s,"this.diamond(c,i,j,1,1,.04);c.strokeStyle='#4a2c14';", "Art.draw(c,pl.lv>2?'rich-soil':pl.crop?'wet-soil':'soil',ground.x,ground.y,89*z,44*z);\n    this.diamond(c,i,j,1,1,.04);c.strokeStyle='#4a2c14';");
 s=replace(s,"const pr=cropProg(pl),C=CROPS[pl.crop],p=this.iso(i+.5,j+.5),sw=Math.sin(t*2+k)*1.5*z;", "const pr=cropProg(pl),C=CROPS[pl.crop],p=this.iso(i+.5,j+.5),sw=Math.sin(t*2+k)*1.5*z;\n    const stage=pr<.3?0:pr<1?1:2,trees={xoai:'mango-tree',chuoi:'banana-tree',cam:'orange-tree',dua:'palm',che:'tea-bush','caphe-qua':'coffee-bush'},sprite=Art.has(pl.crop+'-'+stage)?pl.crop+'-'+stage:stage===0?'sprout':stage===1?'bush':trees[pl.crop]||pl.crop;\n    if(Art.has(sprite)){for(const [dx,dy]of [[-17,-3],[16,-3],[0,10]])Art.draw(c,sprite,p.x+dx*z+sw,p.y+dy*z+6*z,(stage===2?36:28)*z,(stage===2?42:30)*z,1);return}");
 s=replace(s,"this.shadow(c,p.x,p.y,10*z,4*z);", "this.shadow(c,p.x,p.y,10*z,4*z);\n    const sprite=Art.emoji.get(a.e);if(sprite&&Art.has(sprite)){const sz=(a.e==='🐄'?46:a.fly?24:34)*z;Art.draw(c,sprite,p.x,p.y-bob,sz,sz,1,a.face>0);return}");
 s=replace(s,"function drawAvatar(c,x,y,h,av,o={}){", "function drawAvatar(c,x,y,h,av,o={}){\n  if(av.art!==false){const variant=Number.isInteger(av.style)?av.style:Math.max(0,OUTFITS.indexOf(av.outfit)),pose=o.work?'work':o.walk?(Math.sin((o.t||0)*10)>0?'walk-a':'walk-b'):'idle',id=`farmer-${variant}-${pose}`;if(Art.has(id)){Art.draw(c,id,x,y,h*.82,h*1.16,1,(o.face||1)>0);return}}\n");
 s=s.replaceAll('c.fillText(', 'Art.text(c,');
 return s;
});
edit('ui.js',s=>{
 s=s.replaceAll('c.fillText(', 'Art.text(c,');
 s=replace(s,"['mill','oven'].includes(k):['coop','pen','bee'].includes(k)","(['mill','oven'].includes(k)||BUILDINGS[k].kind==='factory'):(['coop','pen','bee'].includes(k)||BUILDINGS[k].kind==='animal')");
 s=replace(s,'<div class="em">${d.e}</div>${d.n}', '<div class="em">${Art.icon(d.art||id,d.n)}</div>${d.n}');
 s=s.replaceAll('<div class="em">${c.e}</div>${c.n}', '<div class="em">${Art.icon(id,c.n)}</div>${c.n}');
 s=replace(s,'<span>${c.e}</span>${lock?', '<span>${Art.icon(Art.has("seed-"+id)?"seed-"+id:id,c.n)}</span>${lock?');
 s=replace(s,'<div class="em">${ITEMS[id].e}</div>${ITEMS[id].n}', '<div class="em">${Art.icon(id,ITEMS[id].n)}</div>${ITEMS[id].n}');
 s=replace(s,"function itemE(id){return ITEMS[id]?ITEMS[id].e:'❓'}", "function itemE(id){return ITEMS[id]?Art.icon(id,ITEMS[id].n):'❓'}");
 s=replace(s,'<div class="em">${r.e}</div>${r.n}', '<div class="em">${Art.icon("rod-"+r.id,r.n)}</div>${r.n}');
 s=replace(s,'<div class="em">${b.e}</div>${b.n}', '<div class="em">${Art.icon("bait-"+b.id,b.n)}</div>${b.n}');
 s=replace(s,'<div class="em">${t.e}</div>${t.n}', '<div class="em">${Art.icon(t.id==="luoi"?"net":"bucket",t.n)}</div>${t.n}');
 s=replace(s,"function runLoader(done){", "function runLoader(done){\n  Art.promise.then(()=>{\n");
 s=replace(s,'},120);\n}',"},120);\n  });\n}");
 s=replace(s,'Scene.init();buildHud();','Scene.init();buildHud();Art.observe();');
 s=replace(s,"body.appendChild(tabs(['Chung','Chủ đề màu','Hiệu ứng']", "const library=el('button','btn-big','🖼 Thư viện PNG trong suốt');library.onclick=openArtLibrary;body.appendChild(library);body.appendChild(el('p','art-status',`${Object.keys(ART_MANIFEST.sprites).length} hình · ${Art.failed.length?'Lỗi tải: '+Art.failed.join(', '):'Bộ ảnh được lưu trong game'}`));\n    body.appendChild(tabs(['Chung','Chủ đề màu','Hiệu ứng']");
 s=replace(s,"const redraw=()=>{const x=$('#pav',body)","body.appendChild(el('div','lbl','Bộ nhân vật PNG'));const styles=el('div','avatar-styles');for(let i=0;i<6;i++){const b=el('button',(S.av.art!==false&&(S.av.style||0)===i)?'on':'',Art.icon(`farmer-${i}-idle`,'Nhân vật '+(i+1)));b.onclick=()=>{S.av.art=true;S.av.style=i;S.av.outfit=OUTFITS[i];refreshSheet();drawHudAvatar()};styles.appendChild(b)}body.appendChild(styles);const custom=el('button','cbtn2 sm','Tự phối màu da, tóc, áo và mũ');custom.onclick=()=>{S.av.art=false;refreshSheet();drawHudAvatar()};body.appendChild(custom);\n    const redraw=()=>{const x=$('#pav',body)");
 s=replace(s,"S.av[key]=c;refreshSheet();", "S.av.art=false;S.av[key]=c;refreshSheet();");
 s=replace(s,"S.av.hat=k;refreshSheet();", "S.av.art=false;S.av.hat=k;refreshSheet();");
 s=replace(s,"const msgs=['Đang dọn vườn", "if(Art.failed.length)toast('Một số bộ ảnh chưa tải được: '+Art.failed.join(', '));\n  const msgs=['Đang dọn vườn");
 // Display the equipped rod and float as the same PNGs as the equipment shop.
 s=replace(s,"const px=shore+50,py=H*.43;", "const px=shore+50,py=H*.43;\n  Art.draw(c,'reeds',shore+15,H*.75,55,90,1);Art.draw(c,'lotus',shore*.4,H*.7+Math.sin(t)*3,72,45);Art.draw(c,'boat',shore*.35,H*.15,110,65);Art.draw(c,'rod-'+S.fish.rod,px-18,py-36,85,110,1);");
 s=replace(s,"c.fillStyle='#fff';c.fillRect(bobX-8,bobY-1,16,3);", "c.fillStyle='#fff';c.fillRect(bobX-8,bobY-1,16,3);Art.draw(c,'bobber',bobX,bobY,22,30);");
 return s;
});
console.log('Integrated PNG art, extended catalogues and in-game library.');
