import assert from 'node:assert/strict';
import test from 'node:test';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {ID,CALIBRATION,SOURCE_ROOT,FREEZE_PATH,SOURCE,XML,SA,
 SOURCE_AUDIT,AUDIO_AUDIT,TEXT_AUDIT,SA_HOST_AUDIT,CANVAS_MANIFEST,MAIN,
 CANVAS_SOURCE,CONTINUOUS,OPTIONAL_SPANISH,ACCEPTANCE,COMPLEXITY_LANE,
 readP010Artifacts,p010Runtime} from '../../../lib/alg-l06-p010-admission-semantics-v1.mjs';
import {algL6P008FormalDescriptor} from '../lib/alg-l06-p008-formal-admission-v1.server';
import {algL6P010FormalDescriptor} from '../lib/alg-l06-p010-formal-admission-v1.server';
import {ALG_L06_P010_ADMISSION_CALIBRATION,extendAlgL6P010Descriptor,
 type AlgL06P010DescriptorInput} from '../lib/alg-l06-p010-descriptor-extension-v1';
import {getWorkspaceRoot} from '../lib/catalog';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';

const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_SOURCE_ROOT:SOURCE_ROOT,
 HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'});
delete env.VERCEL;delete env.VERCEL_ENV;
const root=getWorkspaceRoot(),base=algL6P008FormalDescriptor();
const artifacts=readP010Artifacts(root);
const freezeManifest={path:FREEZE_PATH,bytes:1,sha256:'a'.repeat(64)};
const entry={key:ID,module:`./modules/${ID}`,maturity:'private-current-js',
 complexityLane:COMPLEXITY_LANE,artifacts};
const packet={schemaVersion:1,calibrationId:CALIBRATION,sourceRoot:SOURCE_ROOT,
 scope:'private-engineering',deploymentScope:'local-only',source:SOURCE,sourceXml:XML,
 freezeManifest,continuousSource:CONTINUOUS,optionalSpanishAudio:OPTIONAL_SPANISH,
 selectedPages:[{animationId:ID,placementId:ID,assetId:`swf-${SOURCE.sha256}`,
  sourceSha256:SOURCE.sha256,moduleCode:'ALG001',lessonNumber:6,
  globalPageOrdinal:10,sourceOccurrence:10,sectionCode:'RW',sectionPageOrdinal:9,
  complexityLane:COMPLEXITY_LANE,runtime:p010Runtime(artifacts)}],entry,
 integrity:{completeTransitiveClosure:false,files:[SOURCE_AUDIT,AUDIO_AUDIT,TEXT_AUDIT,
  SA_HOST_AUDIT,CANVAS_MANIFEST,MAIN,CANVAS_SOURCE,...Object.values(artifacts)]},
 acceptanceEffects:ACCEPTANCE,productCalibrationPassed:false,scaleOutAuthorized:false};
const registration={calibrationId:CALIBRATION,deploymentScope:'local-only',
 freezeManifest:FREEZE_PATH,freezeManifestBytes:freezeManifest.bytes,
 freezeManifestSha256:freezeManifest.sha256,entries:[entry]};
const metadata={calibrationId:CALIBRATION,deploymentScope:'local-only',
 maturity:'private-current-js',freezeManifestSha256:freezeManifest.sha256,
 moduleSha256:artifacts.module.sha256,timelineSha256:artifacts.timeline.sha256,
 runtimeSha256:artifacts.runtime.sha256};
const planned={packet,registration,metadata} as unknown as AlgL06P010DescriptorInput;

function reject(change:(value:any,predecessor:any)=>void){
 const value=structuredClone(planned),predecessor=structuredClone(base);
 change(value,predecessor);
 assert.throws(()=>extendAlgL6P010Descriptor(predecessor,value),
  /ALG_L06_P010_DESCRIPTOR_INVALID/u);
}

