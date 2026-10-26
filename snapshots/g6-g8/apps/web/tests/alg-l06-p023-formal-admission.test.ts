import assert from 'node:assert/strict';
import test from 'node:test';
import {algL6P023FormalDescriptor} from '../lib/alg-l06-p023-formal-admission-v1.server';
import {algL6P022FormalDescriptor} from '../lib/alg-l06-p022-formal-admission-v1.server';
import {SOURCE_ROOT,ID} from '../../../lib/alg-l06-p023-admission-semantics-v1.mjs';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';

const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_SOURCE_ROOT:SOURCE_ROOT,
 HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'});
delete env.VERCEL;delete env.VERCEL_ENV;
test('P023 formal reader rejects production or unrelated source/origin first',()=>{
 for(const [key,value] of Object.entries({NODE_ENV:'production',VERCEL:'1',
  HELP_MATH_G678_SOURCE_ROOT:'/tmp',HELP_MATH_G678_LOCAL_PREVIEW:'0',
  HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0'})){
  const old=env[key];env[key]=value;
  try{assert.throws(()=>algL6P023FormalDescriptor(),/P023_FORMAL_LOCAL_ONLY/);}
  finally{if(old===undefined)delete env[key];else env[key]=old;}
 }
});
test('P023 formal reader fails closed before registration, then projects only VB13',()=>{
 if(!localOnlyAnimationModuleRegistration(ID)){
  assert.throws(()=>algL6P023FormalDescriptor(),/one exact own proof/);return;
 }
 const before=algL6P022FormalDescriptor(),after=algL6P023FormalDescriptor();
 assert.equal(before.productBridge.registeredAnimationCount,33);
 assert.equal(after.productBridge.registeredAnimationCount,34);
 for(let i=0;i<60;i++)if(i!==22)assert.deepEqual(after.pages[i],before.pages[i]);
 const page=after.pages[22];
 assert.equal(page.animationId,ID);assert.equal(page.globalPageOrdinal,23);
 assert.equal(page.sectionPageOrdinal,13);
 assert.deepEqual(page.rendererAvailability.kind==='registered'?
  page.rendererAvailability.runtimeQuery:null,
  {frameDomain:'sprite-38',language:'fixed-en',scenario:'source-static-frame',seed:'0'});
 assert.deepEqual(after.glossary.slice(0,36),before.glossary);
 assert.deepEqual(after.glossary.slice(36).map(x=>[x.id,x.sourceKeyAttribute]),
  [['domain','Domain']]);
 assert.equal(after.glossary.length,37);
 assert(Object.values(after.productBridge.acceptanceEffects).every(x=>x===false));
});
