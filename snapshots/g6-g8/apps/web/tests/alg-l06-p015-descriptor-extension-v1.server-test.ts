import assert from 'node:assert/strict';
import test from 'node:test';
import {pinFile,readJsonPin,readPin} from '../../../lib/g678-admission-proof.mjs';
import {ID,CALIBRATION,SOURCE_ROOT,FREEZE_PATH,PROOF_PATH,SOURCE,SA,
 validateP015AdmissionSemantics} from '../../../lib/alg-l06-p015-admission-semantics-v1.mjs';
import {algL6P014FormalDescriptor} from '../lib/alg-l06-p014-formal-admission-v1.server';
import {algL6P015FormalDescriptor} from '../lib/alg-l06-p015-formal-admission-v1.server';
import {ALG_L06_P015_ADMISSION_CALIBRATION,extendAlgL6P015Descriptor,
 type AlgL06P015DescriptorInput} from '../lib/alg-l06-p015-descriptor-extension-v1';
import {localOnlyAnimationModuleRegistration}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from '../lib/catalog';
import {G678_ADMISSION_INDEX} from '../lib/g678-admission-activation';

const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_SOURCE_ROOT:SOURCE_ROOT,
 HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'});
delete env.VERCEL;delete env.VERCEL_ENV;
const root=getWorkspaceRoot();
const base=algL6P014FormalDescriptor();
const proof=readJsonPin(root,pinFile(root,PROOF_PATH));
const fragmentPath=`work/g678-workflow/candidates/${ID}-registration-v1.json`;
const fragment=readJsonPin(root,pinFile(root,fragmentPath));
assert.equal(proof.animationId,ID);
assert.deepEqual(fragment,proof.registration,'physical candidate fragment equals prepared proof');
assert.deepEqual(proof.packet.freezeManifest,pinFile(root,FREEZE_PATH));
readPin(root,proof.packet.freezeManifest);
assert.equal(validateP015AdmissionSemantics(proof.packet,fragment,root),true);
const entry=fragment.entries[0];
const metadata={calibrationId:fragment.calibrationId,deploymentScope:'local-only' as const,
 maturity:'private-current-js' as const,freezeManifestSha256:fragment.freezeManifestSha256,
 moduleSha256:entry.artifacts.module.sha256,timelineSha256:entry.artifacts.timeline.sha256,
 runtimeSha256:entry.artifacts.runtime.sha256};
const planned={packet:proof.packet,registration:fragment,metadata} as AlgL06P015DescriptorInput;

function reject(change:(value:any,predecessor:any)=>void){
 const value=structuredClone(planned),predecessor=structuredClone(base);
 change(value,predecessor);
 assert.throws(()=>extendAlgL6P015Descriptor(predecessor,value,root),
  /ALG_L06_P015_DESCRIPTOR_INVALID/u);
}

test('prepared P015 proof projects only VB5 from 25 to 26 registered pages',()=>{
 const result=extendAlgL6P015Descriptor(base,planned,root);
 assert.equal(base.productBridge.registeredAnimationCount,25);
 assert.equal(base.pages[14].rendererAvailability.kind,'unavailable');
 assert.equal(result.productBridge.registeredAnimationCount,26);
 assert.equal(result.pages.length,60);
 for(let index=0;index<60;index++)if(index!==14)
  assert.equal(result.pages[index],base.pages[index],`unchanged source page ${index+1}`);
 const target=result.pages[14];
 assert.equal(target.animationId,ID);
 assert.equal(target.source.assetId,`swf-${SOURCE.sha256}`);
 assert.equal(target.rendererAvailability.kind,'registered');
 if(target.rendererAvailability.kind==='registered'){
  assert.equal(target.rendererAvailability.moduleKey,ID);
  assert.deepEqual(target.rendererAvailability.runtimeQuery,
   {frameDomain:'sprite-270',language:'fixed-en',scenario:'source-static-frame',seed:'0'});
 }
 assert.equal(target.presentation?.pageInteractionCompanionTargetIdSuffix,'p015-source-readable');
 assert.equal(target.labels,base.pages[14].labels);
 assert.equal(result.glossary,base.glossary);
 assert.deepEqual(result.glossary.filter(row=>
  ['function','value','relation','rule','input','output'].includes(row.id)).map(row=>row.id).sort(),
  ['function','input','output','relation','rule','value']);
 assert.equal(result.support,base.support);
 assert.deepEqual(result.productBridge.acceptanceEffects,base.productBridge.acceptanceEffects);
 assert(Object.values(result.productBridge.acceptanceEffects).every(value=>value===false));
 assert.equal(result.calibrationId,ALG_L06_P015_ADMISSION_CALIBRATION);
 assert.equal(result.course.href,
  '/migration-status/g678-calibration/shared-alg001-l06-p015/continuous-v1');
 assert.deepEqual(result.productBridge.selectedAnimationIds.filter(id=>id!==ID),
  base.productBridge.selectedAnimationIds);
});

