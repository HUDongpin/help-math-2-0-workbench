import assert from 'node:assert/strict';import test from 'node:test';
import {algL6P021FormalDescriptor} from '../lib/alg-l06-p021-formal-admission-v1.server';
import {algL6P022FormalDescriptor} from '../lib/alg-l06-p022-formal-admission-v1.server';
import {readP022Resource} from '../lib/alg-l06-p022-resources-v1.server';
import {SOURCE_ROOT,ID} from '../../../lib/alg-l06-p022-admission-semantics-v1.mjs';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys} from '@helpmath/demos/local-only-animation-registry-metadata';
const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_SOURCE_ROOT:SOURCE_ROOT,HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'});delete env.VERCEL;delete env.VERCEL_ENV;
test('P022 rejects production and unrelated source/origin before reading proof',()=>{
 for(const [key,value] of Object.entries({NODE_ENV:'production',VERCEL:'1',HELP_MATH_G678_SOURCE_ROOT:'/tmp',HELP_MATH_G678_LOCAL_PREVIEW:'0',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0'})){
  const old=env[key];env[key]=value;try{assert.throws(()=>algL6P022FormalDescriptor(),/P022_FORMAL_LOCAL_ONLY/);}finally{if(old===undefined)delete env[key];else env[key]=old;}
 }
});
test('P022 formal projection preserves 59 old pages, exact six dictionaries and all downstream gates',()=>{
 if(!localOnlyAnimationModuleRegistration(ID)){assert.throws(()=>algL6P022FormalDescriptor(),/one exact own proof/);return;}
 assert(registeredLocalOnlyAnimationKeys.length>=510);
 const before=algL6P021FormalDescriptor(),after=algL6P022FormalDescriptor();
 assert.equal(before.productBridge.registeredAnimationCount,32);assert.equal(after.productBridge.registeredAnimationCount,33);
 for(let i=0;i<60;i++)if(i!==21)assert.deepEqual(after.pages[i],before.pages[i]);
 const page=after.pages[21];assert.equal(page.globalPageOrdinal,22);assert.equal(page.sectionPageOrdinal,12);assert.equal(page.animationId,ID);
 assert.deepEqual(page.rendererAvailability.kind==='registered'?page.rendererAvailability.runtimeQuery:null,{frameDomain:'sprite-67',language:'fixed-en',scenario:'source-static-frame',seed:'0'});
 assert.deepEqual(after.glossary.slice(0,34),before.glossary);
 assert.deepEqual(after.glossary.slice(34).map(x=>[x.id,x.sourceKeyAttribute]),[['graph','Graph'],['representation','Representation']]);
 assert.equal(after.glossary.length,36);for(const key of ['Graph','Representation','Function','Ordered pair','Input','Output']){const rows=after.glossary.filter(x=>x.sourceKeyAttribute===key);assert.equal(rows.length,1);assert(rows[0].definitions.en.length&&rows[0].definitions.es.length);}
 assert(Object.values(after.productBridge.acceptanceEffects).every(x=>x===false));assert.equal(after.course.href,`/migration-status/g678-calibration/${ID}/continuous-v1`);
});
test('P022 registered resource reader retains exact two audio buffers',async()=>{
 for(const [key,bytes] of [['main-1',53820],['main-2',113230],['optional-spanish-audio-v1',252000]] as const)assert.equal((await readP022Resource(key)).length,bytes);
});
