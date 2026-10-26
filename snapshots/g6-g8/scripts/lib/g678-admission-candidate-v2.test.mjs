import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readJsonPin,readRegistryTransaction,REGISTRY} from '../../lib/g678-admission-proof.mjs';
import {activeIndexPin} from './g678-stable-browser-candidate-v1.mjs';
import {prepareAdmissionCandidate} from './g678-admission-candidate-v2.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
test('next-page preparation checks the real writer then the serialized real reader',async t=>{
 const index=readJsonPin(root,activeIndexPin(root));
 const original=readJsonPin(root,index.pages.find(p=>p.animationId==='shared-alg001-l06-p017').proof);
 const output=`work/g678-workflow/candidates/contract-v2-test-${process.pid}.json`;
 t.after(()=>fs.rmSync(path.join(root,output),{force:true}));
 const before=pinFile(root,REGISTRY),transaction=readRegistryTransaction(root);
 transaction.registry.calibrations=transaction.registry.calibrations.filter(c=>c.calibrationId!==original.registration.calibrationId);
 let called=false;
 const result=await prepareAdmissionCandidate({root,output,animationId:original.animationId,
  packet:original.packet,registration:original.registration,implementationFiles:original.legacyInputs,
  external:original.external,hostPin:index.host,transaction,
  validateSemantics:(packet,registration)=>{called=true;assert.deepEqual(packet,original.packet);assert.deepEqual(registration,original.registration);}});
 assert(called);assert.equal(result.registered,false);assert.equal(result.registrationPreflight.registered,false);
 assert.equal(result.registrationPreflight.status,'registration-contract-passed');
 assert.deepEqual(pinFile(root,REGISTRY),before);
});
