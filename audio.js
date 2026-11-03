'use strict';
/* Shared audio context. Start/resume only from a real user gesture. */
const GameAudio={
  unlocked:false,ambient:null,birdTimer:0,effects:new Set(),lastEffect:-Infinity,resuming:null,
  themes:{nature:{filter:620,gain:.22},stream:{filter:1150,gain:.24},ocean:{filter:340,gain:.32},rain:{filter:3200,gain:.15},village:{filter:480,gain:.14}},
  context(){const Constructor=window.AudioContext||window.webkitAudioContext;if(!Constructor)return null;try{if(!actx||actx.state==='closed')actx=new Constructor();return actx}catch{return null}},
  activate(){this.unlocked=true;const context=this.context();if(!context)return;try{if(context.state!=='running'){const pending=context.resume();this.resuming=pending;Promise.resolve(pending).then(()=>{if(this.resuming===pending)this.resuming=null;this.sync();if(typeof Fishing!=='undefined'&&FS)Fishing.updateAudio(true)}).catch(()=>{this.resuming=null})}else{this.sync();if(typeof Fishing!=='undefined'&&FS)Fishing.updateAudio(true)}}catch{}},
  enabled(){return !!S.fx.sound&&S.fx.volume>0&&!document.hidden},
  animalCue(species){
    if(!this.unlocked||!this.enabled()||S.fx.animalSound===false||!(S.fx.animalVolume>0)||!this.mapVisible()||(typeof FS!=='undefined'&&FS))return false;
    const c=this.context();if(!c||c.state!=='running')return false;
    const voices={cow:[110,85,.65,'sawtooth'],buffalo:[85,60,.75,'sawtooth'],pig:[170,95,.28,'sawtooth'],goat:[340,260,.36,'triangle'],sheep:[280,210,.45,'triangle'],hen:[640,380,.18,'triangle'],duck:[410,260,.19,'sawtooth'],dog:[240,140,.2,'triangle'],cat:[730,410,.5,'sine'],crane:[950,620,.24,'sine']},v=voices[species];if(!v)return false;
    const now=c.currentTime;
    for(let i=0;i<(species==='hen'||species==='duck'?3:2);i++){
      const start=now+i*(v[2]+.07),source=c.createOscillator(),gain=c.createGain(),filter=c.createBiquadFilter();
      source.type=v[3];source.frequency.setValueAtTime(v[0],start);source.frequency.exponentialRampToValueAtTime(v[1],start+v[2]);filter.type='lowpass';filter.frequency.value=species==='hen'?1900:850;
      gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,S.fx.volume*S.fx.animalVolume*.065),start+.025);gain.gain.exponentialRampToValueAtTime(.0001,start+v[2]);source.connect(filter);filter.connect(gain);gain.connect(c.destination);this.effects.add(source);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();this.effects.delete(source)};source.start(start);source.stop(start+v[2]+.02);
    }return true;
  },
  nearbyAnimal(){
    if(typeof IllustratedAnimals==='undefined'||!Scene.animals?.length)return;
    const near=Scene.animals.filter(a=>Math.hypot(a.x-Scene.player.x,a.y-Scene.player.y)<8&&!a.fly);
    if(near.length){this.animalIndex=((this.animalIndex||0)+1)%near.length;this.animalCue(IllustratedAnimals.species(near[this.animalIndex]))}
  },
  play(kind='tap'){
    if(!this.enabled()||S.fx.sfxVolume<=0||!this.unlocked)return;
    const context=this.context();if(!context)return;
    const play=()=>{if(!this.enabled()||S.fx.sfxVolume<=0||context.state!=='running')return;const now=performance.now();if(kind==='tap'&&now-this.lastEffect<90)return;this.lastEffect=now;
      const notes={tap:[[660,.045]],coin:[[880,.07],[1175,.11]],win:[[523,.08],[659,.08],[784,.08],[1046,.17]],err:[[200,.15]],pop:[[440,.045],[550,.055]],water:[[420,.06],[610,.08],[480,.08]],weed:[[320,.05],[470,.08]]}[kind]||[[500,.06]];let time=context.currentTime;
      for(const [frequency,duration]of notes){const source=context.createOscillator(),gain=context.createGain();source.type='sine';source.frequency.value=frequency;gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,.16*S.fx.volume*S.fx.sfxVolume),time+.008);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);source.connect(gain);gain.connect(context.destination);this.effects.add(source);source.onended=()=>{source.disconnect();gain.disconnect();this.effects.delete(source)};source.start(time);source.stop(time+duration+.01);time+=duration*.9}
    };
    if(context.state==='running')play();else if(this.resuming)Promise.resolve(this.resuming).then(play).catch(()=>{});
  },
  mapVisible(){return !document.querySelector('#screen-load')&&!document.querySelector('#screen-fish:not(.hidden)')&&(!document.querySelector('#hud')?.classList.contains('hidden')||!document.querySelector('#screen-map')?.classList.contains('hidden'))},
  sync(){
    const audible=this.unlocked&&this.enabled()&&S.fx.mapSound!==false&&S.fx.mapVolume>0&&this.mapVisible()&&!(typeof FS!=='undefined'&&FS);
    if(!audible){this.stopAmbient();if(!this.enabled())this.stopEffects();return}
    const context=this.context();if(!context||context.state!=='running')return;
    if(this.ambient&&this.ambient.theme!==S.fx.soundTheme)this.stopAmbient();
    const theme=this.themes[S.fx.soundTheme]||this.themes.nature;
    if(!this.ambient){const buffer=context.createBuffer(1,context.sampleRate*3,context.sampleRate),data=buffer.getChannelData(0);let previous=0;for(let i=0;i<data.length;i++){previous=(previous+Math.random()*.12-.06)/1.02;data[i]=S.fx.soundTheme==='rain'?(Math.random()*2-1)*.2:previous*3}const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();gain.gain.value=0;source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=theme.filter;source.connect(filter);filter.connect(gain);gain.connect(context.destination);source.start();this.ambient={source,filter,gain,theme:S.fx.soundTheme};this.birdTimer=setInterval(()=>this.themedCue(),S.fx.soundTheme==='village'?3200:6500)}
    this.ambient.gain.gain.setTargetAtTime(S.fx.volume*S.fx.mapVolume*theme.gain,context.currentTime,.12);if(S.fx.soundTheme==='ocean'){const p=this.ambient.gain.gain;p.cancelScheduledValues(context.currentTime);p.setValueAtTime(S.fx.volume*S.fx.mapVolume*.12,context.currentTime);p.linearRampToValueAtTime(S.fx.volume*S.fx.mapVolume*.34,context.currentTime+2);p.linearRampToValueAtTime(S.fx.volume*S.fx.mapVolume*.12,context.currentTime+5)}
  },
  themedCue(){if(!this.ambient||!this.enabled())return;if(S.fx.soundTheme==='nature'||S.fx.soundTheme==='stream')return this.birds();if(S.fx.soundTheme==='ocean')return this.sync();if(S.fx.soundTheme!=='village')return;const c=this.context(),now=c.currentTime;[261.63,329.63,392,523.25].forEach((frequency,i)=>{const source=c.createOscillator(),gain=c.createGain(),start=now+i*.36;source.type='triangle';source.frequency.value=frequency;gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,S.fx.volume*S.fx.mapVolume*.035),start+.02);gain.gain.exponentialRampToValueAtTime(.0001,start+.8);source.connect(gain);gain.connect(c.destination);this.effects.add(source);source.onended=()=>{source.disconnect();gain.disconnect();this.effects.delete(source)};source.start(start);source.stop(start+.85)})},
  birds(){if(!this.ambient||!this.enabled()||!this.mapVisible())return;const c=this.context(),source=c.createOscillator(),gain=c.createGain(),now=c.currentTime;source.type='sine';source.frequency.setValueAtTime(S.night?1450:1900,now);source.frequency.exponentialRampToValueAtTime(S.night?1050:2900,now+.1);source.frequency.exponentialRampToValueAtTime(1500,now+.22);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,S.fx.volume*S.fx.mapVolume*.045),now+.03);gain.gain.exponentialRampToValueAtTime(.0001,now+.24);source.connect(gain);gain.connect(c.destination);this.effects.add(source);source.onended=()=>{source.disconnect();gain.disconnect();this.effects.delete(source)};source.start(now);source.stop(now+.25)},
  stopEffects(){for(const source of this.effects)try{source.stop()}catch{}this.effects.clear()},
  stopAmbient(){clearInterval(this.birdTimer);this.birdTimer=0;if(this.ambient){for(const node of Object.values(this.ambient))try{node.stop?.();node.disconnect()}catch{}this.ambient=null}},
};
const AutoFullscreen={requested:false,enter(){if(this.requested||document.fullscreenElement||!document.documentElement.requestFullscreen)return;this.requested=true;try{Promise.resolve(document.documentElement.requestFullscreen({navigationUI:'hide'})).then(()=>Preferences.orient()).catch(()=>{this.requested=false})}catch{this.requested=false}}};
document.addEventListener('pointerdown',event=>{if(!event.isTrusted)return;GameAudio.activate();AutoFullscreen.enter()},{capture:true,passive:true});
document.addEventListener('keydown',event=>{if(!event.isTrusted||event.repeat)return;GameAudio.activate();AutoFullscreen.enter()},{capture:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){GameAudio.stopAmbient();GameAudio.stopEffects()}else GameAudio.sync()});
addEventListener('pagehide',()=>{GameAudio.stopAmbient();GameAudio.stopEffects()});
setInterval(()=>GameAudio.nearbyAnimal(),8500);
document.addEventListener('click',event=>{if(event.target.closest('button,.item,.avatar-ring'))GameAudio.play('tap')});
