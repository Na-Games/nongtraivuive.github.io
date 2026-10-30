'use strict';
/* ===== Dữ liệu tĩnh của game ===== */
const $=(s,r=document)=>r.querySelector(s);
const el=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};
const fmt=n=>Math.floor(n).toLocaleString('vi-VN');
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;

const CROPS={
  lua:{n:'Lúa',e:'🌾',t:20,sell:12,xp:6,seed:6,lv:1,col:'#e3c24a'},
  ngo:{n:'Ngô',e:'🌽',t:35,sell:20,xp:9,seed:10,lv:2,col:'#f2d03b'},
  carot:{n:'Cà rốt',e:'🥕',t:45,sell:28,xp:12,seed:14,lv:3,col:'#f0842c'},
  dau:{n:'Dâu tây',e:'🍓',t:60,sell:40,xp:16,seed:20,lv:4,col:'#e23b4a'},
  catim:{n:'Cà tím',e:'🍆',t:75,sell:56,xp:20,seed:28,lv:5,col:'#7b3fa3'},
  cachua:{n:'Cà chua',e:'🍅',t:90,sell:74,xp:26,seed:36,lv:6,col:'#e0402c'},
  ot:{n:'Ớt',e:'🌶️',t:110,sell:98,xp:32,seed:48,lv:7,col:'#d92b1f'},
  duahau:{n:'Dưa hấu',e:'🍉',t:140,sell:140,xp:44,seed:68,lv:8,col:'#3fa04a'},
  bi:{n:'Bí ngô',e:'🎃',t:180,sell:200,xp:58,seed:95,lv:10,col:'#f08a1f'}
};
const PRODUCTS={
  trung:{n:'Trứng gà',e:'🥚',sell:30},
  sua:{n:'Sữa bò',e:'🥛',sell:52},
  bot:{n:'Bột gạo',e:'🍚',sell:44},
  banh:{n:'Bánh ngọt',e:'🥮',sell:150},
  mat:{n:'Mật ong',e:'🍯',sell:90}
};
const FISHES={
  caro:{n:'Cá rô',e:'🐟',sell:18,str:.8,w:50},
  tom:{n:'Tôm càng',e:'🦐',sell:36,str:1,w:28},
  cachep:{n:'Cá chép',e:'🐠',sell:48,str:1.2,w:20},
  caloc:{n:'Cá lóc',e:'🐡',sell:80,str:1.5,w:10},
  cavang:{n:'Cá vàng',e:'🏅',sell:220,str:2,w:3}
};
const ITEMS=Object.assign({},CROPS,PRODUCTS,FISHES);

/* Công trình: slot cố định trên bản đồ */
const BUILDINGS={
  coop:{n:'Chuồng gà',e:'🐔',lv:1,cost:200,slot:[9,9],col:['#c98a4b','#a56a33','#d44a35'],out:'trung',t:40,desc:'Gà đẻ trứng'},
  pen:{n:'Chuồng bò',e:'🐄',lv:3,cost:600,slot:[11,11],col:['#b9783f','#955a2a','#6b4a2b'],out:'sua',t:70,desc:'Bò cho sữa'},
  bee:{n:'Tổ ong',e:'🐝',lv:4,cost:700,slot:[13,8],col:['#e8c25a','#c99f35','#8b5a2b'],out:'mat',t:90,desc:'Ong làm mật'},
  mill:{n:'Nhà xay xát',e:'⚙️',lv:3,cost:500,slot:[1,5],col:['#c9a77a','#a8855a','#8a4a2a'],in:{lua:2},out:'bot',t:45,desc:'Xay 2 lúa → 1 bột'},
  oven:{n:'Lò bánh',e:'🔥',lv:5,cost:900,slot:[3,2],col:['#d49a6a','#b57a4a','#a0392b'],in:{bot:2,trung:1},out:'banh',t:80,desc:'2 bột + 1 trứng → bánh'}
};
const BUILD_TABS=['Hạt giống','Nhà máy','Chuồng','Trang trí'];

const PROVINCES=[
 ['Hà Nội',105.85,21.03,'Bắc'],['Hải Phòng',106.7,20.85,'Bắc'],['Quảng Ninh',107.3,21.0,'Bắc'],['Lai Châu',103.4,22.3,'Bắc'],
 ['Điện Biên',103.0,21.4,'Bắc'],['Sơn La',104.0,21.3,'Bắc'],['Lạng Sơn',106.7,21.85,'Bắc'],['Cao Bằng',106.25,22.65,'Bắc'],
 ['Tuyên Quang',105.2,22.0,'Bắc'],['Lào Cai',104.0,22.4,'Bắc'],['Thái Nguyên',105.8,21.6,'Bắc'],['Phú Thọ',105.2,21.3,'Bắc'],
 ['Bắc Ninh',106.1,21.2,'Bắc'],['Hưng Yên',106.05,20.65,'Bắc'],['Ninh Bình',105.95,20.25,'Bắc'],
 ['Thanh Hóa',105.4,19.9,'Trung'],['Nghệ An',105.0,19.0,'Trung'],['Hà Tĩnh',105.9,18.3,'Trung'],['Quảng Trị',106.9,17.2,'Trung'],
 ['Huế',107.55,16.45,'Trung'],['Đà Nẵng',108.2,16.05,'Trung'],['Quảng Ngãi',108.8,15.1,'Trung'],['Gia Lai',108.5,13.9,'Trung'],
 ['Khánh Hòa',109.1,12.2,'Trung'],['Đắk Lắk',108.1,12.7,'Trung'],['Lâm Đồng',108.4,11.9,'Trung'],
 ['Đồng Nai',107.2,11.0,'Nam'],['TP. Hồ Chí Minh',106.7,10.78,'Nam'],['Tây Ninh',106.1,11.35,'Nam'],['Đồng Tháp',105.6,10.5,'Nam'],
 ['Vĩnh Long',105.95,10.2,'Nam'],['Cần Thơ',105.8,10.03,'Nam'],['An Giang',105.1,10.4,'Nam'],['Cà Mau',105.15,9.2,'Nam']
];
/* đường viền Việt Nam (kinh độ, vĩ độ) – phác họa */
const VN_OUTLINE=[[105.3,23.3],[106.7,22.9],[108,21.5],[107,20.8],[106,20.1],[105.8,19],[106.5,18],[107.5,16.5],[108.5,15.5],[109.3,13.5],[109.3,11.8],[108.8,11],[107.3,10.4],[106.8,10.3],[106.6,9.5],[105.5,8.6],[104.8,8.8],[105.2,9.8],[105,10.8],[106.1,11.3],[106,12.5],[107.5,14.5],[107.2,15.8],[105.8,17.5],[105,18.5],[104,19.5],[104.2,20.5],[103,21.5],[102.2,22.4],[103,22.8],[104.5,22.8]];

