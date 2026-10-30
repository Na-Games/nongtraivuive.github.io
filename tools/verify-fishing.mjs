import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
const root=process.cwd(),report={errors:[],checks:[]};fs.mkdirSync('docs/verification',{recursive:true});fs.mkdirSync('.runtime',{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname==="/"?'/index.html':new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(file,(e,data)=>{if(e){res.writeHead(404).end();return}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data)})});
await new Promise(r=>server.listen(8766,'127.0.0.1',r));
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--disable-component-update','--disk-cache-size=1','--media-cache-size=1','--no-first-run','--no-default-browser-check','--remote-debugging-port=9228','--user-data-dir='+path.join(root,'.runtime','fishing-profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;try{
 let targets;for(let i=0;i<30;i++){try{targets=await(await fetch('http://127.0.0.1:9228/json',{signal:AbortSignal.timeout(1000)})).json();if(targets.some(t=>t.type==='page'))break}catch{}await new Promise(r=>setTimeout(r,200))}
 if(!targets?.some(t=>t.type==='page'))throw Error('Chrome DevTools did not become available');
 ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let serial=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);else if(m.method==='Log.entryAdded'&&m.params.entry.level==='error'&&!m.params.entry.url?.includes('fonts.googleapis'))report.errors.push(m.params.entry.text)});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
 await send('Runtime.enable');await send('Log.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:960,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'http://127.0.0.1:8766/'});
 for(let i=0;i<100;i++){if(await evaluate("typeof Art!=='undefined'&&typeof Scene!=='undefined'&&Scene.ctx&&Art.ready+Art.failed.length===Art.total"))break;await new Promise(r=>setTimeout(r,100))}
 await evaluate('Art.promise');await new Promise(r=>setTimeout(r,2800));
 const delay=ms=>new Promise(r=>setTimeout(r,ms));
 const shot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/verification/'+name+'.png',Buffer.from(r.data,'base64'))};
 const check=async expression=>{const r=await evaluate(expression);report.checks.push(r);if(!r.pass)throw Error('Failed: '+JSON.stringify(r));return r};
 await evaluate(`S=defState();S.province='Thanh Hóa';S.tutorial=true;S.fx.sound=false;S.fish.baits={nho:20,giun:10,dac:5};document.querySelector('#screen-map').classList.add('hidden');document.querySelector('#hud').classList.remove('hidden');refreshHud();openFishing()`);await delay(1250);
 await shot('fishing-desktop');
 await check(`({name:'three locations, all species and live PNGs',pass:!!FS&&Object.keys(FISH_SPOTS).length===3&&Object.keys(FISHES).every(id=>Object.values(FISH_SPOTS).some(s=>s.fish.includes(id)))&&[...document.querySelectorAll('#screen-fish img')].every(i=>i.complete&&i.naturalWidth>0)})`);
 const click=async selector=>{const p=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...p});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...p})};
 await click('#fhold');
 await check(`({name:'real pointer casts chosen inexpensive bait only',pass:FS.state==='wait'&&S.fish.baits.nho===19&&S.fish.baits.dac===5})`);
 await evaluate(`FS.wait=0;fishUpdate(1/120)`);await shot('fishing-bite-desktop');
 await click('#fhold');
 await check(`({name:'bite hooks, pointer release clears hold',pass:FS.state==='fight'&&!FS.reel})`);
 await evaluate(`FS.fightTime=2.5;FS.moodName='warning';Fishing.ui();fishDraw()`);await shot('fishing-warning-desktop');
 await check(`(()=>{FS.fightTime=0;for(let i=0;i<6600&&FS.state==='fight';i++){const mood=FishMechanics.mood(FS);FS.reel=mood!=='warning'&&mood!=='burst'&&FS.tension<65;fishUpdate(1/120)}const n=S.fish.caught,quantity=S.inv.caro||0,xp=S.fish.xp;endFight(true);return{name:'complete playable catch and reject duplicate reward',pass:FS.state==='result'&&n===1&&S.fish.caught===n&&(S.inv.caro||0)===quantity&&S.fish.xp===xp&&!!S.fish.records.caro}})()`);
 await shot('fishing-result-desktop');
 await check(`(()=>{const c=S.coins,price=FS.result.price;Fishing.sell();Fishing.sell();return{name:'sale once, collection survives selling',pass:S.coins===c+price&&!S.inv.caro&&S.fish.seen.caro===1&&FS.result.sold}})()`);
 await evaluate(`document.querySelector('.result-close').click();openSettings(3)`);await delay(450);
 await check(`({name:'settings pause fish and appear above fishing screen',pass:FS.paused&&getComputedStyle(document.querySelector('#layer-sheet')).zIndex==='85'&&document.querySelectorAll('.pref-row').length>=6})`);
 await evaluate(`window.__pulses=[];Object.defineProperty(navigator,'vibrate',{configurable:true,value:p=>{window.__pulses.push(p);return true}})`);
 await check(`(()=>{const pulses=[];for(const value of ['light','medium','strong']){Preferences.set('vibration',value);Haptics.pulse('test',true);pulses.push(window.__pulses.at(-1)[0])}Preferences.set('vibration','off');const before=window.__pulses.filter(Array.isArray).length;Haptics.pulse('bite',true);return{name:'vibration levels and off switch with mocked device',pass:pulses[0]<pulses[1]&&pulses[1]<pulses[2]&&before===window.__pulses.filter(Array.isArray).length,pulses}})()`);
 await evaluate(`Preferences.set('vibration','strong');Preferences.set('volume',.35);openSettings(3)`);await delay(300);await shot('settings-vibration-desktop');
 await check(`(()=>{openSettings(0);const row=[...document.querySelectorAll('.pref-row')].find(b=>b.textContent.includes('Thuận tay trái'));row.click();openSettings(1);document.querySelectorAll('.theme-chip')[2].click();return{name:'theme preserves preferences and fishing layer',pass:document.body.classList.contains('fishing-active')&&document.body.classList.contains('left-handed')&&document.body.classList.contains('theme-ocean')}})()`);
 await evaluate(`closeSheet();Fishing.resume();S.fish.caught=5;Fishing.locations()`);await delay(300);
 await check(`(()=>{const buttons=[...document.querySelectorAll('.spot-card')];const gate=buttons[2].disabled;buttons[1].click();return{name:'progression unlocks river after five catches',pass:gate&&S.fish.spot==='river'}})()`);
 await evaluate(`Fishing.resume();S.fish.caught=5;S.fish.chests=0;Fishing.missions()`);await delay(200);
 await check(`(()=>{const c=S.coins,b=document.querySelector('.angler-goal button');b.onclick();b.onclick();return{name:'earned chest cannot be claimed twice',pass:S.fish.chests===1&&S.coins===c+75}})()`);
 await check(`(()=>{const daily=S.fish.daily;daily.perfect=1;Fishing.missions();const button=document.querySelectorAll('.angler-goal button')[2],coins=S.coins;button.onclick();button.onclick();return{name:'daily goal claims once',pass:S.coins===coins+60&&daily.claimed.filter(id=>id==='perfect').length===1}})()`);
 await check(`(()=>{S.fish.tools={xo:1,luoi:1};const valid=fishCapacity()===S.cap+2&&fishSellPrice('cachep')===Math.round(FISHES.cachep.sell*1.1)&&fishSellPrice('lua')===ITEMS.lua.sell;S.fish.tools={};return{name:'bucket capacity and actual net sale bonus',pass:valid}})()`);
 await evaluate(`closeSheet();Fishing.resume();S.fish.spot='lotus';FS.state='idle';FS.result=null;S.fx.fishControl='toggle';cast();FS.wait=0;fishUpdate(1/120);startFight()`);await delay(450);
 await click('#fhold');
 await check(`({name:'tap control stays engaged after pointer release',pass:FS.reel})`);
 await click('#fhold');
 await check(`({name:'second tap releases line',pass:!FS.reel})`);
 await evaluate(`S.fx.fishControl='hold';Fishing.press();dispatchEvent(new Event('blur'))`);
 await check(`({name:'leaving window pauses and clears input',pass:FS.paused&&!FS.reel&&!Fishing.inputActive})`);
 await evaluate(`Fishing.resume();FS.state='idle';FS.result=null;S.fx.castTiming=true;Fishing.press();FS.aimTime=1;Fishing.press();S.fx.castTiming=false`);
 await check(`({name:'optional timing produces a valid cast',pass:FS.state==='wait'&&Number.isFinite(FS.castQuality)&&FS.castQuality>=0&&FS.castQuality<=1})`);
 await evaluate(`FS.state='idle';FS.result=null;FS.paused=false;S.fish.spot='lotus';Fishing.gearHud();Fishing.ui()`);
 for(const [width,height]of [[390,844],[320,568],[844,390]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await evaluate('Fishing.resize();fishDraw()');await delay(250);
   await check(`(()=>{const controls=[...document.querySelectorAll('.angler-header,.angler-tools,.angler-console')];return{name:'responsive fishing ${width}x${height}',pass:document.body.scrollWidth<=innerWidth&&controls.every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1})}})()`);
   await shot('fishing-'+width+'x'+height);
 }
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await evaluate(`FS.state='fight';FS.fishId='cachep';FS.fightTime=2.6;FS.moodName='warning';FS.prog=56;FS.tension=74;FS.assist=1;Fishing.ui();fishDraw()`);await shot('fishing-warning-mobile');
 await evaluate(`openSettings(3)`);await delay(300);await shot('settings-vibration-mobile');
 await check(`(()=>{Object.defineProperty(navigator,'vibrate',{configurable:true,value:undefined});refreshSheet();return{name:'unsupported devices show honest disabled vibration test',pass:[...document.querySelectorAll('.pref-wide')].some(b=>b.textContent.includes('Thử rung')&&b.disabled)&&document.querySelector('.sheet .body').textContent.includes('không hỗ trợ rung')}})()`);
 await evaluate(`closeSheet();Fishing.resume();FS.state='idle';FS.result=null;S.fish.baits.nho=5;S.fish.bait='nho';S.inv={lua:1};S.cap=2;S.fish.tools={};cast();S.inv.lua=2;FS.fishId='cachep';endFight(true);save()`);
 await check(`({name:'bag filling during catch preserves pending fish',pass:!!S.fish.pendingCatch&&FS.state==='result'&&!FS.result.kept&&invTotal()===2})`);
 const pendingCount=await evaluate('S.fish.caught');
 await send('Page.reload');await delay(4500);await evaluate('Art.promise');
 await check(`({name:'preferences and pending catch survive reload',pass:S.fx.vibration==='strong'&&S.fx.volume===.35&&S.fx.leftHanded&&!!S.fish.pendingCatch&&S.fish.caught===${pendingCount}})`);
 await evaluate('openFishing()');await delay(1250);
 await check(`(()=>{const c=S.coins;const price=FS.result.price;Fishing.sell();Fishing.sell();return{name:'restored pending fish sells once without inventory overflow',pass:FS.state==='result'&&S.coins===c+price&&invTotal()===2&&!S.fish.pendingCatch&&S.fish.caught===${pendingCount}}})()`);
 await evaluate(`closeFishing()`);await delay(1100);
 await check(`({name:'exit stops fishing and resumes farm',pass:FS===null&&!Fishing.audio&&!document.body.classList.contains('fishing-active')&&!Scene._e})`);
 report.passed=report.errors.length===0&&report.checks.every(r=>r.pass);fs.writeFileSync('docs/verification/fishing-browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
 await send('Browser.close');
}catch(error){report.error=error.stack;fs.writeFileSync('docs/verification/fishing-browser-report.json',JSON.stringify(report,null,2));console.error(JSON.stringify(report,null,2));process.exitCode=1}
finally{ws?.close();chrome.kill();server.close()}
