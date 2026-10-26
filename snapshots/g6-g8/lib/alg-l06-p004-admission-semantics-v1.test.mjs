import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildPlan} from '../scripts/prepare-alg-l06-p004-admission-v1.mjs';
import {CALIBRATION,PROOF_PATH,SOURCE_ROOT,readP004CanonicalSource,validateP004AdmissionSemantics,
 CANVAS_SOURCE,NATIVE_TEXT,ARTIFACTS} from './alg-l06-p004-admission-semantics-v1.mjs';
import {pinFile,readJsonPin,readRegistryTransaction} from './g678-admission-proof.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('physical P004 source and bounded Current-JS admission packet stay exact',()=>{
 const prior=process.env.HELP_MATH_G678_SOURCE_ROOT;
 try{
  process.env.HELP_MATH_G678_SOURCE_ROOT=SOURCE_ROOT;
  const source=readP004CanonicalSource(root);
  const registered=readRegistryTransaction(root).registry.calibrations.some(row=>
   row.calibrationId===CALIBRATION);
  const plan=registered?(()=>{
   const proof=readJsonPin(root,pinFile(root,PROOF_PATH));
   return {bound:proof.packet,registration:proof.registration};
  })():buildPlan();
  assert.equal(source.audit.placement.globalOrdinal,4);
  assert.equal(source.glossary.entries.length,7);
  assert.equal(source.saAudit.inputs.separateSa.sha256,plan.bound.optionalSpanishAudio.source.sha256);
  for(const pin of [CANVAS_SOURCE,NATIVE_TEXT,ARTIFACTS.runtime])
   assert(source.localInputs.some(item=>item.path===pin.path&&item.sha256===pin.sha256));
  assert.equal(validateP004AdmissionSemantics(plan.bound,plan.registration),true);
  for(const mutate of [
   packet=>{packet.selectedPages[0].globalPageOrdinal=3;},
   packet=>{packet.selectedPages[0].runtime.frameCount=830;},
   packet=>{packet.continuousSource.initialSeekSamples=0;},
   packet=>{packet.optionalSpanishAudio.localeAutoplay=true;},
   packet=>{packet.acceptanceEffects.audioAccepted=true;},
   packet=>{packet.entry.artifacts.runtime.sha256='0'.repeat(64);},
   packet=>{packet.integrity.files=packet.integrity.files.filter(item=>item.path!==NATIVE_TEXT.path);},
   packet=>{packet.integrity.files.push({path:'packages/demos/private-current-js-registry.json',
    bytes:1,sha256:'0'.repeat(64)});},
   packet=>{packet.canonicalRun={path:'invented',bytes:1,sha256:'0'.repeat(64)};},
  ]){
   const packet=structuredClone(plan.bound);mutate(packet);
   assert.throws(()=>validateP004AdmissionSemantics(packet,plan.registration));
  }
  assert.throws(()=>validateP004AdmissionSemantics(plan.bound,
   {...plan.registration,freezeManifestSha256:'0'.repeat(64)}));
 }finally{
  if(prior===undefined)delete process.env.HELP_MATH_G678_SOURCE_ROOT;
  else process.env.HELP_MATH_G678_SOURCE_ROOT=prior;
 }
});
