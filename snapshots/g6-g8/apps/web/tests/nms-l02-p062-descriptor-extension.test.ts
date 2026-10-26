import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {createMemoryOnlyLessonHost} from '../../../packages/demos/src/lesson-host-contract';
import {nmsL02P061AdmissionDescriptor} from '../lib/nms-l02-p061-admission.server';
import {extendNmsL02P062Descriptor,type NmsL02P062DescriptorProvenance} from '../lib/nms-l02-p062-descriptor-extension';
const sourceRoot='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ID='shared-nms002-l02-p062',CALIBRATION='g678-nms-l02-p062-conditional-host-current-js-v1';
function base(){
 const env=process.env as Record<string,string|undefined>;
 const keys=['NODE_ENV','VERCEL','VERCEL_ENV','HELP_MATH_G678_SOURCE_ROOT'];
 const saved=keys.map(key=>env[key]);
 try{env.NODE_ENV='development';delete env.VERCEL;delete env.VERCEL_ENV;
  env.HELP_MATH_G678_SOURCE_ROOT=sourceRoot;
  const result=nmsL02P061AdmissionDescriptor();assert.equal(result.registered,true);return result.descriptor;
 }finally{keys.forEach((key,index)=>{if(saved[index]===undefined)delete env[key];else env[key]=saved[index];});}
}
function facts():NmsL02P062DescriptorProvenance{
 const sourcePath=sourceRoot+'/G6-G8-shared/NMS002/L2/TS/L2TS09.swf';
 const xmlPath='G6-G8-shared/NMS002/L2/index.xml';
 const source=readFileSync(sourcePath),xml=readFileSync(sourceRoot+'/'+xmlPath);
 const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
 assert.equal(source.length,564902);assert.equal(sha(source),'5a075362f005aab68406d5fae2378f622a64520ec19e4b03b9ac9abbbd5faa50');
 return {calibrationId:CALIBRATION,source:{path:sourcePath,bytes:source.length,sha256:sha(source)},
  sourceXml:{path:xmlPath,bytes:xml.length,sha256:sha(xml)},
  selectedPage:{animationId:ID,placementId:ID,assetId:'swf-'+sha(source),sourceSha256:sha(source),
   globalPageOrdinal:62,sourceOccurrence:62,sectionCode:'TS',sectionPageOrdinal:8,
   runtime:{frameDomain:'sprite-315',frameCount:837,rootBeginFrame:6,fps:12,
    stage:{width:800,height:600},scenario:'source-static-frame'}},
  // Pure projection fixture only: real admission must independently read its physical freeze.
  freeze:{path:`catalog/product-bridge-calibrations/${CALIBRATION}.json`,sha256:'f'.repeat(64)},
  sourceKeyAttributeCalls:0};
}
test('real registered P061 extends only P062 to61/64 without new glossary or acceptance',()=>{
 const before=base(),snapshot=structuredClone(before),p=facts(),after=extendNmsL02P062Descriptor(before,p);
 assert.equal(after.productBridge.registeredAnimationCount,61);
 assert.equal(after.pages.filter(page=>page.rendererAvailability.kind==='registered').length,61);
 assert.equal(after.productBridge.selectedAnimationIds.filter(id=>id===ID).length,1);
 assert.equal(after.glossary,before.glossary);assert.equal(after.glossary.length,25);
 for(let index=0;index<64;index++)if(index!==61)assert.equal(after.pages[index],before.pages[index]);
 assert.deepEqual(before,snapshot);assert.deepEqual(after.productBridge.acceptanceEffects,before.productBridge.acceptanceEffects);
 assert.equal(after.source.candidateFreezeManifestSha256,p.freeze.sha256);
 assert.equal(after.pages[61].runtimeEvidenceBoundary?.naturalTraceValidation,'not-established');
 assert.doesNotThrow(()=>createMemoryOnlyLessonHost({releaseId:after.releaseId,
  releaseMemberIds:after.pages.map(page=>page.animationId),currentAnimationId:ID,mode:'audit'}));
});
test('formal P062 projection rejects changed source, runtime, freeze and invented glossary',()=>{
 const predecessor=base(),p=facts();
 for(const mutate of [
  (q:any)=>{q.calibrationId='wrong';},(q:any)=>{q.source.bytes--;},
  (q:any)=>{q.sourceXml.sha256='0'.repeat(64);},(q:any)=>{q.selectedPage.sourceOccurrence=61;},
  (q:any)=>{q.selectedPage.runtime.frameCount=834;},(q:any)=>{q.selectedPage.runtime.rootBeginFrame=1;},
  (q:any)=>{q.freeze.path='wrong';},(q:any)=>{q.freeze.sha256='wrong';},
  (q:any)=>{q.sourceKeyAttributeCalls=1;},
 ]){const wrong=structuredClone(p);mutate(wrong);assert.throws(()=>extendNmsL02P062Descriptor(predecessor,wrong),/P062_DESCRIPTOR_INVALID/);}
 const bad=structuredClone(predecessor) as any;delete bad.productBridge.acceptanceEffects.audioAccepted;
 assert.throws(()=>extendNmsL02P062Descriptor(bad,p),/P062_DESCRIPTOR_INVALID/);
 assert.throws(()=>extendNmsL02P062Descriptor(extendNmsL02P062Descriptor(predecessor,p),p),/P062_CANDIDATE_INVALID/);
});
