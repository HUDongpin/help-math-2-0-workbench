import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildPlan} from '../scripts/prepare-alg-l06-p003-admission-v1.mjs';
import {readRegistryTransaction,readJsonPin,pinFile,verifyAdmission} from './g678-admission-proof.mjs';
import {SOURCE_ROOT,validateP003AdmissionSemantics,readP003CanonicalSource} from './alg-l06-p003-admission-semantics-v1.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('actual canonical artifacts and formal proof agree; semantic drift rejects',()=>{
 const prior=process.env.HELP_MATH_G678_SOURCE_ROOT;
 try{
  process.env.HELP_MATH_G678_SOURCE_ROOT=SOURCE_ROOT;
  const registered=readRegistryTransaction(root).registry.calibrations.some(row=>
   row.calibrationId==='g678-alg-l06-p003-continuous-20260928-v1');
  const plan=registered?(()=>{
   const state=verifyAdmission(root,pinFile(root,'catalog/g678-admission-v1/index-v18.json'));
   return{index:state.index,proof:readJsonPin(root,state.index.pages.find(row=>
    row.animationId==='shared-alg001-l06-p003').proof)};
  })():buildPlan(root);
  const {proof,index}=plan,source=readP003CanonicalSource(root);
  assert(validateP003AdmissionSemantics(proof.packet,proof.registration));
  assert.equal(source.run.member.sha256,proof.packet.canonicalMember.sha256);
  assert.equal(index.pages.length,7);
  for(const mutate of [p=>{p.continuousSource.twoRunPlayback=true;},
   p=>{p.continuousSource.initialSeekSamples=0;},p=>{p.optionalSpanishAudio.localeAutoplay=true;},
   p=>{p.optionalSpanishAudio.mainStreamSpliced=true;},p=>{p.acceptanceEffects.audioAccepted=true;},
   p=>{p.selectedPages[0].globalPageOrdinal=4;},p=>{p.selectedPages[0].runtime.hostPlaybackCompletion=true;},
   p=>{p.entry.artifacts.runtime.sha256='0'.repeat(64);},p=>{p.canonicalRun.sha256='0'.repeat(64);}]){
   const packet=structuredClone(proof.packet);mutate(packet);
   assert.throws(()=>validateP003AdmissionSemantics(packet,proof.registration));
  }
  assert.throws(()=>validateP003AdmissionSemantics(proof.packet,
   {...proof.registration,freezeManifestSha256:'0'.repeat(64)}));
 }finally{if(prior===undefined)delete process.env.HELP_MATH_G678_SOURCE_ROOT;
  else process.env.HELP_MATH_G678_SOURCE_ROOT=prior;}
});
