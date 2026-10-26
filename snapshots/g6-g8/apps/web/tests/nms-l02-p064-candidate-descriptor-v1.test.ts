import assert from 'node:assert/strict';
import {test} from 'node:test';
import {nmsL02P062AdmissionDescriptor} from '../lib/nms-l02-p062-admission.server';
import {nmsL02P064CandidateDescriptorV1} from '../lib/nms-l02-p064-candidate-descriptor-v1';
import type {PageOnlyLessonPlayerDescriptor} from '../lib/whole-lesson-player-descriptor';

const env=process.env as Record<string,string|undefined>;
env.HELP_MATH_G678_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
env.NODE_ENV='development';delete env.VERCEL;delete env.VERCEL_ENV;
const {descriptor:actual,registered}=nmsL02P062AdmissionDescriptor();
const id='shared-nms002-l02-p064';
const mutated=(change:(copy:any)=>void):PageOnlyLessonPlayerDescriptor=>{
 const copy=structuredClone(actual);change(copy);return copy as PageOnlyLessonPlayerDescriptor;
};

test('actual P062 predecessor has 61 registrations, no FQ scoring and unavailable FQ2',()=>{
 assert.equal(registered,true);
 assert.equal(actual.pages.length,64);
 assert.equal(actual.productBridge.registeredAnimationCount,61);
 assert.equal(actual.pages.filter(page=>page.rendererAvailability.kind==='registered').length,61);
 assert.equal(actual.glossary.length,25);
 assert.deepEqual(actual.support.lessonHostCapabilities,['glossary']);
 assert.equal(actual.pages[63].animationId,id);
 assert.equal(actual.pages[63].rendererAvailability.kind,'unavailable');
 assert.equal(actual.pages[63].source.assetId,
  'swf-f655f05d7be5576503a66f52909b322bd3fce3e7b51a7fcda52291f755bf346c');
 assert.equal(actual.pages[63].sectionCode,'FQ');assert.equal(actual.pages[63].sectionPageOrdinal,2);
});

test('P064 preview changes only FQ2, retains 61 actual registrations and enables memory scoring locally',()=>{
 for(const seed of [0,9713,9714,0xffff_ffff]){
  const preview=nmsL02P064CandidateDescriptorV1(actual,seed),page=preview.pages[63];
  assert.equal(preview.pages.length,64);
  assert.equal(preview.productBridge,actual.productBridge);
  assert.equal(preview.productBridge.registeredAnimationCount,61);
  assert.equal(preview.pages.filter(entry=>entry.rendererAvailability.kind==='registered').length,62);
  assert.equal(preview.pages.filter(entry=>entry.rendererAvailability.kind==='unavailable').length,2);
  assert.equal(preview.course.href,`/migration-status/g678-calibration/${id}`);
  assert.equal(preview.releaseId,actual.releaseId);
  assert.equal(preview.glossary,actual.glossary);
  assert.equal(preview.glossary.length,25);
  assert.equal(preview.pages[62],actual.pages[62]);
  for(let i=0;i<63;i++)assert.equal(preview.pages[i],actual.pages[i]);
  assert.deepEqual(page.rendererAvailability,{kind:'registered',moduleKey:id,
   runtimeQuery:{frameDomain:'sprite-1258',language:'fixed-en',scenario:'source-quiz-seeded',
    seed:String(seed)}});
  assert.equal(page.previousPlacementId,'shared-nms002-l02-p063');
  assert.equal(page.nextPlacementId,null);
  assert.equal(page.labels.en.text,'Page 1');assert.equal(page.labels.es.text,'Page 1');
  assert.equal(page.runtimeEvidenceBoundary?.audioAcceptance,'not-established');
  assert.deepEqual(preview.support.lessonHostCapabilities,['glossary','fq-scoring']);
  assert.deepEqual(actual.support.lessonHostCapabilities,['glossary']);
  assert(!preview.support.lessonHostCapabilities.includes('audio'));
  assert.deepEqual(preview.productBridge.acceptanceEffects,actual.productBridge.acceptanceEffects);
 }
});

test('P064 preview rejects seed, source, predecessor order, glossary and capability drift',()=>{
 for(const seed of [-1,2**32,1.5,Number.NaN])
  assert.throws(()=>nmsL02P064CandidateDescriptorV1(actual,seed),/uint32 quiz seed/u);
 const rejects=(change:(copy:any)=>void)=>assert.throws(
  ()=>nmsL02P064CandidateDescriptorV1(mutated(change)),/NMS_L02_P064_CANDIDATE_INVALID/u);
 rejects(copy=>{copy.productBridge.registeredAnimationCount=60;});
 rejects(copy=>{copy.productBridge.selectedAnimationIds.pop();});
 rejects(copy=>{copy.pages[63].source.assetId='swf-wrong';});
 rejects(copy=>{copy.pages[63].sectionPageOrdinal=1;});
 rejects(copy=>{copy.pages[63].rendererAvailability={kind:'registered',moduleKey:id};});
 rejects(copy=>{copy.pages[62].nextPlacementId=null;});
 rejects(copy=>{copy.pages[61].rendererAvailability={kind:'unavailable',reason:'drift'};});
 rejects(copy=>{copy.source.sourceXmlSha256='0'.repeat(64);});
 rejects(copy=>{copy.glossary.pop();});
 rejects(copy=>{copy.glossary[0].sourceKeyAttribute=copy.glossary[1].sourceKeyAttribute;});
 rejects(copy=>{copy.support.lessonHostCapabilities.push('fq-scoring');});
 rejects(copy=>{copy.productBridge.acceptanceEffects.ownerAccepted=true;});
});
