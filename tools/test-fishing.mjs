import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const c=vm.createContext({console});for(const file of ['data.js','catalog.js','expanded-catalog.js','fishing-core.js'])vm.runInContext(fs.readFileSync(file,'utf8'),c);
const report=vm.runInContext(`(()=>{
  const results=[];
  const run=(id,mode='relax',power=1,hz=120,careful=true)=>{const f={fightTime:0,prog:10,tension:16,lim:mode==='relax'?55:40,reel:false,clean:true,dangerTime:0,beginner:false};let outcome=null,elapsed=0;while(!outcome&&elapsed<56){const mood=FishMechanics.mood(f);if(careful){if(mood==='warning'||mood==='burst'||f.tension>=68)f.reel=false;else if(f.tension<38)f.reel=true}else f.reel=true;outcome=FishMechanics.step(f,1/hz,{fishDifficulty:mode},FISHES[id],power);elapsed+=1/hz}return {outcome,elapsed,progress:f.prog,tension:f.tension}};
  for(const id of Object.keys(FISHES)){const r=run(id);results.push({test:'relaxed starter rod: '+id,pass:r.outcome==='win',seconds:+r.elapsed.toFixed(2)})}
  const low=run('chepvang','relax',1),high=run('chepvang','relax',2.3);results.push({test:'upgraded rod improves catch time',pass:high.outcome==='win'&&high.elapsed<low.elapsed});
  const reckless=run('cachien','challenge',1,120,false);results.push({test:'ignoring warnings can lose a difficult fish',pass:reckless.outcome==='line'});
  const times=[30,60,120].map(hz=>run('cachep','relax',1,hz));results.push({test:'equivalent catches at 30/60/120 Hz',pass:times.every(r=>r.outcome==='win')&&Math.max(...times.map(r=>r.elapsed))-Math.min(...times.map(r=>r.elapsed))<.2});
  const f={fightTime:0,prog:12,tension:99,lim:55,reel:false,dangerTime:1.4};const out=FishMechanics.step(f,1/60,{fishDifficulty:'relax'},FISHES.cachep,1);results.push({test:'releasing in danger has a recovery window',pass:out===null&&f.tension<99});
  results.push({test:'all 22 species available across locations',pass:Object.keys(FISHES).length===22&&Object.keys(FISHES).every(id=>Object.values(FISH_SPOTS).some(s=>s.fish.includes(id)))});
  results.push({test:'progression gates',pass:FishMechanics.unlocked('lotus',0)&&!FishMechanics.unlocked('river',4)&&FishMechanics.unlocked('river',5)&&!FishMechanics.unlocked('bay',14)&&FishMechanics.unlocked('bay',15)});
  results.push({test:'shrimp and giant fish have distinct sensible weights',pass:FishMechanics.weight(FISHES.tom,1,'tom')<.2&&FishMechanics.weight(FISHES.laokhonglo,0,'laokhonglo')>=14});
  return results;
})()`,c);
fs.writeFileSync('docs/fishing-logic-report.json',JSON.stringify(report,null,2));for(const r of report)assert.equal(r.pass,true,JSON.stringify(r));console.log('PASS '+report.length+' fishing scenarios');
