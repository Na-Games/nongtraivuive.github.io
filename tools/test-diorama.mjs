import assert from 'node:assert/strict';
import {extractSheet,packSheet} from './build-diorama.mjs';
const image=()=>({w:400,h:200,pixels:Buffer.alloc(400*200*4)});
function rectangle(im,x,y,w,h,color=[80,130,70,255]){for(let dy=y;dy<y+h;dy++)for(let dx=x;dx<x+w;dx++)for(let c=0;c<4;c++)im.pixels[(dy*im.w+dx)*4+c]=color[c]}
const job={name:'sample',cols:2,rows:1,ids:['first','second']};
const im=image();rectangle(im,50,55,70,90);rectangle(im,254,50,75,95);rectangle(im,127,90,8,8);
const extraction=extractSheet(im,job),packed=packSheet(extraction,job);
assert.equal(packed.sprites.length,2);assert.ok(extraction.boxes[0].r>=134,'Detached accessory remains with its complete sprite');
for(const sprite of packed.sprites){const b=sprite.bounds;assert.ok(b.x>=24&&b.y>=24&&b.x+b.w<=232&&b.y+b.h<=232);assert.ok(sprite.pixels.some(Boolean))}
const glued=image();rectangle(glued,50,50,275,90);assert.throws(()=>extractSheet(glued,job),/Empty|spans|oversized/,'Connected neighboring objects must fail before production writes');
const opaque=image();rectangle(opaque,0,0,400,200);assert.throws(()=>extractSheet(opaque,job),/transparent cutout/);
const clipped=image();rectangle(clipped,0,50,100,95);rectangle(clipped,250,50,80,90);assert.throws(()=>extractSheet(clipped,job),/outer edge/);
const missing=image();rectangle(missing,50,50,90,90);assert.throws(()=>extractSheet(missing,job),/Empty/);
const ambiguous=image();rectangle(ambiguous,110,60,50,90);rectangle(ambiguous,30,60,50,60);rectangle(ambiguous,250,50,80,90);assert.throws(()=>extractSheet(ambiguous,job),/Ambiguous second large silhouette/);
const extra=image();rectangle(extra,50,50,90,90);rectangle(extra,250,50,80,90);assert.throws(()=>extractSheet(extra,{...job,ids:['only-one']}),/unused cell/);
const fringe=image();rectangle(fringe,50,50,80,90);rectangle(fringe,49,60,1,10,[80,130,70,8]);rectangle(fringe,250,50,80,90);const fringes=extractSheet(fringe,job);assert.equal(fringes.owners[fringes.labels[60*400+49]],0,'Subtle alpha edge stays assigned to its sprite');
const motionJob={...job,name:'anim-farmer-0',ids:['farmer0-walk-0','farmer0-walk-1']};const animated=packSheet(extractSheet(im,motionJob),motionJob,true);
assert.deepEqual(animated.sprites[0].pivot,animated.sprites[1].pivot);assert.equal(animated.sprites[0].extent,animated.sprites[1].extent);
console.log('PASS diorama extraction: detached pieces, isolation, transparent source, clipping rejection, safe gutters, shared animation scale/pivot');
