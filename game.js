'use strict';
/* ===== Trạng thái & lưu trữ ===== */
const SAVE_KEY='xom_nong_trai_v2';
const N=48,TW=96,TH=48,PX0=2,PY0=9,PCOLS=6,PROWS=10;
const defState=()=>({
  name:'Nông dân',coins:500,gems:20,xp:0,lv:1,sxp:0,sclaimed:[],
  inv:{lua:3},seeds:{lua:6},cap:150,province:null,joined:0,
  plotsOpen:8,plots:Array.from({length:PCOLS*PROWS},()=>({crop:null,t0:0,lv:1})),
  b:{},bq:[],decor:[],
  fish:{rod:'tre',ownedRods:['tre'],seen:{},baits:{nho:3},tools:{},caught:0},
  orders:[],ordRefresh:0,
  av:{skin:SKINS[0],hair:HAIRS[0],outfit:OUTFITS[0],hat:'non'},
  theme:'default',night:false,
  fx:{...PREF_DEFAULTS},
  checkin:{day:0,last:''},
  mail:[{id:1,t:'Chào mừng đến Xóm Nông Trại!',d:'Quà tân thủ dành cho bạn.',c:300,g:5,got:false},{id:2,t:'Mẹo nhỏ',d:'Chạm vào ô đất để gieo hạt, đợi chín rồi thu hoạch nhé.',got:false}],
  qi:0,qp:{},qbase:0,ev:{},evClaimed:{},friends:[],gift:{sent:0,recv:0,day:''},
  lastSeed:'lua',tutorial:false,ts:Date.now()
});
let S=defState();
function load(){
  try{const r=localStorage.getItem(SAVE_KEY);if(r){const o=JSON.parse(r);S=Object.assign(defState(),o);S.fx=Object.assign(defState().fx,o.fx||{});S.fish=Object.assign(defState().fish,o.fish||{});}}catch(e){}
  S.fx=Preferences.normalize(S.fx);
  S.lv=clamp(Math.floor(Number(S.lv)||1),1,MAX_LEVEL);
  S.av=Wardrobe.normalize(S.av);
  while(S.plots.length<PCOLS*PROWS)S.plots.push({crop:null,t0:0,lv:1});
  if(S.cropTimingVersion!==2){const now=Date.now();for(const p of S.plots){if(!p.crop||!CROPS[p.crop])continue;const c=CROPS[p.crop],oldDuration=(c.legacyTime||c.t)*1000*Math.pow(.92,p.lv-1),progress=clamp((now-p.t0)/oldDuration,0,1);p.durationSec=c.t;p.t0=now-progress*c.t*1000*Math.max(.6,Math.pow(.97,p.lv-1))}S.cropTimingVersion=2}
  if(!S.orders.length)genOrders(true);
  if(!Array.isArray(S.decor))S.decor=[];
  S.fish.seen=S.fish.seen||{};
  for(const id of Object.keys(FISHES))if(S.inv[id])S.fish.seen[id]=Math.max(S.fish.seen[id]||0,S.inv[id]);
  S.fish.ownedRods=[...new Set([...(S.fish.ownedRods||[]),...RODS.slice(0,Math.max(0,RODS.findIndex(r=>r.id===S.fish.rod))+1).map(r=>r.id)])];
  if(!S.friends.length)S.friends=NPC.slice(0,5).map((n,i)=>({n:n[0],e:n[1],lv:ri(3,18),st:i<2}));
}
function save(){try{S.ts=Date.now();localStorage.setItem(SAVE_KEY,JSON.stringify(S))}catch(e){}}
setInterval(save,5000);addEventListener('pagehide',save);

const xpNeed=lv=>Math.round(136*Math.pow(lv,1.35));
const invTotal=()=>Object.values(S.inv).reduce((a,b)=>a+b,0);
const has=(id,n=1)=>(S.inv[id]||0)>=n;
function addItem(id,n){S.inv[id]=(S.inv[id]||0)+n;if(S.inv[id]<=0)delete S.inv[id];}
function pulse(sel){const e=$(sel);if(e){e.classList.remove('bump');void e.offsetWidth;e.classList.add('bump')}}
function addCoins(n){S.coins+=n;pulse('#r-coin');refreshHud();}
function addGems(n){S.gems+=n;pulse('#r-gem');refreshHud();}
function addXp(n){
  S.xp+=n;S.sxp+=n;
  while(S.lv<MAX_LEVEL&&S.xp>=xpNeed(S.lv)){S.xp-=xpNeed(S.lv);S.lv++;onLevelUp();}if(S.lv>=MAX_LEVEL)S.xp=Math.min(S.xp,xpNeed(MAX_LEVEL));
  refreshHud();
}
function reward(r){if(r.c)addCoins(r.c);if(r.g)addGems(r.g);if(r.xp)addXp(r.xp);if(r.i)for(const k in r.i)addItem(k,r.i[k]);}
function rewardText(r){return [r.c&&`🪙${fmt(r.c)}`,r.g&&`💎${r.g}`,r.xp&&`⭐${r.xp}`,r.i&&Object.entries(r.i).map(([k,v])=>ITEMS[k].e+v).join(' ')].filter(Boolean).join(' ')}
function track(key,n=1){
  S.qp[key]=(S.qp[key]||0)+n;
  for(const e of EVENTS)if(e.key===key)S.ev[e.id]=(S.ev[e.id]||0)+n;
  refreshQuest();
}
const questProg=q=>q?(S.qp[q.key]||0)-(S.qbase||0):0;
function claimQuest(){
  const q=QUESTS[S.qi];if(!q||questProg(q)<q.goal)return false;
  reward(q.r);toast('Hoàn thành nhiệm vụ! '+rewardText(q.r));
  Scene.burst(Scene.w/2,Scene.h/2,'⭐');beep('win');
  S.qi++;const n=QUESTS[S.qi];S.qbase=n?(S.qp[n.key]||0):0;refreshQuest();return true;
}

/* ===== Đơn hàng ===== */
const availItems=()=>[...Object.keys(CROPS).filter(k=>CROPS[k].lv<=S.lv+1),...Object.keys(BUILDINGS).filter(b=>S.b[b]).map(b=>BUILDINGS[b].out)];
function genOrder(){
  const pool=availItems(),n=Math.random()<.45?1:2,need=[];
  const ids=[];while(ids.length<n){const k=pick(pool);if(!ids.includes(k))ids.push(k);if(pool.length<2)break}
  let val=0;
  for(const id of ids){const q=ri(3,6+Math.min(8,S.lv));need.push({id,n:q});val+=ITEMS[id].sell*q}
  return{need,coins:Math.round(val*1.12),xp:Math.round(val*.4),id:Math.random()};
}
function genOrders(){S.orders=Array.from({length:9},genOrder)}
function market(){const seed=Math.floor(Date.now()/3600000);const keys=Object.keys(CROPS);return[keys[seed%keys.length],keys[(seed*3+1)%keys.length],keys[(seed*5+2)%keys.length]]}

/* ===== Âm thanh ===== */
let actx;
function beep(kind){
  if(typeof Haptics!=='undefined'&&['coin','win','err'].includes(kind))Haptics.pulse(kind==='err'?'danger':'reward');
  if(typeof GameAudio!=='undefined')GameAudio.play(kind);
}

