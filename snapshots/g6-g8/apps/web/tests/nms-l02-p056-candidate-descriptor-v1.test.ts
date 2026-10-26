import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {P056_SOURCE_TERMS} from '../../../packages/demos/src/generated/nms-l02-p056-terms-v1';
import {
 extendNmsL02P055Descriptor,
 type NmsL02P055DescriptorProvenance,
} from '../lib/nms-l02-p055-descriptor-extension';
import {nmsL02P056CandidateDescriptorV1} from '../lib/nms-l02-p056-candidate-descriptor-v1';
import type {PageOnlyLessonPlayerDescriptor} from '../lib/whole-lesson-player-descriptor';

const witness=JSON.parse(readFileSync(new URL('../../../output/nms-l02-host-successor-20260927/predecessor/descriptor-witness-two-stage-v1.json',import.meta.url),'utf8'));
const proof=JSON.parse(readFileSync(new URL('../../../work/g678-workflow/candidates/shared-nms002-l02-p055-v1.json',import.meta.url),'utf8'));
const p055=proof.packet;
const id=(ordinal:number)=>`shared-nms002-l02-p${String(ordinal).padStart(3,'0')}`;
const sourceSha='a1872d6c20987340889c1077d6720cbfe046faa3b5228164987e0834f3c639be';

function actualP055Predecessor():PageOnlyLessonPlayerDescriptor{
 const descriptor=witness.descriptor as PageOnlyLessonPlayerDescriptor;
 const descriptorBytes=readFileSync(new URL(`../../../${witness.descriptorFile.path}`,import.meta.url));
 assert.equal(descriptorBytes.length,witness.descriptorFile.bytes);
 assert.equal(createHash('sha256').update(descriptorBytes).digest('hex'),witness.descriptorFile.sha256);
 const freezeBytes=readFileSync(new URL(`../../../${proof.freeze.path}`,import.meta.url));
 assert.equal(freezeBytes.length,proof.freeze.bytes);
 assert.equal(createHash('sha256').update(freezeBytes).digest('hex'),proof.freeze.sha256);
 const selected=p055.selectedPages[0];
 const provenance:NmsL02P055DescriptorProvenance={
  calibrationId:p055.calibrationId,
  sourceXml:p055.sourceXml,
  source:{...p055.source,path:`${p055.sourceRoot}/${p055.source.path}`},
  selectedPage:{animationId:selected.animationId,placementId:selected.placementId,assetId:selected.assetId,
   globalPageOrdinal:selected.globalPageOrdinal,sectionCode:selected.sectionCode,
   sectionPageOrdinal:selected.sectionPageOrdinal,sourceOccurrence:selected.sourceOccurrence,
   sourceSha256:selected.sourceSha256,runtime:selected.runtime},
  freeze:proof.freeze,
  glossary:{candidateSha256:p055.glossary.candidateSha256,product:p055.glossary.product,
   sourceSelection:p055.glossary.sourceSelection,
   originalL2XmlResolved:p055.glossary.originalL2XmlResolved,
   historicalHostAssociationEstablished:p055.glossary.historicalHostAssociationEstablished,
   originalRuntimeLookupVerified:p055.glossary.originalRuntimeLookupVerified},
 };
 return extendNmsL02P055Descriptor(descriptor,provenance);
}

test('real frozen P052 witness and P055 proof project 55 registered pages before P056',()=>{
 const base=actualP055Predecessor();
 assert.equal(base.pages.length,64);
 assert.equal(base.productBridge.registeredAnimationCount,55);
 assert.equal(base.pages.filter(page=>page.rendererAvailability.kind==='registered').length,55);
 assert.equal(base.pages[54].animationId,id(55));
 assert.equal(base.pages[55].animationId,id(56));
 assert.equal(base.pages[55].rendererAvailability.kind,'unavailable');
});

