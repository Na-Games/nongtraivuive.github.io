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
await new Promise(r=>server.listen(8802,'127.0.0.1',r));
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--enable-unsafe-swiftshader','--use-angle=swiftshader','--no-first-run','--disable-component-update','--remote-debugging-port=9262','--user-data-dir='+path.join(root,'.runtime','illustrated-preview-profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 let target;for(let i=0;i<40;i++){try{target=(await(await fetch('http://127.0.0.1:9262/json',{signal:AbortSignal.timeout(1000)})).json()).find(t=>t.type==='page');if(target)break}catch{}await sleep(200)}
 assert.ok(target,'Chrome started');ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let seq=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(Error('CDP timeout: '+method))}},45000).unref()});
 const run=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value};
 const screenshot=async name=>{await sleep(400);const p=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/verification/'+name+'.png',Buffer.from(p.data,'base64'))};
 const check=(name,pass,details={})=>{console.log((pass?'PASS ':'FAIL ')+name);report.checks.push({name,pass,...details});assert.ok(pass,name+' '+JSON.stringify(details))};
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await send('Page.navigate',{url:'http://127.0.0.1:8802/chuyen-dong.html'});
 for(let i=0;i<180;i++){if(await run('typeof IllustratedAvatar!=="undefined"&&typeof Art!=="undefined"'))break;await sleep(100)}
 await run('Art.promise');await run('IllustratedAvatar.criticalPromise');await sleep(300);
 check('motion preview loads the illustrated wardrobe',await run('loaded&&typeof IllustratedAvatar!=="undefined"'));
 for(let style=0;style<6;style++)await run('IllustratedAvatar.ready(AvatarAssets.preset('+style+'))');
 const png=await run('(()=>{const cv=document.createElement("canvas");cv.width=1200;cv.height=1000;const c=cv.getContext("2d");for(let i=0;i<6;i++){const av=AvatarAssets.preset(i);if(i===1)av.outfit=OUTFITS[5];if(i===5)av.outfit=OUTFITS[0];IllustratedAvatar.draw(c,200+(i%3)*400,475+Math.floor(i/3)*500,470,av)}return cv.toDataURL().split(",")[1]})()');fs.writeFileSync('docs/verification/illustrated-six-characters.png',Buffer.from(png,'base64'));
 check('motion preview has no runtime exceptions',report.errors.length===0,{errors:report.errors});await screenshot('illustrated-animation-preview');fs.writeFileSync('docs/verification/illustrated-preview-report.json',JSON.stringify(report,null,2));await send('Browser.close');
}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close()}