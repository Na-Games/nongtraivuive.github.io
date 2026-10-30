import fs from 'node:fs';
fs.mkdirSync('docs/before-motion',{recursive:true});
for(const f of ['game.js','art.js','ui.js','index.html','thu-vien-anh.html','README.md'])if(!fs.existsSync('docs/before-motion/'+f))fs.copyFileSync(f,'docs/before-motion/'+f);
const builder=fs.readFileSync('tools/build-assets.mjs','utf8');
fs.writeFileSync('tools/png-codec.mjs',builder.slice(0,builder.indexOf('const jobs='))+'\nexport {decode,encode};\n');
