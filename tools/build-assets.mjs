import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

// Lossless PNG decoding, alpha inspection and sprite extraction; no API dependency.
function decode(file) {
  const b=fs.readFileSync(file), chunks=[]; let w,h,type,depth;
  for(let p=8;p<b.length;){const n=b.readUInt32BE(p),t=b.toString('ascii',p+4,p+8),d=b.subarray(p+8,p+8+n);if(t==='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);depth=d[8];type=d[9]}if(t==='IDAT')chunks.push(d);p+=n+12}
  if(type!==6||depth!==8)throw Error(`${file}: expected 8-bit RGBA PNG, got ${type}/${depth}`);
  const raw=zlib.inflateSync(Buffer.concat(chunks)),pixels=Buffer.alloc(w*h*4),stride=w*4;
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c};
  for(let y=0;y<h;y++){const f=raw[y*(stride+1)];for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=4?pixels[i-4]:0,b=y?pixels[i-stride]:0,c=y&&x>=4?pixels[i-stride-4]:0;pixels[i]=(raw[y*(stride+1)+1+x]+(f===0?0:f===1?a:f===2?b:f===3?Math.floor((a+b)/2):paeth(a,b,c)))&255}}
  return {w,h,pixels};
}
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});
function chunk(type,data){const t=Buffer.from(type),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);t.copy(out,4);data.copy(out,8);let crc=0xffffffff;for(const n of Buffer.concat([t,data]))crc=crcTable[(crc^n)&255]^(crc>>>8);out.writeUInt32BE((crc^0xffffffff)>>>0,out.length-4);return out}
function encode(file,w,h,pixels){const head=Buffer.alloc(13);head.writeUInt32BE(w);head.writeUInt32BE(h,4);head[8]=8;head[9]=6;const rows=Buffer.alloc(h*(w*4+1));for(let y=0;y<h;y++)pixels.copy(rows,y*(w*4+1)+1,y*w*4,(y+1)*w*4);fs.writeFileSync(file,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]))}
const jobs=JSON.parse(fs.readFileSync('assets/sources.json','utf8'));
const auditOnly=process.argv.includes('--audit');
const expanded=JSON.parse(fs.readFileSync('assets/expanded-catalog.json','utf8'));
fs.writeFileSync('expanded-catalog.js',`'use strict';\nconst EXPANDED_ART=${JSON.stringify(expanded)};\n`);
const manifest={version:1,generatedWith:'built-in image_gen',padding:24,sheets:{},sprites:{}};
const report=[];
for(const job of jobs){
  const {name,source,cols,rows,ids}=job,localSource=`assets/source/${name}.png`,input=fs.existsSync(source)?source:localSource;const im=decode(input),{w,h,pixels}=im;
  if(ids.length!==cols*rows)throw Error(`${name}: catalogue count does not match atlas grid`);
  for(const id of ids)if(manifest.sprites[id])throw Error(`Duplicate sprite ID: ${id}`);
  fs.mkdirSync('assets/source',{recursive:true});if(path.resolve(input)!==path.resolve(localSource))fs.copyFileSync(input,localSource);
  // Connected alpha components avoid assuming the generator followed exact cell positions.
  const labels=new Int32Array(w*h),queue=new Int32Array(w*h),components=[];let label=0,transparent=0;
  for(let i=0;i<w*h;i++){if(pixels[i*4+3]===0)transparent++;if(labels[i]||pixels[i*4+3]<24)continue;label++;let front=0,end=1;queue[0]=i;labels[i]=label;let minX=w,minY=h,maxX=0,maxY=0,count=0;
    while(front<end){const p=queue[front++],x=p%w,y=Math.floor(p/w);count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);for(const q of [x?p-1:-1,x<w-1?p+1:-1,y?p-w:-1,y<h-1?p+w:-1]){if(q<0||labels[q]||pixels[q*4+3]<24)continue;labels[q]=label;queue[end++]=q}}
    components.push({label,count,minX,minY,maxX,maxY,cx:(minX+maxX)/2,cy:(minY+maxY)/2});
  }
  const count=cols*rows,main=components.filter(c=>c.count>250).sort((a,b)=>b.count-a.count).slice(0,count);
  if(auditOnly){console.log(`${name}: ${main.length}/${count} isolated main objects; components ${components.filter(c=>c.count>250).length}`);continue}
  if(main.length!==count)throw Error(`${name}: found ${main.length}/${count} separate objects; inspect source before slicing`);
  main.sort((a,b)=>a.cy-b.cy);const ordered=[];for(let r=0;r<rows;r++)ordered.push(...main.slice(r*cols,(r+1)*cols).sort((a,b)=>a.cx-b.cx));
  const owner=new Int32Array(label+1).fill(-1);ordered.forEach((c,i)=>owner[c.label]=i);
  for(const c of components){if(owner[c.label]>=0||c.count<6)continue;let best=-1,dist=Infinity;ordered.forEach((m,i)=>{const dx=Math.max(m.minX-c.maxX,c.minX-m.maxX,0),dy=Math.max(m.minY-c.maxY,c.minY-m.maxY,0),d=dx*dx+dy*dy;if(d<dist){best=i;dist=d}});if(dist<Math.pow(Math.max(w/cols,h/rows)*.25,2))owner[c.label]=best}
  const boxes=ordered.map(()=>({x:w,y:h,r:0,b:0}));for(let p=0;p<w*h;p++){const i=owner[labels[p]];if(i<0)continue;const x=p%w,y=Math.floor(p/w),b=boxes[i];b.x=Math.min(b.x,x);b.y=Math.min(b.y,y);b.r=Math.max(b.r,x);b.b=Math.max(b.b,y)}
  const cell=256,pad=24,aw=cols*cell,ah=rows*cell,atlas=Buffer.alloc(aw*ah*4);fs.mkdirSync(`assets/sprites/${name}`,{recursive:true});
  for(let i=0;i<count;i++){const box=boxes[i],sw=box.r-box.x+1,sh=box.b-box.y+1,scale=Math.min((cell-pad*2)/sw,(cell-pad*2)/sh),dw=Math.round(sw*scale),dh=Math.round(sh*scale),dx=Math.floor((cell-dw)/2),dy=Math.floor((cell-dh)/2),sprite=Buffer.alloc(cell*cell*4);
    for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){const sx=box.x+Math.min(sw-1,Math.floor(x/scale)),sy=box.y+Math.min(sh-1,Math.floor(y/scale)),src=sy*w+sx;if(owner[labels[src]]!==i)continue;pixels.copy(sprite,((dy+y)*cell+dx+x)*4,src*4,src*4+4)}
    const id=ids[i],col=i%cols,row=Math.floor(i/cols),file=`assets/sprites/${name}/${id}.png`;encode(file,cell,cell,sprite);
    for(let y=0;y<cell;y++)sprite.copy(atlas,((row*cell+y)*aw+col*cell)*4,y*cell*4,(y+1)*cell*4);
    manifest.sprites[id]={sheet:name,col,row,file,bounds:{x:dx,y:dy,w:dw,h:dh}};
  }
  const file=`assets/${name}.png`;encode(file,aw,ah,atlas);manifest.sheets[name]={file,cols,rows,cell};report.push({name,sourceSize:[w,h],objects:count,transparentPercent:Math.round(100*transparent/(w*h)),safePadding:pad});console.log(`${name}: ${count} sprites, alpha ${report.at(-1).transparentPercent}%, safe padding ${pad}px`);
}
if(!auditOnly){fs.writeFileSync('assets/manifest.json',JSON.stringify(manifest,null,2));fs.writeFileSync('assets/manifest.js',`'use strict';\nconst ART_MANIFEST=${JSON.stringify(manifest)};\n`);fs.writeFileSync('docs/asset-validation.json',JSON.stringify(report,null,2))}
