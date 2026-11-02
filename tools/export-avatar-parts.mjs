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
await new Promise(r=>server.listen(8797,'127.0.0.1',r));
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--enable-unsafe-swiftshader','--use-angle=swiftshader','--no-first-run','--disable-component-update','--remote-debugging-port=9257','--user-data-dir='+path.join(root,'.runtime','avatar-parts-profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 let target;for(let i=0;i<40;i++){try{target=(await(await fetch('http://127.0.0.1:9257/json',{signal:AbortSignal.timeout(1000)})).json()).find(t=>t.type==='page');if(target)break}catch{}await sleep(200)}
 assert.ok(target,'Chrome started');ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let seq=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(Error('CDP timeout: '+method))}},20000).unref()});
 const run=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value};
 const screenshot=async name=>{await sleep(400);const p=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/verification/'+name+'.png',Buffer.from(p.data,'base64'))};
 const check=(name,pass,details={})=>{console.log((pass?'PASS ':'FAIL ')+name);report.checks.push({name,pass,...details});assert.ok(pass,name+' '+JSON.stringify(details))};
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await send('Page.navigate',{url:'http://127.0.0.1:8797/'});
 for(let i=0;i<160;i++){if(await run("typeof AvatarAssets!=='undefined'&&Avatar3D.ready"))break;await sleep(100)}
 const out='assets/avatars-v5/parts';fs.mkdirSync(out,{recursive:true});const files=[];
 for(let style=0;style<6;style++){
  const base=await run('({...AvatarAssets.preset('+style+'),hat:"none",hairStyle:"short",shirtStyle:"shirt"})');
  const tasks=[{part:'body',value:'',role:'skin'},...['shirt','overalls','jacket'].map(value=>({part:'garment',value,role:'outfit'})),...['short','swept','braid','long','curly'].map(value=>({part:'hair',value,role:'hair'})),...['non','rom','khan'].map(value=>({part:'hat',value}))];
  for(const task of tasks){const av={...base,...(task.part==='garment'?{shirtStyle:task.value}:task.part==='hair'?{hairStyle:task.value}:task.part==='hat'?{hat:task.value}:{})};
   for(const mask of task.role?[false,true]:[false]){const name=style+'-'+task.part+(task.value?'-'+task.value:'')+(mask?'-mask':'')+'.png',code='AvatarAssets.part('+JSON.stringify(av)+','+JSON.stringify(task.part)+','+JSON.stringify(mask?task.role:null)+').toDataURL("image/png").split(",")[1]',data=await run(code);fs.writeFileSync(out+'/'+name,Buffer.from(data,'base64'));files.push({file:out+'/'+name,style,part:task.part,value:task.value,mask})}
  }
  console.log('Exported separate parts and color masks for '+style);
 }
 fs.writeFileSync(out+'/manifest.json',JSON.stringify({version:5,width:256,height:320,transparent:true,neutralTint:'customizable materials rendered white; color only the provided role masks',files},null,2));check('parts export has no runtime errors',report.errors.length===0,{errors:report.errors});console.log('Exported '+files.length+' separated PNG parts and masks');await send('Browser.close');
}catch(error){console.error(error);throw error}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close()}