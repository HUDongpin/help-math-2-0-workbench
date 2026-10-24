import assert from 'node:assert/strict';
import test from 'node:test';
import {pinFile,readJsonPin,readPin} from '../../../lib/g678-admission-proof.mjs';
import {ID,CALIBRATION,SOURCE_ROOT,FREEZE_PATH,PROOF_PATH,SOURCE,XML,SA,
 SOURCE_AUDIT,AUDIO_AUDIT,BEHAVIOR_AUDIT,TEXT_AUDIT_PATH,GLOSSARY_AUDIT,
 CANVAS_MANIFEST,BROWSER_AUDIO,MAIN_AUDIO,SA_COPY,CANVAS_SOURCE,MAINTAINED_PATHS,
 CONTINUOUS,OPTIONAL_SPANISH,GLOSSARY,ACCEPTANCE,COMPLEXITY_LANE,
 proposedP014Artifacts,p014Runtime} from '../../../lib/alg-l06-p014-admission-semantics-v1.mjs';
import {algL6P013FormalDescriptor} from '../lib/alg-l06-p013-formal-admission-v1.server';
import {algL6P014FormalDescriptor} from '../lib/alg-l06-p014-formal-admission-v1.server';
import {ALG_L06_P014_ADMISSION_CALIBRATION,extendAlgL6P014Descriptor,
 type AlgL06P014DescriptorInput} from '../lib/alg-l06-p014-descriptor-extension-v1';
import {localOnlyAnimationModuleRegistration}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from '../lib/catalog';
import {G678_ADMISSION_INDEX} from '../lib/g678-admission-activation';

const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_SOURCE_ROOT:SOURCE_ROOT,
 HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'});
delete env.VERCEL;delete env.VERCEL_ENV;
const root=getWorkspaceRoot(),base=algL6P013FormalDescriptor();
const artifacts=proposedP014Artifacts(root);
const freezeManifest={path:FREEZE_PATH,bytes:1,sha256:'a'.repeat(64)};
const entry={key:ID,module:`./modules/${ID}`,maturity:'private-current-js',
 complexityLane:COMPLEXITY_LANE,artifacts};
const packet={schemaVersion:1,calibrationId:CALIBRATION,sourceRoot:SOURCE_ROOT,
 scope:'private-engineering',deploymentScope:'local-only',source:SOURCE,sourceXml:XML,
 freezeManifest,continuousSource:CONTINUOUS,optionalSpanishAudio:OPTIONAL_SPANISH,
 glossaryActions:GLOSSARY,
 selectedPages:[{animationId:ID,placementId:ID,assetId:`swf-${SOURCE.sha256}`,
  sourceSha256:SOURCE.sha256,moduleCode:'ALG001',lessonNumber:6,
  globalPageOrdinal:14,sourceOccurrence:14,sectionCode:'VB',sectionPageOrdinal:4,
  complexityLane:COMPLEXITY_LANE,runtime:p014Runtime(artifacts)}],entry,
 integrity:{completeTransitiveClosure:false,files:[SOURCE_AUDIT,AUDIO_AUDIT,BEHAVIOR_AUDIT,
  pinFile(root,TEXT_AUDIT_PATH),GLOSSARY_AUDIT,CANVAS_MANIFEST,BROWSER_AUDIO,
  ...MAIN_AUDIO,SA_COPY,CANVAS_SOURCE,
  ...MAINTAINED_PATHS.map(relative=>pinFile(root,relative)),...Object.values(artifacts)]},
 acceptanceEffects:ACCEPTANCE,productCalibrationPassed:false,scaleOutAuthorized:false};
const registration={calibrationId:CALIBRATION,deploymentScope:'local-only',
 freezeManifest:FREEZE_PATH,freezeManifestBytes:freezeManifest.bytes,
 freezeManifestSha256:freezeManifest.sha256,entries:[entry]};
const metadata={calibrationId:CALIBRATION,deploymentScope:'local-only',
 maturity:'private-current-js',freezeManifestSha256:freezeManifest.sha256,
 moduleSha256:artifacts.module.sha256,timelineSha256:artifacts.timeline.sha256,
 runtimeSha256:artifacts.runtime.sha256};
const planned={packet,registration,metadata} as unknown as AlgL06P014DescriptorInput;

function reject(change:(value:any,predecessor:any)=>void){
 const value=structuredClone(planned),predecessor=structuredClone(base);
 change(value,predecessor);
 assert.throws(()=>extendAlgL6P014Descriptor(predecessor,value,root),
  /ALG_L06_P014_DESCRIPTOR_INVALID/u);
}

test('exact P013 predecessor gains only VB4; source glossary and other 59 rows remain intact',()=>{
 const result=extendAlgL6P014Descriptor(base,planned,root);
 assert.equal(base.productBridge.registeredAnimationCount,24);
 assert.equal(base.pages[13].rendererAvailability.kind,'unavailable');
 assert.equal(result.productBridge.registeredAnimationCount,25);
 assert.equal(result.pages.length,60);
 for(let index=0;index<60;index++)if(index!==13)
  assert.equal(result.pages[index],base.pages[index]);
 assert.equal(result.pages[13].rendererAvailability.kind,'registered');
 if(result.pages[13].rendererAvailability.kind==='registered'){
  assert.equal(result.pages[13].rendererAvailability.moduleKey,ID);
  assert.deepEqual(result.pages[13].rendererAvailability.runtimeQuery,
   {frameDomain:'sprite-227',language:'fixed-en',scenario:'source-static-frame',seed:'0'});
 }
 assert.equal(result.pages[13].presentation?.pageInteractionCompanionTargetIdSuffix,
  'p014-source-readable');
 assert.equal(result.pages[13].labels,base.pages[13].labels);
 assert.equal(result.glossary,base.glossary);
 assert.deepEqual(result.glossary.filter(row=>['input','output'].includes(row.id))
  .map(row=>row.id),['input','output']);
 assert.equal(result.support,base.support);
 assert.deepEqual(result.productBridge.acceptanceEffects,base.productBridge.acceptanceEffects);
 assert(Object.values(result.productBridge.acceptanceEffects).every(value=>value===false));
 assert.equal(result.calibrationId,ALG_L06_P014_ADMISSION_CALIBRATION);
 assert.equal(result.course.href,
  '/migration-status/g678-calibration/shared-alg001-l06-p014/continuous-v1');
});

