import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
const root=process.cwd(),report={errors:[],checks:[]};fs.mkdirSync('docs/verification',{recursive:true});fs.mkdirSync('.runtime',{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname==="/"?'/index.html':new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(file,(e,data)=>{if(e){res.writeHead(404).end();return}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data)})});
await new Promise(r=>server.listen(8767,'127.0.0.1',r));
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--disable-component-update','--disk-cache-size=1','--media-cache-size=1','--no-first-run','--no-default-browser-check','--remote-debugging-port=9229','--user-data-dir='+path.join(root,'.runtime','file-profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;try{
 let targets;for(let i=0;i<30;i++){try{targets=await(await fetch('http://127.0.0.1:9229/json',{signal:AbortSignal.timeout(1000)})).json();if(targets.some(t=>t.type==='page'))break}catch{}await new Promise(r=>setTimeout(r,200))}
 if(!targets?.some(t=>t.type==='page'))throw Error('Chrome DevTools did not become available');
 ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let serial=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);else if(m.method==='Log.entryAdded'&&m.params.entry.level==='error'&&!m.params.entry.url?.includes('fonts.googleapis'))report.errors.push(m.params.entry.text)});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
 await send('Runtime.enable');await send('Log.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:960,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'http://127.0.0.1:8767/'});
 for(let i=0;i<100;i++){if(await evaluate("typeof Art!=='undefined'&&typeof Scene!=='undefined'&&Scene.ctx&&Art.ready+Art.failed.length===Art.total"))break;await new Promise(r=>setTimeout(r,100))}
 await evaluate('Art.promise');await new Promise(r=>setTimeout(r,2800));

 await send('Page.navigate',{url:new URL('file:///'+root.replaceAll(path.sep,'/')+'/index.html').href});await new Promise(r=>setTimeout(r,4500));await evaluate('Art.promise');
 await evaluate("S.province='Test';S.fx.sound=false;document.querySelector('#screen-map').classList.add('hidden');document.querySelector('#hud').classList.remove('hidden');openFishing()");await new Promise(r=>setTimeout(r,1250));
 report.checks.push(await evaluate("({name:'open index directly from file',pass:location.protocol==='file:'&&Art.ready===Art.total&&Art.failed.length===0&&!!FS&&!Scene._e})"));
 report.checks.push(await evaluate("(()=>{cast();FS.wait=0;fishUpdate(1/120);startFight();FS.fightTime=2.5;FS.moodName='warning';Fishing.ui();fishDraw();return{name:'local file fishing renders live anchored line',pass:FS.state==='fight'&&Object.keys(Motion.fishingRigs).length>0}})()"));
 report.passed=report.errors.length===0&&report.checks.every(r=>r.pass);fs.writeFileSync('docs/verification/local-file-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;await send('Browser.close');
}finally{ws?.close();chrome.kill();server.close()}
