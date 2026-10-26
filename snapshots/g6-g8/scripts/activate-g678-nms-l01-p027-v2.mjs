#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ID,CALIBRATION,build} from './build-g678-nms-l01-p027-v2.mjs';
import {ROOT,encode,pin,readBound} from './lib/g678-nms-l01-p027-generator-v2.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';
import {guardedReplacement} from './activate-g678-frozen16-glossary-registration.mjs';
import {GENERATED_OUTPUTS,expectedScopedRegistryOutputs} from './activate-g678-alg-l11-feedback-host-score-registration.mjs';
import {buildRegistrySources} from '../packages/demos/scripts/generate-registry.mjs';
const OLD='g678-nms-l01-p027-current-js-v1',REGISTRY='packages/demos/private-current-js-registry.json';
const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`,FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json');
const PREPARATION='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p027-adapter-v2-preparation.json';
export const RECEIPT=FREEZE.replace(/\.json$/u,'.activation.json');
export async function activate({check=false,planOnly=false}={}){
 await build({check:true});
 const preparation=JSON.parse(await readFile(PREPARATION)),fragmentFile=await readBound(FRAGMENT),freezeFile=await readBound(FREEZE),fragment=JSON.parse(fragmentFile.bytes),freeze=JSON.parse(freezeFile.bytes);
 assert.equal(fragment.calibration.calibrationId,CALIBRATION);assert.deepEqual(fragment.calibration.entries,[freeze.entry]);
 await readBound(preparation.oldFreeze.path,preparation.oldFreeze);
 const oldFreeze=JSON.parse((await readBound(preparation.oldFreeze.path)).bytes);
 assert.deepEqual(oldFreeze.entry.artifacts,freeze.entry.artifacts,'source Canvas/module/timeline unchanged');
 assert.deepEqual(oldFreeze.source,freeze.source);assert.deepEqual(oldFreeze.audioPlan,freeze.audioPlan);
 const current=await readBound(REGISTRY),registry=JSON.parse(current.bytes),outputs=Object.fromEntries(await Promise.all(Object.entries(GENERATED_OUTPUTS).map(async([key,file])=>[key,(await readBound(file)).bytes])));
 const verify=async()=>{await readBound(FRAGMENT,fragmentFile.binding);await readBound(FREEZE,freezeFile.binding);await readBound(preparation.oldFreeze.path,preparation.oldFreeze);await build({check:true});};
 if(check){
  const receipt=JSON.parse(await readFile(path.join(ROOT,RECEIPT)));assert.deepEqual(receipt.replacedIds,[ID]);assert.deepEqual(receipt.addedIds,[]);assert.equal(receipt.beforeRegistry.sha256,preparation.oldRegistry.sha256);
  assert(!registry.calibrations.some(c=>c.calibrationId===OLD));assert.deepEqual(registry.calibrations.find(c=>c.calibrationId===CALIBRATION),fragment.calibration);
  assert.equal(registry.calibrations.flatMap(c=>c.entries).filter(e=>e.key.startsWith('shared-')).length,411);
  for(const b of receipt.after)await readBound(b.path,b);const generated=await buildRegistrySources();for(const[key,b]of Object.entries(outputs))assert.equal(b.toString(),generated[key]);await verify();return {checked:true,registered:411,replacedIds:[ID],publicFilesWritten:0};
 }
 assert.equal(current.binding.sha256,preparation.oldRegistry.sha256,'exact version1 registry');
 assert.equal(registry.calibrations.flatMap(c=>c.entries).filter(e=>e.key.startsWith('shared-')).length,411);
 const oldCalibration=registry.calibrations.find(c=>c.calibrationId===OLD);assert(oldCalibration);assert.deepEqual(oldCalibration.entries,[oldFreeze.entry]);assert.equal(oldCalibration.freezeManifestSha256,preparation.oldFreeze.sha256);
 assert(!registry.calibrations.some(c=>c.calibrationId===CALIBRATION));assert.deepEqual(outputs,expectedScopedRegistryOutputs(registry,outputs));
 const unchanged=registry.calibrations.filter(c=>c.calibrationId!==OLD),next=upsertPrivateCurrentJsCalibration({...registry,calibrations:unchanged},fragment.calibration);
 assert.deepEqual(next.calibrations.filter(c=>c.calibrationId!==CALIBRATION),unchanged,'all410 predecessor placements preserved');
 const nextOutputs=expectedScopedRegistryOutputs(next,outputs),before=new Map([[REGISTRY,current.bytes],...Object.entries(GENERATED_OUTPUTS).map(([key,file])=>[file,outputs[key]])]),after=new Map([[REGISTRY,Buffer.from(encode(next))],...Object.entries(GENERATED_OUTPUTS).map(([key,file])=>[file,nextOutputs[key]])]);
 const summary={beforeRegistry:current.binding,after:[...after].map(([file,b])=>pin(file,b)),addedIds:[],replacedIds:[ID],preservedG678Placements:410,registered:411,sourceArtifactsUnchanged:true,oldCalibration,newCalibration:fragment.calibration,publicFilesWritten:0};
 if(planOnly)return {...summary,planOnly:true,writes:0};
 const transaction=await guardedReplacement({root:ROOT,before,after,targets:[REGISTRY,GENERATED_OUTPUTS.localOnly,GENERATED_OUTPUTS.localOnlyMetadata],recovery:`work/g678-shared-page-factory/${CALIBRATION}-activation`,verify,postflight:async()=>{const generated=await buildRegistrySources();for(const[key,b]of Object.entries(nextOutputs))assert.equal(b.toString(),generated[key]);}});
 await writeFile(path.join(ROOT,RECEIPT),encode({schemaVersion:1,createdAt:new Date().toISOString(),status:'local-adapter-revision-registered-browser-qa-pending',...summary,transaction,freeze:freezeFile.binding,fragment:fragmentFile.binding,productCalibrationPassed:false,scaleOutAuthorized:false,acceptanceEffects:freeze.acceptanceEffects}),{flag:'wx'});
 return {registered:411,replacedIds:[ID],addedIds:[],publicFilesWritten:0,receipt:RECEIPT};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===3&&['--plan','--write','--check'].includes(process.argv[2]));console.log(encode(await activate({check:process.argv[2]==='--check',planOnly:process.argv[2]==='--plan'})));}
