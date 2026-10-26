import assert from 'node:assert/strict';
import test from 'node:test';
import {nmsL02P062AdmissionDescriptor} from '../lib/nms-l02-p062-admission.server';
import {extendNmsL02P064Descriptor,type NmsL02P064DescriptorProvenance}
 from '../lib/nms-l02-p064-descriptor-extension';

const env=process.env as Record<string,string|undefined>;
env.NODE_ENV='development';delete env.VERCEL;delete env.VERCEL_ENV;
env.HELP_MATH_G678_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const base=nmsL02P062AdmissionDescriptor().descriptor;
const id='shared-nms002-l02-p064';
const sha='f655f05d7be5576503a66f52909b322bd3fce3e7b51a7fcda52291f755bf346c';
const provenance:NmsL02P064DescriptorProvenance={
 calibrationId:'g678-nms-l02-p064-source-quiz-current-js-v1',
 sourceXml:{path:'G6-G8-shared/NMS002/L2/index.xml',bytes:12845,
  sha256:'550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61'},
 source:{path:env.HELP_MATH_G678_SOURCE_ROOT+'/G6-G8-shared/NMS002/L2/FQ/L2FQ02.swf',bytes:55392,sha256:sha},
 selectedPage:{animationId:id,placementId:id,assetId:`swf-${sha}`,sourceSha256:sha,
  globalPageOrdinal:64,sourceOccurrence:64,sectionCode:'FQ',sectionPageOrdinal:2,
  runtime:{frameDomain:'sprite-1258',frameCount:90,rootBeginFrame:6,fps:12,
   stage:{width:800,height:600},scenario:'source-quiz-seeded'}},
 freeze:{path:'catalog/product-bridge-calibrations/g678-nms-l02-p064-source-quiz-current-js-v1.json',
  sha256:'0'.repeat(64)},sourceKeyAttributeCalls:0,
};

test('P064 formal projection adds one quiz and scoring while preserving preceding page objects',()=>{
 const next=extendNmsL02P064Descriptor(base,provenance);
 assert.equal(base.productBridge.registeredAnimationCount,61);
 assert.equal(next.productBridge.registeredAnimationCount,62);
 assert.equal(next.pages.length,64);assert.equal(next.glossary,base.glossary);
 for(let index=0;index<63;index++)assert.equal(next.pages[index],base.pages[index]);
 assert.deepEqual(next.support.lessonHostCapabilities,['glossary','fq-scoring']);
 assert.deepEqual(base.support.lessonHostCapabilities,['glossary']);
 assert.equal(next.pages[63].rendererAvailability.kind,'registered');
 assert.deepEqual(next.productBridge.acceptanceEffects,base.productBridge.acceptanceEffects);
 assert(Object.values(next.productBridge.acceptanceEffects).every(value=>value===false));
 const seeded=extendNmsL02P064Descriptor(base,provenance,7137);
 const renderer=seeded.pages[63].rendererAvailability;
 assert.equal(renderer.kind,'registered');
 if(renderer.kind==='registered')assert.equal(renderer.runtimeQuery?.seed,'7137');
 assert.throws(()=>extendNmsL02P064Descriptor(base,provenance,-1),/uint32 quiz seed/u);
});

test('wrong source, frame domain, placement, freeze identity and invented glossary fail closed',()=>{
 const reject=(change:(p:any)=>void)=>{const p=structuredClone(provenance);change(p);
  assert.throws(()=>extendNmsL02P064Descriptor(base,p),/NMS_L02_P064_DESCRIPTOR_INVALID/u);};
 reject(p=>{p.source.sha256='f'.repeat(64);});
 reject(p=>{p.sourceXml.bytes=1;});
 reject(p=>{p.selectedPage.sectionPageOrdinal=1;});
 reject(p=>{p.selectedPage.globalPageOrdinal=63;});
 reject(p=>{p.selectedPage.runtime.frameDomain='root';});
 reject(p=>{p.selectedPage.runtime.scenario='source-static-frame';});
 reject(p=>{p.freeze.path='catalog/unrelated.json';});
 reject(p=>{p.sourceKeyAttributeCalls=1;});
});
