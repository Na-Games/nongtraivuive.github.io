'use strict';
/* One layered character rig for previews, walking, working and fishing.
   Each part shares the same coordinates; changing clothing never changes the rig. */
const Wardrobe={
  names:['An','Mây','Bình','Tư','Lan','Sóc'],
  hairStyles:[['short','Tóc ngắn'],['swept','Tóc mái'],['braid','Tóc tết'],['long','Tóc dài'],['curly','Tóc xoăn']],
  normalize(av={}){return {...av,style:Number.isInteger(av.style)?clamp(av.style,0,5):Math.max(0,OUTFITS.indexOf(av.outfit)),skin:SKINS.includes(av.skin)?av.skin:SKINS[0],hair:HAIRS.includes(av.hair)?av.hair:HAIRS[0],hairStyle:this.hairStyles.some(([k])=>k===av.hairStyle)?av.hairStyle:['short','braid','swept','short','long','curly'][av.style||0],shirtStyle:['shirt','overalls','jacket'].includes(av.shirtStyle)?av.shirtStyle:'shirt',outfit:OUTFITS.includes(av.outfit)?av.outfit:OUTFITS[0],hat:HATS.some(h=>h[0]===av.hat)?av.hat:'non',art:true}},
  draw(c,x,y,h,av,o={}){
    av=this.normalize(av);const style=av.style,back=!!o.back&&!o.fishing,t=o.t||0;
    const reduced=typeof Motion!=='undefined'&&Motion.reduced;
    const stride=o.walk?Math.sin((o.phase??t*1.5)*Math.PI*2):0;
    const work=o.work?Math.sin((o.actionTime??t)*9):0;
    const bob=reduced?0:o.walk?Math.abs(stride)*1.3:Math.sin(t*2.2)*.35;
    // Avoid the paper-thin silhouette produced by scaling a sprite through zero.
    const facing=(o.turn??o.face??-1)>0?-1:1,scale=h/100;
    c.save();c.translate(x,y);c.scale(scale*facing,scale);c.translate(0,-bob);
    c.lineJoin='round';c.lineCap='round';c.lineWidth=1.15;c.strokeStyle='#493225';
    const shape=(path,fill,stroke=true)=>{const p=new Path2D(path);c.fillStyle=fill;c.fill(p);if(stroke)c.stroke(p)};
    const ellipse=(a,b,rx,ry,fill)=>{c.beginPath();c.ellipse(a,b,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill()};
    const limb=(side,angle,arm)=>{c.save();c.translate(side*(arm?11:6),arm?-43:-22);c.rotate(angle);if(arm){shape('M-4 0 Q-6 6 -4 14 L3 15 Q6 7 4 0Z',av.outfit);shape('M-3 13 L3 14 L3 23 Q0 27 -3 23Z',av.skin)}else{shape('M-5 0 L5 0 L4 18 L-4 18Z','#57493f');shape('M-4 16 Q2 14 5 18 L7 22 Q1 25 -6 22Z','#3b3029')}c.restore()};
    limb(-1,-stride*.4,false);limb(1,stride*.4,false);
    if(back){ellipse(0,-65,20,24,av.hair);if(['braid','long'].includes(av.hairStyle))shape('M-15-65 Q-29-40-12-31 L-7-52Z',av.hair)}
    limb(-1,o.fishing?.8:stride*.5+work*.25,true);
    shape('M-11-48 Q0-53 11-48 L14-24 Q0-17-14-24Z',av.outfit);
    shape('M-10-45 L-12-25 Q-6-22-3-24 L-4-46Z','rgba(0,0,0,.10)',false);
    shape('M-5-49 L0-42 L5-49 L0-52Z',av.skin);
    shape('M-7-49 L0-43 L-4-39 L-10-47Z',av.outfit);
    shape('M7-49 L0-43 L4-39 L10-47Z',av.outfit);
    if(!back){c.strokeStyle='#49322555';c.beginPath();c.moveTo(0,-42);c.lineTo(0,-24);c.stroke();for(let a=-37;a<-25;a+=5)ellipse(2,a,.7,.7,'#594c37');shape('M5-39 L10-39 L10-33 Q7-30 5-33Z',av.outfit)}
    if(av.shirtStyle==='overalls'){shape('M-11-47 L-7-47 L-6-35 L6-35 L7-47 L11-47 L12-24 Q0-20-12-24Z','#536d86');shape('M-4-33 L4-33 L4-28 L-4-28Z','#708fa3');ellipse(-8,-37,1,1,'#e2ca80');ellipse(8,-37,1,1,'#e2ca80')}
    if(av.shirtStyle==='jacket'){shape('M-3-47 L-1-24 L-12-24 L-10-47Z',av.outfit);shape('M3-47 L1-24 L12-24 L10-47Z',av.outfit);shape('M-4-48 L0-39 L-5-35 L-9-46Z','#ead8b9');shape('M4-48 L0-39 L5-35 L9-46Z','#ead8b9')}
    c.strokeStyle='#493225';limb(1,o.fishing?1.15:(o.work?-1.1-work*.35:-stride*.5),true);
    ellipse(0,-62,18.5,22,av.hair);
    if(!back){
      ellipse(-17,-62,4,5,av.skin);ellipse(17,-62,4,5,av.skin);
      shape('M-17-72 Q-13-87 2-85 Q21-81 17-62 Q16-49 4-46 Q-10-45-16-58Z',av.skin);
      ellipse(-9,-58,4,2.2,'#ed927955');ellipse(12,-58,3.5,2,'#ed927955');
      for(const a of [-6,9]){ellipse(a,-64,3.7,5.1,'#fff9e9');ellipse(a+.7,-63,2.6,4,'#37291d');ellipse(a+1.2,-65,1,1.4,'white')}
      if(style===1){c.strokeStyle=av.hair;c.lineWidth=1.2;for(const a of [-6,9]){c.beginPath();c.moveTo(a-3,-67);c.lineTo(a-5,-69);c.moveTo(a+3,-67);c.lineTo(a+5,-69);c.stroke()}}
      if(style===2){c.strokeStyle=av.hair;c.lineWidth=2.2;c.beginPath();c.moveTo(-10,-71);c.lineTo(-3,-72);c.moveTo(6,-72);c.lineTo(12,-70);c.stroke()}
      if(style===5)for(const [a,b]of [[-10,-59],[-7,-57],[-4,-59],[9,-58],[12,-56],[15,-59]])ellipse(a,b,.75,.75,'#ad7150');
      if(av.hairStyle==='braid'){shape('M-17-62 Q-28-57-20-49 Q-27-43-18-37 Q-11-45-16-51 Q-10-58-17-62Z',av.hair)}
      if(style===4){ellipse(-18,-56,2.1,3,'#d5a449');ellipse(18,-56,2.1,3,'#d5a449')}
      c.strokeStyle='#764832';c.lineWidth=1.1;c.beginPath();c.moveTo(0,-54);c.quadraticCurveTo(4,-51,8,-55);c.stroke();
      const hairShapes={short:'M-18-64 Q-23-82-5-88 Q14-91 20-74 L16-66 L11-77 L6-73 L3-79 Q-4-70-12-73 L-15-61Z',swept:'M-19-66 Q-21-86-6-87 Q12-91 20-74 L16-67 L9-78 Q-4-70-13-73 L-15-62Z',braid:'M-18-61 Q-24-83-9-87 Q11-94 20-75 L15-65 L11-78 Q3-66-4-75 Q-8-67-13-71 L-15-58Z',long:'M-19-50 Q-25-81-9-88 Q16-94 22-73 L20-46 L14-47 L14-70 L10-79 Q-3-67-12-74 L-13-49Z',curly:'M-19-63 Q-27-71-20-76 Q-24-85-13-86 Q-10-95-2-88 Q7-96 12-87 Q25-86 20-76 Q28-69 17-62 L13-73 Q6-69 3-77 Q-6-68-13-73 L-14-62Z'};
      shape(hairShapes[av.hairStyle],av.hair);
      if(style===3||style===4){c.strokeStyle='#6c4a35';c.lineWidth=.8;for(const a of [-6,9]){c.beginPath();c.ellipse(a,-64,5,6,0,0,Math.PI*2);c.stroke()}c.beginPath();c.moveTo(-1,-65);c.lineTo(4,-65);c.stroke()}
    }
    c.strokeStyle='#927044';c.lineWidth=.8;
    if(av.hat==='non'){
      shape('M-28-77 Q-16-87 0-98 Q15-88 29-77 Q1-66-28-77Z','#e7ca87');
      shape('M-28-77 Q0-72 29-77 Q1-65-28-77Z','#b9955b');
      for(const a of [-17,-8,8,17]){c.beginPath();c.moveTo(0,-97);c.lineTo(a,-75);c.stroke()}
    }else if(av.hat==='rom'){
      ellipse(0,-79,28,7,'#d3ad62');shape('M-16-80 L-14-91 Q0-98 15-90 L17-80Z','#e8c884');shape('M-16-83 Q0-79 16-83 L17-79 Q0-75-16-79Z','#a34e3c');
    }else if(av.hat==='khan')shape('M-20-72 Q-23-97 0-96 Q22-93 21-72 L12-83 L0-90 L-12-81Z','#4c454e');
    if(o.fishing){
      const bend=o.reel&&!reduced?Math.sin(t*7)*3:0,tipX=-65+bend,tipY=-100;
      c.strokeStyle='#745234';c.lineWidth=3;c.beginPath();c.moveTo(-21,-31);c.quadraticCurveTo(-58,-63,tipX,tipY);c.stroke();
      c.strokeStyle='#d5b47a';c.lineWidth=1;c.beginPath();c.moveTo(-21,-31);c.quadraticCurveTo(-58,-63,tipX,tipY);c.stroke();
      ellipse(-23,-34,3.2,4.2,'#a7b8a5');
      if(o.rigOut){o.rigOut.x=x+tipX*scale*facing;o.rigOut.y=y+(tipY-bob)*scale;o.rigOut.handX=x-21*scale*facing;o.rigOut.handY=y+(-31-bob)*scale}
    }
    c.restore();return true;
  },
  icon(av,size=112){const cv=document.createElement('canvas');cv.width=size;cv.height=size;this.draw(cv.getContext('2d'),size/2,size*.97,size*.92,av);return cv},
};
