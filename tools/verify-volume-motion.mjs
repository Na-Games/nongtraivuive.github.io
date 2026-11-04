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
await new Promise(r=>server.listen(8812,'127.0.0.1',r));
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--enable-unsafe-swiftshader','--use-angle=swiftshader','--no-first-run','--disable-component-update','--remote-debugging-port=9272','--user-data-dir='+path.join(root,'.runtime','smooth-check-profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 let target;for(let i=0;i<40;i++){try{target=(await(await fetch('http://127.0.0.1:9272/json',{signal:AbortSignal.timeout(1000)})).json()).find(t=>t.type==='page');if(target)break}catch{}await sleep(200)}
 assert.ok(target,'Chrome started');ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let seq=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(Error('CDP timeout: '+method))}},45000).unref()});
 const run=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value};
 const screenshot=async name=>{await sleep(400);const p=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/verification/'+name+'.png',Buffer.from(p.data,'base64'))};
 const check=(name,pass,details={})=>{console.log((pass?'PASS ':'FAIL ')+name);report.checks.push({name,pass,...details});assert.ok(pass,name+' '+JSON.stringify(details))};
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await send('Page.navigate',{url:'http://127.0.0.1:8812/'});
 for(let i=0;i<150;i++){if(await run("typeof IllustratedAvatar!=='undefined'&&!!IllustratedAvatar.compose(S.av)&&typeof Farm3D!=='undefined'&&Farm3D.active"))break;await sleep(100)}

 await run('Art.promise');await run("S.province='Test';S.fx.sound=false;S.fx.hq=false;S.fx.shadow=false;S.fx.reduceMotion=false;document.querySelector('#screen-map').classList.add('hidden');document.querySelector('#hud').classList.remove('hidden');closeSheet();S.lv=30;for(const id of ['coop','pen','pigs','goats','sheep','ducks','bee'])S.b[id]={lv:1,t0:0,ready:false};Scene.syncAnimals();S.av=AvatarAssets.preset(0);Object.assign(Scene.player,{x:9.5,y:7.5,tx:9.5,ty:7.5,path:null,vx:0,vy:0});Scene.centerOn(9.5,7.5,2.5)");await sleep(900);
 check('map uses volumetric skinned actors',await run('Farm3D.player.userData.volumetric&&Farm3D.player.userData.mesh.isSkinnedMesh&&[...Farm3D.actors.values()].every(r=>r.userData.volumetric&&r.userData.mesh.isSkinnedMesh)'));
 check('actual depth and one body draw call per actor',await run('(()=>{for(const r of [Farm3D.player,...Farm3D.actors.values()]){const d=r.userData,g=d.mesh.geometry;g.computeBoundingBox();if(g.boundingBox.max.z-g.boundingBox.min.z<.05||g.groups.length>1||d.mesh.material.map)return false}return true})()'));
 const poses=await run('(()=>{const r=Farm3D.player,d=r.userData,a=[];for(let i=0;i<120;i++){Avatar3D.animate(r,{walk:true,blend:1,speed:1.6,phase:i/120,t:i/120,dt:1/120});a.push(d.rig.arms[0].rotation.x)}return{poses:new Set(a.map(x=>x.toFixed(6))).size,maxStep:Math.max(...a.slice(1).map((x,i)=>Math.abs(x-a[i])))}})()');check('continuous anatomical joint poses',poses.poses>80&&poses.maxStep<.04,poses);
 check('all 6 identities and wardrobe variants build with finite skin weights',await run('(()=>{for(let i=0;i<6;i++)for(const shirtStyle of ["shirt","overalls","jacket"])for(const hat of HATS.map(h=>h[0])){const r=Avatar3D.build({...AvatarAssets.preset(i),shirtStyle,hat}),g=r.userData.mesh.geometry;for(const key of ["position","normal","skinWeight"]){for(const v of g.attributes[key].array)if(!Number.isFinite(v))return false}Avatar3D.dispose(r)}return true})()'));
 check('recolor preserves current pose origin and updates appearance',await run('(()=>{const r=Farm3D.player,p=r.position.clone(),q=r.quaternion.clone(),scale=r.scale.clone(),before=r.userData.mesh.geometry.attributes.color.array.slice();Avatar3D.updateColors(r,{...S.av,skin:SKINS[2],hair:HAIRS[3],outfit:OUTFITS[3]});return r.position.equals(p)&&r.quaternion.equals(q)&&r.scale.equals(scale)&&before.some((v,i)=>v!==r.userData.mesh.geometry.attributes.color.array[i])})()'));
 check('feet have independent ankle joints',await run('Farm3D.player.userData.rig.feet.every((f,i)=>f.isBone&&f!==Farm3D.player.userData.rig.knees[i])'));
 const plant=await run('(()=>{const root=Avatar3D.build(S.av);root.position.set(9.5,Farm3D.walkHeight(9.5,7.5),7.5);root.scale.setScalar(.9);const points=[];for(let i=0;i<60;i++){root.position.z+=.8/60;Avatar3D.animate(root,{walk:true,blend:1,speed:.8,phase:.05+i*.3/60,t:i/60,dt:1/60});if(i>20)points.push(root.userData.plants[0].target.clone())}const distance=Math.max(...points.map(p=>p.distanceTo(points[0])));Avatar3D.dispose(root);return distance})()');check('stance target stays fixed while body advances',plant<.00001,{drift:plant});
 check('animals animate every species with valid bone transforms',await run('(()=>{for(const e of Scene.animals){const r=Farm3D.actors.get(e.k);for(let i=0;i<90;i++)Animal3D.animate(r,{...e,moveBlend:1,phase:i/90},i/60,1/60);r.updateMatrixWorld(true);for(const b of r.userData.bones)for(const v of b.matrixWorld.elements)if(!Number.isFinite(v))return false}return true})()'));
 check('jump lifts body and work tools attach to hand',await run('(()=>{const r=Farm3D.player;Avatar3D.animate(r,{jump:true,phase:.5,dt:1/60});const raised=r.userData.rig.body.position.y>.3;Avatar3D.animate(r,{work:true,action:"water",dt:1/60});return raised&&r.userData.tool.parent===r.userData.rig.elbows[1]})()'));
 await run('Avatar3D.updateColors(Farm3D.player,S.av);Scene.centerOn(9.5,7.5,3.5)');await sleep(500);await screenshot('volume-motion-map');
 check('no browser errors',report.errors.length===0&&!await run('!!Scene._e'),{errors:report.errors});fs.writeFileSync('docs/verification/volume-motion-report.json',JSON.stringify(report,null,2));console.log('PASS '+report.checks.length+' volume motion checks');await send('Browser.close');
}catch(error){fs.writeFileSync('docs/verification/volume-motion-report.json',JSON.stringify(report,null,2));throw error}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close()}