const SEASON_TIERS=20;
const CHECKIN=[
 {e:'🪙',t:'200 xu',c:200},{e:'💎',t:'3 ngọc',g:3},{e:'🌽',t:'5 ngô',i:{ngo:5}},{e:'🪙',t:'500 xu',c:500},
 {e:'🥚',t:'8 trứng',i:{trung:8}},{e:'💎',t:'8 ngọc',g:8},{e:'🎁',t:'Quà lớn',c:1000,g:10}
];
const EVENTS=[
 {id:'lotus',n:'Lễ hội sen hồ',e:'🪷',d:'Thu hoạch 30 nông sản trong sự kiện.',goal:30,key:'harvest',r:{c:800,g:10}},
 {id:'moon',n:'Tết Trung Thu',e:'🏮',d:'Giao 8 đơn hàng để nhận lồng đèn.',goal:8,key:'deliver',r:{c:1200,g:15}},
 {id:'fishfest',n:'Hội thi câu cá',e:'🎣',d:'Câu được 10 con cá bất kỳ.',goal:10,key:'fish',r:{c:1000,g:12}}
];
const QUESTS=[
 {n:'Vụ lúa đầu tiên',key:'harvest_lua',goal:4,r:{c:150,xp:40}},
 {n:'Giao đơn đầu tiên',key:'deliver',goal:1,r:{c:200,xp:50}},
 {n:'Xây chuồng gà',key:'build_coop',goal:1,r:{c:250,g:3}},
 {n:'Câu cá thư giãn',key:'fish',goal:2,r:{c:300,xp:80}},
 {n:'Nâng cấp một ô đất',key:'upgrade',goal:1,r:{c:300,g:5}},
 {n:'Thu hoạch 30 nông sản',key:'harvest',goal:30,r:{c:600,g:8}}
];
const NPC=[['Hải Quay Xe','🧑‍🌾'],['Cuộc sống mà','👩'],['Khách 109446','🧑'],['河马','🦛'],['Bé Mạ','👧'],['Chú Tư','👴'],['Cô Ba','👵'],['Tí Hon','🧒']];
const CHATS=['mua măng ...','Chào cả nhà!','Chào ae mới nha','Ai đổi ngô không?','Tưới giúp mình nha','Lên cấp 8 rồi nè','Hôm nay trúng đơn to!','Câu được cá lóc 🐡','Mở đất tốn xu quá','Ghé vườn mình nhé'];
const THEMES=[['default','Mặc định','#4caf3a'],['sakura','Anh đào','#e86f9a'],['ocean','Đại dương','#2f9ad8'],['violet','Tím mộng','#8e5bd6'],['gold','Hoàng kim','#e0a21c']];
const SKINS=['#f6d2b0','#eab98a','#c98f5f','#8d5a36'];
const HAIRS=['#2a1a10','#5a3216','#a85d1f','#d9b25a','#222'];
const OUTFITS=['#9bd36a','#e9695a','#5aa7e8','#f0c04a','#b07ad8','#f6f0e0'];
const HATS=[['non','Nón lá'],['rom','Mũ rơm'],['khan','Khăn mỏ quạ'],['none','Không mũ']];
const RODS=[{id:'tre',n:'Cần tre',e:'🎋',p:0,pow:1,cur:'c'},{id:'truc',n:'Cần trúc',e:'🎣',p:400,pow:1.3,cur:'c'},{id:'carbon',n:'Cần carbon',e:'⚡',p:1500,pow:1.7,cur:'c'},{id:'vang',n:'Cần vàng',e:'👑',p:25,pow:2.3,cur:'g'}];
const BAITS=[{id:'nho',n:'Mồi cá nhỏ',e:'🪱',p:10,rare:0},{id:'giun',n:'Mồi giun',e:'🐛',p:25,rare:.15},{id:'dac',n:'Mồi đặc biệt',e:'✨',p:80,rare:.4}];
const TOOLS=[{id:'luoi',n:'Lưới nhỏ',e:'🕸️',p:60,desc:'Tăng 10% xu bán cá'},{id:'xo',n:'Xô đựng',e:'🪣',p:120,desc:'Thêm 2 chỗ trong kho dùng chung'}];
