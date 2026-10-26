#!/usr/bin/env node
// Exact p044 repair successor; no registry, descriptor, public or provider writes.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat,mkdir,readFile,realpath,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {EFFECTS} from './build-g678-nms-l01-p044-current-js-candidate.mjs';
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),ID='shared-nms002-l01-p044';
export const SELF='scripts/build-g678-nms-l01-p044-live-clock-candidate.mjs';
const TEST='scripts/build-g678-nms-l01-p044-live-clock-candidate.test.mjs';
export const encode=v=>Buffer.from(JSON.stringify(v,null,2)+'\n');
export const binding=(p,b)=>({path:p,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});
export const PINS=Object.freeze({
  base:{path:'catalog/g678-nms-l01-p044-prepared-candidate-v2.json',bytes:45950,sha256:'bc28727e4807babc5f9f72907c56c9aad3be00bdd5dc8817433dab453e3e27ed'},
  authority:{path:'catalog/product-bridge-calibrations/g678-nms-l01-p044-prepared-current-js-v2.fragment.json',bytes:9139,sha256:'6208880d4423d19645b508106b65f53a692dcd2bebf5c98909379851d1f1c00d'},
  freeze:{path:'catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v1.json',bytes:2424951,sha256:'1c80050ed48b12f4f16039c3a83136781c586da4520a4108d7b6cd8e5bb9cc81'},
  activation:{path:'catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v1.activation.json',bytes:11732,sha256:'2d0327715c70376da45a55a2a5a392d514296e65066aab736cf62ebdcda82034'},
  registry:{path:'packages/demos/private-current-js-registry.json',bytes:433966,sha256:'e68a3d39213766e220795a4f0a16412e09a0e830c9978a66bcd7dd02361372cb'},
  bridge:{path:'apps/web/lib/g678-calibration-product-bridge.server.ts',bytes:185328,sha256:'f6f578c7ff6bac14a93a30a175869f4ecf29b92038b4ec77b92502bfdf73acc7'},
  browser:{path:'output/playwright/g678-nms-l01-p044-product-v10-live-clock-successor/evidence.json',bytes:398418,sha256:'f258189313fae7ba351e142f501ab4658488b16a10945a91ca0e8f8301e2762a'},
  metadata:{path:'work/g678-shared-page-factory/g678-nms-l01-p044-prepared-module-metadata-v3/metadata.json',bytes:14266,sha256:'36e1942a46d74aaf4e50983d58301fe4eb596d87899c199940599b3144bc9290'},
  failure:{path:'output/playwright/g678-nms-l01-p044-my-lesson-v2-source-decode-accounting/evidence.json',bytes:639326,sha256:'43fb511cb999f431c04b5d2838c268d8f27c5570f9d8484ef216a1de7a51862b'},
});
export const WITNESSES=Object.freeze([
  {capturedInput:PINS.registry,physicalWitness:{...PINS.registry,path:'catalog/product-bridge-calibrations/g678-current-js-379-v1-private-registry-witness.json'}},
  {capturedInput:PINS.bridge,physicalWitness:{...PINS.bridge,path:'catalog/product-bridge-calibrations/g678-current-js-379-v1-product-bridge-witness.ts'}},
]);
export const RUN='work/g678-shared-page-factory/g678-nms-l01-p044-live-clock-current-js-v3';
export const MODULE='packages/demos/src/modules/g678-nms-l01-live-clock-current-js-p044.tsx';
export const TIMELINE='packages/demos/src/timelines/g678-nms-l01-live-clock-current-js-p044.ts';
export const MANIFEST='catalog/g678-nms-l01-p044-live-clock-candidate-v3.json';
export const FRAGMENT='catalog/product-bridge-calibrations/g678-nms-l01-p044-live-clock-current-js-v3.fragment.json';
export function mapHistoricalInput(pin){const map=WITNESSES.find(m=>m.capturedInput.path===pin.path);if(!map)return pin;
  assert.deepEqual(pin,map.capturedInput,'Only exact frozen379-v1 inputs may become historical witnesses');return map.physicalWitness;}
