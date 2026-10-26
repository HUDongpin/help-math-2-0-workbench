#!/usr/bin/env node
// Read-only exact379 projection. No registry, freeze, descriptor or provider writes.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';
import {CALIBRATION_ID} from './prepare-g678-alg-l11-feedback-host-score-registration.mjs';
import {prepare as checkStableCandidate} from './prepare-g678-nms-l01-p044-stable-candidate.mjs';
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),ID='shared-nms002-l01-p044';
export const PLANNER='scripts/plan-g678-nms-l01-p044-registration.mjs',REGISTRY='packages/demos/private-current-js-registry.json';
export const PROPOSED_FREEZE='catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v1.json';
export const PROPOSED_FRAGMENT='catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v1.fragment.json';
export const PHASE='nms-l01-p044-prepared-provisional-browser-qa';
export const PRIOR=Object.freeze({
  freeze:{path:'catalog/product-bridge-calibrations/g678-current-js-378-page-registration-v1.json',bytes:2415408,sha256:'cf4921508fcaff5270c2dc4a3bd2571397b9c456b0ff5c1cae46378081e71cf5'},
  fragment:{path:'catalog/product-bridge-calibrations/g678-current-js-378-page-registration-v1.fragment.json',bytes:385667,sha256:'ae0be0d61384d2f95049b0b37b464174b7829ff93a219272ddf4692f4e72a869'},
  registry:{path:'catalog/product-bridge-calibrations/g678-current-js-378-private-registry-witness-v1.json',bytes:432557,sha256:'c075c204a21c020da2cef54bec74a2e713d7eba1c4fc3d55b158e0d8a8d464e2'},
  activation:{path:'catalog/product-bridge-calibrations/g678-current-js-378-page-registration-v1.activation.json',bytes:10639,sha256:'68a61339c66a0a46b740b4a6f06db0698a07a5a2057f5e78b3dce6e7a1e4d009'},
});
export const AUTHORITY=Object.freeze({path:'catalog/product-bridge-calibrations/g678-nms-l01-p044-prepared-current-js-v2.fragment.json',bytes:9139,sha256:'6208880d4423d19645b508106b65f53a692dcd2bebf5c98909379851d1f1c00d'});
export const BASE_AUTHORITY=Object.freeze({path:'catalog/product-bridge-calibrations/g678-nms-l01-p044-prepared-current-js-v1.fragment.json',bytes:8656,sha256:'7968b01d93dbba8fa073934f4c1f97a0914c3865eddcbdc485e4d27f49f309c0'});
export const CATALOG=Object.freeze({path:'catalog/g678-shared-catalog.v1.json',bytes:12534064,sha256:'a1692c2a86c6771dcb104f59195b5bfdd2b5281cceff0aaeb63a3aabcf4a5657'});
export const encode=v=>Buffer.from(JSON.stringify(v,null,2)+'\n');
export const binding=(p,b)=>({path:p,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});
export function composeP044Registration({priorFreeze,priorFragment,priorRegistry,source,sourceBase,pagesCatalog,plannerBinding}){
  for(const[pin,value]of[[PRIOR.freeze,priorFreeze],[PRIOR.fragment,priorFragment],[PRIOR.registry,priorRegistry],[AUTHORITY,source],[BASE_AUTHORITY,sourceBase],[CATALOG,pagesCatalog]])assert.deepEqual(binding(pin.path,encode(value)),pin);
  assert.equal(plannerBinding.path,PLANNER);assert.ok(plannerBinding.bytes>0&&/^[a-f0-9]{64}$/.test(plannerBinding.sha256));
  assert.equal(source.artifactType,'g678-nms-l01-p044-prepared-current-js-fragment-v2');assert.equal(source.entries.length,1);
  const entry=source.entries[0];assert.equal(entry.key,ID);assert.equal(entry.deploymentScope,'local-only');assert.ok(Object.values(entry.acceptanceEffects).every(v=>v===false));
  assert.deepEqual(source.baseSourceAuthority,BASE_AUTHORITY);assert.equal(sourceBase.entries.length,1);assert.equal(sourceBase.entries[0].key,ID);
  for(const key of['moduleFile','timeline','memberManifest'])assert.deepEqual(entry[key],sourceBase.entries[0][key]);
  assert.equal(source.currentJavaScriptRegisteredCount,0);assert.deepEqual(source.predecessorRegistryWitness,PRIOR.registry);
  const lesson=pagesCatalog.lessons.find(l=>l.stableLessonKey==='shared-nms002-l01');assert.equal(lesson.pages.length,47);
  const pages=lesson.pages.filter(p=>p.animationId===ID);assert.equal(pages.length,1);const page=pages[0];
  assert.equal(page.globalOrdinal,44);assert.equal(page.sectionPageOrdinal,7);assert.equal(page.sectionCode,'TS');assert.equal(page.sourceStatus,'resolved-canonical');
  assert.deepEqual({path:page.viewPath,bytes:page.sourceBytes,sha256:page.sourceSha256},entry.source);
  const current=priorRegistry.calibrations.find(c=>c.calibrationId===CALIBRATION_ID);assert.equal(current.entries.length,378);assert.deepEqual(current,priorFragment.calibration);
  assert.equal(priorFreeze.selectedPages.length,378);assert.equal(priorFreeze.sharedAdapterPlacementCount,365);assert.equal(priorFreeze.advancedManualPlacementCount,13);
  assert.ok(!priorFreeze.selectedPages.some(p=>p.animationId===ID));
  const m=entry.runtimeContract;assert.equal(m.key,ID);assert.equal(m.runtime.defaultFrameDomain,'sprite-293');assert.equal(m.playbackEndFrame,756);
  // V1 is the actual compiler/member origin. V2 validates stable historical
  // inputs; it does not relocate or regenerate the original member file.
  const artifacts={kind:'maintained-dom-module-v1',module:entry.moduleFile,timeline:entry.timeline,memberManifest:entry.memberManifest,sourceRun:sourceBase.compilerRun};
  const runtime={stage:m.movie.stage,rootFrameCount:10,rootBeginFrame:6,frameDomain:'sprite-293',frameCount:759,fps:12,livePlaybackEndFrame:756,
    scenario:m.scenarios[0].id,language:'fixed-en',seed:'0',interactiveStops:m.interactiveStops,authoredTimelineControls:[],reducedMotionFrame:756,
    lessonHostCapabilities:m.lessonHost.capabilities,rendererBinding:artifacts};
  const selected={animationId:ID,placementId:page.placementId,assetId:page.assetId,moduleCode:page.moduleCode,lessonNumber:page.lessonNumber,
    stableLessonKey:page.stableLessonKey,globalPageOrdinal:44,sectionCode:'TS',sectionPageOrdinal:7,sourceSha256:page.sourceSha256,
    complexityLane:'behavior-heavy',adapterFamily:entry.adapterFamily,
    implementation:{kind:'maintained-dom-current-js-candidate',deploymentScope:'local-only',sourceBoundStateMachineImplemented:true,sourceBoundInstructionalVisualsImplemented:true,
      sourceLiteralReadableCompanionImplemented:true,sourceImagesPreparedBeforeModuleAdmission:true,familyVisualPlaybackCalibrationPassed:false,registeredCompanionProductQaPassed:false,productCalibrationPassed:false},
    runtime,presentation:{pageInteractionCompanionTargetIdSuffix:entry.proposedPresentation.pageInteractionCompanionTargetIdSuffix},
    runtimeEvidenceBoundary:{runtimeKind:'source-script-bound-product-behavior-current-js-candidate',actionScriptExecution:'not-executed',naturalTraceValidation:'isolated-current-js-only',
      audioAcceptance:'not-established',replaySemantics:'product-reset-tested-original-runtime-parity-not-established'},
    sourceCandidateBlockers:['source-host-feedback-random-selection-unresolved','nested-opening-entry-order-original-runtime-parity-pending','sprite196-386-byte-residual-uninterpreted',
      'a_text-legacy-write-has-no-local-target','nine-nested-audio-streams-unintegrated','authoritative-original-runtime-not-established'],
    productBlockers:['exact-p044-private-my-lesson-calibration-pending','source-audio-lifecycle-and-listening-acceptance-pending','named-human-and-owner-review-pending'],
    p044PreparedSuccessor:{authority:AUTHORITY,candidateManifest:source.candidateManifest,predecessorRegistryWitness:PRIOR.registry,sourceImagesDecodedBeforeAdmission:11,
      originalCompilerRun:sourceBase.compilerRun,stableValidationRun:source.compilerRun,
      registryActivationRequired:true,candidateMountedEvidenceOnly:true,registeredCompanionProductQaPassed:false},productCalibrationPassed:false,engineeringPreviewReady:false};
  const freeze=structuredClone(priorFreeze);freeze.selectedPages=[...freeze.selectedPages,selected].sort((a,b)=>a.animationId.localeCompare(b.animationId));
  assert.deepEqual(freeze.selectedPages.filter(p=>p.animationId!==ID),priorFreeze.selectedPages);
  freeze.registrationCandidatePlacementCount=379;freeze.advancedManualPlacementCount=14;
  assert.equal(freeze.selectedPages.filter(p=>p.stableLessonKey==='shared-nms002-l01').length,12);
  freeze.inputs={...freeze.inputs,selectionAuthorities:[...freeze.inputs.selectionAuthorities,AUTHORITY],p044PredecessorFreeze:PRIOR.freeze,
    p044PredecessorFragment:PRIOR.fragment,p044PredecessorRegistry:PRIOR.registry,p044Source:AUTHORITY,p044Planner:plannerBinding};
  freeze.productHostCalibration={...freeze.productHostCalibration,currentHostBrowserRevalidated:false,p044MountedPreparedCandidateCount:1,p044RegisteredProductQaCount:0};
  freeze.limitations=[...freeze.limitations,'One exact p044 addition preserves378 predecessor selected objects. Proposed379 is not active; NMS L1 would be12/47.',
    'Prepared resources and isolated Runtime/portal QA do not substitute for actual My Lesson, original runtime, audio, human/Owner or release gates.'];
  assert.equal(freeze.scaleOutAuthorized,false);assert.equal(freeze.productCalibrationPassed,false);
  const freezeBytes=encode(freeze),freezePin=binding(PROPOSED_FREEZE,freezeBytes);
  const calibration={...structuredClone(current),freezeManifest:PROPOSED_FREEZE,freezeManifestBytes:freezePin.bytes,freezeManifestSha256:freezePin.sha256,
    entries:[...structuredClone(current.entries),{key:ID,module:entry.module,maturity:'private-current-js',complexityLane:'behavior-heavy',artifacts}].sort((a,b)=>a.key.localeCompare(b.key))};
  assert.deepEqual(calibration.entries.filter(e=>e.key!==ID),current.entries);
  const nextRegistry=upsertPrivateCurrentJsCalibration(priorRegistry,calibration);
  assert.deepEqual(nextRegistry.calibrations.filter(c=>c.calibrationId!==CALIBRATION_ID),priorRegistry.calibrations.filter(c=>c.calibrationId!==CALIBRATION_ID));
  const fragment={schemaVersion:1,artifactType:'private-current-js-calibration-fragment-v1',freeze:freezePin,calibration,predecessorRegistry:PRIOR.registry,
    sourceSuccessorFragment:AUTHORITY,registryActivationRequired:true,productCalibrationPassed:false,addedModuleCount:1,preservedPageCount:378,registrationCount:379,phase:PHASE};
  return{freeze,freezeBytes,fragment,fragmentBytes:encode(fragment),nextRegistry,nextRegistryBytes:encode(nextRegistry)};
}
export async function plan(){await checkStableCandidate(true);const pins=[PRIOR.freeze,PRIOR.fragment,PRIOR.registry,AUTHORITY,BASE_AUTHORITY,CATALOG,PRIOR.activation],inputs=new Map();
  for(const p of pins){const b=await readFile(path.join(ROOT,p.path));assert.deepEqual(binding(p.path,b),p);inputs.set(p.path,JSON.parse(b));}
  const before=await readFile(path.join(ROOT,REGISTRY));assert.deepEqual(binding(PRIOR.registry.path,before),PRIOR.registry);
  const plannerBinding=binding(PLANNER,await readFile(path.join(ROOT,PLANNER)));
  const result=composeP044Registration({priorFreeze:inputs.get(PRIOR.freeze.path),priorFragment:inputs.get(PRIOR.fragment.path),priorRegistry:inputs.get(PRIOR.registry.path),
    source:inputs.get(AUTHORITY.path),sourceBase:inputs.get(BASE_AUTHORITY.path),pagesCatalog:inputs.get(CATALOG.path),plannerBinding});
  assert.ok((await readFile(path.join(ROOT,REGISTRY))).equals(before));
  return{mode:'read-only-plan',writes:0,registryChanged:false,activationExecuted:false,registrationCountCurrent:378,registrationCountAfterActivation:379,
    nmsL1AfterActivation:'12/47',preservedPageCount:378,proposedFreeze:binding(PROPOSED_FREEZE,result.freezeBytes),
    proposedFragment:binding(PROPOSED_FRAGMENT,result.fragmentBytes),proposedRegistry:binding(REGISTRY,result.nextRegistryBytes),
    descriptorAndBridgeAdmissionPending:true,actualMyLessonQaPending:true};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert.equal(process.argv.length,2);console.log(encode(await plan()).toString());}
