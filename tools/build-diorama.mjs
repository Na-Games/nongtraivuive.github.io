import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {decode,encode} from './png-codec.mjs';

const PAD=24,ALPHA=16;
const readJSON=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const distance=(a,b)=>Math.hypot(Math.max(a.x-b.r,b.x-a.r,0),Math.max(a.y-b.b,b.y-a.b,0));

/** Preserve complete alpha components; never cut an object on a guessed grid line. */
export function extractSheet(image,job){
  const {w,h,pixels}=image,{cols,rows,ids}=job,count=ids.length;
  if(!cols||!rows||count>cols*rows)throw Error('Invalid grid configuration');
  const cellW=w/cols,cellH=h/rows,cellArea=cellW*cellH;
  const labels=new Int32Array(w*h),queue=new Int32Array(w*h),components=[];
  let label=0,transparent=0,edgePixels=0;
  for(let p=0;p<w*h;p++){
    const alpha=pixels[p*4+3];if(alpha===0)transparent++;
    if(alpha>=ALPHA&&(p%w===0||p%w===w-1||p<w||p>=w*(h-1)))edgePixels++;
    if(labels[p]||alpha<ALPHA)continue;
    const component={label:++label,area:0,x:w,y:h,r:0,b:0,sumX:0,sumY:0};
    let front=0,end=1;queue[0]=p;labels[p]=label;
    while(front<end){
      const q=queue[front++],x=q%w,y=Math.floor(q/w);component.area++;
      component.x=Math.min(component.x,x);component.y=Math.min(component.y,y);component.r=Math.max(component.r,x);component.b=Math.max(component.b,y);component.sumX+=x;component.sumY+=y;
      for(const n of [x?q-1:-1,x<w-1?q+1:-1,y?q-w:-1,y<h-1?q+w:-1])if(n>=0&&!labels[n]&&pixels[n*4+3]>=ALPHA){labels[n]=label;queue[end++]=n}
    }
    component.cx=component.sumX/component.area;component.cy=component.sumY/component.area;components.push(component);
  }
  const transparency=transparent/(w*h);
  if(transparency<.1)throw Error(`Source is not a transparent cutout sheet (${(transparency*100).toFixed(1)}% clear pixels)`);
  if(edgePixels>Math.max(8,(w+h)*.003))throw Error(`Source contains ${edgePixels} opaque pixels touching the outer edge; inspect clipping`);
  const minPart=Math.max(4,Math.round(cellArea*.00007));
  const effectSheet=job.name.includes('effects');
  const significant=effectSheet?20:Math.max(35,Math.round(cellArea*.0015));
  const roots=Array(count).fill(null),owners=new Int32Array(label+1).fill(-1);
  const layoutRows=job.layoutRows||Array(rows).fill(cols),rowOffsets=[];let offset=0;
  for(const n of layoutRows){rowOffsets.push(offset);offset+=n}
  if(offset<count)throw Error('layoutRows does not cover all IDs');
  const indexFor=c=>{
    const row=Math.min(rows-1,Math.max(0,Math.floor(c.cy/cellH)));
    const width=layoutRows[row]||cols;
    const col=Math.min(width-1,Math.max(0,Math.floor(c.cx/(w/width))));
    return rowOffsets[row]+col;
  };
  for(const c of components){
    if(c.area<significant)continue;const i=indexFor(c);
    if(i>=count)throw Error(`Unexpected object in unused cell ${i+1}`);
    if(!roots[i]||c.area>roots[i].area)roots[i]=c;
  }
  for(let i=0;i<count;i++)if(!roots[i])throw Error(`Empty or too-small object for ${ids[i]} in cell ${i+1}`);
  for(let i=0;i<count;i++)owners[roots[i].label]=i;
  const warnings=[];
  for(const c of components){
    if(c.area<minPart||owners[c.label]>=0)continue;
    if(job.groupByCell||job.name.startsWith('anim-farmer')){const i=indexFor(c);if(i>=count)throw Error(`Unexpected component in unused cell ${i+1}`);owners[c.label]=i;continue}
    const ranked=roots.map((root,i)=>({i,d:distance(c,root),root})).sort((a,b)=>a.d-b.d);
    const candidate=ranked[0],gridIndex=indexFor(c);
    if(candidate.d>Math.min(cellW,cellH)*.28){
      if(c.area>=significant)throw Error(`Unassigned substantial component (${c.area}px) near ${ids[gridIndex]||'unused cell'}; inspect extra object`);
      warnings.push(`Ignored detached ${c.area}px speck at ${Math.round(c.cx)},${Math.round(c.cy)}`);continue;
    }
    // Separate pieces of the same item are valid. A second substantial silhouette
    // far from the root is ambiguous and must be reviewed instead of silently sliced.
    if(!job.groupByCell&&c.area>candidate.root.area*.38&&candidate.d>Math.min(cellW,cellH)*.11){
      throw Error(`Ambiguous second large silhouette next to ${ids[candidate.i]}; regenerate or use a reviewed groupByCell sheet`);
    }
    if(gridIndex!==candidate.i&&c.area>=significant&&distance(c,roots[gridIndex])<candidate.d*1.3){
      throw Error(`Component between ${ids[candidate.i]} and ${ids[gridIndex]} has ambiguous ownership`);
    }
    owners[c.label]=candidate.i;
  }
  // Keep antialiased alpha fringes adjacent to the recognized opaque subject.
  // Do not let near-transparent shadows connect neighboring subjects.
  for(let p=0;p<w*h;p++){
    const alpha=pixels[p*4+3];if(!alpha||alpha>=ALPHA)continue;
    const x=p%w,y=Math.floor(p/w);let best=-1,bestDistance=Infinity;
    for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){
      const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;
      const q=ny*w+nx,d=dx*dx+dy*dy;if(pixels[q*4+3]<ALPHA||owners[labels[q]]<0||d>=bestDistance)continue;
      bestDistance=d;best=labels[q];
    }
    if(best>=0)labels[p]=best;
  }
  const boxes=ids.map(()=>({x:w,y:h,r:0,b:0,pixels:0}));
  for(let p=0;p<w*h;p++){
    const owner=owners[labels[p]];if(owner<0)continue;const box=boxes[owner],x=p%w,y=Math.floor(p/w);
    box.x=Math.min(box.x,x);box.y=Math.min(box.y,y);box.r=Math.max(box.r,x);box.b=Math.max(box.b,y);box.pixels++;
  }
  for(let i=0;i<count;i++){
    const box=boxes[i],row=rowOffsets.findLastIndex(start=>start<=i),expectedW=w/(layoutRows[row]||cols);
    if(box.r-box.x>expectedW*1.35||box.b-box.y>cellH*1.35)throw Error(`${ids[i]} spans more than one source cell; possible glued neighboring sprites`);
    // Roots must not bridge two cell centers. Cropping such a component would lose
    // content, so the generator output is rejected before any production file write.
    if(roots[i].r-roots[i].x>expectedW*1.3||roots[i].b-roots[i].y>cellH*1.3)throw Error(`${ids[i]} has an oversized connected component`);
  }
  return {...image,labels,owners,boxes,components,roots,transparency,warnings};
}

