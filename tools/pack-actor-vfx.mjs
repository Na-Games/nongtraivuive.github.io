import fs from 'node:fs';
import {decode,encode} from './png-codec.mjs';
import {extractSheet,packSheet} from './build-diorama.mjs';
const source=process.argv[2];if(!source)throw Error('Supply the generated VFX atlas PNG');
const ids=['dust','water','harvest'].flatMap(kind=>Array.from({length:6},(_,i)=>'motion-'+kind+'-'+i)),job={name:'actor-effects-v3',ids,cols:6,rows:3,cell:256,groupByCell:true};
const packed=packSheet(extractSheet(decode(source),job),job,true),art=JSON.parse(fs.readFileSync('assets/manifest.json','utf8')),motion=JSON.parse(fs.readFileSync('assets/motion/manifest.json','utf8')),existing=decode('assets/motion/anim-effects.png');
for(const s of packed.sprites){const frame=motion.frames[s.id];if(!frame)throw Error('Missing motion frame '+s.id);encode(frame.file,256,256,s.pixels);for(let y=0;y<256;y++)s.pixels.copy(existing.pixels,((frame.row*256+y)*existing.w+frame.col*256)*4,y*256*4,(y+1)*256*4);frame.bounds=s.bounds;frame.pivot=s.pivot;frame.extent=s.extent}
for(const kind of ['dust','water','harvest']){const p=packed.sprites.find(s=>s.id==='motion-'+kind+'-0');motion.clips['motion-'+kind].pivot=p.pivot;motion.clips['motion-'+kind].extent=p.extent}
encode('assets/motion/anim-effects.png',existing.w,existing.h,existing.pixels);fs.writeFileSync('assets/manifest.json',JSON.stringify(art,null,2)+'\n');fs.writeFileSync('assets/manifest.js',"'use strict';\nconst ART_MANIFEST="+JSON.stringify(art)+';\n');fs.writeFileSync('assets/motion/manifest.json',JSON.stringify(motion,null,2)+'\n');fs.writeFileSync('assets/motion/manifest.js',"'use strict';\nconst MOTION_MANIFEST="+JSON.stringify(motion)+';\nObject.assign(ART_MANIFEST.sheets,MOTION_MANIFEST.sheets);Object.assign(ART_MANIFEST.sprites,MOTION_MANIFEST.frames);\n');
console.log('Replaced 18 movement/reward VFX frames with shared ground pivots');
