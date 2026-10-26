import assert from 'node:assert/strict';
import test from 'node:test';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P022FormalDescriptor} from '../lib/alg-l06-p022-formal-admission-v1.server';
import {algL6P023CandidateDescriptor} from '../lib/alg-l06-p023-candidate-v1.server';

const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',
 HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',
 HELP_MATH_G678_SOURCE_ROOT:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'});
delete env.VERCEL;delete env.VERCEL_ENV;

test('P023 projects only VB13 on P022 formal and appends Domain',()=>{
 if(localOnlyAnimationModuleRegistration('shared-alg001-l06-p023')){
  assert.throws(()=>algL6P023CandidateDescriptor(),/P023_CANDIDATE_INVALID/);
  return;
 }
 const base=algL6P022FormalDescriptor(),candidate=algL6P023CandidateDescriptor();
 assert.equal(registeredLocalOnlyAnimationKeys.length,510);
 assert.equal(base.productBridge.registeredAnimationCount,33);
 assert.equal(candidate.productBridge.registeredAnimationCount,34);
 assert.equal(candidate.pages.length,60);
 for(let index=0;index<60;index++)if(index!==22)
  assert.deepEqual(candidate.pages[index],base.pages[index]);
 const target=candidate.pages[22];
 assert.equal(target.rendererAvailability.kind,'registered');
 assert.deepEqual(target.rendererAvailability.kind==='registered'
  ? target.rendererAvailability.runtimeQuery : null,
  {frameDomain:'sprite-38',language:'fixed-en',scenario:'source-static-frame',seed:'0'});
 assert.equal(target.source.sourceOccurrence,23);
 assert.equal(target.globalPageOrdinal,23);
 assert.equal(target.sectionCode,'VB');
 assert.equal(target.sectionPageOrdinal,13);
 assert.equal(target.presentation?.pageInteractionCompanionTargetIdSuffix,'p023-source-readable');
 assert.deepEqual(candidate.productBridge.selectedAnimationIds.filter(
  id=>id!=='shared-alg001-l06-p023'),base.productBridge.selectedAnimationIds);
 assert.deepEqual(candidate.glossary.slice(0,36),base.glossary);
 assert.deepEqual(candidate.glossary.slice(36).map(entry=>[entry.id,entry.sourceKeyAttribute]),
  [['domain','Domain']]);
 for(const [id,key] of [['domain','Domain'],['set','Set'],['function','Function'],['input','Input']]){
  const matches=candidate.glossary.filter(entry=>entry.id===id);
  assert.equal(matches.length,1);
  assert.equal(matches[0].sourceKeyAttribute,key);
  assert(matches[0].labels.en.length>0&&matches[0].labels.es.length>0);
  assert(matches[0].definitions.en.length>0&&matches[0].definitions.es.length>0);
 }
 assert.equal(candidate.glossary.length,37);
 assert(Object.values(candidate.productBridge.acceptanceEffects).every(value=>value===false));
 assert.equal(candidate.course.href,
  '/migration-status/g678-calibration/shared-alg001-l06-p023/candidate-v1');
});

test('P023 candidate fails closed outside exact local physical-source boundary',()=>{
 for(const [key,value] of Object.entries({NODE_ENV:'production',VERCEL:'1',
  HELP_MATH_G678_SOURCE_ROOT:'/tmp',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0',
  HELP_MATH_G678_LOCAL_PREVIEW:'0'})){
  const saved=env[key];env[key]=value;
  try{assert.throws(()=>algL6P023CandidateDescriptor(),/P023_CANDIDATE_INVALID/);}
  finally{if(saved===undefined)delete env[key];else env[key]=saved;}
 }
});
