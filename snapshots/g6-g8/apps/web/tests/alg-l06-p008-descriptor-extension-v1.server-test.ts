import assert from 'node:assert/strict';
import test from 'node:test';
import {readJsonPin,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {algL6P004FormalDescriptor} from '../lib/alg-l06-p004-formal-admission-v1.server';
import {algL6P008FormalDescriptor} from '../lib/alg-l06-p008-formal-admission-v1.server';
import {ALG_L06_P008_ADMISSION_ID,ALG_L06_P008_ADMISSION_CALIBRATION,
 extendAlgL6P008Descriptor,type AlgL06P008DescriptorInput}
 from '../lib/alg-l06-p008-descriptor-extension-v1';
import {getWorkspaceRoot} from '../lib/catalog';

const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_SOURCE_ROOT:SOURCE_ROOT,
 HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'});
delete env.VERCEL;delete env.VERCEL_ENV;
const root=getWorkspaceRoot();
const proofPin={path:'work/g678-workflow/candidates/shared-alg001-l06-p008-proof-v3.json',
 bytes:43176,sha256:'df0c101c0d02935a74bc930f4845ae2bd2c77ed65b9e3050117759085a024fe5'};
const proof=readJsonPin(root,proofPin);
const base=algL6P004FormalDescriptor();
const entry=proof.registration.entries[0];
const planned:AlgL06P008DescriptorInput={packet:proof.packet,
 registration:{calibrationId:proof.registration.calibrationId,
  deploymentScope:proof.registration.deploymentScope,maturity:entry.maturity,
  freezeManifestSha256:proof.registration.freezeManifestSha256,
  moduleSha256:entry.artifacts.module.sha256,
  timelineSha256:entry.artifacts.timeline.sha256,
  runtimeSha256:entry.artifacts.runtime.sha256}};

function reject(change:(value:any,predecessor:any)=>void){
 const value=structuredClone(planned),predecessor=structuredClone(base);
 change(value,predecessor);
 assert.throws(()=>extendAlgL6P008Descriptor(predecessor,value),
  /ALG_L06_P008_DESCRIPTOR_INVALID/u);
}

test('P004 predecessor gains only exact P008 RW7 with source-bound audio and native companion',()=>{
 for(const pin of [proof.packet.source,proof.packet.sourceXml,
  proof.packet.optionalSpanishAudio.source])readPin(SOURCE_ROOT,pin);
 for(const pin of Object.values(proof.packet.entry.artifacts))readPin(root,pin as {
  path:string;bytes:number;sha256:string});
 const result=extendAlgL6P008Descriptor(base,planned);
 assert.equal(base.productBridge.registeredAnimationCount,21);
 assert.equal(base.pages[7].rendererAvailability.kind,'unavailable');
 assert.equal(result.productBridge.registeredAnimationCount,22);
 assert.equal(result.pages.length,60);
 assert.equal(result.pages.filter(page=>page.rendererAvailability.kind==='registered').length,22);
 assert.equal(result.course.href,
  '/migration-status/g678-calibration/shared-alg001-l06-p008/continuous-v1');
 for(let index=0;index<60;index++)if(index!==7)assert.equal(result.pages[index],base.pages[index]);
 assert.equal(result.pages[7].rendererAvailability.kind,'registered');
 if(result.pages[7].rendererAvailability.kind==='registered'){
  assert.equal(result.pages[7].rendererAvailability.moduleKey,ALG_L06_P008_ADMISSION_ID);
  assert.deepEqual(result.pages[7].rendererAvailability.runtimeQuery,
   {frameDomain:'sprite-507',language:'fixed-en',scenario:'source-static-frame',seed:'0'});
 }
 assert.equal(result.pages[7].presentation?.pageInteractionCompanionTargetIdSuffix,
  'p008-source-readable');
 assert.equal(result.pages[7].labels,base.pages[7].labels);
 assert.equal(result.pages[7].runtimeEvidenceBoundary?.naturalTraceValidation,'not-established');
 assert.equal(result.glossary,base.glossary);
 assert.equal(result.support,base.support);
 assert.deepEqual(result.productBridge.acceptanceEffects,base.productBridge.acceptanceEffects);
 assert(Object.values(result.productBridge.acceptanceEffects).every(value=>value===false));
 assert.equal(result.calibrationId,ALG_L06_P008_ADMISSION_CALIBRATION);
});

test('wrong source, frame, audio, player or registration fails closed',()=>{
 reject(value=>{value.packet.source.sha256='f'.repeat(64);});
 reject(value=>{value.packet.selectedPages[0].globalPageOrdinal=7;});
 reject(value=>{value.packet.selectedPages[0].runtime.frameCount=937;});
 reject(value=>{value.packet.continuousSource.firstAudioBlockFrame=1;});
 reject(value=>{value.packet.optionalSpanishAudio.trigger='locale-autoplay';});
 reject(value=>{value.packet.integrity.files.find((pin:{path:string})=>
  pin.path==='packages/demos/src/alg-l06-p008-player-v1.tsx').sha256='f'.repeat(64);});
 reject(value=>{value.packet.entry.artifacts.runtime.sha256='f'.repeat(64);});
 reject(value=>{value.registration.freezeManifestSha256='f'.repeat(64);});
 reject(value=>{value.packet.acceptanceEffects.ownerAccepted=true;});
});

test('changed predecessor order or source link fails closed',()=>{
 reject((_,predecessor)=>{predecessor.productBridge.registeredAnimationCount=22;});
 reject((_,predecessor)=>{predecessor.pages[7].source.assetId='swf-'+'f'.repeat(64);});
 reject((_,predecessor)=>{predecessor.pages[7].nextPlacementId='shared-alg001-l06-p010';});
 reject((_,predecessor)=>{predecessor.productBridge.selectedAnimationIds.reverse();});
});

test('formal reader requires actual exact v3 registry admission',()=>{
 const transaction=readRegistryTransaction(root);
 const isRegistered=transaction.registry.calibrations.some((row:{calibrationId:string})=>
  row.calibrationId===ALG_L06_P008_ADMISSION_CALIBRATION);
 if(isRegistered){
  const result=algL6P008FormalDescriptor();
  assert.equal(result.productBridge.registeredAnimationCount,22);
  assert.equal(result.pages[7].rendererAvailability.kind,'registered');
 }else assert.throws(()=>algL6P008FormalDescriptor(),/P008_FORMAL_EXACT_V3_ADMISSION/u);
});
