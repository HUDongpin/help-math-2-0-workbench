#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat,mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {directElements,sanitizeSvg} from './build-g678-alg-l11-tranche-d-instructional-visuals.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const RAW='work/g678-shared-page-factory/g678-alg-l11-p033-instructional-sequence-v1';
const BASE='work/g678-shared-page-factory/g678-alg-l11-residual-routing-audit-v1/shared-alg001-l11-p033';
const OUT='packages/demos/src/generated/g678-alg-l11-p033-instructional-sequence-v1.ts';
const RUN='work/g678-shared-page-factory/g678-alg-l11-p033-instructional-sequence-generated-v1';
const PARSER='scripts/g678-alg-l11-p033-instructional-source.py';
const hash=b=>createHash('sha256').update(b).digest('hex');
const attr=(s,n)=>s.match(new RegExp(`(?:^|\\s)${n}="([^"]*)"`))?.[1];
const desc=({buffer:_buffer,...rest})=>rest;
async function file(p){const b=await readFile(path.join(ROOT,p));const s=await lstat(path.join(ROOT,p));assert.ok(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1);return{path:p,bytes:b.length,sha256:hash(b),buffer:b};}
const CONTROL_NAMES=new Set(['mcRepeat','mcSkip','mcL1','mcL2','mcStart']);
const HIDDEN_NAMES=new Set(['Mc_Msg','Mc_Popup', ...['RT','AT','ST','IRT','IT','ET'].flatMap(t=>[`Mc${t}_Img1`,`Mc${t}_Img2`])]);
const EMPTY_SOURCE_TEXT_NAMES=new Set(['txtScore']);
const SCRIPT_PATHS=[
  'DefineSprite_116/frame_1/DoAction.as','DefineSprite_116/frame_605/DoAction.as',
  'DefineSprite_67/frame_1/DoAction.as','DefineButton2_23/BUTTONCONDACTION on(release).as',
  'DefineSprite_116/frame_1/PlaceObject2_39_11/CLIPACTIONRECORD on(release).as',
  'DefineSprite_116/frame_7/PlaceObject2_39_35/CLIPACTIONRECORD on(release).as',
  'DefineSprite_116/frame_605/PlaceObject2_115_32/CLIPACTIONRECORD on(release).as',
  'DefineSprite_116/frame_1/PlaceObject2_56_24/CLIPACTIONRECORD on(release).as',
  'DefineSprite_116/frame_605/PlaceObject2_56_43/CLIPACTIONRECORD on(release).as',
];

export function splitSvg(svg){
  assert.ok(!/<(?:script|image|foreignObject|animate|set)\b|\bon\w+=|<!DOCTYPE|<!ENTITY/i.test(svg));
  const root=svg.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/);assert.ok(root);
  const children=directElements(root[1]);assert.equal(children.length,2);
  assert.ok(children[0].startsWith('<g ')&&children[1].startsWith('<defs>'));
  return{opening:svg.match(/<svg\b[^>]*>/)[0],group:children[0],defs:children[1].slice(6,-7)};
}

