import assert from 'node:assert/strict';
import test from 'node:test';
import {readJsonPin} from '../../../lib/g678-admission-proof.mjs';
import {ID,PROOF_PATH,SOURCE_ROOT} from '../../../lib/alg-l06-p020-admission-semantics-v2.mjs';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P020FormalDescriptor} from '../lib/alg-l06-p020-formal-admission-v1.server';
import {getWorkspaceRoot} from '../lib/catalog';
import {G678_ADMISSION_INDEX} from '../lib/g678-admission-activation';

const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_SOURCE_ROOT:SOURCE_ROOT,
 HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'});
delete env.VERCEL;delete env.VERCEL_ENV;

test('P020 formal reader denies production, wrong source root and nonloopback',()=>{
 for(const [key,value] of Object.entries({NODE_ENV:'production',VERCEL:'1',
  HELP_MATH_G678_SOURCE_ROOT:'/tmp',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0'})){
  const saved=env[key];env[key]=value;
  try{assert.throws(()=>algL6P020FormalDescriptor(),/P020_FORMAL_LOCAL_ONLY/u);}
  finally{if(saved===undefined)delete env[key];else env[key]=saved;}
 }
});

test('P020 formal reader requires its exact active proof and physical registry metadata',()=>{
 const index=readJsonPin(getWorkspaceRoot(),G678_ADMISSION_INDEX);
 const own=index.pages.filter((page:{animationId:string})=>page.animationId===ID);
 const registered=localOnlyAnimationModuleRegistration(ID);
 if(own.length===0&&!registered){
  assert(index.pages.length>=17,'P019 predecessor proof remains active');
  assert(registeredLocalOnlyAnimationKeys.length>=507,'P020 is unregistered');
  assert.throws(()=>algL6P020FormalDescriptor(),/P020_FORMAL_EXACT_V1_ADMISSION/u);
  return;
 }
 assert(index.pages.length>=18,'P020 active proof joins the predecessor index');
 assert.equal(own.length,1,'one exact P020 active-index proof');
 assert.equal(own[0].proof.path,PROOF_PATH);
 assert(registered,'registry metadata must accompany active proof');
 assert(registeredLocalOnlyAnimationKeys.length>=508);
 const result=algL6P020FormalDescriptor();
 assert.equal(result.productBridge.registeredAnimationCount,31);
 assert.equal(result.pages.filter(page=>page.rendererAvailability.kind==='registered').length,31);
 assert.equal(result.pages.length,60);
 assert.equal(result.pages[19].rendererAvailability.kind,'registered');
 assert.equal(result.glossary.length,32);
 assert.deepEqual(result.glossary.filter(row=>['Input','Function','Output'].includes(
  row.sourceKeyAttribute)).map(row=>row.id).sort(),['function','input','output']);
 assert(Object.values(result.productBridge.acceptanceEffects).every(value=>value===false));
});
