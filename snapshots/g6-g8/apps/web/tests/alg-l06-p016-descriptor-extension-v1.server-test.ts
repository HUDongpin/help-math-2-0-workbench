import assert from 'node:assert/strict';
import test from 'node:test';
import {
 ACCEPTANCE,CALIBRATION,COMPLEXITY_LANE,CONTINUOUS,FREEZE_PATH,GLOSSARY,ID,OPTIONAL_SPANISH,
 SOURCE,SOURCE_ROOT,XML,p016Runtime,proposedP016Artifacts,readP016CanonicalSource,
 validateP016AdmissionSemantics,
} from '../../../lib/alg-l06-p016-admission-semantics-v1.mjs';
import {algL6P015FormalDescriptor} from '../lib/alg-l06-p015-formal-admission-v1.server';
import {extendAlgL6P016Descriptor,type AlgL06P016DescriptorInput}
 from '../lib/alg-l06-p016-descriptor-extension-v1';
import {getWorkspaceRoot} from '../lib/catalog';

const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_SOURCE_ROOT:SOURCE_ROOT,
 HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'});
delete env.VERCEL;delete env.VERCEL_ENV;
const root=getWorkspaceRoot();

/** Pure schema fixture. Its synthetic freeze pin is not an active page proof. */
function plannedInput():AlgL06P016DescriptorInput{
 const artifacts=proposedP016Artifacts(root);
 const source=readP016CanonicalSource(root);
 const freezeManifest={path:FREEZE_PATH,bytes:1,sha256:'a'.repeat(64)};
 const entry={key:ID,module:`./modules/${ID}`,maturity:'private-current-js',
  complexityLane:COMPLEXITY_LANE,artifacts};
 const packet={schemaVersion:1,calibrationId:CALIBRATION,sourceRoot:SOURCE_ROOT,
  scope:'private-engineering',deploymentScope:'local-only',source:SOURCE,sourceXml:XML,
  selectedPages:[{animationId:ID,placementId:ID,assetId:`swf-${SOURCE.sha256}`,
   sourceSha256:SOURCE.sha256,moduleCode:'ALG001',lessonNumber:6,
   globalPageOrdinal:16,sourceOccurrence:16,sectionCode:'VB',sectionPageOrdinal:6,
   complexityLane:COMPLEXITY_LANE,runtime:p016Runtime(artifacts)}],entry,
  continuousSource:CONTINUOUS,optionalSpanishAudio:OPTIONAL_SPANISH,
  glossaryActions:GLOSSARY,integrity:{completeTransitiveClosure:false,
   files:[...source.localInputs,...Object.values(artifacts)]},
  acceptanceEffects:ACCEPTANCE,productCalibrationPassed:false,
  scaleOutAuthorized:false,freezeManifest};
 const registration={calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:FREEZE_PATH,freezeManifestBytes:freezeManifest.bytes,
  freezeManifestSha256:freezeManifest.sha256,entries:[entry]};
 assert.equal(validateP016AdmissionSemantics(packet,registration,root),true);
 return {packet,registration,metadata:{calibrationId:CALIBRATION,
  deploymentScope:'local-only',maturity:'private-current-js',
  freezeManifestSha256:freezeManifest.sha256,
  moduleSha256:artifacts.module.sha256,timelineSha256:artifacts.timeline.sha256,
  runtimeSha256:artifacts.runtime.sha256}} as AlgL06P016DescriptorInput;
}

function reject(change:(value:any,predecessor:any)=>void){
 const value=structuredClone(plannedInput()),predecessor=structuredClone(algL6P015FormalDescriptor());
 change(value,predecessor);
 assert.throws(()=>extendAlgL6P016Descriptor(predecessor,value,root),
  /ALG_L06_P016_DESCRIPTOR_INVALID/u);
}

