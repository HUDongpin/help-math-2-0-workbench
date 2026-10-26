#!/usr/bin/env node
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {G678_ALG_L11_D_INSTRUCTIONAL_VISUALS as DATA} from '../packages/demos/src/generated/g678-alg-l11-tranche-d-instructional-visuals-v1.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, 'work/g678-shared-page-factory/g678-alg-l11-tranche-d-instructional-inspection-v1');
await mkdir(OUTPUT);
const files = [];
async function save(name, buffer) {
  await writeFile(path.join(OUTPUT,name), buffer, {flag:'wx'});
  files.push({path:name, bytes:buffer.length, sha256:createHash('sha256').update(buffer).digest('hex')});
}
function label(text, width, height=35) {return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#daeafa"/><text x="10" y="24" font-size="18" fill="#173a5e">${text}</text></svg>`);}
const thumbs = [];
for (const question of DATA.questions) {
  let top=45; const layers=[{input:label(`Q${question.number} · source option ${question.correctOption} is keyed correct`,760),left:0,top:0}];
  for (const visual of [question.prompt,...question.choices.map(c=>c.visual)]) {
    const width=Math.min(720, Math.round(visual.width));
    const {data,info}=await sharp(Buffer.from(visual.svg)).resize({width}).png().toBuffer({resolveWithObject:true});
    layers.push({input:data,left:20,top});top+=info.height+18;
  }
  const image=await sharp({create:{width:760,height:top,channels:4,background:'white'}}).composite(layers).png().toBuffer();
  await save(`q${String(question.number).padStart(2,'0')}.png`,image);
  thumbs.push(await sharp(image).resize({width:380,height:300,fit:'contain',background:'white'}).png().toBuffer());
}
for(let sheet=0;sheet<4;sheet++){
  const layers=thumbs.slice(sheet*6,sheet*6+6).map((input,index)=>({input,left:(index%2)*390,top:Math.floor(index/2)*310}));
  await save(`questions-${sheet*6+1}-${sheet*6+6}.png`,await sharp({create:{width:780,height:930,channels:4,background:'#b9cce0'}}).composite(layers).png().toBuffer());
}
for(const level of [1,2]){
  const cards=DATA.cards.filter(card=>card.level===level);const layers=[];
  for(let i=0;i<cards.length;i++){
    const card=cards[i];const image=await sharp(Buffer.from(card.visual.svg)).resize({width:280,height:110,fit:'contain',background:'white'}).png().toBuffer();
    layers.push({input:image,left:(i%3)*290,top:35+Math.floor(i/3)*150});
    layers.push({input:label(`${card.sourceInstanceName} · pair ${card.pairId}`,280),left:(i%3)*290,top:Math.floor(i/3)*150});
  }
  await save(`matching-level-${level}.png`,await sharp({create:{width:870,height:600,channels:4,background:'#b9cce0'}}).composite(layers).png().toBuffer());
}
const builder=await readFile(fileURLToPath(import.meta.url));
await writeFile(path.join(OUTPUT,'inspection.json'), JSON.stringify({type:'offline-vector-raster-inspection-only',
  browserQa:false,originalRuntime:false,acceptance:false,builderSha256:createHash('sha256').update(builder).digest('hex'),
  sourceGeneratedSha256:createHash('sha256').update(await readFile(path.join(ROOT,'packages/demos/src/generated/g678-alg-l11-tranche-d-instructional-visuals-v1.ts'))).digest('hex'),
  files},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output:OUTPUT,files:files.length}));
