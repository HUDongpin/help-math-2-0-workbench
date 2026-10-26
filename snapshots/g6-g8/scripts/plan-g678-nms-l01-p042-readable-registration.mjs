#!/usr/bin/env node
// Exact one-page378 projection. Planning never writes a registry or freeze.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT,REGISTRY,CALIBRATION_ID,encode,binding,descriptor} from './prepare-g678-alg-l11-feedback-host-score-registration.mjs';
import {readBoundActivationFile} from './activate-g678-alg-l11-feedback-host-score-registration.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';
import {generate} from './build-g678-nms-l01-p042-readable-current-js.mjs';
export {ROOT,REGISTRY,CALIBRATION_ID,encode,binding,descriptor};
export const ID='shared-nms002-l01-p042';
export const PLANNER='scripts/plan-g678-nms-l01-p042-readable-registration.mjs';
export const PREDECESSOR_REGISTRY_WITNESS='catalog/product-bridge-calibrations/g678-math-companion-v4-private-current-js-registry-witness-v1.json';
export const LIVE_PREDECESSOR_REGISTRY=Object.freeze({path:REGISTRY,bytes:431148,sha256:'dbb6093d6e36041a99474530c16d76541cfef608fc25a309cdcd8befc0b173c8'});
export const PRIOR=Object.freeze({
  freeze:{path:'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v4.json',bytes:2408370,sha256:'4633c4a3853e44ff1cd58184cf154acc6edc7e2e96ed936c72ce2decc006d358'},
  fragment:{path:'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v4.fragment.json',bytes:384230,sha256:'637006cf11e2b8aed9020faf008d9b34980293a2f47ed3283d9dcf39a0bf6b6d'},
  registry:{...LIVE_PREDECESSOR_REGISTRY,path:PREDECESSOR_REGISTRY_WITNESS},
  activation:{path:'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v4.activation.json',bytes:9634,sha256:'a3e135424f6f868e2c230a8bc6a7923a8d403baf8b1b280ee2fc352de009dae9'},
});
export const SOURCE_AUTHORITY=Object.freeze({path:'catalog/product-bridge-calibrations/g678-nms-l01-p042-readable-companion-current-js-v1.fragment.json',bytes:4942,
  sha256:'90f82d1efa3de8d5658135a1d7a4b9c6ace6abc4beb8bba9e644d63331fd4921'});
export const SOURCE_RUN=Object.freeze({path:'work/g678-shared-page-factory/g678-nms-l01-p042-readable-current-js-v1/run-manifest.json',bytes:27824,
  sha256:'9691c28d31d3887aebeefc3c05e38f0538acfe0c2fb74341779e396e4657aa23'});