test('schema projects only source VB6 from ALG 26 to 27, preserving 59 peers',()=>{
 const base=algL6P015FormalDescriptor(),result=extendAlgL6P016Descriptor(base,plannedInput(),root);
 assert.equal(base.productBridge.registeredAnimationCount,26);
 assert.equal(base.pages[15].rendererAvailability.kind,'unavailable');
 assert.equal(result.productBridge.registeredAnimationCount,27);
 assert.equal(result.pages.length,60);
 for(let index=0;index<60;index++)if(index!==15)
  assert.equal(result.pages[index],base.pages[index],`unchanged source page ${index+1}`);
 const target=result.pages[15];
 assert.equal(target.animationId,ID);
 assert.equal(target.source.assetId,`swf-${SOURCE.sha256}`);
 assert.equal(target.rendererAvailability.kind,'registered');
 if(target.rendererAvailability.kind==='registered'){
  assert.equal(target.rendererAvailability.moduleKey,ID);
  assert.deepEqual(target.rendererAvailability.runtimeQuery,
   {frameDomain:'sprite-139',language:'fixed-en',scenario:'source-static-frame',seed:'0'});
 }
 assert.equal(target.presentation?.pageInteractionCompanionTargetIdSuffix,'p016-source-readable');
 assert.equal(target.labels,base.pages[15].labels);
 assert.equal(result.glossary,base.glossary);
 assert.equal(result.glossary.filter(row=>row.id==='function').length,1);
 assert.equal(result.support,base.support);
 assert.deepEqual(result.productBridge.acceptanceEffects,base.productBridge.acceptanceEffects);
 assert(Object.values(result.productBridge.acceptanceEffects).every(value=>value===false));
 assert.equal(result.calibrationId,CALIBRATION);
 assert.equal(result.course.href,
  '/migration-status/g678-calibration/shared-alg001-l06-p016/continuous-v1');
 assert.deepEqual(result.productBridge.selectedAnimationIds.filter(id=>id!==ID),
  base.productBridge.selectedAnimationIds);
});

test('source, two main ranges, separate SA, Function and metadata reject drift',()=>{
 reject(value=>{value.packet.source.sha256='f'.repeat(64);});
 reject(value=>{value.packet.sourceXml.sha256='f'.repeat(64);});
 reject(value=>{value.packet.selectedPages[0].globalPageOrdinal=15;});
 reject(value=>{value.packet.selectedPages[0].runtime.frameCount=814;});
 reject(value=>{value.packet.selectedPages[0].runtime.terminalPolicy='original-runtime-end';});
 reject(value=>{value.packet.continuousSource.mainRangeFrames[1][0]=300;});
 reject(value=>{value.packet.continuousSource.negativeSeekSemanticsResolved=true;});
 reject(value=>{value.packet.optionalSpanishAudio.localeAutoplay=true;});
 reject(value=>{value.packet.optionalSpanishAudio.mainStreamSpliced=true;});
 reject(value=>{value.packet.glossaryActions.Function.entryId='value';});
 reject(value=>{value.packet.glossaryActions.Function.originalClickObserved=true;});
 reject(value=>{value.packet.entry.artifacts.runtime.sha256='f'.repeat(64);});
 reject(value=>{value.registration.freezeManifestSha256='f'.repeat(64);});
 reject(value=>{value.metadata.moduleSha256='f'.repeat(64);});
 reject(value=>{value.packet.acceptanceEffects.ownerAccepted=true;});
});

test('exact P015 predecessor count, links, selected set and Function reject drift',()=>{
 reject((_,predecessor)=>{predecessor.productBridge.registeredAnimationCount=25;});
 reject((_,predecessor)=>{predecessor.pages[15].source.assetId='swf-'+'f'.repeat(64);});
 reject((_,predecessor)=>{predecessor.pages[15].previousPlacementId=ID;});
 reject((_,predecessor)=>{predecessor.productBridge.selectedAnimationIds.reverse();});
 reject((_,predecessor)=>{predecessor.glossary.splice(
  predecessor.glossary.findIndex((row:{id:string})=>row.id==='function'),1);});
});
