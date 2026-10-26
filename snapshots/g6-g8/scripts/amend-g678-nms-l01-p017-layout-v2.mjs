#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ID,CALIBRATION,build} from './build-g678-nms-l01-p017-v2.mjs';
import {ROOT,encode,pin,readBound} from './lib/g678-nms-l01-p017-generator-v2.mjs';
import {guardedReplacement} from './activate-g678-frozen16-glossary-registration.mjs';
import {GENERATED_OUTPUTS,expectedScopedRegistryOutputs} from './activate-g678-alg-l11-feedback-host-score-registration.mjs';
import {buildRegistrySources} from '../packages/demos/scripts/generate-registry.mjs';

const REGISTRY='packages/demos/private-current-js-registry.json',PRIOR_SHA='7ff172f0a8d035a4970089d9f63c5cc8614384b1488f36cbb94818d32f1d306b';
const PRIOR_CALIBRATION='g678-nms-l01-p017-current-js-v1';
const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`,FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json');
const RECEIPT=FREEZE.replace(/\.json$/u,'.activation.json'),RECOVERY=`work/g678-shared-page-factory/${CALIBRATION}-layout-activation`;
const TARGETS=[REGISTRY,GENERATED_OUTPUTS.localOnly,GENERATED_OUTPUTS.localOnlyMetadata];
export async function amend({check=false,planOnly=false}={}){
 await build({check:true});
 const freezeFile=await readBound(FREEZE),fragmentFile=await readBound(FRAGMENT),freeze=JSON.parse(freezeFile.bytes),fragment=JSON.parse(fragmentFile.bytes);
 assert.equal(fragment.calibration.calibrationId,CALIBRATION);assert.deepEqual(fragment.calibration.entries,[freeze.entry]);assert.equal(freeze.entry.key,ID);
 const verify=async()=>{await readBound(FREEZE,freezeFile.binding);await readBound(FRAGMENT,fragmentFile.binding);await build({check:true});};
 const current=await readBound(REGISTRY),registry=JSON.parse(current.bytes),outputs=Object.fromEntries(await Promise.all(Object.entries(GENERATED_OUTPUTS).map(async([k,p])=>[k,(await readBound(p)).bytes])));
 if(check){
  const receipt=JSON.parse(await readFile(path.join(ROOT,RECEIPT)));assert.equal(receipt.beforeRegistry.sha256,PRIOR_SHA);assert.deepEqual(receipt.amendedIds,[ID]);
  assert(!registry.calibrations.some(c=>c.calibrationId===PRIOR_CALIBRATION));assert.deepEqual(registry.calibrations.find(c=>c.calibrationId===CALIBRATION),fragment.calibration);
  assert.equal(registry.calibrations.flatMap(c=>c.entries).filter(e=>e.key.startsWith('shared-')).length,401);
  for(const b of receipt.after)await readBound(b.path,b);const generated=await buildRegistrySources();for(const[k,b]of Object.entries(outputs))assert.equal(b.toString(),generated[k]);await verify();
  return {checked:true,registered:401,amendedIds:[ID],publicFilesWritten:0};
 }
 assert.equal(current.binding.sha256,PRIOR_SHA,'exact pre-layout registry');assert.equal(registry.calibrations.flatMap(c=>c.entries).filter(e=>e.key.startsWith('shared-')).length,401);
 const old=registry.calibrations.filter(c=>c.calibrationId===PRIOR_CALIBRATION);assert.equal(old.length,1);assert.deepEqual(old[0].entries.map(e=>e.key),[ID]);assert(!registry.calibrations.some(c=>c.calibrationId===CALIBRATION));
 assert.deepEqual(outputs,expectedScopedRegistryOutputs(registry,outputs));
 const next={...registry,calibrations:registry.calibrations.map(c=>c.calibrationId===PRIOR_CALIBRATION?fragment.calibration:c)};
 assert.deepEqual(next.calibrations.filter(c=>c.calibrationId!==CALIBRATION),registry.calibrations.filter(c=>c.calibrationId!==PRIOR_CALIBRATION),'all400 prior page registration objects preserved');
 const nextOutputs=expectedScopedRegistryOutputs(next,outputs),before=new Map([[REGISTRY,current.bytes],...Object.entries(GENERATED_OUTPUTS).map(([k,p])=>[p,outputs[k]])]);
 const after=new Map([[REGISTRY,Buffer.from(encode(next))],...Object.entries(GENERATED_OUTPUTS).map(([k,p])=>[p,nextOutputs[k]])]);
 const summary={beforeRegistry:current.binding,after:[...after].map(([p,b])=>pin(p,b)),amendedIds:[ID],previousCalibration:PRIOR_CALIBRATION,replacementCalibration:CALIBRATION,registeredBefore:401,registeredAfter:401,preservedOtherG678Placements:400,publicFilesWritten:0};
 if(planOnly)return {...summary,planOnly:true,writes:0};
 const postflight=async()=>{const generated=await buildRegistrySources();for(const[k,b]of Object.entries(nextOutputs))assert.equal(b.toString(),generated[k]);};
 const transaction=await guardedReplacement({root:ROOT,before,after,targets:TARGETS,recovery:RECOVERY,verify,postflight});
 await writeFile(path.join(ROOT,RECEIPT),encode({schemaVersion:1,createdAt:new Date().toISOString(),status:'local-page-layout-amended-product-qa-pending',...summary,transaction,freeze:freezeFile.binding,fragment:fragmentFile.binding,productCalibrationPassed:false,scaleOutAuthorized:false,acceptanceEffects:freeze.acceptanceEffects}),{flag:'wx'});
 return {registered:401,amendedIds:[ID],publicFilesWritten:0,receipt:RECEIPT};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 assert(process.argv.length===3&&['--plan','--write','--check'].includes(process.argv[2]));console.log(encode(await amend({check:process.argv[2]==='--check',planOnly:process.argv[2]==='--plan'})));
}