export const CATALOG=Object.freeze({path:'catalog/g678-shared-catalog.v1.json',bytes:12534064,sha256:'a1692c2a86c6771dcb104f59195b5bfdd2b5281cceff0aaeb63a3aabcf4a5657'});
export const PROPOSED_FREEZE='catalog/product-bridge-calibrations/g678-current-js-378-page-registration-v1.json';
export const PROPOSED_FRAGMENT='catalog/product-bridge-calibrations/g678-current-js-378-page-registration-v1.fragment.json';
export const PHASE='nms-l01-p042-companion-provisional-browser-qa';
const SUFFIX='nms-l01-p042-readable-companion';
export function composeP042ReadableRegistration({priorFreeze,priorFragment,priorRegistry,source,pagesCatalog,plannerBinding}) {
  for(const[pin,value]of[[PRIOR.freeze,priorFreeze],[PRIOR.fragment,priorFragment],[PRIOR.registry,priorRegistry],[SOURCE_AUTHORITY,source],[CATALOG,pagesCatalog]])
    assert.deepEqual(binding(pin.path,encode(value)),pin,`Exact input drift: ${pin.path}`);
  assert.deepEqual(Object.keys(plannerBinding).sort(),['bytes','path','sha256']);
  assert.equal(plannerBinding.path,PLANNER);assert.ok(Number.isSafeInteger(plannerBinding.bytes)&&plannerBinding.bytes>0&&/^[a-f0-9]{64}$/.test(plannerBinding.sha256));
  assert.equal(source.artifactType,'g678-nms-l01-p042-readable-companion-current-js-fragment-v1');
  assert.equal(source.entries.length,1);assert.deepEqual(source.compilerRun,SOURCE_RUN);
  assert.equal(source.entries[0].key,ID);assert.equal(source.currentJavaScriptRegisteredCount,0);
  assert.ok(Object.values(source.acceptanceEffects).every(value=>value===false));
  const entry=source.entries[0];assert.ok(Object.values(entry.acceptanceEffects).every(value=>value===false));
  assert.deepEqual(entry.runtimeContract.lessonHostCapabilities,[]);assert.deepEqual(entry.runtimeContract.interactiveStops,[]);
  assert.deepEqual(entry.proposedPresentation,{pageInteractionCompanionTargetIdSuffix:SUFFIX,descriptorActivated:false});
  const lessons=pagesCatalog.lessons.filter(lesson=>lesson.stableLessonKey==='shared-nms002-l01');assert.equal(lessons.length,1);
  assert.equal(lessons[0].pages.length,47);const matches=lessons[0].pages.filter(page=>page.animationId===ID);assert.equal(matches.length,1);
  const page=matches[0];assert.equal(page.globalOrdinal,42);assert.equal(page.sectionPageOrdinal,5);
  assert.equal(page.sectionCode,'TS');assert.equal(page.sourceSha256,entry.source.sha256);assert.equal(page.sourceBytes,entry.source.bytes);
  assert.equal(page.viewPath,entry.source.path);assert.equal(page.sourceStatus,'resolved-canonical');
  const calibrations=priorRegistry.calibrations.filter(c=>c.calibrationId===CALIBRATION_ID);assert.equal(calibrations.length,1);
  const current=calibrations[0];assert.equal(current.entries.length,377);assert.deepEqual(current,priorFragment.calibration);
  assert.equal(priorFreeze.selectedPages.length,377);assert.equal(priorFreeze.registrationCandidatePlacementCount,377);
  assert.equal(priorFreeze.sharedAdapterPlacementCount,365);assert.equal(priorFreeze.advancedManualPlacementCount,12);
  assert.deepEqual(priorFreeze.pendingAdvancedManualPlacements,[]);assert.ok(!priorFreeze.selectedPages.some(p=>p.animationId===ID));
  const artifacts={kind:'maintained-dom-module-v1',module:entry.moduleFile,timeline:entry.timeline,memberManifest:entry.memberManifest,sourceRun:source.compilerRun};
  const selected={animationId:ID,placementId:page.placementId,assetId:page.assetId,moduleCode:page.moduleCode,lessonNumber:page.lessonNumber,
    stableLessonKey:page.stableLessonKey,globalPageOrdinal:page.globalOrdinal,sectionCode:page.sectionCode,sectionPageOrdinal:page.sectionPageOrdinal,
    sourceSha256:page.sourceSha256,complexityLane:'behavior-heavy',adapterFamily:entry.adapterFamily,
    implementation:{kind:'maintained-dom-current-js-candidate',deploymentScope:'local-only',sourceBoundStateMachineImplemented:true,
      sourceBoundInstructionalVisualsImplemented:true,sourceLiteralReadableCompanionImplemented:true,
      familyVisualPlaybackCalibrationPassed:false,registeredCompanionProductQaPassed:false,productCalibrationPassed:false},
    runtime:{...structuredClone(entry.runtimeContract),rendererBinding:structuredClone(artifacts)},
    presentation:{pageInteractionCompanionTargetIdSuffix:SUFFIX},
    runtimeEvidenceBoundary:{runtimeKind:'source-script-bound-product-behavior-current-js-candidate',actionScriptExecution:'not-executed',
      naturalTraceValidation:'not-established',audioAcceptance:'not-established',replaySemantics:'product-complete-interaction-reset-original-runtime-parity-not-established'},
    sourceCandidateBlockers:['historical-preloader-adapter-original-runtime-parity-pending','source-stream-audio-priming-seek-pause-replay-lifecycle-not-integrated',
      'authoritative-original-runtime-not-established','visual-fidelity-and-human-review-not-accepted'],
    productBlockers:['p042-readable-companion-actual-my-lesson-calibration-pending','source-audio-lifecycle-and-listening-acceptance-pending',
      'named-human-screen-reader-and-spanish-spoken-alternatives-pending','authoritative-original-runtime-not-established','visual-fidelity-not-accepted'],
    p042ReadableSuccessor:{authority:SOURCE_AUTHORITY,baseCandidateManifest:source.baseCandidateManifest,sourceCandidateManifest:source.readableCandidateManifest,
      registryActivationRequired:true,candidateMountedEvidenceOnly:true,registeredCompanionProductQaPassed:false,
      staticVisualComplexity:'low',distinctSourceDrawings:1,
      advancedManualLaneReason:'Full-root source composition and native readable companion; historical preloader and118 nested stream blocks/audio lifecycle remain unresolved.'},
    productCalibrationPassed:false,engineeringPreviewReady:false};
  const freeze=structuredClone(priorFreeze);
  freeze.selectedPages=[...freeze.selectedPages,selected].sort((a,b)=>a.animationId.localeCompare(b.animationId));
  assert.deepEqual(freeze.selectedPages.filter(p=>p.animationId!==ID),priorFreeze.selectedPages,'Preserve377 selected objects/order');
  freeze.registrationCandidatePlacementCount=378;freeze.advancedManualPlacementCount=13;
  assert.equal(freeze.selectedPages.filter(p=>p.stableLessonKey==='shared-nms002-l01').length,11);
  freeze.inputs={...freeze.inputs,selectionAuthorities:[...freeze.inputs.selectionAuthorities,structuredClone(SOURCE_AUTHORITY)],
    p042PredecessorFreeze:PRIOR.freeze,p042PredecessorFragment:PRIOR.fragment,p042PredecessorRegistry:PRIOR.registry,
    p042Source:SOURCE_AUTHORITY,p042Planner:structuredClone(plannerBinding)};
  freeze.productHostCalibration={...freeze.productHostCalibration,currentHostBrowserRevalidated:false,p042MountedCandidateCount:1,p042RegisteredProductQaCount:0};
  assert.equal(freeze.productHostCalibration.registeredCompleteLessonCount,2);
  freeze.limitations=[...freeze.limitations,'Exact single p042 addition to377 preserved selected pages;378 total,365 shared-adapter and13 advanced-manual placements. NMS L1 is11/47, not a complete lesson.',
    'p042 isolated readable-companion Runtime QA is candidate-only; actual My Lesson slot/inert/Replay calibration and source audio/original-runtime/human/Owner gates remain pending.'];
  assert.equal(freeze.productCalibrationPassed,false);assert.equal(freeze.scaleOutAuthorized,false);
  assert.ok(Object.values(freeze.acceptanceEffects).every(value=>value===false));
  const freezeBytes=encode(freeze),freezeBinding=binding(PROPOSED_FREEZE,freezeBytes);
  const registryEntry={key:ID,module:entry.module,maturity:'private-current-js',complexityLane:'behavior-heavy',artifacts:structuredClone(artifacts)};
  const calibration={...structuredClone(current),freezeManifest:PROPOSED_FREEZE,freezeManifestBytes:freezeBinding.bytes,freezeManifestSha256:freezeBinding.sha256,
    entries:[...structuredClone(current.entries),registryEntry].sort((a,b)=>a.key.localeCompare(b.key))};
  assert.deepEqual(calibration.entries.filter(e=>e.key!==ID),current.entries,'Preserve377 registry entry objects/order');
  const nextRegistry=upsertPrivateCurrentJsCalibration(priorRegistry,calibration);
  assert.deepEqual(nextRegistry.calibrations.filter(c=>c.calibrationId!==CALIBRATION_ID),priorRegistry.calibrations.filter(c=>c.calibrationId!==CALIBRATION_ID));
  const fragment={schemaVersion:1,artifactType:'private-current-js-calibration-fragment-v1',freeze:freezeBinding,calibration,
    predecessorRegistry:PRIOR.registry,sourceSuccessorFragment:SOURCE_AUTHORITY,registryActivationRequired:true,productCalibrationPassed:false,
    addedModuleCount:1,preservedPageCount:377,registrationCount:378,phase:PHASE};
  return{freeze,freezeBytes,fragment,fragmentBytes:encode(fragment),nextRegistry,nextRegistryBytes:encode(nextRegistry)};
}
export async function readP042ReadableRegistration({requireWitness=false}={}) {
  const before=await readBoundActivationFile(ROOT,REGISTRY);let witness,witnessExists=true;
  try{witness=await readBoundActivationFile(ROOT,PRIOR.registry.path,PRIOR.registry);assert.equal(witness.mode&0o222,0);}
  catch(error){if(error.code!=='ENOENT'||requireWitness)throw error;assert.deepEqual(descriptor(before),LIVE_PREDECESSOR_REGISTRY);
    witness={...before,path:PRIOR.registry.path};witnessExists=false;}
  const pins=[PRIOR.freeze,PRIOR.fragment,PRIOR.activation,SOURCE_AUTHORITY,SOURCE_RUN,CATALOG];
  const inputs=await Promise.all(pins.map(pin=>readBoundActivationFile(ROOT,pin.path,pin)));
  const planner=await readBoundActivationFile(ROOT,PLANNER),byPath=new Map(inputs.map(input=>[input.path,input]));
  const result=composeP042ReadableRegistration({priorFreeze:JSON.parse(byPath.get(PRIOR.freeze.path).buffer),priorFragment:JSON.parse(byPath.get(PRIOR.fragment.path).buffer),
    priorRegistry:JSON.parse(witness.buffer),source:JSON.parse(byPath.get(SOURCE_AUTHORITY.path).buffer),pagesCatalog:JSON.parse(byPath.get(CATALOG.path).buffer),plannerBinding:descriptor(planner)});
  // The old activation receipt is immutable lineage evidence, not a request to
  // re-run its live-registry checker after this successor has been activated.
  const activation=JSON.parse(byPath.get(PRIOR.activation.path).buffer);
  assert.equal(activation.registrationCount,377);assert.ok(Object.values(activation.acceptanceEffects).every(v=>v===false));
  await generate({mode:'check'});
  for(const input of [...inputs,planner])await readBoundActivationFile(ROOT,input.path,descriptor(input));
  assert.ok((await readFile(path.join(ROOT,REGISTRY))).equals(before.buffer),'Concurrent registry drift');
  assert.ok(before.buffer.equals(witness.buffer)||before.buffer.equals(result.nextRegistryBytes),'Live registry must be exact V4 or exact proposed378');
  return{result,before,witness,witnessExists,inputs:[...inputs,planner]};
}
export async function planP042ReadableRegistration(){const{result}=await readP042ReadableRegistration();return{mode:'plan',writes:0,activationExecuted:false,
  proposedFreeze:binding(PROPOSED_FREEZE,result.freezeBytes),proposedFragment:binding(PROPOSED_FRAGMENT,result.fragmentBytes),
  proposedRegistry:binding(REGISTRY,result.nextRegistryBytes),addedModuleCount:1,preservedPageCount:377,registrationCount:378,
  descriptorSlotActivationPending:true,productCalibrationPassed:false,sourceAudioIntegrated:false};}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  assert.ok(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--plan','Read-only --plan only');
  planP042ReadableRegistration().then(result=>console.log(JSON.stringify(result,null,2))).catch(error=>{console.error(error);process.exitCode=1;});
}
