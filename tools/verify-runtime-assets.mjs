import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync('index.html','utf8');
const paths=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(p=>!p.startsWith('http')&&!p.startsWith('#'));
for(const file of paths)assert.ok(fs.existsSync(file),'Missing HTML asset '+file);
for(const file of fs.readdirSync('.').filter(f=>f.endsWith('.js')))new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});
let sprites=0;for(const file of ['assets/manifest.json','assets/motion/manifest.json']){const m=JSON.parse(fs.readFileSync(file,'utf8'));for(const s of Object.values(m.sprites||m.frames)){assert.ok(fs.existsSync(s.file),'Missing PNG '+s.file);sprites++}for(const s of Object.values(m.sheets||{}))assert.ok(fs.existsSync(s.file),'Missing sheet '+s.file)}
const art=JSON.parse(fs.readFileSync('docs/playability-art.json','utf8'));for(const file of [...art.files,...art.plotFiles,...art.wideFishingFiles])assert.ok(fs.existsSync(file),'Missing new art '+file);
console.log('PASS '+paths.length+' HTML dependencies, '+sprites+' PNGs, new artwork paths and all root JavaScript syntax');
