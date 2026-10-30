import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context=vm.createContext({document:{},Math,console,matchMedia:()=>({matches:false})});
for(const f of ['data.js','catalog.js','expanded-catalog.js','decor.js'])vm.runInContext(fs.readFileSync(f,'utf8'),context);
vm.runInContext(`const N=22,PX0=2,PY0=9,PCOLS=6,PROWS=5;let S={decor:[],fx:{particles:false,hq:true},b:{}};const MOTION_MANIFEST={clips:{}};`,context);
vm.runInContext(fs.readFileSync('motion.js','utf8'),context);
const tests=[];
for(const fps of [30,60,120]){
 const result=vm.runInContext(`(()=>{const a={x:6,y:8.5,tx:9.5,ty:7.5,face:1};let maxSpeed=0,initialSpeed=0;for(let f=0;f<${fps}*4;f++){let remaining=1/${fps};while(remaining>1e-7){const dt=Math.min(remaining,1/120);Motion.stepEntity(a,dt,2.8,1.35);maxSpeed=Math.max(maxSpeed,a.speed);if(f===0)initialSpeed=a.speed;remaining-=dt}}return {fps:${fps},x:a.x,y:a.y,phase:a.phase,maxSpeed,initialSpeed,finalSpeed:a.speed}})()`,context);
 assert.ok(result.maxSpeed<=2.8+1e-9);assert.ok(result.initialSpeed<result.maxSpeed);assert.equal(result.finalSpeed,0);assert.ok(Math.hypot(result.x-9.5,result.y-7.5)<.001);tests.push(result);
}
assert.ok(Math.max(...tests.map(t=>t.phase))-Math.min(...tests.map(t=>t.phase))<.001,'Gait must stay in sync across frame rates');
const routes=vm.runInContext(`(()=>{const routes=[[6,8.5,12,4],[6,8.5,18,10],[6,8.5,3,11]].map(v=>Motion.route(...v));return routes.map(r=>({points:r.length,allWalkable:r.every(p=>Motion.canOccupy(p.x,p.y)),validDiagonals:r.every((p,i)=>!i||Math.abs(p.x-r[i-1].x)<.9||Math.abs(p.y-r[i-1].y)<.9||Motion.canOccupy(p.x,r[i-1].y)&&Motion.canOccupy(r[i-1].x,p.y))}))})()`,context);
for(const r of routes){assert.ok(r.points>0);assert.ok(r.allWalkable);assert.ok(r.validDiagonals)}
const turn=vm.runInContext(`(()=>{const a={x:0,y:0,tx:10,ty:0,face:1,turn:1};for(let i=0;i<120;i++)Motion.stepEntity(a,1/120,2.8);a.tx=-10;const values=[];for(let i=0;i<60;i++){Motion.stepEntity(a,1/120,2.8);values.push(a.turn)}return {intermediate:values.some(x=>x>-.8&&x<.8),reversed:values.at(-1)<-.9,maxJump:Math.max(...values.slice(1).map((v,i)=>Math.abs(v-values[i])))}})()`,context);
assert.ok(turn.intermediate&&turn.reversed);assert.ok(turn.maxJump<.3);
const result={passed:true,frameRates:tests,routes,turn};fs.writeFileSync('docs/motion-logic-report.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
