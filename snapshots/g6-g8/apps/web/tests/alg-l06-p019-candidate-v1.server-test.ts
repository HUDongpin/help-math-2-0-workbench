import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P018FormalDescriptor} from '../lib/alg-l06-p018-formal-admission-v1.server';
import {algL6P019CandidateDescriptor} from '../lib/alg-l06-p019-candidate-v1.server';

const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',
 HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',
 HELP_MATH_G678_SOURCE_ROOT:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'});
delete env.VERCEL;delete env.VERCEL_ENV;

test('P019 local candidate projects only VB9 and two exact dictionary entries',()=>{
 if(localOnlyAnimationModuleRegistration('shared-alg001-l06-p019')){
  assert.throws(()=>algL6P019CandidateDescriptor(),/P019_CANDIDATE_INVALID/);
  return;
 }
 const base=algL6P018FormalDescriptor(),candidate=algL6P019CandidateDescriptor();
 assert.equal(registeredLocalOnlyAnimationKeys.length,506);
 assert.equal(base.productBridge.registeredAnimationCount,29);
 assert.equal(candidate.productBridge.registeredAnimationCount,30);
 assert.equal(candidate.pages.length,60);
 for(let index=0;index<60;index++)if(index!==18)
  assert.deepEqual(candidate.pages[index],base.pages[index]);
 assert.equal(candidate.pages[18].rendererAvailability.kind,'registered');
 assert.equal(candidate.pages[18].source.sourceOccurrence,19);
 assert.equal(candidate.pages[18].sectionCode,'VB');
 assert.equal(candidate.pages[18].sectionPageOrdinal,9);
 assert.deepEqual(candidate.productBridge.selectedAnimationIds.filter(
  id=>id!=='shared-alg001-l06-p019'),base.productBridge.selectedAnimationIds);
 assert.equal(candidate.pages[18].presentation?.pageInteractionCompanionTargetIdSuffix,
  'p019-source-readable');
 assert.deepEqual(candidate.glossary.slice(0,30),base.glossary);
 assert.equal(candidate.glossary.length,32);
 assert.deepEqual(candidate.glossary.slice(30).map(entry=>[entry.id,entry.sourceKeyAttribute]),
  [['function-table','Function table'],['pair','Pair']]);
 const crosswalk=JSON.parse(readFileSync(new URL(
  '../../../output/alg-l06-p019-glossary-audit-v1/six-term-crosswalk-v1.json',import.meta.url),'utf8'));
 for(const entry of candidate.glossary.slice(30)){
  const source=crosswalk.entries.find((row:{dictionary:{id:string}})=>row.dictionary.id===entry.id);
  assert.deepEqual(entry.labels,source.dictionary.labels);
  assert.deepEqual(entry.definitions,source.dictionary.definitions);
  assert.deepEqual(entry.source,source.dictionary.source);
 }
 for(const [id,key] of [['function-table','Function table'],['input','Input'],['pair','Pair'],['table','Table'],['output','Output'],['function','Function']]){
  const matches=candidate.glossary.filter(entry=>entry.id===id);
  assert.equal(matches.length,1);
  assert.equal(matches[0].sourceKeyAttribute,key);
  assert(matches[0].definitions.en.length>0&&matches[0].definitions.es.length>0);
 }
 assert(Object.values(candidate.productBridge.acceptanceEffects).every(value=>value===false));
});

test('P019 candidate rejects production, wrong source, nonloopback and preview disable',()=>{
 for(const [key,value] of Object.entries({NODE_ENV:'production',VERCEL:'1',
  HELP_MATH_G678_SOURCE_ROOT:'/tmp',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0',
  HELP_MATH_G678_LOCAL_PREVIEW:'0'})){
  const saved=env[key];env[key]=value;
  try{assert.throws(()=>algL6P019CandidateDescriptor(),/P019_CANDIDATE_INVALID/);}
  finally{if(saved===undefined)delete env[key];else env[key]=saved;}
 }
});
