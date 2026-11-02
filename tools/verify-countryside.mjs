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
await new Promise(r=>server.listen(8791,'127.0.0.1',r));
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--enable-unsafe-swiftshader','--use-angle=swiftshader','--no-first-run','--disable-component-update','--remote-debugging-port=9251','--user-data-dir='+path.join(root,'.runtime','countryside-profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 let target;for(let i=0;i<40;i++){try{target=(await(await fetch('http://127.0.0.1:9251/json',{signal:AbortSignal.timeout(1000)})).json()).find(t=>t.type==='page');if(target)break}catch{}await sleep(200)}
 assert.ok(target,'Chrome started');ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let seq=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(Error('CDP timeout: '+method))}},20000).unref()});
 const run=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value};
 const screenshot=async name=>{await sleep(400);const p=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/verification/'+name+'.png',Buffer.from(p.data,'base64'))};
 const check=(name,pass,details={})=>{console.log((pass?'PASS ':'FAIL ')+name);report.checks.push({name,pass,...details});assert.ok(pass,name+' '+JSON.stringify(details))};
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await send('Page.navigate',{url:'http://127.0.0.1:8791/'});
 for(let i=0;i<160;i++){if(await run("typeof Farm3D!=='undefined'&&Farm3D.active&&!!Farm3D.player"))break;await sleep(100)}
 await run('Art.promise');await run("S.province='Kiểm tra';S.tutorial=true;S.lv=1;S.fx.sound=false;document.querySelector('#screen-map').classList.add('hidden');document.querySelector('#hud').classList.remove('hidden');closeSheet();hidePop()");
 for(const [width,height] of [[1440,960],[390,844],[320,568],[844,390]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1000});
  await run('Scene.resize();Scene.centerOn(10,18,.65);Farm3D.render()');
  const labels=await run("FarmLabels.last.map(r=>({id:r.hit.id,title:r.title,status:r.status,x:r.x,y:r.y,w:r.w,h:r.h}))");
  check('all visible building signs stay inside '+width+'x'+height,labels.length>0&&labels.every(r=>r.x>=0&&r.y>=0&&r.x+r.w<=width&&r.y+r.h<=height));
  check('locked buildings retain catalog names and levels '+width,await run("FarmLabels.last.every(r=>r.title===BUILDINGS[r.hit.id].n&&(S.b[r.hit.id]||r.status.includes(BUILDINGS[r.hit.id].lv)))"));
  check('building signs do not overlap at '+width+'x'+height,!labels.some((a,i)=>labels.some((b,j)=>i!==j&&a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y)));
  if(width===1440){check('requested pig goat and sheep signs are present', ['pigs','goats','sheep'].every(id=>labels.some(r=>r.id===id)));check('desktop building signs do not overlap',!labels.some((a,i)=>labels.some((b,j)=>i!==j&&a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y)));}
  await screenshot('countryside-farm-'+width);
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:960,deviceScaleFactor:1,mobile:false});
 await run('Scene.resize();Scene.centerOn(18,12,.75);Farm3D.render()');
 for(const id of ['jam','rice'])check('factory name appears: '+id,await run('FarmLabels.last.some(r=>r.hit.id==='+JSON.stringify(id)+')'));
 await run("Scene.centerOn(9,18,.8);Farm3D.render();window.pigSign=FarmLabels.last.find(r=>r.hit.id==='pigs')");
 const hit=await run('({x:pigSign.x+pigSign.w/2,y:pigSign.y+pigSign.h/2})');
 check('sign ray picking resolves exact building',await run(`Scene.pick(${hit.x},${hit.y}).id==='pigs'`));
 await run("S.lv=30;Farm3D.render();tapBuilding('pigs',200,300)");
 check('new sign opens functioning construction action',await run("!!document.querySelector('#pb')"));await run('hidePop()');
 const east=await run('Motion.route(24,21,32,21)');check('route reaches expanded eastern field',east.length>0&&Math.hypot(east.at(-1).x-32,east.at(-1).y-21)<1);
 check('expanded terrain has ground instead of sea',await run('Farm3D.height(32,21)>.5&&Motion.canOccupy(32,21)&&!Motion.canOccupy(44,21)&&N===64'));
 await run('Scene.centerOn(32,21,.65)');await screenshot('countryside-east');await run('Scene.centerOn(22,55,.65)');await screenshot('countryside-south');
 check('green edge haze has been removed',await run("!Farm3D.edgeHaze&&Farm3D.scene.background.getHexString()==='f6eedc'"));
 for(const [width,height] of [[1440,960],[390,844],[844,390]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1000});await run('showMapScreen(true)');
  check('homeland picker fits '+width,await run("(()=>{const r=document.querySelector('#msheet').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&document.body.scrollWidth<=innerWidth})()"));
  await screenshot('countryside-vietnam-'+width);
 }
 await run("document.querySelector('#msearch').value='da nang';document.querySelector('#msearch').dispatchEvent(new Event('input'))");
 check('province search accepts unaccented Vietnamese',await run("document.querySelector('#plist').textContent.includes('Đà Nẵng')"));await run("document.querySelector('#plist .pitem').click()");
 check('province selection enables confirm action',await run("!document.querySelector('#mgo').disabled&&document.querySelector('#mgo').textContent.includes('Đà Nẵng')"));
 await run("document.querySelector('#screen-map').classList.add('hidden');document.querySelector('#hud').classList.remove('hidden');S.fish.caught=40;openFishing()");await sleep(700);
 for(const [width,height] of [[1440,960],[390,844]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1000});await run('Fishing.resize()');
  for(const spot of ['lotus','river','bay']){
   await run('S.fish.spot='+JSON.stringify(spot)+";FS.paused=true;FS.state='wait';FS.t=2;FS.castAt=1.1;Fishing.gearHud();Fishing.ui();fishDraw()");
   check('water and cast render in '+spot+' '+width,await run("Number.isFinite(FS.lastRig.x)&&document.querySelector('#screen-fish').dataset.phase==='wait'"));
   await screenshot('countryside-fishing-'+spot+'-'+width);
  }
  for(const state of ['bite','fight']){
   await run('FS.state='+JSON.stringify(state)+";FS.fishId='caro';FS.tension=85;FS.prog=40;FS.moodName='burst';FS.castAt=0;Fishing.ui();fishDraw()");
   check('bite and fight visuals update: '+state+' '+width,await run('document.querySelector("#screen-fish").dataset.phase==='+JSON.stringify(state)));
   await screenshot('countryside-fishing-'+state+'-'+width);
  }
 }
 await run("Preferences.set('reduceMotion',true);fishDraw()");check('reduced motion applies to map and fishing',await run("document.body.classList.contains('reduce-motion')"));await run("Preferences.set('reduceMotion',false);closeFishing()");await sleep(600);
 const pixels=await run("(()=>{const cv=document.createElement('canvas');cv.width=cv.height=200;const c=cv.getContext('2d');return ['🐄','🐃','🐷','🐐','🐑','🐕','🐈','🐔','🦆','🦢','🐝','🦋'].map((e,i)=>{c.clearRect(0,0,200,200);Animal3D.draw(c,{e,x:i,y:0,phase:.2,moveBlend:1},100,180,150,1);return cv.toDataURL()})})()");check('all 12 species have distinct fallback renders',new Set(pixels).size===12);
 check('no runtime exceptions',report.errors.length===0,{errors:report.errors});
 fs.writeFileSync('docs/verification/countryside-report.json',JSON.stringify(report,null,2));console.log('PASS '+report.checks.length+' countryside checks');await send('Browser.close');
}catch(error){fs.writeFileSync('docs/verification/countryside-report.json',JSON.stringify(report,null,2));throw error}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close()}
