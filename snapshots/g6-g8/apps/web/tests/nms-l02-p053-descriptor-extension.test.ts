import assert from 'node:assert/strict';
import {test} from 'node:test';
import {nmsL02P054AdmissionDescriptor} from '../lib/nms-l02-p054-admission.server';
import {extendNmsL02P053Descriptor,type NmsL02P053DescriptorProvenance}
 from '../lib/nms-l02-p053-descriptor-extension';
const env=process.env as Record<string,string|undefined>;
env.NODE_ENV='development';delete env.VERCEL;delete env.VERCEL_ENV;
env.HELP_MATH_G678_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const id='shared-nms002-l02-p053',sha='f42f6a4759759561035a7c97e7392241513d0410d69214af422425ef37523fdf';
// A shape fixture only. It neither invents nor writes an actual freeze.
const fixture:NmsL02P053DescriptorProvenance={
 calibrationId:'g678-nms-l02-p053-source-directions-current-js-v1',
 sourceXml:{path:'G6-G8-shared/NMS002/L2/index.xml',bytes:12845,
  sha256:'550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61'},
 source:{path:`${env.HELP_MATH_G678_SOURCE_ROOT}/G6-G8-shared/NMS002/L2/GS/L2GS02.swf`,bytes:236774,sha256:sha},
 selectedPage:{animationId:id,placementId:id,assetId:`swf-${sha}`,sourceSha256:sha,
  globalPageOrdinal:53,sourceOccurrence:53,sectionCode:'GS',sectionPageOrdinal:1,
  runtime:{frameDomain:'sprite-187',frameCount:694,heldFrame:693,rootFrameCount:10,rootBeginFrame:6,
   fps:12,stage:{width:800,height:600},scenario:'source-directions-v1',seed:'0',
   hostPlaybackCompletion:false,popupCloseReceiverResolved:false,audioSynchronizationEstablished:false}},
 freeze:{path:'catalog/product-bridge-calibrations/g678-nms-l02-p053-source-directions-current-js-v1.json',
  bytes:1,sha256:'0'.repeat(64)},sourceKeyAttributeCalls:0,
};
test('registered P054 predecessor projects its last unavailable placement without changing earlier pages or gates',()=>{
 const {descriptor:base,registered}=nmsL02P054AdmissionDescriptor();assert.equal(registered,true);
 const next=extendNmsL02P053Descriptor(base,fixture);
 assert.equal(base.productBridge.registeredAnimationCount,63);
 assert.equal(next.productBridge.registeredAnimationCount,64);assert.equal(next.pages.length,64);
 assert(next.pages.every(page=>page.rendererAvailability.kind==='registered'));
 for(let i=0;i<64;i++)if(i!==52)assert.equal(next.pages[i],base.pages[i]);
 assert.equal(next.glossary,base.glossary);assert.equal(next.glossary.length,25);
 assert.deepEqual(next.support.lessonHostCapabilities,['glossary','fq-scoring','navigation']);
 assert.equal(next.productBridge.acceptanceEffects,base.productBridge.acceptanceEffects);
 assert(Object.values(next.productBridge.acceptanceEffects).every(value=>value===false));
});
test('invalid source, end-frame, audio synchronization and popup claims fail closed',()=>{
 const {descriptor:base}=nmsL02P054AdmissionDescriptor();
 for(const mutate of [
  (p:any)=>{p.source.bytes=1;},(p:any)=>{p.sourceXml.sha256='f'.repeat(64);},
  (p:any)=>{p.selectedPage.globalPageOrdinal=54;},(p:any)=>{p.selectedPage.runtime.heldFrame=694;},
  (p:any)=>{p.selectedPage.runtime.frameCount=693;},
  (p:any)=>{p.selectedPage.runtime.hostPlaybackCompletion=true;},
  (p:any)=>{p.selectedPage.runtime.popupCloseReceiverResolved=true;},
  (p:any)=>{p.selectedPage.runtime.audioSynchronizationEstablished=true;},
  (p:any)=>{p.sourceKeyAttributeCalls=1;},(p:any)=>{p.freeze.path='catalog/other.json';},
 ]){const value=structuredClone(fixture);mutate(value);
  assert.throws(()=>extendNmsL02P053Descriptor(base,value),/NMS_L02_P053_DESCRIPTOR_INVALID/);}
});
