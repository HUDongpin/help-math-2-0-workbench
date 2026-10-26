#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,readFile,readdir,lstat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const RAW='work/g678-shared-page-factory/g678-alg-l11-p034-source-reveal-v2';
const OUT='packages/demos/src/generated/g678-alg-l11-p034-source-reveal-v1.ts';
const BASE='work/g678-shared-page-factory/g678-alg-l11-residual-routing-audit-v1/shared-alg001-l11-p034';
const PARSER='scripts/g678-alg-l11-p034-reveal-source.py';
const FFDEC='/Users/peter/Applications/FFDec.app/Contents/Resources/ffdec.sh';
const hash=b=>createHash('sha256').update(b).digest('hex');
const attr=(s,n)=>s.match(new RegExp(`(?:^|\\s)${n}="([^"]*)"`))?.[1];
const desc=({buffer:_buffer,...rest})=>rest;
async function file(p){const full=path.isAbsolute(p)?p:path.join(ROOT,p);const b=await readFile(full);const s=await lstat(full);assert.ok(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1);return{path:p,bytes:b.length,sha256:hash(b),buffer:b};}

export function sourceBitmapSvg(svg,namespace,bitmaps){
  assert.ok(!/<(?:script|foreignObject|animate|set)\b|\bon\w+=|<!DOCTYPE|<!ENTITY/i.test(svg));
  svg=svg.replace(/<\?xml[^>]*>\s*/g,'');
  const opening=svg.match(/<svg\b[^>]*>/)[0];const width=parseFloat(attr(opening,'width')),height=parseFloat(attr(opening,'height'));
  assert.ok(width>0&&height>0);
  const bitmapBindings=[];
  for(const image of svg.matchAll(/<image\b[^>]*\/>/g)){
    const href=attr(image[0],'xlink:href')??attr(image[0],'href');
    assert.ok(/^data:image\/(?:png|JPEG);base64,[A-Za-z0-9+/=]+$/.test(href),'unsupported source bitmap encoding');
    const buffer=Buffer.from(href.split(',')[1],'base64');
    assert.ok(href.startsWith('data:image/png')?buffer.subarray(0,8).toString('hex')==='89504e470d0a1a0a':buffer.subarray(0,3).toString('hex')==='ffd8ff');
    const sha256=hash(buffer);bitmapBindings.push({bytes:buffer.length,sha256});
    if(bitmaps[sha256])assert.equal(bitmaps[sha256],href);else bitmaps[sha256]=href;
  }
  assert.ok(bitmapBindings.length>0);
  for(const reference of svg.matchAll(/(?:xlink:href|href)="([^"]+)"/g))assert.ok(reference[1].startsWith('#')||/^data:image\/(?:png|JPEG);base64,/.test(reference[1]));
  assert.ok(!/<style\b/.test(svg));
  svg=svg.replace(/\bid="([^"]*)"/g,(_,id)=>`id="${namespace}-${id}"`)
    .replace(/(xlink:href|href)="#([^"]*)"/g,(_,a,id)=>`${a}="#${namespace}-${id}"`)
    .replace(/url\(#([^)]*)\)/g,(_,id)=>`url(#${namespace}-${id})`)
    .replace(/<svg\b[^>]*>/,tag=>tag.replace(/>$/,` viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false" style="display:block;width:100%;height:auto">`));
  const sha256=hash(svg);
  for(const binding of bitmapBindings)svg=svg.replaceAll(bitmaps[binding.sha256],`G678_SOURCE_BITMAP_${binding.sha256}`);
  return{svg,width,height,bitmapBindings,sha256};
}

export async function build({check=false}={}){
  const sourceXml=await file(`${BASE}/source.xml`);assert.equal(sourceXml.sha256,'25d66465e54bffe8065ea812cbb606f6212c64869a6716eacdabbdf6231e4ee5');
  const mappings=JSON.parse((await promisify(execFile)('python3',[PARSER,sourceXml.path],{cwd:ROOT})).stdout);
  const images=mappings.filter(m=>/_Img[12]$/.test(m.name));assert.equal(images.length,24);
  const rawRoot=path.join(ROOT,RAW);
  if(!check){
    const sourceRoot=process.env.HELP_MATH_G678_SOURCE_ROOT;assert.ok(sourceRoot&&path.isAbsolute(sourceRoot));
    const source=path.join(sourceRoot,'G6-G8-shared/ALG001/L11/GS/L11GS03.swf');const input=await file(source);
    assert.equal(input.sha256,'77b4d2a8ee13325bd527f558751ac84e60d1de36d1ff258cb6569f36885ad06c');
    assert.equal((await lstat(source)).mode&0o222,0);
    const tools={launcher:desc(await file(FFDEC)),jar:desc(await file(path.join(path.dirname(FFDEC),'ffdec.jar')))};
    assert.equal(tools.launcher.sha256,'1a242c6333aa8dba0f18f635f9ea2585a988f4131aa5164b70eb00ad9e662bab');
    assert.equal(tools.jar.sha256,'090ab695053ad94cba6408574c7d7eea20ec60b6ae789ee6056a23f45106762f');
    await mkdir(rawRoot);
    const ids=images.map(m=>m.characterId);
    const args=['-onerror','abort','-format','sprite:svg','-selectid',ids.join(','),'-select',ids.map(id=>`${id}:1`).join(','),'-export','sprite',rawRoot,source];
    const result=await promisify(execFile)(FFDEC,args,{encoding:'buffer',maxBuffer:8*1024*1024}).catch(async error=>{
      await writeFile(path.join(rawRoot,'failed-stderr.txt'),error.stderr??'',{flag:'wx'});throw error;});
    await writeFile(path.join(rawRoot,'stdout.txt'),result.stdout,{flag:'wx'});await writeFile(path.join(rawRoot,'stderr.txt'),result.stderr,{flag:'wx'});assert.equal(result.stderr.length,0);
    await writeFile(path.join(rawRoot,'extraction.json'),JSON.stringify({source:{...desc(input),path:'G6-G8-shared/ALG001/L11/GS/L11GS03.swf'},tools,
      command:[FFDEC,...args.map(a=>a===source?'<hash-bound-source>':a===rawRoot?'<exclusive-run-root>':a)]},null,2)+'\n',{flag:'wx'});
  }
  const tiles=[];const bitmaps={};
  for(const image of images){
    const candidates=mappings.filter(m=>m.level===image.level&&/^Mc[1-6]_[12]$/.test(m.name));
    const x=Number(image.transform.transX),y=Number(image.transform.transY);
    const nearest=candidates.map(card=>({card,distance:Math.hypot(Number(card.transform.transX)-x,Number(card.transform.transY)-y)})).sort((a,b)=>a.distance-b.distance);
    assert.ok(nearest[0].distance<40&&nearest[1].distance>1000,'source tile/card geometry is ambiguous');
    const card=nearest[0].card;assert.equal(card.name.match(/^Mc([1-6])_/)[1],image.name.match(/^Mc([1-6])_/)[1]);
    const input=await file(`${RAW}/DefineSprite_${image.characterId}/1.svg`);
    tiles.push({level:image.level,sourceFrame:image.frame,sourceInstanceName:image.name,sourceCharacterId:image.characterId,
      cardId:`level-${card.level}-${card.name}`,cardSourceInstanceName:card.name,
      pairId:Number(card.name.match(/^Mc([1-6])_/)[1]),sourcePosition:{x:x/20,y:y/20},
      cardSourcePosition:{x:Number(card.transform.transX)/20,y:Number(card.transform.transY)/20},
      sourceSvg:desc(input),visual:sourceBitmapSvg(input.buffer.toString(),`d-p034-reveal-${image.level}-${image.name.toLowerCase().replaceAll('_','-')}`,bitmaps)});
  }
  assert.equal(new Set(tiles.map(t=>t.cardId)).size,24);
  const data={schemaVersion:1,tiles,bitmaps,sourceXmlSha256:sourceXml.sha256,
    revealDisposition:'A correct pair reveals both source image tiles at their authored card cells. Source tile suffix is not treated as a cell identity.',
    audioImplemented:false,sourceFadeTimingImplemented:false,
    gates:{currentJavaScriptRegistered:false,productCalibrationPassed:false,authoritativeOriginalRuntime:false,visualFidelityAccepted:false,audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,released:false,published:false}};
  const generated='// Generated source bitmap tiles inside their authored SVG layers. Do not hand edit.\nexport const G678_ALG_L11_P034_SOURCE_REVEAL = '+JSON.stringify(data)+' as const;\n';
  const manifest={schemaVersion:1,builder:desc(await file(path.relative(ROOT,fileURLToPath(import.meta.url)))),parser:desc(await file(PARSER)),
    sourceXml:desc(sourceXml),extraction:desc(await file(`${RAW}/extraction.json`)),
    generated:{path:OUT,bytes:Buffer.byteLength(generated),sha256:hash(generated)},tileCount:24,gates:data.gates};
  if(check){assert.equal(await readFile(path.join(ROOT,OUT),'utf8'),generated);assert.equal(await readFile(path.join(rawRoot,'run.json'),'utf8'),JSON.stringify(manifest,null,2)+'\n');}
  else{await writeFile(path.join(ROOT,OUT),generated,{flag:'wx'});await writeFile(path.join(rawRoot,'run.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});}
  console.log(JSON.stringify({check,tiles:24,generated:manifest.generated}));return data;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await build({check:process.argv.includes('--check')});
