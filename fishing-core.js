'use strict';
const FISH_SPOTS={
 lotus:{id:'lotus',name:'Ao Sen',tag:'Êm đềm bên làng',need:0,color:'#289b9a',deep:'#176878',bank:'#87b85e',fish:['caro','cachep','tom','caloc','catre','cadieu','cachach','luon','cavang','canhavu'],icon:'lotus'},
 river:{id:'river',name:'Sông Quê',tag:'Theo dòng phiêu lưu',need:5,color:'#45a9b2',deep:'#216d89',bank:'#8aa969',fish:['cachep','caloc','catre','cachen','catran','cachinh','laokhonglo','chepvang','tom'],icon:'boat'},
 bay:{id:'bay',name:'Vịnh Lam',tag:'Khám phá vùng nước xanh',need:15,color:'#39b4c6',deep:'#216592',bank:'#c5bd81',fish:['cachim','camu','cangu','tomvang','cathatlat','cahoi','cachien','chepvang'],icon:'crane'}
};
const FishMechanics={
  rarity(f){return f.sell>=220?{id:'legend',name:'Huyền thoại',color:'#df9d35',rank:3}:f.sell>=100?{id:'rare',name:'Quý hiếm',color:'#8c72ce',rank:2}:f.sell>=48?{id:'uncommon',name:'Ít gặp',color:'#3a9c83',rank:1}:{id:'common',name:'Phổ biến',color:'#6b9291',rank:0}},
  mood(F){const length=6.5,phase=F.fightTime%length;return phase<2.4?'calm':phase<3.3?'warning':phase<4.65?'burst':'rest'},
  step(F,dt,prefs,fish,power){
    const challenge=prefs.fishDifficulty==='challenge',strength=fish.str*(challenge?1:.72),easy=F.beginner?.72:1;F.fightTime+=dt;F.moodName=this.mood(F);F.mood={calm:0,warning:2,burst:3,rest:1}[F.moodName];
    const fatigue=1-Math.min(.42,F.fightTime*.011),rate=F.moodName==='burst'?74*fatigue:F.moodName==='warning'?33:F.moodName==='rest'?13:19;
    if(F.reel){F.tension+=rate*strength*easy/power*dt;if(F.moodName!=='burst')F.prog+=(F.moodName==='warning'?9:20)*Math.sqrt(power)/Math.max(.8,strength)*dt;else F.prog+=2*dt}
    else{F.tension-=(challenge?32:43)*dt;F.prog-=(challenge?1.25:.45)*dt}
    F.tension=clamp(F.tension,0,100);F.prog=clamp(F.prog,0,100);F.lim-=dt;F.dangerTime=F.tension>=96?(F.dangerTime||0)+dt:0;
    if(F.tension>70)F.clean=false;if(F.prog>=100)return 'win';if(F.dangerTime>(challenge?.75:1.5))return 'line';if(F.lim<=0)return 'time';return null;
  },
  weight(f,r=Math.random(),id){const ranges={caro:[.1,.65],tom:[.02,.11],cachep:[.65,5.5],caloc:[.45,4],cavang:[.08,.6],catre:[.3,4.8],cachim:[.6,5],camu:[.8,12],cangu:[2,30],tomvang:[.03,.22],cachen:[.7,7],catran:[.9,10],cachach:[.04,.3],luon:[.1,1],cathatlat:[4,28],cachinh:[.3,3],cahoi:[1.8,9],laokhonglo:[14,55],chepvang:[1,9],canhavu:[.5,6],cachien:[2.5,22],cadieu:[.3,2.6]},[min,max]=ranges[id]||[.15,3];return Math.round((min+(max-min)*clamp(r,0,1))*100)/100},
  rank(xp){return 1+Math.floor(Math.sqrt(Math.max(0,xp)/80))},
  chestGoal(claimed){return (claimed+1)*5},
  unlocked(spot,caught){return caught>=FISH_SPOTS[spot].need}
};
