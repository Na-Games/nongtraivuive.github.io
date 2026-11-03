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
await new Promise(r=>server.listen(8811,'127.0.0.1',r));
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--enable-unsafe-swiftshader','--use-angle=swiftshader','--no-first-run','--disable-component-update','--remote-debugging-port=9271','--user-data-dir='+path.join(root,'.runtime','smooth-profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 let target;for(let i=0;i<40;i++){try{target=(await(await fetch('http://127.0.0.1:9271/json',{signal:AbortSignal.timeout(1000)})).json()).find(t=>t.type==='page');if(target)break}catch{}await sleep(200)}
 assert.ok(target,'Chrome started');ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let seq=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(Error('CDP timeout: '+method))}},45000).unref()});
 const run=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value};
 const screenshot=async name=>{await sleep(400);const p=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/verification/'+name+'.png',Buffer.from(p.data,'base64'))};
 const check=(name,pass,details={})=>{console.log((pass?'PASS ':'FAIL ')+name);report.checks.push({name,pass,...details});assert.ok(pass,name+' '+JSON.stringify(details))};
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await send('Page.navigate',{url:'http://127.0.0.1:8811/'});
 for(let i=0;i<150;i++){if(await run("typeof IllustratedAvatar!=='undefined'&&!!IllustratedAvatar.compose(S.av)&&typeof Farm3D!=='undefined'&&Farm3D.active"))break;await sleep(100)}

 await run('Art.promise');await run("S.province='Test';S.fx.sound=false;S.fx.hq=false;S.fx.shadow=false;document.querySelector('#screen-map').classList.add('hidden');document.querySelector('#hud').classList.remove('hidden');closeSheet();S.lv=30;for(const id of ['coop','pen','pigs','goats','sheep','ducks','bee'])S.b[id]={lv:1,t0:0,ready:false};Scene.syncAnimals();Scene.centerOn(8,8,.9)");await sleep(500);
 const bench=await run('(()=>{const measure=fn=>{const t=performance.now();fn();return performance.now()-t};return{animals:Scene.animals.length,collisionMs:measure(()=>{for(let i=0;i<1500;i++)Motion.canOccupy(1+i%38,2+i%56)}),routingMs:measure(()=>{for(let i=0;i<8;i++)Motion.route(9,7,18+i*.1,10)}),updateMs:measure(()=>{for(let i=0;i<60;i++){Scene.t+=1/60;Motion.update(Scene,1/60)}}),syncSamples:Array.from({length:5},()=>measure(()=>{for(let i=0;i<60;i++){Scene.t+=1/60;Farm3D.sync()}})),pickingMs:measure(()=>{for(let i=0;i<50;i++)Farm3D.groundAt(40+i%6*50,150+Math.floor(i/6)*55)}),oldPickingMs:measure(()=>{for(let i=0;i<50;i++){Farm3D.setRay(40+i%6*50,150+Math.floor(i/6)*55);Farm3D.ray.intersectObjects(Farm3D.groundMeshes,false)}}),renderer:Farm3D.renderer.info.render}})()');
 bench.syncMs=[...bench.syncSamples].sort((a,b)=>a-b)[2];
 fs.writeFileSync('docs/verification/smooth-'+(process.argv[2]||'before')+'.json',JSON.stringify(bench,null,2));console.log(JSON.stringify(bench,null,2));await send('Browser.close');
}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close()}
