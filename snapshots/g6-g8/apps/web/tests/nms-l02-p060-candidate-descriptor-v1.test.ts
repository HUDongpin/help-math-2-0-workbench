import assert from 'node:assert/strict';
import {test} from 'node:test';
import {P060_SOURCE_TERMS} from '../../../packages/demos/src/generated/nms-l02-p060-terms-v1';
import {nmsL02P058AdmissionDescriptor} from '../lib/nms-l02-p058-admission.server';
import {nmsL02P060CandidateDescriptorV1} from '../lib/nms-l02-p060-candidate-descriptor-v1';
import type {PageOnlyLessonPlayerDescriptor} from '../lib/whole-lesson-player-descriptor';

const sourceRoot='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const env=process.env as Record<string,string|undefined>;
env.HELP_MATH_G678_SOURCE_ROOT=sourceRoot;
env.NODE_ENV='development';
delete env.VERCEL;delete env.VERCEL_ENV;
const {descriptor:actual,registered}=nmsL02P058AdmissionDescriptor();
const sourceId='shared-nms002-l02-p060';
const mutated=(change:(copy:any)=>void):PageOnlyLessonPlayerDescriptor=>{
 const copy=structuredClone(actual);change(copy);return copy as PageOnlyLessonPlayerDescriptor;
};

test('actual proof-backed P058 predecessor has 58 registrations and unavailable P060',()=>{
 assert.equal(registered,true);
 assert.equal(actual.pages.length,64);
 assert.equal(actual.productBridge.registeredAnimationCount,58);
 assert.equal(actual.pages.filter(page=>page.rendererAvailability.kind==='registered').length,58);
 assert.equal(actual.pages[59].animationId,sourceId);
 assert.equal(actual.pages[59].rendererAvailability.kind,'unavailable');
 assert.equal(actual.pages[59].sectionCode,'TS');
 assert.equal(actual.pages[59].sectionPageOrdinal,6);
 assert.equal(actual.glossary.length,13);
});

test('P060 preview changes one page, keeps 58 real registrations, and adds only seven noncolliding terms',()=>{
 const preview=nmsL02P060CandidateDescriptorV1(actual),page=preview.pages[59];
 assert.equal(preview.pages.length,64);
 assert.equal(preview.productBridge,actual.productBridge);
 assert.equal(preview.productBridge.registeredAnimationCount,58);
 assert.deepEqual(preview.productBridge.selectedAnimationIds,actual.productBridge.selectedAnimationIds);
 assert.equal(preview.pages.filter(entry=>entry.rendererAvailability.kind==='registered').length,59);
 assert.equal(preview.pages.filter(entry=>entry.rendererAvailability.kind==='unavailable').length,5);
 assert.equal(preview.course.href,`/migration-status/g678-calibration/${sourceId}`);
 for(let i=0;i<64;i++)if(i!==59)assert.equal(preview.pages[i],actual.pages[i]);
 assert.deepEqual(page.rendererAvailability,{kind:'registered',moduleKey:sourceId,
  runtimeQuery:{frameDomain:'sprite-391',language:'fixed-en',scenario:'source-static-frame',seed:'0'}});
 assert.equal(page.previousPlacementId,'shared-nms002-l02-p059');
 assert.equal(page.nextPlacementId,'shared-nms002-l02-p061');
 assert.equal(page.source.assetId,'swf-80410162eebca2f85b9aaccec9c91c8d74250c0cba6051595579b4df206215c1');
 assert.equal(page.runtimeEvidenceBoundary?.audioAcceptance,'not-established');
 assert.equal(preview.glossary.length,20);
 assert.equal(preview.glossary.find(term=>term.id==='fraction'),actual.glossary.find(term=>term.id==='fraction'));
 assert.deepEqual(preview.glossary.slice(-7).map(term=>term.id),
  P060_SOURCE_TERMS.filter(term=>term.id!=='fraction').map(term=>term.id));
 assert(preview.glossary.slice(-7).every(term=>term.source.en.assetId==='G678L1KTE01.xml'&&
  term.source.es.assetId==='G678L1KTS01.xml'));
 assert.deepEqual(preview.productBridge.acceptanceEffects,actual.productBridge.acceptanceEffects);
});

test('P060 preview rejects source, order, count, availability and glossary drift',()=>{
 const rejects=(change:(copy:any)=>void)=>assert.throws(()=>nmsL02P060CandidateDescriptorV1(mutated(change)),
  /NMS_L02_P060_CANDIDATE_INVALID/);
 rejects(copy=>{copy.productBridge.registeredAnimationCount=57;});
 rejects(copy=>{copy.productBridge.selectedAnimationIds.pop();});
 rejects(copy=>{copy.pages[59].source.assetId='swf-wrong';});
 rejects(copy=>{copy.pages[59].sectionPageOrdinal=5;});
 rejects(copy=>{copy.pages[59].rendererAvailability={kind:'registered',moduleKey:sourceId};});
 rejects(copy=>{copy.pages[58].nextPlacementId='shared-nms002-l02-p061';});
 rejects(copy=>{copy.pages[51].rendererAvailability={kind:'unavailable',reason:'drift'};});
 rejects(copy=>{copy.source.sourceXmlSha256='0'.repeat(64);});
 rejects(copy=>{copy.glossary[0].definitions.en='drift';});
 rejects(copy=>{copy.glossary[0].sourceKeyAttribute='Decimal fraction';});
});