function geometry(extracted,job,motion){
  const {boxes,labels,owners,w,pixels}=extracted,cell=job.cell||(motion&&job.name.startsWith('anim-farmer')||job.name==='wardrobe-parts'?384:job.name==='scenery'?512:256),inner=cell-PAD*2;
  const pivots=boxes.map(b=>(b.x+b.r)/2),feet=boxes.map(b=>b.b),scales=[],pivotYs=[],extents=[];
  if(!motion){for(let i=0;i<boxes.length;i++){const b=boxes[i];scales[i]=Math.min((inner-4)/(b.r-b.x+1),(inner-4)/(b.b-b.y+1));pivotYs[i]=0;extents[i]=inner}return {cell,pivots,feet,scales,pivotYs,extents}}
  if(job.name.startsWith('anim-farmer')){
    for(let i=0;i<boxes.length;i++){
      const b=boxes[i];let sum=0,weight=0;
      for(let y=b.y;y<b.y+(b.b-b.y)*.3;y++)for(let x=b.x;x<=b.r;x++){const p=y*w+x;if(owners[labels[p]]===i){const a=pixels[p*4+3];sum+=x*a;weight+=a}}
      if(weight)pivots[i]=sum/weight;
      const radius=(b.b-b.y)*.28;
      for(let y=b.b;y>=b.y;y--){let n=0;for(let x=Math.max(b.x,Math.floor(pivots[i]-radius));x<=Math.min(b.r,pivots[i]+radius);x++){const p=y*w+x;if(owners[labels[p]]===i&&pixels[p*4+3]>120)n++}if(n>=Math.max(3,(b.r-b.x)*.035)){feet[i]=y;break}}
    }
  }
  const groups={};job.ids.forEach((id,i)=>{const group=job.name.startsWith('anim-farmer')?job.name:id.replace(/-(walk|idle|turn)-\d+$/,'').replace(/-\d+$/,'');(groups[group]??=[]).push(i)});
  for(const indices of Object.values(groups)){
    let radius=0,up=0,down=0;for(const i of indices){const b=boxes[i];radius=Math.max(radius,pivots[i]-b.x,b.r-pivots[i]);up=Math.max(up,feet[i]-b.y+1);down=Math.max(down,b.b-feet[i])}
    // Nearest sampling can repeat a source boundary pixel at large upscales.
    // Reserve four extra pixels beyond the mandatory transparent gutter.
    const scale=Math.min((inner-8)/(radius*2+2),(inner-8)/(up+down+1)),pivotY=Math.floor(cell-PAD-5-down*scale);
    const heights=indices.filter(i=>/-walk-/.test(job.ids[i])).map(i=>(feet[i]-boxes[i].y+1)*scale).sort((a,b)=>a-b),extent=job.name.startsWith('anim-farmer')?(heights[Math.floor(heights.length/2)]||up*scale):inner;
    for(const i of indices){scales[i]=scale;pivotYs[i]=pivotY;extents[i]=extent}
  }
  return {cell,pivots,feet,scales,pivotYs,extents};
}

