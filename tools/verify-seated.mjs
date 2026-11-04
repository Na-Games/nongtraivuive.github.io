import fs from 'node:fs';
import assert from 'node:assert/strict';
import {decode} from './png-codec.mjs';
const spec=JSON.parse(fs.readFileSync('assets/seated/manifest.json','utf8'));assert.equal(Object.keys(spec.bodies).length,18);
let count=0;for(const [id,m]of Object.entries(spec.bodies)){
 assert.equal(m.pose,'seated');assert.ok(m.grip.x>m.seat.x&&m.grip.y<m.seat.y);assert.ok(m.head.w>50&&m.head.y<m.grip.y);
 for(const file of [m.file,m.skin,m.cloth]){const im=decode(file);assert.equal(im.w,512);assert.equal(im.h,640);let solid=0,clear=0,edge=0;for(let y=0;y<640;y++)for(let x=0;x<512;x++){const a=im.pixels[(y*512+x)*4+3];if(a>100)solid++;if(!a)clear++;if(a&&(x===0||y===0||x===511||y===639))edge++}assert.ok(solid>500&&clear>512*640*.25,id+' has isolated alpha layers');assert.equal(edge,0);count++}
}
console.log('PASS '+count+' seated RGBA assets, 18 poses, head/hand/seat anchors');
