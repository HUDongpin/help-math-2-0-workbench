import assert from 'node:assert/strict';
import test from 'node:test';
import {algL6P025FormalDescriptor} from '../lib/alg-l06-p025-formal-admission-v1.server';
import {algL6P024FormalDescriptor} from '../lib/alg-l06-p024-formal-admission-v1.server';
import {SOURCE_ROOT,ID} from '../../../lib/alg-l06-p025-admission-semantics-v1.mjs';
import {localOnlyAnimationModuleRegistration}
 from '@helpmath/demos/local-only-animation-registry-metadata';

const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_SOURCE_ROOT:SOURCE_ROOT,
 HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'});
delete env.VERCEL;delete env.VERCEL_ENV;

test('P025 formal reader rejects production and unrelated source or origin',()=>{
 for(const [key,value] of Object.entries({NODE_ENV:'production',VERCEL:'1',
  HELP_MATH_G678_SOURCE_ROOT:'/tmp',HELP_MATH_G678_LOCAL_PREVIEW:'0',
  HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0'})){
  const old=env[key];env[key]=value;
  try{assert.throws(()=>algL6P025FormalDescriptor(),/P025_FORMAL_LOCAL_ONLY/);}
  finally{if(old===undefined)delete env[key];else env[key]=old;}
 }
});

test('P025 requires its own common proof and actual registry before projecting VB15',()=>{
 if(!localOnlyAnimationModuleRegistration(ID)){
  assert.throws(()=>algL6P025FormalDescriptor(),/one exact own proof/);return;
 }
 const before=algL6P024FormalDescriptor(),after=algL6P025FormalDescriptor();
 assert.equal(before.productBridge.registeredAnimationCount,35);
 assert.equal(after.productBridge.registeredAnimationCount,36);
 assert.equal(before.glossary.length,38);assert.equal(after.glossary.length,39);
 for(let i=0;i<60;i++)if(i!==24)assert.deepEqual(after.pages[i],before.pages[i]);
 const page=after.pages[24];
 assert.equal(page.animationId,ID);assert.equal(page.globalPageOrdinal,25);
 assert.equal(page.sectionCode,'VB');assert.equal(page.sectionPageOrdinal,15);
 assert.deepEqual(page.rendererAvailability.kind==='registered'?
  page.rendererAvailability.runtimeQuery:null,
  {frameDomain:'sprite-21',language:'fixed-en',scenario:'source-static-frame',seed:'0'});
 assert.deepEqual(after.glossary.slice(0,38),before.glossary);
 assert.deepEqual(after.glossary.slice(38).map(x=>[x.id,x.sourceKeyAttribute]),
  [['independent-variable','Independent variable']]);
 assert(Object.values(after.productBridge.acceptanceEffects).every(x=>x===false));
});