export function packSheet(extracted,job,motion=false){
  const {w,h,pixels,labels,owners,boxes}=extracted,g=geometry(extracted,job,motion),{cell}=g,sprites=[];
  const atlasWidth=job.cols*cell,atlasHeight=job.rows*cell,atlas=Buffer.alloc(atlasWidth*atlasHeight*4);
  for(let i=0;i<job.ids.length;i++){
    const b=boxes[i],scale=g.scales[i],out=Buffer.alloc(cell*cell*4);let minX=cell,minY=cell,maxX=-1,maxY=-1;
    const sw=b.r-b.x+1,sh=b.b-b.y+1,dx=Math.floor((cell-sw*scale)/2),dy=Math.floor((cell-sh*scale)/2);
    for(let y=0;y<cell;y++)for(let x=0;x<cell;x++){
      const sx=motion?Math.round(g.pivots[i]+(x-cell/2)/scale):Math.floor(b.x+(x-dx)/scale),sy=motion?Math.round(g.feet[i]+(y-g.pivotYs[i])/scale):Math.floor(b.y+(y-dy)/scale);
      if(sx<0||sy<0||sx>=w||sy>=h)continue;const p=sy*w+sx;if(owners[labels[p]]!==i)continue;
      if(x<PAD||x>=cell-PAD||y<PAD||y>=cell-PAD)throw Error(`${job.ids[i]} would clip into the ${PAD}px output gutter`);
      pixels.copy(out,(y*cell+x)*4,p*4,p*4+4);minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
    }
    if(maxX<0)throw Error(`Empty packed sprite ${job.ids[i]}`);
    const col=i%job.cols,row=Math.floor(i/job.cols),bounds={x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1};
    for(let y=0;y<cell;y++)out.copy(atlas,((row*cell+y)*atlasWidth+col*cell)*4,y*cell*4,(y+1)*cell*4);
    sprites.push({id:job.ids[i],col,row,bounds,pixels:out,pivot:[cell/2,g.pivotYs[i]],extent:g.extents[i]});
  }
  return {cell,sprites,atlas,width:atlasWidth,height:atlasHeight};
}

