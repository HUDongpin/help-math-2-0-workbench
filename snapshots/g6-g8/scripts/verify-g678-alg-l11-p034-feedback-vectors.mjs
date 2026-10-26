#!/usr/bin/env node
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
import {G678_ALG_L11_P034_SOURCE_FEEDBACK as SOURCE} from '../packages/demos/src/generated/g678-alg-l11-p034-feedback-v1.ts';
const OUT='work/g678-shared-page-factory/g678-alg-l11-p034-feedback-vector-verification-v1';
await mkdir(OUT);const sha=b=>createHash('sha256').update(b).digest('hex');const records=[],cells=[];
for(const item of SOURCE.feedback)for(const frame of item.frames){
  const raw=await readFile(frame.source.path);assert.equal(sha(raw),frame.source.sha256);assert.equal(sha(frame.svg),frame.sha256);
  const a=await sharp(raw).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const b=await sharp(Buffer.from(frame.svg)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.deepEqual(a.info,b.info);assert.deepEqual(a.data,b.data,`source raster mismatch ${item.characterId}:${frame.frame}`);
  records.push({characterId:item.characterId,frame:frame.frame,source:frame.source,normalizedSha256:frame.sha256,
    rasterBytes:a.data.length,rasterSha256:sha(a.data),rasterExact:true});
  const thumbnail=await sharp(Buffer.from(frame.svg)).resize(160,110,{fit:'contain',background:'#ffffff'}).png().toBuffer();
  const label=Buffer.from(`<svg width="160" height="24"><rect width="160" height="24" fill="white"/><text x="4" y="16" font-family="sans-serif" font-size="12">${item.characterId}:${frame.frame}</text></svg>`);
  const idx=cells.length/2;cells.push({input:thumbnail,left:(idx%8)*160,top:Math.floor(idx/8)*134+24},{input:label,left:(idx%8)*160,top:Math.floor(idx/8)*134});
}
const sheet=await sharp({create:{width:1280,height:Math.ceil(records.length/8)*134,channels:4,background:'#ffffff'}}).composite(cells).png().toBuffer();
await writeFile(path.join(OUT,'contact-sheet.png'),sheet,{flag:'wx'});
const report={artifactType:'p034-source-svg-normalization-raster-check',frames:55,records,
  contactSheet:{path:`${OUT}/contact-sheet.png`,bytes:sheet.length,sha256:sha(sheet)},originalRuntime:false,
  visualFidelityAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false};
await writeFile(path.join(OUT,'verification.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({frames:55,rasterExact:true,output:OUT}));
