import assert from 'node:assert/strict';
import test from 'node:test';
import {readJsonPin} from '../../../lib/g678-admission-proof.mjs';
import {ID,CALIBRATION,SOURCE_ROOT,FREEZE_PATH,SOURCE,XML,SA,
 SOURCE_AUDIT,AUDIO_AUDIT,TEXT_AUDIT,HOST_AUDIT,GLOSSARY_AUDIT,
 CANVAS_MANIFEST,BROWSER_AUDIO,MAIN,SA_COPY,CANVAS_SOURCE,ARTIFACTS,
 CONTINUOUS,OPTIONAL_SPANISH,GLOSSARY,ACCEPTANCE,COMPLEXITY_LANE,p013Runtime}
 from '../../../lib/alg-l06-p013-admission-semantics-v1.mjs';
import {algL6P010FormalDescriptor} from '../lib/alg-l06-p010-formal-admission-v1.server';
import {algL6P013FormalDescriptor} from '../lib/alg-l06-p013-formal-admission-v1.server';
import {ALG_L06_P013_ADMISSION_CALIBRATION,extendAlgL6P013Descriptor,
 type AlgL06P013DescriptorInput} from '../lib/alg-l06-p013-descriptor-extension-v1';
import {localOnlyAnimationModuleRegistration}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from '../lib/catalog';
import {G678_ADMISSION_INDEX} from '../lib/g678-admission-activation';

const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_SOURCE_ROOT:SOURCE_ROOT,
 HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'});
delete env.VERCEL;delete env.VERCEL_ENV;
const base=algL6P010FormalDescriptor();
const freezeManifest={path:FREEZE_PATH,bytes:1,sha256:'a'.repeat(64)};
const entry={key:ID,module:`./modules/${ID}`,maturity:'private-current-js',
 complexityLane:COMPLEXITY_LANE,artifacts:ARTIFACTS};
const packet={schemaVersion:1,calibrationId:CALIBRATION,sourceRoot:SOURCE_ROOT,
 scope:'private-engineering',deploymentScope:'local-only',source:SOURCE,sourceXml:XML,
 freezeManifest,continuousSource:CONTINUOUS,optionalSpanishAudio:OPTIONAL_SPANISH,
 glossaryActions:GLOSSARY,
 selectedPages:[{animationId:ID,placementId:ID,assetId:`swf-${SOURCE.sha256}`,
  sourceSha256:SOURCE.sha256,moduleCode:'ALG001',lessonNumber:6,
  globalPageOrdinal:13,sourceOccurrence:13,sectionCode:'VB',sectionPageOrdinal:3,
  complexityLane:COMPLEXITY_LANE,runtime:p013Runtime(ARTIFACTS)}],entry,
 integrity:{completeTransitiveClosure:false,files:[SOURCE_AUDIT,AUDIO_AUDIT,TEXT_AUDIT,
  HOST_AUDIT,GLOSSARY_AUDIT,CANVAS_MANIFEST,BROWSER_AUDIO,MAIN,SA_COPY,CANVAS_SOURCE,
  ...Object.values(ARTIFACTS)]},
 acceptanceEffects:ACCEPTANCE,productCalibrationPassed:false,scaleOutAuthorized:false};
const registration={calibrationId:CALIBRATION,deploymentScope:'local-only',
 freezeManifest:FREEZE_PATH,freezeManifestBytes:freezeManifest.bytes,
 freezeManifestSha256:freezeManifest.sha256,entries:[entry]};
const metadata={calibrationId:CALIBRATION,deploymentScope:'local-only',
 maturity:'private-current-js',freezeManifestSha256:freezeManifest.sha256,
 moduleSha256:ARTIFACTS.module.sha256,timelineSha256:ARTIFACTS.timeline.sha256,
 runtimeSha256:ARTIFACTS.runtime.sha256};
const planned={packet,registration,metadata} as unknown as AlgL06P013DescriptorInput;

function reject(change:(value:any,predecessor:any)=>void){
 const value=structuredClone(planned),predecessor=structuredClone(base);
 change(value,predecessor);
 assert.throws(()=>extendAlgL6P013Descriptor(predecessor,value),
  /ALG_L06_P013_DESCRIPTOR_INVALID/u);
}