export function createVectorPool(){
  const pool=new Map();
  const replaceRefs=(value,resolve)=>value.replace(/(xlink:href|href)="#([^"]+)"/g,(_,a,id)=>`${a}="#${resolve(id)}"`)
    .replace(/url\(#([^)]*)\)/g,(_,id)=>`url(#${resolve(id)})`);
  return{pool,add(svg){
    let{group,defs}=splitSvg(svg);
    defs=defs.replace(/<style>([\s\S]*?)<\/style>/g,(_,css)=>{assert.equal(hash(css),'4356dcc5c41c0bdef3e4450bf1e9daf8ff013cd07078c69cee8e495ccc2cb7b1');return'';});
    const clips=[];
    group=group.replace(/<clipPath\b[^>]*>[\s\S]*?<\/clipPath>/g,c=>{clips.push(c);return'';});
    const nodes=directElements(defs).concat(clips);
    const byId=new Map(nodes.map(n=>[attr(n,'id'),n]));assert.equal(byId.size,nodes.length);assert.ok(!byId.has(undefined));
    const resolved=new Map();const visiting=new Set();
    function resolve(id){
      if(resolved.has(id))return resolved.get(id);
      assert.ok(byId.has(id)&&!visiting.has(id),`unresolved or cyclic SVG ID ${id}`);visiting.add(id);
      let n=byId.get(id);
      n=n.replace(/<use\b[^>]*\/>/g,u=>HIDDEN_NAMES.has(attr(u,'id'))||EMPTY_SOURCE_TEXT_NAMES.has(attr(u,'id'))?'':u)
        .replace(/(<g class="button-frame button-frame-(?:over|down|hittest)"[^>]*)(>)/g,'$1 style="display:none"$2');
      n=replaceRefs(n,resolve).replace(/\s+id="[^"]*"/g,'');
      const next='d-p033-'+hash(n).slice(0,24);
      const definition=n.replace(/^(<[A-Za-z][\w:.-]*)/,'$1 id="'+next+'"');
      if(pool.has(next))assert.equal(pool.get(next),definition);else pool.set(next,definition);
      resolved.set(id,next);visiting.delete(id);return next;
    }
    group=group.replace(/<use\b[^>]*\/>/g,u=>CONTROL_NAMES.has(attr(u,'id'))||HIDDEN_NAMES.has(attr(u,'id'))?'':u);
    group=replaceRefs(group,resolve).replace(/\s+id="[^"]*"/g,'');
    group=group.replace(/^<g transform="[^"]*">/,'<g transform="translate(412.4 283.3)">');
    return group;
  }};
}

export async function build({check=false}={}){
  const receipt=await file(`${RAW}/extraction.json`);const raw=JSON.parse(receipt.buffer);
  assert.equal(raw.builder.sha256,(await file(raw.builder.path)).sha256);
  const audit=await file('catalog/g678-alg-l11-advanced3-tranche-d-audit-v1.json');assert.equal(audit.sha256,'03e9ba9bb7af3baa2df8bc1792834bd74ca502a56bc041f3a8860dc51dffec42');
  const sourceXml=await file(`${BASE}/source.xml`);assert.equal(sourceXml.sha256,'1b973f677031958d2c7b587a2aa9237379daae9e7e4e972758888c15905992a8');
  assert.ok(!sourceXml.buffer.toString().match(/<DefineEditText objectID="31"[^>]*>([\s\S]*?)<\/DefineEditText>/)[1].includes('<text>'),'source txtScore is no longer empty');
  assert.match(sourceXml.buffer.toString(),/<PlaceObject2[^>]*objectID="116"[^>]*name="animation">\s*<transform>\s*<Transform transX="8248" transY="5666"/);
  const facts=JSON.parse((await promisify(execFile)('python3',[PARSER,sourceXml.path],{cwd:ROOT,maxBuffer:8*1024*1024})).stdout);
  assert.equal(facts.frames.find(f=>f.label==='RepeatDirection').frame,11);
  assert.equal(facts.frames.find(f=>f.label==='SelectLevel').frame,605);
  const scripts=[];
  for(const p of SCRIPT_PATHS)scripts.push(await file(`${BASE}/ffdec-export/scripts/${p}`));
  assert.match(scripts[0].buffer.toString(),/Mc_Msg\._visible = false/);
  assert.match(scripts[1].buffer.toString(),/stop\(\);\s*Mc_Popup\._visible = false/);
  assert.equal([...scripts[2].buffer.toString().matchAll(/Mc\w+_Img[12]\._visible = false/g)].length,12);
  assert.match(scripts[4].buffer.toString(),/gotoAndPlay\("RepeatDirection"\)/);
  assert.match(scripts[5].buffer.toString(),/gotoAndStop\("SelectLevel"\)/);
  const vectorPool=createVectorPool();const frames=[];const rawFiles=[];
  const controls={};
  for(const entry of raw.files){const actual=await file(`${RAW}/${entry.path}`);assert.equal(actual.sha256,entry.sha256);assert.equal(actual.bytes,entry.bytes);}
  for(let frame=1;frame<=606;frame++){
    const input=await file(`${RAW}/DefineSprite_116/${frame}.svg`);rawFiles.push(desc(input));
    const svg=input.buffer.toString();const parts=splitSvg(svg);
    const uses=[...parts.group.matchAll(/<use\b[^>]*\/>/g)].map(m=>m[0]);
    const expected=facts.frames[frame-1].placements.filter(p=>!p.clipDepth);
    assert.deepEqual(uses.map(u=>({id:Number(attr(u,'ffdec:characterId')),name:attr(u,'id')??null})),expected.map(p=>({id:Number(p.objectID),name:p.name??null})),`frame ${frame} source placement mismatch`);
    const controlPlacements=uses.filter(u=>CONTROL_NAMES.has(attr(u,'id'))).map(u=>({name:attr(u,'id'),
      characterId:Number(attr(u,'ffdec:characterId')),transform:attr(u,'transform')}));
    const group=vectorPool.add(svg);
    frames.push({frame,label:facts.frames[frame-1].label,group,sha256:hash(group),controlPlacements});
  }
  for(const id of[39,46,50,56,115,24,59]){
    const states=[];
    for(let frame=1;frame<=(id===24||id===59?1:3);frame++){
      const input=await file(`${RAW}/DefineSprite_${id}/${frame}.svg`);const svg=input.buffer.toString();
      const{opening,group}=splitSvg(svg);const width=parseFloat(attr(opening,'width'));const height=parseFloat(attr(opening,'height'));
      const svgNormalized=sanitizeSvg(svg.replace(opening,opening.replace(/>$/,` viewBox="0 0 ${width} ${height}">`)),`d-p033-control-${id}-${frame}`);
      const matrix=attr(group,'transform').match(/matrix\(([^)]*)\)/)[1].split(',').map(Number);
      states.push({frame,width,height,offsetX:matrix[4],offsetY:matrix[5],svg:svgNormalized,sha256:hash(svgNormalized),source:desc(input)});
    }
    controls[id]=states;
  }
  const definitions=[...vectorPool.pool.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([,v])=>v).join('\n');
  const data={schemaVersion:1,frameDomain:'sprite-116',sourceMainFrameCount:606,sourceRootFrameCount:10,
    rootPlacement:{frame:6,x:412.4,y:283.3},stage:{width:800,height:600},fps:12,
    terminalStopFrame:605,repeatDirectionFrame:11,definitions,frames,controls,
    suppressedScriptHiddenInstances:[...HIDDEN_NAMES],emptySourceTextInstances:[...EMPTY_SOURCE_TEXT_NAMES],maintainedNestedControlSpriteIds:[39,46,50,56,115],gates:raw.gates};
  const generated='// Generated by build-g678-alg-l11-p033-instructional-sequence.mjs. Do not hand edit.\nexport const G678_ALG_L11_P033_INSTRUCTIONAL_SEQUENCE = '+JSON.stringify(data)+' as const;\n';
  const manifest={schemaVersion:1,builder:desc(await file(path.relative(ROOT,fileURLToPath(import.meta.url)))),
    parser:desc(await file(PARSER)),sharedSvgCompiler:desc(await file('scripts/build-g678-alg-l11-tranche-d-instructional-visuals.mjs')),
    extraction:desc(receipt),sourceAudit:desc(audit),sourceXml:desc(sourceXml),scripts:scripts.map(desc),
    rawFrames:rawFiles,frameCount:606,sourceTerminalStopFrame:605,uniqueDefinitionCount:vectorPool.pool.size,
    generated:{path:OUT,bytes:Buffer.byteLength(generated),sha256:hash(generated)},gates:raw.gates,
    runtimeDisposition:'source masks, transforms, glyphs, and main frames retained; source-stopped nested control sprites are maintained separately; source _visible=false instances are suppressed'};
  if(check){assert.equal(await readFile(path.join(ROOT,OUT),'utf8'),generated);assert.equal(await readFile(path.join(ROOT,RUN,'run.json'),'utf8'),JSON.stringify(manifest,null,2)+'\n');}
  else{await mkdir(path.join(ROOT,RUN));await writeFile(path.join(ROOT,OUT),generated,{flag:'wx'});await writeFile(path.join(ROOT,RUN,'run.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});}
  console.log(JSON.stringify({check,frames:606,definitions:vectorPool.pool.size,generated:manifest.generated}));return{data,manifest};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await build({check:process.argv.includes('--check')});
