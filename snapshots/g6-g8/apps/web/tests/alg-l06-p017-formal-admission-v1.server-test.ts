import assert from 'node:assert/strict';
import test from 'node:test';
import {readJsonPin} from '../../../lib/g678-admission-proof.mjs';
import {ID,PROOF_PATH,SOURCE_ROOT} from '../../../lib/alg-l06-p017-admission-semantics-v1.mjs';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P017FormalDescriptor} from '../lib/alg-l06-p017-formal-admission-v1.server';
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
  try{assert.throws(()=>algL6P017FormalDescriptor(),/P017_FORMAL_LOCAL_ONLY/u);}
  finally{if(saved===undefined)delete env[key];else env[key]=saved;}
 }
});

test('formal reader requires exact P017 proof and physical metadata after successors',()=>{
 const index=readJsonPin(getWorkspaceRoot(),G678_ADMISSION_INDEX);
 const pinned=index.pages.filter((page:{animationId:string})=>page.animationId===ID);
 const registered=localOnlyAnimationModuleRegistration(ID);
 if(pinned.length===0&&!registered){
  assert.equal(index.pages.length,14,'fourteen predecessor proofs remain active');
  assert.equal(registeredLocalOnlyAnimationKeys.length,504,'P017 is still unregistered');
  assert.throws(()=>algL6P017FormalDescriptor(),/P017_FORMAL_EXACT_V1_ADMISSION/u);
  return;
 }
 assert.equal(pinned.length,1,'one exact P017 active-index proof');
 assert.equal(pinned[0].proof.path,PROOF_PATH);
 assert(registered,'P017 registry metadata must accompany the active proof');
 const result=algL6P017FormalDescriptor();
 assert.equal(result.productBridge.registeredAnimationCount,28);
 assert.equal(result.pages.filter(page=>page.rendererAvailability.kind==='registered').length,28);
 assert.equal(result.pages.length,60);
 assert.equal(result.pages[16].rendererAvailability.kind,'registered');
 assert.equal(result.glossary.length,27);
 assert(Object.values(result.productBridge.acceptanceEffects).every(value=>value===false));
});
