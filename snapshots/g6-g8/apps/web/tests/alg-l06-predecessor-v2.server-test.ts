import assert from 'node:assert/strict';
import test from 'node:test';
import {algL6PredecessorV2,assertAlgL6PredecessorFacts} from
 '../lib/alg-l06-predecessor-v2.server';

const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const P003='shared-alg001-l06-p003';
const PREFIX='shared-alg001-l06-';
const withEnvironment=<T>(run:()=>T):T=>{
 const names=['NODE_ENV','VERCEL','VERCEL_ENV','HELP_MATH_G678_SOURCE_ROOT',
  'HELP_MATH_G678_LOCAL_PREVIEW','HELP_MATH_G678_LOCAL_PREVIEW_BIND'] as const;
 const before=Object.fromEntries(names.map(name=>[name,process.env[name]]));
 try{
  Object.assign(process.env,{NODE_ENV:'development'});
  delete process.env.VERCEL;delete process.env.VERCEL_ENV;
  process.env.HELP_MATH_G678_SOURCE_ROOT=SOURCE_ROOT;
  process.env.HELP_MATH_G678_LOCAL_PREVIEW='true';
  process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND='127.0.0.1';
  return run();
 }finally{
  for(const name of names){
   if(before[name]===undefined)delete process.env[name];
   else assert.equal(Reflect.set(process.env,name,before[name]),true);
  }
 }
};

test('real source, historical snapshot, current transaction and P003 proof yield a 19-page base',()=>{
 withEnvironment(()=>{
  const result=algL6PredecessorV2();
  assert.equal(result.base.course.moduleCode,'ALG001');
  assert.equal(result.base.course.lesson,6);
  assert.equal(result.base.pages.length,60);
  assert.equal(result.base.productBridge.registeredAnimationCount,19);
  assert.equal(result.base.pages.filter(page=>page.rendererAvailability.kind==='registered').length,19);
  assert.equal(result.base.pages[2].rendererAvailability.kind,'unavailable');
  assert.deepEqual(result.membership.admittedKeys,[P003]);
  assert.deepEqual(result.admittedPageProofs.map(item=>item.animationId),[P003]);
  assert.equal(result.admittedPageProofs[0].packet.selectedPages[0].sourceOccurrence,3);
  assert.equal(result.evidence.requiredMembers.length,19);
  assert.equal(result.evidence.currentMembers.length,20);
  assert(result.evidence.requiredMembers.some(item=>
   item.key===`${PREFIX}p001`&&
   item.registration.entry.module==='./modules/g678-alg-l06-source-title-p001'));
  assert(result.evidence.requiredMembers.some(item=>
   item.key===`${PREFIX}p002`&&
   item.registration.entry.module==='./modules/g678-alg-l06-p002-decoder-v3'));
  assert.deepEqual(result.admittedPageProofs[0].proofPin,
   result.evidence.admittedProofWitnesses[0].proofPin);
  assert(Object.values(result.base.productBridge.acceptanceEffects).every(value=>value===false));
 });
});

test('post-read validator rejects missing or changed physical-source and registry facts',()=>{
 withEnvironment(()=>{
  const {evidence}=algL6PredecessorV2();
  const check=(modified:typeof evidence)=>assertAlgL6PredecessorFacts(
   modified.requiredMembers,modified.currentMembers,modified.validatedAdmission,
   modified.admittedProofWitnesses);
  const missing=structuredClone(evidence);
  missing.currentMembers.splice(missing.currentMembers.findIndex(item=>item.key===`${PREFIX}p005`),1);
  assert.throws(()=>check(missing),/missing required member/);
  const changedSource=structuredClone(evidence);
  const source=changedSource.currentMembers.find(item=>item.key===`${PREFIX}p005`)!;
  source.source.sha256='0'.repeat(64);source.source.assetId=`swf-${source.source.sha256}`;
  assert.throws(()=>check(changedSource),/changed required registration\/source/);
  const changedRegistry=structuredClone(evidence);
  changedRegistry.currentMembers.find(item=>item.key===`${PREFIX}p001`)!
   .registration.entry.artifacts.module.sha256='0'.repeat(64);
  assert.throws(()=>check(changedRegistry),/changed required registration\/source/);
 });
});

test('unproved or wrongly indexed extra P004 membership is denied',()=>{
 withEnvironment(()=>{
  const {evidence}=algL6PredecessorV2();
  const p004=structuredClone(evidence.currentMembers.find(item=>item.key===P003)!);
  p004.key=`${PREFIX}p004`;
  p004.registration.entry.key=p004.key;
  p004.registration.entry.module=`./modules/${p004.key}`;
  p004.source.sourceOccurrence=4;
  const extra=structuredClone(evidence);
  extra.currentMembers.push(p004);
  assert.throws(()=>assertAlgL6PredecessorFacts(extra.requiredMembers,
   extra.currentMembers,extra.validatedAdmission,extra.admittedProofWitnesses),
   /unadmitted extra member/);
  const forged=structuredClone(extra.admittedProofWitnesses[0]);
  forged.animationId=p004.key;
  forged.registration=p004.registration;
  forged.source=p004.source;
  forged.packet.entry=p004.registration.entry;
  forged.packet.selectedPages[0].animationId=p004.key;
  forged.packet.selectedPages[0].sourceOccurrence=4;
  extra.admittedProofWitnesses.push(forged);
  assert.throws(()=>assertAlgL6PredecessorFacts(extra.requiredMembers,
   extra.currentMembers,extra.validatedAdmission,extra.admittedProofWitnesses),
   /duplicate admitted proof path|proof appears in verified admission index/);
 });
});

test('source-root or preview-environment drift fails before any descriptor projection',()=>{
 withEnvironment(()=>{
  process.env.HELP_MATH_G678_SOURCE_ROOT='/tmp/not-the-real-source';
  assert.throws(()=>algL6PredecessorV2(),/local source environment/);
 });
});