test('exact P010 predecessor gains only VB3; glossary and all other rows remain intact',()=>{
 const result=extendAlgL6P013Descriptor(base,planned);
 assert.equal(base.productBridge.registeredAnimationCount,23);
 assert.equal(base.pages[12].rendererAvailability.kind,'unavailable');
 assert.equal(result.productBridge.registeredAnimationCount,24);
 assert.equal(result.pages.length,60);
 for(let index=0;index<60;index++)if(index!==12)
  assert.equal(result.pages[index],base.pages[index]);
 assert.equal(result.pages[12].rendererAvailability.kind,'registered');
 if(result.pages[12].rendererAvailability.kind==='registered'){
  assert.equal(result.pages[12].rendererAvailability.moduleKey,ID);
  assert.deepEqual(result.pages[12].rendererAvailability.runtimeQuery,
   {frameDomain:'sprite-140',language:'fixed-en',scenario:'source-static-frame',seed:'0'});
 }
 assert.equal(result.pages[12].presentation?.pageInteractionCompanionTargetIdSuffix,
  'p013-source-readable');
 assert.equal(result.pages[12].labels,base.pages[12].labels);
 assert.equal(result.glossary,base.glossary);
 assert.deepEqual(result.glossary.filter(row=>['input','output'].includes(row.id))
  .map(row=>row.id),['input','output']);
 assert.equal(result.support,base.support);
 assert.deepEqual(result.productBridge.acceptanceEffects,base.productBridge.acceptanceEffects);
 assert(Object.values(result.productBridge.acceptanceEffects).every(value=>value===false));
 assert.equal(result.calibrationId,ALG_L06_P013_ADMISSION_CALIBRATION);
 assert.equal(result.course.href,
  '/migration-status/g678-calibration/shared-alg001-l06-p013/continuous-v1');
});

test('source, timing, SA, exact glossary keys and registry drift fail closed',()=>{
 reject(value=>{value.packet.source.sha256='f'.repeat(64);});
 reject(value=>{value.packet.selectedPages[0].globalPageOrdinal=14;});
 reject(value=>{value.packet.selectedPages[0].runtime.frameCount=371;});
 reject(value=>{value.packet.continuousSource.negativeSeekSemanticsResolved=true;});
 reject(value=>{value.packet.optionalSpanishAudio.trigger='locale-autoplay';});
 reject(value=>{value.packet.optionalSpanishAudio.mainStreamSpliced=true;});
 reject(value=>{value.packet.glossaryActions.Input.firstFullHitFrame=258;});
 reject(value=>{value.packet.glossaryActions.Output.sourceKey='Input';});
 reject(value=>{value.packet.integrity.files.find((pin:{path:string})=>
  pin.path===TEXT_AUDIT.path).sha256='f'.repeat(64);});
 reject(value=>{value.packet.entry.artifacts.runtime.sha256='f'.repeat(64);});
 reject(value=>{value.registration.freezeManifestSha256='f'.repeat(64);});
 reject(value=>{value.metadata.moduleSha256='f'.repeat(64);});
 reject(value=>{value.packet.acceptanceEffects.ownerAccepted=true;});
});

test('changed predecessor, glossary or source neighbor fails closed',()=>{
 reject((_,predecessor)=>{predecessor.productBridge.registeredAnimationCount=24;});
 reject((_,predecessor)=>{predecessor.pages[12].source.assetId='swf-'+'f'.repeat(64);});
 reject((_,predecessor)=>{predecessor.pages[12].nextPlacementId='shared-alg001-l06-p015';});
 reject((_,predecessor)=>{predecessor.productBridge.selectedAnimationIds.reverse();});
 reject((_,predecessor)=>{predecessor.glossary.splice(
  predecessor.glossary.findIndex((row:{id:string})=>row.id==='input'),1);});
});

test('formal reader rejects unregistered P013 and uses exact pinned proof after admission',()=>{
 const index=readJsonPin(getWorkspaceRoot(),G678_ADMISSION_INDEX);
 const pinned=index.pages.filter((page:{animationId:string})=>page.animationId===ID);
 const registered=localOnlyAnimationModuleRegistration(ID);
 if(pinned.length===1&&registered){
  const result=algL6P013FormalDescriptor();
  assert.equal(result.productBridge.registeredAnimationCount,24);
 }else if(pinned.length===0)
  assert.throws(()=>algL6P013FormalDescriptor(),/P013_FORMAL_EXACT_V1_ADMISSION/u);
 else assert.throws(()=>algL6P013FormalDescriptor());
});

test('physical source identities remain the same as the formal packet',()=>{
 assert.equal(SOURCE.sha256,'1be47750557385ef91c648fb87fdcde642d342caadc35da7a1f7a2d1fdb11d35');
 assert.equal(XML.sha256,'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c');
 assert.equal(SA.sha256,'2db938405bd646e4bf37e0b9cdf5438cc65451a2d4f7304c93dbc2b6653e8575');
});
