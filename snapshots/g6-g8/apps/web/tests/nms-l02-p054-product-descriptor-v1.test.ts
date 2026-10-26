import assert from 'node:assert/strict';
import {test} from 'node:test';
import {nmsL02P064AdmissionDescriptor} from '../lib/nms-l02-p064-admission.server';
import {nmsL02P054ProductDescriptorV1} from '../lib/nms-l02-p054-product-descriptor-v1';
import {nmsL02P054ProductCandidateDescriptor} from '../lib/nms-l02-p054-product-candidate.server';
const env=process.env as Record<string,string|undefined>;
env.HELP_MATH_G678_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
env.NODE_ENV='development';delete env.VERCEL;delete env.VERCEL_ENV;
const {descriptor:base,registered}=nmsL02P064AdmissionDescriptor();
test('both matching levels add one candidate and preserve actual registered host/scoring/order',()=>{
 assert.equal(registered,true);
 for(const level of [1,2] as const){
  const d=nmsL02P054ProductDescriptorV1(base,level);
  assert.equal(d.productBridge,base.productBridge);
  assert.equal(d.productBridge.registeredAnimationCount,62);
  assert.equal(d.pages.filter(p=>p.rendererAvailability.kind==='registered').length,63);
  assert.equal(d.glossary,base.glossary);assert.equal(d.support,base.support);
  assert.deepEqual(d.support.lessonHostCapabilities,['glossary','fq-scoring']);
  for(let i=0;i<64;i++)if(i!==53)assert.equal(d.pages[i],base.pages[i]);
  assert.deepEqual(d.pages[53].rendererAvailability,{kind:'registered',moduleKey:'shared-nms002-l02-p054',
   runtimeQuery:{frameDomain:'sprite-731',language:'fixed-en',scenario:`source-matching-level-${level}`,seed:'0'}});
  assert.equal(d.pages[52].rendererAvailability.kind,'unavailable');
  assert.equal(d.pages[63],base.pages[63]);
  assert(Object.values(d.productBridge.acceptanceEffects).every(x=>x===false));
 }
});
test('candidate rejects level, source, predecessor, order and acceptance drift',()=>{
 for(const level of [0,3,NaN,1.5])assert.throws(()=>nmsL02P054ProductDescriptorV1(base,level as 1),/source game level/u);
 const rejects=(mutate:(d:any)=>void)=>{const d=structuredClone(base);mutate(d);
  assert.throws(()=>nmsL02P054ProductDescriptorV1(d),/NMS_L02_P054_CANDIDATE_INVALID/u);};
 rejects(d=>d.productBridge.registeredAnimationCount=61);
 rejects(d=>d.pages[53].source.assetId='swf-wrong');
 rejects(d=>d.pages[53].sectionCode='FQ');
 rejects(d=>d.pages[53].rendererAvailability={kind:'registered',moduleKey:'shared-nms002-l02-p054'});
 rejects(d=>d.pages[54].previousPlacementId=null);
 rejects(d=>d.glossary.pop());
 rejects(d=>d.support.lessonHostCapabilities.pop());
 rejects(d=>d.productBridge.acceptanceEffects.ownerAccepted=true);
});
test('reader verifies real source, 24 reveal assets, feedback streams and P064 proof',()=>{
 for(const level of [1,2] as const){const d=nmsL02P054ProductCandidateDescriptor(level);
  assert.equal(d.productBridge.registeredAnimationCount,62);assert.equal(d.pages.length,64);}
 const prior=env.NODE_ENV;env.NODE_ENV='production';
 try{assert.throws(()=>nmsL02P054ProductCandidateDescriptor(),/local source environment/u);}
 finally{env.NODE_ENV=prior;}
});
