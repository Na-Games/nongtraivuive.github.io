import fs from 'node:fs';
import {decode,encode} from './png-codec.mjs';
import {extractSheet,packSheet} from './build-diorama.mjs';
const source=process.argv[2];if(!source)throw Error('Usage: node tools/pack-playability-art.mjs <transparent plot atlas PNG>');
const job={name:'plot-states',cols:2,rows:2,cell:384,ids:['plot-empty','plot-watered','plot-locked','plot-rich']};
const packed=packSheet(extractSheet(decode(source),job),job),m=JSON.parse(fs.readFileSync('assets/manifest.json','utf8'));
fs.mkdirSync('assets/sprites/plot-states',{recursive:true});encode('assets/plot-states.png',packed.width,packed.height,packed.atlas);
m.sheets[job.name]={file:'assets/plot-states.png',cols:2,rows:2,cell:packed.cell,title:'Trạng thái ruộng đất'};
for(const s of packed.sprites){const file='assets/sprites/plot-states/'+s.id+'.png';encode(file,packed.cell,packed.cell,s.pixels);m.sprites[s.id]={sheet:job.name,col:s.col,row:s.row,file,bounds:s.bounds}}
fs.writeFileSync('assets/manifest.json',JSON.stringify(m,null,2)+'\n');fs.writeFileSync('assets/manifest.js',"'use strict';\nconst ART_MANIFEST="+JSON.stringify(m)+';\n');
console.log('4 separate transparent PNGs, padded and silhouette-checked');
