import assert from 'node:assert/strict';
import test from 'node:test';
import {algL6P015FormalDescriptor} from '../lib/alg-l06-p015-formal-admission-v1.server';
import {algL6P014FormalDescriptor} from '../lib/alg-l06-p014-formal-admission-v1.server';
import {algL6P015CandidateDescriptor} from '../lib/alg-l06-p015-candidate-v1.server';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',
 HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',
 HELP_MATH_G678_SOURCE_ROOT:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'});
delete env.VERCEL;delete env.VERCEL_ENV;
test('P015 adds exactly one unregistered placement without changing its 59 peers or glossary',()=>{
 const base=algL6P014FormalDescriptor();
 if(localOnlyAnimationModuleRegistration('shared-alg001-l06-p015')){
  assert.throws(()=>algL6P015CandidateDescriptor(),/P015_CANDIDATE_INVALID/);
  const formal=algL6P015FormalDescriptor();assert.equal(formal.productBridge.registeredAnimationCount,26);
  for(let i=0;i<60;i++)if(i!==14)assert.deepEqual(formal.pages[i],base.pages[i]);
  assert(Object.values(formal.productBridge.acceptanceEffects).every(x=>x===false));return;
 }
 const candidate=algL6P015CandidateDescriptor();
 assert.equal(localOnlyAnimationModuleRegistration('shared-alg001-l06-p015'),undefined);
 assert.equal(base.productBridge.registeredAnimationCount,25);
 assert.equal(candidate.productBridge.registeredAnimationCount,26);
 assert.equal(candidate.pages.length,60);
 for(let i=0;i<60;i++)if(i!==14)assert.deepEqual(candidate.pages[i],base.pages[i]);
 assert.equal(candidate.pages[14].rendererAvailability.kind,'registered');
 assert.equal(candidate.pages[14].presentation?.pageInteractionCompanionTargetIdSuffix,'p015-source-readable');
 assert.deepEqual(candidate.glossary,base.glossary);
 assert(Object.values(candidate.productBridge.acceptanceEffects).every(value=>value===false));
});
test('candidate rejects production, noncanonical roots and nonloopback binding',()=>{
 for(const [key,value] of Object.entries({NODE_ENV:'production',VERCEL:'1',
  HELP_MATH_G678_SOURCE_ROOT:'/tmp',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0'})){
  const saved=env[key];env[key]=value;
  try{assert.throws(()=>algL6P015CandidateDescriptor(),/P015_CANDIDATE_INVALID/);}
  finally{if(saved===undefined)delete env[key];else env[key]=saved;}
 }
});
