#!/usr/bin/env node
// Stable successor of the unregistered V1 packet. Historical registry bytes
// move to an exact immutable witness; no registry activation occurs here.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat,mkdir,readFile,realpath,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SELF='scripts/prepare-g678-nms-l01-p044-stable-candidate.mjs',TEST='scripts/prepare-g678-nms-l01-p044-stable-candidate.test.mjs';
export const REGISTRY='packages/demos/private-current-js-registry.json';
export const WITNESS='catalog/product-bridge-calibrations/g678-current-js-378-private-registry-witness-v1.json';
export const OLD_REGISTRY=Object.freeze({path:REGISTRY,bytes:432557,sha256:'c075c204a21c020da2cef54bec74a2e713d7eba1c4fc3d55b158e0d8a8d464e2'});
const BASE='catalog/g678-nms-l01-p044-prepared-candidate-v1.json';
const OLD_FRAGMENT='catalog/product-bridge-calibrations/g678-nms-l01-p044-prepared-current-js-v1.fragment.json';
const OUT='catalog/g678-nms-l01-p044-prepared-candidate-v2.json';
const RUN='work/g678-shared-page-factory/g678-nms-l01-p044-prepared-current-js-v2/run-manifest.json';
const FRAGMENT='catalog/product-bridge-calibrations/g678-nms-l01-p044-prepared-current-js-v2.fragment.json';
const hash=b=>createHash('sha256').update(b).digest('hex'),encode=v=>JSON.stringify(v,null,2)+'\n';
const pin=(p,b)=>({path:p,bytes:Buffer.byteLength(b),sha256:hash(b)});
async function read(p,expected){const full=p.startsWith('G6-G8-shared/')?path.resolve(process.env.HELP_MATH_G678_SOURCE_ROOT??'',p):path.resolve(ROOT,p);
  if(p.startsWith('G6-G8-shared/'))assert.ok(process.env.HELP_MATH_G678_SOURCE_ROOT);
  const actual=await realpath(full),vendor=await realpath(path.join(ROOT,'node_modules'));assert.ok(actual===full||actual.startsWith(vendor+path.sep));
  const before=await lstat(actual,{bigint:true});assert.ok(before.isFile()&&!before.isSymbolicLink()&&before.nlink===1n);
  const bytes=await readFile(actual),after=await lstat(actual,{bigint:true});for(const k of['dev','ino','size','mtimeNs','ctimeNs','nlink'])assert.equal(before[k],after[k]);
  const binding=pin(p,bytes);if(expected)assert.deepEqual(binding,expected,p);return{bytes,binding,mode:Number(after.mode),value:p.endsWith('.json')?JSON.parse(bytes):undefined};}
