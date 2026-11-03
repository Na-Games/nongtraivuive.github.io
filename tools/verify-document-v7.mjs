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
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--enable-unsafe-swiftshader','--use-angle=swiftshader','--no-first-run','--disable-component-update','--remote-debugging-port=9260','--user-data-dir='+path.join(root,'.runtime','document-v7-profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 let target;for(let i=0;i<40;i++){try{target=(await(await fetch('http://127.0.0.1:9260/json',{signal:AbortSignal.timeout(1000)})).json()).find(t=>t.type==='page');if(target)break}catch{}await sleep(200)}
 assert.ok(target,'Chrome started');ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let seq=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(Error('CDP timeout: '+method))}},45000).unref()});
 const run=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value};
 const screenshot=async name=>{await sleep(400);const p=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/verification/'+name+'.png',Buffer.from(p.data,'base64'))};
 const check=(name,pass,details={})=>{console.log((pass?'PASS ':'FAIL ')+name);report.checks.push({name,pass,...details});assert.ok(pass,name+' '+JSON.stringify(details))};
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await send('Page.navigate',{url:'http://127.0.0.1:8797/'});
 for(let i=0;i<150;i++){if(await run("typeof IllustratedAvatar!=='undefined'&&!!IllustratedAvatar.compose(S.av)&&typeof Farm3D!=='undefined'&&Farm3D.active"))break;await sleep(100)}
﻿ await run('Art.promise');await run("S.province='Thanh Hóa';S.tutorial=true;S.fx.sound=false;S.fx.hq=false;S.fx.shadow=false;document.querySelector('#screen-map').classList.add('hidden');document.querySelector('#hud').classList.remove('hidden');refreshHud();S.av=AvatarAssets.preset(0);closeSheet();hidePop();Scene.centerOn(8,10,.65)");await sleep(400);
 check('distant building labels hidden',await run('FarmLabels.last.length===0'));
 await run('S.b.coop={lv:1,t0:0,ready:false};Scene.centerOn(10,10,1.4);Farm3D.sheetFrozen=null;Farm3D.render()');await sleep(400);await run('FarmLabels.draw(Scene.ctx,true)');check('nearby labels remain attached and visible',await run('FarmLabels.last.length>0&&FarmLabels.last.every(b=>b.x>=0&&b.x+b.w<=innerWidth)'),await run('({focus:Farm3D.focus,zoom:Farm3D.zoom,p:Farm3D.project(10,10,Farm3D.height(10,10)+2.8),base:Farm3D.project(10,10),count:FarmLabels.last.length,obstacles:FarmLabels.obstacles})'));await screenshot('document-v7-farm-close');
 for(const [width,height]of [[390,844],[844,390],[667,375],[320,640]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await sleep(350);
  const overlap=await run('(()=>{const ns=[...document.querySelectorAll(".three-controls button,.zoomctl button,#b-harv")],r=ns.map(n=>({id:n.title||n.id,...Object.fromEntries(["x","y","width","height"].map(k=>[k,n.getBoundingClientRect()[k]]))}));return{inside:r.every(a=>a.x>=0&&a.y>=0&&a.x+a.width<=innerWidth&&a.y+a.height<=innerHeight),overlaps:r.flatMap((a,i)=>r.slice(i+1).filter(b=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y).map(b=>[a.id,b.id]))}})()');check('farm controls fit and do not overlap '+width,overlap.inside&&overlap.overlaps.length===0,overlap);await screenshot('document-v7-farm-'+width);
 }
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await run('S.av=AvatarAssets.preset(1);IllustratedAvatar.ready(S.av)');await run('openAvatarEditor()');await run('Promise.all(Wardrobe.names.flatMap((_,style)=>[IllustratedAvatar.ready({...S.av,style}),IllustratedAvatar.ready(AvatarAssets.preset(style))]))');await sleep(600);
 check('all six avatar thumbnails fit their cards',await run('(()=>{const cards=[...document.querySelectorAll(".avatar-styles button")];return cards.length===6&&cards.every(b=>{const cv=b.querySelector("canvas"),pixels=cv.getContext("2d").getImageData(0,0,cv.width,cv.height).data;if(!pixels.some((v,i)=>i%4===3&&v>0))return false;const a=b.getBoundingClientRect(),c=cv.getBoundingClientRect();return c.left>=a.left&&c.right<=a.right&&Math.abs((c.left+c.right-a.left-a.right)/2)<2})})()'));await screenshot('document-v7-wardrobe');
 check('each character remembers its own wardrobe',await run('(()=>{const button=(k,v)=>[...document.querySelectorAll("[data-avatar-key]")].find(b=>b.dataset.avatarKey===k&&b.dataset.avatarValue===String(v));const initial=IllustratedAvatar.signature(S.av);button("style",0).click();button("outfit",OUTFITS[2]).click();button("style",1).click();const restored=IllustratedAvatar.signature(S.av)===initial;button("style",0).click();const kept=S.av.outfit===OUTFITS[2];button("style",1).click();return restored&&kept})()'));
 check('closing editor releases its preview listeners',await run('(()=>{closeSheet();const before=IllustratedAvatar.listeners.size;for(let i=0;i<3;i++){openAvatarEditor();closeSheet()}const ok=IllustratedAvatar.listeners.size===before;openAvatarEditor();return ok})()'));
 check('ten animation exports including care and sitting',await run('AvatarAssets.frames().length===80&&AvatarAssets.frames().some(f=>f.state==="fish"&&f.options.seated)&&AvatarAssets.frames().some(f=>f.state==="water")'));
 check('all action poses are different',await run('new Set(["hoe","plant","water","care","fish","run","jump"].map(state=>{const f=AvatarAssets.frames().find(f=>f.state===state&&f.index===3);return IllustratedAvatar.capture(S.av,f.options,160).toDataURL()})).size===7'));
 await run('closeSheet();Preferences.set("cropNames",true);Preferences.set("animalSound",false);Preferences.set("animalVolume",.25);save()');check('crop and animal settings persist',await run('(()=>{const a=JSON.parse(localStorage.getItem(SAVE_KEY));return a.fx.cropNames&&a.fx.animalSound===false&&a.fx.animalVolume===.25})()'));
 check('muted animal audio cannot play',await run('GameAudio.animalCue("cow")===false'));
 await run('S.plots[0]={crop:"lua",lv:1,t0:Date.now(),durationSec:CROPS.lua.t};Scene.centerOn(4,10,1.3)');await sleep(300);
 check('crop countdown can include name',await run('(()=>{const old=Scene.label,seen=[];Scene.label=(c,text,...a)=>{seen.push(text);old.call(Scene,c,text,...a)};Farm3D.labels(Scene.ctx);Scene.label=old;return seen.some(t=>t.includes(CROPS.lua.n+" · "))})()'));
 await run('Preferences.set("cropNames",false)');check('default countdown omits name',await run('(()=>{const old=Scene.label,seen=[];Scene.label=(c,text,...a)=>{seen.push(text);old.call(Scene,c,text,...a)};Farm3D.labels(Scene.ctx);Scene.label=old;return !seen.some(t=>t.includes(CROPS.lua.n+" · "))})()'));
 await run('openFishing()');await sleep(700);
 for(const [width,height]of [[390,844],[844,390],[667,375]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await sleep(300);
  for(const spot of ['lotus','river','bay']){await run('S.fish.spot='+JSON.stringify(spot)+';Fishing.gearHud();FS.state="fight";FS.fishId="caro";FS.paused=true;FS.moodName="calm";Fishing.ui();fishDraw()');await sleep(150);
   const layout=await run('(()=>{const r=document.querySelector(".angler-console").getBoundingClientRect(),s=FS.stage;return{inside:r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,clear:!(s.x>r.left&&s.x<r.right&&s.y>r.top&&s.y-s.h<r.bottom),rig:Number.isFinite(FS.lastRig.x),stage:!!s.deck,console:{x:r.x,y:r.y,w:r.width,h:r.height}}})()');check('fishing landing and controls '+spot+' '+width,layout.inside&&layout.clear&&layout.rig&&layout.stage,layout);await screenshot('document-v7-fish-'+spot+'-'+width);
  }
 }
 await run('closeFishing()');await sleep(650);await run('showMapScreen(true)');await sleep(400);await screenshot('document-v7-homeland-landscape');
 const mapClock=await run('Scene.t');await sleep(200);check('farm simulation pauses behind homeland map',await run('Scene.t')===mapClock);
 check('province selection retains list nodes',await run('(()=>{const b=document.querySelector(".pitem"),list=document.querySelector("#plist");window._provinceNode=b;b.click();return list.contains(b)&&b.getAttribute("aria-pressed")==="true"})()'));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await sleep(400);await screenshot('document-v7-homeland');
 check('stairs no longer intersect crop columns',await run('Scene.objs.filter(o=>o.k==="village-stairs").every(o=>o.gx>=9&&o.s<1)'));
 check('all animation PNGs connected',await run('Object.keys(ILLUSTRATED_CLIPS.avatars).length===6&&Object.keys(ILLUSTRATED_CLIPS.animals).length===12&&ILLUSTRATED_CLIPS.icons.length===33'));
 check('no runtime exceptions',report.errors.length===0&&!await run('!!Scene._e'),{errors:report.errors});fs.writeFileSync('docs/verification/document-v7-report.json',JSON.stringify(report,null,2));console.log('PASS '+report.checks.length+' document repair checks');await send('Browser.close');
}catch(error){fs.writeFileSync('docs/verification/document-v7-report.json',JSON.stringify(report,null,2));throw error}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close()}