test('prepared proof source, four main ranges, SA, six words and metadata fail closed on drift',()=>{
 reject(value=>{value.packet.source.sha256='f'.repeat(64);});
 reject(value=>{value.packet.sourceXml.sha256='f'.repeat(64);});
 reject(value=>{value.packet.selectedPages[0].globalPageOrdinal=14;});
 reject(value=>{value.packet.selectedPages[0].runtime.frameCount=913;});
 reject(value=>{value.packet.selectedPages[0].runtime.terminalPolicy='original-runtime-end';});
 reject(value=>{value.packet.continuousSource.mainRangeFrames[3][1]=913;});
 reject(value=>{value.packet.continuousSource.negativeSeekSemanticsResolved=true;});
 reject(value=>{value.packet.optionalSpanishAudio.localeAutoplay=true;});
 reject(value=>{value.packet.optionalSpanishAudio.mainStreamSpliced=true;});
 reject(value=>{value.packet.glossaryActions.Function.entryId='value';});
 reject(value=>{value.packet.glossaryActions.Output.actionSha256='f'.repeat(64);});
 reject(value=>{value.packet.entry.artifacts.runtime.sha256='f'.repeat(64);});
 reject(value=>{value.registration.freezeManifestSha256='f'.repeat(64);});
 reject(value=>{value.metadata.moduleSha256='f'.repeat(64);});
 reject(value=>{value.packet.acceptanceEffects.ownerAccepted=true;});
});

test('predecessor page count, source links, selected set and six glossary identities reject drift',()=>{
 reject((_,predecessor)=>{predecessor.productBridge.registeredAnimationCount=24;});
 reject((_,predecessor)=>{predecessor.pages[14].source.assetId='swf-'+'f'.repeat(64);});
 reject((_,predecessor)=>{predecessor.pages[14].previousPlacementId=ID;});
 reject((_,predecessor)=>{predecessor.productBridge.selectedAnimationIds.reverse();});
 reject((_,predecessor)=>{predecessor.glossary.splice(
  predecessor.glossary.findIndex((row:{id:string})=>row.id==='function'),1);});
});

test('formal reader requires exact active proof and registry, then projects only P015',()=>{
 const index=readJsonPin(root,G678_ADMISSION_INDEX);
 const pinned=index.pages.filter((page:{animationId:string})=>page.animationId===ID);
 const registered=localOnlyAnimationModuleRegistration(ID);
 if(pinned.length===0&&!registered){
  assert.throws(()=>algL6P015FormalDescriptor(),/P015_FORMAL_EXACT_V1_ADMISSION/u);
  return;
 }
 assert.equal(pinned.length,1,'one exact P015 active-index proof');
 assert.equal(pinned[0].proof.path,PROOF_PATH);
 assert(registered,'P015 registry metadata must accompany the active proof');
 const result=algL6P015FormalDescriptor();
 assert.equal(result.productBridge.registeredAnimationCount,26);
 assert.equal(result.pages.filter(page=>page.rendererAvailability.kind==='registered').length,26);
 assert.equal(result.pages.length,60);
 for(let index=0;index<60;index++)if(index!==14)
  assert.deepEqual(result.pages[index],base.pages[index]);
 assert.equal(result.pages[14].rendererAvailability.kind,'registered');
 assert.deepEqual(result.glossary,base.glossary);
 assert(Object.values(result.productBridge.acceptanceEffects).every(value=>value===false));
});

test('physical source and prepared candidate remain distinct from registration',()=>{
 readPin(SOURCE_ROOT,SOURCE);readPin(SOURCE_ROOT,SA);
 assert.equal(CALIBRATION,ALG_L06_P015_ADMISSION_CALIBRATION);
 assert.equal(PROOF_PATH,'work/g678-workflow/candidates/shared-alg001-l06-p015-proof-v1.json');
});