/* ===== Sinh trưởng ===== */
const cropDur=p=>(p.durationSec||CROPS[p.crop].t)*1000*Math.max(.6,Math.pow(.97,p.lv-1));
const cropProg=p=>p.crop?clamp((Date.now()-p.t0)/cropDur(p),0,1):0;
const yieldQty=p=>1+Math.floor((p.lv-1)/2)+(p.bonus||0);
const plotUpCost=p=>Math.round(120*Math.pow(2.1,p.lv-1));
const bTime=(id)=>BUILDINGS[id].t*1000*Math.pow(.88,(S.b[id].lv-1));
const bQty=id=>1+Math.floor((S.b[id].lv-1)/2)+(S.livestock?.[({coop:'hen',pen:'cow',ducks:'duck',pigs:'pig',goats:'goat',sheep:'sheep'})[id]]||0);
const bUpCost=id=>Math.round(BUILDINGS[id].cost*.9*S.b[id].lv);
const plotReqLv=k=>k<30?Math.max(1,Math.floor((k-3)/2)):Math.min(200,20+(k-30)*6);
const plotCost=k=>Math.round(70*Math.pow(1.13,k-7));
const fmtT=ms=>{const s=Math.ceil(ms/1000);return s>=60?`${Math.floor(s/60)}p ${s%60}s`:`${s}s`};

