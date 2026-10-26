#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SOURCE='G6-G8-shared/NMS002/L1/TS/L1TS08.swf';
const SWF_SHA='8ad8df775eff49a3763f67e95fba4ed211e34912bd63f6602078119240fe6c76';
const XML='work/g678-shared-page-factory/g678-nms-l01-p044-source-audit-v2/ffdec-source.xml';
const PLACEMENTS='work/g678-shared-page-factory/g678-nms-l01-p044-source-canvas-v1/source-instance-placements.json';
const TEXT_ROOT='work/g678-shared-page-factory/g678-nms-l01-p044-source-audit-v1/export/texts';
const TS='packages/demos/src/generated/g678-nms-l01-p044-readable-instruction-v1.ts';
const MANIFEST='catalog/g678-nms-l01-p044-readable-instruction-v1.json';
const SELF='scripts/build-g678-nms-l01-p044-readable-instruction.mjs';
const TEST='scripts/build-g678-nms-l01-p044-readable-instruction.test.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
async function read(p,expected){const bytes=await readFile(path.resolve(ROOT,p));if(expected)assert.equal(hash(bytes),expected,p);return {bytes,binding:{path:p,bytes:bytes.length,sha256:hash(bytes)}};}
export function literal(raw){assert.ok(!raw.includes('\0'));return raw.replaceAll('--- RECORDSEPARATOR ---','').replace(/\s+/g,' ').trim();}
export function compileInstruction(text,placements){
  const selected=(domain,id)=>placements.filter(p=>p.parentDomain===domain&&p.sourceObjectId===id);
  const requireAt=(id,frame,count=1)=>{const rows=selected('sprite-293',id);assert.equal(rows.length,count);assert.ok(rows.every(p=>p.placementFrame===frame));return frame;};
  assert.equal(text[94],'x');assert.equal(text[288],'x');
  assert.equal(text[92],'Total Cost = $40 3 = $120');
  assert.equal(text[95],'Total Cost = (cost of jeans) (number of jeans)');
  assert.equal(text[283],'Money Made: $25 x 5 = $125');
  assert.equal(text[287],'Money Made: (amount earned for washing) (number of days)');
  assert.equal(text[128],'$40');assert.equal(text[291],'$25');
  const jeans=selected('sprite-139',128),help=selected('sprite-292',291);
  assert.deepEqual(jeans.map(p=>p.placementFrame),[24,34,42]);assert.equal(help.length,5);
  assert.equal(selected('sprite-106',94).length,2);assert.equal(selected('sprite-292',288).length,1);
  const ticks=Array.from({length:14},(_,i)=>Number(text[111+i]));assert.deepEqual(ticks,Array.from({length:14},(_,i)=>i*10));
  const reveal={question:2,questionTask:requireAt(45,313),information:requireAt(86,450),equation:requireAt(92,576),numberLine:requireAt(128,698,3)};
  for(const id of [87,88,89])requireAt(id,450);for(const id of [91,95])requireAt(id,576);requireAt(109,698);
  return {animationId:'shared-nms002-l01-p044',source:{path:SOURCE,sha256:SWF_SHA},sourceLanguage:'en',text,reveal,
    equation:{sourceIds:[91,92,94,95],label:text[91],symbolic:'Total Cost = (cost of jeans) × (number of jeans)',numeric:'Total Cost = $40 × 3 = $120'},
    jeans:{sourceIds:[109,111,112,113,114,115,116,117,118,119,120,121,122,123,124,128],unit:'dollars',axisMin:0,axisMax:130,tickStep:10,
      jumpValue:40,jumpCount:jeans.length,jumpEndpoints:Array.from({length:jeans.length+1},(_,i)=>i*40),sourceLabelPlacements:jeans},
    help:{sourceIds:[280,281,282,283,287,288,291],symbolic:'Money Made: (amount earned for washing) × (number of days)',numeric:'Money Made: $25 × 5 = $125',
      unit:'dollars',axisMin:0,axisMax:130,tickStep:10,jumpValue:25,jumpCount:help.length,jumpEndpoints:Array.from({length:help.length+1},(_,i)=>i*25),sourceLabelPlacements:help},
    transformations:['Collapse export record separators and whitespace; preserve literal words, quantities and punctuation.',
      'Reassemble separately placed source x text glyphs as the semantic multiplication operator × in readable equations.',
      'Redraw equal-spaced number lines and repeated jumps from source label values/counts; calculated endpoints are maintained mathematical equivalents, not original vector paths.',
      'Show final readable explanation only at its source-held child state; main summaries follow exact source placement frames.'],
    sourceVisualModified:false,currentJavaScriptRegistered:false,productCalibrationPassed:false,originalRuntimeAccepted:false,audioIntegrated:false};
}
export async function build(){
  assert.ok(process.env.HELP_MATH_G678_SOURCE_ROOT,'Missing explicit source root');
  const source=await read(path.join(process.env.HELP_MATH_G678_SOURCE_ROOT,SOURCE),SWF_SHA);
  const xml=await read(XML,'3a3338eacd66b788cdda556128e0ff4715eb5647f3dfb16d1e5a2e0243d5a1fa');
  const placement=await read(PLACEMENTS,'f2ce4705b38b048e17330be6ff7ec5c6b0bb2c77cb2dd6630a86955c0f7e2510');
  const ids=[17,45,86,87,88,89,91,92,94,95,109,...Array.from({length:14},(_,i)=>111+i),128,280,281,282,283,287,288,291];
  const inputs=[source.binding,xml.binding,placement.binding,(await read(SELF)).binding,(await read(TEST)).binding],text={};
  for(const id of ids){const raw=await read(`${TEXT_ROOT}/${id}.txt`);inputs.push(raw.binding);text[id]=literal(raw.bytes.toString('utf8'));}
  const data=compileInstruction(text,JSON.parse(placement.bytes).placements);
  const ts=`// Generated by build-g678-nms-l01-p044-readable-instruction.mjs; do not edit.\nexport const P044_READABLE_INSTRUCTION = ${JSON.stringify(data,null,2)} as const;\n`;
  const manifest={artifactType:'unregistered-source-bound-readable-instruction',inputs,transformations:data.transformations,
    output:{path:TS,bytes:Buffer.byteLength(ts),sha256:hash(ts)},gates:{currentJavaScriptRegistered:false,productCalibrationPassed:false,originalRuntimeAccepted:false,audioAccepted:false,humanAccepted:false,ownerAccepted:false,strictComplete:false,released:false,published:false}};
  return {files:[[TS,ts],[MANIFEST,JSON.stringify(manifest,null,2)+'\n']],manifest};
}
async function main(){assert.ok(['--write','--check'].includes(process.argv[2]));assert.equal(process.argv.length,3);const result=await build();
  for(const[p,b]of result.files)if(process.argv[2]==='--write')await writeFile(path.join(ROOT,p),b,{flag:'wx',mode:0o444});else assert.equal(await readFile(path.join(ROOT,p),'utf8'),b,p);
  console.log(JSON.stringify({mode:process.argv[2],filesWritten:process.argv[2]==='--write'?2:0,outputs:result.files.map(([path,b])=>({path,bytes:Buffer.byteLength(b),sha256:hash(b)}))},null,2));}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
