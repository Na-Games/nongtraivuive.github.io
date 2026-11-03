import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const root=process.cwd(),report={errors:[],checks:[]};fs.mkdirSync("docs/verification",{recursive:true});fs.mkdirSync(".runtime",{recursive:true});
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(e,data)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(data)});
});
await new Promise(r=>server.listen(8799,'127.0.0.1',r));
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--enable-unsafe-swiftshader','--use-angle=swiftshader','--no-first-run','--disable-component-update','--remote-debugging-port=9259','--user-data-dir='+path.join(root,'.runtime','motion-export-profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 let target;for(let i=0;i<40;i++){try{target=(await(await fetch('http://127.0.0.1:9259/json',{signal:AbortSignal.timeout(1000)})).json()).find(t=>t.type==='page');if(target)break}catch{}await sleep(200)}
 assert.ok(target,'Chrome started');ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let seq=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(Error('CDP timeout: '+method))}},45000).unref()});
 const run=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value};
 const screenshot=async name=>{await sleep(400);const p=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/verification/'+name+'.png',Buffer.from(p.data,'base64'))};
 const check=(name,pass,details={})=>{console.log((pass?'PASS ':'FAIL ')+name);report.checks.push({name,pass,...details});assert.ok(pass,name+' '+JSON.stringify(details))};
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await send('Page.navigate',{url:'http://127.0.0.1:8799/'});
 for(let i=0;i<150;i++){if(await run("typeof IllustratedAvatar!=='undefined'&&!!IllustratedAvatar.compose(S.av)&&typeof Farm3D!=='undefined'&&Farm3D.active"))break;await sleep(100)}

 await run('Art.promise');await run('S.fx.reduceMotion=false');
 const manifest={version:7,avatars:{},animals:{},icons:[]};
 for(let style=0;style<6;style++){
  const result=await run('(async()=>{const a=AvatarAssets.preset('+style+');await IllustratedAvatar.ready(a);const frames=AvatarAssets.frames(),cv=document.createElement("canvas");cv.width=160*8;cv.height=200*10;const c=cv.getContext("2d");for(let i=0;i<frames.length;i++){const f=frames[i];c.drawImage(IllustratedAvatar.capture(a,f.options,160),(i%8)*160,Math.floor(i/8)*200)}return{signature:IllustratedAvatar.signature(a),states:AvatarAssets.states,png:cv.toDataURL().split(",")[1]}})()');
  const file='assets/illustrated-motion/character-'+style+'.png';fs.writeFileSync(file,Buffer.from(result.png,'base64'));manifest.avatars[style]={file,signature:result.signature,w:160,h:200,states:Object.keys(result.states),fps:12,frames:8};console.log('Exported 80 character poses: '+style);
 }
 for(const id of await run('Object.keys(ILLUSTRATED_ART.animals)')){
  const data=await run('(async()=>{const id='+JSON.stringify(id)+',m=ILLUSTRATED_ART.animals[id];IllustratedAvatar.load(m.file);await IllustratedAvatar.pending.get(m.file);const cv=document.createElement("canvas");cv.width=128*8;cv.height=160*3;const c=cv.getContext("2d");for(let state=0;state<3;state++)for(let i=0;i<8;i++){c.save();c.translate(i*128,state*160);IllustratedAnimals.draw(c,{e:"",species:id,rawPose:true,x:0,phase:i/8,moveBlend:state===1?1:0,water:state===2,face:1},64,155,115,i/8);c.restore()}return cv.toDataURL().split(",")[1]})()');
  const file='assets/illustrated-motion/'+id+'.png';fs.writeFileSync(file,Buffer.from(data,'base64'));manifest.animals[id]={file,w:128,h:160,states:['idle','walk','swim'],frames:8,fps:12};console.log('Exported animal: '+id);
 }
 const entries=await run('AvatarAssets.catalogue()');
 for(const entry of entries){const png=await run('(async()=>{const a='+JSON.stringify(entry.avatar)+';await IllustratedAvatar.ready(a);return IllustratedAvatar.capture(a,{},160).toDataURL().split(",")[1]})()');const file='assets/illustrated-motion/icon-'+entry.id+'.png';fs.writeFileSync(file,Buffer.from(png,'base64'));manifest.icons.push({id:entry.id,name:entry.name,file})}
 fs.writeFileSync('assets/illustrated-motion/manifest.json',JSON.stringify(manifest,null,2));fs.writeFileSync('assets/illustrated-motion/manifest.js',"'use strict';\nconst ILLUSTRATED_CLIPS="+JSON.stringify(manifest)+';\n');
 await send('Browser.close');console.log('Exported 480 human poses, 288 animal poses and '+entries.length+' transparent wardrobe icons');
}catch(error){throw error}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close()}
