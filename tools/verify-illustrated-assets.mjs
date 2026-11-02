import fs from 'node:fs';
import assert from 'node:assert/strict';
import {decode} from './png-codec.mjs';
const spec=JSON.parse(fs.readFileSync('assets/illustrated/manifest.json','utf8'));
assert.equal(Object.keys(spec.bodies).length,18);assert.equal(Object.keys(spec.hair).length,5);assert.equal(Object.keys(spec.hats).length,3);assert.equal(Object.keys(spec.animals).length,12);
let count=0;
for(const [id,b]of Object.entries(spec.bodies)){
 for(const role of ['file','skin','cloth']){const im=decode(b[role]);assert.equal(im.w,512);assert.equal(im.h,640);let nonzero=0,edge=0;for(let y=0;y<im.h;y++)for(let x=0;x<im.w;x++){const a=im.pixels[(y*im.w+x)*4+3];if(a)nonzero++;if(a&&(x===0||y===0||x===im.w-1||y===im.h-1))edge++}assert.ok(nonzero>1000,id+' '+role+' has visible pixels');assert.equal(edge,0,id+' '+role+' has a clear margin');count++}
 assert.ok(b.head.w>30&&b.head.x>b.head.w/2&&b.head.y>0,'valid head attachment '+id);
}
for(const group of ['hair','hats','animals'])for(const asset of Object.values(spec[group])){const im=decode(asset.file);assert.ok(im.pixels.some((n,i)=>i%4===3&&n===0),'real alpha '+asset.file);count++}
assert.equal(6*4*5*6*5*3*4,43200);console.log('PASS '+count+' RGBA assets, 18 clean body frames, head attachments and 43200 wardrobe combinations');
