#!/usr/bin/env node
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {G678_ALG_L11_P033_INSTRUCTIONAL_SEQUENCE as SOURCE} from '../packages/demos/src/generated/g678-alg-l11-p033-instructional-sequence-v1.ts';
import {algL11P033FrameSvg,algL11P033ControlBounds} from '../packages/demos/src/g678-alg-l11-p033-instructional-candidate.tsx';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'work/g678-shared-page-factory/g678-alg-l11-p033-instructional-vector-inspection-v1');
await mkdir(OUT);
const hash=b=>createHash('sha256').update(b).digest('hex');
const excluded=new Set(['mcRepeat','mcSkip','mcL1','mcL2','mcStart','Mc_Msg','Mc_Popup','txtScore',
  ...['RT','AT','ST','IRT','IT','ET'].flatMap(t=>[`Mc${t}_Img1`,`Mc${t}_Img2`])]);
const selected=new Set([1,7,11,30,60,90,120,187,250,300,350,400,500,604,605,606]);
const results=[];const images=[];
for(let frame=1;frame<=606;frame++){
  let expected=await readFile(path.join(ROOT,`work/g678-shared-page-factory/g678-alg-l11-p033-instructional-sequence-v1/DefineSprite_116/${frame}.svg`),'utf8');
  expected=expected.replace(/<use\b[^>]*\/>/g,use=>excluded.has(use.match(/\bid="([^"]*)"/)?.[1])?'':use)
    .replace(/<svg\b[^>]*>/,tag=>tag.replace(/\bwidth="[^"]*"/,'width="800"').replace(/\bheight="[^"]*"/,'height="600"').replace(/>$/,' viewBox="0 0 800 600">'))
    .replace(/<g transform="[^"]*">/,'<g transform="translate(412.4 283.3)">');
  const actualSvg=algL11P033FrameSvg(frame);
  const [a,b]=await Promise.all([sharp(Buffer.from(actualSvg)).ensureAlpha().raw().toBuffer(),sharp(Buffer.from(expected)).ensureAlpha().raw().toBuffer()]);
  assert.equal(a.length,800*600*4);assert.ok(a.equals(b),`frame ${frame}: vector compiler changed source-rendered pixels`);
  results.push({frame,sourceNormalizedRasterSha256:hash(b),compiledRasterSha256:hash(a),identical:true});
  if(selected.has(frame)){
    const layers=[];
    for(const placement of SOURCE.frames[frame-1].controlPlacements){
      const art=SOURCE.controls[placement.characterId][0];const pos=algL11P033ControlBounds(placement,art);
      const rendered=await sharp(Buffer.from(art.svg)).resize(Math.round(pos.width),Math.round(pos.height)).png().toBuffer();
      layers.push({input:rendered,left:Math.round(pos.x),top:Math.round(pos.y)});
    }
    const png=await sharp(Buffer.from(actualSvg)).flatten({background:'white'}).composite(layers).png().toBuffer();
    await writeFile(path.join(OUT,`frame-${String(frame).padStart(3,'0')}.png`),png,{flag:'wx'});
    const label=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="28"><rect width="400" height="28" fill="#cbdff4"/><text x="10" y="20" font-size="16">Source main frame ${frame} / 606</text></svg>`);
    const thumb=await sharp(png).resize(400,300).extend({top:28,bottom:0,left:0,right:0,background:'white'}).composite([{input:label,left:0,top:0}]).png().toBuffer();
    images.push(thumb);
  }
}
for(let sheet=0;sheet<4;sheet++){
  const layers=images.slice(sheet*4,sheet*4+4).map((input,i)=>({input,left:(i%2)*410,top:Math.floor(i/2)*338}));
  const png=await sharp({create:{width:810,height:666,channels:4,background:'#a9bed4'}}).composite(layers).png().toBuffer();
  await writeFile(path.join(OUT,`sequence-sheet-${sheet+1}.png`),png,{flag:'wx'});
}
await writeFile(path.join(OUT,'verification.json'),JSON.stringify({schemaVersion:1,
  builderSha256:hash(await readFile(fileURLToPath(import.meta.url))),
  generatedSha256:hash(await readFile(path.join(ROOT,'packages/demos/src/generated/g678-alg-l11-p033-instructional-sequence-v1.ts'))),
  frameCount:606,identicalCount:results.filter(r=>r.identical).length,results,
  boundary:'Exact raster identity verifies the static source-vector normalization only, with script-hidden instances and maintained controls excluded; it is not original-runtime or browser evidence.',
  browserQa:false,originalRuntime:false,visualFidelityAccepted:false,audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,released:false,published:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output:OUT,frameCount:606,identicalCount:606}));
