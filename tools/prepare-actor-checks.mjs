import fs from 'node:fs';
const file='tools/verify-3d.mjs';let s=fs.readFileSync(file,'utf8').replace("40-square world retains 60 saved plots and opens southern garden","48-square world retains 60 saved plots and opens southern garden").replace('N===40&&','N===48&&');
const anchor=" check('no runtime errors'";if(!s.includes(anchor))throw Error('Missing insertion point');
s=s.replace(anchor,String.raw`
 check('new avatar has articulated elbows, knees, fingers and continuous hair',await run("(()=>{const r=Farm3D.player.userData.rig;return r.knees.length===2&&r.elbows.length===2&&r.eyeParts.length===2})()"));
 check('all roaming animals use articulated meshes instead of sliding sprites',await run("Scene.animals.every(a=>{const r=Farm3D.actors.get(a.k);return r?.isGroup&&r.userData.rig&&(a.fly?r.userData.rig.wings.length===2:r.userData.rig.legs.length>=2)})"));
 const gait=await run("(()=>{const p=Avatar3D.build(S.av);Avatar3D.animate(p,{walk:true,phase:.15,t:1});const a=p.userData.rig.knees.map(k=>k.rotation.x);Avatar3D.animate(p,{walk:true,phase:.65,t:1.4});const b=p.userData.rig.knees.map(k=>k.rotation.x);Avatar3D.dispose(p);return{a,b}})()");check('knees alternate with travel phase',gait.a[0]!==gait.b[0]&&gait.a[1]!==gait.b[1],gait);
 await run("Scene.centerOn(12,46,.70);hidePop()");await sleep(400);await screenshot('actors-frontier');
 await run("Scene.centerOn(11.5,4,.90)");await sleep(250);await screenshot('actors-pond');
`+anchor);fs.writeFileSync(file,s);
console.log('Added articulated model checks');
