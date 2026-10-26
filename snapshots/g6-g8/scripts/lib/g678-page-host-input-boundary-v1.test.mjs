import assert from 'node:assert/strict';
import test from 'node:test';
import {partitionPageHostInputs,verifyPageHostInputBoundary} from './g678-page-host-input-boundary-v1.mjs';
import {pinFile,readJsonPin,uniquePins} from '../../lib/g678-admission-proof.mjs';
const root=process.cwd();
const hostPin=pinFile(root,'catalog/g678-admission-v1/host-v94.json');
const binding=readJsonPin(root,pinFile(root,'output/alg-l06-p028-product-integration-v1/candidate-source-binding-v4.json'));

test('actual current source/host boundary retains every pin and isolates own renderer',()=>{
 const {pageOwned,hostManaged}=verifyPageHostInputBoundary(root,hostPin,binding.files);
 assert.deepEqual(uniquePins([...pageOwned,...hostManaged]),binding.files);
 for(const path of ['apps/web/next.config.ts','apps/web/proxy.ts'])
  assert(hostManaged.some(pin=>pin.path===path));
 assert(pageOwned.some(pin=>pin.path==='packages/demos/src/alg-l06-p028-native-text-v1.tsx'));
});
test('source/host hash drift cannot be treated as historical metadata',()=>{
 const host=readJsonPin(root,hostPin),inputs=structuredClone(binding.files);
 inputs.find(pin=>pin.path==='apps/web/proxy.ts').sha256='0'.repeat(64);
 assert.throws(()=>partitionPageHostInputs(inputs,host.files),/exact current shared-host input/);
});
test('duplicate, ambiguous and unsorted source pins fail closed',()=>{
 const host=readJsonPin(root,hostPin);
 assert.throws(()=>partitionPageHostInputs([...binding.files,binding.files[0]],host.files),/unique sorted source inputs/);
 assert.throws(()=>partitionPageHostInputs([...binding.files].reverse(),host.files),/unique sorted source inputs/);
});
test('a historical original cannot impersonate current shared host bytes',()=>{
 const host=readJsonPin(root,hostPin),inputs=structuredClone(binding.files);
 const transition=host.legacyInputTransitions.find(row=>row.original.path==='apps/web/next.config.ts');
 inputs[inputs.findIndex(pin=>pin.path==='apps/web/next.config.ts')]=transition.original;
 assert.throws(()=>partitionPageHostInputs(inputs,host.files),/exact current shared-host input/);
});