/* ===== Cảnh isometric ===== */
const Scene={
  cv:null,ctx:null,w:0,h:0,dpr:1,cam:{x:0,y:0,z:1},tz:1,
  t:0,nf:0,parts:[],floats:[],animals:[],player:{x:6,y:8.5,tx:6,ty:8.5,face:1,work:0},
  objs:[],sel:null,onTap:null,hover:null,
  init(){
    this.cv=$('#scene');this.ctx=this.cv.getContext('2d',{alpha:true});
    addEventListener('resize',()=>this.resize());this.resize();
    this.centerOn(6.5,8.5,clamp(innerWidth/640,.5,1));
    this.buildDecor();this.bindInput();this.syncAnimals();
    let last=performance.now();
    const loop=n=>{requestAnimationFrame(loop);const elapsed=n-last;last=n;if(document.hidden||typeof FS!=='undefined'&&FS)return;let remaining=clamp(elapsed/1000,0,.12);this.frameMs=elapsed;try{while(remaining>1e-7){const dt=Math.min(remaining,1/60);this.t+=dt;this.update(dt);remaining-=dt}this.draw()}catch(e){if(!this._e){this._e=1;console.error(e.stack)}}};
    requestAnimationFrame(loop);
  },
  resize(){
    this.dpr=S.fx.hq?Math.min(devicePixelRatio||1,2):1;
    if(this.w===innerWidth&&this.h===innerHeight&&this.cv.width===Math.round(innerWidth*this.dpr))return;
    const anchor=this.w&&this.h?this.grid(this.w/2,this.h/2):null;
    this.w=innerWidth;this.h=innerHeight;
    this.cv.width=Math.round(this.w*this.dpr);this.cv.height=Math.round(this.h*this.dpr);
    if(anchor){const p=this.iso(anchor.x,anchor.y);this.cam.x+=this.w/2-p.x;this.cam.y+=this.h/2-p.y}
    if(typeof hidePop==='function')hidePop();
  },
  iso(gx,gy){const z=this.cam.z;return{x:this.cam.x+(gx-gy)*TW/2*z,y:this.cam.y+(gx+gy)*TH/2*z}},
  grid(sx,sy){const z=this.cam.z,u=(sx-this.cam.x)/z/(TW/2),v=(sy-this.cam.y)/z/(TH/2);return{x:(v+u)/2,y:(v-u)/2}},
  centerOn(gx,gy,z){if(typeof Camera!=='undefined')Camera.reset();this.cam.z=this.tz=z;this.cam.x=this.w/2-(gx-gy)*TW/2*z;this.cam.y=this.h/2-(gx+gy)*TH/2*z},
  zoomAt(f,sx,sy){
    const c=this.cam,nz=clamp(c.z*f,.55,2.4),k=nz/c.z;
    c.x=sx-(sx-c.x)*k;c.y=sy-(sy-c.y)*k;c.z=nz;this.tz=nz;
  },
  bindInput(){
    const cv=this.cv,ptr=new Map();let moved=0,pinch=0,down=null;
    cv.addEventListener('pointerdown',e=>{
      cv.setPointerCapture(e.pointerId);ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});
      moved=0;down={x:e.clientX,y:e.clientY};if(ptr.size===2){const[a,b]=[...ptr.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y)}
    });
    cv.addEventListener('pointermove',e=>{
      const p=ptr.get(e.pointerId);if(!p)return;
      const dx=e.clientX-p.x,dy=e.clientY-p.y;
      if(ptr.size===1){moved+=Math.abs(dx)+Math.abs(dy);if(moved>8){this.cam.x+=dx;this.cam.y+=dy;this.clampCam()}}
      else if(ptr.size===2){
        p.x=e.clientX;p.y=e.clientY;const[a,b]=[...ptr.values()],d=Math.hypot(a.x-b.x,a.y-b.y);
        if(pinch)this.zoomAt(d/pinch,(a.x+b.x)/2,(a.y+b.y)/2);pinch=d;moved=99;return;
      }
      p.x=e.clientX;p.y=e.clientY;
    });
    const up=e=>{
      if(!ptr.has(e.pointerId))return;ptr.delete(e.pointerId);
      if(ptr.size<2)pinch=0;
      if(e.type!=='pointercancel'&&ptr.size===0&&moved<=8&&down&&this.onTap){Haptics.pulse('tap');const g=this.grid(e.clientX,e.clientY);this.onTap(g.x,g.y,e.clientX,e.clientY)}
      else if(moved>8)hidePop();
    };
    cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
    cv.addEventListener('wheel',e=>{e.preventDefault();this.zoomAt(e.deltaY<0?1.12:.89,e.clientX,e.clientY);hidePop()},{passive:false});
  },
  clampCam(){
    const c=this.cam,m=this.grid(this.w/2,this.h/2);
    const lim=(v,a,b)=>clamp(v,a,b);
    const nx=lim(m.x,-1,N+1),ny=lim(m.y,-1,N+1);
    if(nx!==m.x||ny!==m.y){const p=this.iso(nx,ny);c.x+=this.w/2-p.x;c.y+=this.h/2-p.y}
  },
  /* trang trí cố định */
  buildDecor(){
    let s=1337;const r=()=>(s=(s*16807)%2147483647)/2147483647;
    const o=[];
    const inPlot=(x,y)=>x>=PX0-1&&x<PX0+PCOLS+1&&y>=PY0-1&&y<PY0+Math.min(PROWS,5)+1;
    const inPond=(x,y)=>Math.hypot((x-11.5)/3.3,(y-3.6)/2.6)<1.1;
    const slots=Object.values(BUILDINGS).map(b=>b.slot);
    const nearSlot=(x,y)=>slots.some(([a,b])=>x>a-1.5&&x<a+3.5&&y>b-1.5&&y<b+3.5);
    for(let i=0;i<150;i++){
      const x=r()*(N+6)-3,y=r()*(N+6)-3;
      if(inPlot(x,y)||inPond(x,y)||nearSlot(x,y)||(Math.abs(x-8)<1&&y<8))continue;
      const k=r();const edge=x<0||y<0||x>N||y>N;
      o.push({gx:x,gy:y,k:edge?(k<.6?'bamboo':k<.85?'tree':'palm'):(k<.3?'tree':k<.45?'bamboo':k<.6?'bush':k<.7?'palm':k<.85?'flower':'rock'),s:.8+r()*.5,ph:r()*6});
    }
    o.push({gx:5,gy:5,k:'silo',s:1,ph:0},{gx:12,gy:5.9,k:'sign',s:1,ph:0},{gx:1.2,gy:9,k:'well',s:1,ph:0},{gx:8.4,gy:12.2,k:'scarecrow',s:1,ph:0},{gx:9,gy:6.3,k:'hay',s:1,ph:0});
    o.push({gx:6,gy:1,k:'farmhouse',s:1,ph:0},{gx:7.6,gy:5.5,k:'truck',s:.9,ph:0},{gx:9.7,gy:7,k:'tractor',s:.9,ph:0},{gx:14.5,gy:14.5,k:'shop-stall',s:1,ph:0},{gx:14,gy:4.2,k:'boat',s:.85,ph:0},{gx:14,gy:17,k:'greenhouse',s:1,ph:0},{gx:3,gy:7.1,k:'gate',s:1,ph:0},{gx:10.8,gy:1.2,k:'bridge',s:1,ph:0},{gx:7,gy:3,k:'peach-tree',s:1,ph:0},{gx:6.8,gy:2,k:'cat',s:1,ph:0},{gx:14.8,gy:19,k:'buffalo',s:1,ph:0});
    this.objs=o.filter(d=>!['cat','buffalo'].includes(d.k)&&d.gx<25&&d.gy>2);
    for(let i=0;i<12;i++)this.objs.push({gx:18+i%4*1.6,gy:21+Math.floor(i/4)*1.8,k:['orange-tree','mango-tree','banana-tree'][i%3],s:1,ph:i});
    this.objs.push({gx:25.7,gy:14,k:'boat',s:1.2,ph:0},{gx:23,gy:5,k:'farmhouse',s:1,ph:0});
  },
  syncAnimals(){
    const want=[];
    if(typeof Progression!=='undefined')for(const a of Progression.animals){const home=a.pet?[7,5]:BUILDINGS[a.home]?.slot;if(!home||!a.pet&&!S.b[a.home])continue;for(let i=0;i<(S.livestock?.[a.id]||0);i++)want.push({e:({hen:'🐔',cow:'🐄',duck:'🦆',pig:'🐷',goat:'🐐',sheep:'🐑',dog:'🐕',cat:'🐈',crane:'🦢'})[a.id],home:[home[0]+1,home[1]+2.5],r:1.2,sp:.5,k:'owned-'+a.id+i})}
    if(S.b.coop)for(let i=0;i<2+S.b.coop.lv;i++)want.push({e:'🐔',home:[10,10],r:2.2,sp:.7,k:'coop'+i});
    if(S.b.pen)for(let i=0;i<1+Math.ceil(S.b.pen.lv/2);i++)want.push({e:'🐄',home:[12.2,12.4],r:2.4,sp:.45,k:'pen'+i});
    want.push({e:'🐄',home:[4,13.5],r:2,sp:.4,k:'amb1'},{e:'🦆',home:[11.3,3.8],r:1.7,sp:.5,k:'duck1',water:1},{e:'🦆',home:[12.3,3.2],r:1.5,sp:.5,k:'duck2',water:1},{e:'🐕',home:[7,7],r:4,sp:1.2,k:'dog'},{e:'🦋',home:[6,10],r:6,sp:1.6,k:'bf',fly:1});
    for(const [id,e]of [['pigs','🐷'],['ducks','🦆'],['goats','🐐'],['sheep','🐑']])if(S.b[id])for(let i=0;i<Math.min(5,S.b[id].lv+1);i++){const slot=BUILDINGS[id].slot;want.push({e,home:[slot[0]+1,slot[1]+2.5],r:1,sp:.5,k:id+i})}
    want.push({e:'🐈',home:[6.8,3],r:2,sp:.8,k:'cat-ambient'},{e:'🐃',home:[14.8,19],r:1.5,sp:.35,k:'buffalo-ambient'},{e:'🦢',home:[12,2.7],r:1,sp:.45,k:'crane-ambient',water:1});
    if(S.b.bee)for(let i=0;i<3;i++)want.push({e:'🐝',home:[14,9],r:2,sp:1.1,k:'honeybee-'+i,fly:1});
    const keep=new Map(this.animals.map(a=>[a.k,a]));
    this.animals=want.map(w=>keep.get(w.k)||Object.assign(w,{x:w.home[0]+rnd(-1,1),y:w.home[1]+rnd(-1,1),tx:w.home[0],ty:w.home[1],wait:rnd(0,3),face:1}));
  },
  update(dt){
    if(typeof Camera!=='undefined')Camera.update(dt);
    // chuyển cảnh ngày/đêm mượt
    const target=S.night?1:0;this.nf+=(target-this.nf)*Math.min(1,dt*2.2);
    Motion.update(this,dt);
    // hạt
    for(const q of this.parts){q.t+=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=(q.g||0)*dt}
    this.parts=this.parts.filter(q=>q.t<q.life);
    for(const f of this.floats){f.t+=dt}
    this.floats=this.floats.filter(f=>f.t<1.4);
    // thời tiết
    if(S.fx.particles){
      const w=S.fx.weather,rate=w==='rain'?90:w==='petal'?5:w==='leaf'?3:w==='firefly'||this.nf>.5?4:0;
      let n=rate*dt*(S.fx.particleDensity??1);while(Math.random()<n){n--;this.spawnWeather(w==='none'?'firefly':w)}
    }
  },
  spawnWeather(w){
    if(w==='rain')this.parts.push({sx:1,x:rnd(0,this.w+200),y:-10,vx:-120,vy:700,life:1.2,t:0,k:'rain'});
    else if(w==='petal')this.parts.push({sx:1,x:rnd(0,this.w),y:-10,vx:rnd(-30,30),vy:rnd(30,60),life:9,t:0,k:'petal',c:'#ffb7d0',ph:rnd(0,6)});
    else if(w==='leaf')this.parts.push({sx:1,x:rnd(0,this.w),y:-10,vx:rnd(-30,30),vy:rnd(30,60),life:9,t:0,k:'petal',c:'#e4b04a',ph:rnd(0,6)});
    else this.parts.push({sx:1,x:rnd(0,this.w),y:rnd(this.h*.3,this.h),vx:rnd(-12,12),vy:rnd(-10,10),life:rnd(3,6),t:0,k:'fire',ph:rnd(0,6)});
  },
  burst(sx,sy,e='✨',n=8){
    n=Math.max(1,Math.round(n*(S.fx.particleDensity??1)));
    if(!S.fx.particles)n=Math.min(n,3);
    for(let i=0;i<n;i++){const a=rnd(0,6.28),v=rnd(60,200);this.parts.push({sx:1,x:sx,y:sy,vx:Math.cos(a)*v,vy:Math.sin(a)*v-120,g:420,life:rnd(.6,1.1),t:0,k:'emoji',e,s:rnd(16,26)})}
  },
  float(gx,gy,txt,col='#fff'){this.floats.push({gx,gy,txt,col,t:0})},
  /* ===== vẽ ===== */
  draw(){
    if(typeof FS!=='undefined'&&FS)return;
    const c=this.ctx,dpr=this.dpr;c.setTransform(dpr,0,0,dpr,0,0);
    const z=this.cam.z,t=this.t;
    // nền
    const g=c.createLinearGradient(0,0,0,this.h);g.addColorStop(0,'#8fb45a');g.addColorStop(1,'#7aa84a');
    c.fillStyle=g;c.fillRect(0,0,this.w,this.h);
    this.drawGround(c,z,t);
    // vật thể sắp xếp theo độ sâu
    const list=[];
    for(const o of this.objs)list.push({d:o.gx+o.gy,f:()=>this.drawObj(c,o,z,t)});
    for(const o of S.decor||[])if(DECOR_CATALOG[o.id])list.push({d:o.gx+o.gy,f:()=>this.drawObj(c,{gx:o.gx,gy:o.gy,k:DECOR_CATALOG[o.id].art||o.id,s:1,ph:0},z,t)});
    if(typeof Village!=='undefined')for(const o of Village.sceneObjects())list.push({d:o.gx+o.gy,f:()=>this.drawObj(c,o,z,t)});
    for(const k in BUILDINGS){const b=BUILDINGS[k];list.push({d:b.slot[0]+b.slot[1]+2,f:()=>this.drawBuilding(c,k,z,t)})}
    PLOTS_EACH((k,i,j)=>list.push({d:i+j+1,f:()=>this.drawPlot(c,k,i,j,z,t)}));
    for(const a of this.animals)list.push({d:a.x+a.y,f:()=>this.drawAnimal(c,a,z,t)});
    list.push({d:this.player.x+this.player.y,f:()=>this.drawPlayer(c,z,t)});
    list.sort((a,b)=>a.d-b.d);for(const l of list)l.f();
    Motion.drawEffects(c,this);
    this.drawFence(c,z);
    this.drawLabels(c,z,t);
    // nổi
    for(const f of this.floats){const p=this.iso(f.gx,f.gy);c.globalAlpha=1-f.t/1.4;this.text(c,f.txt,p.x,p.y-30*z-f.t*40,20,f.col);c.globalAlpha=1}
    for(const q of this.parts)this.drawPart(c,q,t);
    this.drawLight(c,t);
  },
  text(c,s,x,y,px,fill='#fff',stroke='rgba(40,25,5,.85)'){
    c.font=`800 ${px}px 'Baloo 2',sans-serif`;c.textAlign='center';c.textBaseline='middle';c.lineWidth=px/4;c.strokeStyle=stroke;c.lineJoin='round';c.fillStyle=fill;Art.text(c,s,x,y,undefined,true);
  },
  diamond(c,i,j,w=1,h=1,inset=0){
    const a=this.iso(i+inset,j+inset),b=this.iso(i+w-inset,j+inset),d=this.iso(i+w-inset,j+h-inset),e=this.iso(i+inset,j+h-inset);
    c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.lineTo(d.x,d.y);c.lineTo(e.x,e.y);c.closePath();
  },
  drawGround(c,z,t){
    const margin=220,key=[this.w,this.h,this.dpr,Art.ready].join('|'),origin=this.groundOrigin,ratio=origin?z/origin.z:1,moving=typeof Camera!=='undefined'&&(Camera.dragging||Camera.zoomTarget||Camera.focus||Math.hypot(Camera.velocity.x,Camera.velocity.y)>5);
    const needsRebuild=!origin||this.groundKey!==key||Math.abs(this.cam.x-origin.x*ratio)>margin*.65||Math.abs(this.cam.y-origin.y*ratio)>margin*.65||ratio<.8||ratio>1.2||!moving&&Math.abs(ratio-1)>.001;
    if(needsRebuild){const cv=this.groundCache||(this.groundCache=document.createElement('canvas'));cv.width=Math.round((this.w+margin*2)*this.dpr);cv.height=Math.round((this.h+margin*2)*this.dpr);const cached=cv.getContext('2d');cached.setTransform(this.dpr,0,0,this.dpr,margin*this.dpr,margin*this.dpr);this.groundMargin=margin;this.drawGroundBase(cached,z);this.groundOrigin={x:this.cam.x,y:this.cam.y,z};this.groundKey=key;this.groundRebuilds=(this.groundRebuilds||0)+1}
    const saved=this.groundOrigin,scale=z/saved.z;c.drawImage(this.groundCache,0,0,this.groundCache.width,this.groundCache.height,this.cam.x-(saved.x+margin)*scale,this.cam.y-(saved.y+margin)*scale,(this.w+margin*2)*scale,(this.h+margin*2)*scale);
    this.drawPond(c,z,t);
    if(typeof World!=='undefined')World.drawWater(c,this,z,t);
  },
  drawGroundBase(c,z){
    const margin=this.groundMargin||0,m=this.grid(this.w/2,this.h/2),rad=Math.ceil((Math.max(this.w,this.h)+margin*2)/(TH*z))+3;
    const i0=Math.floor(m.x)-rad,i1=Math.floor(m.x)+rad,j0=Math.floor(m.y)-rad,j1=Math.floor(m.y)+rad;
    for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){
      const p=this.iso(i+.5,j+.5);if(p.x<-TW*z-margin||p.x>this.w+TW*z+margin||p.y<-TH*z-margin||p.y>this.h+TH*z+margin)continue;
      const inWorld=i>=0&&j>=0&&i<N&&j<N;
      const hsh=(i*73856093^j*19349663)>>>0,v=(hsh%100)/100;
      let col;
      const onPath=inWorld&&((typeof Landscape!=='undefined'&&Landscape.path(i,j))||(j===7&&i>=2&&i<=13));
      if(i>=27)col=`hsl(185,43%,${33+v*2}%)`;
      else if(i>=25&&i<N&&j>=0&&j<N)col=`hsl(38,31%,${66+v*2}%)`;
      else if(onPath)col=`hsl(39,18%,${46+v*2}%)`;
      else if(inWorld)col=`hsl(${79+v*3},${24+v*3}%,${41+v*2}%)`;
      else col=`hsl(${85+v*3},${21+v*3}%,${32+v*2}%)`;
      this.diamond(c,i,j);c.fillStyle=col;c.fill();
      if(i<25){if(onPath)Art.tile(c,'village-cobblestone',p.x,p.y,TW*z+.5,TH*z+.5);else Scenery.ground(c,i,j,p,z)}
    }
    if(typeof World!=='undefined')World.drawMountains(c,this,z);
  },
  drawPond(c,z,t){
    const cx=11.5,cy=3.6,pts=[],M=40;
    for(let k=0;k<M;k++){const a=k/M*6.283,r=1+.09*Math.sin(a*3+1)+.06*Math.cos(a*5);pts.push(this.iso(cx+Math.cos(a)*3.2*r,cy+Math.sin(a)*2.5*r))}
    const path=(s)=>{c.beginPath();pts.forEach((p,k)=>{const x=this.iso(cx,cy);const px=x.x+(p.x-x.x)*s,py=x.y+(p.y-x.y)*s;k?c.lineTo(px,py):c.moveTo(px,py)});c.closePath()};
    path(1.1);c.fillStyle='#e8d8a8';c.fill();
    path(1);const ctr=this.iso(cx,cy);const g=c.createRadialGradient(ctr.x,ctr.y,10*z,ctr.x,ctr.y,150*z);g.addColorStop(0,'#1f6a78');g.addColorStop(1,'#3b9aa0');c.fillStyle=g;c.fill();
    const lake=typeof Scenery!=='undefined'&&Scenery.images['fishing-lake'];
    if(lake){c.save();path(1);c.clip();c.globalAlpha=.62;const top=this.iso(cx-3.3,cy-2.6),bottom=this.iso(cx+3.3,cy+2.6),width=6.2*TW*z; c.drawImage(lake,0,lake.height*.3,lake.width*.65,lake.height*.5,ctr.x-width/2,top.y,width,bottom.y-top.y);c.restore();for(let k=0;k<16;k++){const p=pts[Math.floor(k*M/16)];Art.draw(c,'village-rocks',p.x,p.y+7*z,(23+k%3*6)*z,(17+k%3*4)*z,1)}}
    c.save();path(1);c.clip();
    c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=1.5*z;
    for(let k=0;k<5;k++){const r=((t*.25+k/5)%1);c.globalAlpha=1-r;c.beginPath();c.ellipse(ctr.x+Math.sin(k*5)*40*z,ctr.y+Math.cos(k*3)*14*z,r*50*z,r*25*z,0,0,6.283);c.stroke()}
    c.globalAlpha=1;
    // lá sen & hoa
    if(Art.has('lotus')){[[10.2,3.4],[11.6,4.6],[12.8,3.2],[11,2.6],[12.2,4.3]].forEach(([x,y],k)=>{const p=this.iso(x,y+Math.sin(t+k)*.03);Art.draw(c,k%2?'lily':'lotus',p.x,p.y,34*z,25*z)});c.restore();return}
    [[10.2,3.4],[11.6,4.6],[12.8,3.2],[11,2.6],[12.2,4.3]].forEach(([x,y],k)=>{const p=this.iso(x,y+Math.sin(t+k)*.03);c.fillStyle='#4aa05a';c.beginPath();c.ellipse(p.x,p.y,15*z,7*z,0,0,6.283);c.fill();if(k%2===0){c.fillStyle='#f48fb1';c.beginPath();c.arc(p.x,p.y-4*z,5*z,0,6.283);c.fill()}});
    c.restore();
  },
  drawFence(c,z){
    if(typeof Landscape!=='undefined'&&Landscape.walls(c,z))return;
    c.strokeStyle='#8a5a2b';c.fillStyle='#a8743a';
    const seg=(x0,y0,x1,y1)=>{
      const a=this.iso(x0,y0),b=this.iso(x1,y1),n=Math.round(Math.hypot(x1-x0,y1-y0)*2);
      c.lineWidth=2*z;c.beginPath();c.moveTo(a.x,a.y-12*z);c.lineTo(b.x,b.y-12*z);c.moveTo(a.x,a.y-6*z);c.lineTo(b.x,b.y-6*z);c.stroke();
      for(let k=0;k<=n;k++){const p=this.iso(lerp(x0,x1,k/n),lerp(y0,y1,k/n));c.fillRect(p.x-1.5*z,p.y-16*z,3*z,16*z)}
    };
    const x0=PX0-.6,x1=PX0+PCOLS+.6,y0=PY0-.6,y1=PY0+Math.min(PROWS,5)+.6;
    seg(x0,y1,x1,y1);seg(x1,y0,x1,y1);seg(x0,y0,x0,y1);
  },
  drawLabels(c,z,t){
    this.regionHits=[];for(const r of World.regions.filter(r=>r.id!=='farm')){const p=this.iso(r.x,r.y),offset=r.id==='coast'?94:r.id==='orchard'?135:160,x=p.x,y=p.y-offset*z,title=r.n+(r.id==='coast'?' · Câu cá':'');c.font="800 12px 'Segoe UI',sans-serif";const w=c.measureText(title).width+24;if(x>-w&&x<this.w+w&&y>0&&y<this.h){this.label(c,title,x,y,12,true);this.regionHits.push({id:r.id,x:x-w/2,y:y-13,w,h:26})}}
    // nhãn mở đất
    const k=S.plotsOpen;if(k<PCOLS*PROWS){const[i,j]=plotXY(k),p=this.iso(i+.5,j+.5);this.label(c,`🔒 Mở đất · Cấp ${plotReqLv(k)}`,p.x,p.y-8*z,Math.max(11,13*z),S.lv>=plotReqLv(k))}
    for(const id in BUILDINGS){const b=BUILDINGS[id];if(S.b[id]||b.lv>S.lv+5)continue;const p=this.iso(b.slot[0]+1,b.slot[1]+1);this.label(c,S.lv>=b.lv?`🔨 Xây ${b.n}`:`🔒 ${b.n} · Cấp ${b.lv}`,p.x,p.y-6*z,Math.max(11,13*z),S.lv>=b.lv)}
    // đợi thu hoạch
    PLOTS_EACH((k,i,j)=>{const pl=S.plots[k];if(k>=S.plotsOpen||!pl.crop)return;const pr=cropProg(pl);const p=this.iso(i+.5,j+.5);
      if(pr>=1){const by=p.y-34*z-Math.abs(Math.sin(t*3+k))*6*z;c.fillStyle='rgba(255,246,200,.95)';c.strokeStyle='#d6a23a';c.lineWidth=2*z;c.beginPath();c.arc(p.x,by,16*z,0,6.283);c.fill();c.stroke();c.font=`${20*z}px serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle='#000';Art.text(c,CROPS[pl.crop].e,p.x,by+1*z)}
      else {const w=46*z;c.fillStyle='rgba(0,0,0,.5)';c.fillRect(p.x-w/2,p.y-30*z,w,5*z);c.fillStyle='#a2bb79';c.fillRect(p.x-w/2,p.y-30*z,w*pr,5*z);this.text(c,fmtT(Math.max(0,cropDur(pl)-(Date.now()-pl.t0))),p.x,p.y-39*z,Math.max(9,10*z),'#fff6d7')}
    });
    for(const id in S.b){const b=S.b[id],d=BUILDINGS[id],p=this.iso(d.slot[0]+1,d.slot[1]+1);
      const by=p.y-86*z;
      if(b.ready){const y=by-Math.abs(Math.sin(t*3))*6*z;c.fillStyle='rgba(255,246,200,.95)';c.strokeStyle='#d6a23a';c.lineWidth=2*z;c.beginPath();c.arc(p.x,y,17*z,0,6.283);c.fill();c.stroke();c.font=`${21*z}px serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle='#000';Art.text(c,ITEMS[d.out].e,p.x,y+1*z)}
      else if(b.t0){const pr=clamp((Date.now()-b.t0)/bTime(id),0,1),w=60*z;c.fillStyle='rgba(0,0,0,.55)';c.fillRect(p.x-w/2,by,w,7*z);c.fillStyle='#ffd45e';c.fillRect(p.x-w/2,by,w*pr,7*z)}
      this.text(c,'Lv'+b.lv,p.x,p.y+22*z,Math.max(10,12*z),'#ffe27a');
    }
  },
  label(c,s,x,y,px,ok){
    c.font=`800 ${px}px 'Baloo 2',sans-serif`;const w=c.measureText(s).width+px*1.2,h=px*1.7;
    c.fillStyle=ok?'rgba(60,110,40,.82)':'rgba(255,255,255,.88)';c.beginPath();c.roundRect(x-w/2,y-h/2,w,h,h/2);c.fill();
    c.fillStyle=ok?'#fff':'#6a4a2a';c.textAlign='center';c.textBaseline='middle';Art.text(c,s,x,y+1);
  },
  shadow(c,x,y,rx,ry){if(!S.fx.shadow)return;c.fillStyle='rgba(30,40,10,.28)';c.beginPath();c.ellipse(x,y,rx,ry,0,0,6.283);c.fill()},
  drawObj(c,o,z,t){
    const p=this.iso(o.gx,o.gy),s=o.s*z,sw=Math.sin(t*1.4+o.ph)*2*z;
    if(p.x<-180*z||p.x>this.w+180*z||p.y<-40*z||p.y>this.h+180*z)return;
    if(o.k==='village-stone-bridge'){const a=this.iso(o.gx-1.35,o.gy),b=this.iso(o.gx+1.35,o.gy),span=Math.hypot(b.x-a.x,b.y-a.y);c.save();c.translate(p.x,p.y);c.rotate(Math.atan2(b.y-a.y,b.x-a.x));Art.draw(c,o.k,0,-span*.04,span*1.28,span*.84,.72);c.restore();return}
    const sizes=this.objectSizes={'village-teahouse':[245,215],'village-dyehouse':[220,190],'village-wheel':[145,150],'village-stone-bridge':[130,80],'village-spring':[190,150],'village-maple':[110,140],'village-pine':[110,150],'village-bamboo':[110,170],'village-stairs':[100,60],'village-rocks':[56,48],'village-stone-lantern':[35,70],'village-pipeline':[160,85],tree:[78,102],palm:[92,122],bamboo:[76,112],bush:[45,40],flower:[32,28],rock:[34,26],silo:[64,94],sign:[54,68],well:[70,78],scarecrow:[48,72],hay:[43,32],farmhouse:[160,140],truck:[80,65],tractor:[70,64],'shop-stall':[100,90],boat:[74,48],greenhouse:[106,90],gate:[56,62],bridge:[85,46],'peach-tree':[78,104],cat:[30,35],buffalo:[54,46]};
    if(Art.has(o.k)){const meta=DECOR_CATALOG[o.k],[w,h]=meta?[meta.w,meta.h]:sizes[o.k]||[60,70];this.shadow(c,p.x,p.y+2*s,w*.3*s,7*s);if(Motion.isFoliage(o.k))Motion.foliage(c,o.k,p.x,p.y+3*s,w*s,h*s,t,o.ph+o.gx*.7+o.gy*.4);else Art.draw(c,o.k,p.x,p.y+3*s+(['truck','tractor','boat'].includes(o.k)?Math.sin(t*(o.k==='boat'?1.8:11))*.35*s:0),w*s,h*s,1);return}
    switch(o.k){
      case'tree':this.shadow(c,p.x+8*s,p.y+2*s,26*s,10*s);c.fillStyle='#6b4423';c.fillRect(p.x-4*s,p.y-30*s,8*s,32*s);
        for(const[dx,dy,r,col]of[[-14,-42,17,'#2f7d3a'],[12,-44,16,'#2c7436'],[0,-58,20,'#3b9347'],[0,-40,18,'#348a40']]){c.fillStyle=col;c.beginPath();c.arc(p.x+dx*s+sw,p.y+dy*s,r*s,0,6.283);c.fill()}
        c.fillStyle='rgba(255,255,255,.12)';c.beginPath();c.arc(p.x-6*s+sw,p.y-64*s,9*s,0,6.283);c.fill();break;
      case'palm':this.shadow(c,p.x+10*s,p.y+2*s,22*s,8*s);c.strokeStyle='#8a6a3a';c.lineWidth=6*s;c.beginPath();c.moveTo(p.x,p.y);c.quadraticCurveTo(p.x+10*s,p.y-40*s,p.x+sw*2,p.y-70*s);c.stroke();
        c.strokeStyle='#3c9a48';c.lineWidth=5*s;for(let k=0;k<6;k++){const a=k/6*6.283;c.beginPath();c.moveTo(p.x+sw*2,p.y-70*s);c.quadraticCurveTo(p.x+Math.cos(a)*22*s,p.y-86*s+Math.sin(a)*6*s,p.x+Math.cos(a)*38*s+sw*2,p.y-62*s+Math.sin(a)*14*s);c.stroke()}break;
      case'bamboo':for(let k=0;k<4;k++){const bx=p.x+(k-1.5)*7*s,h=(60+k*9%24)*s;c.strokeStyle=k%2?'#6aa03a':'#80b84a';c.lineWidth=4*s;c.beginPath();c.moveTo(bx,p.y);c.lineTo(bx+sw*(h/60),p.y-h);c.stroke();c.fillStyle='#5f9a35';for(let m=1;m<4;m++){c.beginPath();c.ellipse(bx+sw*m/4+5*s,p.y-h*m/4,9*s,2.5*s,-.4,0,6.283);c.fill()}}break;
      case'bush':this.shadow(c,p.x,p.y+2*s,18*s,6*s);c.fillStyle='#3a8a42';c.beginPath();c.arc(p.x-6*s,p.y-8*s,10*s,0,6.283);c.arc(p.x+7*s,p.y-9*s,11*s,0,6.283);c.arc(p.x,p.y-14*s,10*s,0,6.283);c.fill();c.fillStyle='#e2403a';for(const[a,b]of[[-6,-10],[6,-14],[2,-6]]){c.beginPath();c.arc(p.x+a*s,p.y+b*s,2.6*s,0,6.283);c.fill()}break;
      case'flower':for(let k=0;k<3;k++){const fx=p.x+(k-1)*8*s,fy=p.y-k%2*3*s;c.strokeStyle='#3a8a42';c.lineWidth=2*s;c.beginPath();c.moveTo(fx,fy);c.lineTo(fx+sw*.3,fy-10*s);c.stroke();c.fillStyle=['#ff8fb0','#ffd45e','#fff'][k];c.beginPath();c.arc(fx+sw*.3,fy-11*s,3.6*s,0,6.283);c.fill()}break;
      case'rock':this.shadow(c,p.x,p.y+2*s,14*s,5*s);c.fillStyle='#9a9a8a';c.beginPath();c.ellipse(p.x,p.y-5*s,12*s,8*s,0,0,6.283);c.fill();c.fillStyle='rgba(255,255,255,.2)';c.beginPath();c.ellipse(p.x-3*s,p.y-8*s,6*s,3*s,0,0,6.283);c.fill();break;
      case'silo':this.shadow(c,p.x,p.y,30*s,11*s);c.fillStyle='#9a6b3a';c.fillRect(p.x-18*s,p.y-48*s,36*s,50*s);c.fillStyle='#b88650';c.fillRect(p.x-18*s,p.y-48*s,14*s,50*s);c.strokeStyle='#6b4423';c.lineWidth=2*s;for(let k=1;k<5;k++){c.beginPath();c.moveTo(p.x-18*s,p.y-48*s+k*10*s);c.lineTo(p.x+18*s,p.y-48*s+k*10*s);c.stroke()}
        c.fillStyle='#c0392b';c.beginPath();c.moveTo(p.x-24*s,p.y-48*s);c.lineTo(p.x,p.y-76*s);c.lineTo(p.x+24*s,p.y-48*s);c.closePath();c.fill();break;
      case'sign':c.fillStyle='#6b4423';c.fillRect(p.x-3*s,p.y-30*s,6*s,32*s);c.fillStyle='#8a5a2b';c.beginPath();c.roundRect(p.x-26*s,p.y-52*s,52*s,26*s,5*s);c.fill();c.strokeStyle='#5f3b17';c.lineWidth=2*s;c.stroke();c.font=`${18*s}px serif`;c.textAlign='center';c.textBaseline='middle';Art.text(c,'🎣',p.x,p.y-39*s);break;
      case'well':this.shadow(c,p.x,p.y,24*s,9*s);c.fillStyle='#9a9a90';c.beginPath();c.ellipse(p.x,p.y-8*s,18*s,9*s,0,0,6.283);c.fill();c.fillStyle='#4a7a8a';c.beginPath();c.ellipse(p.x,p.y-10*s,13*s,6*s,0,0,6.283);c.fill();c.fillStyle='#8a5a2b';c.fillRect(p.x-17*s,p.y-44*s,3*s,34*s);c.fillRect(p.x+14*s,p.y-44*s,3*s,34*s);c.fillStyle='#c0392b';c.beginPath();c.moveTo(p.x-24*s,p.y-42*s);c.lineTo(p.x,p.y-58*s);c.lineTo(p.x+24*s,p.y-42*s);c.closePath();c.fill();break;
      case'scarecrow':c.fillStyle='#8a5a2b';c.fillRect(p.x-2*s,p.y-40*s,4*s,42*s);c.fillRect(p.x-18*s,p.y-32*s,36*s,4*s);c.fillStyle='#e8c25a';c.beginPath();c.arc(p.x,p.y-44*s,8*s,0,6.283);c.fill();c.fillStyle='#4a6a8a';c.fillRect(p.x-8*s,p.y-36*s,16*s,18*s);c.fillStyle='#c9a24a';c.beginPath();c.moveTo(p.x-14*s,p.y-48*s);c.lineTo(p.x,p.y-62*s);c.lineTo(p.x+14*s,p.y-48*s);c.closePath();c.fill();break;
      case'hay':this.shadow(c,p.x,p.y,20*s,7*s);c.fillStyle='#e0b84a';c.beginPath();c.ellipse(p.x,p.y-12*s,18*s,14*s,0,0,6.283);c.fill();c.fillStyle='#c99a30';c.beginPath();c.ellipse(p.x+4*s,p.y-8*s,10*s,6*s,0,0,6.283);c.fill();break;
    }
  },
  drawBuilding(c,id,z,t){
    const d=BUILDINGS[id],[i,j]=d.slot,b=S.b[id];
    if(b&&Art.has(d.art||id)){const p=this.iso(i+1,j+1),scale=1+Math.min(b.lv-1,4)*.035;this.shadow(c,p.x,p.y+16*z,64*z,20*z);Art.draw(c,d.art||id,p.x,p.y+24*z,178*z*scale,144*z*scale,1);if(b.t0&&!b.ready){const phase=(t*.6)%1;c.save();c.globalAlpha=(1-phase)*.6;Art.draw(c,'smoke',p.x+18*z,p.y-100*z-phase*25*z,24*z,30*z);c.restore()}return}
    if(!b){this.diamond(c,i,j,2,2,.1);c.fillStyle='rgba(120,90,50,.55)';c.fill();return}
    const A=this.iso(i,j),B=this.iso(i+2,j),C=this.iso(i+2,j+2),D=this.iso(i,j+2),H=(26+b.lv*3)*z;
    this.diamond(c,i-.2,j-.2,2.4,2.4);c.fillStyle='rgba(150,120,70,.6)';c.fill();
    const up=(p,h)=>({x:p.x,y:p.y-h});
    // tường trái (D-C) & phải (C-B)
    c.fillStyle=d.col[1];c.beginPath();c.moveTo(D.x,D.y);c.lineTo(C.x,C.y);c.lineTo(C.x,C.y-H);c.lineTo(D.x,D.y-H);c.closePath();c.fill();
    c.fillStyle=d.col[0];c.beginPath();c.moveTo(C.x,C.y);c.lineTo(B.x,B.y);c.lineTo(B.x,B.y-H);c.lineTo(C.x,C.y-H);c.closePath();c.fill();
    // mái chóp
    const peak={x:(A.x+C.x)/2,y:(A.y+C.y)/2-H-34*z};
    const pts=[up(D,H),up(C,H),up(B,H),up(A,H)];
    c.fillStyle=d.col[2];c.beginPath();c.moveTo(pts[0].x,pts[0].y);c.lineTo(pts[1].x,pts[1].y);c.lineTo(peak.x,peak.y);c.closePath();c.fill();
    c.fillStyle='rgba(0,0,0,.18)';c.fill();
    c.fillStyle=d.col[2];c.beginPath();c.moveTo(pts[1].x,pts[1].y);c.lineTo(pts[2].x,pts[2].y);c.lineTo(peak.x,peak.y);c.closePath();c.fill();
    c.fillStyle='rgba(255,255,255,.12)';c.beginPath();c.moveTo(pts[3].x,pts[3].y);c.lineTo(pts[2].x,pts[2].y);c.lineTo(peak.x,peak.y);c.closePath();c.fill();
    c.fillStyle='rgba(0,0,0,.08)';c.beginPath();c.moveTo(pts[3].x,pts[3].y);c.lineTo(pts[0].x,pts[0].y);c.lineTo(peak.x,peak.y);c.closePath();c.fill();
    // cửa
    const door=this.iso(i+1.5,j+2);c.fillStyle='#4a2a14';c.beginPath();c.roundRect(door.x-7*z,door.y-22*z,14*z,22*z,[7*z,7*z,0,0]);c.fill();
    c.font=`${26*z}px serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle='#000';Art.text(c,d.e,(C.x+B.x)/2,(C.y+B.y)/2-H*.5);
    if(b.t0&&!b.ready){c.save();c.translate(peak.x+14*z,peak.y-8*z);c.fillStyle='rgba(220,220,220,.7)';for(let k=0;k<3;k++){const r=((t*.5+k/3)%1);c.globalAlpha=1-r;c.beginPath();c.arc(Math.sin(t*2+k)*4*z,-r*30*z,(4+r*6)*z,0,6.283);c.fill()}c.restore();c.globalAlpha=1}
  },
  drawPlot(c,k,i,j,z,t){
    if(k>=S.plotsOpen){const p=this.iso(i+.5,j+.5);if(!Art.draw(c,'plot-locked',p.x,p.y,92*z,64*z,.7)){this.diamond(c,i,j,1,1,.08);c.fillStyle='rgba(60,90,30,.28)';c.fill()}return}
    const pl=S.plots[k];
    const ground=this.iso(i+.5,j+.5);Art.draw(c,pl.lv>2?'plot-rich':pl.crop?'plot-watered':'plot-empty',ground.x,ground.y+2*z,92*z,46*z);
    this.diamond(c,i,j,1,1,.04);c.fillStyle=pl.crop?'#6b4325':'#7a4f2c';c.fill();
    Art.draw(c,pl.lv>2?'plot-rich':pl.crop?'plot-watered':'plot-empty',ground.x,ground.y,89*z,44*z);
    this.diamond(c,i,j,1,1,.04);c.strokeStyle='#4a2c14';c.lineWidth=1.5*z;c.stroke();
    c.strokeStyle='rgba(40,20,5,.35)';c.lineWidth=1.6*z;
    for(let m=1;m<4;m++){const a=this.iso(i+m/4,j+.08),b=this.iso(i+m/4,j+.92);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke()}
    if(this.sel===k){this.diamond(c,i,j,1,1,0);c.strokeStyle='#fff7b0';c.lineWidth=3*z;c.stroke()}
    if(pl.lv>1){const p=this.iso(i+.5,j+.95);c.font=`800 ${10*z}px 'Baloo 2'`;c.textAlign='center';c.fillStyle='#ffe27a';Art.text(c,'★'.repeat(Math.min(pl.lv,5)),p.x,p.y)}
    if(!pl.crop)return;
    const pr=cropProg(pl),C=CROPS[pl.crop],p=this.iso(i+.5,j+.5),sw=Math.sin(t*2+k)*1.5*z;
    const {stage,sprite}=this.cropVisual(pl);
    if(Art.has(sprite)){for(const [dx,dy]of [[-17,-3],[16,-3],[0,10]]){if(Motion.isFoliage(sprite))Motion.foliage(c,sprite,p.x+dx*z,p.y+dy*z+6*z,(stage===2?36:28)*z,(stage===2?42:30)*z,t,k*.7);else Art.draw(c,sprite,p.x+dx*z,p.y+dy*z+6*z,(stage===2?36:28)*z,(stage===2?42:30)*z,1)}return}
    if(pr<.15){c.fillStyle='#3a2410';c.beginPath();c.arc(p.x,p.y,3*z,0,6.283);c.fill();for(let m=-1;m<=1;m++){c.beginPath();c.arc(p.x+m*10*z,p.y+m*2*z,2*z,0,6.283);c.fill()}return}
    const sz=(pr<.55?14:pr<1?22:30)*z;
    c.font=`${sz}px serif`;c.textAlign='center';c.textBaseline='alphabetic';
    const spots=pr>=1?[[-13,3],[13,3],[0,-5],[0,10]]:[[-12,3],[12,3],[0,8]];
    for(const[dx,dy]of spots){if(pr<.55){Art.text(c,'🌱',p.x+dx*z*.8+sw,p.y+dy*z+4*z)}else Art.text(c,pr<1?'🌿':C.e,p.x+dx*z*.9+sw,p.y+dy*z+6*z)}
  },
  drawAnimal(c,a,z,t){
    const p=this.iso(a.x,a.y),bob=a.fly?Math.sin(t*9+a.x)*8*z-22*z:Math.abs(Math.sin(t*5+a.x*3))*(Math.hypot(a.tx-a.x,a.ty-a.y)>.06?4:0.6)*z;
    if(!a.water)this.shadow(c,p.x,p.y,10*z,4*z);
    if(Motion.animal(c,a,z,t,this))return;
    const sprite=Art.emoji.get(a.e);if(sprite&&Art.has(sprite)){const sz=(a.e==='🐄'?46:a.fly?24:34)*z;Art.draw(c,sprite,p.x,p.y-bob,sz,sz,1,a.face>0);return}
    c.save();c.translate(p.x,p.y-bob);c.scale(a.face*-1,1);c.font=`${(a.e==='🐄'?34:24)*z}px serif`;c.textAlign='center';c.textBaseline='alphabetic';Art.text(c,a.e,0,0);c.restore();
  },
  drawPlayer(c,z,t){
    const P=this.player,p=this.iso(P.x,P.y);
    this.shadow(c,p.x,p.y,13*z,5*z);
    const bob=P.walk?Math.sin((P.phase||0)*Math.PI*4)*.45*z:0;
    drawAvatar(c,p.x,p.y-bob,54*z*(S.fx.avatarScale||1.25),S.av,{walk:P.walk,t,face:P.face,turn:P.turn,phase:P.phase,back:P.back,work:P.work>0,actionTime:P.workClock});
  },
  drawPart(c,q,t){
    const a=1-q.t/q.life;
    const sprites={rain:'raindrop',petal:q.c==='#e4b04a'?'leaf':'petal',fire:'firefly'};
    if(sprites[q.k]&&Art.has(sprites[q.k])){c.save();c.globalAlpha=Math.min(1,a*3);const size=q.k==='rain'?12:q.k==='fire'?8:14;Art.draw(c,sprites[q.k],q.x+(q.k==='petal'?Math.sin(q.t*2+q.ph)*14:0),q.y,size,size);c.restore();return}
    if(q.k==='rain'){c.strokeStyle=`rgba(200,225,255,${.5*a})`;c.lineWidth=1.3;c.beginPath();c.moveTo(q.x,q.y);c.lineTo(q.x+q.vx*.03,q.y+q.vy*.03);c.stroke()}
    else if(q.k==='petal'){c.fillStyle=q.c;c.globalAlpha=Math.min(1,a*3);c.beginPath();c.ellipse(q.x+Math.sin(q.t*2+q.ph)*14,q.y,4,2.4,q.t*2,0,6.283);c.fill();c.globalAlpha=1}
    else if(q.k==='fire'){const g=Math.sin(q.t/q.life*3.14)*(.3+this.nf*.7);c.fillStyle=`rgba(255,240,140,${g})`;c.shadowColor='#ffe45a';c.shadowBlur=10;c.beginPath();c.arc(q.x+Math.sin(q.t+q.ph)*8,q.y,2.4,0,6.283);c.fill();c.shadowBlur=0}
    else if(q.k==='emoji'){c.globalAlpha=Math.min(1,a*2);if(Art.has(q.e))Art.draw(c,q.e,q.x,q.y,q.s,q.s);else{c.font=`${q.s}px serif`;c.textAlign='center';Art.text(c,q.e,q.x,q.y)}c.globalAlpha=1}
  },
  drawLight(c,t){
    const n=this.nf;
    if(n>.01){c.fillStyle=`rgba(14,24,70,${.5*n})`;c.fillRect(0,0,this.w,this.h);
      // ánh đèn ấm quanh các nhà
      for(const id in S.b){const d=BUILDINGS[id],p=this.iso(d.slot[0]+1,d.slot[1]+1),g=c.createRadialGradient(p.x,p.y-20*this.cam.z,2,p.x,p.y-20*this.cam.z,90*this.cam.z);g.addColorStop(0,`rgba(255,200,100,${.5*n})`);g.addColorStop(1,'rgba(255,200,100,0)');c.fillStyle=g;c.fillRect(p.x-100*this.cam.z,p.y-120*this.cam.z,200*this.cam.z,200*this.cam.z)}}
    else{ // nắng sớm nhẹ
      const g=c.createLinearGradient(0,0,this.w,this.h);g.addColorStop(0,'rgba(255,240,180,.16)');g.addColorStop(.6,'rgba(255,240,180,0)');c.fillStyle=g;c.fillRect(0,0,this.w,this.h)}
    // bóng mây trôi
    if(S.fx.shadow&&n<.5){c.fillStyle=`rgba(20,40,10,${.07*(1-n*2)})`;for(let k=0;k<3;k++){const x=((t*14+k*420)%(this.w+500))-250;c.beginPath();c.ellipse(x,this.h*(.25+k*.25),200,80,0,0,6.283);c.fill()}}
    // vignette
    const v=c.createRadialGradient(this.w/2,this.h/2,this.h*.35,this.w/2,this.h/2,this.h*.85);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(10,20,0,.35)');c.fillStyle=v;c.fillRect(0,0,this.w,this.h);
    if(S.fx.weather==='rain'){c.fillStyle='rgba(40,60,90,.18)';c.fillRect(0,0,this.w,this.h)}
  }
};
function plotXY(k){return[PX0+k%PCOLS,k<30?PY0+Math.floor(k/PCOLS):23+Math.floor((k-30)/PCOLS)]}
function PLOTS_EACH(fn){for(let k=0;k<PCOLS*PROWS;k++){const[i,j]=plotXY(k);fn(k,i,j)}}

/* avatar vẽ bằng canvas (dùng trong cảnh, HUD và bộ chỉnh sửa) */
function drawAvatar(c,x,y,h,av,o={}){
  if(Motion.avatar(c,x,y,h,av,o))return;
  if(av.art!==false){const variant=Number.isInteger(av.style)?av.style:Math.max(0,OUTFITS.indexOf(av.outfit)),pose=o.work?'work':o.walk?(Math.sin((o.t||0)*10)>0?'walk-a':'walk-b'):'idle',id=`farmer-${variant}-${pose}`;if(Art.has(id)){Art.draw(c,id,x,y,h*.82,h*1.16,1,(o.face||1)>0);return}}

  const s=h/54,f=o.face||1,w=o.walk?Math.sin((o.t||0)*10)*3:0,work=o.work?Math.sin((o.t||0)*14)*5:0;
  c.save();c.translate(x,y);c.scale(s*f,s);
  // chân
  c.fillStyle='#5a3a22';c.fillRect(-7,-12,5,12+w*.3);c.fillRect(2,-12,5,12-w*.3);
  // thân
  c.fillStyle=av.outfit;c.beginPath();c.roundRect(-10,-34,20,24,6);c.fill();
  c.fillStyle='rgba(255,255,255,.2)';c.fillRect(-10,-34,6,24);
  // tay
  c.fillStyle=av.skin;c.beginPath();c.arc(-12,-22+w*.4,3.5,0,6.283);c.arc(12,-24+work,3.5,0,6.283);c.fill();
  // đầu
  c.fillStyle=av.hair;c.beginPath();c.arc(0,-43,12.5,3.14,0);c.fill();c.beginPath();c.arc(0,-41,12,0,6.283);c.fill();
  c.fillStyle=av.skin;c.beginPath();c.arc(0,-40,11,0,6.283);c.fill();
  c.fillStyle='#2a1a10';c.beginPath();c.arc(-4,-40,1.7,0,6.283);c.arc(4,-40,1.7,0,6.283);c.fill();
  c.fillStyle='rgba(240,120,120,.5)';c.beginPath();c.arc(-7,-37,2.4,0,6.283);c.arc(7,-37,2.4,0,6.283);c.fill();
  c.strokeStyle='#8a3a2a';c.lineWidth=1.2;c.beginPath();c.arc(0,-37,3,.2,2.9);c.stroke();
  // mũ
  if(av.hat==='non'){c.fillStyle='#e9d089';c.beginPath();c.moveTo(-20,-46);c.lineTo(0,-64);c.lineTo(20,-46);c.quadraticCurveTo(0,-41,-20,-46);c.fill();c.strokeStyle='#b99a4a';c.lineWidth=1;c.beginPath();c.moveTo(0,-64);c.lineTo(-9,-44);c.moveTo(0,-64);c.lineTo(9,-44);c.stroke();c.strokeStyle='#d6455a';c.lineWidth=2;c.beginPath();c.moveTo(-9,-43);c.lineTo(-8,-34);c.moveTo(9,-43);c.lineTo(8,-34);c.stroke()}
  else if(av.hat==='rom'){c.fillStyle='#d9b25a';c.beginPath();c.ellipse(0,-48,19,5,0,0,6.283);c.fill();c.beginPath();c.roundRect(-10,-60,20,14,6);c.fill();c.fillStyle='#b9342a';c.fillRect(-10,-50,20,3)}
  else if(av.hat==='khan'){c.fillStyle='#5a4a3a';c.beginPath();c.arc(0,-45,12.5,3.14,0);c.fill();c.fillRect(-12.5,-47,25,4)}
  c.restore();
}
function hidePop(){const p=$('#layer-pop');if(p)p.innerHTML='';Scene.sel=null}
