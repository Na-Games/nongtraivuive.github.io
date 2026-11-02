import fs from 'node:fs';
import {decode,encode} from './png-codec.mjs';
const out='assets/illustrated';fs.mkdirSync(out,{recursive:true});
const spec={version:6,width:256,height:320,foot:[128,310],bodies:{},hair:{},hats:{},animals:{}};
function separate(file,count,cols,rows){
 const im=decode(file),{w,h,pixels}=im,labels=new Int32Array(w*h),queue=new Int32Array(w*h),components=[];
 for(let i=0;i<w*h;i++){const p=i*4,r=pixels[p],g=pixels[p+1],b=pixels[p+2];if(pixels[p+3]<36||r>245&&g<35&&b<35||r>245&&g>245&&b<35||r>245&&g<35&&b>245)pixels[p+3]=0}
 for(let start=0;start<w*h;start++){if(labels[start]||pixels[start*4+3]<100)continue;const id=components.length+1;let first=0,last=0,minX=w,minY=h,maxX=0,maxY=0;queue[last++]=start;labels[start]=id;
  while(first<last){const i=queue[first++],x=i%w,y=Math.floor(i/w);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);for(const n of [x>0?i-1:-1,x<w-1?i+1:-1,y>0?i-w:-1,y<h-1?i+w:-1])if(n>=0&&!labels[n]&&pixels[n*4+3]>=100){labels[n]=id;queue[last++]=n}}
  components.push({id,area:last,x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1});
 }
 const selected=components.sort((a,b)=>b.area-a.area).slice(0,count).sort((a,b)=>{const ar=Math.min(rows-1,Math.floor((a.y+a.h/2)/h*rows)),br=Math.min(rows-1,Math.floor((b.y+b.h/2)/h*rows));return ar-br||a.x-b.x});
 if(selected.length!==count)throw Error('Missing sprites in '+file);
 return selected.map(b=>{const pw=b.w+6,ph=b.h+6,data=Buffer.alloc(pw*ph*4);for(let y=0;y<ph;y++)for(let x=0;x<pw;x++){const sx=b.x+x-3,sy=b.y+y-3;if(sx<0||sy<0||sx>=w||sy>=h)continue;const si=sy*w+sx;let keep=labels[si]===b.id;if(!keep&&pixels[si*4+3]>0){for(let dy=-2;dy<=2&&!keep;dy++)for(let dx=-2;dx<=2;dx++)if(sx+dx>=0&&sx+dx<w&&sy+dy>=0&&sy+dy<h&&labels[(sy+dy)*w+sx+dx]===b.id){keep=true;break}}if(keep)pixels.copy(data,(y*pw+x)*4,si*4,si*4+4)}return{w:pw,h:ph,pixels:data}});
}
function resizeInto(im,width,height,targetW,targetH){const pixels=Buffer.alloc(width*height*4),scale=Math.min(targetW/im.w,targetH/im.h),dw=Math.round(im.w*scale),dh=Math.round(im.h*scale),left=Math.round((width-dw)/2),top=310-dh;
 for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){const sx=(x+.5)/scale-.5,sy=(y+.5)/scale-.5,ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;let a=0,r=0,g=0,b=0;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const xx=Math.max(0,Math.min(im.w-1,ix+dx)),yy=Math.max(0,Math.min(im.h-1,iy+dy)),p=(yy*im.w+xx)*4,weight=(dx?fx:1-fx)*(dy?fy:1-fy),alpha=im.pixels[p+3]/255;a+=alpha*weight;r+=im.pixels[p]*alpha*weight;g+=im.pixels[p+1]*alpha*weight;b+=im.pixels[p+2]*alpha*weight}const p=((y+top)*width+x+left)*4;if(a>0){pixels[p]=r/a;pixels[p+1]=g/a;pixels[p+2]=b/a;pixels[p+3]=a*255}}
 return{w:width,h:height,pixels,bounds:{x:left,y:top,w:dw,h:dh}};
}
for(const shirt of ['shirt','overalls','jacket']){
 const sprites=separate(out+'/source/'+shirt+'.png',6,3,2);
 for(let style=0;style<6;style++){
  const im=resizeInto(sprites[style],256,320,160,254),{pixels,bounds:b}=im,skin=Buffer.alloc(pixels.length),cloth=Buffer.alloc(pixels.length);let minHX=256,maxHX=0;
  for(let y=b.y;y<Math.min(320,b.y+b.h*.27);y++)for(let x=0;x<256;x++){const p=(y*256+x)*4;if(pixels[p+3]>160&&pixels[p]>pixels[p+1]*1.10&&pixels[p+1]>pixels[p+2]*1.08){minHX=Math.min(minHX,x);maxHX=Math.max(maxHX,x)}}
  const headW=Math.max(32,maxHX-minHX),head={x:(minHX+maxHX)/2,y:b.y+2,w:headW};
  for(let y=0;y<320;y++)for(let x=0;x<256;x++){const p=(y*256+x)*4,r=pixels[p],g=pixels[p+1],bl=pixels[p+2],a=pixels[p+3],ny=(y-b.y)/b.h;if(!a)continue;
   const warm=r>g*1.08&&g>bl*1.10&&r-bl>25&&r>115,grey=Math.max(r,g,bl)-Math.min(r,g,bl)<27&&(r+g+bl)/3<210;
   if(warm&&(ny<.29||ny>.4)){skin[p]=skin[p+1]=skin[p+2]=255;skin[p+3]=a}
   if(grey&&ny>.25&&ny<(shirt==='overalls'?.94:.60)){cloth[p]=cloth[p+1]=cloth[p+2]=255;cloth[p+3]=a}
  }
  const id=style+'-'+shirt,file=out+'/body-'+id+'.png',skinFile=out+'/skin-'+id+'.png',clothFile=out+'/cloth-'+id+'.png';encode(file,256,320,pixels);encode(skinFile,256,320,skin);encode(clothFile,256,320,cloth);
  spec.bodies[id]={file,skin:skinFile,cloth:clothFile,head,bounds:b,hip:b.y+b.h*.54,shoulder:b.y+b.h*.30,hand:b.y+b.h*.72};
 }
}
const hairNames=['short','swept','braid','long','curly'];separate(out+'/source/hair.png',5,3,2).forEach((im,i)=>{const file=out+'/hair-'+hairNames[i]+'.png';encode(file,im.w,im.h,im.pixels);spec.hair[hairNames[i]]={file,w:im.w,h:im.h}});
const manifest=JSON.parse(fs.readFileSync('assets/manifest.json','utf8'));
for(const name of ['non','rom','khan']){const meta=manifest.sprites['hat-'+name],im=decode(meta.file),b=meta.bounds,pixels=Buffer.alloc((b.w+4)*(b.h+4)*4);for(let y=0;y<b.h;y++)im.pixels.copy(pixels,((y+2)*(b.w+4)+2)*4,((y+b.y)*im.w+b.x)*4,((y+b.y)*im.w+b.x+b.w)*4);const file=out+'/hat-'+name+'.png';encode(file,b.w+4,b.h+4,pixels);spec.hats[name]={file,w:b.w+4,h:b.h+4}}
const animalNames=['cow','buffalo','pig','goat','sheep','dog','cat','hen','duck','crane','bee-animal','butterfly'];separate('docs/design-previews/animals-v1.png',12,4,3).forEach((im,i)=>{const file=out+'/animal-'+animalNames[i]+'.png';encode(file,im.w,im.h,im.pixels);spec.animals[animalNames[i]]={file,w:im.w,h:im.h}});
fs.writeFileSync(out+'/manifest.json',JSON.stringify(spec,null,2));fs.writeFileSync(out+'/manifest.js','const ILLUSTRATED_ART='+JSON.stringify(spec)+';\n');console.log('Packed 18 bodies with skin/clothing masks, five hairstyles, three hats and 12 animal cutouts');
