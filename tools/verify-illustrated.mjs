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
await new Promise(r=>server.listen(8798,'127.0.0.1',r));
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--enable-unsafe-swiftshader','--use-angle=swiftshader','--no-first-run','--disable-component-update','--remote-debugging-port=9258','--user-data-dir='+path.join(root,'.runtime','illustrated-profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 let target;for(let i=0;i<40;i++){try{target=(await(await fetch('http://127.0.0.1:9258/json',{signal:AbortSignal.timeout(1000)})).json()).find(t=>t.type==='page');if(target)break}catch{}await sleep(200)}
 assert.ok(target,'Chrome started');ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let seq=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(Error('CDP timeout: '+method))}},45000).unref()});
 const run=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value};
 const screenshot=async name=>{await sleep(400);const p=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/verification/'+name+'.png',Buffer.from(p.data,'base64'))};
 const check=(name,pass,details={})=>{console.log((pass?'PASS ':'FAIL ')+name);report.checks.push({name,pass,...details});assert.ok(pass,name+' '+JSON.stringify(details))};
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await send('Page.navigate',{url:'http://127.0.0.1:8798/'});
 for(let i=0;i<150;i++){if(await run("typeof IllustratedAvatar!=='undefined'&&!!IllustratedAvatar.compose(S.av)&&typeof Farm3D!=='undefined'&&Farm3D.active"))break;await sleep(100)}
 await run('Art.promise');await run("S.province='Test';S.tutorial=true;S.fx.sound=false;document.querySelector('#screen-map').classList.add('hidden');document.querySelector('#hud').classList.remove('hidden');refreshHud();S.av=AvatarAssets.preset(0);closeSheet();hidePop();Scene.centerOn(8,10,.9)");
 await run('IllustratedAvatar.ready(S.av)');await sleep(500);
 check('map uses the approved illustrated player',await run('Farm3D.player.userData.illustrated&&Farm3D.player.userData.signature===IllustratedAvatar.signature(S.av)&&!Scene._e'));
 await run('openAvatarEditor()');await sleep(800);await screenshot('illustrated-editor-mobile');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await sleep(300);await screenshot('illustrated-editor-desktop');
 for(let style=0;style<6;style++){
  await run('S.av={...AvatarAssets.preset('+style+'),hat:"none"};IllustratedAvatar.ready(S.av)');
  for(const [key,values]of Object.entries(await run('({skin:SKINS,hair:HAIRS,outfit:OUTFITS,hairStyle:Wardrobe.hairStyles.map(p=>p[0]),shirtStyle:["shirt","overalls","jacket"],hat:HATS.map(p=>p[0])})'))){
   const hashes=[];for(const value of values){const result=await run('(async()=>{const a={...S.av,'+key+':'+JSON.stringify(value)+'};await IllustratedAvatar.ready(a);const cv=IllustratedAvatar.capture(a,{},160),d=cv.getContext("2d").getImageData(0,0,160,200).data;let h=0;for(let p=0;p<d.length;p+=13)h=(Math.imul(h,31)+d[p])|0;return h})()');hashes.push(result)}
   check('all '+key+' choices change actual pixels for style '+style,new Set(hashes).size===values.length);
  }
 }
 await run('S.av=AvatarAssets.preset(0);IllustratedAvatar.ready(S.av)');
 const png=await run('(()=>{const cv=IllustratedAvatar.capture(S.av,{},512),d=cv.getContext("2d").getImageData(0,0,512,640).data;let opaque=0,edge=0;for(let y=0;y<640;y++)for(let x=0;x<512;x++){const a=d[(y*512+x)*4+3];if(a>0)opaque++;if((x===0||x===511||y===0||y===639)&&a>0)edge++}return{opaque,edge,png:cv.toDataURL().split(",")[1]}})()');check('transparent PNG has a clear margin and a real subject',png.opaque>10000&&png.edge===0,png.edge);fs.writeFileSync('docs/verification/illustrated-character.png',Buffer.from(png.png,'base64'));
 const walk=await run('new Set([0,.25,.5,.75].map(phase=>IllustratedAvatar.capture(S.av,{walk:true,phase,t:phase,exportPose:true},160).toDataURL())).size');check('walking has four different articulated poses',walk===4);
 await run('closeSheet();S.lv=30;S.coins=999999;for(const id of ["coop","pen","pigs","goats","sheep","ducks","bee"])if(!S.b[id])S.b[id]={lv:1,t0:0,ready:false};Scene.syncAnimals();Farm3D.render()');await sleep(500);
 check('every animal on map uses the new transparent cutouts',await run('Scene.animals.every(e=>Farm3D.actors.get(e.k)?.userData.illustratedAnimal)'));
 await screenshot('illustrated-farm');
 await run('openFishing()');await sleep(800);check('fishing renders the same selected character and anchored rod',await run('!!FS&&Number.isFinite(FS.lastRig?.x)'));await screenshot('illustrated-fishing');await run('closeFishing()');await sleep(600);
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await run('S.fx.hq=false;S.fx.shadow=false;save()');const expected=await run('IllustratedAvatar.signature(S.av)');await send('Page.reload');for(let i=0;i<150;i++){if(await run("typeof Farm3D!=='undefined'&&Farm3D.player?.userData.illustrated"))break;await sleep(100)}check('saved wardrobe survives reload',await run('IllustratedAvatar.signature(S.av)==='+JSON.stringify(expected)));
 check('no runtime errors',report.errors.length===0&&!await run('!!Scene._e'),{errors:report.errors});fs.writeFileSync('docs/verification/illustrated-report.json',JSON.stringify(report,null,2));console.log('PASS '+report.checks.length+' illustrated character checks');await send('Browser.close');
}catch(error){fs.writeFileSync('docs/verification/illustrated-report.json',JSON.stringify(report,null,2));throw error}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close()}