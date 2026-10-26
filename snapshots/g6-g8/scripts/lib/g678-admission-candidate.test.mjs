import assert from 'node:assert/strict';
import {test,after} from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readJsonPin,readRegistryTransaction} from '../../lib/g678-admission-proof.mjs';
import {prepareAdmissionCandidate} from './g678-admission-candidate.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const activation=fs.readFileSync(path.join(root,'apps/web/lib/g678-admission-activation.ts'),'utf8');
const index=readJsonPin(root,JSON.parse(activation.slice(activation.indexOf('=')+1,activation.lastIndexOf(' as const;'))));
const original=readJsonPin(root,index.pages[2].proof);
const output=`work/g678-workflow/candidates/roundtrip-${process.pid}.json`;
after(()=>fs.rmSync(path.join(root,output),{force:true}));
test('real next-page producer and common reader agree before registry mutation',()=>{
 const before=pinFile(root,'packages/demos/private-current-js-registry.json');
 const transaction=readRegistryTransaction(root);
 transaction.registry.calibrations=transaction.registry.calibrations.filter(c=>c.calibrationId!==original.registration.calibrationId);
 // This fixture models P010 before registration using its real admitted product.
 const packet=structuredClone(original.packet);
 const implementationFiles=original.legacyInputs.filter(p=>!p.path.includes('registry.local-only.'));
 let called=false;
 const result=prepareAdmissionCandidate({root,output,animationId:original.animationId,packet,registration:original.registration,
  implementationFiles,external:original.external,hostPin:index.host,transaction,
  validateSemantics:(readBack,registration)=>{called=true;assert.deepEqual(readBack,packet);assert.deepEqual(registration,original.registration);}});
 assert(called);assert.equal(result.registered,false);
 assert.deepEqual(pinFile(root,'packages/demos/private-current-js-registry.json'),before);
 assert.deepEqual(index.pages.map(p=>pinFile(root,p.proof.path)),index.pages.map(p=>p.proof));
});
