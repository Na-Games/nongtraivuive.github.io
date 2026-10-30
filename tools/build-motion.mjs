import fs from 'node:fs';
import path from 'node:path';
import {decode,encode} from './png-codec.mjs';
const jobs=JSON.parse(fs.readFileSync('docs/motion-sources.json','utf8'));
const out={version:2,padding:24,defaultCell:256,sheets:{},frames:{},clips:{}};const report=[];
fs.mkdirSync('assets/motion/source',{recursive:true});fs.mkdirSync('assets/motion/sprites',{recursive:true});
for(const job of jobs){
  const {name,cols,rows,ids}=job,local=`assets/motion/source/${name}.png`,source=fs.existsSync(job.source)?job.source:local;
  const {w,h,pixels}=decode(source);if(ids.length>cols*rows)throw Error(name+': not enough output cells');if(path.resolve(source)!==path.resolve(local))fs.copyFileSync(source,local);
  const labels=new Int32Array(w*h),queue=new Int32Array(w*h),components=[];let label=0;
  for(let p=0;p<w*h;p++){if(labels[p]||pixels[p*4+3]<24)continue;let front=0,end=1,minX=w,minY=h,maxX=0,maxY=0;queue[0]=p;labels[p]=++label;
    while(front<end){const p=queue[front++],x=p%w,y=Math.floor(p/w);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);for(const n of [x?p-1:-1,x<w-1?p+1:-1,y?p-w:-1,y<h-1?p+w:-1])if(n>=0&&!labels[n]&&pixels[n*4+3]>=24){labels[n]=label;queue[end++]=n}}
    components.push({label,count:end,minX,minY,maxX,maxY,cx:(minX+maxX)/2,cy:(minY+maxY)/2});
  }
  const threshold=name==='anim-effects'?60:250,count=ids.length,main=components.filter(c=>c.count>threshold).sort((a,b)=>b.count-a.count).slice(0,count);
  if(process.argv.includes('--audit')){console.log(`${name}: ${main.length}/${count}; actual main components=${components.filter(c=>c.count>threshold).length}`);continue}
  if(main.length!==count)throw Error(`${name}: ${main.length}/${count} separated frames; repair before packing`);
  main.sort((a,b)=>a.cy-b.cy);const ordered=[];let offset=0;for(const width of job.layoutRows||Array(rows).fill(cols)){ordered.push(...main.slice(offset,offset+width).sort((a,b)=>a.cx-b.cx));offset+=width}
  const owners=new Int32Array(label+1).fill(-1);ordered.forEach((c,i)=>owners[c.label]=i);
  for(const c of components){if(owners[c.label]>=0||c.count<5)continue;let best=-1,dist=Infinity;ordered.forEach((m,i)=>{const dx=Math.max(m.minX-c.maxX,c.minX-m.maxX,0),dy=Math.max(m.minY-c.maxY,c.minY-m.maxY,0),d=dx*dx+dy*dy;if(d<dist){best=i;dist=d}});if(dist<(w/cols*.23)**2)owners[c.label]=best}
  if(job.groupByCell){owners.fill(-1);for(const c of components)if(c.count>=5){const col=Math.max(0,Math.min(cols-1,Math.floor(c.cx/(w/cols)))),row=Math.max(0,Math.min(rows-1,Math.floor(c.cy/(h/rows))));owners[c.label]=row*cols+col}}
  const bounds=ordered.map(c=>({x:w,y:h,r:0,b:0}));
  for(let p=0;p<w*h;p++){const owner=owners[labels[p]];if(owner<0)continue;const b=bounds[owner],x=p%w,y=Math.floor(p/w);b.x=Math.min(b.x,x);b.y=Math.min(b.y,y);b.r=Math.max(b.r,x);b.b=Math.max(b.b,y)}
  // One common scale per actor/effect; individual frames never auto-fit on playback.
  const groups={};bounds.forEach((b,i)=>{const id=ids[i],group=name.startsWith('anim-farmer')?name:id.replace(/-(walk|idle)-\d+$/,'').replace(/-\d+$/,'');(groups[group]??=[]).push(i)});
  const cell=name.startsWith('anim-farmer')?384:256,pad=24,inner=cell-pad*2;
  const pivots=bounds.map(b=>(b.x+b.r)/2),feet=bounds.map(b=>b.b),scales=[],pivotYs=[],extents=[];
  if(name.startsWith('anim-farmer'))for(let i=0;i<bounds.length;i++){const b=bounds[i];let weight=0,sum=0;for(let y=b.y;y<b.y+(b.b-b.y)*.3;y++)for(let x=b.x;x<=b.r;x++){const p=y*w+x;if(owners[labels[p]]===i){const a=pixels[p*4+3];sum+=x*a;weight+=a}}if(weight)pivots[i]=sum/weight}
  if(name.startsWith('anim-farmer'))for(let i=0;i<bounds.length;i++){const b=bounds[i],radius=(b.b-b.y)*.28;for(let y=b.b;y>=b.y;y--){let count=0;for(let x=Math.max(b.x,Math.floor(pivots[i]-radius));x<=Math.min(b.r,pivots[i]+radius);x++){const p=y*w+x;if(owners[labels[p]]===i&&pixels[p*4+3]>120)count++}if(count>=8){feet[i]=y;break}}}
  for(const indices of Object.values(groups)){let radius=0,up=0,down=0;for(const i of indices){const b=bounds[i];radius=Math.max(radius,pivots[i]-b.x,b.r-pivots[i]);up=Math.max(up,feet[i]-b.y+1);down=Math.max(down,b.b-feet[i])}const scale=Math.min(inner/(radius*2+2),inner/(up+down)),pivotY=Math.floor(cell-pad-1-down*scale),bodyHeights=indices.filter(i=>/-walk-/.test(ids[i])).map(i=>(feet[i]-bounds[i].y+1)*scale).sort((a,b)=>a-b),extent=name.startsWith('anim-farmer')?bodyHeights[Math.floor(bodyHeights.length/2)]:inner;for(const i of indices){scales[i]=scale;pivotYs[i]=pivotY;extents[i]=extent}}
  const aw=cols*cell,ah=rows*cell,atlas=Buffer.alloc(aw*ah*4);fs.mkdirSync(`assets/motion/sprites/${name}`,{recursive:true});
  for(let i=0;i<count;i++){
    const b=bounds[i],s=scales[i],sprite=Buffer.alloc(cell*cell*4);let minX=cell,minY=cell,maxX=0,maxY=0;
    for(let y=pad;y<cell-pad;y++)for(let x=pad;x<cell-pad;x++){const sx=Math.round(pivots[i]+(x-cell/2)/s),sy=Math.round(feet[i]+(y-pivotYs[i])/s);if(sx<0||sy<0||sx>=w||sy>=h)continue;const p=sy*w+sx;if(owners[labels[p]]!==i)continue;pixels.copy(sprite,(y*cell+x)*4,p*4,p*4+4);minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y)}
    if(minX===cell)throw Error('Empty frame '+ids[i]);
    const col=i%cols,row=Math.floor(i/cols),file=`assets/motion/sprites/${name}/${ids[i]}.png`;encode(file,cell,cell,sprite);for(let y=0;y<cell;y++)sprite.copy(atlas,((row*cell+y)*aw+col*cell)*4,y*cell*4,(y+1)*cell*4);
    out.frames[ids[i]]={sheet:name,col,row,file,bounds:{x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1}};
    const clip=ids[i].replace(/-\d+$/,'');(out.clips[clip]??={frames:[],fps:clip.includes('idle')?3:clip.includes('fish')?8:12,cell,pivot:[cell/2,pivotYs[i]],extent:extents[i]}).frames.push(ids[i]);
  }
  const file=`assets/motion/${name}.png`;encode(file,aw,ah,atlas);out.sheets[name]={file,cols,rows,cell,title:name.startsWith('anim-farmer')?'Chuyển động nhân vật '+(Number(name.at(-1))+1):name==='anim-effects'?'Hiệu ứng theo khung':'Chuyển động vật nuôi '+(Number(name.at(-1))+1)};report.push({name,frames:count,padding:pad,commonScale:true});console.log(`${name}: ${count} frames, fixed pivot, shared actor scale, 24px padding`);
  const directory=path.resolve(`assets/motion/sprites/${name}`),allowed=new Set(ids.map(id=>id+'.png'));if(!directory.startsWith(path.resolve('assets/motion/sprites')+path.sep))throw Error('Invalid motion output directory');for(const f of fs.readdirSync(directory))if(f.endsWith('.png')&&!allowed.has(f))fs.unlinkSync(path.join(directory,f));
}
if(!process.argv.includes('--audit')){
fs.writeFileSync('assets/motion/manifest.json',JSON.stringify(out,null,2));fs.writeFileSync('assets/motion/manifest.js',`'use strict';\nconst MOTION_MANIFEST=${JSON.stringify(out)};\nObject.assign(ART_MANIFEST.sheets,MOTION_MANIFEST.sheets);Object.assign(ART_MANIFEST.sprites,MOTION_MANIFEST.frames);\n`);fs.writeFileSync('docs/motion-validation.json',JSON.stringify(report,null,2));
}