async function read(pin){const p=typeof pin==='string'?pin:pin.path;
  const full=p.startsWith('G6-G8-shared/')?path.resolve(process.env.HELP_MATH_G678_SOURCE_ROOT??'',p):path.resolve(ROOT,p);
  if(p.startsWith('G6-G8-shared/'))assert.ok(process.env.HELP_MATH_G678_SOURCE_ROOT);
  const actual=await realpath(full),vendor=await realpath(path.join(ROOT,'node_modules'));assert.ok(actual===full||actual.startsWith(vendor+path.sep));
  const a=await lstat(actual,{bigint:true});assert.ok(a.isFile()&&!a.isSymbolicLink()&&a.nlink===1n);
  const bytes=await readFile(actual),z=await lstat(actual,{bigint:true});for(const k of['dev','ino','size','mtimeNs','ctimeNs','nlink','mode'])assert.equal(a[k],z[k]);
  const b=binding(p,bytes);if(typeof pin!=='string')assert.deepEqual(b,pin,p);return{bytes,binding:b,mode:Number(z.mode),value:p.endsWith('.json')?JSON.parse(bytes):undefined};}
export function validateRepairEvidence(browser,metadata,base,authority,failure){
  assert.equal(browser.status,'passed-isolated-product-candidate-not-registered');assert.equal(browser.inputsUnchanged,true);assert.deepEqual(browser.inputsAfter,browser.inputs);
  assert.deepEqual(browser.errors,[]);assert.deepEqual(browser.requests,[]);assert.equal(browser.records.length,155);assert.equal(browser.screenshots.length,60);
  assert.deepEqual({path:browser.executedFixture.path,bytes:browser.executedFixture.bytes,sha256:browser.executedFixture.sha256},
    {path:'output/playwright/g678-nms-l01-p044-product-v10-live-clock-successor/fixture.js',bytes:17035955,sha256:'83d14d107f38fa3377cc76fda56d052f2b1d8fc2d0e68787dd80680ee1128aae'});
  assert.equal(browser.preparedDefaultPixels.length,23);assert.ok(browser.preparedDefaultPixels.every(r=>r.differingBytes===0));
  assert.deepEqual(browser.loadGates.map(g=>g.label),['370-initial','390-initial','1440-initial','natural-initial','decode-rejection']);
  for(const g of browser.loadGates){assert.equal(g.before.decodeCalls,11);assert.equal(g.before.runtimeCount,0);assert.equal(g.before.admitted,false);assert.equal(g.before.externalHold,'true');
    if(g.label==='decode-rejection')assert.deepEqual(g.after,{admitted:false,runtimeCount:0});else{assert.equal(g.after.firstRuntimeFrame,g.label==='natural-initial'?1:312);assert.equal(g.after.firstVisualFrame,g.after.firstRuntimeFrame);}}
  assert.equal(metadata.status,'passed');assert.equal(metadata.inputsUnchanged,true);assert.deepEqual(metadata.inputsAfter,metadata.inputs);assert.deepEqual(metadata.errors,[]);assert.deepEqual(metadata.requests,[]);
  for(const k of['allValid','allInvalid','allGatesFalse'])assert.equal(metadata.actual[k],true);assert.equal(metadata.actual.validCount,756);assert.equal(metadata.actual.invalidCount,8);
  assert.equal(metadata.actual.rendererName,'PreparedP044Renderer');assert.deepEqual(metadata.actual.metadata,base.actualBrowserModule.metadata);
  assert.deepEqual(metadata.actual.metadata,authority.entries[0].runtimeContract);assert.equal(authority.entries.length,1);assert.equal(authority.entries[0].key,ID);
  assert.equal(failure.status,'failed');const natural=failure.records.find(r=>r.name==='1440-en-natural');assert.equal(natural.status,'failed');assert.ok(natural.errors.includes('Invalid p044 monotonic nested clock'));
  assert.equal(failure.records.filter(r=>r.status==='functional-checks-passed-product-issues-open').length,6);
  return metadata.actual.metadata;
}
export function wrapperSource(){return `"use client";
// Generated by build-g678-nms-l01-p044-live-clock-candidate.mjs; do not edit.
import candidate,{P044_MODULE_PREPARATION} from '../g678-nms-l01-p044-prepared-module-v3';
import {SOURCE_TIMELINE} from '../timelines/g678-nms-l01-live-clock-current-js-p044';
if(candidate.key!==SOURCE_TIMELINE.animationId||P044_MODULE_PREPARATION.sourceSha256!==SOURCE_TIMELINE.source.sha256||P044_MODULE_PREPARATION.sourceImagesDecoded!==11||!P044_MODULE_PREPARATION.loaderAwaitedDecode)throw Error('p044 live-clock source binding drift');
export {SOURCE_TIMELINE};
export const CURRENT_JAVASCRIPT_REGISTERED=false as const;
export const DOM_RENDERER_IMPLEMENTED=true as const;
export default candidate;
`;}
async function parent(p){let dir=ROOT;for(const part of path.dirname(p).split('/')){dir=path.join(dir,part);await mkdir(dir).catch(e=>{if(e.code!=='EEXIST')throw e;});
  const info=await lstat(dir);assert.ok(info.isDirectory()&&!info.isSymbolicLink()&&await realpath(dir)===dir);}}
