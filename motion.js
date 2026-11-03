'use strict';
/* Time-based movement and fixed-pivot PNG animation. No per-frame image resizing. */
const Motion={
  effects:[],media:matchMedia('(prefers-reduced-motion: reduce)'),reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,
  exp:(rate,dt)=>1-Math.exp(-rate*dt),
  clip(id){return MOTION_MANIFEST.clips[id]},
  has(id){const clip=this.clip(id);return !!(clip&&clip.frames.every(f=>Art.has(f)))},
  frame(id,phase=0){const clip=this.clip(id);if(!clip)return null;return clip.frames[((Math.floor(phase*clip.frames.length)%clip.frames.length)+clip.frames.length)%clip.frames.length]},
  fishingRigs:{},
  fishingRig(frameId){
    if(this.fishingRigs[frameId])return this.fishingRigs[frameId];
    const b=ART_MANIFEST.sprites[frameId].bounds;
    return this.fishingRigs[frameId]=typeof FISHING_RIGS!=='undefined'&&FISHING_RIGS[frameId]||{x:b.x,y:b.y+b.h*.3,width:40};
  },
  draw(c,id,phase,x,y,size,options={}){
    if(!this.has(id))return false;const clip=this.clip(id),frame=ART_MANIFEST.sprites[this.frame(id,phase)],sheet=ART_MANIFEST.sheets[frame.sheet],extent=clip.extent,side=size*clip.cell/extent;
    c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.translate(x,y);c.scale(options.flipScale??1,1);if(options.angle)c.rotate(options.angle);if(options.alpha!=null)c.globalAlpha*=options.alpha;
    if(options.cleanFishing){const rig=this.fishingRig(this.frame(id,phase)),scale=size/extent,px=v=>(v-clip.pivot[0])*scale,py=v=>(v-clip.pivot[1])*scale;c.beginPath();c.rect(px(0),py(0),side,side);c.moveTo(px(rig.x-9),py(rig.y+3));c.lineTo(px(rig.x+rig.width),py(rig.y+rig.width+12));c.lineTo(px(rig.x+rig.width),py(clip.cell));c.lineTo(px(rig.x-9),py(clip.cell));c.closePath();c.clip('evenodd')}
    c.drawImage(Art.images[frame.sheet],frame.col*sheet.cell,frame.row*sheet.cell,sheet.cell,sheet.cell,-side*clip.pivot[0]/clip.cell,-side*clip.pivot[1]/clip.cell,side,side);c.restore();return true;
  },
  canOccupy(x,y){
    if(typeof Farm3D!=='undefined'&&Farm3D.active&&Math.abs(y-35)<.36&&[10,17,22].some(b=>Math.abs(x-b)<.62))return false;
    if(typeof Landscape!=='undefined'&&Landscape.water(x,y))return false;
    if(x>=2&&x<8&&y>=23&&y<28)return false;
    if(x>=(typeof COAST_X==='undefined'?25:COAST_X)+1||y<1.5)return false;
    if(x<.3||y<.3||x>N-.3||y>N-.3)return false;
    if(x>=PX0-.15&&x<PX0+PCOLS+.15&&y>=PY0-.15&&y<PY0+Math.min(PROWS,5)+.15)return false;
    if(Math.hypot((x-11.5)/3.5,(y-3.6)/2.8)<1)return false;
    if(Object.values(BUILDINGS).some(b=>x>b.slot[0]-.15&&x<b.slot[0]+2.15&&y>b.slot[1]-.15&&y<b.slot[1]+2.15))return false;
    if((S.decor||[]).some(d=>Math.hypot(x-d.gx,y-d.gy)<.65))return false;
    if(typeof Scene!=='undefined'&&Scene.objs?.some(o=>this.solid(o.k)&&Math.hypot(x-o.gx,y-o.gy)<this.radius(o.k)))return false;
    if(typeof Village!=='undefined'&&Village.sceneObjects().some(o=>Math.hypot(x-o.gx,y-o.gy)<1.05))return false;
    return true;
  },
  solid(id){return !['flower','sign','boat','village-stairs','village-stone-bridge','village-pipeline','hay'].includes(id)},
  radius(id){return /house|greenhouse|stall/.test(id)?1.18:/tree|pine|maple|bamboo|palm/.test(id)?.57:/rock/.test(id)?.42:.5},
  pond(x,y){return Math.hypot((x-11.5)/2.75,(y-3.6)/2.05)<1},
  canTravel(x,y,tx,ty,allowed=(x,y)=>this.canOccupy(x,y)){const steps=Math.max(1,Math.ceil(Math.hypot(tx-x,ty-y)/.1));for(let i=1;i<=steps;i++)if(!allowed(x+(tx-x)*i/steps,y+(ty-y)*i/steps))return false;return true},
  stepSafe(e,dt,speed,stride){const x=e.x,y=e.y,phase=e.phase,allowed=e.fly?()=>true:e.water?(x,y)=>this.pond(x,y):(x,y)=>this.canOccupy(x,y);const distance=this.stepEntity(e,dt,speed,stride);if(this.canTravel(x,y,e.x,e.y,allowed))return distance;e.x=x;e.y=y;e.phase=phase||0;e.tx=x;e.ty=y;e.vx=e.vy=0;e.path=null;e.walk=0;e.speed=0;e.moving=false;e.wait=.1;return 0},
  route(x,y,tx,ty){
    const now=Date.now(),key=JSON.stringify([S.decor||[],Object.keys(S.b||{}),typeof Scene!=='undefined'?Scene.objs?.length:0]);if(!this.navCache||this.navCache.key!==key||now-this.navCache.time>500)this.navCache={key,time:now,cells:Array.from({length:N*N},(_,i)=>this.canOccupy(i%N+.5,Math.floor(i/N)+.5))};const cells=this.navCache.cells,nearest=(px,py)=>{let best=-1,dist=Infinity;for(let i=0;i<cells.length;i++){if(!cells[i])continue;const d=(i%N+.5-px)**2+(Math.floor(i/N)+.5-py)**2;if(d<dist){dist=d;best=i}}return best};
    const start=nearest(x,y),goal=nearest(tx,ty);if(start<0||goal<0)return [];
    const open=new Set([start]),cost=new Float64Array(N*N).fill(Infinity),from=new Int32Array(N*N).fill(-1),closed=new Set();cost[start]=0;const heuristic=i=>Math.hypot(i%N-goal%N,Math.floor(i/N)-Math.floor(goal/N));
    while(open.size){let current=-1,score=Infinity;for(const i of open){const s=cost[i]+heuristic(i);if(s<score){current=i;score=s}}if(current===goal){const path=[];for(let i=goal;i>=0;i=from[i]){path.push({x:i%N+.5,y:Math.floor(i/N)+.5});if(i===start)break}path.reverse();if(this.canOccupy(tx,ty))path.push({x:tx,y:ty});return path}open.delete(current);closed.add(current);
      const cx=current%N,cy=Math.floor(current/N);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=N||ny>=N)continue;const n=ny*N+nx;if(!cells[n]||closed.has(n)||dx&&dy&&(!cells[cy*N+nx]||!cells[ny*N+cx]))continue;const next=cost[current]+Math.hypot(dx,dy);if(next<cost[n]){cost[n]=next;from[n]=current;open.add(n)}}
    }return [];
  },
  navigate(p,tx,ty){const route=this.route(p.x,p.y,tx,ty),path=[];let x=p.x,y=p.y;for(let i=0;i<route.length;){let end=i;for(let j=i+1;j<route.length;j++){if(!this.canTravel(x,y,route[j].x,route[j].y))break;end=j}path.push(route[end]);x=route[end].x;y=route[end].y;i=end+1}p.path=path;p.pathIndex=0;p.goal={x:tx,y:ty};if(p.path.length){p.tx=p.path[0].x;p.ty=p.path[0].y}return p.path.length>0},
  workPlayer(duration=.85,action='hoe'){const p=Scene.player;p.action=action;if(p.walk||p.path?.length)p.pendingWork=duration;else p.work=duration},
  stepEntity(e,dt,maxSpeed,stride=1){
    const dx=e.tx-e.x,dy=e.ty-e.y,d=Math.hypot(dx,dy),oldX=e.x,oldY=e.y;
    const speed=d<.018?0:Math.min(maxSpeed,Math.sqrt(2*maxSpeed*3*d));
    const desiredX=d?dx/d*speed:0,desiredY=d?dy/d*speed:0,k=this.exp(10,dt);
    e.vx=(e.vx||0)+(desiredX-(e.vx||0))*k;e.vy=(e.vy||0)+(desiredY-(e.vy||0))*k;
    const step=Math.hypot(e.vx,e.vy)*dt;
    if(d<.018||step>=d&&e.vx*dx+e.vy*dy>0){e.x=e.tx;e.y=e.ty;e.vx=e.vy=0}else{e.x+=e.vx*dt;e.y+=e.vy*dt}
    e.speed=Math.hypot(e.vx,e.vy);if(e.speed>.025){const desired=Math.atan2(e.vx,e.vy);e.heading??=desired;const delta=Math.atan2(Math.sin(desired-e.heading),Math.cos(desired-e.heading));e.heading+=delta*this.exp(9,dt)}const distance=Math.hypot(e.x-oldX,e.y-oldY);e.phase=(e.phase||0)+distance/stride;e.moving=e.speed>.035;e.moveBlend=(e.moveBlend||0)+((e.moving?1:0)-(e.moveBlend||0))*this.exp(12,dt);
    if(!e.moving&&e.moveBlend>.01)e.phase+=(Math.round(e.phase*2)/2-e.phase)*this.exp(18,dt);
    const sx=e.vx-e.vy,sy=(e.vx+e.vy)*.5;if(Math.abs(sx)>.08)e.face=sx>0?1:-1;if(Math.abs(sy)>.06)e.back=sy<0;
    e.turn=(e.turn??e.face??-1)+((e.face||-1)-(e.turn??e.face??-1))*this.exp(18,dt);e.walk=e.moveBlend>.06?1:0;
    return distance;
  },
  chooseTarget(a){
    for(let i=0;i<24;i++){const x=clamp(a.home[0]+rnd(-a.r,a.r),.4,N-.4),y=clamp(a.home[1]+rnd(-a.r,a.r),.4,N-.4);if(a.water?this.pond(x,y):a.fly||this.canOccupy(x,y)){if(a.water||a.fly){a.tx=x;a.ty=y;return true}if(this.navigate(a,x,y))return true}}a.tx=a.x;a.ty=a.y;return false;
  },
  update(scene,dt){
    this.reduced=!!S.fx.reduceMotion||this.media.matches;
    for(const a of scene.animals){
      if(!a.fly&&(a.water?!this.pond(a.x,a.y):!this.canOccupy(a.x,a.y))){if(a.water){a.x=11.5;a.y=3.6}else{const route=this.route(a.x,a.y,a.home[0],a.home[1]);if(route.length){a.x=route[0].x;a.y=route[0].y}}a.tx=a.x;a.ty=a.y;a.vx=a.vy=0;a.path=null}
      if(!a.motionStarted){a.motionStarted=true;a.heading=0;a.tx=a.x;a.ty=a.y;a.phase=(a.x*7+a.y*3)%1;a.wait=Math.max(.2,a.wait||1)}
      if(a.path?.length){let waypoint=a.path[a.pathIndex];if(waypoint&&Math.hypot(waypoint.x-a.x,waypoint.y-a.y)<Math.max(.10,(a.speed||0)*.28)&&a.pathIndex<a.path.length-1)waypoint=a.path[++a.pathIndex];if(waypoint){a.tx=waypoint.x;a.ty=waypoint.y}if(a.pathIndex===a.path.length-1&&Math.hypot(a.tx-a.x,a.ty-a.y)<.04)a.path=null}
      if(!a.path&&Math.hypot(a.tx-a.x,a.ty-a.y)<.04){a.wait-=dt;if(a.wait<=0){this.chooseTarget(a);a.wait=rnd(1.2,4)}}
      const distance=this.stepSafe(a,dt,a.sp,a.fly?.6:a.e==='🐄'||a.e==='🐃'?.7:.52);a.footDistance=(a.footDistance||0)+distance;
      if(a.footDistance>(a.water?.3:.55)&&!a.fly){a.footDistance=0;this.emit(a.water?'water':'dust',a.x,a.y,a.water?20:12,.45)}
    }
    const p=scene.player;
    if(p.path?.length){let waypoint=p.path[p.pathIndex];if(waypoint&&Math.hypot(waypoint.x-p.x,waypoint.y-p.y)<.13&&p.pathIndex<p.path.length-1)waypoint=p.path[++p.pathIndex];if(waypoint){p.tx=waypoint.x;p.ty=waypoint.y}}
    if(!this.canOccupy(p.x,p.y)){const path=this.route(p.x,p.y,p.tx,p.ty);if(path.length){p.x=path[0].x;p.y=path[0].y;p.path=path;p.pathIndex=0;p.vx=p.vy=0}}
    const distance=this.stepSafe(p,dt,2.8,1.35);p.footDistance=(p.footDistance||0)+distance;
    if(p.footDistance>.48){p.footDistance=0;this.emit('dust',p.x,p.y,14,.4)}
    if(!p.moving&&Math.hypot(p.tx-p.x,p.ty-p.y)<.025){p.path=null;if(p.pendingWork){p.work=p.pendingWork;p.pendingWork=0}}
    p.jump=Math.max(0,(p.jump||0)-dt);p.workClock=p.work>0?(p.workClock||0)+dt:0;p.work=Math.max(0,p.work-dt);
    for(const e of this.effects)e.age+=dt;this.effects=this.effects.filter(e=>e.age<e.life);
    scene.smokeTime=(scene.smokeTime||0)+dt;if(scene.smokeTime>.65){scene.smokeTime=0;for(const [id,b]of Object.entries(S.b))if(b.t0&&!b.ready){const d=BUILDINGS[id];this.emit('smoke',d.slot[0]+1,d.slot[1]+1,30,.95,105)}}
    scene.gustTime=(scene.gustTime||0)+dt;if(scene.gustTime>4){scene.gustTime=0;if(S.fx.wind!==false)this.emit('wind',p.x+2,p.y-1,65,1.5,12)}
  },
  emit(kind,gx,gy,size=24,life=.6,elevation=0){if(!S.fx.particles||this.reduced||this.effects.length>=100)return;this.effects.push({kind,gx,gy,size,life,elevation,age:0})},
  drawEffects(c,scene){for(const e of this.effects){const p=typeof Farm3D!=='undefined'&&Farm3D.active?Farm3D.project(e.gx,e.gy,e.kind==='water'?.16:Farm3D.walkHeight(e.gx,e.gy)):scene.iso(e.gx,e.gy),phase=Math.min(.999,e.age/e.life);this.draw(c,'motion-'+e.kind,phase,p.x,p.y-e.elevation*scene.cam.z,e.size*scene.cam.z,{alpha:Math.min(1,(1-phase)*3)})}},
  avatar(c,x,y,h,av,o={}){
    if(typeof Wardrobe!=='undefined')return Wardrobe.draw(c,x,y,h,av,o);
    if(av.art===false)return false;const variant=Number.isInteger(av.style)?av.style:Math.max(0,OUTFITS.indexOf(av.outfit)),prefix='farmer'+variant;
    let state=o.fishing?'fish':o.walk?(o.back?'back':'walk'):o.work?'work':o.back?'back':'idle';let phase=o.walk||state==='back'?(o.phase??(o.t||0)*1.5):state==='work'?(o.actionTime??o.t??0)*2.5:(o.t||0)*.7;
    if(state==='fish'){const elapsed=(o.t||0)-(o.castAt||0),clip=this.clip(prefix+'-fish'),n=clip?.frames.length||6,poses=[{hold:3,reel:[5,6,7]},{hold:1,reel:[2,3,4]},{hold:1,reel:[2,3]},{hold:2,reel:[3,4]},{hold:1,reel:[2,3]},{hold:0,reel:[0,1]}][variant];let frame=poses.hold;if(o.caught)frame=n-1;else if(o.fishState==='wait'&&elapsed<.35)frame=Math.min(n-1,Math.floor(elapsed/.12));else if(o.reel)frame=poses.reel[Math.floor((o.t||0)*8)%poses.reel.length];phase=frame/n}
    const breathing=this.reduced||o.walk?1:1+Math.sin((o.t||0)*2.2)*.008,flip=-(o.turn??o.face??-1),angle=o.reel?Math.sin((o.t||0)*7)*.012:0;
    if(o.rigOut&&state==='fish'&&this.has(prefix+'-fish')){const clip=this.clip(prefix+'-fish'),rig=this.fishingRig(this.frame(prefix+'-fish',phase)),scale=h*1.16/clip.extent,dx=(rig.x-clip.pivot[0])*scale,dy=(rig.y-clip.pivot[1])*scale;o.rigOut.x=x+(dx*Math.cos(angle)-dy*Math.sin(angle))*flip;o.rigOut.y=y+(dx*Math.sin(angle)+dy*Math.cos(angle))*breathing}
    c.save();c.translate(x,y);c.scale(1,breathing);const drawn=this.draw(c,prefix+'-'+state,phase,0,0,h*1.16,{flipScale:flip,angle,cleanFishing:state==='fish'&&o.cleanFishing});c.restore();return drawn;
  },
  animal(c,a,z,t,scene){
    if(a.water&&a.e==='🦆'&&Art.has('duck-swim-0')){const p=scene.iso(a.x,a.y),phase=S.fx.reduceMotion?0:Math.floor(t*2+(a.phase||0)*4)%4;return Art.draw(c,'duck-swim-'+phase,p.x,p.y+2*z,45*z,32*z,1,(a.turn??-1)>0)}
    const id=Art.emoji.get(a.e);if(!id)return false;const active=a.moving||a.fly,turning=Math.abs(a.turn??1)<.55&&this.has(id+'-turn'),state=turning?'turn':active?'walk':'idle',phase=turning?Math.abs(a.turn):a.fly?t*2.7+(a.phase||0):active?a.phase:t*.6+a.x;
    const p=scene.iso(a.x,a.y),elevation=a.fly?24+Math.sin(t*3+a.x)*3:a.water?Math.sin(t*2+a.x)*.8:Math.sin((a.phase||0)*Math.PI*4)*.35*(a.moveBlend||0),size=(id==='cow'||id==='buffalo'?47:id==='butterfly'||id==='bee-animal'?24:35)*z;
    return this.draw(c,id+'-'+state,phase,p.x,p.y-elevation*z,size,{flipScale:(a.turn??a.face??-1)>0?-1:1});
  },
  isFoliage(id){return ['tree','bamboo','palm','bush','flower','reeds','lotus','lily','peach-tree','mango-tree','banana-tree','orange-tree','tea-bush','coffee-bush'].includes(id)||id.startsWith('tree-')||/-(0|1|2)$/.test(id)&&ART_MANIFEST.sprites[id]?.sheet==='growth'},
  foliage(c,id,x,y,w,h,t,phase=0){
    if(!Art.has(id))return false;const f=ART_MANIFEST.sprites[id],sheet=ART_MANIFEST.sheets[f.sheet],b=f.bounds,scale=Math.min(w/b.w,h/b.h),dw=b.w*scale,dh=b.h*scale;
    if(this.reduced||S.fx.wind===false)return Art.draw(c,id,x,y,w,h,1);
    const bands=S.fx.hq?(h<50?2:h<95?3:4):2,wind=(Math.sin(t*.95+phase)+Math.sin(t*.41+phase*.7)*.45)*Math.min(3.2,w*.032);
    c.save();c.translate(x,y);for(let k=0;k<bands;k++){const top=k/bands,bottom=(k+1)/bands,y0=-dh+top*dh,y1=-dh+bottom*dh,off0=wind*(1-top)**2,off1=wind*(1-bottom)**2,shear=(off1-off0)/(y1-y0);c.save();c.transform(1,0,shear,1,off0-shear*y0,0);c.drawImage(Art.images[f.sheet],f.col*sheet.cell+b.x,f.row*sheet.cell+b.y+b.h*top,b.w,b.h/bands,-dw/2,y0,dw,dh/bands+.25);c.restore()}c.restore();return true;
  }
};
