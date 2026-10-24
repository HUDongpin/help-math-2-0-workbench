import assert from 'node:assert/strict';
import test from 'node:test';
import {algL6P010FormalDescriptor} from '../lib/alg-l06-p010-formal-admission-v1.server';
import {algL6P013CandidateDescriptor} from '../lib/alg-l06-p013-candidate-v1.server';
import {localOnlyAnimationModuleRegistration}
  from '@helpmath/demos/local-only-animation-registry-metadata';

const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',
  HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',
  HELP_MATH_G678_SOURCE_ROOT:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'});
delete env.VERCEL;delete env.VERCEL_ENV;

test('P013 candidate changes exactly one source occurrence without registration or acceptance',()=>{
  const base=algL6P010FormalDescriptor(),candidate=algL6P013CandidateDescriptor();
  assert.equal(base.productBridge.registeredAnimationCount,23);
  assert.equal(candidate.productBridge.registeredAnimationCount,24);
  assert.equal(candidate.pages.length,60);
  assert.equal(localOnlyAnimationModuleRegistration('shared-alg001-l06-p013'),undefined);
  for(let index=0;index<60;index++)if(index!==12)
    assert.deepEqual(candidate.pages[index],base.pages[index]);
  const page=candidate.pages[12];
  assert.equal(page.source.assetId,
    'swf-1be47750557385ef91c648fb87fdcde642d342caadc35da7a1f7a2d1fdb11d35');
  assert.equal(page.rendererAvailability.kind,'registered');
  assert.equal(page.presentation?.pageInteractionCompanionTargetIdSuffix,'p013-source-readable');
  assert.deepEqual(candidate.glossary,base.glossary);
  assert.equal(candidate.glossary.filter(entry=>entry.id==='input').length,1);
  assert.equal(candidate.glossary.filter(entry=>entry.id==='output').length,1);
  assert(Object.values(candidate.productBridge.acceptanceEffects).every(value=>value===false));
});

test('candidate reader is unavailable outside exact local source environment',()=>{
  const saved={...env};
  for(const [key,value] of Object.entries({NODE_ENV:'production',VERCEL:'1',
    HELP_MATH_G678_SOURCE_ROOT:'/tmp',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0'})){
    env[key]=value;assert.throws(()=>algL6P013CandidateDescriptor(),/P013_CANDIDATE_INVALID/);
    if(saved[key]===undefined)delete env[key];else env[key]=saved[key];
  }
});