export async function buildPacket({write=false,check=false}={}){
  assert.ok(!(write&&check));const docs={};for(const[k,p]of Object.entries(PINS))if(!['registry','bridge'].includes(k))docs[k]=await read(p);
  const witnessFiles=new Map(),pending=[];
  for(const mapping of WITNESSES){let file;try{file=await read(mapping.physicalWitness);assert.equal(file.mode&0o222,0);}
    catch(error){if(error.code!=='ENOENT'||check)throw error;file=await read(mapping.capturedInput);pending.push({path:mapping.physicalWitness.path,bytes:file.bytes});}
    witnessFiles.set(mapping.physicalWitness.path,{...file,binding:mapping.physicalWitness});if(write)await read(mapping.capturedInput);
  }
  const {base,authority,browser,metadata,failure,freeze,activation}=docs;
  const runtime=validateRepairEvidence(browser.value,metadata.value,base.value,authority.value,failure.value);
  assert.equal(freeze.value.selectedPages.length,379);assert.deepEqual(activation.value.proposed.registry,PINS.registry);
  const files=new Map();const add=async p=>{const expected=typeof p==='string'?p:mapHistoricalInput(p),file=typeof expected==='string'?await read(expected):witnessFiles.get(expected.path)??await read(expected);
    if(typeof expected!=='string')assert.deepEqual(file.binding,expected);const old=files.get(file.binding.path);if(old)assert.deepEqual(old,file.binding);files.set(file.binding.path,file.binding);return file;};
  for(const file of Object.values(docs))await add(file.binding);for(const file of witnessFiles.values())await add(file.binding);
  // Historical receipts are immutable objects. Follow only explicit physical
  // lists, not arbitrary nested strings that once referred to a live registry.
  for(const p of [...base.value.physicalFiles,...browser.value.inputs,...browser.value.screenshots,...metadata.value.inputs,metadata.value.probe])await add(p);
  await add({path:browser.value.executedFixture.path,bytes:browser.value.executedFixture.bytes,sha256:browser.value.executedFixture.sha256});
  for(const file of[SELF,TEST,'packages/demos/tests/g678-nms-l01-p044-live-frame-callback.test.ts'])await add(file);
  const physicalFiles=[...files.values()].sort((a,b)=>a.path.localeCompare(b.path));
  assert.ok(!physicalFiles.some(p=>WITNESSES.some(w=>w.capturedInput.path===p.path)));
  const entry=authority.value.entries[0],source=base.value.source,sourceTimeline={schemaVersion:1,animationId:ID,source,adapterFamily:entry.adapterFamily,
    mainTimeline:{objectId:293,frameDomain:'sprite-293',frameCount:759,depth:3},preparedSourceImages:11,proposedPresentation:entry.proposedPresentation,
    repairScope:['sample-live-clock-inside-raf-callback','registration-neutral-candidate-copy'],currentJavaScriptImplemented:true,currentJavaScriptRegistered:false,acceptanceEffects:EFFECTS};
  const module=Buffer.from(wrapperSource()),timeline=Buffer.from('// Generated source binding; do not edit.\nexport const SOURCE_TIMELINE = '+encode(sourceTimeline).toString().trimEnd()+' as const;\n');
  const candidate={schemaVersion:1,artifactType:'g678-nms-l01-p044-live-clock-unregistered-repair-candidate-v3',animationId:ID,gradeScope:'G6-G8-shared',source,
    baseCandidate:base.binding,baseSourceAuthority:authority.binding,predecessorFreeze:freeze.binding,predecessorActivation:activation.binding,
    predecessorRegistryWitness:WITNESSES[0].physicalWitness,historicalInputWitnesses:WITNESSES,
    physicalClosurePolicy:'Explicit physicalFiles plus declared module/timeline outputs; historical receipts remain archival objects, with only exact listed witness remaps.',physicalFiles,
    module:binding(MODULE,module),timeline:binding(TIMELINE,timeline),actualBrowserModule:metadata.value.actual,browserEvidence:browser.binding,registeredFailureEvidence:failure.binding,
    repairScope:sourceTimeline.repairScope,sourceResidual:base.value.sourceResidual,originalRuntimeLimits:base.value.originalRuntimeLimits,gates:EFFECTS};
  const candidateBytes=encode(candidate),memberPath=`${RUN}/members/${ID}/member-manifest.json`,runPath=`${RUN}/run-manifest.json`;
  const member=encode({animationId:ID,source,module:binding(MODULE,module),timeline:binding(TIMELINE,timeline),candidateManifest:binding(MANIFEST,candidateBytes),acceptanceEffects:EFFECTS});
  const run=encode({schemaVersion:1,artifactType:'single-live-clock-p044-repair-wrapper-packet',physicalFiles,historicalInputWitnesses:WITNESSES,
    outputs:[binding(MODULE,module),binding(TIMELINE,timeline),binding(MANIFEST,candidateBytes),binding(memberPath,member)],currentJavaScriptRegisteredCount:0,gates:EFFECTS});
  const successor={...authority.value,artifactType:'g678-nms-l01-p044-live-clock-current-js-fragment-v3',candidateManifest:binding(MANIFEST,candidateBytes),compilerRun:binding(runPath,run),
    predecessorFreeze:freeze.binding,predecessorRegistryWitness:WITNESSES[0].physicalWitness,baseSourceAuthority:authority.binding,
    entries:[{...entry,module:'./modules/g678-nms-l01-live-clock-current-js-p044',moduleFile:binding(MODULE,module),timeline:binding(TIMELINE,timeline),memberManifest:binding(memberPath,member),runtimeContract:runtime}]};
  const outputs=[[MODULE,module],[TIMELINE,timeline],[MANIFEST,candidateBytes],[memberPath,member],[runPath,run],[FRAGMENT,encode(successor)]];
  if(write){for(const[p]of outputs)await assert.rejects(lstat(path.join(ROOT,p)),{code:'ENOENT'});for(const p of pending){await parent(p.path);await writeFile(path.join(ROOT,p.path),p.bytes,{flag:'wx',mode:0o444});}}
  for(const[p,b]of outputs)if(check){const file=await read(p);assert.equal(file.mode&0o222,0);assert.ok(file.bytes.equals(b),p);}else if(write){await parent(p);await writeFile(path.join(ROOT,p),b,{flag:'wx',mode:0o444});}
  if(write||check){for(const p of physicalFiles)await read(p);if(write)for(const w of WITNESSES)await read(w.capturedInput);}
  return{mode:write?'write':check?'check':'plan',writes:write?outputs.length+pending.length:0,registryChanged:false,registeredRepairCount:0,physicalFiles:physicalFiles.length,
    witnesses:WITNESSES,outputs:outputs.map(([p,b])=>binding(p,b))};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const args=process.argv.slice(2);assert.ok(args.length<=1&&(!args[0]||['--plan','--write','--check'].includes(args[0])));
  console.log(JSON.stringify(await buildPacket({write:args[0]==='--write',check:args[0]==='--check'}),null,2));}