export function witnessHistoricalInputs(inputs){
  assert.equal(inputs.filter(p=>p.path===REGISTRY).length,1,'One exact captured predecessor registry required');
  return inputs.map(p=>{if(p.path!==REGISTRY)return p;assert.deepEqual(p,OLD_REGISTRY,'No arbitrary registry snapshot remap');return{...p,path:WITNESS};});
}
export async function prepare(check=false){
  const base=await read(BASE,{path:BASE,bytes:43157,sha256:'1ed80144a4453efbf5a2782adc5c3d9fdb679ad6d01c04311d8c5013efbb7c04'});
  const fragment=await read(OLD_FRAGMENT,{path:OLD_FRAGMENT,bytes:8656,sha256:'7968b01d93dbba8fa073934f4c1f97a0914c3865eddcbdc485e4d27f49f309c0'});
  assert.equal(base.value.animationId,'shared-nms002-l01-p044');assert.equal(fragment.value.entries.length,1);
  let witness,live,witnessCreated=false;
  try{witness=await read(WITNESS,{...OLD_REGISTRY,path:WITNESS});assert.equal(witness.mode&0o222,0);}
  catch(error){if(error.code!=='ENOENT'||check)throw error;live=await read(REGISTRY,OLD_REGISTRY);witness={...live,binding:{...OLD_REGISTRY,path:WITNESS}};}
  if(!check)live=await read(REGISTRY,OLD_REGISTRY);
  const mapped=witnessHistoricalInputs(base.value.inputs),files=[];
  for(const p of mapped)if(p.path===WITNESS)files.push(witness.binding);else files.push((await read(p.path,p)).binding);
  for(const p of[base.binding,fragment.binding,fragment.value.compilerRun,base.value.module,base.value.timeline,...fragment.value.entries.map(e=>e.memberManifest)])files.push((await read(p.path,p)).binding);
  files.push((await read(SELF)).binding,(await read(TEST)).binding);
  const unique=[...new Map(files.map(p=>[p.path,p])).values()].sort((a,b)=>a.path.localeCompare(b.path));
  assert.ok(!unique.some(p=>p.path===REGISTRY));
  const candidate={schemaVersion:1,artifactType:'g678-nms-l01-p044-stable-prepared-unregistered-candidate',animationId:base.value.animationId,gradeScope:base.value.gradeScope,source:base.value.source,
    baseCandidate:base.binding,predecessorFreeze:base.value.predecessorFreeze,predecessorRegistryWitness:witness.binding,
    historicalInputWitnesses:[{capturedInput:OLD_REGISTRY,physicalWitness:witness.binding,byteIdentity:true,
      meaning:'A dated capture expected the378 registry. This immutable witness preserves those exact bytes; it is not the live registry after activation.'}],
    physicalClosurePolicy:'Use the explicit physicalFiles list. Older hash-bound receipts remain archival objects; the one captured mutable registry input is resolved only through historicalInputWitnesses.',
    physicalFiles:unique,module:base.value.module,timeline:base.value.timeline,actualBrowserModule:base.value.actualBrowserModule,browserEvidence:base.value.browserEvidence,
    sourceResidual:base.value.sourceResidual,originalRuntimeLimits:base.value.originalRuntimeLimits,gates:base.value.gates};
  const candidateBytes=encode(candidate),run={schemaVersion:1,artifactType:'stable-prepared-p044-packet',physicalFiles:unique,
    historicalInputWitnesses:candidate.historicalInputWitnesses,candidateManifest:pin(OUT,candidateBytes),wrapperOutputs:[base.value.module,base.value.timeline,...fragment.value.entries.map(e=>e.memberManifest)],gates:base.value.gates};
  const runBytes=encode(run),successor={...fragment.value,artifactType:'g678-nms-l01-p044-prepared-current-js-fragment-v2',candidateManifest:pin(OUT,candidateBytes),compilerRun:pin(RUN,runBytes),
    predecessorRegistryWitness:witness.binding,baseSourceAuthority:fragment.binding};
  const outputs=[[OUT,candidateBytes],[RUN,runBytes],[FRAGMENT,encode(successor)]];
  if(!check){for(const[p]of outputs)await assert.rejects(lstat(path.join(ROOT,p)),{code:'ENOENT'});
    if(!witness.mode||witness.binding.path!==WITNESS)throw Error('Invalid witness provenance');
    try{await lstat(path.join(ROOT,WITNESS));}catch(error){if(error.code!=='ENOENT')throw error;await writeFile(path.join(ROOT,WITNESS),witness.bytes,{flag:'wx',mode:0o444});witnessCreated=true;}}
  for(const[p,b]of outputs)if(check)assert.equal((await read(p)).bytes.toString(),b);else{
    let dir=ROOT;for(const part of path.dirname(p).split('/')){dir=path.join(dir,part);await mkdir(dir).catch(e=>{if(e.code!=='EEXIST')throw e;});const info=await lstat(dir);assert.ok(info.isDirectory()&&!info.isSymbolicLink()&&await realpath(dir)===dir);}
    await writeFile(path.join(ROOT,p),b,{flag:'wx',mode:0o444});}
  for(const p of unique)await read(p.path,p);if(live)await read(REGISTRY,live.binding);
  return{check,filesWritten:check?0:outputs.length+(witnessCreated?1:0),registryChanged:false,registrationCount:0,
    witness:witness.binding,outputs:outputs.map(([p,b])=>pin(p,b)),physicalFiles:unique.length};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert.ok(process.argv.length<=3&&(!process.argv[2]||process.argv[2]==='--check'));console.log(encode(await prepare(process.argv[2]==='--check')));}
