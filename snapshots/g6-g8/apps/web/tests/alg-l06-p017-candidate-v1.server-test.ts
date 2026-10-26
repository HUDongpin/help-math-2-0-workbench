import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {localOnlyAnimationModuleRegistration}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P016FormalDescriptor} from '../lib/alg-l06-p016-formal-admission-v1.server';
import {algL6P017CandidateDescriptor} from '../lib/alg-l06-p017-candidate-v1.server';

const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',
 HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',
 HELP_MATH_G678_SOURCE_ROOT:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'});
delete env.VERCEL;delete env.VERCEL_ENV;

test('P017 adds exactly VB7 and three source-bound glossary definitions',()=>{
 if(localOnlyAnimationModuleRegistration('shared-alg001-l06-p017')){
  assert.throws(()=>algL6P017CandidateDescriptor(),/P017_CANDIDATE_INVALID/);
  return;
 }
 const base=algL6P016FormalDescriptor(),candidate=algL6P017CandidateDescriptor();
 assert.equal(base.productBridge.registeredAnimationCount,27);
 assert.equal(candidate.productBridge.registeredAnimationCount,28);
 assert.equal(candidate.pages.length,60);
 for(let index=0;index<60;index++)if(index!==16)
  assert.deepEqual(candidate.pages[index],base.pages[index]);
 assert.equal(candidate.pages[16].rendererAvailability.kind,'registered');
 assert.equal(candidate.pages[16].source.sourceOccurrence,17);
 assert.deepEqual(candidate.productBridge.selectedAnimationIds.filter(
  id=>id!=='shared-alg001-l06-p017'),base.productBridge.selectedAnimationIds);
 assert.equal(candidate.pages[16].presentation?.pageInteractionCompanionTargetIdSuffix,
  'p017-source-readable');
 assert.deepEqual(candidate.glossary.slice(0,base.glossary.length),base.glossary);
 assert.equal(base.glossary.length,24);
 assert.equal(candidate.glossary.length,27);
 assert.deepEqual(candidate.glossary.slice(24).map(entry=>[entry.id,entry.sourceKeyAttribute]),
  [['sentence','Sentence'],['output-variable','Output variable'],
   ['input-variable','Input variable']]);
 const crosswalk=JSON.parse(readFileSync(new URL('../../../output/alg-l06-p017-glossary-audit-v1/six-term-crosswalk-v1.json',
  import.meta.url),'utf8'));
 for(const entry of candidate.glossary.slice(24)){
  const source=crosswalk.entries.find((row:{dictionary:{id:string}})=>row.dictionary.id===entry.id);
  assert.deepEqual(entry.labels,source.dictionary.labels);
  assert.deepEqual(entry.definitions,source.dictionary.definitions);
  assert.deepEqual(entry.source,source.dictionary.source);
 }
 const allSix=[['equation','Equation'],['sentence','Sentence'],
  ['function','Function'],['rule','Rule'],['output-variable','Output variable'],
  ['input-variable','Input variable']];
 for(const [id,key] of allSix){
  const rows=candidate.glossary.filter(entry=>entry.id===id);
  assert.equal(rows.length,1);
  assert.equal(rows[0].sourceKeyAttribute,key);
  assert(rows[0].definitions.en.length>0&&rows[0].definitions.es.length>0);
 }
 assert.equal(candidate.glossary.filter(entry=>entry.id==='input-variable').length,1);
 assert.equal(candidate.glossary.filter(entry=>entry.id==='output-variable').length,1);
 assert(Object.values(candidate.productBridge.acceptanceEffects).every(value=>value===false));
});

test('P017 candidate rejects production, source-root drift and nonloopback binding',()=>{
 for(const [key,value] of Object.entries({NODE_ENV:'production',VERCEL:'1',
  HELP_MATH_G678_SOURCE_ROOT:'/tmp',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0',
  HELP_MATH_G678_LOCAL_PREVIEW:'0'})){
  const saved=env[key];env[key]=value;
  try{assert.throws(()=>algL6P017CandidateDescriptor(),/P017_CANDIDATE_INVALID/);}
  finally{if(saved===undefined)delete env[key];else env[key]=saved;}
 }
});
