import assert from 'node:assert/strict';
import test from 'node:test';
import {algL6P013FormalDescriptor} from '../lib/alg-l06-p013-formal-admission-v1.server';
import {algL6P014FormalDescriptor} from '../lib/alg-l06-p014-formal-admission-v1.server';
import {algL6P014CandidateDescriptor} from '../lib/alg-l06-p014-candidate-v1.server';
import {localOnlyAnimationModuleRegistration}
  from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin} from '../../../lib/g678-admission-proof.mjs';
import {ID,PROOF_PATH} from '../../../lib/alg-l06-p014-admission-semantics-v1.mjs';
import {getWorkspaceRoot} from '../lib/catalog';
import {G678_ADMISSION_INDEX} from '../lib/g678-admission-activation';

const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',
  HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',
  HELP_MATH_G678_SOURCE_ROOT:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'});
delete env.VERCEL;delete env.VERCEL_ENV;

test('P014 candidate is usable only before exact formal admission',()=>{
  const index=readJsonPin(getWorkspaceRoot(),G678_ADMISSION_INDEX);
  const pinned=index.pages.filter((page:{animationId:string})=>page.animationId===ID);
  const metadata=localOnlyAnimationModuleRegistration(ID);
  const base=algL6P013FormalDescriptor();
  assert.equal(base.productBridge.registeredAnimationCount,24);
  if(pinned.length!==0||metadata){
    assert.equal(pinned.length,1,'one exact P014 active-index proof');
    assert.equal(pinned[0].proof.path,PROOF_PATH);
    assert(metadata,'P014 registry metadata must accompany the active proof');
    assert.throws(()=>algL6P014CandidateDescriptor(),/P014_CANDIDATE_INVALID/u);
    const formal=algL6P014FormalDescriptor();
    assert.equal(formal.productBridge.registeredAnimationCount,25);
    assert.equal(formal.pages[13].rendererAvailability.kind,'registered');
    assert(Object.values(formal.productBridge.acceptanceEffects).every(value=>value===false));
    return;
  }
  const candidate=algL6P014CandidateDescriptor();
  assert.equal(candidate.productBridge.registeredAnimationCount,25);
  assert.equal(candidate.pages.length,60);
  assert.equal(metadata,undefined);
  for(let index=0;index<60;index++)if(index!==13)
    assert.deepEqual(candidate.pages[index],base.pages[index]);
  const page=candidate.pages[13];
  assert.equal(page.source.assetId,
    'swf-aed0f7755d4f691cefcc28c815acc6b9d083fdfaae88ff385f22d3b32ba07603');
  assert.equal(page.rendererAvailability.kind,'registered');
  assert.equal(page.presentation?.pageInteractionCompanionTargetIdSuffix,'p014-source-readable');
  assert.deepEqual(candidate.glossary,base.glossary);
  assert.equal(candidate.glossary.filter(entry=>entry.id==='input').length,1);
  assert.equal(candidate.glossary.filter(entry=>entry.id==='output').length,1);
  assert(Object.values(candidate.productBridge.acceptanceEffects).every(value=>value===false));
});

test('candidate reader rejects production, other source roots and non-loopback preview',()=>{
  const saved={...env};
  for(const [key,value] of Object.entries({NODE_ENV:'production',VERCEL:'1',
    HELP_MATH_G678_SOURCE_ROOT:'/tmp',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0'})){
    env[key]=value;assert.throws(()=>algL6P014CandidateDescriptor(),/P014_CANDIDATE_INVALID/);
    if(saved[key]===undefined)delete env[key];else env[key]=saved[key];
  }
});
