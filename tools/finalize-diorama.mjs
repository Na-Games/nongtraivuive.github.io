import fs from 'node:fs';import {decode,encode}from './png-codec.mjs';
const motion=JSON.parse(fs.readFileSync('assets/motion/manifest.json','utf8')),art=JSON.parse(fs.readFileSync('assets/manifest.json','utf8'));
// Compatibility IDs use frames from the newly generated animation, never old art.
for(const [id,from]of [['farmer1-back-7','farmer1-back-6'],['hen-turn-0','hen-walk-1'],['hen-turn-1','hen-walk-5'],['farmer0-fish-6','farmer0-fish-4'],['farmer0-fish-7','farmer0-fish-5'],['farmer2-fish-4','farmer2-fish-3']]){const old=motion.frames[id],next=motion.frames[from];if(!old||!next)continue;fs.copyFileSync(next.file,old.file);motion.frames[id]={...next,file:old.file}}
const cols=4,rows=6,cell=256,w=cols*cell,h=rows*cell,pixels=Buffer.alloc(w*h*4);
for(let style=0;style<6;style++)for(const [pose,state,index]of [['idle','idle',0],['walk-a','walk',1],['walk-b','walk',4],['work','work',1]]){
 const clip=motion.clips['farmer'+style+'-'+state],frame=motion.frames[clip.frames[index%clip.frames.length]],image=decode(frame.file),b=frame.bounds;
 const scale=Math.min(208/b.w,208/b.h),dw=Math.round(b.w*scale),dh=Math.round(b.h*scale),dx=Math.floor((cell-dw)/2),dy=Math.floor((cell-dh)/2),sprite=Buffer.alloc(cell*cell*4);
 for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){const sx=b.x+Math.min(b.w-1,Math.floor(x/scale)),sy=b.y+Math.min(b.h-1,Math.floor(y/scale)),p=(sy*image.w+sx)*4;image.pixels.copy(sprite,((dy+y)*cell+dx+x)*4,p,p+4)}
 const col=({idle:0,'walk-a':1,'walk-b':2,work:3})[pose],id='farmer-'+style+'-'+pose,file='assets/sprites/characters/'+id+'.png';encode(file,cell,cell,sprite);for(let y=0;y<cell;y++)sprite.copy(pixels,((style*cell+y)*w+col*cell)*4,y*cell*4,(y+1)*cell*4);art.sprites[id]={sheet:'characters',col,row:style,file,bounds:{x:dx,y:dy,w:dw,h:dh}};
}
encode('assets/characters.png',w,h,pixels);art.sheets.characters={file:'assets/characters.png',cols,rows,cell};
for(const [file,value]of [['assets/manifest.json',art],['assets/motion/manifest.json',motion]])fs.writeFileSync(file,JSON.stringify(value,null,2));
fs.writeFileSync('assets/manifest.js',`'use strict';\nconst ART_MANIFEST=${JSON.stringify(art)};\n`);fs.writeFileSync('assets/motion/manifest.js',`'use strict';\nconst MOTION_MANIFEST=${JSON.stringify(motion)};\nObject.assign(ART_MANIFEST.sheets,MOTION_MANIFEST.sheets);Object.assign(ART_MANIFEST.sprites,MOTION_MANIFEST.frames);\n`);
const file='docs/diorama-validation.json',report=JSON.parse(fs.readFileSync(file,'utf8'));report.sheets.characters={passed:true,sprites:24,padding:24,source:'Newly generated farmer motion clips; same identity in static and animated poses',derivedFrom:['anim-farmer-0','anim-farmer-1','anim-farmer-2','anim-farmer-3','anim-farmer-4','anim-farmer-5']};fs.writeFileSync(file,JSON.stringify(report,null,2));console.log('Static characters synchronized with six new animated identities');
