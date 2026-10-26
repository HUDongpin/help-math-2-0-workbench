import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {nmsL02P054AdmissionDescriptor} from '../lib/nms-l02-p054-admission.server';
import {nmsL02P053ProductDescriptorV1} from '../lib/nms-l02-p053-product-descriptor-v1';
import {nmsL02P053ProductCandidateDescriptor} from '../lib/nms-l02-p053-product-candidate.server';

const env=process.env as Record<string,string|undefined>;
env.HELP_MATH_G678_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
env.NODE_ENV='development';delete env.VERCEL;delete env.VERCEL_ENV;

test('P053 projects exactly one candidate over registered P054 without changing membership',()=>{
 const {descriptor:base,registered}=nmsL02P054AdmissionDescriptor();
 assert.equal(registered,true);
 assert.equal(base.productBridge.registeredAnimationCount,63);
 const candidate=nmsL02P053ProductDescriptorV1(base);
 assert.equal(candidate.productBridge,base.productBridge);
 assert.equal(candidate.glossary,base.glossary);
 assert.equal(candidate.pages.length,64);
 assert.equal(candidate.pages.filter(page=>page.rendererAvailability.kind==='registered').length,64);
 assert.equal(candidate.pages[52].rendererAvailability.kind,'registered');
 assert.deepEqual(candidate.pages[52].rendererAvailability,{kind:'registered',
  moduleKey:'shared-nms002-l02-p053',runtimeQuery:{frameDomain:'sprite-187',
   language:'fixed-en',scenario:'source-directions-v1',seed:'0'}});
 assert.equal(candidate.pages[53],base.pages[53]);
 for(let i=0;i<64;i++)if(i!==52)assert.equal(candidate.pages[i],base.pages[i]);
 assert.deepEqual(candidate.support.lessonHostCapabilities,['glossary','fq-scoring','navigation']);
 assert(Object.values(candidate.productBridge.acceptanceEffects).every(value=>value===false));
});

test('P053 refuses source, predecessor, order and acceptance drift',()=>{
 const {descriptor:base}=nmsL02P054AdmissionDescriptor();
 const rejects=(mutate:(d:any)=>void)=>{const clone=structuredClone(base);mutate(clone);
  assert.throws(()=>nmsL02P053ProductDescriptorV1(clone),/NMS_L02_P053_CANDIDATE_INVALID/u);};
 rejects(d=>d.productBridge.registeredAnimationCount=62);
 rejects(d=>d.pages[52].source.assetId='swf-wrong');
 rejects(d=>d.pages[52].rendererAvailability={kind:'registered',moduleKey:'shared-nms002-l02-p053'});
 rejects(d=>d.pages[53].previousPlacementId=null);
 rejects(d=>d.glossary.pop());
 rejects(d=>d.productBridge.acceptanceEffects.ownerAccepted=true);
});

test('local reader verifies real source audits, audio, and registered predecessor',()=>{
 const candidate=nmsL02P053ProductCandidateDescriptor();
 assert.equal(candidate.productBridge.registeredAnimationCount,63);
 assert.equal(candidate.pages[52].rendererAvailability.kind,'registered');
 const before=env.NODE_ENV;env.NODE_ENV='production';
 try{assert.throws(()=>nmsL02P053ProductCandidateDescriptor(),/local source environment/u);}
 finally{env.NODE_ENV=before;}
});

test('P053 route remains local, no-query, and production-stubbed',()=>{
 const route=readFileSync(new URL('../app/[locale]/migration-status/g678-calibration/shared-nms002-l02-p053/page.tsx',import.meta.url),'utf8');
 assert.match(route,/Object\.keys\(await searchParams\)\.length!==0/u);
 assert.match(route,/isG678LocalPreviewRequestHeaders/u);
 assert.match(route,/nms-l02-p053-product-host\.production-stub/u);
 assert.match(route,/data-p053-current-js="unregistered-product-candidate"/u);
 assert.match(route,/noarchive:true/u);
});
