import fs from 'node:fs';
import assert from 'node:assert/strict';
import {decode} from './png-codec.mjs';
const m=JSON.parse(fs.readFileSync('assets/illustrated-motion/manifest.json','utf8'));
let poses=0;
for(const [kind,group]of [['avatars',m.avatars],['animals',m.animals]])for(const [id,spec]of Object.entries(group)){
 const im=decode(spec.file);assert.equal(im.w,spec.w*8);assert.equal(im.h,spec.h*spec.states.length);
 for(let row=0;row<spec.states.length;row++)for(let frame=0;frame<8;frame++){
  let opaque=0,clear=0;
  for(let y=0;y<spec.h;y++)for(let x=0;x<spec.w;x++){const a=im.pixels[(((row*spec.h+y)*im.w+frame*spec.w+x)*4)+3];if(a>64)opaque++;if(a===0)clear++}
  assert.ok(opaque>100&&clear>spec.w*spec.h*.25,`${kind} ${id} ${row}/${frame} has a separate transparent subject`);poses++;
 }
}
for(const icon of m.icons){const im=decode(icon.file);assert.ok(im.pixels.some((n,i)=>i%4===3&&n===0));assert.ok(im.pixels.some((n,i)=>i%4===3&&n>128))}
assert.equal(poses,768);assert.equal(m.icons.length,33);
console.log(`PASS ${poses} transparent animation frames and ${m.icons.length} wardrobe PNGs`);
