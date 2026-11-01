import fs from 'node:fs';
const edit=(file,from,to)=>{const s=fs.readFileSync(file,'utf8');if(!s.includes(from))throw Error('Missing anchor '+file+': '+from.slice(0,60));fs.writeFileSync(file,s.replace(from,to))};
edit('game.js','const N=40,','const N=48,');
edit('farm-3d.js','x=-12;x<42;x+=step','x=-18;x<52;x+=step');
edit('farm-3d.js','y=-12;y<52;y+=step','y=-18;y<N+16;y+=step');
edit('farm-3d.js','this.loadSurface();this.addControls();this.waterfall();this.batch(this.static);','this.loadSurface();this.addControls();this.waterfall();this.edgeHaze();this.batch(this.static);');
edit('farm-3d.js',"const alive=new Set(),replace=", "const dt=clamp(Scene.t-(this.actorTime??Scene.t-1/60),.001,.1);this.actorTime=Scene.t;const alive=new Set(),replace=");
edit('farm-3d.js','this.player.rotation.y+=delta*.22;', 'this.player.rotation.y+=delta*(1-Math.exp(-10*dt));');
edit('farm-3d.js','Avatar3D.animate(this.player,{walk:p.walk,t:Scene.t,phase:p.phase,work:p.work>0})','Avatar3D.animate(this.player,{walk:p.walk,blend:p.moveBlend,t:Scene.t,phase:p.phase,work:p.work>0})');
const f='farm-3d.js',source=fs.readFileSync(f,'utf8'),start=source.indexOf('  const animalIds=new Set();'),end=source.indexOf('\n },\n walkHeight',start);if(start<0||end<0)throw Error('Animal loop not found');
fs.writeFileSync(f,source.slice(0,start)+`  const animalIds=new Set();for(const a of Scene.animals){animalIds.add(a.k);let actor=this.actors.get(a.k);if(!actor){actor=Animal3D.build(a);this.scene.add(actor);this.actors.set(a.k,actor)}actor.position.set(a.x,a.water?.19:this.walkHeight(a.x,a.y)+(a.fly?.6:0),a.y);Animal3D.animate(actor,a,Scene.t,dt)}for(const [id,actor]of this.actors)if(!animalIds.has(id)){this.scene.remove(actor);this.actors.delete(id)}\n`+source.slice(end));
edit('motion.js',"e.speed=Math.hypot(e.vx,e.vy);const distance=", "e.speed=Math.hypot(e.vx,e.vy);if(e.speed>.025){const desired=Math.atan2(e.vx,e.vy);e.heading??=desired;const delta=Math.atan2(Math.sin(desired-e.heading),Math.cos(desired-e.heading));e.heading+=delta*this.exp(9,dt)}const distance=");
edit('motion.js',"if(!a.motionStarted){a.motionStarted=true;", "if(!a.motionStarted){a.motionStarted=true;a.heading=0;");
// Advancing a waypoint must preserve momentum, rather than stopping at every corner.
edit('motion.js',"Math.hypot(waypoint.x-a.x,waypoint.y-a.y)<.08", "Math.hypot(waypoint.x-a.x,waypoint.y-a.y)<Math.max(.10,(a.speed||0)*.28)");
edit('landscape.js','return (y===34&&x>=8&&x<=23)', 'return (y===43&&x>=3&&x<=23)||(x===12&&y>=34&&y<=44)||(y===34&&x>=8&&x<=23)');
edit('world.js',"{id:'garden',n:'Vườn phương Nam'", "{id:'meadow',n:'Đồng cỏ ven rừng',desc:'Đường dạo và khoảng vườn mới phía Nam',x:12,y:43,icon:'tree'},\n    {id:'garden',n:'Vườn phương Nam'");
// Compact buttons still keep their 44 px touch targets and accessible text labels.
edit('playability.css','.crop-wheel{width:268px;padding:4px}', '.crop-wheel{width:214px;padding:3px}');
edit('playability.css','width:256px;height:136px;margin:6px auto 0','width:202px;height:90px;margin:2px auto 0');
edit('playability.css','width:58px;min-height:58px;height:58px;padding:4px 1px','width:46px;min-height:46px;height:46px;padding:2px 1px');
edit('playability.css','left:0;top:68px','left:2px;top:36px');
edit('playability.css','left:61px;top:9px','left:51px;top:7px');
edit('playability.css','right:61px;top:9px','right:51px;top:7px');
edit('playability.css','right:0;top:68px','right:2px;top:36px');
edit('playability.css','width:27px;height:27px','width:23px;height:23px');
edit('playability.css','.care-quick-grid button small{font-size:7px}', '.care-quick-grid button small{display:none}');
edit('playability.css','.crop-wheel{width:268px}.care-quick-grid{display:block}.care-quick-grid button{width:58px;min-height:58px}.care-quick-grid .game-icon{width:27px;height:27px}', '.crop-wheel{width:214px}.care-quick-grid{display:block}.care-quick-grid button{width:46px;min-height:46px}.care-quick-grid .game-icon{width:23px;height:23px}');
console.log('48-square world, articulated actors, smooth heading and compact care arc applied');
