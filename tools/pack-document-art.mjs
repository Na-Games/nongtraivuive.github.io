import fs from 'node:fs';
import {decode,encode} from './png-codec.mjs';
import {extractSheet,packSheet} from './build-diorama.mjs';
const manifest=JSON.parse(fs.readFileSync('assets/manifest.json','utf8'));
for(const job of [{name:'village-people',cols:3,rows:2,cell:384,componentRows:[3,3],ids:Array.from({length:6},(_,i)=>'villager-'+i)},{name:'duck-swim',cols:4,rows:1,cell:256,ids:Array.from({length:4},(_,i)=>'duck-swim-'+i)}]){
 const packed=packSheet(extractSheet(decode('.runtime/doc-reference/'+job.name+'.png'),job),job);
 const directory='assets/sprites/'+job.name;fs.mkdirSync(directory,{recursive:true});
 const file='assets/'+job.name+'.png';encode(file,packed.width,packed.height,packed.atlas);
 manifest.sheets[job.name]={file,cols:job.cols,rows:job.rows,cell:packed.cell,title:job.name==='village-people'?'Nhân vật làng quê':'Vịt bơi'};
 for(const sprite of packed.sprites){const target=directory+'/'+sprite.id+'.png';encode(target,packed.cell,packed.cell,sprite.pixels);manifest.sprites[sprite.id]={sheet:job.name,col:sprite.col,row:sprite.row,file:target,bounds:sprite.bounds}}
 console.log('Packed '+job.name+': '+job.ids.length+' isolated PNGs');
}
fs.writeFileSync('assets/manifest.json',JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync('assets/manifest.js',"'use strict';\nconst ART_MANIFEST="+JSON.stringify(manifest)+';\n');