test('quiz branches, two main ranges, independent SA and exact source pins fail closed on drift',()=>{
 reject(value=>{value.packet.source.sha256='f'.repeat(64);});
 reject(value=>{value.packet.selectedPages[0].globalPageOrdinal=15;});
 reject(value=>{value.packet.selectedPages[0].runtime.frameCount=448;});
 reject(value=>{value.packet.selectedPages[0].runtime.quizHoldFrame=121;});
 reject(value=>{value.packet.continuousSource.mainRangeFrames[0][1]=111;});
 reject(value=>{value.packet.continuousSource.feedbackDomains.wrong[0][1]=23;});
 reject(value=>{value.packet.optionalSpanishAudio.trigger='locale-autoplay';});
 reject(value=>{value.packet.optionalSpanishAudio.mainStreamSpliced=true;});
 reject(value=>{value.packet.glossaryActions.Input.entryId='output';});
 reject(value=>{value.packet.glossaryActions.Output.actionSha256='f'.repeat(64);});
 reject(value=>{value.packet.integrity.files.find((pin:{path:string})=>
  pin.path===BEHAVIOR_AUDIT.path).sha256='f'.repeat(64);});
 reject(value=>{value.packet.entry.artifacts.runtime.sha256='f'.repeat(64);});
 reject(value=>{value.registration.freezeManifestSha256='f'.repeat(64);});
 reject(value=>{value.metadata.moduleSha256='f'.repeat(64);});
 reject(value=>{value.packet.acceptanceEffects.ownerAccepted=true;});
});

test('predecessor count, links, registration set and glossary identities fail closed on drift',()=>{
 reject((_,predecessor)=>{predecessor.productBridge.registeredAnimationCount=25;});
 reject((_,predecessor)=>{predecessor.pages[13].source.assetId='swf-'+'f'.repeat(64);});
 reject((_,predecessor)=>{predecessor.pages[13].nextPlacementId='shared-alg001-l06-p016';});
 reject((_,predecessor)=>{predecessor.productBridge.selectedAnimationIds.reverse();});
 reject((_,predecessor)=>{predecessor.glossary.splice(
  predecessor.glossary.findIndex((row:{id:string})=>row.id==='output'),1);});
});

test('formal reader denies unregistered P014 or reads the exact active proof and only VB4',()=>{
 const index=readJsonPin(root,G678_ADMISSION_INDEX);
 const pinned=index.pages.filter((page:{animationId:string})=>page.animationId===ID);
 const registered=localOnlyAnimationModuleRegistration(ID);
 if(pinned.length===0&&!registered){
  assert.throws(()=>algL6P014FormalDescriptor(),/P014_FORMAL_EXACT_V1_ADMISSION/u);
  return;
 }
 assert.equal(pinned.length,1,'one exact P014 active-index proof');
 assert.equal(pinned[0].proof.path,PROOF_PATH);
 assert(registered,'P014 registry metadata must accompany the active proof');
 const result=algL6P014FormalDescriptor();
 assert.equal(result.productBridge.registeredAnimationCount,25);
 assert.equal(result.pages.filter(page=>page.rendererAvailability.kind==='registered').length,25);
 assert.equal(result.pages.length,60);
 for(let index=0;index<60;index++)if(index!==13)
  assert.deepEqual(result.pages[index],base.pages[index]);
 const target=result.pages[13];
 assert.equal(target.animationId,ID);
 assert.equal(target.placementId,ID);
 assert.equal(target.source.assetId,`swf-${SOURCE.sha256}`);
 assert.equal(target.rendererAvailability.kind,'registered');
 if(target.rendererAvailability.kind==='registered'){
  assert.equal(target.rendererAvailability.moduleKey,ID);
  assert.deepEqual(target.rendererAvailability.runtimeQuery,
   {frameDomain:'sprite-227',language:'fixed-en',scenario:'source-static-frame',seed:'0'});
 }
 assert.equal(target.presentation?.pageInteractionCompanionTargetIdSuffix,
  'p014-source-readable');
 assert.deepEqual(result.glossary,base.glossary);
 assert(Object.values(result.productBridge.acceptanceEffects).every(value=>value===false));
});

test('physical source identities remain separate from structural admission planning',()=>{
 for(const pin of [SOURCE,XML,SA])readPin(SOURCE_ROOT,pin);
 assert.equal(SOURCE.sha256,'aed0f7755d4f691cefcc28c815acc6b9d083fdfaae88ff385f22d3b32ba07603');
 assert.equal(PROOF_PATH,'work/g678-workflow/candidates/shared-alg001-l06-p014-proof-v1.json');
});
