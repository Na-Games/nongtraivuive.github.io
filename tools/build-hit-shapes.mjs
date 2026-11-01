import fs from 'node:fs';import{decode}from'./png-codec.mjs';
const m=JSON.parse(fs.readFileSync('assets/manifest.json','utf8')),shapes={},images={};
for(const[id,s]of Object.entries(m.sprites)){const sheet=m.sheets[s.sheet],im=images[s.sheet]??=decode(sheet.file),b=s.bounds;shapes[id]=Array.from({length:32},(_,y)=>{let bits=0;for(let x=0;x<32;x++){const px=s.col*sheet.cell+b.x+Math.min(b.w-1,Math.floor((x+.5)*b.w/32)),py=s.row*sheet.cell+b.y+Math.min(b.h-1,Math.floor((y+.5)*b.h/32));if(im.pixels[(py*im.w+px)*4+3]>60)bits=(bits|1<<x)>>>0}return bits})}
fs.writeFileSync('assets/hit-shapes.js','const HIT_SHAPES='+JSON.stringify(shapes)+';\n');console.log('Built silhouette hit shapes: '+Object.keys(shapes).length);
