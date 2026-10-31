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
await new Promise(r=>server.listen(8770,'127.0.0.1',r));
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--disable-component-update','--remote-debugging-port=9232','--user-data-dir='+path.join(root,'.runtime','upgrade-profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 let target;for(let i=0;i<40;i++){try{target=(await(await fetch('http://127.0.0.1:9232/json',{signal:AbortSignal.timeout(1000)})).json()).find(t=>t.type==='page');if(target)break}catch{}await sleep(200)}
 assert.ok(target,'Chrome started');ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let seq=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
 const run=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value};
 const screenshot=async name=>{await sleep(400);const p=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/verification/'+name+'.png',Buffer.from(p.data,'base64'))};
 const check=(name,pass,details={})=>{report.checks.push({name,pass,...details});assert.ok(pass,name+' '+JSON.stringify(details))};
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 // Hold every PNG request indefinitely: the startup must still reach the map.
 await send('Fetch.enable',{patterns:[{urlPattern:'*.png'}]});
 await send('Page.navigate',{url:'http://127.0.0.1:8770/'});
 for(let i=0;i<50;i++){if(await run("typeof Art!=='undefined'&&typeof Scene!=='undefined'&&!!Scene.ctx"))break;await sleep(50)}
 const initial=await run("document.querySelector('#load-pct')?.textContent");check('loader starts above zero',initial&&!initial.includes(' 0%'),{initial});
 await run("window.loadPeak=0;new MutationObserver(()=>{const s=document.querySelector('#load-pct')?.textContent;window.loadPeak=Math.max(window.loadPeak,parseInt(s?.match(/\\d+/)?.[0]||0))}).observe(document.querySelector('#load-pct'),{subtree:true,childList:true,characterData:true})");
 for(let i=0;i<80;i++){if(await run("(!document.querySelector('#screen-map').classList.contains('hidden')||!document.querySelector('#hud').classList.contains('hidden'))"))break;await sleep(50)}
 const stalled=await run("({entered:(!document.querySelector('#screen-map').classList.contains('hidden')||!document.querySelector('#hud').classList.contains('hidden')),peak:window.loadPeak,ready:Art.ready,error:Scene._e||0})");check('stalled images cannot trap startup',stalled.entered&&stalled.peak===100&&!stalled.error,{...stalled});
 await send('Fetch.disable');await send('Page.reload',{ignoreCache:true});
 await sleep(700);await run('Art.promise');await sleep(700);
 check('all runtime sheets load',await run('Art.ready===Art.total&&Art.failed.length===0'));
 await run("S.province='Thanh Hóa';document.querySelector('#screen-map').classList.add('hidden');document.querySelector('#hud').classList.remove('hidden');refreshHud();Object.defineProperty(navigator,'userActivation',{configurable:true,value:{hasBeenActive:true}});window.vibrations=[];navigator.vibrate=p=>{vibrations.push(p);return true};S.fx.sound=false;S.fx.vibration='medium';S.fx.vibrateFarm=true;S.fx.vibrateReward=true;Haptics.last=-Infinity;beep('coin')");
 check('farm rewards vibrate even with sound off',await run('vibrations.some(p=>Array.isArray(p)&&p.length>0)'));
 await run("vibrations=[];S.fx.vibration='off';Haptics.last=-Infinity;beep('coin');Haptics.pulse('farm')");check('global vibration off applies to farm',await run('vibrations.length===0'));
 await run("S.fx.vibration='medium';S.fx.vibrateFarm=false;Haptics.last=-Infinity;beep('coin');Haptics.pulse('farm')");check('farm vibration switch applies to farm',await run('vibrations.length===0'));
 await run("S.fx.vibrateFarm=true;openAvatarEditor();S.av.style=2;window.originalStyle=2;document.querySelectorAll('.sw-row')[0].querySelectorAll('button')[2].click();document.querySelectorAll('.sw-row')[1].querySelectorAll('button')[3].click();document.querySelectorAll('.sw-row')[2].querySelectorAll('button')[4].click();document.querySelectorAll('.hat-choices button')[3].click()");
 check('customization preserves selected character',await run("S.av.style===originalStyle&&S.av.art===true&&S.av.skin===SKINS[2]&&S.av.hair===HAIRS[3]&&S.av.outfit===OUTFITS[4]&&S.av.hat==='none'"));
 const variants=await run("new Set(Array.from({length:6},(_,style)=>Wardrobe.icon({...S.av,style}).toDataURL())).size");check('six distinct character identities',variants===6,{variants});
 await run("save();closeSheet();openSettings(0)");check('portrait preference is the default',await run("PREF_DEFAULTS.orientation==='portrait'&&document.querySelector('.sheet').textContent.includes('Chiều màn hình')"));
 for(const [width,height]of [[320,568],[390,844],[844,390],[667,375],[1440,960]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1000});await sleep(150);await run('closeSheet();seedPicker(1,innerWidth-1,1)');
  const bounds=await run("(()=>{const b=document.querySelector('.pop').getBoundingClientRect();return {left:b.left,top:b.top,right:b.right,bottom:b.bottom,w:innerWidth,h:innerHeight}})()");check(`seed picker fits ${width}x${height}`,bounds.left>=0&&bounds.top>=0&&bounds.right<=bounds.w+1&&bounds.bottom<=bounds.h+1,bounds);
  await run('hidePop();openProfile()');const profile=await run("(()=>{const b=document.querySelector('.profile-actions').getBoundingClientRect();return {right:b.right,width:innerWidth,overflow:document.body.scrollWidth>innerWidth}})()");check(`profile fits ${width}x${height}`,!profile.overflow&&profile.right<=profile.width+1);
  await run('closeSheet();showMapScreen(true)');await sleep(100);check(`province list fits ${width}x${height}`,await run("(()=>{const r=document.querySelector('#msheet').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1})()"));
 }
 await run("document.querySelector('#screen-map').classList.add('hidden');document.querySelector('#hud').classList.remove('hidden');closeSheet();World.open()");check('four farm regions available',await run('document.querySelectorAll(".world-region").length===4&&N===32'));
 await run('closeSheet();S.hillGiftAt=0;window.giftBefore=S.coins;World.tap(18,3,200,200);document.querySelector("#hill-gift").click();World.tap(18,3,200,200)');check('hill reward has persistent cooldown',await run('S.coins===giftBefore+25&&document.querySelector("#hill-gift").disabled'));
 await run('hidePop();save()');await send('Page.reload');await sleep(800);check('customization and orientation survive reload',await run("S.av.style===2&&S.av.skin===SKINS[2]&&S.av.hat==='none'&&S.fx.orientation==='portrait'"));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await run("S.lv=200;S.coins=999999;S.fx.sound=false;closeSheet();S.plots[0]={crop:'lua',t0:Date.now(),lv:1,care:{},bonus:0};FarmCare.open(0)");check('crop care has four actions',await run('document.querySelectorAll(".care-action").length===4&&!!document.querySelector("#care-clock")'));
 await screenshot('crop-care-mobile');
 await run("document.querySelector('.care-action').click()");check('water action updates crop',await run('S.plots[0].care.water===true&&document.querySelector(".care-action").disabled'));
 for(const tab of [8,9,10]){await run('openShop('+tab+')');check('new shop category '+tab,await run('document.querySelector(".sheet .body").textContent.length>100'))}
 await screenshot('shop-level-200-mobile');
 await run('openVillage()');await screenshot('village-mobile');check('village projects render',await run('document.querySelectorAll(".village-card").length===3'));
 check('no runtime exceptions',report.errors.length===0,{errors:report.errors});
 fs.writeFileSync('docs/verification/upgrade-report.json',JSON.stringify(report,null,2));console.log('PASS '+report.checks.length+' upgrade checks');
 await send('Browser.close');
}catch(e){fs.writeFileSync('docs/verification/upgrade-report.json',JSON.stringify(report,null,2));throw e}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close()}
