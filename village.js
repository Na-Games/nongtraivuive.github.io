'use strict';
/* Persistent village projects and crafts. Timers are timestamps, so no background
   interval is needed for production and unfinished rewards survive reloading. */
const Village={
  tab:0,ticker:0,
  projects:[
    {id:'waterwheel',n:'Guồng nước làng',art:'village-wheel',lv:2,cost:{c:250,i:{lua:6,ngo:2}},seconds:25,reward:{xp:35},desc:'Khôi phục guồng nước bên suối. Mở xay bột và giảm 20% thời gian các mẻ thủ công.',gx:22,gy:7},
    {id:'dyehouse',n:'Xưởng vải chàm',art:'village-dyehouse',lv:5,cost:{c:600,i:{bot:4,dau:4}},seconds:45,reward:{xp:70},desc:'Dựng giàn phơi và mở đơn hàng vải chàm, sử dụng len từ nông trại.',gx:22,gy:11},
    {id:'hotspring',n:'Suối khoáng làng',art:'village-spring',lv:6,cost:{c:900,i:{bot:4,sua:2}},seconds:60,reward:{xp:90},desc:'Sửa lối đá bên suối. Mở pha trà mật ong và quà thư giãn mỗi ngày.',gx:22,gy:16},
  ],
  recipes:[
    {id:'flour',n:'Xay bột bằng guồng nước',project:'waterwheel',art:'bot',cost:{i:{lua:3}},seconds:45,reward:{i:{bot:2},xp:8},product:'2 bột gạo'},
    {id:'indigo',n:'Đơn hàng vải chàm',project:'dyehouse',art:'len',cost:{i:{len:2,dau:1}},seconds:90,reward:{c:260,xp:30},product:'Giao vải · 260 xu + 30 XP'},
    {id:'honeytea',n:'Pha trà mật ong',project:'hotspring',art:'tra',cost:{i:{che:2,mat:1}},seconds:100,reward:{i:{tra:2},xp:20},product:'2 trà khô + 20 XP'},
  ],
  objectives:[
    {id:'harvest',n:'Thu hoạch 12 nông sản',key:'harvest',goal:12,reward:{c:90,xp:15}},
    {id:'deliver',n:'Giao 2 đơn hàng',key:'deliver',goal:2,reward:{c:120,xp:20}},
    {id:'fish',n:'Câu 3 con cá',key:'fish',goal:3,reward:{c:100,xp:15}},
    {id:'craft',n:'Nhận 2 mẻ thủ công',key:'craft',goal:2,reward:{c:110,xp:20}},
  ],
  dayKey(now=Date.now()){return new Date(now+7*3600000).toISOString().slice(0,10)},
  counters(){return {...(S.qp||{}),craft:S.village?.crafted||0}},
  ensure(now=Date.now()){
    if(!S.village||typeof S.village!=='object'||Array.isArray(S.village))S.village={};
    const v=S.village;
    for(const key of ['projects','jobs'])if(!v[key]||typeof v[key]!=='object'||Array.isArray(v[key]))v[key]={};
    v.crafted=Number.isFinite(v.crafted)?Math.max(0,Math.floor(v.crafted)):0;
    for(const project of this.projects){const p=v.projects[project.id];if(!p||typeof p!=='object')continue;if(p.builtAt){v.projects[project.id]={builtAt:Number(p.builtAt)||now};continue}if(!Number.isFinite(p.readyAt)||!Number.isFinite(p.startedAt)||p.readyAt<p.startedAt)delete v.projects[project.id]}
    for(const [id,j]of Object.entries(v.jobs))if(!this.recipes.some(r=>r.id===id)||!j||!Number.isFinite(j.startedAt)||!Number.isFinite(j.readyAt)||j.readyAt<j.startedAt)delete v.jobs[id];
    const key=this.dayKey(now);
    if(v.day?.key!==key||!v.day?.base||typeof v.day.base!=='object')v.day={key,base:this.counters(),claimed:[]};
    if(!Array.isArray(v.day.claimed))v.day.claimed=[];
    if(typeof v.restDay!=='string')v.restDay='';
    return v;
  },
  built(id){return !!this.ensure().projects[id]?.builtAt},
  canPay(cost){return S.coins>=(cost.c||0)&&Object.entries(cost.i||{}).every(([id,n])=>(S.inv[id]||0)>=n)},
  spend(cost){for(const [id,n]of Object.entries(cost.i||{}))addItem(id,-n);if(cost.c)addCoins(-cost.c)},
  roomFor(reward){return invTotal()+Object.values(reward.i||{}).reduce((n,q)=>n+q,0)<=fishCapacity()},
  grant(reward){for(const [id,n]of Object.entries(reward.i||{}))addItem(id,n);if(reward.c)addCoins(reward.c);if(reward.xp)addXp(reward.xp);refreshHud()},
  startProject(id,now=Date.now()){
    const p=this.projects.find(p=>p.id===id),v=this.ensure(now);
    if(!p||v.projects[id]||S.lv<p.lv||!this.canPay(p.cost))return false;
    v.projects[id]={startedAt:now,readyAt:now+p.seconds*1000};this.spend(p.cost);save();beep('tap');return true;
  },
  finishProject(id,now=Date.now()){
    const p=this.projects.find(p=>p.id===id),v=this.ensure(now),job=v.projects[id];
    if(!p||!job||job.builtAt||job.readyAt>now)return false;
    v.projects[id]={builtAt:now||1};this.grant(p.reward);save();beep('win');return true;
  },
  startCraft(id,now=Date.now()){
    const r=this.recipes.find(r=>r.id===id),v=this.ensure(now);
    if(!r||v.jobs[id]||!this.built(r.project)||!this.canPay(r.cost))return false;
    const duration=Math.round(r.seconds*1000*(this.built('waterwheel') ? .8 : 1));
    v.jobs[id]={startedAt:now,readyAt:now+duration};this.spend(r.cost);save();beep('tap');return true;
  },
  claimCraft(id,now=Date.now()){
    const r=this.recipes.find(r=>r.id===id),v=this.ensure(now),job=v.jobs[id];
    if(!r||!job||job.readyAt>now)return false;
    if(!this.roomFor(r.reward)){toast('Kho đầy. Mẻ hàng vẫn được giữ; hãy bán bớt rồi nhận lại.');return false}
    delete v.jobs[id];v.crafted++;this.grant(r.reward);save();beep('coin');return true;
  },
  progress(objective,now=Date.now()){const v=this.ensure(now);return Math.min(objective.goal,Math.max(0,(this.counters()[objective.key]||0)-(v.day.base[objective.key]||0)))},
  claimDaily(id,now=Date.now()){
    const o=this.objectives.find(o=>o.id===id),v=this.ensure(now);
    if(!o||v.day.claimed.includes(id)||this.progress(o,now)<o.goal||!this.roomFor(o.reward))return false;
    v.day.claimed.push(id);this.grant(o.reward);save();beep('coin');return true;
  },
  rest(now=Date.now()){
    const v=this.ensure(now),key=this.dayKey(now);
    if(!this.built('hotspring')||v.restDay===key)return false;
    v.restDay=key;this.grant({c:60,xp:20});save();beep('win');return true;
  },
  icon(id,label){return typeof Art!=='undefined'?Art.icon(id,label):''},
  costText(cost){return [cost.c?`${fmt(cost.c)} xu`:'',...Object.entries(cost.i||{}).map(([id,n])=>`${n} ${ITEMS[id]?.n||id}`)].filter(Boolean).join(' · ')},
  rewardText(reward){return [reward.c?`${fmt(reward.c)} xu`:'',reward.xp?`${reward.xp} XP`:'',...Object.entries(reward.i||{}).map(([id,n])=>`${n} ${ITEMS[id]?.n||id}`)].filter(Boolean).join(' · ')},
  time(ms){const s=Math.max(0,Math.ceil(ms/1000));return s>=60?`${Math.floor(s/60)}p ${s%60}s`:`${s}s`},
  act(button,action,message){button.onclick=()=>{if(action()){if(message)toast(message);refreshSheet()}}},
  open(tab=this.tab){
    this.tab=tab;this.ensure();clearInterval(this.ticker);
    openSheet('village','Nhịp sống làng quê',body=>{
      const v=this.ensure();body.classList.add('village-body');
      const intro=el('div','village-intro',`${this.icon('farmhouse','Làng quê')}<div><b>Một ngôi làng đang hồi sinh</b><p>Khôi phục công trình, làm hàng thủ công và góp sức mỗi ngày.</p></div>`);body.append(intro);
      body.append(tabs(['Khôi phục','Thủ công','Việc hôm nay'],this.tab,i=>{this.tab=i;refreshSheet()}));
      if(this.tab===0){
        const restored=this.projects.filter(p=>v.projects[p.id]?.builtAt).length;
        body.append(el('p','village-note',`Đã khôi phục ${restored}/${this.projects.length} công trình · Tiến độ được lưu khi rời game.`));
        for(const p of this.projects){
          const job=v.projects[p.id],built=!!job?.builtAt,ready=job&&!built&&job.readyAt<=Date.now();
          const card=el('article','village-card'+(built?' is-built':''));
          card.innerHTML=`<div class="village-art">${this.icon(p.art,p.n)}</div><div class="village-content"><h3>${p.n}<span>Cấp ${p.lv}</span></h3><p>${p.desc}</p><small>${built?'Đã hoạt động':job?'Đang khôi phục':this.costText(p.cost)+' · '+p.seconds+'s'}</small><div class="village-card-foot"><span>${this.rewardText(p.reward)}</span></div></div>`;
          const b=el('button','cbtn2 sm',built?'Đã khôi phục':job?(ready?'Hoàn tất':this.time(job.readyAt-Date.now())):'Khôi phục');b.disabled=built||(!job&&(S.lv<p.lv||!this.canPay(p.cost)))||!!(job&&!built&&!ready);
          if(job&&!built){b.dataset.villageReady=job.readyAt;b.dataset.villageLabel='Hoàn tất'}
          this.act(b,()=>job?this.finishProject(p.id):this.startProject(p.id),job?'Đã khôi phục '+p.n:'Đã bắt đầu khôi phục '+p.n);$('.village-card-foot',card).append(b);body.append(card);
        }
      }else if(this.tab===1){
        body.append(el('p','village-note','Mỗi công thức giữ một mẻ riêng. Nguyên liệu trừ khi bắt đầu; hàng đã xong luôn được giữ nếu kho đầy.'));
        for(const r of this.recipes){
          const job=v.jobs[r.id],unlocked=this.built(r.project),ready=job&&job.readyAt<=Date.now(),project=this.projects.find(p=>p.id===r.project);
          const card=el('article','village-card');card.innerHTML=`<div class="village-art">${this.icon(r.art,r.n)}</div><div class="village-content"><h3>${r.n}</h3><p>${r.product}</p><small>${unlocked?this.costText(r.cost):'Khôi phục '+project.n+' để mở'}</small><div class="village-card-foot"><span>${job?'Mẻ hàng đã lưu':this.time(r.seconds*1000*(this.built('waterwheel') ? .8 : 1))}</span></div></div>`;
          const b=el('button','cbtn2 sm',job?(ready?'Nhận hàng':this.time(job.readyAt-Date.now())):'Bắt đầu');b.disabled=!unlocked||!!(job&&!ready)||(!job&&!this.canPay(r.cost));
          if(job){b.dataset.villageReady=job.readyAt;b.dataset.villageLabel='Nhận hàng'}
          this.act(b,()=>job?this.claimCraft(r.id):this.startCraft(r.id),job?'Đã nhận '+r.product:'Đã bắt đầu '+r.n);$('.village-card-foot',card).append(b);body.append(card);
        }
      }else{
        body.append(el('p','village-note','Thu hoạch, giao hàng, câu cá và làm thủ công để nhận quà. Làm mới lúc 0 giờ Việt Nam.'));
        for(const o of this.objectives){const progress=this.progress(o),claimed=v.day.claimed.includes(o.id),card=el('article','village-daily');card.innerHTML=`<div><h3>${o.n}</h3><small>${this.rewardText(o.reward)}</small><progress value="${progress}" max="${o.goal}" aria-label="${o.n}"></progress><span>${progress}/${o.goal}</span></div>`;const b=el('button','cbtn2 sm',claimed?'Đã nhận':'Nhận quà');b.disabled=claimed||progress<o.goal;this.act(b,()=>this.claimDaily(o.id),'Đã nhận quà việc làng!');card.append(b);body.append(card)}
        const rest=el('article','village-daily');rest.innerHTML='<div><h3>Nghỉ chân ở suối khoáng</h3><small>60 xu · 20 XP mỗi ngày sau khi khôi phục suối.</small></div>';const b=el('button','cbtn2 sm',v.restDay===this.dayKey()?'Đã thư giãn':'Nghỉ chân');b.disabled=!this.built('hotspring')||v.restDay===this.dayKey();this.act(b,()=>this.rest(),'Một buổi nghỉ yên bình: +60 xu, +20 XP.');rest.append(b);body.append(rest);
      }
    },'86%');
    this.ticker=setInterval(()=>{if(typeof sheetKey==='undefined'||sheetKey!=='village'){clearInterval(this.ticker);this.ticker=0;return}for(const b of document.querySelectorAll('[data-village-ready]')){const remaining=Number(b.dataset.villageReady)-Date.now();b.textContent=remaining>0?this.time(remaining):b.dataset.villageLabel;b.disabled=remaining>0}},500);
  },
  sceneObjects(){const v=this.ensure();return this.projects.filter(p=>v.projects[p.id]?.builtAt).map(p=>({gx:p.gx,gy:p.gy,k:p.art,s:1.15,ph:0,villageId:p.id}))},
  tap(gx,gy,sx,sy){const p=this.projects.find(p=>this.built(p.id)&&Math.hypot(gx-p.gx,gy-p.gy)<1.1);if(!p)return false;this.open(p.id==='hotspring'?2:1);return true},
};
function openVillage(tab){Village.open(Number.isInteger(tab)?tab:0)}
