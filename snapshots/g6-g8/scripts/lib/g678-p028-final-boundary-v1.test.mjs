import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {readBoundSource,validateEngineeringReceipt} from '../../lib/alg-l06-p028-host-semantics-v1.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile} from '../../lib/g678-admission-proof.mjs';
import {proposeFinal,SUPPORT,VALIDATORS} from '../prepare-alg-l06-p028-admission-v1.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
test('real final packet partitions all current inputs and rejects dropped, duplicated or corrupted host ownership',()=>{
 const prior=process.env.HELP_MATH_G678_SOURCE_ROOT;
 process.env.HELP_MATH_G678_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
 try{
  const receipt=pinFile(root,'output/playwright/alg-l06-p028-candidate-host-v3/engineering-receipt-v1.json');
  const activation=fs.readFileSync(path.join(root,'apps/web/lib/g678-admission-activation.ts'),'utf8');
  const p=activation.includes('index-v95.json')?proposeFinal(receipt,VALIDATORS,SUPPORT):(()=>{
   const proof=JSON.parse(fs.readFileSync(path.join(root,'work/g678-workflow/candidates/shared-alg001-l06-p028-proof-v3.json')));
   const source=readBoundSource(root),engineering=validateEngineeringReceipt(JSON.parse(fs.readFileSync(path.join(root,receipt.path))),root,source);
   VALIDATORS.validatePacket(proof.packet,proof.registration,root,source,receipt,engineering);
   return {bound:proof.packet,registration:proof.registration,source,engineering};
  })();
  const managed=p.bound.hostInputBoundary.files;
  assert.equal(managed.length,5);
  assert(managed.some(pin=>pin.path==='apps/web/next.config.ts'));
  assert(managed.some(pin=>pin.path==='apps/web/proxy.ts'));
  assert(!p.bound.integrity.files.some(pin=>managed.some(shared=>shared.path===pin.path)));
  const validate=packet=>VALIDATORS.validatePacket(packet,p.registration,root,p.source,receipt,p.engineering);
  const dropped=structuredClone(p.bound);dropped.hostInputBoundary.files=dropped.hostInputBoundary.files.filter(pin=>pin.path!=='apps/web/next.config.ts');
  assert.throws(()=>validate(dropped),/final freeze includes source\/browser pin/);
  const duplicate=structuredClone(p.bound);duplicate.integrity.files.push(managed[0]);
  assert.throws(()=>validate(duplicate),/sorted unique|page owns only non-host/);
  const drift=structuredClone(p.bound);drift.hostInputBoundary.files[0].sha256='0'.repeat(64);
  assert.throws(()=>validate(drift),/exact current shared-host input/);
 }finally{if(prior===undefined)delete process.env.HELP_MATH_G678_SOURCE_ROOT;else process.env.HELP_MATH_G678_SOURCE_ROOT=prior;}
});
