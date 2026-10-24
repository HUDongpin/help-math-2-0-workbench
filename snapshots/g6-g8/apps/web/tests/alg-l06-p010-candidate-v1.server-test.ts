import assert from 'node:assert/strict';
import test from 'node:test';
import {algL6P008FormalDescriptor} from '../lib/alg-l06-p008-formal-admission-v1.server';
import {algL6P010FormalDescriptor} from '../lib/alg-l06-p010-formal-admission-v1.server';
import {algL6P010CandidateDescriptor} from '../lib/alg-l06-p010-candidate-v1.server';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',
 HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',
 HELP_MATH_G678_SOURCE_ROOT:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'});
delete env.VERCEL;delete env.VERCEL_ENV;
test('P010 candidate changes exactly one source occurrence without registration or acceptance',()=>{
 if(localOnlyAnimationModuleRegistration('shared-alg001-l06-p010')){
  assert.throws(()=>algL6P010CandidateDescriptor(),/499 formal pages; P010 is unregistered/);
  return;
 }
 const base=algL6P008FormalDescriptor(),candidate=algL6P010CandidateDescriptor();
 assert.equal(base.productBridge.registeredAnimationCount,22);
 assert.equal(candidate.productBridge.registeredAnimationCount,23);
 assert.equal(candidate.pages.length,60);
 assert.equal(localOnlyAnimationModuleRegistration('shared-alg001-l06-p010'),undefined);
 for(let i=0;i<60;i++)if(i!==9)assert.deepEqual(candidate.pages[i],base.pages[i]);
 assert.equal(candidate.pages[9].source.assetId,'swf-96552f567037f39868d01b1ba77311858caf2efcdb141ef64ed0878a6c48ce14');
 assert.equal(candidate.pages[9].rendererAvailability.kind,'registered');
 assert.equal(candidate.pages[9].presentation?.pageInteractionCompanionTargetIdSuffix,'p010-source-readable');
 assert.deepEqual(candidate.glossary,base.glossary);
 assert.equal(candidate.glossary.filter(e=>e.id==='function').length,1);
 assert(Object.values(candidate.productBridge.acceptanceEffects).every(v=>v===false));
});
test('candidate reader is unavailable outside the exact local source environment',()=>{
 const saved={...env};
 for(const [key,value] of Object.entries({NODE_ENV:'production',VERCEL:'1',
  HELP_MATH_G678_SOURCE_ROOT:'/tmp',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0'})){
  env[key]=value;assert.throws(()=>algL6P010CandidateDescriptor(),/P010_CANDIDATE_INVALID/);
  if(saved[key]===undefined)delete env[key];else env[key]=saved[key];
 }
});

test('registered P010 reader proves exact 23/60 host and keeps seven acceptance gates false',()=>{
 const descriptor=algL6P010FormalDescriptor();
 assert.equal(descriptor.productBridge.registeredAnimationCount,23);
 assert.equal(descriptor.pages[9].rendererAvailability.kind,'registered');
 assert.equal(Object.keys(descriptor.productBridge.acceptanceEffects).length,7);
 assert(Object.values(descriptor.productBridge.acceptanceEffects).every(v=>v===false));
});
