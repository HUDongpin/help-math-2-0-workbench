import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readJsonPin,readRegistryTransaction,REGISTRY,DISPATCH} from '../../lib/g678-admission-proof.mjs';
import {preflightRegistration} from './g678-registration-preflight-v1.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const registry=readJsonPin(root,pinFile(root,REGISTRY));
const examples=['017','018'].map(p=>registry.calibrations.find(c=>c.entries.some(e=>e.key===`shared-alg001-l06-p${p}`)));

test('both real consumers pass the production writer contract without any mutation',async()=>{
 const before=[REGISTRY,...DISPATCH].map(file=>pinFile(root,file));
 for(const registration of examples) {
  const result=await preflightRegistration({root,fragment:registration,exact:true});
  assert.equal(result.status,'registration-contract-passed');assert.equal(result.registered,true);
 }
 assert.deepEqual([REGISTRY,...DISPATCH].map(file=>pinFile(root,file)),before);
});
test('reject the late runtime path failure before producing a page proof',async()=>{
 const registration=structuredClone(examples[0]);
 registration.entries[0].artifacts.runtime.path='output/noncanonical/canvas-renderer.js';
 await assert.rejects(preflightRegistration({root,fragment:registration,exact:true}),/artifact paths are not canonical/);
});
test('reject declared hash drift instead of letting the writer silently rebind it',async()=>{
 const registration=structuredClone(examples[1]);
 registration.entries[0].artifacts.module.sha256='0'.repeat(64);
 await assert.rejects(preflightRegistration({root,fragment:registration,exact:true}),/exactly what the real writer binds/);
});
test('reject a duplicate animation key in a new calibration',async()=>{
 const transaction=readRegistryTransaction(root),registration=structuredClone(examples[0]);
 registration.calibrationId+='-duplicate';
 await assert.rejects(preflightRegistration({root,fragment:registration,transaction,exact:true}),/duplicate private Current-JS animation key/);
});
