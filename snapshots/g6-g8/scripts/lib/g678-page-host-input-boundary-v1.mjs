/** New-page producer boundary: current shared-host files belong to the exact
 * verified host version. Historical transition originals never become current. */
import assert from 'node:assert/strict';
import {uniquePins,verifyHostVersion} from '../../lib/g678-admission-proof.mjs';

export function partitionPageHostInputs(inputs,hostFiles){
 assert.deepEqual(uniquePins(inputs),inputs,'unique sorted source inputs');
 assert.deepEqual(uniquePins(hostFiles),hostFiles,'unique sorted host inputs');
 const shared=new Map(hostFiles.map(pin=>[pin.path,pin]));
 const pageOwned=[],hostManaged=[];
 for(const pin of inputs){
  const current=shared.get(pin.path);
  if(current){
   assert.deepEqual(pin,current,'exact current shared-host input '+pin.path);
   hostManaged.push(pin);
  }else pageOwned.push(pin);
 }
 assert.deepEqual(uniquePins([...pageOwned,...hostManaged]),inputs,
  'complete source inputs partition; no ignored input');
 return {pageOwned,hostManaged};
}

export function verifyPageHostInputBoundary(root,hostPin,inputs){
 const host=verifyHostVersion(root,hostPin);
 return {host:hostPin,...partitionPageHostInputs(inputs,host.files)};
}
