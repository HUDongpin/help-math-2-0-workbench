import assert from 'node:assert/strict';
import test from 'node:test';
import {assertImmutablePageEvidence,prepareAdmissionCandidate} from './g678-admission-candidate-v4.mjs';

const activation={path:'apps/web/lib/g678-admission-activation.ts',bytes:1,sha256:'0'.repeat(64)};
const immutable={...activation,path:'packages/demos/src/example.ts'};
function input(){return {packet:{integrity:{files:[immutable]},entry:{artifacts:{module:immutable,timeline:{...immutable,path:'timeline.json'},runtime:{...immutable,path:'runtime.js'}}},freezeManifest:immutable},implementationFiles:[immutable]};}

test('reject mutable activation from every fixed page evidence input',()=>{
 for(const location of ['integrity','entry','freeze','implementation']){
  const options=input();
  if(location==='integrity')options.packet.integrity.files.push(activation);
  if(location==='entry')options.packet.entry.artifacts.module=activation;
  if(location==='freeze')options.packet.freezeManifest=activation;
  if(location==='implementation')options.implementationFiles.push(activation);
  assert.throws(()=>assertImmutablePageEvidence(options),/mutable admission activation/,location);
 }
});
test('reject before registration preflight, file reads or candidate creation',async()=>{
 const options=input();options.implementationFiles.push(activation);
 await assert.rejects(prepareAdmissionCandidate(options),/mutable admission activation/);
});
test('immutable page inputs pass without editing browser stability inputs',()=>{
 const options={...input(),browserStabilityInputs:[activation]};
 const before=structuredClone(options);
 assert.doesNotThrow(()=>assertImmutablePageEvidence(options));assert.deepEqual(options,before);
});