function writeJSON(file,value){fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n')}
function main(){
  const args=process.argv.slice(2),sheetIndex=args.indexOf('--sheet'),requested=sheetIndex>=0?args[sheetIndex+1]:null,audit=args.includes('--audit');
  if(!requested&&!args.includes('--all'))throw Error('Usage: node tools/build-diorama.mjs --sheet NAME [--audit] or --all [--audit]');
  // Legacy animal sheet 0 used irregular physical rows. New generation prompts
  // use a regular grid for every sheet; the last unused cells remain empty.
  const jobs=fs.existsSync('docs/diorama-prompts.json')?readJSON('docs/diorama-prompts.json').map(({layoutRows,...j})=>({...j,layoutRows:j.sourceLayoutRows,groupByCell:j.name.includes('effects'),motion:j.kind==='motion'})):[...readJSON('assets/sources.json').map(j=>({...j,groupByCell:j.name==='effects',motion:false})),...readJSON('docs/motion-sources.json').map(({layoutRows,...j})=>({...j,motion:true}))];
  const selected=jobs.filter(j=>(!args.includes('--static')||!j.motion)&&(requested?j.name===requested:fs.existsSync(`assets/diorama/source/${j.name}.png`)));
  if(!selected.length)throw Error(requested?'Unknown sheet '+requested:'No generated diorama sheets found');
  const reportFile='docs/diorama-validation.json',report=fs.existsSync(reportFile)?readJSON(reportFile):{version:1,sheets:{}};
  for(const job of selected){
    const source=`assets/diorama/source/${job.name}.png`;if(!fs.existsSync(source))throw Error('Missing '+source);
    try{
      const extracted=extractSheet(decode(source),job),packed=packSheet(extracted,job,job.motion);
      const entry={source,sourceSize:[extracted.w,extracted.h],sprites:job.ids.length,transparentPercent:+(extracted.transparency*100).toFixed(2),padding:PAD,commonScale:job.motion,warnings:extracted.warnings,passed:true};
      if(args.includes('--preview')){
        fs.mkdirSync('.runtime/diorama-audit',{recursive:true});
        encode(`.runtime/diorama-audit/${job.name}.png`,packed.width,packed.height,packed.atlas);
        writeJSON(`.runtime/diorama-audit/${job.name}.json`,packed.sprites.map((s,i)=>({id:s.id,source:extracted.boxes[i],packed:s.bounds,pivot:s.pivot,extent:s.extent})));
      }
      if(!audit){
        // All extraction and packing validations completed before production writes.
        const manifestFile=job.motion?'assets/motion/manifest.json':'assets/manifest.json',manifest=readJSON(manifestFile);
        const collection=job.motion?manifest.frames:manifest.sprites,directory=job.motion?`assets/motion/sprites/${job.name}`:`assets/sprites/${job.name}`;
        fs.mkdirSync(directory,{recursive:true});
        for(const sprite of packed.sprites){const file=`${directory}/${sprite.id}.png`;encode(file,packed.cell,packed.cell,sprite.pixels);collection[sprite.id]={sheet:job.name,col:sprite.col,row:sprite.row,file,bounds:sprite.bounds}}
        const file=job.motion?`assets/motion/${job.name}.png`:`assets/${job.name}.png`;encode(file,packed.width,packed.height,packed.atlas);
        manifest.sheets[job.name]={...(manifest.sheets[job.name]||{}),file,cols:job.cols,rows:job.rows,cell:packed.cell};
        manifest.generatedWith='built-in image_gen · rustic diorama redesign';manifest.padding=PAD;
        if(job.motion){
          const clips={};for(const sprite of packed.sprites){const name=sprite.id.replace(/-\d+$/,'');(clips[name]??=[]).push(sprite)}
          for(const [name,sprites]of Object.entries(clips)){manifest.clips[name]={...(manifest.clips[name]||{}),frames:sprites.map(s=>s.id),cell:packed.cell,pivot:sprites[0].pivot,extent:sprites[0].extent}}
        }
        writeJSON(manifestFile,manifest);
        const js=job.motion?`'use strict';\nconst MOTION_MANIFEST=${JSON.stringify(manifest)};\nObject.assign(ART_MANIFEST.sheets,MOTION_MANIFEST.sheets);Object.assign(ART_MANIFEST.sprites,MOTION_MANIFEST.frames);\n`:`'use strict';\nconst ART_MANIFEST=${JSON.stringify(manifest)};\n`;
        fs.writeFileSync(job.motion?'assets/motion/manifest.js':'assets/manifest.js',js);
      }
      report.sheets[job.name]={...entry,auditOnly:audit};writeJSON(reportFile,report);
      console.log(`${audit?'AUDIT':'PACKED'} ${job.name}: ${entry.sprites} isolated sprites, ${entry.transparentPercent}% transparent, ${PAD}px gutters`);
    }catch(error){report.sheets[job.name]={source,passed:false,error:error.message};writeJSON(reportFile,report);throw error}
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
