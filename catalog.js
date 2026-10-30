'use strict';
/* Additional playable content identified in the document's seed and fishing catalogues. */
const EXTRA_CROPS=[
 ['khoaitay','Khoai tây','🥔',9],['khoailang','Khoai lang','🍠',10],['lac','Lạc','🥜',11],['dautuong','Đậu tương','🫘',12],['dauxanh','Đậu xanh','🟢🫘',13],['bapcai','Bắp cải','🥬',14],['dualeo','Dưa leo','🥒',15],['cucai','Củ cải','🤍🥕',16],['hanh','Hành tây','🧅',17],['toi','Tỏi','🧄',18],['gung','Gừng','🫚',19],['tao','Táo','🍎',20],['xoai','Xoài','🥭',21],['chuoi','Chuối','🍌',22],['cam','Cam','🍊',23],['thanhlong','Thanh long','🐉🍎',24],['dua','Dừa','🥥',25],['mia','Mía','🎍',26],['caphe-qua','Cà phê','☕',27],['che','Chè','🍃',28],['hat-sen','Hạt sen','🪷🌰',29]
];
for(const [id,n,e,lv] of EXTRA_CROPS)CROPS[id]={n,e,lv,t:120+lv*12,sell:60+lv*14,xp:20+lv*4,seed:28+lv*6,col:'#66a646'};
const EXTRA_PRODUCTS=[['phomai','Phô mai','🧀',180],['thucan','Thức ăn chăn nuôi','🌾🥣',85],['mut','Mứt dâu','🍓🫙',210],['tra','Trà khô','🍵',260],['com','Cơm trắng','🍚🥣',110],['len','Len cừu','🧶',95],['thitheo','Thịt heo','🥩',100],['trungvit','Trứng vịt','🦆🥚',45]];
PRODUCTS.sua.n='Sữa tươi';
for(const [id,n,e,sell]of EXTRA_PRODUCTS)PRODUCTS[id]={n,e,sell};
const EXTRA_FISH=[['catre','Cá trê','🐟🟤',36,1,30],['cachim','Cá chim','🐟⚪',46,1.1,22],['camu','Cá mú','🐟🟣',78,1.4,13],['cangu','Cá ngừ','🐟🔵',95,1.5,10],['tomvang','Tôm vàng','🦐🟡',120,1.7,8],['cachen','Cá chẽm','🐟🌊',100,1.6,10],['catran','Cá lóc vàng','🐟🟨',140,1.7,6],['cachach','Cá chạch','🐟🟫',58,1.2,18],['luon','Lươn','〰️🐟',75,1.3,15],['cathatlat','Cá cờ','⛵🐟',170,1.8,5],['cachinh','Cá chình','🐟〰️',150,1.7,6],['cahoi','Cá hồi','🐟🩷',165,1.8,5],['laokhonglo','Cá tai tượng','🐟💠',250,2.2,3],['chepvang','Chép vàng','🐠✨',280,2.3,2],['canhavu','Cá lia thia','🐠🌺',220,2.1,3],['cachien','Cá chiên','🐟⚔️',320,2.5,1],['cadieu','Cá điêu hồng','🐟🔴',60,1.3,18]];
for(const [id,n,e,sell,str,w] of EXTRA_FISH)FISHES[id]={n,e,sell,str,w};
Object.assign(ITEMS,CROPS,PRODUCTS,FISHES);
FISHES.cavang.art='chepvang';
const EXTRA_BUILDINGS={
 dairy:{n:'Xưởng sữa',e:'🧀',lv:7,cost:1800,slot:[17,2],out:'phomai',in:{sua:2},t:95,desc:'2 sữa → phô mai',art:'dairy',kind:'factory'},
 feed:{n:'Máy trộn thức ăn',e:'🌾🥣',lv:8,cost:2100,slot:[17,5],out:'thucan',in:{ngo:2,lua:1},t:55,desc:'2 ngô + 1 lúa → thức ăn',art:'feed-machine',kind:'factory'},
 jam:{n:'Xưởng mứt',e:'🍓🫙',lv:9,cost:2400,slot:[17,8],out:'mut',in:{dau:3},t:100,desc:'3 dâu → mứt dâu',art:'jam-workshop',kind:'factory'},
 tea:{n:'Xưởng sấy trà',e:'🍵',lv:28,cost:6400,slot:[17,11],out:'tra',in:{che:2},t:140,desc:'2 chè → trà khô',art:'tea-workshop',kind:'factory'},
 rice:{n:'Máy chế biến gạo',e:'🍚🥣',lv:10,cost:2600,slot:[17,14],out:'com',in:{lua:3},t:75,desc:'3 lúa → cơm trắng',art:'rice-conveyor',kind:'factory'},
 pigs:{n:'Chuồng heo',e:'🐷',lv:9,cost:2300,slot:[2,17],out:'thitheo',t:95,desc:'Chăn nuôi heo',art:'pigsty',kind:'animal'},
 ducks:{n:'Chuồng vịt',e:'🦆',lv:6,cost:1200,slot:[5,17],out:'trungvit',t:55,desc:'Vịt cho trứng',art:'duck-house',kind:'animal'},
 goats:{n:'Chuồng dê',e:'🐐',lv:12,cost:3200,slot:[8,17],out:'sua',t:65,desc:'Dê cho sữa',art:'goat-shelter',kind:'animal'},
 sheep:{n:'Chuồng cừu',e:'🐑',lv:13,cost:3500,slot:[11,17],out:'len',t:85,desc:'Cừu cho len',art:'sheep-barn',kind:'animal'}
};
for(const b of Object.values(EXTRA_BUILDINGS))b.col=['#c98a4b','#a56a33','#d44a35'];Object.assign(BUILDINGS,EXTRA_BUILDINGS);
