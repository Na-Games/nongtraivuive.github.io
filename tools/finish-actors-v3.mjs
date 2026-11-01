import fs from 'node:fs';
const edit=(file,from,to)=>{const s=fs.readFileSync(file,'utf8');if(!s.includes(from))throw Error('Missing anchor '+file);fs.writeFileSync(file,s.replace(from,to))};
edit('avatar-3d.js',"if(m.userData.avatarRole)m.color.set(a[m.userData.avatarRole])", "if(m.userData.avatarRole)m.color.set(a[m.userData.avatarRole]);if(m.userData.skinMultiplier)m.color.set(a.skin).multiplyScalar(m.userData.skinMultiplier);if(m.userData.skinTint)m.color.set(a.skin).lerp(new THREE.Color('#d98f78'),m.userData.skinTint)");
edit('avatar-3d.js',"ball(head,this.material(new THREE.Color(a.skin).multiplyScalar(.88)),side*.229", "const inner=this.material(new THREE.Color(a.skin).multiplyScalar(.88));inner.userData.skinMultiplier=.88;ball(head,inner,side*.229");
edit('avatar-3d.js',"ball(head,this.material(cheek),side*.143", "const blush=this.material(cheek);blush.userData.skinTint=.24;ball(head,blush,side*.143");
edit('motion.js',"const p=scene.iso(e.gx,e.gy),phase=Math.min(.999,e.age/e.life);", "const p=typeof Farm3D!=='undefined'&&Farm3D.active?Farm3D.project(e.gx,e.gy,e.kind==='water'?.16:Farm3D.walkHeight(e.gx,e.gy)):scene.iso(e.gx,e.gy),phase=Math.min(.999,e.age/e.life);");
console.log('Skin details follow settings; footstep effects align with the actual ground/water');
