import assert from 'node:assert/strict';
import test from 'node:test';
import {readJsonPin} from '../../../lib/g678-admission-proof.mjs';
import {ID,PROOF_PATH,SOURCE_ROOT} from '../../../lib/alg-l06-p016-admission-semantics-v1.mjs';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P016FormalDescriptor} from '../lib/alg-l06-p016-formal-admission-v1.server';
import {getWorkspaceRoot} from '../lib/catalog';
import {G678_ADMISSION_INDEX} from '../lib/g678-admission-activation';

const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_SOURCE_ROOT:SOURCE_ROOT,
 HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'});
delete env.VERCEL;delete env.VERCEL_ENV;

test('formal reader rejects production, wrong physical source and nonloopback binding',()=>{
 for(const [key,value] of Object.entries({NODE_ENV:'production',VERCEL:'1',
  HELP_MATH_G678_SOURCE_ROOT:'/tmp',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0'})){
  const saved=env[key];env[key]=value;
  try{assert.throws(()=>algL6P016FormalDescriptor(),/P016_FORMAL_LOCAL_ONLY/u);}
  finally{if(saved===undefined)delete env[key];else env[key]=saved;}
 }
});

test('formal reader requires active exact proof and physical 504-page registry',()=>{
 const index=readJsonPin(getWorkspaceRoot(),G678_ADMISSION_INDEX);
 const pinned=index.pages.filter((page:{animationId:string})=>page.animationId===ID);
 const registered=localOnlyAnimationModuleRegistration(ID);
 if(pinned.length===0&&!registered){
  assert.equal(index.pages.length,13,'thirteen predecessor proofs remain active');
  assert.equal(registeredLocalOnlyAnimationKeys.length,503,'P016 is still unregistered');
  assert.throws(()=>algL6P016FormalDescriptor(),/P016_FORMAL_EXACT_V1_ADMISSION/u);
  return;
 }
 assert.equal(index.pages.length,14,'fourteen active proofs after actual registration');
 assert.equal(pinned.length,1,'one exact P016 active-index proof');
 assert.equal(pinned[0].proof.path,PROOF_PATH);
 assert(registered,'P016 registry metadata must accompany the active proof');
 assert.equal(registeredLocalOnlyAnimationKeys.length,504);
 const result=algL6P016FormalDescriptor();
 assert.equal(result.productBridge.registeredAnimationCount,27);
 assert.equal(result.pages.filter(page=>page.rendererAvailability.kind==='registered').length,27);
 assert.equal(result.pages.length,60);
 assert.equal(result.pages[15].rendererAvailability.kind,'registered');
 assert(Object.values(result.productBridge.acceptanceEffects).every(value=>value===false));
});