test('P056 candidate changes only page 56 and adds two conditional terms without registration',()=>{
 const base=actualP055Predecessor();
 const result=nmsL02P056CandidateDescriptorV1(base);
 assert.equal(result.pages.length,64);
 assert.equal(result.course.activePageCount,64);
 assert.equal(result.course.href,`/migration-status/g678-calibration/${id(56)}`);
 assert.equal(result.productBridge.registeredAnimationCount,55);
 assert.deepEqual(result.productBridge.selectedAnimationIds,base.productBridge.selectedAnimationIds);
 assert.equal(result.pages.filter(page=>page.rendererAvailability.kind==='registered').length,56);
 assert.equal(result.pages.filter(page=>page.rendererAvailability.kind==='registered'&&page.animationId!==id(56)).length,55);
 assert.equal(result.pages.filter(page=>page.rendererAvailability.kind==='unavailable').length,8);
 for(let index=0;index<64;index++)if(index!==55)assert.equal(result.pages[index],base.pages[index]);
 assert.equal(base.pages[55].rendererAvailability.kind,'unavailable');
 assert.deepEqual(result.pages[55].rendererAvailability,{kind:'registered',moduleKey:id(56),
  runtimeQuery:{frameDomain:'sprite-24',language:'fixed-en',scenario:'source-static-frame',seed:'0'}});
 assert.equal(result.pages[55].source.assetId,`swf-${sourceSha}`);
 assert.deepEqual(result.glossary.map(term=>term.id),[...base.glossary.map(term=>term.id),'organize','information']);
 assert.deepEqual(result.glossary.slice(-2).map(term=>term.sourceKeyAttribute),P056_SOURCE_TERMS.map(term=>term.sourceKeyAttribute));
 assert.deepEqual(result.productBridge.acceptanceEffects,base.productBridge.acceptanceEffects);
});

test('P056 candidate rejects target identity, source, availability, XML and glossary collisions',()=>{
 const base=actualP055Predecessor();
 const mutation=(apply:(copy:any)=>void)=>{const copy=structuredClone(base);apply(copy);return copy as PageOnlyLessonPlayerDescriptor;};
 assert.throws(()=>nmsL02P056CandidateDescriptorV1(mutation(copy=>{copy.productBridge.registeredAnimationCount=54;})),/P056_CANDIDATE_PREDECESSOR/);
 assert.throws(()=>nmsL02P056CandidateDescriptorV1(mutation(copy=>{copy.pages[55].source.assetId='swf-wrong';})),/P056_CANDIDATE_PREDECESSOR/);
 assert.throws(()=>nmsL02P056CandidateDescriptorV1(mutation(copy=>{copy.pages[55].sectionPageOrdinal=3;})),/P056_CANDIDATE_PREDECESSOR/);
 assert.throws(()=>nmsL02P056CandidateDescriptorV1(mutation(copy=>{copy.pages[55].rendererAvailability={kind:'registered',moduleKey:id(56)};})),/P056_CANDIDATE_PREDECESSOR/);
 assert.throws(()=>nmsL02P056CandidateDescriptorV1(mutation(copy=>{copy.source.sourceXmlSha256='0'.repeat(64);})),/P056_CANDIDATE_PREDECESSOR/);
 assert.throws(()=>nmsL02P056CandidateDescriptorV1(mutation(copy=>{copy.glossary.push({...P056_SOURCE_TERMS[0],definitions:{en:'wrong',es:'wrong'}});})),/P056_CANDIDATE_GLOSSARY_COLLISION/);
 assert.throws(()=>nmsL02P056CandidateDescriptorV1(mutation(copy=>{copy.glossary.push({...P056_SOURCE_TERMS[0],id:'other-id'});})),/P056_CANDIDATE_GLOSSARY_COLLISION/);
});

function changedPredecessor(apply:(copy:any)=>void):PageOnlyLessonPlayerDescriptor{
 const base=actualP055Predecessor();
 const copy=structuredClone(base);apply(copy);
 return copy as PageOnlyLessonPlayerDescriptor;
}

test('P056 candidate rejects broken P055 to P056 source order',()=>{
 assert.throws(()=>nmsL02P056CandidateDescriptorV1(changedPredecessor(copy=>{
  copy.pages[54].nextPlacementId=id(57);
 })),/P056_CANDIDATE_PREDECESSOR/);
});

test('P056 candidate rejects registered ID list divergence',()=>{
 assert.throws(()=>nmsL02P056CandidateDescriptorV1(changedPredecessor(copy=>{
  copy.productBridge.selectedAnimationIds.pop();
 })),/P056_CANDIDATE_PREDECESSOR/);
});

test('P056 candidate rejects a previously registered page becoming unavailable',()=>{
 assert.throws(()=>nmsL02P056CandidateDescriptorV1(changedPredecessor(copy=>{
  // P052 is registered; P054 is not in the noncontiguous real predecessor.
  copy.pages[51].rendererAvailability={kind:'unavailable',reason:'drift'};
 })),/P056_CANDIDATE_PREDECESSOR/);
});
