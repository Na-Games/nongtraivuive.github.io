import fs from 'node:fs';
let ui=fs.readFileSync('ui.js','utf8');
ui=ui.replace("['🖼','Thư viện PNG',openArtLibrary]","['🖼','Thư viện PNG',openArtLibrary],['🦋','Xem chuyển động',()=>window.open('chuyen-dong.html','_blank','noopener')]");
fs.writeFileSync('ui.js',ui);
let preview=fs.readFileSync('chuyen-dong.html','utf8');preview=preview.replace("phase,x,y,155,{flipScale:flip}","phase,x,y,mode==='fish'?85:mode==='work'?125:155,{flipScale:flip}");fs.writeFileSync('chuyen-dong.html',preview);
