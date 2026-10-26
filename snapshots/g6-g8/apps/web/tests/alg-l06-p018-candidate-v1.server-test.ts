import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P017FormalDescriptor} from '../lib/alg-l06-p017-formal-admission-v1.server';
import {algL6P018CandidateDescriptor} from '../lib/alg-l06-p018-candidate-v1.server';

const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',
 HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',
 HELP_MATH_G678_SOURCE_ROOT:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'});
delete env.VERCEL;delete env.VERCEL_ENV;

test('P018 local candidate projects only VB8 and three exact dictionary entries',()=>{
 if(localOnlyAnimationModuleRegistration('shared-alg001-l06-p018')){
  assert.throws(()=>algL6P018CandidateDescriptor(),/P018_CANDIDATE_INVALID/);
  return;
 }
 const base=algL6P017FormalDescriptor(),candidate=algL6P018CandidateDescriptor();
 assert.equal(registeredLocalOnlyAnimationKeys.length,505);
 assert.equal(base.productBridge.registeredAnimationCount,28);
 assert.equal(candidate.productBridge.registeredAnimationCount,29);
 assert.equal(candidate.pages.length,60);
 for(let index=0;index<60;index++)if(index!==17)
  assert.deepEqual(candidate.pages[index],base.pages[index]);
 assert.equal(candidate.pages[17].rendererAvailability.kind,'registered');
 assert.equal(candidate.pages[17].source.sourceOccurrence,18);
 assert.equal(candidate.pages[17].sectionCode,'VB');
 assert.equal(candidate.pages[17].sectionPageOrdinal,8);
 assert.deepEqual(candidate.productBridge.selectedAnimationIds.filter(
  id=>id!=='shared-alg001-l06-p018'),base.productBridge.selectedAnimationIds);
 assert.equal(candidate.pages[17].presentation?.pageInteractionCompanionTargetIdSuffix,
  'p018-source-readable');
 assert.deepEqual(candidate.glossary.slice(0,27),base.glossary);
 assert.equal(candidate.glossary.length,30);
 assert.deepEqual(candidate.glossary.slice(27).map(entry=>[entry.id,entry.sourceKeyAttribute]),
  [['evaluate','Evaluate'],['substitute','Substitute'],['result','Result']]);
 const crosswalk=JSON.parse(readFileSync(new URL(
  '../../../output/alg-l06-p018-glossary-audit-v1/five-term-crosswalk-v1.json',import.meta.url),'utf8'));
 for(const entry of candidate.glossary.slice(27)){
  const source=crosswalk.entries.find((row:{dictionary:{id:string}})=>row.dictionary.id===entry.id);
  assert.deepEqual(entry.labels,source.dictionary.labels);
  assert.deepEqual(entry.definitions,source.dictionary.definitions);
  assert.deepEqual(entry.source,source.dictionary.source);
 }
 for(const [id,key] of [['evaluate','Evaluate'],['input-variable','Input variable'],
  ['substitute','Substitute'],['function','Function'],['result','Result']]){
  const matches=candidate.glossary.filter(entry=>entry.id===id);
  assert.equal(matches.length,1);
  assert.equal(matches[0].sourceKeyAttribute,key);
  assert(matches[0].definitions.en.length>0&&matches[0].definitions.es.length>0);
 }
 assert(Object.values(candidate.productBridge.acceptanceEffects).every(value=>value===false));
});

test('P018 candidate rejects production, wrong source, nonloopback and preview disable',()=>{
 for(const [key,value] of Object.entries({NODE_ENV:'production',VERCEL:'1',
  HELP_MATH_G678_SOURCE_ROOT:'/tmp',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0',
  HELP_MATH_G678_LOCAL_PREVIEW:'0'})){
  const saved=env[key];env[key]=value;
  try{assert.throws(()=>algL6P018CandidateDescriptor(),/P018_CANDIDATE_INVALID/);}
  finally{if(saved===undefined)delete env[key];else env[key]=saved;}
 }
});
