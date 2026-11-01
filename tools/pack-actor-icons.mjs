import fs from 'node:fs';
import path from 'node:path';
import {decode,encode} from './png-codec.mjs';
import {extractSheet,packSheet} from './build-diorama.mjs';
const directory=process.argv[2];if(!directory)throw Error('Supply the Imagegen output directory');
const spec=JSON.parse(fs.readFileSync('docs/actors-v3-art.json','utf8')),m=JSON.parse(fs.readFileSync('assets/manifest.json','utf8')),cell=256,atlas=Buffer.alloc(6*cell*6*cell*4);let index=0;
for(const job of spec.jobs){const config={...job,cols:4,rows:3,cell,groupByCell:true},packed=packSheet(extractSheet(decode(path.join(directory,job.source)),config),config);for(const sprite of packed.sprites){const col=index%6,row=Math.floor(index/6),file=m.sprites[sprite.id].file;encode(file,cell,cell,sprite.pixels);for(let y=0;y<cell;y++)sprite.pixels.copy(atlas,((row*cell+y)*6*cell+col*cell)*4,y*cell*4,(y+1)*cell*4);m.sprites[sprite.id]={sheet:'ui',col,row,file,bounds:sprite.bounds};index++}}
if(index!==36)throw Error('Expected all 36 UI icons');encode('assets/ui.png',6*cell,6*cell,atlas);m.sheets.ui={...m.sheets.ui,cell,cols:6,rows:6};
fs.writeFileSync('assets/manifest.json',JSON.stringify(m,null,2)+'\n');fs.writeFileSync('assets/manifest.js',"'use strict';\nconst ART_MANIFEST="+JSON.stringify(m)+';\n');console.log('Replaced all 36 UI icons, with individual transparent PNGs and 24px gutters');
