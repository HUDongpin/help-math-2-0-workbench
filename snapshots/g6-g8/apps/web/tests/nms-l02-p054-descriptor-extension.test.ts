import assert from 'node:assert/strict';
import test from 'node:test';
import {nmsL02P064AdmissionDescriptor} from '../lib/nms-l02-p064-admission.server';
import {extendNmsL02P054Descriptor,type NmsL02P054DescriptorProvenance}
 from '../lib/nms-l02-p054-descriptor-extension';

const env=process.env as Record<string,string|undefined>;
env.NODE_ENV='development';delete env.VERCEL;delete env.VERCEL_ENV;
env.HELP_MATH_G678_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const predecessor=nmsL02P064AdmissionDescriptor();
const base=predecessor.descriptor;
const id='shared-nms002-l02-p054';
const sha='06bde171fe294f555f983c15b50afbb53344851cdc2f76e31e5eb5a4719cabb8';
/** In-memory shape fixture only. There is no P054 freeze or registration yet. */
const planned:NmsL02P054DescriptorProvenance={
 calibrationId:'g678-nms-l02-p054-source-matching-current-js-v1',
 sourceXml:{path:'G6-G8-shared/NMS002/L2/index.xml',bytes:12845,
  sha256:'550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61'},
 source:{path:`${env.HELP_MATH_G678_SOURCE_ROOT}/G6-G8-shared/NMS002/L2/GS/L2GS03.swf`,
  bytes:2077270,sha256:sha},
 selectedPage:{animationId:id,placementId:id,assetId:`swf-${sha}`,sourceSha256:sha,
  globalPageOrdinal:54,sourceOccurrence:54,sectionCode:'GS',sectionPageOrdinal:2,
  runtime:{frameDomain:'sprite-731',frameCount:5,rootFrameCount:10,rootBeginFrame:6,
   fps:12,stage:{width:800,height:600},scenario:'source-matching-level-1',seed:'0',
   terminalOutcome:'terminal-unresolved',hostPlaybackCompletion:false}},
 freeze:{path:'catalog/product-bridge-calibrations/g678-nms-l02-p054-source-matching-current-js-v1.json',
  bytes:1,sha256:'0'.repeat(64)},sourceKeyAttributeCalls:0,
};

test('actual registered P064 predecessor projects only source GS2 to a 63rd renderer',()=>{
 assert.equal(predecessor.registered,true);
 assert.equal(base.productBridge.registeredAnimationCount,62);
 assert.equal(base.pages.length,64);
 assert.equal(base.pages[53].rendererAvailability.kind,'unavailable');
 const next=extendNmsL02P054Descriptor(base,planned);
 assert.equal(next.pages.length,64);
 assert.equal(next.productBridge.registeredAnimationCount,63);
 assert.equal(next.productBridge.selectedAnimationIds.length,63);
 assert.equal(next.pages.filter(page=>page.rendererAvailability.kind==='registered').length,63);
 assert.equal(next.pages[52].rendererAvailability.kind,'unavailable');
 assert.equal(next.pages[53].rendererAvailability.kind,'registered');
 for(let index=0;index<64;index++)if(index!==53)assert.equal(next.pages[index],base.pages[index]);
 assert.equal(next.glossary,base.glossary);assert.equal(next.glossary.length,25);
 assert.equal(next.support,base.support);
 assert.deepEqual(next.support.lessonHostCapabilities,['glossary','fq-scoring']);
 assert.deepEqual(next.productBridge.acceptanceEffects,base.productBridge.acceptanceEffects);
 assert(Object.values(next.productBridge.acceptanceEffects).every(value=>value===false));
 assert.equal(base.productBridge.registeredAnimationCount,62);
 const availability=next.pages[53].rendererAvailability;
 assert.equal(availability.kind,'registered');
 if(availability.kind==='registered')assert.deepEqual(availability.runtimeQuery,
  {frameDomain:'sprite-731',language:'fixed-en',scenario:'source-matching-level-1',seed:'0'});
});

test('explicit Level 2 changes only P054 query while keeping registered membership and predecessor intact',()=>{
 const level1=extendNmsL02P054Descriptor(base,planned,1);
 const level2=extendNmsL02P054Descriptor(base,planned,2);
 assert.deepEqual(level2.productBridge.selectedAnimationIds,level1.productBridge.selectedAnimationIds);
 assert.equal(level2.productBridge.registeredAnimationCount,63);
 assert.equal(level2.pages[53].rendererAvailability.kind,'registered');
 const availability=level2.pages[53].rendererAvailability;
 if(availability.kind==='registered')assert.equal(availability.runtimeQuery?.scenario,
  'source-matching-level-2');
 for(let index=0;index<64;index++)if(index!==53)assert.equal(level2.pages[index],base.pages[index]);
 assert.throws(()=>extendNmsL02P054Descriptor(base,planned,0 as 1),
  /NMS_L02_P054_DESCRIPTOR_INVALID/u);
});

test('source, child timeline, unresolved completion and freeze shape fail closed on drift',()=>{
 const reject=(change:(value:any)=>void)=>{
  const value=structuredClone(planned);change(value);
  assert.throws(()=>extendNmsL02P054Descriptor(base,value),/NMS_L02_P054_DESCRIPTOR_INVALID/u);
 };
 reject(value=>{value.source.sha256='f'.repeat(64);});
 reject(value=>{value.sourceXml.bytes=1;});
 reject(value=>{value.selectedPage.globalPageOrdinal=53;});
 reject(value=>{value.selectedPage.runtime.rootBeginFrame=1;});
 reject(value=>{value.selectedPage.runtime.frameCount=10;});
 reject(value=>{value.selectedPage.runtime.scenario='source-matching-level-2';});
 reject(value=>{value.selectedPage.runtime.terminalOutcome='complete';});
 reject(value=>{value.selectedPage.runtime.hostPlaybackCompletion=true;});
 reject(value=>{value.freeze.path='catalog/unrelated.json';});
 reject(value=>{value.sourceKeyAttributeCalls=1;});
 const invalidBase={...base,productBridge:{...base.productBridge,registeredAnimationCount:63}};
 assert.throws(()=>extendNmsL02P054Descriptor(invalidBase,planned),
  /NMS_L02_P054_CANDIDATE_INVALID/u);
});
