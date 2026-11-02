import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import {decode} from './png-codec.mjs';

// Preserve every RGBA pixel and ancillary PNG chunk. Replace IDAT only if smaller.
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});
function chunk(type,data){const name=Buffer.from(type),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);name.copy(out,4);data.copy(out,8);let crc=0xffffffff;for(const n of Buffer.concat([name,data]))crc=crcTable[(crc^n)&255]^(crc>>>8);out.writeUInt32BE((crc^0xffffffff)>>>0,out.length-4);return out}
function* files(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())yield* files(file);else if(file.endsWith('.png'))yield file}}
const report={files:0,optimized:0,before:0,after:0,skipped:[]};
for(const file of files('assets')){
 const original=fs.readFileSync(file);report.files++;report.before+=original.length;
 let image;try{image=decode(file)}catch{report.skipped.push(file);report.after+=original.length;continue}
 const {w,h,pixels}=image,stride=w*4,rows=Buffer.alloc(h*(stride+1)),candidates=Array.from({length:5},()=>Buffer.alloc(stride));
 for(let y=0;y<h;y++){
  const sums=[0,0,0,0,0],offset=y*stride;
  for(let x=0;x<stride;x++){
   const value=pixels[offset+x],a=x>=4?pixels[offset+x-4]:0,b=y?pixels[offset+x-stride]:0,c=y&&x>=4?pixels[offset+x-stride-4]:0,p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
   const predictors=[0,a,b,(a+b)>>>1,pa<=pb&&pa<=pc?a:pb<=pc?b:c];
   for(let f=0;f<5;f++){const v=(value-predictors[f])&255;candidates[f][x]=v;sums[f]+=Math.min(v,256-v)}
  }
  const best=sums.indexOf(Math.min(...sums));rows[y*(stride+1)]=best;candidates[best].copy(rows,y*(stride+1)+1);
 }
 const packed=chunk('IDAT',zlib.deflateSync(rows,{level:9})),parts=[original.subarray(0,8)];let inserted=false;
 for(let i=8;i<original.length;){const n=original.readUInt32BE(i),type=original.toString('ascii',i+4,i+8);if(type==='IDAT'){if(!inserted){parts.push(packed);inserted=true}}else parts.push(original.subarray(i,i+n+12));i+=n+12}
 const optimized=Buffer.concat(parts);
 if(optimized.length<original.length-128){
  fs.writeFileSync(file,optimized);
  try{const verify=decode(file);assert.equal(verify.w,w);assert.equal(verify.h,h);assert.ok(verify.pixels.equals(pixels),'Pixel mismatch')}catch(error){fs.writeFileSync(file,original);throw error}
  report.optimized++;report.after+=optimized.length;
 }else report.after+=original.length;
 if(report.files%100===0)console.log(`Checked ${report.files} PNGs; saved ${((report.before-report.after)/1048576).toFixed(2)} MB`);
}
report.savedMB=+((report.before-report.after)/1048576).toFixed(2);fs.mkdirSync('docs/verification',{recursive:true});fs.writeFileSync('docs/verification/png-optimization.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
