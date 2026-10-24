import assert from 'node:assert/strict';
import test from 'node:test';
import {algL6P015FormalDescriptor} from '../lib/alg-l06-p015-formal-admission-v1.server';
import {algL6P016CandidateDescriptor} from '../lib/alg-l06-p016-candidate-v1.server';
import {localOnlyAnimationModuleRegistration}
 from '@helpmath/demos/local-only-animation-registry-metadata';
const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',
 HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',
 HELP_MATH_G678_SOURCE_ROOT:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'});
delete env.VERCEL;delete env.VERCEL_ENV;

test('P016 projects exactly VB6 while preserving its 59 peers and Function glossary',()=>{
 if(localOnlyAnimationModuleRegistration('shared-alg001-l06-p016')){
  assert.throws(()=>algL6P016CandidateDescriptor(),/P016_CANDIDATE_INVALID/);
  return;
 }
 const base=algL6P015FormalDescriptor(),candidate=algL6P016CandidateDescriptor();
 assert.equal(base.productBridge.registeredAnimationCount,26);
 assert.equal(candidate.productBridge.registeredAnimationCount,27);
 assert.equal(candidate.pages.length,60);
 for(let i=0;i<60;i++)if(i!==15)assert.deepEqual(candidate.pages[i],base.pages[i]);
 assert.equal(candidate.pages[15].rendererAvailability.kind,'registered');
 assert.equal(candidate.pages[15].presentation?.pageInteractionCompanionTargetIdSuffix,
  'p016-source-readable');
 assert.deepEqual(candidate.glossary,base.glossary);
 assert.equal(candidate.glossary.filter(entry=>entry.id==='function').length,1);
 assert(Object.values(candidate.productBridge.acceptanceEffects).every(value=>value===false));
});
test('P016 candidate denies production, wrong source and nonloopback binding',()=>{
 for(const [key,value] of Object.entries({NODE_ENV:'production',VERCEL:'1',
  HELP_MATH_G678_SOURCE_ROOT:'/tmp',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0'})){
  const saved=env[key];env[key]=value;
  try{assert.throws(()=>algL6P016CandidateDescriptor(),/P016_CANDIDATE_INVALID/);}
  finally{if(saved===undefined)delete env[key];else env[key]=saved;}
 }
});
