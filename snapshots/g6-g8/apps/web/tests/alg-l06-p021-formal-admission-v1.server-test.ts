import assert from 'node:assert/strict';
import test from 'node:test';
import {readJsonPin} from '../../../lib/g678-admission-proof.mjs';
import {ID,PROOF_PATH,SOURCE_ROOT} from '../../../lib/alg-l06-p021-admission-semantics-v1.mjs';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P020FormalDescriptor} from '../lib/alg-l06-p020-formal-admission-v1.server';
import {algL6P021FormalDescriptor} from '../lib/alg-l06-p021-formal-admission-v1.server';
import {getWorkspaceRoot} from '../lib/catalog';
import {G678_ADMISSION_INDEX} from '../lib/g678-admission-activation';

const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_SOURCE_ROOT:SOURCE_ROOT,
 HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'});
delete env.VERCEL;delete env.VERCEL_ENV;

test('P021 formal reader rejects production, wrong source and nonloopback binding',()=>{
 for(const [key,value] of Object.entries({NODE_ENV:'production',VERCEL:'1',
  HELP_MATH_G678_SOURCE_ROOT:'/tmp',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0',
  HELP_MATH_G678_LOCAL_PREVIEW:'0'})){
  const saved=env[key];env[key]=value;
  try{assert.throws(()=>algL6P021FormalDescriptor(),/P021_FORMAL_LOCAL_ONLY/u);}
  finally{if(saved===undefined)delete env[key];else env[key]=saved;}
 }
});

test('P021 formal reader requires its exact active proof and registry membership',()=>{
 const index=readJsonPin(getWorkspaceRoot(),G678_ADMISSION_INDEX);
 const own=index.pages.filter((page:{animationId:string})=>page.animationId===ID);
 const registered=localOnlyAnimationModuleRegistration(ID);
 if(own.length===0&&!registered){
  assert(index.pages.length>=18,'all eighteen predecessor proofs remain active');
  assert(registeredLocalOnlyAnimationKeys.length>=508,'P020 remains registered');
  assert.throws(()=>algL6P021FormalDescriptor(),/P021_FORMAL_EXACT_V1_ADMISSION/u);
  return;
 }
 assert(index.pages.length>=19,'P021 joins the active index');
 assert.equal(own.length,1,'one exact P021 active-index proof');
 assert.equal(own[0].proof.path,PROOF_PATH);
 assert(registered,'registry metadata accompanies active P021 proof');
 assert(registeredLocalOnlyAnimationKeys.length>=509);
 const base=algL6P020FormalDescriptor(),result=algL6P021FormalDescriptor();
 assert.equal(base.productBridge.registeredAnimationCount,31);
 assert.equal(result.productBridge.registeredAnimationCount,32);
 assert.equal(result.pages.length,60);
 for(let index=0;index<60;index++)if(index!==20)
  assert.deepEqual(result.pages[index],base.pages[index]);
 const target=result.pages[20];
 assert.equal(target.rendererAvailability.kind,'registered');
 assert.equal(target.globalPageOrdinal,21);
 assert.equal(target.sectionPageOrdinal,11);
 assert.deepEqual(target.rendererAvailability.kind==='registered'
  ?target.rendererAvailability.runtimeQuery:null,
  {frameDomain:'sprite-43',language:'fixed-en',scenario:'source-static-frame',seed:'0'});
 assert.deepEqual(result.productBridge.selectedAnimationIds.filter(id=>id!==ID),
  base.productBridge.selectedAnimationIds);
 assert.deepEqual(result.glossary.slice(0,32),base.glossary);
 assert.deepEqual(result.glossary.slice(32).map(item=>[item.id,item.sourceKeyAttribute]),
  [['set','Set'],['ordered-pair','Ordered pair']]);
 assert.equal(result.glossary.length,34);
 for(const [id,key] of [['set','Set'],['input','Input'],['ordered-pair','Ordered pair'],
  ['function','Function'],['value','Value'],['output','Output']]){
  const matches=result.glossary.filter(item=>item.id===id);
  assert.equal(matches.length,1);
  assert.equal(matches[0].sourceKeyAttribute,key);
  assert(matches[0].definitions.en.length>0&&matches[0].definitions.es.length>0);
 }
 assert(Object.values(result.productBridge.acceptanceEffects).every(value=>value===false));
 assert.equal(result.course.href,
  '/migration-status/g678-calibration/shared-alg001-l06-p021/continuous-v1');
});