test('P008 predecessor gains only exact P010 RW9 and retains Function glossary',()=>{
 for(const pin of [SOURCE,XML,SA])readPin(SOURCE_ROOT,pin);
 for(const pin of Object.values(artifacts))readPin(root,pin);
 const result=extendAlgL6P010Descriptor(base,planned);
 assert.equal(base.productBridge.registeredAnimationCount,22);
 assert.equal(base.pages[9].rendererAvailability.kind,'unavailable');
 assert.equal(result.productBridge.registeredAnimationCount,23);
 assert.equal(result.pages.length,60);
 for(let index=0;index<60;index++)if(index!==9)
  assert.equal(result.pages[index],base.pages[index]);
 assert.equal(result.pages[9].rendererAvailability.kind,'registered');
 if(result.pages[9].rendererAvailability.kind==='registered'){
  assert.equal(result.pages[9].rendererAvailability.moduleKey,ID);
  assert.deepEqual(result.pages[9].rendererAvailability.runtimeQuery,
   {frameDomain:'sprite-52',language:'fixed-en',scenario:'source-static-frame',seed:'0'});
 }
 assert.equal(result.pages[9].presentation?.pageInteractionCompanionTargetIdSuffix,
  'p010-source-readable');
 assert.equal(result.pages[9].labels,base.pages[9].labels);
 assert.equal(result.glossary,base.glossary);
 assert.equal(result.glossary.filter(row=>row.id==='function').length,1);
 assert.equal(result.support,base.support);
 assert.deepEqual(result.productBridge.acceptanceEffects,base.productBridge.acceptanceEffects);
 assert(Object.values(result.productBridge.acceptanceEffects).every(value=>value===false));
 assert.equal(result.calibrationId,ALG_L06_P010_ADMISSION_CALIBRATION);
 assert.equal(result.course.href,
  '/migration-status/g678-calibration/shared-alg001-l06-p010/continuous-v1');
});

test('source, stream, optional SA and registration drift fail closed',()=>{
 reject(value=>{value.packet.source.sha256='f'.repeat(64);});
 reject(value=>{value.packet.selectedPages[0].globalPageOrdinal=11;});
 reject(value=>{value.packet.selectedPages[0].runtime.frameCount=302;});
 reject(value=>{value.packet.continuousSource.firstAudioBlockFrame=1;});
 reject(value=>{value.packet.optionalSpanishAudio.trigger='locale-autoplay';});
 reject(value=>{value.packet.optionalSpanishAudio.mainStreamSpliced=true;});
 reject(value=>{value.packet.integrity.files.find((pin:{path:string})=>
  pin.path===TEXT_AUDIT.path).sha256='f'.repeat(64);});
 reject(value=>{value.packet.entry.artifacts.runtime.sha256='f'.repeat(64);});
 reject(value=>{value.registration.freezeManifestSha256='f'.repeat(64);});
 reject(value=>{value.metadata.moduleSha256='f'.repeat(64);});
 reject(value=>{value.packet.acceptanceEffects.ownerAccepted=true;});
});

test('changed P008 predecessor, Function glossary or source link fail closed',()=>{
 reject((_,predecessor)=>{predecessor.productBridge.registeredAnimationCount=23;});
 reject((_,predecessor)=>{predecessor.pages[9].source.assetId='swf-'+'f'.repeat(64);});
 reject((_,predecessor)=>{predecessor.pages[9].nextPlacementId='shared-alg001-l06-p012';});
 reject((_,predecessor)=>{predecessor.productBridge.selectedAnimationIds.reverse();});
 reject((_,predecessor)=>{predecessor.glossary.splice(
  predecessor.glossary.findIndex((row:{id:string})=>row.id==='function'),1);});
});

test('formal reader stays closed until the exact P010 proof is in the pinned activation index',()=>{
 if(localOnlyAnimationModuleRegistration(ID)){
  const result=algL6P010FormalDescriptor();
  assert.equal(result.productBridge.registeredAnimationCount,23);
 }else assert.throws(()=>algL6P010FormalDescriptor(),/P010_FORMAL_EXACT_V1_ADMISSION/u);
});
