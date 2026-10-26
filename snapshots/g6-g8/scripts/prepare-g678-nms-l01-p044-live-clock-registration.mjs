#!/usr/bin/env node
// Exact same-count379 successor preparation; never activates the live registry.
import assert from 'node:assert/strict';
import {lstat,readFile,realpath,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT,ID,PINS,WITNESSES,encode,binding,buildPacket} from './build-g678-nms-l01-p044-live-clock-candidate.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';
import {readBoundActivationFile} from './activate-g678-alg-l11-feedback-host-score-registration.mjs';
export {ROOT,ID,encode,binding};
export const SELF='scripts/prepare-g678-nms-l01-p044-live-clock-registration.mjs',REGISTRY=PINS.registry.path;
export const PHASE='nms-l01-p044-live-clock-provisional-browser-qa';
export const PRIOR=Object.freeze({freeze:PINS.freeze,activation:PINS.activation,registry:WITNESSES[0].physicalWitness,source:PINS.authority,
  bridge:WITNESSES[1].physicalWitness,fragment:{path:'catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v1.fragment.json',bytes:386993,sha256:'82ff42f9d38d3c66cf8b497645375970a773870af8975867fc046f231e3c23d5'}});
export const SOURCE=Object.freeze({path:'catalog/product-bridge-calibrations/g678-nms-l01-p044-live-clock-current-js-v3.fragment.json',bytes:9153,sha256:'48312fa2a9fba4c1c342e23a3d5b5b77258ce7fb17b699834e57d5b914504575'});
export const CANDIDATE=Object.freeze({path:'catalog/g678-nms-l01-p044-live-clock-candidate-v3.json',bytes:65368,sha256:'efa0bc20a5f8601c0fb2287da22b28f8105cca366d7e30ce86555efd6783e251'});
export const PROPOSED_FREEZE='catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v2.json';
export const PROPOSED_FRAGMENT='catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v2.fragment.json';
const canonical=(pin,value)=>assert.deepEqual(binding(pin.path,encode(value)),pin,`Exact input drift: ${pin.path}`);
export function composeRepairRegistration({priorFreeze,priorFragment,priorRegistry,source,priorSource,candidate,plannerBinding}){
  for(const[p,v]of[[PRIOR.freeze,priorFreeze],[PRIOR.fragment,priorFragment],[PRIOR.registry,priorRegistry],[SOURCE,source],[PRIOR.source,priorSource],[CANDIDATE,candidate]])canonical(p,v);
  assert.equal(plannerBinding.path,SELF);assert.ok(plannerBinding.bytes>0&&/^[a-f0-9]{64}$/.test(plannerBinding.sha256));
  assert.equal(source.artifactType,'g678-nms-l01-p044-live-clock-current-js-fragment-v3');assert.deepEqual(source.baseSourceAuthority,PRIOR.source);
  assert.deepEqual(source.candidateManifest,CANDIDATE);assert.equal(source.entries.length,1);const entry=source.entries[0];assert.equal(entry.key,ID);
  assert.deepEqual(entry.runtimeContract,priorSource.entries[0].runtimeContract);assert.deepEqual(entry.source,priorSource.entries[0].source);
  assert.deepEqual(entry.proposedPresentation,priorSource.entries[0].proposedPresentation);assert.equal(entry.adapterFamily,priorSource.entries[0].adapterFamily);
  assert.ok(Object.values(entry.acceptanceEffects).every(v=>v===false));assert.ok(Object.values(candidate.gates).every(v=>v===false));
  const matches=priorRegistry.calibrations.filter(c=>c.calibrationId===priorFreeze.calibrationId);assert.equal(matches.length,1);const current=matches[0];
  assert.deepEqual(current,priorFragment.calibration);assert.equal(current.entries.length,379);assert.equal(priorFreeze.selectedPages.length,379);
  const artifacts={kind:'maintained-dom-module-v1',module:entry.moduleFile,timeline:entry.timeline,memberManifest:entry.memberManifest,sourceRun:source.compilerRun};
  const freeze=structuredClone(priorFreeze);let changed=0;
  freeze.selectedPages=priorFreeze.selectedPages.map(p=>{if(p.animationId!==ID)return structuredClone(p);changed++;
    assert.equal(p.sourceSha256,entry.source.sha256);assert.equal(p.globalPageOrdinal,44);assert.equal(p.sectionPageOrdinal,7);assert.equal(p.adapterFamily,entry.adapterFamily);
    assert.equal(p.runtime.frameDomain,'sprite-293');assert.equal(p.runtime.livePlaybackEndFrame,756);assert.deepEqual(p.presentation,{pageInteractionCompanionTargetIdSuffix:'nms-l01-p044-readable-instruction'});
    return{...structuredClone(p),runtime:{...structuredClone(p.runtime),rendererBinding:artifacts},
      implementation:{...structuredClone(p.implementation),liveCallbackClockSamplingImplemented:true,registrationNeutralCandidateCopyImplemented:true,registeredCompanionProductQaPassed:false,productCalibrationPassed:false},
      p044LiveClockSuccessor:{authority:SOURCE,candidateManifest:CANDIDATE,predecessorFreeze:PRIOR.freeze,registeredFailureEvidence:PINS.failure,
        registryEntryReplacementPrepared:true,registryActivationRequired:true,candidateMountedEvidenceOnly:true,registeredCompanionProductQaPassed:false},
      productBlockers:[...p.productBlockers,'live-clock-repair-actual-my-lesson-natural-pause-resume-qa-pending','top-level-await-target-environment-warning-unresolved'],
      productCalibrationPassed:false,engineeringPreviewReady:false};});
  assert.equal(changed,1);assert.deepEqual(freeze.selectedPages.filter(p=>p.animationId!==ID),priorFreeze.selectedPages.filter(p=>p.animationId!==ID));
  assert.equal(freeze.selectedPages.filter(p=>p.stableLessonKey==='shared-nms002-l01').length,12);
  let replaced=0;freeze.inputs.selectionAuthorities=priorFreeze.inputs.selectionAuthorities.map(a=>{if(a.path!==PRIOR.source.path)return structuredClone(a);assert.deepEqual(a,PRIOR.source);replaced++;return SOURCE;});assert.equal(replaced,1);
  freeze.inputs={...freeze.inputs,p044LiveClockPredecessorFreeze:PRIOR.freeze,p044LiveClockPredecessorFragment:PRIOR.fragment,p044LiveClockPredecessorRegistry:PRIOR.registry,
    p044LiveClockPredecessorBridge:PRIOR.bridge,p044LiveClockSource:SOURCE,p044LiveClockPlanner:plannerBinding};
  freeze.productHostCalibration={...freeze.productHostCalibration,currentHostBrowserRevalidated:false,p044LiveClockMountedCandidateCount:1,p044LiveClockRegisteredProductQaCount:0};
  freeze.limitations=[...freeze.limitations,'379 v2 is an exact same-count p044 repair replacement proposal. Its378 other page objects and registration entries remain unchanged.',
    'The isolated repair passes155 observations but does not close actual My Lesson natural pause/resume, browser target warning, audio, human/Owner or release gates.'];
  assert.equal(freeze.registrationCandidatePlacementCount,379);assert.equal(freeze.sharedAdapterPlacementCount,365);assert.equal(freeze.advancedManualPlacementCount,14);
  assert.equal(freeze.productCalibrationPassed,false);assert.equal(freeze.scaleOutAuthorized,false);assert.ok(Object.values(freeze.acceptanceEffects).every(v=>v===false));
  const freezeBytes=encode(freeze),freezePin=binding(PROPOSED_FREEZE,freezeBytes);
  const calibration={...structuredClone(current),freezeManifest:PROPOSED_FREEZE,freezeManifestBytes:freezePin.bytes,freezeManifestSha256:freezePin.sha256,
    entries:current.entries.map(e=>e.key===ID?{...structuredClone(e),module:entry.module,artifacts}:structuredClone(e))};
  assert.deepEqual(calibration.entries.filter(e=>e.key!==ID),current.entries.filter(e=>e.key!==ID));
  const nextRegistry=upsertPrivateCurrentJsCalibration(priorRegistry,calibration);
  assert.deepEqual(nextRegistry.calibrations.filter(c=>c.calibrationId!==current.calibrationId),priorRegistry.calibrations.filter(c=>c.calibrationId!==current.calibrationId));
  const fragment={schemaVersion:1,artifactType:'private-current-js-calibration-fragment-v1',freeze:freezePin,calibration,predecessorRegistry:PRIOR.registry,
    sourceSuccessorFragment:SOURCE,registryActivationRequired:true,productCalibrationPassed:false,changedModuleCount:1,preservedPageCount:378,registrationCount:379,phase:PHASE};
  return{freeze,freezeBytes,fragment,fragmentBytes:encode(fragment),nextRegistry,nextRegistryBytes:encode(nextRegistry)};
}
export async function readRepairInputs(){await buildPacket({check:true});
  const pins=[PRIOR.freeze,PRIOR.fragment,PRIOR.registry,SOURCE,PRIOR.source,CANDIDATE,PRIOR.activation,PRIOR.bridge];
  const inputs=await Promise.all(pins.map(p=>readBoundActivationFile(ROOT,p.path,p))),byPath=new Map(inputs.map(p=>[p.path,p]));
  assert.equal(byPath.get(PRIOR.registry.path).mode&0o222,0);assert.equal(byPath.get(PRIOR.bridge.path).mode&0o222,0);
  const planner=await readBoundActivationFile(ROOT,SELF),parse=p=>JSON.parse(byPath.get(p.path).buffer);
  const result=composeRepairRegistration({priorFreeze:parse(PRIOR.freeze),priorFragment:parse(PRIOR.fragment),priorRegistry:parse(PRIOR.registry),
    source:parse(SOURCE),priorSource:parse(PRIOR.source),candidate:parse(CANDIDATE),plannerBinding:binding(SELF,planner.buffer)});
  return{result,inputs:[...inputs,planner]};
}
export async function prepareRepairRegistration({write=false,check=false}={}){assert.ok(!(write&&check));const{result,inputs}=await readRepairInputs();
  const live=await readBoundActivationFile(ROOT,REGISTRY);assert.ok(live.buffer.equals(inputs.find(p=>p.path===PRIOR.registry.path).buffer)||check&&live.buffer.equals(result.nextRegistryBytes),'Exact379 v1 registry required (or exact379 v2 for post-activation check)');
  const outputs=[[PROPOSED_FREEZE,result.freezeBytes],[PROPOSED_FRAGMENT,result.fragmentBytes]];
  if(write)for(const[p]of outputs){assert.equal(await realpath(path.dirname(path.join(ROOT,p))),path.dirname(path.join(ROOT,p)));await assert.rejects(lstat(path.join(ROOT,p)),{code:'ENOENT'});}
  for(const[p,b]of outputs)if(check){const observed=await readBoundActivationFile(ROOT,p);assert.equal(observed.mode&0o222,0);assert.ok(observed.buffer.equals(b));}
    else if(write){for(const input of inputs)await readBoundActivationFile(ROOT,input.path,binding(input.path,input.buffer));await readBoundActivationFile(ROOT,REGISTRY,binding(REGISTRY,live.buffer));await writeFile(path.join(ROOT,p),b,{flag:'wx',mode:0o444});}
  await readBoundActivationFile(ROOT,REGISTRY,binding(REGISTRY,live.buffer));
  return{mode:write?'write':check?'check':'plan',writes:write?2:0,registryChanged:false,activationExecuted:false,registrationCount:379,changedModuleCount:1,preservedPageCount:378,
    freeze:binding(PROPOSED_FREEZE,result.freezeBytes),fragment:binding(PROPOSED_FRAGMENT,result.fragmentBytes),proposedRegistry:binding(REGISTRY,result.nextRegistryBytes),descriptorAndBridgeAdmissionPending:true};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const args=process.argv.slice(2);assert.ok(args.length<=1&&(!args[0]||['--plan','--write','--check'].includes(args[0])));
  console.log(JSON.stringify(await prepareRepairRegistration({write:args[0]==='--write',check:args[0]==='--check'}),null,2));}
