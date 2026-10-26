import assert from 'node:assert/strict';
import test from 'node:test';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P020FormalDescriptor} from '../lib/alg-l06-p020-formal-admission-v1.server';
import {algL6P021CandidateDescriptor} from '../lib/alg-l06-p021-candidate-v1.server';

const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',
 HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',
 HELP_MATH_G678_SOURCE_ROOT:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'});
delete env.VERCEL;delete env.VERCEL_ENV;

test('P021 projects only VB11 on P020 formal and appends two exact source terms',()=>{
 if(localOnlyAnimationModuleRegistration('shared-alg001-l06-p021')){
  assert.throws(()=>algL6P021CandidateDescriptor(),/P021_CANDIDATE_INVALID/);
  return;
 }
 const base=algL6P020FormalDescriptor(),candidate=algL6P021CandidateDescriptor();
 assert.equal(registeredLocalOnlyAnimationKeys.length,508);
 assert.equal(base.productBridge.registeredAnimationCount,31);
 assert.equal(candidate.productBridge.registeredAnimationCount,32);
 assert.equal(candidate.pages.length,60);
 for(let index=0;index<60;index++)if(index!==20)
  assert.deepEqual(candidate.pages[index],base.pages[index]);
 const target=candidate.pages[20];
 assert.equal(target.rendererAvailability.kind,'registered');
 assert.deepEqual(target.rendererAvailability.kind==='registered'
  ? target.rendererAvailability.runtimeQuery : null,
  {frameDomain:'sprite-43',language:'fixed-en',scenario:'source-static-frame',seed:'0'});
 assert.equal(target.source.sourceOccurrence,21);
 assert.equal(target.globalPageOrdinal,21);
 assert.equal(target.sectionCode,'VB');
 assert.equal(target.sectionPageOrdinal,11);
 assert.equal(target.presentation?.pageInteractionCompanionTargetIdSuffix,'p021-source-readable');
 assert.deepEqual(candidate.productBridge.selectedAnimationIds.filter(
  id=>id!=='shared-alg001-l06-p021'),base.productBridge.selectedAnimationIds);
 assert.deepEqual(candidate.glossary.slice(0,32),base.glossary);
 assert.deepEqual(candidate.glossary.slice(32).map(entry=>[entry.id,entry.sourceKeyAttribute]),
  [['set','Set'],['ordered-pair','Ordered pair']]);
 for(const [id,key] of [['set','Set'],['input','Input'],['ordered-pair','Ordered pair'],
  ['function','Function'],['value','Value'],['output','Output']]){
  const matches=candidate.glossary.filter(entry=>entry.id===id);
  assert.equal(matches.length,1);
  assert.equal(matches[0].sourceKeyAttribute,key);
  assert(matches[0].labels.en.length>0&&matches[0].labels.es.length>0);
  assert(matches[0].definitions.en.length>0&&matches[0].definitions.es.length>0);
 }
 assert.equal(candidate.glossary.length,34);
 assert(Object.values(candidate.productBridge.acceptanceEffects).every(value=>value===false));
 assert.equal(candidate.course.href,
  '/migration-status/g678-calibration/shared-alg001-l06-p021/candidate-v1');
});

test('P021 candidate fails closed outside exact local physical-source boundary',()=>{
 for(const [key,value] of Object.entries({NODE_ENV:'production',VERCEL:'1',
  HELP_MATH_G678_SOURCE_ROOT:'/tmp',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0',
  HELP_MATH_G678_LOCAL_PREVIEW:'0'})){
  const saved=env[key];env[key]=value;
  try{assert.throws(()=>algL6P021CandidateDescriptor(),/P021_CANDIDATE_INVALID/);}
  finally{if(saved===undefined)delete env[key];else env[key]=saved;}
 }
});
