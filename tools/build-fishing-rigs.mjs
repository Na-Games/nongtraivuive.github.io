import fs from 'node:fs';
import {decode} from './png-codec.mjs';
const manifest=JSON.parse(fs.readFileSync('assets/motion/manifest.json','utf8')),rigs={};
for(const [id,clip]of Object.entries(manifest.clips))if(/^farmer\d-fish$/.test(id))for(const frameId of clip.frames){const frame=manifest.frames[frameId],b=frame.bounds,p=decode(frame.file);let tip=null;for(let x=b.x;x<b.x+b.w&&!tip;x++)for(let y=b.y;y<b.y+b.h*.68;y++)if(p.pixels[(y*p.w+x)*4+3]>80){tip={x,y};break}if(!tip)throw Error('Cannot find rod tip: '+frameId);rigs[frameId]={...tip,width:Math.min(60,Math.max(25,(clip.pivot[0]-tip.x)*.6))}}
fs.writeFileSync('assets/fishing-rigs.js','/* Rod-tip anchors for live fishing-line rendering; original PNGs are preserved. */\nconst FISHING_RIGS='+JSON.stringify(rigs)+';\n');console.log('Built '+Object.keys(rigs).length+' rod anchors');
