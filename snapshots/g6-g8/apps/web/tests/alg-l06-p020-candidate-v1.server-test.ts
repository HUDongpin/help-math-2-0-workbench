import assert from 'node:assert/strict';
import test from 'node:test';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P019FormalDescriptor} from '../lib/alg-l06-p019-formal-admission-v1.server';
import {algL6P020CandidateDescriptor} from '../lib/alg-l06-p020-candidate-v1.server';

const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',
 HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',
 HELP_MATH_G678_SOURCE_ROOT:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'});
delete env.VERCEL;delete env.VERCEL_ENV;

test('P020 projects only source VB10; 30 predecessors and all 32 dictionary entries remain',()=>{
 if(localOnlyAnimationModuleRegistration('shared-alg001-l06-p020')){
  assert.throws(()=>algL6P020CandidateDescriptor(),/P020_CANDIDATE_INVALID/);
  return;
 }
 const base=algL6P019FormalDescriptor(),candidate=algL6P020CandidateDescriptor();
 assert.equal(registeredLocalOnlyAnimationKeys.length,507);
 assert.equal(base.productBridge.registeredAnimationCount,30);
 assert.equal(candidate.productBridge.registeredAnimationCount,31);
 assert.equal(candidate.pages.length,60);
 for(let index=0;index<60;index++)if(index!==19)
  assert.deepEqual(candidate.pages[index],base.pages[index]);
 assert.equal(candidate.pages[19].rendererAvailability.kind,'registered');
 assert.deepEqual(candidate.pages[19].rendererAvailability.kind==='registered'
  ? candidate.pages[19].rendererAvailability.runtimeQuery : null,
  {frameDomain:'sprite-162',language:'fixed-en',scenario:'source-static-frame',seed:'0'});
 assert.equal(candidate.pages[19].source.sourceOccurrence,20);
 assert.equal(candidate.pages[19].sectionCode,'VB');
 assert.equal(candidate.pages[19].sectionPageOrdinal,10);
 assert.equal(candidate.pages[19].presentation?.pageInteractionCompanionTargetIdSuffix,
  'p020-source-readable');
 assert.deepEqual(candidate.productBridge.selectedAnimationIds.filter(
  id=>id!=='shared-alg001-l06-p020'),base.productBridge.selectedAnimationIds);
 assert.deepEqual(candidate.glossary,base.glossary);
 for(const [id,key] of [['input','Input'],['function','Function'],['output','Output']]){
  const matches=candidate.glossary.filter(entry=>entry.id===id);
  assert.equal(matches.length,1);
  assert.equal(matches[0].sourceKeyAttribute,key);
  assert(matches[0].definitions.en.length>0&&matches[0].definitions.es.length>0);
 }
 assert(Object.values(candidate.productBridge.acceptanceEffects).every(value=>value===false));
});

test('P020 candidate rejects production, wrong physical source and exposed bind',()=>{
 for(const [key,value] of Object.entries({NODE_ENV:'production',VERCEL:'1',
  HELP_MATH_G678_SOURCE_ROOT:'/tmp',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0',
  HELP_MATH_G678_LOCAL_PREVIEW:'0'})){
  const saved=env[key];env[key]=value;
  try{assert.throws(()=>algL6P020CandidateDescriptor(),/P020_CANDIDATE_INVALID/);}
  finally{if(saved===undefined)delete env[key];else env[key]=saved;}
 }
});
