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
await new Promise(r=>server.listen(8794,'127.0.0.1',r));
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--enable-unsafe-swiftshader','--use-angle=swiftshader','--no-first-run','--disable-component-update','--remote-debugging-port=9254','--user-data-dir='+path.join(root,'.runtime','avatar-export-profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 let target;for(let i=0;i<40;i++){try{target=(await(await fetch('http://127.0.0.1:9254/json',{signal:AbortSignal.timeout(1000)})).json()).find(t=>t.type==='page');if(target)break}catch{}await sleep(200)}
 assert.ok(target,'Chrome started');ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let seq=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(Error('CDP timeout: '+method))}},20000).unref()});
 const run=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value};
 const screenshot=async name=>{await sleep(400);const p=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/verification/'+name+'.png',Buffer.from(p.data,'base64'))};
 const check=(name,pass,details={})=>{console.log((pass?'PASS ':'FAIL ')+name);report.checks.push({name,pass,...details});assert.ok(pass,name+' '+JSON.stringify(details))};
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await send('Page.navigate',{url:'http://127.0.0.1:8794/'});
 for(let i=0;i<150;i++){if(await run("typeof AvatarAssets!=='undefined'&&Avatar3D.ready&&typeof Farm3D!=='undefined'&&Farm3D.active"))break;await sleep(100)}
 await run('Art.promise');await run("S.fx.sound=false;S.province='Test';S.tutorial=true;document.querySelector('#screen-map').classList.add('hidden');document.querySelector('#hud').classList.remove('hidden');closeSheet();hidePop();S.av=AvatarAssets.preset(0);openAvatarEditor()");
 await screenshot('avatar-v5-editor-mobile');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await sleep(300);await screenshot('avatar-v5-editor-desktop');
 const output='assets/avatars-v5';fs.mkdirSync(output,{recursive:true});const manifest={version:5,generator:'Shared FarmerDesign WebGL model; exact RGBA alpha export',combinationCount:await run('AvatarAssets.combinations'),options:await run('({skin:SKINS,hair:HAIRS,outfit:OUTFITS,hairStyle:Wardrobe.hairStyles,shirtStyle:["shirt","overalls","jacket"],hat:HATS})'),sprites:[],animations:[]};
 const entries=await run('AvatarAssets.catalogue()');
 for(const entry of entries){const data=await run('AvatarAssets.capture('+JSON.stringify(entry.avatar)+',{},512).toDataURL("image/png").split(",")[1]');entry.file=output+'/'+entry.id+'.png';fs.writeFileSync(entry.file,Buffer.from(data,'base64'));manifest.sprites.push(entry)}
 console.log('Exported '+entries.length+' transparent wardrobe and character PNGs');
 const frames=await run('AvatarAssets.frames()');
 for(let style=0;style<6;style++){
  const avatar=await run('AvatarAssets.preset('+style+')');
  for(const frame of frames){const file=output+'/motion-'+style+'-'+frame.id+'.png',data=await run('AvatarAssets.capture('+JSON.stringify(avatar)+','+JSON.stringify(frame.options)+',192).toDataURL("image/png").split(",")[1]');fs.writeFileSync(file,Buffer.from(data,'base64'));manifest.animations.push({style,state:frame.state,index:frame.index,file,width:192,height:240})}
  console.log('Exported motion PNGs for '+avatar.style);
 }
 fs.writeFileSync(output+'/manifest.json',JSON.stringify(manifest,null,2));fs.writeFileSync(output+'/manifest.js','const AVATAR_ART='+JSON.stringify(manifest)+';\n');
 await run('closeSheet();S.av=AvatarAssets.preset(4);Scene.centerOn(Scene.player.x,Scene.player.y,1.2)');await sleep(350);await screenshot('avatar-v5-farm');
 await run('openFishing()');await sleep(700);await screenshot('avatar-v5-fishing');
 check('all avatar exports were produced without runtime errors',report.errors.length===0,{errors:report.errors});console.log('Exported '+manifest.sprites.length+' designs and '+manifest.animations.length+' animation frames');await send('Browser.close');
}catch(error){console.error(error);throw error}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close()}