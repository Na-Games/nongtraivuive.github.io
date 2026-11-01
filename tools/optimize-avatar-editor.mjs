import fs from 'node:fs';
const edit=(file,from,to)=>{const s=fs.readFileSync(file,'utf8');if(!s.includes(from))throw Error('Missing anchor '+file);fs.writeFileSync(file,s.replace(from,to))};
edit('ui.js',"let previewMode='idle',previewAngle=0;", "let previewMode='idle',previewAngle=0,redrawFrame=0;");
edit('ui.js',";drawHudAvatar()};\n    const poseBar", ";};\n    const scheduleRedraw=()=>{if(redrawFrame)return;redrawFrame=requestAnimationFrame(()=>{redrawFrame=0;if(body.isConnected){redraw();drawHudAvatar()}})};\n    const poseBar");
edit('ui.js','save();redraw();clearTimeout(previewTimer);', 'save();scheduleRedraw();clearTimeout(previewTimer);');
edit('ui.js','previewAngle=Number(rotate.value)*Math.PI/180;redraw()', 'previewAngle=Number(rotate.value)*Math.PI/180;scheduleRedraw()');
edit('ui.js',"if(!document.hidden&&sheetKey==='avatar')redraw()", "if(!redrawFrame&&!document.hidden&&sheetKey==='avatar')redraw()");
edit('avatar-3d.js',"optionIcon(a,key,size=64){const full=", "optionIcon(a,key,size=64){this.optionCache??=new Map();const cacheKey=this.signature(a)+'|'+key+'|'+size;if(this.optionCache.has(cacheKey))return this.optionCache.get(cacheKey).cloneNode(true);const full=");
// Cached canvases must copy their pixel data when reused in a different DOM node.
edit('avatar-3d.js',"if(this.optionCache.has(cacheKey))return this.optionCache.get(cacheKey).cloneNode(true);", "if(this.optionCache.has(cacheKey)){const cached=this.optionCache.get(cacheKey),copy=document.createElement('canvas');copy.width=copy.height=size;copy.getContext('2d').drawImage(cached,0,0);return copy}");
edit('avatar-3d.js',"c.drawImage(full,55,4,210,210,0,0,size,size);return cv", "c.drawImage(full,55,4,210,210,0,0,size,size);this.optionCache.set(cacheKey,cv);if(this.optionCache.size>96)this.optionCache.delete(this.optionCache.keys().next().value);return cv");
console.log('Editor coalesces updates per animation frame; preview thumbnails are cached');
