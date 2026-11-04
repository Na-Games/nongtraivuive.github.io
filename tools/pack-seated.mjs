import fs from 'node:fs';
import {decode,encode} from './png-codec.mjs';
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
function resizeInto(im,width,height,targetW,targetH){const pixels=Buffer.alloc(width*height*4),scale=Math.min(targetW/im.w,targetH/im.h),dw=Math.round(im.w*scale),dh=Math.round(im.h*scale),left=Math.round((width-dw)/2),top=620-dh;
 for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){const sx=(x+.5)/scale-.5,sy=(y+.5)/scale-.5,ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;let a=0,r=0,g=0,b=0;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const xx=Math.max(0,Math.min(im.w-1,ix+dx)),yy=Math.max(0,Math.min(im.h-1,iy+dy)),p=(yy*im.w+xx)*4,weight=(dx?fx:1-fx)*(dy?fy:1-fy),alpha=im.pixels[p+3]/255;a+=alpha*weight;r+=im.pixels[p]*alpha*weight;g+=im.pixels[p+1]*alpha*weight;b+=im.pixels[p+2]*alpha*weight}const p=((y+top)*width+x+left)*4;if(a>0){pixels[p]=r/a;pixels[p+1]=g/a;pixels[p+2]=b/a;pixels[p+3]=a*255}}
 return{w:width,h:height,pixels,bounds:{x:left,y:top,w:dw,h:dh}};
}

const out='assets/seated',spec={version:1,bodies:{}};
for(const garment of ['shirt','overalls','jacket']){
 const parts=separate(out+'/source/'+garment+'.png',6,3,2);
 for(let style=0;style<6;style++){
  const im=resizeInto(parts[style],512,640,390,460),b=im.bounds,p=im.pixels,skin=Buffer.alloc(p.length),cloth=Buffer.alloc(p.length);let hx0=512,hx1=0;
  for(let y=b.y;y<b.y+b.h*.31;y++)for(let x=0;x<512;x++){const i=(y*512+x)*4;if(p[i+3]>160&&p[i]>p[i+1]*1.10&&p[i+1]>p[i+2]*1.08){hx0=Math.min(hx0,x);hx1=Math.max(hx1,x)}}
  for(let y=0;y<640;y++)for(let x=0;x<512;x++){const i=(y*512+x)*4,r=p[i],g=p[i+1],bl=p[i+2],a=p[i+3],ny=(y-b.y)/b.h;if(!a)continue;
   const warm=r>g*1.08&&g>bl*1.10&&r-bl>25&&r>115,grey=Math.max(r,g,bl)-Math.min(r,g,bl)<27&&(r+g+bl)/3<210;
   if(warm&&(ny<.35||ny>.38&&ny<.65||ny>.83&&r>165)){skin[i]=r;skin[i+1]=Math.min(255,g/220*255);skin[i+2]=Math.min(255,bl/188*255);skin[i+3]=a}
   if(grey&&ny>.28&&ny<(garment==='overalls'?.90:.61)){cloth[i]=cloth[i+1]=cloth[i+2]=Math.min(255,(r+g+bl)/3/155*255);cloth[i+3]=a}
  }
  let gripX=0,gripY=0,gripCount=0;for(let yy=Math.floor(b.y+b.h*.35);yy<b.y+b.h*.62;yy++)for(let xx=Math.floor(b.x+b.w*.78);xx<b.x+b.w;xx++){const ii=(yy*512+xx)*4;if(skin[ii+3]>100){gripX+=xx;gripY+=yy;gripCount++}}
  const id=style+'-'+garment,file=out+'/body-'+id+'.png',s=out+'/skin-'+id+'.png',c=out+'/cloth-'+id+'.png';encode(file,512,640,p);encode(s,512,640,skin);encode(c,512,640,cloth);
  spec.bodies[id]={file,skin:s,cloth:c,pose:'seated',head:{x:(hx0+hx1)/2,y:b.y+2,w:Math.max(64,hx1-hx0)},bounds:b,hip:b.y+b.h*.61,shoulder:b.y+b.h*.32,hand:b.y+b.h*.47,grip:{x:gripCount?gripX/gripCount:b.x+b.w*.86,y:gripCount?gripY/gripCount:b.y+b.h*.5},seat:{x:b.x+b.w*.25,y:b.y+b.h*.61}};
 }
}
fs.writeFileSync(out+'/manifest.json',JSON.stringify(spec,null,2));fs.writeFileSync(out+'/manifest.js','const SEATED_ART='+JSON.stringify(spec)+';\n');console.log('Packed 18 seated bodies and 36 color masks');
